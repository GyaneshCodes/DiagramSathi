import { useEffect, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useInternalNode,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type InternalNode,
  Position,
  type Node,
  type Edge,
  type Connection,
  addEdge as rfAddEdge,
  MarkerType,
  MiniMap,
  SelectionMode,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useDiagramStore,
  type DfdNode,
  type DfdEdge,
} from "../store/useDiagramStore";
import { RefreshCw } from "lucide-react";
import { useErDiagramStore } from "../store/useErDiagramStore";
import { getNodeDimensions } from "../utils/layoutConfiguration";
import { TopToolbar } from "./ui/TopToolbar";
import { nodeTypes } from "./diagram/Nodes";
import { ElkPolylineEdge } from "./diagram/ElkPolylineEdge";
import { ErRelationshipEdge } from "./diagram/ErRelationshipEdge";

/**
 * PaneCenterCanvas Module
 *
 * This file contains the React Flow implementation that renders the central
 * diagramming canvas. It is responsible for bidirectional synchronization with
 * the Zustand store (`useDiagramStore`), dynamic auto-layout (Dagre), and handling
 * complex UI interactions like edge routing and custom node shapes.
 */

// --- Custom Floating Edge Logic --- //

/**
 * Determines connection sides and coordinates for an edge.
 *
 * All edges between the same source→target pair connect on the SAME
 * best side (based on relative node position). When multiple edges
 * share a side, their connection points are offset to produce clean
 * parallel arrows — matching standard DFD visual conventions.
 *
 * @param pairIndex  – this edge's index among edges between the same pair
 * @param pairTotal  – total edges between the same source→target pair
 */
function getEdgeParams(
  source: InternalNode,
  target: InternalNode,
  pairIndex: number,
  pairTotal: number,
) {
  const sourceCenter = {
    x: source.internals.positionAbsolute.x + (source.measured.width ?? 0) / 2,
    y: source.internals.positionAbsolute.y + (source.measured.height ?? 0) / 2,
  };
  const targetCenter = {
    x: target.internals.positionAbsolute.x + (target.measured.width ?? 0) / 2,
    y: target.internals.positionAbsolute.y + (target.measured.height ?? 0) / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // Pick the best side pair based on the dominant direction
  let sourcePos: Position;
  let targetPos: Position;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal — connect via Right↔Left sides
    sourcePos = dx > 0 ? Position.Right : Position.Left;
    targetPos = dx > 0 ? Position.Left : Position.Right;
  } else {
    // Vertical — connect via Bottom↔Top sides
    sourcePos = dy > 0 ? Position.Bottom : Position.Top;
    targetPos = dy > 0 ? Position.Top : Position.Bottom;
  }

  // For multiple edges between the same pair, offset along the side
  const EDGE_SPACING = 18;
  const offsetAmount =
    pairTotal <= 1 ? 0 : (pairIndex - (pairTotal - 1) / 2) * EDGE_SPACING;

  const getSidePoint = (node: InternalNode, pos: Position, offset: number) => {
    const x = node.internals?.positionAbsolute?.x ?? 0;
    const y = node.internals?.positionAbsolute?.y ?? 0;
    const w = node.measured?.width ?? 0;
    const h = node.measured?.height ?? 0;

    switch (pos) {
      case Position.Top:
        return { x: x + w / 2 + offset, y };
      case Position.Bottom:
        return { x: x + w / 2 + offset, y: y + h };
      case Position.Left:
        return { x, y: y + h / 2 + offset };
      case Position.Right:
        return { x: x + w, y: y + h / 2 + offset };
      default:
        return { x: x + w / 2, y: y + h / 2 };
    }
  };

  const { x: sx, y: sy } = getSidePoint(source, sourcePos, offsetAmount);
  const { x: tx, y: ty } = getSidePoint(target, targetPos, offsetAmount);

  return { sx, sy, tx, ty, sourcePos, targetPos };
}

// Custom Floating SmoothStep Edge
const FloatingSmoothStepEdge = ({
  id,
  source,
  target,
  label,
  markerEnd,
  style,
  data,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (
    !sourceNode ||
    !targetNode ||
    !sourceNode.internals ||
    !targetNode.internals
  ) {
    return null;
  }

  try {
    const pairIndex = (data?.pairIndex as number) ?? 0;
    const pairTotal = (data?.pairTotal as number) ?? 1;

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
      sourceNode,
      targetNode,
      pairIndex,
      pairTotal,
    );

    // Safety: prevent zero-length paths that can crash some renderers
    if (sx === tx && sy === ty) return null;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos,
    });

    return (
      <>
        <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
        {label && (
          <EdgeLabelRenderer>
            {(() => {
              // --- Dynamic Geometry-Aware Label Translating ---
              const EDGE_SPACING = 18;
              const offsetAmount =
                pairTotal <= 1 ? 0 : (pairIndex - (pairTotal - 1) / 2) * EDGE_SPACING;

              // ========================================================
              // TWEAKABLE CONFIGURATION PARAMETERS
              // Change these values to adjust the label distances from the lines
              // ========================================================
              const VERTICAL_EDGE_HORIZONTAL_OFFSET = 45; // Shift amount to the left/right of vertical lines (in pixels)
              const HORIZONTAL_EDGE_TOP_OFFSET = -8;      // Spacing above the top horizontal line (in pixels)
              const HORIZONTAL_EDGE_BOTTOM_OFFSET = 8;    // Spacing below the bottom horizontal line (in pixels)

              let translateXPercent = -50;
              let translateYPercent = -100;
              let additionalX = 0;
              let additionalY = -4;

              const isVertical = sourcePos === Position.Top || sourcePos === Position.Bottom;

              if (isVertical) {
                if (pairTotal > 1) {
                  if (offsetAmount < 0) {
                    // Left-shifted edge
                    additionalX = -VERTICAL_EDGE_HORIZONTAL_OFFSET;
                    translateYPercent = -50;
                    additionalY = 0;
                  } else if (offsetAmount > 0) {
                    // Right-shifted edge
                    additionalX = VERTICAL_EDGE_HORIZONTAL_OFFSET;
                    translateYPercent = -50;
                    additionalY = 0;
                  } else {
                    // Center edge (in 3-edge layout)
                    additionalX = 0;
                    translateYPercent = -50;
                    additionalY = 0;
                  }
                }
              } else {
                // Horizontal edge
                if (pairTotal > 1) {
                  if (offsetAmount < 0) {
                    // Top-shifted edge
                    translateYPercent = -100;
                    additionalY = HORIZONTAL_EDGE_TOP_OFFSET;
                  } else if (offsetAmount > 0) {
                    // Bottom-shifted edge
                    translateYPercent = 0;
                    additionalY = HORIZONTAL_EDGE_BOTTOM_OFFSET;
                  } else {
                    // Center edge (in 3-edge layout)
                    translateYPercent = -50;
                    additionalY = 0;
                  }
                }
              }

              const transformStyle = `translate(${translateXPercent}%, ${translateYPercent}%) translate(${labelX + additionalX}px, ${labelY + additionalY}px)`;

              return (
                <div
                  style={{
                    position: "absolute",
                    transform: transformStyle,
                    padding: "4px 4px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    background: "var(--edge-label-bg)",
                    color: "var(--edge-label-text)",
                    pointerEvents: "all",
                  }}
                  className="nodrag nopan"
                >
                  {label}
                </div>
              );
            })()}
          </EdgeLabelRenderer>
        )}
      </>
    );
  } catch (err) {
    console.error("Floating Edge Render Error:", err);
    return null;
  }
};

const edgeTypes = {
  smoothstep: FloatingSmoothStepEdge,
  "elk-polyline": ElkPolylineEdge,
  "er-relationship": ErRelationshipEdge,
};

// ========================
// CANVAS INNER COMPONENT
// ========================

const PaneCenterCanvasInner = () => {
  const astNodes = useDiagramStore((s) => s.nodes);
  const astEdges = useDiagramStore((s) => s.edges);
  const diagramType = useDiagramStore((s) => s.diagramType);
  const layoutVersion = useDiagramStore((s) => s.layoutVersion);
  const latestGeneratedNodeIds = useDiagramStore(
    (s) => s.latestGeneratedNodeIds,
  );
  const storeAddEdge = useDiagramStore((s) => s.addEdge);
  const removeNode = useDiagramStore((s) => s.removeNode);
  const removeEdge = useDiagramStore((s) => s.removeEdge);

  const activeTool = useDiagramStore((s) => s.activeTool);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDiagramStore((s) => s.selectedEdgeId);
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useDiagramStore((s) => s.setSelectedEdgeId);
  const isExporting = useDiagramStore((s) => s.isExporting);
  const isLayouting = useDiagramStore((s) => s.isLayouting);

  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const reactFlowInstance = useReactFlow();
  const setReactFlowInstance = useDiagramStore((s) => s.setReactFlowInstance);

  useEffect(() => {
    setReactFlowInstance(reactFlowInstance);
  }, [reactFlowInstance, setReactFlowInstance]);

  const layoutAppliedRef = useRef(false);
  const prevLayoutVersionRef = useRef(layoutVersion);

  useEffect(() => {
    try {
      setError(null);

      // Trigger re-layout only when layoutVersion changed
      if (prevLayoutVersionRef.current !== layoutVersion) {
        layoutAppliedRef.current = false;
        prevLayoutVersionRef.current = layoutVersion;
      }

      let rfNodes: Node[] = astNodes.map((n: DfdNode, index: number) => {
        const isErContainer = n.type === "er-container";
        const dims = isErContainer
          ? { width: n.width || 400, height: n.height || 200 }
          : getNodeDimensions(n.type, n.width, n.height);

        // Sanitize position to prevent React Flow crashes from null/NaN coordinates
        const posX = (typeof n.position?.x === 'number' && !isNaN(n.position.x)) ? n.position.x : (50 + index * 200);
        const posY = (typeof n.position?.y === 'number' && !isNaN(n.position.y)) ? n.position.y : 100;

        return {
          id: n.id,
          type: n.type,
          position: { x: posX, y: posY },
          width: dims.width,
          height: dims.height,
          data: { label: n.label, color: n.color, fillColor: n.fillColor },
          draggable: !isErContainer,
          selectable: !isErContainer,
          style: isErContainer ? { width: dims.width, height: dims.height, zIndex: -1 } : undefined,
          ...(n.parentId ? { parentId: n.parentId } : {}),
        };
      });

      // Group edges by source↔target pair (unordered) for parallel routing
      const pairCounts = new Map<string, number>();
      astEdges.forEach((e: DfdEdge) => {
        const key = [e.source, e.target].sort().join(" - ");
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      });
      const pairSeen = new Map<string, number>();

      let rfEdges: Edge[] = astEdges.map((e: DfdEdge) => {
        const key = [e.source, e.target].sort().join(" - ");
        const pairTotal = pairCounts.get(key) ?? 1;
        const pairIndex = pairSeen.get(key) ?? 0;
        pairSeen.set(key, pairIndex + 1);

        // ER diagrams use their own edge type
        if (diagramType === "er") {
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            type: "er-relationship",
            data: {},
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--edge-color)",
            },
            style: {
              stroke: "var(--edge-color)",
              strokeWidth: 2,
            },
          };
        }

        // Use ELK polyline when we have full routing data from ELK
        const hasElkRouting = e.data?.startPoint && e.data?.endPoint;

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type:
            diagramType === "dfd" && hasElkRouting
              ? "elk-polyline"
              : "smoothstep",
          animated: e.animated,
          data: {
            pairIndex,
            pairTotal,
            startPoint: e.data?.startPoint,
            bendPoints: e.data?.bendPoints,
            endPoint: e.data?.endPoint,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--edge-color)",
          },
          style: {
            stroke: "var(--edge-color)",
            strokeWidth: 2,
            strokeDasharray:
              e.style === "dashed"
                ? "5 5"
                : e.style === "dotted"
                  ? "1 4"
                  : undefined,
          },
        };
      });

      // Apply fitView if layoutVersion changed
      if (layoutAppliedRef.current === false) {
        layoutAppliedRef.current = true;

        requestAnimationFrame(() => {
          fitView({ duration: 400, padding: 0.15 });
        });
      }

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (err: unknown) {
      console.error("Canvas Mapping Error:", err);
      setError("Error mapping AST to Canvas");
    }
  }, [
    astNodes,
    astEdges,
    diagramType,
    layoutVersion,
    latestGeneratedNodeIds,
    fitView,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    );
  }, [selectedNodeId, setNodes]);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => ({ ...e, selected: e.id === selectedEdgeId })),
    );
  }, [selectedEdgeId, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => rfAddEdge(params, eds));
      if (params.source && params.target) {
        storeAddEdge({
          source: params.source,
          target: params.target,
          label: "New Flow",
        });
      }
    },
    [setEdges, storeAddEdge],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Route ER schema clicks to the ER store, not the DFD properties panel
      if (diagramType === "er" && node.type === "er-schema") {
        const schemaId = node.id.replace("er_", "");
        useErDiagramStore.getState().setSelectedSchemaId(schemaId);
        return;
      }
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId, diagramType],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      // Route ER relationship clicks to the ER store
      if (diagramType === "er" && edge.type === "er-relationship") {
        const relId = edge.id.replace("er_rel_", "");
        useErDiagramStore.getState().setSelectedRelationshipId(relId);
        return;
      }
      setSelectedEdgeId(edge.id);
    },
    [setSelectedEdgeId, diagramType],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    // Clear ER-specific selection when clicking the pane
    if (diagramType === "er") {
      useErDiagramStore.getState().setSelectedSchemaId(null);
      useErDiagramStore.getState().setSelectedRelationshipId(null);
    }
  }, [setSelectedNodeId, setSelectedEdgeId, diagramType]);

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach((node) => removeNode(node.id));
    },
    [removeNode],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => removeEdge(edge.id));
    },
    [removeEdge],
  );

  // Update node positions when dragged and auto-save layout
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // ALWAYS update the position of the dragged node in the main store
      useDiagramStore.getState().updateNode(node.id, {
        position: node.position,
      });

      if (diagramType === "er" && node.type === "er-schema") {
        // Recalculate container bounds
        const allNodes = useDiagramStore.getState().nodes;
        const schemaDfdNodes = allNodes.filter((n) => n.type === "er-schema");
        if (schemaDfdNodes.length > 0) {
          const pad = 50;
          const topExtra = 44;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          schemaDfdNodes.forEach((n) => {
            const x = n.id === node.id ? node.position.x : (n.position?.x ?? 0);
            const y = n.id === node.id ? node.position.y : (n.position?.y ?? 0);
            const w = n.width ?? 300;
            const h = n.height ?? 76;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
          });
          useDiagramStore.getState().updateNode("er-container", {
            position: { x: minX - pad, y: minY - pad - topExtra },
            width: maxX - minX + pad * 2,
            height: maxY - minY + pad * 2 + topExtra,
          });
        }
      }

      // Auto-save the manual layout changes to Supabase immediately
      useDiagramStore.getState().saveLayoutToSupabase();
    },
    [diagramType],
  );

  return (
    <div className="flex-1 bg-bg relative h-1/3 md:h-full flex flex-col min-h-[300px] md:min-h-0 border-x border-border/80">
      <div className="absolute top-4 left-4 z-10 bg-panel/80 backdrop-blur-md shadow-lg rounded-md px-3 py-1.5 border border-border/50 flex items-center gap-2">
        <span className="text-sm font-medium text-neutral flex items-center gap-2">
          Visual Canvas
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        </span>
      </div>

      <TopToolbar />

      {error ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-bg/80 backdrop-blur-sm">
          <div className="bg-error/20 text-error p-4 rounded-lg shadow-xl max-w-md border border-error/50">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="animate-spin" />
              Render Error
            </h3>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        </div>
      ) : null}

      {isLayouting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/40 backdrop-blur-[2px] pointer-events-none">
          <div className="bg-panel/90 text-neutral px-4 py-3 rounded-lg shadow-xl border border-border/50 flex items-center gap-3">
            <RefreshCw size={16} className="animate-spin text-indigo-400" />
            <span className="text-sm font-medium">Computing layout…</span>
          </div>
        </div>
      )}

      <div className="flex-1 w-full h-full" ref={flowWrapperRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          deleteKeyCode={["Delete", "Backspace"]}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnDrag={activeTool === "pan"}
          selectionOnDrag={activeTool === "cursor"}
          panActivationKeyCode="Space"
          selectionMode={SelectionMode.Partial}
          connectionMode={ConnectionMode.Loose}
          minZoom={0.1}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#94a3b8",
            },
          }}
        >
          {!isExporting && (
            <MiniMap
              className="bg-panel! border-border/80! rounded-md shadow-lg"
              maskColor="rgba(0,0,0,0.3)"
              nodeColor="var(--primary)"
            />
          )}
          {!isExporting && (
            <Controls
              showInteractive={true}
              className="[&>button]:bg-panel! [&>button]:border-b-border! [&>button]:fill-neutral! hover:[&>button]:bg-border! shadow-lg border border-border rounded-md overflow-hidden"
            />
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export const PaneCenterCanvas = () => {
  return (
    <ReactFlowProvider>
      <PaneCenterCanvasInner />
    </ReactFlowProvider>
  );
};
