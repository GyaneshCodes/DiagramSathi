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
    
    // Inject 4 fixed ports for every node
    const ports: ElkPort[] = [
      { id: 'top',    layoutOptions: { 'elk.port.side': 'NORTH' } },
      { id: 'right',  layoutOptions: { 'elk.port.side': 'EAST'  } },
      { id: 'bottom', layoutOptions: { 'elk.port.side': 'SOUTH' } },
      { id: 'left',   layoutOptions: { 'elk.port.side': 'WEST'  } },
    ];

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
            'elk.portConstraints': 'FIXED_SIDE',
            'elk.ports.portSpacing': '15',
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
  // Connect edges to nodes; ELK will pick the optimal port
  const elkEdges: ElkExtendedEdge[] = edges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

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

  const updatedEdges = edges.map(e => {
    const route = edgeRoutingMap.get(e.id);
    if (route) {
      return {
        ...e,
        sourceHandle: route.sourcePort ? `${route.sourcePort}-source` : undefined,
        targetHandle: route.targetPort ? `${route.targetPort}-target` : undefined,
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
