import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import { nodeTypes } from '../components/diagram/Nodes';
import type { DfdNode } from '../store/useDiagramStore';
import { getNodeDimensions } from './layoutConfiguration';
import { ThemeProvider } from '../context/ThemeContext';

const SAFE_HEIGHT_FRACTIONS: Record<string, number> = {
  rectangle:     0.8,
  square:        0.7,
  circle:        0.7,
  diamond:       0.55,
  parallelogram: 0.8,
  hexagon:       0.8,
  cylinder:      0.65,
  process:       0.7,
  entity:        0.8,
  datastore:     0.8,
  stadium:       0.8,
};

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
      <ThemeProvider>
        <ReactFlowProvider>
          {nodes.map(node => {
            const NodeComponent = nodeTypes[node.type as keyof typeof nodeTypes] || nodeTypes.rectangle;
            const defaultDims = getNodeDimensions(node.type);
            return (
              <div 
                key={node.id} 
                id={`measure-${node.id}`} 
                style={{ 
                  position: 'absolute', 
                  display: 'inline-block',
                  width: `${defaultDims.width}px`,
                }}
                className="react-flow__node"
              >
                <NodeComponent 
                  {...{
                    id: node.id,
                    data: { 
                      label: node.label, 
                      color: node.color, 
                      fontSize: node.fontSize,
                      fontBold: node.fontBold,
                      fontItalic: node.fontItalic,
                      isMeasuring: true 
                    },
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
      </ThemeProvider>
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

          const textEl = domNode.querySelector('.diagram-text-container');
          
          let w = defaultDims.width;
          let h = defaultDims.height;
          
          if (textEl) {
            const textRect = textEl.getBoundingClientRect();
            const textHeight = textRect.height;
            const safeFraction = SAFE_HEIGHT_FRACTIONS[node.type] || 0.8;
            const safeHeightLimit = defaultDims.height * safeFraction;
            
            if (textHeight > safeHeightLimit) {
              const scale = textHeight / safeHeightLimit;
              w = Math.ceil(defaultDims.width * scale);
              h = Math.ceil(defaultDims.height * scale);
            }
          }

          // Enforce square geometry for specific nodes
          if (node.type === 'circle' || node.type === 'diamond' || node.type === 'square' || node.type === 'process') {
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
