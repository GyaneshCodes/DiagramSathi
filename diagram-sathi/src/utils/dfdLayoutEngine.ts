/**
 * dfdLayoutEngine.ts
 *
 * Semantic 3-Tier Layout Engine for DFD Level 0 (Context) and Level 1 Diagrams.
 *
 * Uses ELK's Layered algorithm with explicit partitioning:
 *  - Partition 0 (Left Tier): External Entities (Inputs / Sinks)
 *  - Partition 1 (Center Tier): Processes (1.0, 2.0, 3.0, etc.)
 *  - Partition 2 (Right Tier): Data Stores (Persisted Storage)
 *
 * Computes obstacle-aware ORTHOGONAL edge routing with bend points,
 * eliminating the "cutting through nodes" bug and converging edge overlap,
 * while ensuring clean padding to prevent leftmost clipping.
 */

import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { DfdNode, DfdEdge } from "../store/useDiagramStore";
import { getNodeDimensions } from "./layoutConfiguration";

const elk = new ELK();

function isProcessNode(n: DfdNode): boolean {
  return n.type === "circle" || n.type === "process";
}

function isDataStoreNode(n: DfdNode): boolean {
  return n.type === "cylinder" || n.type === "datastore";
}

export async function layoutDfdDiagram(
  nodes: DfdNode[],
  edges: DfdEdge[],
  direction: "TB" | "LR" = "LR",
  dfdLevel: number = 0
): Promise<{ nodes: DfdNode[]; edges: DfdEdge[] }> {
  if (nodes.length === 0) return { nodes, edges };

  try {
    // 1. Group edges by pair for parallel separation indexing
    const pairCounts = new Map<string, number>();
    edges.forEach((e) => {
      const pairKey = [e.source, e.target].sort().join("::");
      pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
    });

    const pairIndices = new Map<string, number>();
    const pairSeen = new Map<string, number>();
    edges.forEach((e) => {
      const pairKey = [e.source, e.target].sort().join("::");
      const idx = pairSeen.get(pairKey) ?? 0;
      pairIndices.set(e.id, idx);
      pairSeen.set(pairKey, idx + 1);
    });

    // 2. Build ELK Children with Explicit Partitioning
    const elkChildren: ElkNode[] = nodes.map((n) => {
      const isProc = isProcessNode(n);
      const isStore = isDataStoreNode(n);
      const defaultDims = isProc
        ? { width: 130, height: 130 }
        : getNodeDimensions(n.type, n.width, n.height);

      let partition = "0";
      if (isProc) {
        partition = "1";
      } else if (isStore) {
        partition = "2";
      }

      return {
        id: n.id,
        width: defaultDims.width,
        height: defaultDims.height,
        layoutOptions: {
          "org.eclipse.elk.partitioning.partition": partition,
        },
      };
    });

    // 3. Build ELK Edges
    const elkEdges: ElkExtendedEdge[] = edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

    // 4. ELK Layout Configuration with Activated Partitioning
    const isHorizontal = direction === "LR";
    const graph: ElkNode = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": isHorizontal ? "RIGHT" : "DOWN",
        "elk.edgeRouting": "ORTHOGONAL",
        "org.eclipse.elk.partitioning.activate": "true",
        "elk.spacing.nodeNode": "100",
        "elk.spacing.edgeNode": "40",
        "elk.spacing.edgeEdge": "30",
        "elk.layered.spacing.edgeNodeBetweenLayers": "80",
        "elk.layered.spacing.nodeNodeBetweenLayers": dfdLevel >= 1 ? "240" : "220",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        "elk.layered.cycleBreaking.strategy": "GREEDY",
        // Generous padding ensures leftmost entity nodes are never clipped
        "elk.padding": "[top=80,left=100,bottom=80,right=100]",
      },
      children: elkChildren,
      edges: elkEdges,
    };

    const layoutResult = await elk.layout(graph);

    // 5. Extract layouted node positions
    const posMap = new Map<string, { x: number; y: number }>();
    layoutResult.children?.forEach((child) => {
      posMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
    });

    const layoutedNodes: DfdNode[] = nodes.map((n) => {
      const isProc = isProcessNode(n);
      return {
        ...n,
        width: isProc ? 130 : n.width,
        height: isProc ? 130 : n.height,
        position: posMap.get(n.id) || n.position || { x: 0, y: 0 },
      };
    });

    // 6. Extract full edge routing geometry
    const edgeRouteMap = new Map<
      string,
      {
        startPoint: { x: number; y: number } | null;
        bendPoints: { x: number; y: number }[];
        endPoint: { x: number; y: number } | null;
      }
    >();

    layoutResult.edges?.forEach((elkEdge: any) => {
      if (elkEdge.sections && elkEdge.sections.length > 0) {
        const sec = elkEdge.sections[0];
        edgeRouteMap.set(elkEdge.id, {
          startPoint: sec.startPoint ? { x: sec.startPoint.x, y: sec.startPoint.y } : null,
          bendPoints: sec.bendPoints
            ? sec.bendPoints.map((bp: any) => ({ x: bp.x, y: bp.y }))
            : [],
          endPoint: sec.endPoint ? { x: sec.endPoint.x, y: sec.endPoint.y } : null,
        });
      }
    });

    const layoutedEdges: DfdEdge[] = edges.map((e) => {
      const pairKey = [e.source, e.target].sort().join("::");
      const pairTotal = pairCounts.get(pairKey) ?? 1;
      const pairIndex = pairIndices.get(e.id) ?? 0;
      const route = edgeRouteMap.get(e.id);

      return {
        ...e,
        data: {
          ...e.data,
          startPoint: route?.startPoint || undefined,
          bendPoints: route?.bendPoints || [],
          endPoint: route?.endPoint || undefined,
          pairIndex,
          pairTotal,
        },
      };
    });

    return { nodes: layoutedNodes, edges: layoutedEdges };
  } catch (err) {
    console.error("[dfdLayoutEngine] ELK layout error, returning unlayouted:", err);
    return { nodes, edges };
  }
}
