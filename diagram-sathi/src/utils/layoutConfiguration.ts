/**
 * Centralized layout configuration for DiagramSathi.
 *
 * ELK is used for DFDs (handles cycles, crossing minimization).
 * Dagre is used for Flowcharts (simple hierarchical layout).
 *
 * Tweak spacing values here instead of digging through component logic.
 */

// ─── Canonical node dimensions (single source of truth) ───────────

/**
 * Fixed dimensions per node type.
 * ELK, Dagre, and the React Flow canvas all read from here
 * so layout positions and rendered sizes always agree.
 */
export const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  rectangle:     { width: 160, height: 60 },
  square:        { width: 120, height: 120 },
  circle:        { width: 130, height: 130 },
  diamond:       { width: 130, height: 130 },
  parallelogram: { width: 180, height: 60 },
  hexagon:       { width: 160, height: 70 },
  cylinder:      { width: 160, height: 80 },
};

/** Returns dimensions for a node type, preferring explicit overrides. */
export function getNodeDimensions(
  type: string,
  explicitW?: number,
  explicitH?: number,
): { width: number; height: number } {
  if (explicitW && explicitH) return { width: explicitW, height: explicitH };
  return NODE_DIMENSIONS[type] || NODE_DIMENSIONS.rectangle;
}

// ─── ELK options for DFD diagrams ──────────────────────────────────

interface ElkLayoutConfig {
  'elk.algorithm': string;
  'elk.direction': string;
  'elk.edgeRouting': string;
  'elk.layered.crossingMinimization.strategy': string;
  'elk.layered.cycleBreaking.strategy': string;
  'elk.spacing.nodeNode': string;
  'elk.layered.spacing.edgeNodeBetweenLayers': string;
  'elk.layered.spacing.nodeNodeBetweenLayers': string;
  'elk.spacing.componentComponent': string;
  'elk.portConstraints': string;
  'elk.layered.nodePlacement.strategy': string;
  'elk.spacing.edgeEdge': string;
  'elk.spacing.edgeNode': string;
  'elk.spacing.portPort': string;
  [key: string]: string;
}

const ELK_BASE: ElkLayoutConfig = {
  'elk.algorithm': 'org.eclipse.elk.layered',
  'elk.direction': 'RIGHT',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.edgeNodeBetweenLayers': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.componentComponent': '60',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  // Parallel edge separation — prevents arrows from stacking
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.edgeNode': '25',
  'elk.spacing.portPort': '15',
};

/** Level 0 = context diagram (fewer nodes, tighter spacing) */
const ELK_DFD_LEVEL_0: ElkLayoutConfig = {
  ...ELK_BASE,
  'elk.spacing.nodeNode': '100',
  'elk.layered.spacing.nodeNodeBetweenLayers': '140',
  'elk.spacing.componentComponent': '60',
};

/** Level 1 = expanded sub-processes (more nodes, wider spacing) */
const ELK_DFD_LEVEL_1: ElkLayoutConfig = {
  ...ELK_BASE,
  'elk.spacing.nodeNode': '120',
  'elk.layered.spacing.edgeNodeBetweenLayers': '120',
  'elk.layered.spacing.nodeNodeBetweenLayers': '160',
  'elk.spacing.componentComponent': '100',
};

// ─── Dagre options for Flowcharts ──────────────────────────────────

export interface DagreLayoutConfig {
  rankdir: string;
  ranksep: number;
  nodesep: number;
  edgesep: number;
  marginx: number;
  marginy: number;
}

const DAGRE_FLOWCHART: DagreLayoutConfig = {
  rankdir: 'TB',
  ranksep: 120,
  nodesep: 80,
  edgesep: 30,
  marginx: 40,
  marginy: 40,
};

// ─── Direction mapping ─────────────────────────────────────────────

const directionToElk: Record<string, string> = {
  TB: 'DOWN',
  LR: 'RIGHT',
  BT: 'UP',
  RL: 'LEFT',
};

// ─── Public API ────────────────────────────────────────────────────

export function getElkConfig(
  direction: 'TB' | 'LR',
  dfdLevel: number,
): ElkLayoutConfig {
  const base = dfdLevel >= 1 ? ELK_DFD_LEVEL_1 : ELK_DFD_LEVEL_0;
  return {
    ...base,
    'elk.direction': directionToElk[direction] || 'RIGHT',
  };
}

export function getDagreConfig(direction: 'TB' | 'LR'): DagreLayoutConfig {
  return {
    ...DAGRE_FLOWCHART,
    rankdir: direction,
    ranksep: direction === 'LR' ? 120 : 80,
  };
}
