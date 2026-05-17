import { useState, useRef, useEffect } from "react";
import { Settings, UserCircle, Share2, Download, X, ArrowLeft, Save, Pencil } from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDiagramStore } from "../store/useDiagramStore";
import { useAuth } from "../context/AuthContext";
import { renameProject } from "../lib/projects";
import { ThemeToggle } from "./ui/ThemeToggle";

export const Navbar = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
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

  const handleExport = async () => {
    const viewportEl = document.querySelector(
      ".react-flow"
    ) as HTMLElement;
    if (!viewportEl) {
      toast.error("Export failed. Please try again.");
      return;
    }

    // Save current state
    const prevViewport = reactFlowInstance ? reactFlowInstance.getViewport() : { x: 0, y: 0, zoom: 1 };
    const prevSelectedNodeId = useDiagramStore.getState().selectedNodeId;
    const prevSelectedEdgeId = useDiagramStore.getState().selectedEdgeId;

    // Clear selection before capture
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    // Fit view to show all nodes
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ duration: 0, padding: 0.2 });
    }

    // Wait for fitView to apply
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    // Flash-toggle: hide overlays before capture
    setIsExporting(true);

    // Wait one frame for React to flush the conditional render
    await new Promise((r) => requestAnimationFrame(r));

    const flowWrapper = document.querySelector(".react-flow") as HTMLElement;
    const prevBg = flowWrapper?.style.background || "";

    // Set the wrapper background for the capture phase
    if (flowWrapper) {
      flowWrapper.style.background = isTransparent ? "transparent" : "#09090b";
    }

    toPng(viewportEl, {
      backgroundColor: isTransparent ? "transparent" : "#09090b",
      pixelRatio: 3,
      filter: (node: HTMLElement) => {
        // Extra safety: exclude any straggler controls
        if (node?.classList?.contains("react-flow__controls")) return false;
        if (node?.classList?.contains("react-flow__minimap")) return false;
        if (node?.classList?.contains("react-flow__background")) return false;
        return true;
      },
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${projectTitle || "diagram"}-${isTransparent ? "transparent" : "bg"}.png`;
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
        // Restore overlays regardless of success or failure
        if (flowWrapper) {
          flowWrapper.style.background = prevBg;
        }
        setIsExporting(false);

        // Restore previous viewport
        if (reactFlowInstance) {
          reactFlowInstance.setViewport(prevViewport);
        }

        // Restore selection
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-panel border border-border rounded-xl shadow-2xl w-[400px] p-6 flex flex-col gap-6">
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
            
            <div className="bg-input border border-input-border rounded-lg p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">Background</span>
                <span className="text-xs text-slate-500 mt-0.5">Toggle PNG Transparency</span>
              </div>
              <button
                onClick={() => setIsTransparent(!isTransparent)}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out ${
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
              className="w-full py-3 bg-[#6366f1] hover:bg-indigo-500 rounded-lg text-white font-medium flex justify-center items-center gap-2 transition-all duration-200 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
            >
              <Download size={18} /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
};
