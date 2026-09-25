/**
 * erElkLayout.ts
 *
 * Separate ELK layout module for ER diagrams.
 * Uses ELK's Layered algorithm with ORTHOGONAL routing.
 * Extracts startPoint, bendPoints, and endPoint so relationship lines
 * fan out cleanly without merging into a shared trunk line.
 */

import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { ErSchema, ErRelationship } from "../store/useErDiagramStore";
import type { DfdNode, DfdEdge } from "../store/useDiagramStore";

const elk = new ELK();

const SCHEMA_WIDTH = 300;
const SCHEMA_HEADER_HEIGHT = 44;
const SCHEMA_ROW_HEIGHT = 32;
const MIN_SCHEMA_HEIGHT = 76;

function calcHeight(columnCount: number): number {
  return Math.max(SCHEMA_HEADER_HEIGHT + columnCount * SCHEMA_ROW_HEIGHT, MIN_SCHEMA_HEIGHT);
}

/**
 * Auto-layout ER schemas using ELK's layered algorithm with orthogonal routing.
 * Returns positioned DfdNode[] and fully-routed DfdEdge[] with bendPoints.
 */
export async function layoutErDiagram(
  schemas: ErSchema[],
  relationships: ErRelationship[],
  direction: "LR" | "TB" = "LR"
): Promise<{ nodes: DfdNode[]; edges: DfdEdge[] }> {
  if (schemas.length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    const isHorizontal = direction === "LR";
    const elkGraph: ElkNode = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "org.eclipse.elk.layered",
        "elk.direction": isHorizontal ? "RIGHT" : "DOWN",
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.spacing.nodeNode": "100",
        "elk.layered.spacing.nodeNodeBetweenLayers": "180",
        "elk.layered.spacing.edgeNodeBetweenLayers": "80",
        "elk.spacing.edgeEdge": "25",
        "elk.spacing.edgeNode": "35",
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.nodeSize.constraints": "MINIMUM_SIZE",
        // Padding prevents clipping on all boundaries
        "elk.padding": "[top=60,left=80,bottom=60,right=80]",
      },
      children: schemas.map((s) => ({
        id: `er_${s.id}`,
        width: SCHEMA_WIDTH,
        height: calcHeight(s.columns.length),
      })),
      edges: relationships.map((r) => ({
        id: `er_rel_${r.id}`,
        sources: [`er_${r.sourceSchemaId}`],
        targets: [`er_${r.targetSchemaId}`],
      })) as ElkExtendedEdge[],
    };

    const layoutResult = await elk.layout(elkGraph);

    // 1. Extract node positions
    const positionMap = new Map<string, { x: number; y: number }>();
    for (const child of layoutResult.children || []) {
      positionMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
    }

    const nodes: DfdNode[] = schemas.map((s) => {
      const nodeId = `er_${s.id}`;
      const pos = positionMap.get(nodeId) || { x: 0, y: 0 };
      return {
        id: nodeId,
        label: s.name,
        type: "er-schema",
        position: pos,
        width: SCHEMA_WIDTH,
        height: calcHeight(s.columns.length),
      };
    });

    // 2. Extract edge routing geometry
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

    const edges: DfdEdge[] = relationships.map((r) => {
      const edgeId = `er_rel_${r.id}`;
      const route = edgeRouteMap.get(edgeId);

      return {
        id: edgeId,
        source: `er_${r.sourceSchemaId}`,
        target: `er_${r.targetSchemaId}`,
        type: "er-relationship",
        data: {
          sourceColumnId: r.sourceColumnId,
          targetColumnId: r.targetColumnId,
          startPoint: route?.startPoint || undefined,
          bendPoints: route?.bendPoints || [],
          endPoint: route?.endPoint || undefined,
        },
      };
    });

    return { nodes, edges };
  } catch (err) {
    console.error("[erElkLayout] Error during ER layout:", err);
    const fallbackNodes: DfdNode[] = schemas.map((s, idx) => ({
      id: `er_${s.id}`,
      label: s.name,
      type: "er-schema",
      position: { x: 80 + idx * 350, y: 100 },
      width: SCHEMA_WIDTH,
      height: calcHeight(s.columns.length),
    }));
    const fallbackEdges: DfdEdge[] = relationships.map((r) => ({
      id: `er_rel_${r.id}`,
      source: `er_${r.sourceSchemaId}`,
      target: `er_${r.targetSchemaId}`,
      type: "er-relationship",
    }));
    return { nodes: fallbackNodes, edges: fallbackEdges };
  }
}
