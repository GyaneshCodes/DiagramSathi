/**
 * erElkLayout.ts
 *
 * Separate ELK layout module for ER diagrams.
 * Does NOT modify existing elkLayout.ts or layoutConfiguration.ts.
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
 * Returns positioned DfdNode[] and DfdEdge[] ready for the main store.
 */
export async function layoutErDiagram(
  schemas: ErSchema[],
  relationships: ErRelationship[],
  direction: "LR" | "TB" = "LR"
): Promise<{ nodes: DfdNode[]; edges: DfdEdge[] }> {
  if (schemas.length === 0) {
    return { nodes: [], edges: [] };
  }

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "org.eclipse.elk.layered",
      "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "100",
      "elk.layered.spacing.nodeNodeBetweenLayers": "160",
      "elk.layered.spacing.edgeNodeBetweenLayers": "60",
      "elk.nodeSize.constraints": "MINIMUM_SIZE",
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

  const edges: DfdEdge[] = relationships.map((r) => ({
    id: `er_rel_${r.id}`,
    source: `er_${r.sourceSchemaId}`,
    target: `er_${r.targetSchemaId}`,
  }));

  return { nodes, edges };
}
