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

  // ── 1. Build ELK children from DfdNodes ─────────────────────────
  const childrenMap = new Map<string, ElkNode>();
  const rootChildren: ElkNode[] = [];

  nodes.forEach((n) => {
    const { width, height } = getNodeDimensions(n.type, n.width, n.height);
    
    const isGroup = n.type === 'group';
    
    // Inject 12 ports for every non-group node to support up to 3 parallel connections on each face
    const ports: ElkPort[] = isGroup ? [] : [
      // TOP (NORTH)
      { id: `${n.id}_top-0`,    x: width / 2 - 18, y: 0 },
      { id: `${n.id}_top-1`,    x: width / 2,      y: 0 },
      { id: `${n.id}_top-2`,    x: width / 2 + 18, y: 0 },
      // BOTTOM (SOUTH)
      { id: `${n.id}_bottom-0`, x: width / 2 - 18, y: height },
      { id: `${n.id}_bottom-1`, x: width / 2,      y: height },
      { id: `${n.id}_bottom-2`, x: width / 2 + 18, y: height },
      // LEFT (WEST)
      { id: `${n.id}_left-0`,   x: 0,              y: height / 2 - 18 },
      { id: `${n.id}_left-1`,   x: 0,              y: height / 2 },
      { id: `${n.id}_left-2`,   x: 0,              y: height / 2 + 18 },
      // RIGHT (EAST)
      { id: `${n.id}_right-0`,  x: width,          y: height / 2 - 18 },
      { id: `${n.id}_right-1`,  x: width,          y: height / 2 },
      { id: `${n.id}_right-2`,  x: width,          y: height / 2 + 18 },
    ];

    const elkNode: ElkNode = {
      id: n.id,
      width: isGroup ? undefined : width,
      height: isGroup ? undefined : height,
      ports,
      layoutOptions: isGroup
        ? {
            'elk.direction': 'DOWN',
            'elk.padding': '[top=40,left=40,bottom=40,right=40]',
          }
        : {
            'elk.portConstraints': 'FIXED_POS',
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

  // ── 2. Build ELK edges ──────────────────────────────────────────
  // Group edges by source-target pairs to calculate indices for parallel connection ports
  const edgeCountMap = new Map<string, number>();
  const elkEdges: ElkExtendedEdge[] = edges.map((e) => {
    const sourcePortBase = direction === 'LR' ? 'right' : 'bottom';
    const targetPortBase = direction === 'LR' ? 'left' : 'top';
    
    const key = `${e.source}->${e.target}`;
    const count = edgeCountMap.get(key) || 0;
    edgeCountMap.set(key, count + 1);
    
    // Map count to index (center first, then left/top offset, then right/bottom offset)
    let portIdx = 1;
    if (count === 1) portIdx = 0;
    else if (count === 2) portIdx = 2;
    
    const sourcePort = `${sourcePortBase}-${portIdx}`;
    const targetPort = `${targetPortBase}-${portIdx}`;

    return {
      id: e.id,
      sources: [`${e.source}_${sourcePort}`],
      targets: [`${e.target}_${targetPort}`],
    };
  });

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      ...elkConfig,
      'elk.algorithm': 'layered',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.spacing.nodeNode': '80',
      'elk.spacing.edgeEdge': '20',
    },
    children: rootChildren,
    edges: elkEdges,
  };

  // ── 3. Run ELK ──────────────────────────────────────────────────
  const layoutedGraph = await elk.layout(graph);

  // ── 4. Extract node positions ───────────────────────────────────
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

  // ── 5. Extract edge routing and port assignments ────────────────
  const edgeRoutingMap = new Map<string, any>();

  if (layoutedGraph.edges) {
    layoutedGraph.edges.forEach((elkEdge: any) => {
      if (elkEdge.sections && elkEdge.sections.length > 0) {
        const section = elkEdge.sections[0];
        edgeRoutingMap.set(elkEdge.id, {
          startPoint: section.startPoint ? { x: section.startPoint.x, y: section.startPoint.y } : null,
          endPoint: section.endPoint ? { x: section.endPoint.x, y: section.endPoint.y } : null,
          bendPoints: section.bendPoints ? section.bendPoints.map((bp: any) => ({ x: bp.x, y: bp.y })) : [],
          // ELK returns which port it assigned the edge to in outgoingShape/incomingShape
          // if it was connected to the node initially.
          sourcePort: section.outgoingShape,
          targetPort: section.incomingShape,
        });
      }
    });
  }

  const edgeCountMap2 = new Map<string, number>();
  const updatedEdges = edges.map(e => {
    const route = edgeRoutingMap.get(e.id);
    const sourcePortBase = direction === 'LR' ? 'right' : 'bottom';
    const targetPortBase = direction === 'LR' ? 'left' : 'top';
    
    const key = `${e.source}->${e.target}`;
    const count = edgeCountMap2.get(key) || 0;
    edgeCountMap2.set(key, count + 1);
    
    let portIdx = 1;
    if (count === 1) portIdx = 0;
    else if (count === 2) portIdx = 2;

    if (route) {
      return {
        ...e,
        sourceHandle: `${sourcePortBase}-source-${portIdx}`,
        targetHandle: `${targetPortBase}-target-${portIdx}`,
        data: {
          ...e.data,
          startPoint: route.startPoint,
          bendPoints: route.bendPoints,
          endPoint: route.endPoint,
        },
      };
    }
    return e;
  });

  return { nodes, edges: updatedEdges };
}
