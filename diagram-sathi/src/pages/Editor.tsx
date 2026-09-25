import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { LeftLayersPanel } from "../components/ui/LeftLayersPanel";
import { RightPropertiesPanel } from "../components/ui/RightPropertiesPanel";
import { PaneCenterCanvas } from "../components/PanelCenterCanvas";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useDiagramStore } from "../store/useDiagramStore";
import { useErDiagramStore } from "../store/useErDiagramStore";
import { createProject } from "../lib/projects";
import toast from "react-hot-toast";
import {
  loadGuestDiagram,
  saveGuestDiagram,
  isPendingClaim,
  clearPendingClaim,
  clearGuestDiagram,
} from "../utils/guestStorage";

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
    currentProjectId,
    setCurrentProjectId,
    forceLayoutRefresh,
  } = useDiagramStore();

  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const loadedProjectIdRef = useRef<string | null>(null);

  // Panel Resizing State
  const MIN_LEFT_WIDTH = 280;
  const MAX_LEFT_WIDTH = 680;
  const MIN_RIGHT_WIDTH = 320;
  const MAX_RIGHT_WIDTH = 720;

  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(340);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.min(Math.max(e.clientX, MIN_LEFT_WIDTH), MAX_LEFT_WIDTH);
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, MIN_RIGHT_WIDTH), MAX_RIGHT_WIDTH);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, isResizingRight]);

  // Hydrate Project from URL ID or Guest Storage
  useEffect(() => {
    // 1. If signed in and has a pending claim from guest mode, migrate the diagram
    if (userId && isPendingClaim()) {
      const pendingGuest = loadGuestDiagram();
      if (
        pendingGuest &&
        (pendingGuest.nodes?.length > 0 || (pendingGuest.erData?.schemas?.length || 0) > 0)
      ) {
        clearPendingClaim();
        toast.loading("Saving your diagram to your account...", { id: "claim-toast" });
        createProject(userId, {
          title: pendingGuest.title || "Untitled Diagram",
          description: pendingGuest.description || "",
          diagram_type: pendingGuest.diagramType || "dfd",
          ast_data: { nodes: pendingGuest.nodes, edges: pendingGuest.edges },
          dfd_level: pendingGuest.dfdLevel || 0,
          er_data: pendingGuest.erData,
          mermaid_code: pendingGuest.mermaidCode,
          canvas_settings: { direction: pendingGuest.direction || "LR" },
          status: "active",
        })
          .then((newProj) => {
            clearGuestDiagram();
            toast.success("Diagram saved to your account!", { id: "claim-toast" });
            navigate(`/editor/${newProj.id}`, { replace: true });
          })
          .catch((err) => {
            console.error("Failed to claim guest project:", err);
            toast.error("Failed to save diagram to cloud", { id: "claim-toast" });
          });
        return;
      } else {
        clearPendingClaim();
      }
    }

    // 2. Standalone Editor without ID: Handle Guest Mode
    if (!id) {
      loadedProjectIdRef.current = null;
      setCurrentProjectId(null);
      setIsProjectLoading(false);

      // In guest mode (or blank new editor), restore stored guest diagram if store is currently empty
      if (!userId) {
        const guestData = loadGuestDiagram();
        const currentNodes = useDiagramStore.getState().nodes;
        if (guestData && currentNodes.length === 0 && guestData.nodes && guestData.nodes.length > 0) {
          useDiagramStore.setState({
            projectTitle: guestData.title || "Untitled Diagram",
            projectDescription: guestData.description || "",
            nodes: guestData.nodes || [],
            edges: guestData.edges || [],
            diagramType: guestData.diagramType || "dfd",
            preferredDiagramType: guestData.diagramType || "dfd",
            dfdLevel: guestData.dfdLevel || 0,
            direction: guestData.direction || "LR",
            mermaidCode: guestData.mermaidCode || "",
          });
          if (guestData.diagramType === "er" && guestData.erData) {
            useErDiagramStore.getState().loadFromAstData(guestData.erData);
          }
          setTimeout(() => forceLayoutRefresh(), 100);
        }
      }
      return;
    }

    // Already hydrated for this ID
    if (loadedProjectIdRef.current === id) {
      setIsProjectLoading(false);
      return;
    }

    // If this project is already active in memory (e.g. freshly generated from dashboard), reuse state
    const storeState = useDiagramStore.getState();
    if (storeState.currentProjectId === id && storeState.nodes.length > 0) {
      loadedProjectIdRef.current = id;
      setIsProjectLoading(false);
      return;
    }

    let isSubscribed = true;
    setIsProjectLoading(true);
    setProjectLoadError(null);

    loadProject(id)
      .then(() => {
        if (!isSubscribed) return;
        loadedProjectIdRef.current = id;
        setIsProjectLoading(false);
        setTimeout(() => {
          forceLayoutRefresh();
        }, 100);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.error("Failed to load project from URL ID", err);
        setIsProjectLoading(false);
        setProjectLoadError(err.message || "Failed to load project");
      });

    return () => {
      isSubscribed = false;
    };
  }, [id, loadProject, setCurrentProjectId, forceLayoutRefresh]);

  useEffect(() => {
    if (currentProjectId && !id) {
      loadedProjectIdRef.current = currentProjectId;
      navigate(`/editor/${currentProjectId}`, { replace: true });
    }
  }, [currentProjectId, id, navigate]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Prevent cloud auto-save while project is still loading or if URL ID hasn't loaded into memory yet
    if (isProjectLoading || (id && loadedProjectIdRef.current !== id)) return;

    // Guest Mode: auto-save locally to browser storage
    if (!userId && !id) {
      const guestTimer = setTimeout(() => {
        const erData = diagramType === "er" ? useErDiagramStore.getState().getAstData() : undefined;
        saveGuestDiagram({
          title: projectTitle,
          diagramType,
          nodes,
          edges,
          mermaidCode: useDiagramStore.getState().mermaidCode,
          direction: useDiagramStore.getState().direction,
          erData,
        });
      }, 1000);
      return () => clearTimeout(guestTimer);
    }

    if (!userId) return;

    // Authenticated Mode: save to Supabase
    const timer = setTimeout(() => {
      saveProject(userId).catch((err) => console.error("Auto-save failed", err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, edges, projectTitle, diagramType, saveProject, userId, isProjectLoading, id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      className="flex flex-col w-screen h-screen overflow-hidden bg-bg bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-bg to-bg font-sans text-neutral select-none"
      data-active-tool={activeTool}
    >
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative p-1.5 gap-2">
        {/* Resizable Left Panel Wrapper */}
        <div
          style={{ width: leftPanelCollapsed ? 0 : `${leftWidth}px` }}
          className={`flex transition-all ${
            isResizingLeft ? "duration-0" : "duration-200 ease-out"
          } relative z-40 h-full shrink-0`}
        >
          {!leftPanelCollapsed && (
            <div className="w-full h-full overflow-hidden rounded-2xl border border-border/70 bg-panel/70 backdrop-blur-xl shadow-2xl flex flex-col">
              <LeftLayersPanel />
            </div>
          )}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 -right-3.5 z-50 bg-panel border border-border/80 p-1.5 rounded-full shadow-xl hover:bg-primary/20 hover:border-primary/50 transition-colors text-neutral ${
              leftPanelCollapsed ? "translate-x-4" : ""
            }`}
          >
            {leftPanelCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {!leftPanelCollapsed && (
            <div
              onMouseDown={handleLeftMouseDown}
              className="absolute top-0 bottom-0 -right-1.5 w-3 hover:w-4 cursor-col-resize z-50 flex items-center justify-center group"
              title="Drag to resize panel"
            >
              <div className="w-1 h-10 rounded-full bg-border/60 group-hover:bg-primary group-hover:scale-y-125 transition-all shadow-md" />
            </div>
          )}
        </div>

        {/* Center Canvas Workspace */}
        <div className="flex-1 h-full relative rounded-2xl overflow-hidden border border-border/40 bg-bg/20 shadow-inner">
          <PaneCenterCanvas />
        </div>

        {/* Resizable Right Panel Wrapper */}
        <div
          style={{ width: rightPanelCollapsed ? 0 : `${rightWidth}px` }}
          className={`flex transition-all ${
            isResizingRight ? "duration-0" : "duration-200 ease-out"
          } relative z-40 h-full shrink-0`}
        >
          {!rightPanelCollapsed && (
            <div
              onMouseDown={handleRightMouseDown}
              className="absolute top-0 bottom-0 -left-1.5 w-3 hover:w-4 cursor-col-resize z-50 flex items-center justify-center group"
              title="Drag to resize panel"
            >
              <div className="w-1 h-10 rounded-full bg-border/60 group-hover:bg-primary group-hover:scale-y-125 transition-all shadow-md" />
            </div>
          )}
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 -left-3.5 z-50 bg-panel border border-border/80 p-1.5 rounded-full shadow-xl hover:bg-primary/20 hover:border-primary/50 transition-colors text-neutral ${
              rightPanelCollapsed ? "-translate-x-4" : ""
            }`}
          >
            {rightPanelCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          {!rightPanelCollapsed && (
            <div className="w-full h-full overflow-hidden rounded-2xl border border-border/70 bg-panel/70 backdrop-blur-xl shadow-2xl flex flex-col">
              <RightPropertiesPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Editor;
