/**
 * Async ELK layout engine for DFD diagrams.
 *
 * Maps DfdNode/DfdEdge arrays to ELK's JSON graph format,
 * runs the layered algorithm, and writes computed positions back.
 *
 * Key features:
 *  - Generates explicit ports per edge connection so ELK can
 *    distribute arrows across all four sides of a node.
 *  - Extracts full routing data (startPoint → bendPoints → endPoint)
 *    from ELK's section output for pixel-perfect polyline rendering.
 */

import ELK, { type ElkNode, type ElkExtendedEdge, type ElkPort } from 'elkjs/lib/elk.bundled.js';
import type { DfdNode, DfdEdge } from '../store/useDiagramStore';
import { getElkConfig, getNodeDimensions } from './layoutConfiguration';

const elk = new ELK();


export async function applyElkLayout(
  nodes: DfdNode[],
  edges: DfdEdge[],
  direction: 'TB' | 'LR',
  dfdLevel: number,
): Promise<{ nodes: DfdNode[]; edges: DfdEdge[] }> {
  if (nodes.length === 0) return { nodes, edges };

  const elkConfig = getElkConfig(direction, dfdLevel);

  // ── 1. Build port registry ──────────────────────────────────────
  // Each edge connection gets its own unique port on the source and
  // target node. ELK will then distribute these ports along each
  // side, preventing arrow overlap.
  const nodePorts = new Map<string, ElkPort[]>();

  edges.forEach((e) => {
    // Source port
    const srcPortId = `${e.id}_src`;
    if (!nodePorts.has(e.source)) nodePorts.set(e.source, []);
    nodePorts.get(e.source)!.push({
      id: srcPortId,
      layoutOptions: {
        'elk.port.side': 'UNDEFINED',  // Let ELK choose the optimal side
      },
    });

    // Target port
    const tgtPortId = `${e.id}_tgt`;
    if (!nodePorts.has(e.target)) nodePorts.set(e.target, []);
    nodePorts.get(e.target)!.push({
      id: tgtPortId,
      layoutOptions: {
        'elk.port.side': 'UNDEFINED',
      },
    });
  });

  // ── 2. Build ELK children from DfdNodes ─────────────────────────
  const childrenMap = new Map<string, ElkNode>();
  const rootChildren: ElkNode[] = [];

  nodes.forEach((n) => {
    const { width, height } = getNodeDimensions(n.type, n.width, n.height);
    const ports = nodePorts.get(n.id) || [];

    const elkNode: ElkNode = {
      id: n.id,
      width: n.type === 'group' ? undefined : width,
      height: n.type === 'group' ? undefined : height,
      ports,
      layoutOptions: n.type === 'group'
        ? {
            'elk.direction': 'DOWN',
            'elk.padding': '[top=40,left=40,bottom=40,right=40]',
          }
        : {
            // Allow ELK to freely assign ports to any side
            'elk.portConstraints': 'FIXED_SIDE',
          },
    };
    childrenMap.set(n.id, elkNode);
  });

  nodes.forEach((n) => {
    const elkNode = childrenMap.get(n.id)!;
    if (n.parentId && childrenMap.has(n.parentId)) {
      const parentElkNode = childrenMap.get(n.parentId)!;
      if (!parentElkNode.children) {
        parentElkNode.children = [];
      }
      parentElkNode.children.push(elkNode);
    } else {
      rootChildren.push(elkNode);
    }
  });

  // ── 3. Build ELK edges with port references ─────────────────────
  const elkEdges: ElkExtendedEdge[] = edges.map((e) => ({
    id: e.id,
    sources: [`${e.id}_src`],
    targets: [`${e.id}_tgt`],
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: elkConfig,
    children: rootChildren,
    edges: elkEdges,
  };

  // ── 4. Run ELK ──────────────────────────────────────────────────
  const layoutedGraph = await elk.layout(graph);

  // ── 5. Extract node positions ───────────────────────────────────
  const positionMap = new Map<string, { x: number; y: number }>();
  const sizeMap = new Map<string, { width: number; height: number }>();

  const extractData = (elkNodes: ElkNode[]) => {
    for (const child of elkNodes) {
      positionMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
      if (child.width !== undefined && child.height !== undefined) {
        sizeMap.set(child.id, { width: child.width, height: child.height });
      }
      if (child.children) {
        extractData(child.children);
      }
    }
  };

  if (layoutedGraph.children) {
    extractData(layoutedGraph.children);
  }

  for (const node of nodes) {
    const pos = positionMap.get(node.id);
    if (pos) {
      node.position = pos;
    }
    const size = sizeMap.get(node.id);
    if (size && node.type === 'group') {
      node.width = size.width;
      node.height = size.height;
    }
  }

  // ── 6. Extract FULL edge routing (startPoint + bends + endPoint) ─
  const edgeDataMap = new Map<string, {
    startPoint: { x: number; y: number };
    bendPoints: { x: number; y: number }[];
    endPoint: { x: number; y: number };
  }>();

  if (layoutedGraph.edges) {
    layoutedGraph.edges.forEach((elkEdge: any) => {
      if (elkEdge.sections && elkEdge.sections.length > 0) {
        const section = elkEdge.sections[0];

        const startPoint = section.startPoint
          ? { x: section.startPoint.x, y: section.startPoint.y }
          : null;
        const endPoint = section.endPoint
          ? { x: section.endPoint.x, y: section.endPoint.y }
          : null;

        const bendPoints: { x: number; y: number }[] = [];
        if (section.bendPoints) {
          section.bendPoints.forEach((bp: any) => {
            bendPoints.push({ x: bp.x, y: bp.y });
          });
        }

        if (startPoint && endPoint) {
          edgeDataMap.set(elkEdge.id, { startPoint, bendPoints, endPoint });
        }
      }
    });
  }

  const updatedEdges = edges.map(e => {
    const routingData = edgeDataMap.get(e.id);
    if (routingData) {
      return {
        ...e,
        data: {
          ...e.data,
          startPoint: routingData.startPoint,
          bendPoints: routingData.bendPoints,
          endPoint: routingData.endPoint,
        },
      };
    }
    return e;
  });

  return { nodes, edges: updatedEdges };
}
