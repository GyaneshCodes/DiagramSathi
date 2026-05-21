import { Handle, Position, NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useTheme } from "../../context/ThemeContext";
import { getContrastTextColor } from "./Nodes";

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

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-[#6366f1] !border-2 !border-slate-800 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ top: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-[#6366f1] !border-2 !border-slate-800 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ right: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-[#6366f1] !border-2 !border-slate-800 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ bottom: 0 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-[#6366f1] !border-2 !border-slate-800 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ left: 0 }}
      />
    </div>
  );
};
