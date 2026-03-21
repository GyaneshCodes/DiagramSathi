import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

// Default dimensions used when DOM hasn't measured nodes yet
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;

interface LayoutOptions {
  direction?: "TB" | "LR";
}

/**
 * Computes Dagre-based positions for React Flow nodes.
 * Uses each node's measured `width`/`height` when available,
 * otherwise falls back to sensible defaults so nodes never stack.
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
) => {
  const { direction = "TB" } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 120,
    nodesep: 80,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });

  // Register nodes with real or default dimensions
  nodes.forEach((node) => {
    const w = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const h = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    g.setNode(node.id, { width: w as number, height: h as number });
  });

  // Register edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Apply computed positions back to nodes (dagre returns center coords)
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const w = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const h = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (w as number) / 2,
        y: nodeWithPosition.y - (h as number) / 2,
      },
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
};
