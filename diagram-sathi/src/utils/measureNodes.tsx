import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import { nodeTypes } from '../components/diagram/Nodes';
import type { DfdNode } from '../store/useDiagramStore';
import { getNodeDimensions } from './layoutConfiguration';

/**
 * Headless Measurement Pass
 * 
 * Temporarily mounts React Flow custom nodes off-screen to measure their
 * exact rendered dimensions (accounting for text wrapping, padding, etc.)
 * before passing them to the layout engine.
 */
export async function measureNodes(nodes: DfdNode[]): Promise<DfdNode[]> {
  return new Promise((resolve) => {
    // 1. Setup hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);

    // 2. Render all nodes inside a mock React Flow environment
    const NodesToMeasure = () => (
      <ReactFlowProvider>
        {nodes.map(node => {
          const NodeComponent = nodeTypes[node.type as keyof typeof nodeTypes] || nodeTypes.rectangle;
          return (
            <div 
              key={node.id} 
              id={`measure-${node.id}`} 
              style={{ position: 'absolute', display: 'inline-block' }}
              className="react-flow__node"
            >
              <NodeComponent 
                {...{
                  id: node.id,
                  data: { label: node.label, color: node.color },
                  selected: false,
                  zIndex: 0,
                  isConnectable: true,
                  dragging: false,
                  type: node.type,
                  positionAbsoluteX: 0,
                  positionAbsoluteY: 0,
                } as any}
              />
            </div>
          );
        })}
      </ReactFlowProvider>
    );

    root.render(<NodesToMeasure />);

    // 3. Wait for DOM paint, then measure
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const measuredNodes = nodes.map(node => {
          // Groups don't need dimension measurement, ELK calculates their bounding box
          if (node.type === 'group') return { ...node };

          const domNode = document.getElementById(`measure-${node.id}`);
          const defaultDims = getNodeDimensions(node.type);
          
          if (!domNode) {
            return { ...node, width: defaultDims.width, height: defaultDims.height };
          }

          const rect = domNode.getBoundingClientRect();
          let w = Math.ceil(Math.max(rect.width, defaultDims.width));
          let h = Math.ceil(Math.max(rect.height, defaultDims.height));

          // Enforce square geometry for specific nodes
          if (node.type === 'circle' || node.type === 'diamond' || node.type === 'square') {
            const maxDim = Math.max(w, h);
            w = maxDim;
            h = maxDim;
          }

          return { ...node, width: w, height: h };
        });

        // 4. Cleanup
        root.unmount();
        container.remove();
        resolve(measuredNodes);
      });
    });
  });
}
