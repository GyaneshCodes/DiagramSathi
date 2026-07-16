import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useTheme } from "../../context/ThemeContext";
import { getContrastTextColor, renderHandles } from "./Nodes";

export const ProcessNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const diagramType = useDiagramStore((state) => state.diagramType);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

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
      
      <div className={`px-4 py-4 text-sm font-bold ${textColorClass} text-center whitespace-normal max-w-[150px] z-10 pointer-events-none`}>
        {String(data.label)}
      </div>

      {renderHandles()}
    </div>
  );
};
