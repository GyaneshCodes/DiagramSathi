import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { renderHandles, useDiagramNodeStyles } from "./Nodes";

export const EntityNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const { color, fillColor, textColorClass } = useDiagramNodeStyles(data);
  const fontSize = data.fontSize as number | undefined;
  const fontBold = data.fontBold as boolean | undefined;
  const fontItalic = data.fontItalic as boolean | undefined;

  return (
    <div className="relative group flex items-center justify-center transition-all rounded"
         style={{ 
           width: '100%', 
           height: '100%',
           minWidth: '120px',
           minHeight: '60px',
           backgroundColor: fillColor === "transparent" ? "transparent" : fillColor,
           border: `2px solid ${color}`,
         }}>
      <NodeResizer
        color={color}
        isVisible={!!selected && diagramType === "er"}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      
      <div 
        className={`diagram-text-container px-4 py-2 text-sm font-bold ${textColorClass} text-center whitespace-normal w-full max-w-[90%] ${data.isMeasuring ? "" : "max-h-[80%] overflow-hidden"} z-10 pointer-events-none break-words flex items-center justify-center`}
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
