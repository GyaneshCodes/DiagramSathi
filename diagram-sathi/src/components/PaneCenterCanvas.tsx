import { useEffect, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  addEdge as rfAddEdge,
  Handle,
  Position,
  type NodeProps,
  NodeResizer,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useDiagramStore,
  type DfdNode,
  type DfdEdge,
} from "../store/useDiagramStore";
import { RefreshCw } from "lucide-react";

// --- Custom Nodes for DFD Symbols --- //

const HandleStyles = {
  className: "w-2 h-2 bg-[#6366f1]! border-2 border-slate-800!",
};

const RectangleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="bg-slate-800 border-2 border-[#6366f1]/50 shadow-lg w-full h-full rounded-md text-center flex flex-col items-center justify-center transition-all hover:shadow-xl hover:shadow-[#6366f1]/10 relative">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <Handle type="target" position={Position.Top} {...HandleStyles} />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
      />
      <div className="px-4 py-2 text-sm font-bold text-slate-200 z-10 wrap-break-word">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
      />
      <Handle type="source" position={Position.Bottom} {...HandleStyles} />
    </div>
  );
};

const SquareNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="bg-slate-800 border-2 border-[#6366f1]/50 shadow-lg w-full h-full rounded-md text-center flex flex-col items-center justify-center transition-all hover:shadow-xl hover:shadow-[#6366f1]/10 relative aspect-square">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <Handle type="target" position={Position.Top} {...HandleStyles} />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
      />
      <div className="px-3 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-full overflow-hidden mt-2 z-10">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
      />
      <Handle type="source" position={Position.Bottom} {...HandleStyles} />
    </div>
  );
};

const CircleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="bg-slate-800 border-2 border-[#6366f1]/50 shadow-lg w-full h-full rounded-full flex flex-col items-center justify-center text-center overflow-hidden transition-all hover:shadow-xl hover:shadow-[#6366f1]/10 relative aspect-square">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <Handle type="target" position={Position.Top} {...HandleStyles} />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
      />
      <div className="px-6 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-full overflow-hidden mt-2 z-10">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
      />
      <Handle type="source" position={Position.Bottom} {...HandleStyles} />
    </div>
  );
};

const DiamondNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="relative flex items-center justify-center w-full h-full transition-all group pointer-events-none">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <div className="absolute inset-2 bg-slate-800 border-2 border-[#6366f1]/50 rotate-45 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-shadow pointer-events-auto"></div>
      <Handle
        type="target"
        position={Position.Top}
        {...HandleStyles}
        className="top-2! bg-[#6366f1]! border-2 border-slate-800! pointer-events-auto"
      />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
        className="left-2! bg-[#6366f1]! border-2 border-slate-800! pointer-events-auto"
      />
      <div className="px-2 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-[80%] z-10 text-center pointer-events-none">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
        className="right-2! bg-[#6366f1]! border-2 border-slate-800! pointer-events-auto"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        {...HandleStyles}
        className="bottom-2! bg-[#6366f1]! border-2 border-slate-800! pointer-events-auto"
      />
    </div>
  );
};

const ParallelogramNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="relative flex items-center justify-center w-full h-full transition-all group">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <div className="absolute inset-x-4 inset-y-0 bg-slate-800 border-2 border-[#6366f1]/50 -skew-x-12 shadow-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-shadow"></div>
      <Handle type="target" position={Position.Top} {...HandleStyles} />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
        className="left-4!"
      />
      <div className="px-6 py-4 text-sm font-bold text-slate-200 wrap-break-word max-w-[80%] z-10 text-center">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
        className="right-4!"
      />
      <Handle type="source" position={Position.Bottom} {...HandleStyles} />
    </div>
  );
};

const HexagonNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="relative flex items-center justify-center w-full h-full transition-all group">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <div
        className="absolute inset-0 bg-[#6366f1]/50 shadow-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-shadow"
        style={{
          clipPath:
            "polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)",
        }}
      ></div>
      <div
        className="absolute inset-[2px] bg-slate-800"
        style={{
          clipPath:
            "polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)",
        }}
      ></div>
      <Handle type="target" position={Position.Top} {...HandleStyles} />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
        className="left-2!"
      />
      <div className="px-8 py-2 text-sm font-bold text-slate-200 wrap-break-word max-w-[70%] z-10 text-center">
        {String(data.label)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
        className="right-2!"
      />
      <Handle type="source" position={Position.Bottom} {...HandleStyles} />
    </div>
  );
};

const CylinderNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  return (
    <div className="relative flex items-center justify-center w-full h-full transition-all group">
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={100}
        minHeight={80}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Cylinder Body & Bottom Cap */}
        <path 
          d="M 5,15 V 85 A 45,10 0 0 0 95,85 V 15 A 45,10 0 0 1 5,15 Z" 
          fill="#1e293b" 
          stroke="#6366f1" 
          strokeWidth="2"
          className="opacity-90 group-hover:stroke-indigo-400 group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all"
        />
        {/* Top Cap Ellipse */}
        <path 
          d="M 5,15 A 45,10 0 1 1 95,15 A 45,10 0 1 1 5,15 Z" 
          fill="#1e293b" 
          stroke="#6366f1" 
          strokeWidth="2"
          className="opacity-90 group-hover:stroke-indigo-400 transition-all"
        />
      </svg>

      <Handle type="target" position={Position.Top} {...HandleStyles} className="top-1! bg-[#6366f1]! border-2 border-slate-800! z-20" />
      <Handle
        type="target"
        position={Position.Left}
        {...HandleStyles}
        id="left-t"
        className="z-20"
      />

      <div className="flex-1 flex flex-col items-center justify-center py-4 px-4 h-full relative z-10">
        <div className="text-sm text-center font-bold text-slate-200 wrap-break-word max-w-[100px] mt-2">
          {String(data.label)}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        {...HandleStyles}
        id="right-s"
        className="z-20"
      />
      <Handle type="source" position={Position.Bottom} {...HandleStyles} className="bottom-1! bg-[#6366f1]! border-2 border-slate-800! z-20" />
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

export const PaneCenterCanvas = () => {
  const {
    nodes: astNodes,
    edges: astEdges,
    diagramType,
    updateNodePosition,
    addEdge: storeAddEdge,
  } = useDiagramStore();
  const [error, setError] = useState<string | null>(null);

  // Native React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const flowWrapperRef = useRef<HTMLDivElement>(null);

  // Sync AST -> React Flow Canvas (Reacting to external form / code edits)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);

      const rfNodes: Node[] = astNodes.map((n: DfdNode, index: number) => ({
        id: n.id,
        type: n.type, // maps to our custom nodeTypes
        position: n.position || { x: 50 + index * 150, y: 100 }, // Fallback arranging
        width: n.width,
        height: n.height,
        data: { label: n.label },
      }));

      const rfEdges: Edge[] = astEdges.map((e: DfdEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: diagramType === "er" ? "straight" : "smoothstep",
        animated: diagramType !== "er",
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
          strokeDasharray: diagramType === "er" ? "5 5" : "0",
        },
        labelStyle: { fill: "#e2e8f0", fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: "#1e293b", fillOpacity: 0.8 },
      }));

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes(rfNodes);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEdges(rfEdges);
    } catch (err: unknown) {
      console.error("Canvas Mapping Error:", err);
      setError("Error mapping AST to Canvas");
    }
  }, [astNodes, astEdges, diagramType, setNodes, setEdges]); // Only depends on AST, not text code

  // Handle Dragging
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, { x: node.position.x, y: node.position.y });
    },
    [updateNodePosition],
  );

  // Optional: Handle adding edges directly from canvas
  const onConnect = useCallback(
    (params: Connection) => {
      // Create new edge in visual first
      setEdges((eds) => rfAddEdge(params, eds));
      // Then sync to store
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
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "smoothstep" }}
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
