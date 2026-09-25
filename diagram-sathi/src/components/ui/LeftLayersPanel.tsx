import { useDiagramStore } from "../../store/useDiagramStore";
import {
  Database,
  Circle,
  Square,
  Hexagon,
  Diamond,
  ArrowRight,
  LayoutGrid,
  Trash2,
  Plus,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import { generateDiagramFromDescription } from "../../utils/aiService";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { logAiGeneration } from "../../lib/projects";
import { ErLeftPanel } from "./ErLeftPanel";
import { useErDiagramStore } from "../../store/useErDiagramStore";
import {
  getGuestAiCredits,
  decrementGuestAiCredits,
  setPendingClaim,
  saveGuestDiagram,
} from "../../utils/guestStorage";

/**
 * LeftLayersPanel Component
 *
 * This component handles the left sidebar (AI Generation & Layers list).
 * It replaces the older PaneLeftForm as part of the Figma UI transition.
 *
 * Functionalities include:
 * - Smart Suggest logic parsing text to generate diagrams via Gemini AI
 * - Mutable Diagram Type selector
 * - Fast interaction lists of active nodes and edges (the "Layers")
 */
export const LeftLayersPanel = () => {
  const {
    nodes,
    edges,
    projectDescription,
    setProjectDescription,
    isGenerating,
    setIsGenerating,
    applyAIGeneratedDiagram,
    diagramType,
    setDiagramType,
    preferredDiagramType,
    setPreferredDiagramType,
    dfdLevel,
    setDfdLevel,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    saveProject,
    setProjectTitle,
    currentProjectId,
  } = useDiagramStore();

  const currentType = diagramType || preferredDiagramType || "flowchart";
  const { session } = useAuth();
  const navigate = useNavigate();
  const isGuest = !session?.user?.id;
  const [guestCredits, setGuestCredits] = useState<number>(getGuestAiCredits());
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const hasAutoTriggeredRef = useRef(false);

  const handleSmartSuggest = async () => {
    if (!projectDescription.trim()) return;

    if (isGuest) {
      const currentCredits = getGuestAiCredits();
      if (currentCredits <= 0) {
        setIsUpsellOpen(true);
        return;
      }
    }

    setIsGenerating(true);
    setLoadingStep(1);

    const intervalId = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : 1));
    }, 800);

    try {
      const result = await generateDiagramFromDescription(
        projectDescription,
        currentType,
        dfdLevel,
      );

      if (currentType === "er") {
        const erResult = result as { schemas: any[]; relationships: any[] };
        await useErDiagramStore
          .getState()
          .applyAIGeneratedEr(erResult.schemas, erResult.relationships);

        if (session?.user?.id) {
          logAiGeneration(
            session.user.id,
            currentProjectId,
            projectDescription,
            erResult,
          );
        }
      } else {
        const generatedNodes = result.nodes as any[];

        // Auto-heal edges: AI sometimes uses node labels instead of IDs for source/target
        const generatedEdges = result.edges!.map((e, i) => {
          let sourceId = String(e.source || "");
          let targetId = String(e.target || "");

          if (!generatedNodes.find((n) => n.id === sourceId)) {
            const match = generatedNodes.find(
              (n) => n.label?.toLowerCase() === sourceId.toLowerCase(),
            );
            if (match) sourceId = match.id;
          }
          if (!generatedNodes.find((n) => n.id === targetId)) {
            const match = generatedNodes.find(
              (n) => n.label?.toLowerCase() === targetId.toLowerCase(),
            );
            if (match) targetId = match.id;
          }

          return {
            ...e,
            source: sourceId,
            target: targetId,
            id: `ai_edge_${i}_${Math.random().toString(36).substr(2, 4)}`,
          };
        }) as any;

        await applyAIGeneratedDiagram(generatedNodes, generatedEdges);

        // Log the generation to Supabase
        if (session?.user?.id) {
          logAiGeneration(
            session.user.id,
            currentProjectId,
            projectDescription,
            { nodes: generatedNodes, edges: generatedEdges },
          );
        }
      }

      let remainingCredits = guestCredits;
      if (isGuest) {
        remainingCredits = decrementGuestAiCredits();
        setGuestCredits(remainingCredits);
      }

      // Auto-save the generated diagram immediately
      const newTitle =
        projectDescription.slice(0, 30) +
        (projectDescription.length > 30 ? "..." : "");
      setProjectTitle(newTitle);

      if (session?.user?.id) {
        await saveProject(session.user.id);
      } else {
        const erData = currentType === "er" ? useErDiagramStore.getState().getAstData() : undefined;
        saveGuestDiagram({
          title: newTitle,
          diagramType: currentType,
          nodes: useDiagramStore.getState().nodes,
          edges: useDiagramStore.getState().edges,
          mermaidCode: useDiagramStore.getState().mermaidCode,
          direction: useDiagramStore.getState().direction,
          erData,
        });
        toast.success(
          remainingCredits > 0
            ? `Diagram generated! (${remainingCredits} free trial${remainingCredits === 1 ? "" : "s"} left)`
            : "Diagram generated! You've used all 3 free trials. Sign up to unlock more.",
          { icon: "✨" }
        );
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to generate diagram.";
      toast.error(msg);
    } finally {
      clearInterval(intervalId);
      setLoadingStep(0);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Triggers automatically on mount if 'isGenerating' flag was set by another component (like Home)
    if (isGenerating && projectDescription.trim() && !hasAutoTriggeredRef.current) {
      hasAutoTriggeredRef.current = true;
      setIsGenerating(false);
      handleSmartSuggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "cylinder":
        return <Database size={14} />;
      case "circle":
        return <Circle size={14} />;
      case "diamond":
        return <Diamond size={14} />;
      case "hexagon":
        return <Hexagon size={14} />;
      case "rectangle":
      case "square":
      case "parallelogram":
      default:
        return <Square size={14} />;
    }
  };

  const getLoadingText = () => {
    switch (loadingStep) {
      case 1:
        return "🧠 Analyzing architecture...";
      case 2:
        return "📐 Defining nodes...";
      case 3:
        return "🔗 Mapping flow connections...";
      case 4:
        return "✨ Optimizing layout...";
      default:
        return "Generating...";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent shrink-0 select-none overflow-hidden">
      {/* Top: AI Text Area + Diagram Type */}
      <div className="p-4 shrink-0 bg-transparent flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-neutral/50 uppercase tracking-wider mt-1">
          Build with AI
        </h3>

        <textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe your architecture..."
          className="w-full text-xs bg-bg/50 text-neutral border border-border/80 rounded-md p-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20 placeholder:text-neutral/40"
        />

        {/* Diagram Type Toggle (Selectable for Guests, Frozen for Signed-in Projects) */}
        <div className="flex flex-col gap-2">
          <div className="flex text-[10px] rounded-md overflow-hidden border border-border/80 p-0.5 bg-bg/50 divide-x divide-border/70">
            {(["dfd", "flowchart", "er"] as const).map((type) => {
              const isActive = currentType === type;
              return (
                <button
                  key={type}
                  disabled={!isGuest}
                  type="button"
                  tabIndex={isGuest ? 0 : -1}
                  onClick={() => {
                    if (isGuest) {
                      setDiagramType(type);
                      setPreferredDiagramType(type);
                    }
                  }}
                  className={`flex-1 py-1.5 text-center font-medium rounded-xs select-none transition-colors ${
                    isActive
                      ? "bg-primary text-white shadow-sm cursor-default"
                      : isGuest
                        ? "text-neutral/60 hover:text-neutral hover:bg-neutral/10 cursor-pointer"
                        : "text-neutral/30 opacity-35 cursor-not-allowed pointer-events-none"
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-neutral/50 italic px-1">
            {currentType === "flowchart"
              ? "The Step-by-Step Logic Builder. Focus on the sequential 'how-to' of a task."
              : currentType === "er"
                ? "The Data Relationship Mapper. Design database schemas and their connections."
                : "The System Information Map. Focus on the movement and transformation of data."}
          </p>

          {currentType === "dfd" && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1 px-1">
                <span className="text-[10px] font-semibold text-neutral/50 uppercase">
                  DFD Level
                </span>
                <div className="group relative flex items-center">
                  <Info size={12} className="text-neutral/40 cursor-help" />
                  <div className="absolute bottom-full left-8 -translate-x-1/2 mb-1 w-48 p-2 bg-bg/90 backdrop-blur-xl border border-border/80 text-[10px] text-neutral rounded shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    Level 0 shows the system as a whole; Level 1 shows the
                    internal parts.
                  </div>
                </div>
              </div>
              <div className="flex text-[10px] rounded-md overflow-hidden border border-border/80 p-0.5 bg-bg/50 divide-x divide-border/70">
                {[0, 1].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDfdLevel(level)}
                    className={`flex-1 py-1.5 text-center font-medium rounded-xs transition-colors ${
                      dfdLevel === level
                        ? "bg-primary text-white shadow-sm"
                        : "text-neutral/60 hover:text-neutral hover:bg-neutral/10"
                    }`}
                  >
                    LEVEL {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isGuest && (
          <div className="flex items-center justify-between px-2 py-1 bg-input border border-border/60 rounded-md text-[10px]">
            <span className="text-neutral/50 font-medium flex items-center gap-1.5">
              <Sparkles size={11} className="text-primary" /> Free Guest Trial
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                guestCredits > 0
                  ? "bg-primary/15 text-primary"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {guestCredits} / 3 left
            </span>
          </div>
        )}

        <button
          onClick={handleSmartSuggest}
          disabled={isGenerating || !projectDescription.trim()}
          className={`w-full text-xs py-2 rounded-md transition-colors font-medium flex items-center justify-center gap-2 overflow-hidden cursor-pointer ${
            isGuest && guestCredits <= 0
              ? "bg-rose-600/80 hover:bg-rose-600 text-white"
              : "bg-primary hover:bg-primary/80 disabled:bg-primary/20 disabled:text-primary/80 text-white"
          }`}
        >
          <span
            className={`transition-all duration-300 ${isGenerating ? "animate-pulse" : ""}`}
          >
            {isGenerating
              ? getLoadingText()
              : isGuest && guestCredits <= 0
                ? "🔒 Unlock Unlimited AI"
                : "✨ Generate Diagram"}
          </span>
        </button>
      </div>

      <hr className="border-b w-[90%] mx-auto border-border/80" />

      {/* Bottom: Layers or ER Panel */}
      {preferredDiagramType === "er" ? (
        <ErLeftPanel />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid size={12} /> Nodes
              </h3>
              <button
                onClick={() =>
                  addNode({ label: "New Node", type: "rectangle" })
                }
                className="p-1 text-neutral/40 hover:text-primary hover:bg-primary/10 cursor-pointer rounded transition-colors"
                title="Add Node"
              >
                <Plus size={14} />
              </button>
            </div>
            <ul className="space-y-0.5">
              {nodes.map((n) => (
                <li
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md text-xs transition-colors group ${
                    selectedNodeId === n.id
                      ? "bg-primary/20 text-primary"
                      : "text-neutral/70 hover:bg-neutral/10 hover:text-neutral"
                  }`}
                >
                  {getNodeIcon(n.type)}
                  <span className="truncate">{n.label}</span>
                  {selectedNodeId === n.id ? (
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        removeNode(n.id);
                      }}
                      className="ml-auto p-1 text-red-500 hover:bg-red-500/20 rounded cursor-pointer transition-colors"
                      title="Delete Node"
                    >
                      <Trash2 size={12} />
                    </button>
                  ) : (
                    <span className="ml-auto text-[9px] opacity-50 font-mono group-hover:opacity-100 transition-opacity">
                      {n.id}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight size={12} /> Edges
              </h3>
              <button
                onClick={() => {
                  if (nodes.length >= 2) {
                    addEdge({
                      source: nodes[0].id,
                      target: nodes[1].id,
                      label: "New Flow",
                    });
                  }
                }}
                disabled={nodes.length < 2}
                className="p-1 text-neutral/40 hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Add Edge"
              >
                <Plus size={14} />
              </button>
            </div>
            <ul className="space-y-0.5">
              {edges.map((e) => (
                <li
                  key={e.id}
                  onClick={() => setSelectedEdgeId(e.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md text-xs transition-colors group ${
                    selectedEdgeId === e.id
                      ? "bg-primary/20 text-primary"
                      : "text-neutral/70 hover:bg-neutral/10 hover:text-neutral"
                  }`}
                >
                  <ArrowRight size={12} className="shrink-0" />
                  <span className="truncate">
                    {e.label || `${e.source} → ${e.target}`}
                  </span>
                  {selectedEdgeId === e.id && (
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        removeEdge(e.id);
                      }}
                      className="ml-auto p-1 text-red-500 hover:bg-red-500/20 rounded cursor-pointer transition-colors"
                      title="Delete Edge"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Guest AI Limit Upsell Modal */}
      {isUpsellOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-panel border border-border rounded-2xl shadow-2xl w-full max-w-[420px] p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200 mx-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral">Trial Limit Reached</h3>
                  <p className="text-xs text-neutral/50 mt-0.5">3 / 3 Free Guest Generations Used</p>
                </div>
              </div>
              <button
                onClick={() => setIsUpsellOpen(false)}
                className="text-neutral/40 hover:text-neutral p-1 rounded-md transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral/70 leading-relaxed bg-input border border-border rounded-xl p-3.5">
              You've experienced DiagramSathi's AI generation! Create a free account now to get unlimited AI diagram generation, save your projects to the cloud, and access the workspace dashboard.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  setPendingClaim(true);
                  navigate("/signup");
                }}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                Create Free Account
              </button>

              <button
                onClick={() => {
                  setPendingClaim(true);
                  navigate("/signin");
                }}
                className="w-full py-2 bg-neutral/5 hover:bg-neutral/10 border border-border text-neutral rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Already have an account? Sign In
              </button>

              <button
                onClick={() => setIsUpsellOpen(false)}
                className="w-full py-1 text-xs text-neutral/40 hover:text-neutral/70 transition-colors cursor-pointer text-center"
              >
                Continue editing manually
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
