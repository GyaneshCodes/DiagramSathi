import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useTheme } from "../../context/ThemeContext";

// Helper to determine text color (light or dark) based on background hex color
export const getContrastTextColor = (hexColor: string, appTheme: "dark" | "light" = "dark") => {
  if (!hexColor || hexColor === "transparent") {
    return appTheme === "light" ? "text-slate-900" : "text-slate-200";
  }

  const hex = hexColor.replace("#", "");
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return appTheme === "light" ? "text-slate-900" : "text-slate-200";
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "text-slate-900" : "text-slate-200";
};

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
  "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-shadow";

export const RectangleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[160px] min-h-[60px] max-w-[400px] max-h-[300px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected}
        minWidth={160}
        minHeight={60}
        maxWidth={400}
        maxHeight={300}
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
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className={svgPathClasses}
        />
      </svg>
      <div className={`px-6 py-4 text-sm font-bold ${textColorClass} z-10 whitespace-normal relative text-center pointer-events-none max-w-[260px]`}>
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

export const SquareNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[120px] min-h-[120px] max-w-[400px] max-h-[400px] aspect-square relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected}
        minWidth={120}
        minHeight={120}
        maxWidth={400}
        maxHeight={400}
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
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className={svgPathClasses}
        />
      </svg>
      <div className={`px-6 py-6 text-sm font-bold ${textColorClass} whitespace-normal z-10 text-center pointer-events-none max-w-[240px]`}>
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

export const CircleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[130px] min-h-[130px] max-w-[400px] max-h-[400px] aspect-square relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected}
        minWidth={130}
        minHeight={130}
        maxWidth={400}
        maxHeight={400}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => {
          const size = Math.max(width, height);
          updateNode(id, { width: size, height: size });
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className={svgPathClasses}
        />
      </svg>
      <div className={`px-8 py-8 text-sm font-bold ${textColorClass} whitespace-normal z-10 text-center pointer-events-none max-w-[240px]`}>
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

export const DiamondNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[130px] min-h-[130px] max-w-[400px] max-h-[400px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected}
        minWidth={130}
        minHeight={130}
        maxWidth={400}
        maxHeight={400}
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
          points="50,2 98,50 50,98 2,50"
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className={svgPathClasses}
        />
      </svg>
      <div className={`px-12 py-12 text-sm font-bold ${textColorClass} whitespace-normal max-w-[85%] z-10 text-center pointer-events-none leading-tight`}>
        {String(data.label)}
      </div>
      {renderHandles({ top: "2%", bottom: "2%", left: "2%", right: "2%" })}
    </div>
  );
};

export const ParallelogramNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[180px] min-h-[60px] max-w-[450px] max-h-[300px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color={color}
        isVisible={!!selected}
        minWidth={180}
        minHeight={60}
        maxWidth={450}
        maxHeight={300}
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
          points="20,2 98,2 80,98 2,98"
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className={svgPathClasses}
        />
      </svg>
      <div className={`px-10 py-4 text-sm font-bold ${textColorClass} whitespace-normal max-w-[85%] z-10 text-center pointer-events-none`}>
        {String(data.label)}
      </div>
      {renderHandles({ left: "11%", right: "11%" })}
    </div>
  );
};

export const HexagonNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[160px] min-h-[70px] max-w-[400px] max-h-[300px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color={color}
        isVisible={!!selected}
        minWidth={160}
        minHeight={70}
        maxWidth={400}
        maxHeight={300}
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
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className={svgPathClasses}
        />
      </svg>
      <div className={`px-12 py-4 text-sm font-bold ${textColorClass} whitespace-normal max-w-[85%] z-10 text-center pointer-events-none`}>
        {String(data.label)}
      </div>
      {renderHandles({ left: "2%", right: "2%" })}
    </div>
  );
};

export const CylinderNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div
      className="w-full h-full min-w-[160px] min-h-[80px] max-w-[400px] max-h-[400px] relative group flex flex-col items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected}
        minWidth={160}
        minHeight={80}
        maxWidth={400}
        maxHeight={400}
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
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className="opacity-90 transition-all group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        />
        <path
          d="M 5,15 A 45,10 0 1 1 95,15 A 45,10 0 1 1 5,15 Z"
          fill={fillColor}
          fillOpacity={fillColor === "transparent" ? 0 : 1}
          stroke={color}
          strokeWidth="2"
          className="opacity-90 transition-all"
        />
      </svg>
      <div className={`px-8 py-6 mt-2 text-sm font-bold ${textColorClass} whitespace-normal max-w-[85%] z-10 text-center pointer-events-none`}>
        {String(data.label)}
      </div>
      {renderHandles({ top: "15%", bottom: "5%", left: "5%", right: "5%" })}
    </div>
  );
};

export const GroupNode = () => {
  return (
    <div className="w-full h-full relative pointer-events-none opacity-0">
      {/* Completely invisible grouping container */}
    </div>
  );
};

import { ProcessNode } from "./ProcessNode";
import { EntityNode } from "./EntityNode";
import { DataStoreNode } from "./DataStoreNode";
import { ErSchemaNode } from "./ErSchemaNode";
import { ErContainerNode } from "./ErContainerNode";

export const nodeTypes = {
  rectangle: RectangleNode,
  square: SquareNode,
  circle: CircleNode,
  diamond: DiamondNode,
  parallelogram: ParallelogramNode,
  hexagon: HexagonNode,
  cylinder: CylinderNode,
  group: GroupNode,
  process: ProcessNode,
  entity: EntityNode,
  datastore: DataStoreNode,
  "er-schema": ErSchemaNode,
  "er-container": ErContainerNode,
};
