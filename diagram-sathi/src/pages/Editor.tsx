import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { LeftLayersPanel } from "../components/ui/LeftLayersPanel";
import { RightPropertiesPanel } from "../components/ui/RightPropertiesPanel";
import { PaneCenterCanvas } from "../components/PanelCenterCanvas";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    setCurrentProjectId,
  } = useDiagramStore();

  const isInitialMount = useRef(true);

  // Hydrate Project from URL ID
  useEffect(() => {
    if (id) {
      loadProject(id).catch(err => {
        console.error("Failed to load project from URL ID", err);
      });
    } else {
      setCurrentProjectId(null);
    }
  }, [id, loadProject, setCurrentProjectId]);

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

    if (!userId) return;

    const timer = setTimeout(() => {
      // Auto-save logic
      saveProject(userId).then(() => {
         console.log("Auto-saved successfully");
      }).catch(err => console.error("Auto-save failed", err));
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, projectTitle, saveProject, userId]);

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
