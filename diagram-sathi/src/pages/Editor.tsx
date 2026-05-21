import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { LeftLayersPanel } from "../components/ui/LeftLayersPanel";
import { RightPropertiesPanel } from "../components/ui/RightPropertiesPanel";
import { PaneCenterCanvas } from "../components/PanelCenterCanvas";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useDiagramStore } from "../store/useDiagramStore";

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const {
    leftPanelCollapsed,
    setLeftPanelCollapsed,
    rightPanelCollapsed,
    setRightPanelCollapsed,
    setActiveTool,
    activeTool,
    loadProject,
    saveProject,
    nodes,
    edges,
    projectTitle,
    diagramType,
    setCurrentProjectId,
    forceLayoutRefresh,
  } = useDiagramStore();

  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const hasLoadedProject = useRef(false);

  // Hydrate Project from URL ID
  useEffect(() => {
    if (!id) {
      setCurrentProjectId(null);
      return;
    }

    // Prevent re-loading if we already loaded this project ID
    if (hasLoadedProject.current) {
      return;
    }

    let cancelled = false;
    setIsProjectLoading(true);
    setProjectLoadError(null);

    loadProject(id)
      .then(() => {
        if (cancelled) return;
        hasLoadedProject.current = true;
        setIsProjectLoading(false);
        
        // Force canvas to re-render by triggering layout refresh
        // This ensures the canvas picks up the newly loaded nodes/edges
        setTimeout(() => {
          forceLayoutRefresh();
        }, 100);
      })
      .catch(err => {
        if (cancelled) return;
        console.error("Failed to load project from URL ID", err);
        setIsProjectLoading(false);
        setProjectLoadError(err.message || "Failed to load project");
      });

    return () => {
      cancelled = true;
    };
  }, [id, loadProject, setCurrentProjectId, forceLayoutRefresh]);

  const currentProjectId = useDiagramStore(state => state.currentProjectId);
  
  // Sync URL when a new project is created (e.g. from Auto-Save or AI Generation)
  useEffect(() => {
     if (currentProjectId && !id) {
        navigate(`/editor/${currentProjectId}`, { replace: true });
     }
  }, [currentProjectId, id, navigate]);

  // Auto-Save Effect (Debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!userId || isProjectLoading || (id && !hasLoadedProject.current)) return;

    const timer = setTimeout(() => {
      // Auto-save logic
      saveProject(userId).then(() => {
         // console.log("Auto-saved successfully");
      }).catch(err => console.error("Auto-save failed", err));
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, projectTitle, diagramType, saveProject, userId, isProjectLoading, id]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      )
        return;

      if (e.key.toLowerCase() === "v") setActiveTool("cursor");
      if (e.key.toLowerCase() === "h") setActiveTool("pan");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTool]);

  // Loading state while project is being fetched
  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-neutral/40 text-xs font-mono tracking-widest uppercase">
            Loading Diagram...
          </span>
        </div>
      </div>
    );
  }

  // Error state if project failed to load
  if (projectLoadError) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="text-red-400 text-lg font-semibold">Failed to Load</div>
          <p className="text-neutral/60 text-sm">{projectLoadError}</p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden bg-bg bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-bg to-bg font-sans text-neutral"
      data-active-tool={activeTool}
    >
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Left Panel Wrapper */}
        <div
          className={`flex transition-all duration-300 ease-in-out ${
            leftPanelCollapsed ? "w-0" : "w-64 md:w-72 lg:w-80"
          } relative z-40 h-full`}
        >
          {!leftPanelCollapsed && <LeftLayersPanel />}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 -right-4 z-50 bg-panel border border-border/60 p-1 rounded-full shadow-lg hover:bg-neutral/10 transition-colors ${
              leftPanelCollapsed ? "translate-x-4" : ""
            }`}
          >
            {leftPanelCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        <PaneCenterCanvas />

        {/* Right Panel Wrapper */}
        <div
          className={`flex transition-all duration-300 ease-in-out ${
            rightPanelCollapsed ? "w-0" : "w-64 md:w-72 lg:w-80"
          } relative z-40 h-full`}
        >
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 -left-4 z-50 bg-panel border border-border/60 p-1 rounded-full shadow-lg hover:bg-neutral/10 transition-colors ${
              rightPanelCollapsed ? "-translate-x-4" : ""
            }`}
          >
            {rightPanelCollapsed ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          {!rightPanelCollapsed && <RightPropertiesPanel />}
        </div>
      </div>
    </div>
  );
}

export default Editor;
