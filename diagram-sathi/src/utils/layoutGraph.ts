import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import { getNodeDimensions } from "./layoutConfiguration";

// Default dimensions used when DOM hasn't measured nodes yet
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;

interface LayoutOptions {
  direction?: "TB" | "LR";
}

/**
 * Computes Dagre-based positions for React Flow nodes.
 * Supports DFD group containers and flowcharts.
 * Converts absolute layout positions to parent-relative coordinates.
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
) => {
  const { direction = "TB" } = options;

  // Initialize Dagre graph with compound support enabled
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 80, // node row separation
    nodesep: 60,  // node column separation
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });

  // 1. Register nodes in Dagre
  nodes.forEach((node) => {
    const isGroup = node.type === "group";
    if (isGroup) {
      // Do not specify fixed width/height for compound nodes (groups);
      // Dagre will auto-size them based on child nodes and margins.
      g.setNode(node.id, {});
    } else {
      const dims = getNodeDimensions(node.type ?? "rectangle", node.width, node.height);
      g.setNode(node.id, { width: dims.width, height: dims.height });
    }
  });

  // 2. Register parent-child compound associations
  nodes.forEach((node) => {
    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  });

  // 3. Register connections
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run Dagre Layout
  dagre.layout(g);

  // Helper map to quickly read calculated positions/sizes by node ID
  const computedMap = new Map<string, { x: number; y: number; width?: number; height?: number }>();
  nodes.forEach((node) => {
    const data = g.node(node.id);
    if (data) {
      computedMap.set(node.id, {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      });
    }
  });

  // 4. Apply positions and dimensions back to nodes (converting to relative coords if nested)
  const layoutedNodes = nodes.map((node) => {
    const calculated = computedMap.get(node.id);
    if (!calculated) return node;

    const isGroup = node.type === "group";
    const w = isGroup ? (calculated.width ?? DEFAULT_NODE_WIDTH) : (node.width ?? getNodeDimensions(node.type ?? "rectangle", node.width, node.height).width);
    const h = isGroup ? (calculated.height ?? DEFAULT_NODE_HEIGHT) : (node.height ?? getNodeDimensions(node.type ?? "rectangle", node.width, node.height).height);

    // Compute absolute left & top coordinates (Dagre returns centers)
    const absoluteLeft = calculated.x - w / 2;
    const absoluteTop = calculated.y - h / 2;

    let posX = absoluteLeft;
    let posY = absoluteTop;

    // Convert to relative coordinates if this node is inside a parent container
    if (node.parentId) {
      const parentCalculated = computedMap.get(node.parentId);
      if (parentCalculated && parentCalculated.width && parentCalculated.height) {
        const parentLeft = parentCalculated.x - parentCalculated.width / 2;
        const parentTop = parentCalculated.y - parentCalculated.height / 2;
        
        posX = absoluteLeft - parentLeft;
        posY = absoluteTop - parentTop;
      }
    }

    return {
      ...node,
      width: w,
      height: h,
      position: { x: posX, y: posY },
      // Apply style dimensions directly for DFD groups so React Flow sizes the container bounds
      ...(isGroup ? { style: { ...node.style, width: w, height: h } } : {}),
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
};
