import { useEffect, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useInternalNode,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type InternalNode,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
  type Connection,
  addEdge as rfAddEdge,
  NodeResizer,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useDiagramStore,
  type DfdNode,
  type DfdEdge,
} from "../store/useDiagramStore";
import { RefreshCw } from "lucide-react";
import { getLayoutedElements } from "../utils/layoutGraph";

// --- Custom Floating Edge Logic --- //

// Helper to find the best cardinal position (Top, Bottom, Left, Right)
// between two nodes based on their centers.
function getEdgeParams(source: InternalNode, target: InternalNode) {
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

  let sourcePos = Position.Bottom;
  let targetPos = Position.Top;

  // Determine cardinal directions based on the vector between centers
  if (Math.abs(dx) > Math.abs(dy)) {
    sourcePos = dx > 0 ? Position.Right : Position.Left;
    targetPos = dx > 0 ? Position.Left : Position.Right;
  } else {
    sourcePos = dy > 0 ? Position.Bottom : Position.Top;
    targetPos = dy > 0 ? Position.Top : Position.Bottom;
  }

  // Calculate coordinates of the center point of the chosen side
  const getSideCenter = (node: InternalNode, pos: Position) => {
    const { x, y } = node.internals.positionAbsolute;
    const w = node.measured.width ?? 0;
    const h = node.measured.height ?? 0;

    switch (pos) {
      case Position.Top:
        return { x: x + w / 2, y };
      case Position.Bottom:
        return { x: x + w / 2, y: y + h };
      case Position.Left:
        return { x, y: y + h / 2 };
      case Position.Right:
        return { x: x + w, y: y + h / 2 };
    }
  };

  const { x: sx, y: sy } = getSideCenter(source, sourcePos);
  const { x: tx, y: ty } = getSideCenter(target, targetPos);

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
}: EdgeProps) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );

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
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              padding: "4px 4px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
              background: "#1e293b",
              color: "#e2e8f0",
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// --- Custom Nodes for DFD Symbols --- //

const handleClass =
  "!w-2 !h-2 !bg-[#6366f1] !border-2 !border-slate-800 !opacity-0 group-hover:!opacity-100 transition-opacity";

const renderHandles = (offsets?: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}) => (
  <>
    <Handle
      type="source"
      position={Position.Top}
      id="top-source"
      className={handleClass}
      style={offsets?.top ? { top: offsets.top, bottom: "auto" } : undefined}
    />
    <Handle
      type="target"
      position={Position.Top}
      id="top-target"
      className={handleClass}
      style={offsets?.top ? { top: offsets.top, bottom: "auto" } : undefined}
    />

    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom-source"
      className={handleClass}
      style={
        offsets?.bottom ? { bottom: offsets.bottom, top: "auto" } : undefined
      }
    />
    <Handle
      type="target"
      position={Position.Bottom}
      id="bottom-target"
      className={handleClass}
      style={
        offsets?.bottom ? { bottom: offsets.bottom, top: "auto" } : undefined
      }
    />

    <Handle
      type="source"
      position={Position.Left}
      id="left-source"
      className={handleClass}
      style={offsets?.left ? { left: offsets.left, right: "auto" } : undefined}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="left-target"
      className={handleClass}
      style={offsets?.left ? { left: offsets.left, right: "auto" } : undefined}
    />

    <Handle
      type="source"
      position={Position.Right}
      id="right-source"
      className={handleClass}
      style={
        offsets?.right ? { right: offsets.right, left: "auto" } : undefined
      }
    />
    <Handle
      type="target"
      position={Position.Right}
      id="right-target"
      className={handleClass}
      style={
        offsets?.right ? { right: offsets.right, left: "auto" } : undefined
      }
    />
  </>
);

const svgPathClasses =
  "fill-slate-800 stroke-[#6366f1] stroke-2 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-shadow";

const RectangleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full relative group flex items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) =>
          updateNode(id, { width, height })
        }
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="4"
          className={svgPathClasses}
        />
      </svg>
      <div className="px-4 py-2 text-sm font-bold text-slate-200 z-10 wrap-break-word relative text-center pointer-events-none">
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const SquareNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full aspect-square relative group flex items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => {
          const size = Math.max(width, height);
          updateNode(id, { width: size, height: size });
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="4"
          className={svgPathClasses}
        />
      </svg>
      <div className="px-3 py-2 text-sm font-bold text-slate-200 wrap-break-word z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const CircleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full aspect-square relative group flex items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => {
          const size = Math.max(width, height);
          updateNode(id, { width: size, height: size });
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle cx="50" cy="50" r="48" className={svgPathClasses} />
      </svg>
      <div className="px-4 py-2 text-sm font-bold text-slate-200 wrap-break-word z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const DiamondNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full aspect-square relative group flex items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => {
          const size = Math.max(width, height);
          updateNode(id, { width: size, height: size });
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon points="50,2 98,50 50,98 2,50" className={svgPathClasses} />
      </svg>
      <div className="px-6 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-[80%] z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      {/* Aligning handles strictly with Tip polygon points */}
      {renderHandles({ top: "2%", bottom: "2%", left: "2%", right: "2%" })}
    </div>
  );
};

const ParallelogramNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full relative group flex items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) =>
          updateNode(id, { width, height })
        }
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon points="20,2 98,2 80,98 2,98" className={svgPathClasses} />
      </svg>
      <div className="px-6 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-[80%] z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      {renderHandles({ left: "11%", right: "11%" })}
    </div>
  );
};

const HexagonNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full relative group flex items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) =>
          updateNode(id, { width, height })
        }
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="15,2 85,2 98,50 85,98 15,98 2,50"
          className={svgPathClasses}
        />
      </svg>
      <div className="px-8 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-[80%] z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      {renderHandles({ left: "2%", right: "2%" })}
    </div>
  );
};

const CylinderNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="w-full h-full relative group flex flex-col items-center justify-center">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={80}
        onResizeEnd={(_, { width, height }) =>
          updateNode(id, { width, height })
        }
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 5,15 V 85 A 45,10 0 0 0 95,85 V 15 A 45,10 0 0 1 5,15 Z"
          fill="#1e293b"
          stroke="#6366f1"
          strokeWidth="2"
          className="opacity-90 transition-all group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        />
        <path
          d="M 5,15 A 45,10 0 1 1 95,15 A 45,10 0 1 1 5,15 Z"
          fill="#1e293b"
          stroke="#6366f1"
          strokeWidth="2"
          className="opacity-90 transition-all"
        />
      </svg>
      <div className="px-4 py-4 mt-2 text-sm font-bold text-slate-200 wrap-break-word max-w-[80%] z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      {renderHandles({ top: "15%", bottom: "5%", left: "5%", right: "5%" })}
    </div>
  );
};

const nodeTypes = {
  rectangle: RectangleNode,
  square: SquareNode,
  circle: CircleNode,
  diamond: DiamondNode,
  parallelogram: ParallelogramNode,
  hexagon: HexagonNode,
  cylinder: CylinderNode,
};

const edgeTypes = {
  smoothstep: FloatingSmoothStepEdge,
};

// ========================
// CANVAS INNER COMPONENT
// ========================

const PaneCenterCanvasInner = () => {
  const astNodes = useDiagramStore((s) => s.nodes);
  const astEdges = useDiagramStore((s) => s.edges);
  const diagramType = useDiagramStore((s) => s.diagramType);
  const layoutVersion = useDiagramStore((s) => s.layoutVersion);
  const storeAddEdge = useDiagramStore((s) => s.addEdge);

  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

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

      let rfNodes: Node[] = astNodes.map((n: DfdNode, index: number) => ({
        id: n.id,
        type: n.type,
        position: n.position || { x: 50 + index * 200, y: 100 },
        width:
          n.width ||
          (n.type === "circle" || n.type === "square" || n.type === "diamond"
            ? 140
            : 180),
        height:
          n.height ||
          (n.type === "circle" || n.type === "square" || n.type === "diamond"
            ? 140
            : 60),
        data: { label: n.label },
        draggable: true,
      }));

      let rfEdges: Edge[] = astEdges.map((e: DfdEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep", // Resolves to FloatingSmoothStepEdge component
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
        },
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      }));

      // Only run Dagre if layout is clean
      if (layoutAppliedRef.current === false) {
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(rfNodes, rfEdges, {
            direction: diagramType === "er" ? "LR" : "TB",
          });

        rfNodes = layoutedNodes;
        rfEdges = layoutedEdges;
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
    fitView,
    setNodes,
    setEdges,
  ]);

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

  return (
    <div className="flex-1 bg-slate-900/40 backdrop-blur-md relative h-1/3 md:h-full flex flex-col min-h-[300px] md:min-h-0 border-x border-slate-800/50">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md shadow-lg rounded-md px-3 py-1.5 border border-slate-700/50 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
          Visual Canvas
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        </span>
      </div>

      {error ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-red-950/80 text-red-400 p-4 rounded-lg shadow-xl max-w-md border border-red-900/50">
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

      <div className="flex-1 w-full h-full" ref={flowWrapperRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
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
          <Background color="#334155" gap={16} />
          <Controls
            showInteractive={true}
            className="[&>button]:bg-slate-900! [&>button]:border-b-slate-800! [&>button]:fill-slate-300! hover:[&>button]:bg-slate-800! shadow-lg border border-slate-800 rounded-md overflow-hidden"
          />
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
