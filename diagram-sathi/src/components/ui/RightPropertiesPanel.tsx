import { useDiagramStore } from "../../store/useDiagramStore";
import {
  Palette,
  Share2,
  Map,
  LayoutPanelLeft,
  Type,
  Zap,
  Box,
} from "lucide-react";
import { CodeEditorPanel } from "./CodeEditorPanel";

/**
 * RightPropertiesPanel Component
 * 
 * This component acts as the right-side properties inspector for the diagram.
 * It allows the user to click on any node or edge in the central canvas and 
 * directly edit its properties (e.g., label, color, line style).
 * 
 * It also houses the toggle to view the raw Mermaid.js code through CodeEditorPanel.
 */
export const RightPropertiesPanel = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    updateNode,
    updateEdge,
    showCodeInRightPanel,
    setShowCodeInRightPanel,
    direction,
    setDirection,
  } = useDiagramStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (showCodeInRightPanel) {
    return (
      <div className="flex flex-col h-full bg-panel/60 backdrop-blur-xl shadow-xl w-64 md:w-72 lg:w-80 border-l border-border/80 shrink-0">
        <div className="p-4 border-b border-border/80 shrink-0 bg-transparent flex justify-between items-center">
          <h3 className="text-xs font-semibold text-neutral/70 uppercase tracking-wider">
            Source Code
          </h3>
          <button
            onClick={() => setShowCodeInRightPanel(false)}
            className="text-[10px] text-primary hover:text-primary/80 transition-colors font-medium bg-primary/10 px-2 py-1 rounded"
          >
            Back to Props
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeEditorPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-panel/60 backdrop-blur-xl shadow-xl w-64 md:w-72 lg:w-80 border-l border-border/80 shrink-0">
      <div className="p-4 shrink-0 bg-transparent flex justify-between items-center">
        <h3 className="text-xs font-semibold text-neutral/70 uppercase tracking-wider">
          Properties
        </h3>
        <button
          onClick={() => setShowCodeInRightPanel(true)}
          className="text-[10px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1 font-medium bg-primary/10 px-2 py-1 rounded"
        >
          <LayoutPanelLeft size={12} /> Edit Code
        </button>
      </div>

      <hr className="border-b w-[90%] mx-auto border-border/80" />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* State: Empty Selection (Global Settings) */}
        {!selectedNode && !selectedEdge && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Map size={12} /> Canvas Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary"
              >
                <option value="TB">Top-Down (TB)</option>
                <option value="LR">Left-Right (LR)</option>
              </select>
            </div>

            <div className="bg-bg/40 p-3 rounded-lg border border-border/40">
              <p className="text-[10px] text-neutral/50 italic leading-relaxed">
                Select a node or edge on the canvas to edit its specific
                properties and styling.
              </p>
            </div>
          </div>
        )}

        {/* State: Node Selected */}
        {selectedNode && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Type size={12} /> Label
              </label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) =>
                  updateNode(selectedNode.id, { label: e.target.value })
                }
                className="w-full text-xs bg-bg border border-border/80 rounded block p-2.5 text-neutral outline-none focus:border-primary placeholder:text-neutral/30"
                placeholder="Enter label..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Box size={12} /> Symbol Type
              </label>
              <select
                value={selectedNode.type}
                onChange={(e) =>
                  updateNode(selectedNode.id, { type: e.target.value as any })
                }
                className="w-full text-xs bg-bg border border-border/80 rounded block p-2.5 text-neutral outline-none focus:border-primary cursor-pointer"
              >
                <option value="rectangle">Rectangle (Process)</option>
                <option value="circle">Circle (External Entity)</option>
                <option value="cylinder">Cylinder (Data Store)</option>
                <option value="diamond">Diamond (Decision)</option>
                <option value="parallelogram">
                  Parallelogram (Input/Output)
                </option>
                <option value="hexagon">Hexagon (Preparation)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Palette size={12} /> Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.color || "#6366f1"}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { color: e.target.value })
                  }
                  className="w-8 h-8 rounded border border-border/80 bg-bg p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedNode.color || "#6366f1"}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { color: e.target.value })
                  }
                  className="flex-1 text-[10px] font-mono bg-bg border border-border/80 rounded p-1.5 text-neutral outline-none focus:border-primary uppercase"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 block">
                Metadata
              </label>
              <div className="text-[9px] font-mono text-neutral/30 bg-bg/30 p-2 rounded border border-border/40">
                ID: {selectedNode.id}
              </div>
            </div>
          </div>
        )}

        {/* State: Edge Selected */}
        {selectedEdge && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 block">
                Edge Label
              </label>
              <input
                type="text"
                value={selectedEdge.label}
                onChange={(e) =>
                  updateEdge(selectedEdge.id, { label: e.target.value })
                }
                className="w-full text-xs bg-bg border border-border/80 rounded block p-2.5 text-neutral outline-none focus:border-primary placeholder:text-neutral/30"
                placeholder="Flow label..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Share2 size={12} /> Line Style
              </label>
              <select
                value={selectedEdge.style || "solid"}
                onChange={(e) =>
                  updateEdge(selectedEdge.id, { style: e.target.value as any })
                }
                className="w-full text-xs bg-bg border border-border/80 rounded block p-2.5 text-neutral outline-none focus:border-primary cursor-pointer"
              >
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="dotted">Dotted Line</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1 text-nowrap">
                  <Box size={10} className="text-secondary" /> From Node
                </label>
                <select
                  value={selectedEdge.source}
                  onChange={(e) =>
                    updateEdge(selectedEdge.id, { source: e.target.value })
                  }
                  className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer truncate"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1 text-nowrap">
                  <Box size={10} className="text-primary" /> To Node
                </label>
                <select
                  value={selectedEdge.target}
                  onChange={(e) =>
                    updateEdge(selectedEdge.id, { target: e.target.value })
                  }
                  className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer truncate"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between bg-bg/40 p-3 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <Zap
                  size={14}
                  className={
                    selectedEdge.animated
                      ? "text-yellow-500"
                      : "text-neutral/30"
                  }
                />
                <span className="text-xs font-medium text-neutral/80">
                  Animated Flow
                </span>
              </div>
              <button
                onClick={() =>
                  updateEdge(selectedEdge.id, {
                    animated: !selectedEdge.animated,
                  })
                }
                className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
                  selectedEdge.animated ? "bg-primary" : "bg-neutral/20"
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${
                    selectedEdge.animated ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
