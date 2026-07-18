import { useDiagramStore } from "../../store/useDiagramStore";
import type { DiagramThemeType } from "../../utils/diagramThemes";
import { useTheme } from "../../context/ThemeContext";
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
import { ErRightPanel } from "./ErRightPanel";

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
    selectedNodeIds,
    nodes,
    edges,
    updateNode,
    updateNodes,
    updateEdge,
    showCodeInRightPanel,
    setShowCodeInRightPanel,
    direction,
    setDirection,
    diagramType,
    diagramTheme,
    setDiagramTheme,
  } = useDiagramStore();

  const { theme } = useTheme();
  const defaultFillColor = theme === "light" ? "#ffffff" : "#1e293b";

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
        {!selectedNode && !selectedEdge && selectedNodeIds.length <= 1 && diagramType !== "er" && (
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

            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Palette size={12} /> Diagram Theme
              </label>
              <select
                value={diagramTheme}
                onChange={(e) => setDiagramTheme(e.target.value as DiagramThemeType)}
                className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer"
              >
                <option value="default">Default (Individual Colors)</option>
                <option value="classic">Classic (Black & White)</option>
                <option value="navy">Navy Slate</option>
                <option value="forest">Emerald Forest</option>
                <option value="amber">Retro Amber</option>
                <option value="blueprint">Blueprint</option>
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

        {/* ER Mode */}
        {diagramType === "er" && <ErRightPanel />}

        {/* State: Node Selected (DFD / Flowchart only) */}
        {selectedNode && selectedNodeIds.length === 1 && diagramType !== "er" && (
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
                onBlur={() => {
                  useDiagramStore.getState().applyLayoutAsync();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    useDiagramStore.getState().applyLayoutAsync();
                  }
                }}
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
                {diagramType === "flowchart" ? (
                  <>
                    <option value="rectangle">Rectangle (Process)</option>
                    <option value="diamond">Diamond (Decision)</option>
                    <option value="parallelogram">Parallelogram (Input/Output)</option>
                    <option value="circle">Circle / Hexagon (Start/End)</option>
                  </>
                ) : (
                  <>
                    <option value="rectangle">Rectangle (External Entity)</option>
                    <option value="circle">Circle (Process)</option>
                    <option value="cylinder">Cylinder (Data Store)</option>
                  </>
                )}
              </select>
            </div>

            {diagramTheme !== "default" && (
              <div className="bg-amber-500/10 text-amber-500 text-[10px] p-2.5 rounded border border-amber-500/25 mb-1">
                ⚠️ Individual colors are overridden by the active Diagram Theme ({diagramTheme.charAt(0).toUpperCase() + diagramTheme.slice(1)}).
              </div>
            )}
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-1">
                  <Palette size={12} /> Node Fill
                </label>
                <label className="flex items-center gap-1 text-[10px] text-neutral/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedNode.fillColor === "transparent"}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        fillColor: e.target.checked ? "transparent" : defaultFillColor,
                      })
                    }
                    className="rounded border-border/80 text-primary focus:ring-0 cursor-pointer w-3 h-3"
                  />
                  Transparent
                </label>
              </div>
              {selectedNode.fillColor !== "transparent" && (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <input
                    type="color"
                    value={selectedNode.fillColor || defaultFillColor}
                    onChange={(e) =>
                      updateNode(selectedNode.id, { fillColor: e.target.value })
                    }
                    className="w-8 h-8 rounded border border-border/80 bg-bg p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedNode.fillColor || defaultFillColor}
                    onChange={(e) =>
                      updateNode(selectedNode.id, { fillColor: e.target.value })
                    }
                    className="flex-1 text-[10px] font-mono bg-bg border border-border/80 rounded p-1.5 text-neutral outline-none focus:border-primary uppercase"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Type size={12} /> Font Style
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedNode.fontSize || 14}
                  onChange={(e) => {
                    updateNode(selectedNode.id, { fontSize: parseInt(e.target.value) });
                    useDiagramStore.getState().applyLayoutAsync();
                  }}
                  className="flex-1 text-xs bg-bg border border-border/80 rounded p-1.5 text-neutral outline-none focus:border-primary cursor-pointer"
                >
                  <option value={12}>12 px</option>
                  <option value={14}>14 px</option>
                  <option value={16}>16 px</option>
                  <option value={18}>18 px</option>
                  <option value={20}>20 px</option>
                  <option value={24}>24 px</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const isBold = selectedNode.fontBold !== false;
                    updateNode(selectedNode.id, { fontBold: !isBold });
                    useDiagramStore.getState().applyLayoutAsync();
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded border transition-all cursor-pointer ${
                    selectedNode.fontBold !== false
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-bg text-neutral border-border/80 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  title="Bold"
                >
                  B
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const isItalic = !!selectedNode.fontItalic;
                    updateNode(selectedNode.id, { fontItalic: !isItalic });
                    useDiagramStore.getState().applyLayoutAsync();
                  }}
                  className={`px-3 py-1.5 text-xs italic rounded border transition-all cursor-pointer ${
                    selectedNode.fontItalic
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-bg text-neutral border-border/80 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  title="Italic"
                >
                  I
                </button>
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

        {/* State: Batch Node Selection (DFD / Flowchart only) */}
        {selectedNodeIds.length > 1 && diagramType !== "er" && (() => {
          const firstSelectedNode = nodes.find(n => n.id === selectedNodeIds[0]);
          
          const allSameType = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return node?.type === firstSelectedNode?.type;
          });
          const batchType = allSameType ? firstSelectedNode?.type : "";

          const allSameColor = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return (node?.color || "#6366f1") === (firstSelectedNode?.color || "#6366f1");
          });
          const batchColor = allSameColor ? (firstSelectedNode?.color || "#6366f1") : "#6366f1";

          const allSameFillColor = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return (node?.fillColor || defaultFillColor) === (firstSelectedNode?.fillColor || defaultFillColor);
          });
          const batchFillColor = allSameFillColor ? (firstSelectedNode?.fillColor || defaultFillColor) : defaultFillColor;

          const allTransparent = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return node?.fillColor === "transparent";
          });

          const allSameFontSize = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return (node?.fontSize || 14) === (firstSelectedNode?.fontSize || 14);
          });
          const batchFontSize = allSameFontSize ? (firstSelectedNode?.fontSize || 14) : 14;

          const allBold = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return node?.fontBold !== false;
          });

          const allItalic = selectedNodeIds.every(id => {
            const node = nodes.find(n => n.id === id);
            return !!node?.fontItalic;
          });

          return (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="bg-primary/5 p-3 rounded border border-primary/20 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                  <Box size={14} /> Batch Editing
                </span>
                <span className="text-[10px] text-neutral/50">
                  Modifying {selectedNodeIds.length} nodes simultaneously.
                </span>
              </div>

              {/* Symbol Type */}
              <div>
                <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Box size={12} /> Symbol Type
                </label>
                <select
                  value={batchType}
                  onChange={(e) => updateNodes(selectedNodeIds, { type: e.target.value as any })}
                  className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer"
                >
                  {!allSameType && (
                    <option value="" disabled hidden>
                      Mixed Types
                    </option>
                  )}
                  {diagramType === "dfd" ? (
                    <>
                      <option value="process">Process (Circle)</option>
                      <option value="entity">External Entity (Rectangle)</option>
                      <option value="datastore">Data Store (Open Rectangle)</option>
                    </>
                  ) : (
                    <>
                      <option value="rectangle">Process (Rectangle)</option>
                      <option value="circle">Start / End (Circle)</option>
                      <option value="diamond">Decision (Diamond)</option>
                      <option value="parallelogram">Input / Output (Parallelogram)</option>
                      <option value="hexagon">Preparation (Hexagon)</option>
                      <option value="cylinder">Database (Cylinder)</option>
                      <option value="stadium">Stadium / Pill</option>
                      <option value="square">Square</option>
                    </>
                  )}
                </select>
              </div>

              {diagramTheme !== "default" && (
                <div className="bg-amber-500/10 text-amber-500 text-[10px] p-2.5 rounded border border-amber-500/25 mb-1">
                  ⚠️ Individual colors are overridden by the active Diagram Theme ({diagramTheme.charAt(0).toUpperCase() + diagramTheme.slice(1)}).
                </div>
              )}
              {/* Accent/Border Color */}
              <div>
                <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Palette size={12} /> Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={batchColor}
                    onChange={(e) => updateNodes(selectedNodeIds, { color: e.target.value })}
                    className="w-8 h-8 rounded border border-border/80 bg-bg p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={allSameColor ? batchColor : ""}
                    placeholder={allSameColor ? "" : "Mixed Colors"}
                    onChange={(e) => {
                      if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                        updateNodes(selectedNodeIds, { color: e.target.value });
                      }
                    }}
                    className="flex-1 text-[10px] font-mono bg-bg border border-border/80 rounded p-1.5 text-neutral outline-none focus:border-primary uppercase"
                  />
                </div>
              </div>

              {/* Node Fill */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-1">
                    <Palette size={12} /> Node Fill
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-neutral/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allTransparent}
                      onChange={(e) =>
                        updateNodes(selectedNodeIds, {
                          fillColor: e.target.checked ? "transparent" : defaultFillColor,
                        })
                      }
                      className="rounded border-border/80 text-primary focus:ring-0 cursor-pointer w-3 h-3"
                    />
                    Transparent
                  </label>
                </div>
                {!allTransparent && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200">
                    <input
                      type="color"
                      value={batchFillColor === "transparent" ? defaultFillColor : batchFillColor}
                      onChange={(e) => updateNodes(selectedNodeIds, { fillColor: e.target.value })}
                      className="w-8 h-8 rounded border border-border/80 bg-bg p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={allSameFillColor && batchFillColor !== "transparent" ? batchFillColor : ""}
                      placeholder={allSameFillColor && batchFillColor !== "transparent" ? "" : "Mixed Fills"}
                      onChange={(e) => {
                        if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                          updateNodes(selectedNodeIds, { fillColor: e.target.value });
                        }
                      }}
                      className="flex-1 text-[10px] font-mono bg-bg border border-border/80 rounded p-1.5 text-neutral outline-none focus:border-primary uppercase"
                    />
                  </div>
                )}
              </div>

              {/* Font Style */}
              <div>
                <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Type size={12} /> Font Style
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={allSameFontSize ? batchFontSize : ""}
                    onChange={(e) => {
                      updateNodes(selectedNodeIds, { fontSize: parseInt(e.target.value) });
                    }}
                    className="flex-1 text-xs bg-bg border border-border/80 rounded p-1.5 text-neutral outline-none focus:border-primary cursor-pointer"
                  >
                    {!allSameFontSize && (
                      <option value="" disabled hidden>
                        Mixed Sizes
                      </option>
                    )}
                    <option value={12}>12 px</option>
                    <option value={14}>14 px</option>
                    <option value={16}>16 px</option>
                    <option value={18}>18 px</option>
                    <option value={20}>20 px</option>
                    <option value={24}>24 px</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      updateNodes(selectedNodeIds, { fontBold: !allBold });
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded border transition-all cursor-pointer ${
                      allBold
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-bg text-neutral border-border/80 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                    title="Bold"
                  >
                    B
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateNodes(selectedNodeIds, { fontItalic: !allItalic });
                    }}
                    className={`px-3 py-1.5 text-xs italic rounded border transition-all cursor-pointer ${
                      allItalic
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-bg text-neutral border-border/80 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                    title="Italic"
                  >
                    I
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* State: Edge Selected (DFD / Flowchart only) */}
        {selectedEdge && diagramType !== "er" && (
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
                onBlur={() => {
                  useDiagramStore.getState().applyLayoutAsync();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    useDiagramStore.getState().applyLayoutAsync();
                  }
                }}
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
