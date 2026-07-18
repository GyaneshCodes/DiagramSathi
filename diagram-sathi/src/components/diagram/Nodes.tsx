import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useTheme } from "../../context/ThemeContext";
import { getDiagramThemeStyles } from "../../utils/diagramThemes";

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

export const useDiagramNodeStyles = (data: any) => {
  const diagramTheme = useDiagramStore((state) => state.diagramTheme);
  const { theme: appTheme } = useTheme();
  
  const customColor = (data.color as string) || "#6366f1";
  const defaultFillColor = appTheme === "light" ? "#ffffff" : "#1e293b";
  const customFillColor = (data.fillColor as string) || defaultFillColor;
  
  const themeStyles = getDiagramThemeStyles(diagramTheme, appTheme);
  
  if (themeStyles) {
    const textColorClass = themeStyles.textColor === "#ffffff" ? "text-slate-200" : (themeStyles.textColor === "#000000" ? "text-slate-950" : getContrastTextColor(themeStyles.fillColor, appTheme));
    return {
      color: themeStyles.borderColor,
      fillColor: themeStyles.fillColor,
      textColorClass,
    };
  }
  
  return {
    color: customColor,
    fillColor: customFillColor,
    textColorClass: getContrastTextColor(customFillColor, appTheme),
  };
};

const handleClass =
  "!w-2 !h-2 !bg-[#6366f1] !border-2 !border-slate-800 !opacity-0 pointer-events-none";

export const renderHandles = (offsets?: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}) => (
  <>
    {/* TOP handles */}
    <Handle
      type="source"
      position={Position.Top}
      id="top-source-0"
      className={handleClass}
      style={{ left: "calc(50% - 18px)", top: offsets?.top ?? 0, bottom: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Top}
      id="top-target-0"
      className={handleClass}
      style={{ left: "calc(50% - 18px)", top: offsets?.top ?? 0, bottom: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Top}
      id="top-source-1"
      className={handleClass}
      style={{ left: "50%", top: offsets?.top ?? 0, bottom: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Top}
      id="top-target-1"
      className={handleClass}
      style={{ left: "50%", top: offsets?.top ?? 0, bottom: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Top}
      id="top-source-2"
      className={handleClass}
      style={{ left: "calc(50% + 18px)", top: offsets?.top ?? 0, bottom: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Top}
      id="top-target-2"
      className={handleClass}
      style={{ left: "calc(50% + 18px)", top: offsets?.top ?? 0, bottom: "auto" }}
    />

    {/* BOTTOM handles */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom-source-0"
      className={handleClass}
      style={{ left: "calc(50% - 18px)", bottom: offsets?.bottom ?? 0, top: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Bottom}
      id="bottom-target-0"
      className={handleClass}
      style={{ left: "calc(50% - 18px)", bottom: offsets?.bottom ?? 0, top: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom-source-1"
      className={handleClass}
      style={{ left: "50%", bottom: offsets?.bottom ?? 0, top: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Bottom}
      id="bottom-target-1"
      className={handleClass}
      style={{ left: "50%", bottom: offsets?.bottom ?? 0, top: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom-source-2"
      className={handleClass}
      style={{ left: "calc(50% + 18px)", bottom: offsets?.bottom ?? 0, top: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Bottom}
      id="bottom-target-2"
      className={handleClass}
      style={{ left: "calc(50% + 18px)", bottom: offsets?.bottom ?? 0, top: "auto" }}
    />

    {/* LEFT handles */}
    <Handle
      type="source"
      position={Position.Left}
      id="left-source-0"
      className={handleClass}
      style={{ top: "calc(50% - 18px)", left: offsets?.left ?? 0, right: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="left-target-0"
      className={handleClass}
      style={{ top: "calc(50% - 18px)", left: offsets?.left ?? 0, right: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Left}
      id="left-source-1"
      className={handleClass}
      style={{ top: "50%", left: offsets?.left ?? 0, right: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="left-target-1"
      className={handleClass}
      style={{ top: "50%", left: offsets?.left ?? 0, right: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Left}
      id="left-source-2"
      className={handleClass}
      style={{ top: "calc(50% + 18px)", left: offsets?.left ?? 0, right: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="left-target-2"
      className={handleClass}
      style={{ top: "calc(50% + 18px)", left: offsets?.left ?? 0, right: "auto" }}
    />

    {/* RIGHT handles */}
    <Handle
      type="source"
      position={Position.Right}
      id="right-source-0"
      className={handleClass}
      style={{ top: "calc(50% - 18px)", right: offsets?.right ?? 0, left: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Right}
      id="right-target-0"
      className={handleClass}
      style={{ top: "calc(50% - 18px)", right: offsets?.right ?? 0, left: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="right-source-1"
      className={handleClass}
      style={{ top: "50%", right: offsets?.right ?? 0, left: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Right}
      id="right-target-1"
      className={handleClass}
      style={{ top: "50%", right: offsets?.right ?? 0, left: "auto" }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="right-source-2"
      className={handleClass}
      style={{ top: "calc(50% + 18px)", right: offsets?.right ?? 0, left: "auto" }}
    />
    <Handle
      type="target"
      position={Position.Right}
      id="right-target-2"
      className={handleClass}
      style={{ top: "calc(50% + 18px)", right: offsets?.right ?? 0, left: "auto" }}
    />
  </>
);

const svgPathClasses =
  "group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all";

const RectangleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[160px] min-h-[60px] max-w-[400px] max-h-[300px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected && diagramType === "er"}
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
      <div 
        className={`diagram-text-container px-4 py-2 text-sm font-bold ${textColorClass} z-10 whitespace-normal relative text-center pointer-events-none w-full max-w-[90%] ${data.isMeasuring ? "" : "max-h-[80%] overflow-hidden"} break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const SquareNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[120px] min-h-[120px] max-w-[400px] max-h-[400px] aspect-square relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected && diagramType === "er"}
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
      <div 
        className={`diagram-text-container px-4 py-4 text-sm font-bold ${textColorClass} whitespace-normal z-10 text-center pointer-events-none w-full max-w-[70%] ${data.isMeasuring ? "" : "max-h-[70%] overflow-hidden"} break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const CircleNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[130px] min-h-[130px] max-w-[400px] max-h-[400px] aspect-square relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected && diagramType === "er"}
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
      <div 
        className={`diagram-text-container px-4 py-4 text-sm font-bold ${textColorClass} whitespace-normal z-10 text-center pointer-events-none w-full max-w-[70%] ${data.isMeasuring ? "" : "max-h-[70%] overflow-hidden"} break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const DiamondNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[130px] min-h-[130px] max-w-[400px] max-h-[400px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected && diagramType === "er"}
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
      <div 
        className={`diagram-text-container px-2 py-2 text-sm font-bold ${textColorClass} whitespace-normal w-full max-w-[55%] ${data.isMeasuring ? "" : "max-h-[55%] overflow-hidden"} z-10 text-center pointer-events-none leading-tight break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles({ top: "2%", bottom: "2%", left: "2%", right: "2%" })}
    </div>
  );
};

const ParallelogramNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[180px] min-h-[60px] max-w-[450px] max-h-[300px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color={color}
        isVisible={!!selected && diagramType === "er"}
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
      <div 
        className={`diagram-text-container px-4 py-2 text-sm font-bold ${textColorClass} whitespace-normal w-full max-w-[70%] ${data.isMeasuring ? "" : "max-h-[80%] overflow-hidden"} z-10 text-center pointer-events-none break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles({ left: "11%", right: "11%" })}
    </div>
  );
};

const HexagonNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[160px] min-h-[70px] max-w-[400px] max-h-[300px] relative group flex items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color={color}
        isVisible={!!selected && diagramType === "er"}
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
      <div 
        className={`diagram-text-container px-4 py-2 text-sm font-bold ${textColorClass} whitespace-normal w-full max-w-[75%] ${data.isMeasuring ? "" : "max-h-[80%] overflow-hidden"} z-10 text-center pointer-events-none break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles({ left: "2%", right: "2%" })}
    </div>
  );
};

const CylinderNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[160px] min-h-[80px] max-w-[400px] max-h-[400px] relative group flex flex-col items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected && diagramType === "er"}
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
          className="opacity-90 transition-all group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
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
      <div 
        className={`diagram-text-container px-4 py-2 mt-4 text-sm font-bold ${textColorClass} whitespace-normal w-full max-w-[80%] ${data.isMeasuring ? "" : "max-h-[65%] overflow-hidden"} z-10 text-center pointer-events-none break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles({ top: "15%", bottom: "5%", left: "5%", right: "5%" })}
    </div>
  );
};

const StadiumNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div
      className="w-full h-full min-w-[140px] min-h-[60px] max-w-[400px] max-h-[300px] relative group flex items-center justify-center rounded-full"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: fillColor === "transparent" ? "transparent" : fillColor,
        border: `2px solid ${color}`,
      }}
    >
      <NodeResizer
        color="#6366f1"
        isVisible={!!selected && diagramType === "er"}
        minWidth={140}
        minHeight={60}
        maxWidth={400}
        maxHeight={300}
        onResizeEnd={(_, { width, height }) =>
          updateNode(id, { width, height })
        }
      />
      <div 
        className={`diagram-text-container px-4 py-2 text-sm font-bold ${textColorClass} z-10 whitespace-normal relative text-center pointer-events-none w-full max-w-[90%] ${data.isMeasuring ? "" : "max-h-[80%] overflow-hidden"} break-words flex items-center justify-center`}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontBold === undefined ? undefined : (fontBold ? "bold" : "normal"),
          fontStyle: fontItalic ? "italic" : "normal",
        }}
      >
        {String(data.label)}
      </div>
      {renderHandles()}
    </div>
  );
};

const GroupNode = () => {
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
  stadium: StadiumNode,
  group: GroupNode,
  process: ProcessNode,
  entity: EntityNode,
  datastore: DataStoreNode,
  "er-schema": ErSchemaNode,
  "er-container": ErContainerNode,
};
