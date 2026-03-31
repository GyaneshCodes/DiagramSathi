import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { LeftLayersPanel } from "./components/ui/LeftLayersPanel";
import { RightPropertiesPanel } from "./components/ui/RightPropertiesPanel";
import { PaneCenterCanvas } from "./components/PanelCenterCanvas";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDiagramStore } from "./store/useDiagramStore";

function App() {
  const {
    leftPanelCollapsed,
    setLeftPanelCollapsed,
    rightPanelCollapsed,
    setRightPanelCollapsed,
    setActiveTool,
    activeTool,
  } = useDiagramStore();

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

export default App;
