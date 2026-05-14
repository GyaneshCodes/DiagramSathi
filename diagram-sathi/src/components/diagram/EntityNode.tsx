import { Handle, Position, NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";

export const EntityNode = ({ data, id, selected }: NodeProps<Node>) => {
  const updateNode = useDiagramStore((state) => state.updateNode);

  return (
    <div className="relative group flex items-center justify-center bg-white border border-black"
         style={{ 
           width: '100%', 
           height: '100%',
           minWidth: '120px',
           minHeight: '60px'
         }}>
      <NodeResizer
        color="#000"
        isVisible={!!selected}
        minWidth={120}
        minHeight={60}
        onResizeEnd={(_, { width, height }) => updateNode(id, { width, height })}
      />
      
      <div className="px-4 py-2 text-sm text-black text-center whitespace-normal max-w-[150px]">
        {String(data.label)}
      </div>

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-1 !h-1 !bg-black !border-0"
        style={{ top: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-1 !h-1 !bg-black !border-0"
        style={{ right: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-1 !h-1 !bg-black !border-0"
        style={{ bottom: 0 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-1 !h-1 !bg-black !border-0"
        style={{ left: 0 }}
      />
    </div>
  );
};
