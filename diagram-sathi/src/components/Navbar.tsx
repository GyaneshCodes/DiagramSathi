import { useState, useRef, useEffect } from "react";
import { Settings, UserCircle, Share2, Download, X, ArrowLeft, Save, Pencil } from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDiagramStore } from "../store/useDiagramStore";
import { useAuth } from "../context/AuthContext";
import { renameProject } from "../lib/projects";
import { ThemeToggle } from "./ui/ThemeToggle";
import { getNodesBounds } from "@xyflow/react";

export const Navbar = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const [exportScope, setExportScope] = useState<"entire" | "selected">("entire");
  const navigate = useNavigate();
  const { session } = useAuth();
  const { saveProject, projectTitle, setProjectTitle, projectStatus, currentProjectId } = useDiagramStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [isRenaming]);

  const handleStartRename = () => {
    setIsRenaming(true);
    setRenameValue(projectTitle);
  };

  const handleCommitRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setIsRenaming(false);
      return;
    }
    
    const prevTitle = projectTitle;
    setProjectTitle(trimmed);
    
    if (currentProjectId) {
      try {
        await renameProject(currentProjectId, trimmed);
        toast.success("Renamed successfully");
      } catch {
        toast.error("Failed to rename");
        setProjectTitle(prevTitle);
      }
    }
    setIsRenaming(false);
  };

  const handleDraftToggle = async () => {
    if (!session?.user?.id) return;
    const isCurrentlyDraft = projectStatus === "draft";
    await saveProject(session.user.id, !isCurrentlyDraft);
  };

  const { setIsExporting, reactFlowInstance, setSelectedNodeId, setSelectedEdgeId } = useDiagramStore();

  // Calculate active selected node count
  const selectedNodesCount = reactFlowInstance
    ? reactFlowInstance.getNodes().filter((n) => n.selected).length
    : 0;

  // Auto-select selection scope and transparent background when modal opens with active selections
  useEffect(() => {
    if (isExportOpen && reactFlowInstance) {
      const selectedCount = reactFlowInstance.getNodes().filter((n) => n.selected).length;
      if (selectedCount > 0) {
        setExportScope("selected");
        setIsTransparent(true);
      } else {
        setExportScope("entire");
      }
    }
  }, [isExportOpen, reactFlowInstance]);

  const handleExport = async () => {
    if (!reactFlowInstance) {
      toast.error("Export failed. Canvas is not loaded.");
      return;
    }

    const allNodes = reactFlowInstance.getNodes();
    const allEdges = reactFlowInstance.getEdges();
    const selectedNodes = allNodes.filter((n) => n.selected);
    const selectedEdges = allEdges.filter((e) => e.selected);
    const isSelectedOnly = exportScope === "selected";
    
    // Choose export target based on selected scope
    const targetNodes = isSelectedOnly ? selectedNodes : allNodes;

    if (targetNodes.length === 0) {
      toast.error(isSelectedOnly ? "No elements selected to export." : "No diagram elements to export.");
      return;
    }

    const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!viewportEl) {
      toast.error("Export failed. Please try again.");
      return;
    }

    // Save current active store selections
    const prevSelectedNodeId = useDiagramStore.getState().selectedNodeId;
    const prevSelectedEdgeId = useDiagramStore.getState().selectedEdgeId;

    // Clear UI store selection highlights before capturing
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    // Save React Flow active selections and strip selection borders for clean image capture
    const cleanNodes = allNodes.map((n) => ({ ...n, selected: false }));
    const cleanEdges = allEdges.map((e) => ({ ...e, selected: false }));
    reactFlowInstance.setNodes(cleanNodes);
    reactFlowInstance.setEdges(cleanEdges);

    // Calculate crop boundaries (bounding box + padding)
    const bounds = getNodesBounds(targetNodes);
    const padding = 50;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    // Temporarily hide overlays (controls, minimap)
    setIsExporting(true);

    // Wait for state updates to flush to DOM
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const flowWrapper = document.querySelector(".react-flow") as HTMLElement;
    const prevBg = flowWrapper?.style.background || "";

    // Temporarily apply solid or transparent background styling for capture
    if (flowWrapper) {
      flowWrapper.style.background = isTransparent ? "transparent" : "#09090b";
    }

    toPng(viewportEl, {
      backgroundColor: isTransparent ? "transparent" : "#09090b",
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`,
      },
      pixelRatio: 3,
      filter: (domNode: HTMLElement) => {
        // Exclude unnecessary canvas controls and background sheets
        if (domNode?.classList?.contains("react-flow__controls")) return false;
        if (domNode?.classList?.contains("react-flow__minimap")) return false;
        if (domNode?.classList?.contains("react-flow__background")) return false;

        // Custom filtering for selected-only scope
        if (isSelectedOnly) {
          // Exclude the outer ER Group container itself so it does not cover the selection
          if (domNode?.classList?.contains("react-flow__node") && domNode.getAttribute("data-id") === "er-container") {
            return false;
          }

          // If node, check if selected
          if (domNode?.classList?.contains("react-flow__node")) {
            const nodeId = domNode.getAttribute("data-id");
            const isNodeSelected = selectedNodes.some((n) => n.id === nodeId);
            if (!isNodeSelected) return false;
          }

          // If edge, check smart edge inclusion rule
          if (domNode?.classList?.contains("react-flow__edge")) {
            const edgeId = domNode.getAttribute("data-id");
            const edge = allEdges.find((e) => e.id === edgeId);
            if (edge) {
              const isEdgeSelected = selectedEdges.some((e) => e.id === edge.id);
              const isSourceSelected = selectedNodes.some((n) => n.id === edge.source);
              const isTargetSelected = selectedNodes.some((n) => n.id === edge.target);
              
              // Include edge if explicitly selected OR if both connecting nodes are selected
              const shouldIncludeEdge = isEdgeSelected || (isSourceSelected && isTargetSelected);
              if (!shouldIncludeEdge) return false;
            } else {
              return false;
            }
          }
        }
        return true;
      },
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        const suffix = isSelectedOnly ? "selection" : "full";
        link.download = `${projectTitle || "diagram"}-${suffix}-${isTransparent ? "transparent" : "bg"}.png`;
        link.href = dataUrl;
        link.click();
        setIsExportOpen(false);
        toast.success("Diagram exported successfully!");
      })
      .catch((err) => {
        console.error("Failed to export diagram", err);
        toast.error("Export failed. Please try again.");
      })
      .finally(() => {
        // Restore background styles
        if (flowWrapper) {
          flowWrapper.style.background = prevBg;
        }
        
        setIsExporting(false);

        // Restore selection states in React Flow and Store
        reactFlowInstance.setNodes(allNodes);
        reactFlowInstance.setEdges(allEdges);
        if (prevSelectedNodeId) setSelectedNodeId(prevSelectedNodeId);
        if (prevSelectedEdgeId) setSelectedEdgeId(prevSelectedEdgeId);
      });
  };

  return (
    <>
      <div className="h-14 bg-panel/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/home")}
            className="text-neutral/70 hover:text-neutral transition-colors p-1.5 rounded-md hover:bg-neutral/10 flex items-center justify-center cursor-pointer"
            title="Go to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommitRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                className="text-sm font-semibold text-neutral bg-input border border-primary/50 rounded px-1.5 py-0 outline-none w-full max-w-[200px]"
              />
            ) : (
              <div 
                className="group flex items-center gap-1.5 cursor-pointer max-w-[200px]"
                onClick={handleStartRename}
                title="Rename diagram"
              >
                <span className="text-sm font-semibold text-neutral truncate border border-transparent rounded px-1 -mx-1 hover:border-border hover:bg-panel transition-colors">
                  {projectTitle}
                </span>
                <Pencil className="w-3 h-3 text-neutral/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            <span className={`text-[10px] uppercase tracking-wider font-medium ${projectStatus === 'draft' ? 'text-amber-500' : 'text-emerald-500'}`}>
               {currentProjectId ? (projectStatus === 'draft' ? 'Draft - Auto Saved' : 'Saved') : 'Unsaved'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <ThemeToggle />
          <button className="text-neutral/70 hover:text-neutral transition-colors">
            <Settings size={20} />
          </button>
          <button className="text-neutral/70 hover:text-neutral transition-colors">
            <UserCircle size={24} strokeWidth={1.5} />
          </button>
          
          <div className="w-px h-5 bg-border mx-1"></div>
          
          <button className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <Share2 size={16} /> SHARE
          </button>

          <button
            onClick={handleDraftToggle}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ml-2 cursor-pointer ${
              projectStatus === "draft" 
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                : "bg-neutral/10 text-neutral/70 border border-border hover:bg-neutral/20 hover:text-neutral transition-colors"
            }`}
            title={projectStatus === "draft" ? "Remove from Draft" : "Mark as Draft"}
          >
            <Save size={16} /> {projectStatus === "draft" ? "Remove from Draft" : "Mark as Draft"}
          </button>
          
          <button
            onClick={() => setIsExportOpen(true)}
            className="bg-[#6366f1] hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ml-2 shadow-lg shadow-indigo-900/20"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-panel border border-border rounded-xl shadow-2xl w-[400px] p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">Export Diagram</h3>
              <button
                onClick={() => setIsExportOpen(false)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Export Scope</span>
              <div className="grid grid-cols-2 gap-1 bg-input border border-border/80 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setExportScope("entire")}
                  className={`py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                    exportScope === "entire"
                      ? "bg-[#6366f1] text-white shadow-md shadow-indigo-900/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  Entire Diagram
                </button>
                <button
                  type="button"
                  disabled={selectedNodesCount === 0}
                  onClick={() => setExportScope("selected")}
                  className={`py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    selectedNodesCount === 0
                      ? "opacity-30 cursor-not-allowed text-slate-500"
                      : exportScope === "selected"
                        ? "bg-[#6366f1] text-white shadow-md shadow-indigo-900/10 cursor-pointer"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer"
                  }`}
                >
                  Selection Only
                  {selectedNodesCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-white/20 text-white rounded-full font-bold leading-none">
                      {selectedNodesCount}
                    </span>
                  )}
                </button>
              </div>
              {selectedNodesCount === 0 && (
                <span className="text-[11px] text-slate-400 text-center italic mt-0.5 leading-relaxed">
                  Hold <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-slate-300 font-mono text-[9px] shadow-sm">Shift</kbd> and drag on the canvas to select elements to export.
                </span>
              )}
            </div>

            <div className="bg-input border border-border/80 rounded-lg p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">Background</span>
                <span className="text-xs text-slate-500 mt-0.5">Toggle PNG Transparency</span>
              </div>
              <button
                onClick={() => setIsTransparent(!isTransparent)}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out cursor-pointer ${
                  isTransparent 
                    ? "bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]" 
                    : "bg-neutral/10 text-neutral/70 border border-border hover:bg-neutral/20 transition-all"
                }`}
              >
                {isTransparent ? "Transparent" : "Solid Dark"}
              </button>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-3 bg-[#6366f1] hover:bg-indigo-500 rounded-lg text-white font-medium flex justify-center items-center gap-2 transition-all duration-200 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 cursor-pointer"
            >
              <Download size={18} /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
};

