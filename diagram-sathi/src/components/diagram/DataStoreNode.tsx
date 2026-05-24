import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useTheme } from "../../context/ThemeContext";
import { getContrastTextColor, renderHandles } from "./Nodes";

export const DataStoreNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);
  const color = (data.color as string) || "#6366f1";
  const fillColor = (data.fillColor as string) || "#1e293b";
  const { theme } = useTheme();
  const textColorClass = getContrastTextColor(fillColor, theme);

  return (
    <div className="relative group flex items-center justify-center transition-all"
         style={{ 
           width: '100%', 
           height: '100%',
           minWidth: '150px',
           minHeight: '60px',
           backgroundColor: fillColor === "transparent" ? "transparent" : fillColor,
           borderTop: `2px solid ${color}`,
           borderBottom: `2px solid ${color}`,
         }}>
      <NodeResizer
        color={color}
        isVisible={!!selected}
        minWidth={150}
        minHeight={60}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      
      <div className={`px-4 py-2 text-sm font-bold ${textColorClass} text-center whitespace-normal max-w-[150px] z-10 pointer-events-none`}>
        {String(data.label)}
      </div>

      {renderHandles()}
    </div>
  );
};
