import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { renderHandles, useDiagramNodeStyles } from "./Nodes";

export const ProcessNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div className="relative group flex items-center justify-center rounded-full transition-all"
         style={{ 
           width: '100%', 
           height: '100%',
           minWidth: '100px',
           minHeight: '100px',
           backgroundColor: fillColor === "transparent" ? "transparent" : fillColor,
           border: `2px solid ${color}`,
         }}>
      <NodeResizer
        color={color}
        isVisible={!!selected && diagramType === "er"}
        minWidth={100}
        minHeight={100}
        keepAspectRatio
        onResizeEnd={(_, { width, height }) => {
          const size = Math.max(width, height);
          updateNode(id, { width: size, height: size });
        }}
      />
      
      <div 
        className={`diagram-text-container px-2 py-2 text-sm font-bold ${textColorClass} text-center whitespace-normal w-full max-w-[70%] ${data.isMeasuring ? "" : "max-h-[70%] overflow-hidden"} z-10 pointer-events-none break-words flex items-center justify-center`}
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
