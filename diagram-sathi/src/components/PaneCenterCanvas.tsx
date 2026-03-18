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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useDiagramStore,
  type DfdNode,
  type DfdEdge,
} from "../store/useDiagramStore";
import { RefreshCw, Download, Droplet } from "lucide-react";
import { toPng } from "html-to-image";

// --- Custom Nodes for DFD Symbols --- //

const HandleStyles = {
  className: "w-2 h-2 bg-slate-400 border-2 border-white",
};

const EntityNode = ({ data }: NodeProps<Node>) => (
  <div className="bg-white border-2 border-indigo-200 shadow-lg min-w-[120px] rounded-md text-center overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5">
    <div className="bg-indigo-50 border-b border-indigo-100 py-1.5 px-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider">
      Entity
    </div>
    <Handle type="target" position={Position.Top} {...HandleStyles} />
    <Handle
      type="target"
      position={Position.Left}
      {...HandleStyles}
      id="left-t"
    />
    <div className="px-4 py-4 text-sm font-bold text-slate-700 bg-white">
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

const ProcessNode = ({ data }: NodeProps<Node>) => (
  <div className="bg-white border-2 border-amber-200 shadow-lg min-w-[120px] min-h-[120px] rounded-full flex flex-col items-center justify-center text-center overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 relative">
    <div className="absolute top-2 w-full text-[10px] font-bold text-amber-600 uppercase tracking-widest opacity-80">
      Process
    </div>
    <Handle type="target" position={Position.Top} {...HandleStyles} />
    <Handle
      type="target"
      position={Position.Left}
      {...HandleStyles}
      id="left-t"
    />
    <div className="px-3 py-2 text-sm font-bold text-slate-700 wrap-break-words max-w-[100px] mt-2 z-10">
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

const DatastoreNode = ({ data }: NodeProps<Node>) => (
  <div className="bg-white border-y-2 border-r-2 border-emerald-200 shadow-lg min-w-[130px] rounded-r-md text-center relative flex transition-all hover:shadow-xl hover:-translate-y-0.5">
    {/* Open left end to simulate a database cylinder in 2D DFD */}
    <div className="w-3 border-l-2 border-emerald-200 bg-emerald-50 rounded-l-sm"></div>
    <div className="w-1 border-r border-emerald-100 bg-white"></div>

    <Handle type="target" position={Position.Top} {...HandleStyles} />
    <Handle
      type="target"
      position={Position.Left}
      {...HandleStyles}
      id="left-t"
    />

    <div className="flex-1 flex flex-col py-2 px-3">
      <div className="text-[10px] text-left font-bold text-emerald-600 uppercase tracking-wide mb-1">
        Datastore
      </div>
      <div className="text-sm text-left font-bold text-slate-700">
        {String(data.label)}
      </div>
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

const nodeTypes = {
  entity: EntityNode,
  process: ProcessNode,
  datastore: DatastoreNode,
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

  const handleExport = useCallback((transparent: boolean) => {
    if (!flowWrapperRef.current) return;
    const flowEl = flowWrapperRef.current.querySelector(
      ".react-flow",
    ) as HTMLElement;
    if (!flowEl) return;

    const filter = (node: HTMLElement) => {
      // Exclude the controls from the exported image
      if (node?.classList?.contains("react-flow__controls")) {
        return false;
      }
      return true;
    };

    toPng(flowEl, {
      backgroundColor: transparent ? "transparent" : "#f8fafc",
      width: flowEl.offsetWidth,
      height: flowEl.offsetHeight,
      style: {
        width: flowEl.offsetWidth.toString() + "px",
        height: flowEl.offsetHeight.toString() + "px",
      },
      filter: filter,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `diagram-${transparent ? "transparent" : "bg"}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to export diagram", err);
      });
  }, []);

  // Sync AST -> React Flow Canvas (Reacting to external form / code edits)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);

      const rfNodes: Node[] = astNodes.map((n: DfdNode, index: number) => ({
        id: n.id,
        type: n.type, // maps to our custom nodeTypes
        position: n.position || { x: 50 + index * 150, y: 100 }, // Fallback arranging
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
          stroke: "#64748b",
          strokeWidth: 2,
          strokeDasharray: diagramType === "er" ? "5 5" : "0",
        },
        labelStyle: { fill: "#475569", fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
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
    <div className="flex-1 bg-slate-50 relative h-1/3 md:h-full flex flex-col min-h-[300px] md:min-h-0">
      <div className="absolute top-4 left-4 z-10 bg-white shadow-sm rounded-md px-3 py-1.5 border border-slate-200 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
          Visual Canvas
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => handleExport(false)}
          className="bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-md px-3 py-1.5 border border-slate-200 text-sm font-medium flex items-center gap-2 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          title="Export as PNG with background"
        >
          <Download size={16} className="text-indigo-600" />
          Export PNG
        </button>
        <button
          onClick={() => handleExport(true)}
          className="bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-md px-3 py-1.5 border border-slate-200 text-sm font-medium flex items-center gap-2 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          title="Export as PNG with transparent background"
        >
          <Droplet size={16} className="text-cyan-600" />
          Transparent
        </button>
      </div>

      {error ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-white/80 backdrop-blur-sm">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-md max-w-md border border-red-200">
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
          <Background color="#cbd5e1" gap={16} />
          <Controls
            showInteractive={true}
            className="bg-white shadow-md border-slate-200 rounded-md overflow-hidden"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
