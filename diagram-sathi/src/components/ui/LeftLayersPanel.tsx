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
} from "lucide-react";
import { generateDiagramFromDescription } from "../../utils/gemini";

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
    preferredDiagramType,
    setPreferredDiagramType,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
  } = useDiagramStore();

  const handleSmartSuggest = async () => {
    if (!projectDescription.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateDiagramFromDescription(
        projectDescription,
        preferredDiagramType,
      );
      applyAIGeneratedDiagram(result.nodes, result.edges);
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "Failed to generate diagram.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <div className="flex flex-col h-full bg-panel/60 backdrop-blur-xl shadow-xl w-64 md:w-72 border-r border-border/80 shrink-0 select-none">
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

        {/* Mutable Diagram Type Toggle */}
        <div className="flex text-[10px] rounded-md overflow-hidden border border-border/80 p-0.5 bg-bg/50">
          {(["dfd", "er", "sequence"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPreferredDiagramType(type)}
              className={`flex-1 py-1 text-center font-medium rounded-sm transition-colors ${
                preferredDiagramType === type
                  ? "bg-primary text-white shadow-sm"
                  : "text-neutral/60 hover:text-neutral hover:bg-neutral/10"
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={handleSmartSuggest}
          disabled={isGenerating || !projectDescription.trim()}
          className="w-full text-xs bg-primary hover:bg-primary/80 disabled:bg-primary/20 disabled:text-primary/40 text-white py-2 rounded-md transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isGenerating ? "Generating..." : "✨ Generate Diagram"}
        </button>
      </div>

      <hr className="border-b w-[90%] mx-auto border-border/80" />

      {/* Bottom: Layers */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={12} /> Nodes
            </h3>
            <button
              onClick={() => addNode({ label: "New Node", type: "rectangle" })}
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
    </div>
  );
};
