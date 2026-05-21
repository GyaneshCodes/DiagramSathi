import { create } from "zustand";
import { useDiagramStore, type DfdNode, type DfdEdge } from "./useDiagramStore";
import { parseErCode, serializeErToCode } from "../utils/erDslParser";
import { layoutErDiagram } from "../utils/erElkLayout";

// ── ER Color Palette ────────────────────────────────────────────────
export const ER_COLORS = {
  green: "#22c55e",
  blue: "#3b82f6",
  orange: "#f97316",
  yellow: "#eab308",
  grey: "#6b7280",
  purple: "#a855f7",
} as const;

export type ErColorName = keyof typeof ER_COLORS;

// ── ER Font Options ─────────────────────────────────────────────────
export const ER_FONTS = [
  "Inter",
  "Roboto",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Sans",
  "Source Code Pro",
] as const;

export type ErFontFamily = (typeof ER_FONTS)[number];

// ── Data Types ──────────────────────────────────────────────────────
export const ER_DATA_TYPES = [
  "string",
  "number",
  "decimal",
  "boolean",
  "date",
  "timestamp",
  "datetime",
  "JSON",
  "array",
] as const;

export type ErDataType = (typeof ER_DATA_TYPES)[number];

// ── Interfaces ──────────────────────────────────────────────────────

export interface ErColumn {
  id: string;
  name: string;
  dataType: ErDataType;
  key: "none" | "PK" | "FK";
  required: boolean;
  unique: boolean;
  extras: string; // max 5 words, e.g. "reference to User", "hashed"
}

export interface ErSchema {
  id: string;
  name: string;
  columns: ErColumn[];
  color: ErColorName;
  fontFamily: ErFontFamily;
}

export type ErRelationshipType =
  | "one-to-one"
  | "one-to-many"
  | "many-to-one"
  | "many-to-many";

export interface ErRelationship {
  id: string;
  sourceSchemaId: string;
  targetSchemaId: string;
  type: ErRelationshipType;
}

// ── Store Interface ─────────────────────────────────────────────────

interface ErDiagramState {
  schemas: ErSchema[];
  relationships: ErRelationship[];
  selectedSchemaId: string | null;
  selectedRelationshipId: string | null;
  erCode: string;

  // Schema CRUD
  addSchema: () => string; // returns new schema id
  updateSchema: (id: string, data: Partial<Omit<ErSchema, "id" | "columns">>) => void;
  removeSchema: (id: string) => void;

  // Column CRUD
  addColumn: (schemaId: string) => void;
  updateColumn: (schemaId: string, columnId: string, data: Partial<Omit<ErColumn, "id">>) => void;
  removeColumn: (schemaId: string, columnId: string) => void;

  // Relationship CRUD
  addRelationship: (sourceId: string, targetId: string, type?: ErRelationshipType) => void;
  updateRelationship: (id: string, data: Partial<Omit<ErRelationship, "id">>) => void;
  removeRelationship: (id: string) => void;

  // Selection
  setSelectedSchemaId: (id: string | null) => void;
  setSelectedRelationshipId: (id: string | null) => void;

  // Code sync
  setErCode: (code: string) => void;
  syncCodeToSchemas: () => void;
  syncSchemasToCode: () => void;

  // Sync to main store for rendering
  syncToMainStore: (customNodes?: DfdNode[]) => void;

  // AI generation
  applyAIGeneratedEr: (schemas: ErSchema[], relationships: ErRelationship[]) => Promise<void>;

  // Layout
  applyLayout: () => Promise<void>;

  // Persistence
  loadFromAstData: (data: { schemas?: ErSchema[]; relationships?: ErRelationship[] }) => void;
  getAstData: () => { schemas: ErSchema[]; relationships: ErRelationship[] };

  // Reset
  reset: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).substr(2, 9);
}

const SCHEMA_ROW_HEIGHT = 32;
const SCHEMA_HEADER_HEIGHT = 44;
const SCHEMA_WIDTH = 300;
const CONTAINER_PADDING = 50;
const CONTAINER_TOP_EXTRA = 44; // space for Code Editor button

function calcSchemaHeight(columnCount: number): number {
  return Math.max(SCHEMA_HEADER_HEIGHT + columnCount * SCHEMA_ROW_HEIGHT, 76);
}

/** Compute the bounding container node around all schema nodes. */
function calcContainerNode(schemaNodes: DfdNode[]): DfdNode | null {
  if (schemaNodes.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const n of schemaNodes) {
    const x = (typeof n.position?.x === 'number' && !isNaN(n.position.x)) ? n.position.x : 0;
    const y = (typeof n.position?.y === 'number' && !isNaN(n.position.y)) ? n.position.y : 0;
    const w = (typeof n.width === 'number' && !isNaN(n.width)) ? n.width : SCHEMA_WIDTH;
    const h = (typeof n.height === 'number' && !isNaN(n.height)) ? n.height : 76;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  // Fallback if all nodes were invalid
  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = SCHEMA_WIDTH; maxY = 76;
  }

  return {
    id: "er-container",
    label: "",
    type: "er-container",
    position: {
      x: minX - CONTAINER_PADDING,
      y: minY - CONTAINER_PADDING - CONTAINER_TOP_EXTRA,
    },
    width: maxX - minX + CONTAINER_PADDING * 2,
    height: maxY - minY + CONTAINER_PADDING * 2 + CONTAINER_TOP_EXTRA,
  };
}

// ── Store ───────────────────────────────────────────────────────────

export const useErDiagramStore = create<ErDiagramState>((set, get) => ({
  schemas: [],
  relationships: [],
  selectedSchemaId: null,
  selectedRelationshipId: null,
  erCode: "",

  // ── Schema CRUD ───────────────────────────────────────────────

  addSchema: () => {
    const id = `schema_${uid()}`;
    const colors: ErColorName[] = ["blue", "green", "orange", "purple", "yellow", "grey"];
    const color = colors[get().schemas.length % colors.length];

    const newSchema: ErSchema = {
      id,
      name: "NewSchema",
      columns: [],
      color,
      fontFamily: "Inter",
    };

    set((s) => ({ schemas: [...s.schemas, newSchema] }));
    get().syncSchemasToCode();
    get().syncToMainStore();
    return id;
  },

  updateSchema: (id, data) => {
    set((s) => ({
      schemas: s.schemas.map((sc) => (sc.id === id ? { ...sc, ...data } : sc)),
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  removeSchema: (id) => {
    set((s) => ({
      schemas: s.schemas.filter((sc) => sc.id !== id),
      relationships: s.relationships.filter(
        (r) => r.sourceSchemaId !== id && r.targetSchemaId !== id
      ),
      selectedSchemaId: s.selectedSchemaId === id ? null : s.selectedSchemaId,
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  // ── Column CRUD ───────────────────────────────────────────────

  addColumn: (schemaId) => {
    const colId = `col_${uid()}`;
    const newCol: ErColumn = {
      id: colId,
      name: "newColumn",
      dataType: "string",
      key: "none",
      required: false,
      unique: false,
      extras: "",
    };

    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId ? { ...sc, columns: [...sc.columns, newCol] } : sc
      ),
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  updateColumn: (schemaId, columnId, data) => {
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId
          ? {
              ...sc,
              columns: sc.columns.map((c) =>
                c.id === columnId ? { ...c, ...data } : c
              ),
            }
          : sc
      ),
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  removeColumn: (schemaId, columnId) => {
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId
          ? { ...sc, columns: sc.columns.filter((c) => c.id !== columnId) }
          : sc
      ),
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  // ── Relationship CRUD ─────────────────────────────────────────

  addRelationship: (sourceId, targetId, type = "one-to-many") => {
    const id = `rel_${uid()}`;
    const newRel: ErRelationship = {
      id,
      sourceSchemaId: sourceId,
      targetSchemaId: targetId,
      type,
    };
    set((s) => ({ relationships: [...s.relationships, newRel] }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  updateRelationship: (id, data) => {
    set((s) => ({
      relationships: s.relationships.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  removeRelationship: (id) => {
    set((s) => ({
      relationships: s.relationships.filter((r) => r.id !== id),
      selectedRelationshipId:
        s.selectedRelationshipId === id ? null : s.selectedRelationshipId,
    }));
    get().syncSchemasToCode();
    get().syncToMainStore();
  },

  // ── Selection ─────────────────────────────────────────────────

  setSelectedSchemaId: (id) => {
    set({ selectedSchemaId: id, selectedRelationshipId: null });
    // Also sync to main store so canvas highlights the node
    const mainStore = useDiagramStore.getState();
    mainStore.setSelectedNodeId(id ? `er_${id}` : null);
    mainStore.setSelectedEdgeId(null);
  },

  setSelectedRelationshipId: (id) => {
    set({ selectedRelationshipId: id, selectedSchemaId: null });
    const mainStore = useDiagramStore.getState();
    mainStore.setSelectedEdgeId(id ? `er_rel_${id}` : null);
    mainStore.setSelectedNodeId(null);
  },

  // ── Code Sync ─────────────────────────────────────────────────

  setErCode: (code) => set({ erCode: code }),

  syncCodeToSchemas: () => {
    const code = get().erCode;
    if (!code.trim()) return;
    const { schemas, relationships } = parseErCode(code);
    // Preserve existing column IDs where possible by matching by name
    const oldSchemas = get().schemas;
    const mergedSchemas = schemas.map((newSc) => {
      const oldSc = oldSchemas.find((o) => o.id === newSc.id || o.name === newSc.name);
      if (!oldSc) return newSc;
      return {
        ...newSc,
        fontFamily: oldSc.fontFamily,
        columns: newSc.columns.map((newCol) => {
          const oldCol = oldSc.columns.find((o) => o.name === newCol.name);
          return oldCol ? { ...newCol, id: oldCol.id } : newCol;
        }),
      };
    });
    set({ schemas: mergedSchemas, relationships });
    get().syncToMainStore();
  },

  syncSchemasToCode: () => {
    const { schemas, relationships } = get();
    const code = serializeErToCode(schemas, relationships);
    set({ erCode: code });
  },

  // ── Sync to Main Store ────────────────────────────────────────

  syncToMainStore: (customNodes) => {
    const { schemas, relationships } = get();
    const mainStore = useDiagramStore.getState();
    const existingNodes = mainStore.nodes;

    // Preserve positions from existing nodes (updated by canvas dragging)
    const posMap = new Map<string, { x: number; y: number }>();
    existingNodes.forEach((n) => {
      if (n.position) posMap.set(n.id, n.position);
    });

    // Convert schemas → DfdNodes
    const schemaNodes: DfdNode[] = schemas.map((s, i) => {
      const nodeId = `er_${s.id}`;
      // Use customNodes position if provided (e.g. from layout)
      const layoutNode = customNodes?.find(cn => cn.id === nodeId);
      const mappedPos = posMap.get(nodeId);
      
      let safePos = { x: 50 + i * 350, y: 100 };
      if (layoutNode?.position && typeof layoutNode.position.x === 'number' && !isNaN(layoutNode.position.x) && typeof layoutNode.position.y === 'number' && !isNaN(layoutNode.position.y)) {
        safePos = layoutNode.position;
      } else if (mappedPos && typeof mappedPos.x === 'number' && !isNaN(mappedPos.x) && typeof mappedPos.y === 'number' && !isNaN(mappedPos.y)) {
        safePos = mappedPos;
      }

      return {
        id: nodeId,
        label: s.name,
        type: "er-schema",
        position: safePos,
        width: SCHEMA_WIDTH,
        height: calcSchemaHeight(s.columns.length),
        color: ER_COLORS[s.color] || ER_COLORS.blue,
      };
    });

    // Container node
    const containerNode = calcContainerNode(schemaNodes);

    // Convert relationships → DfdEdges
    const erEdges: DfdEdge[] = relationships.map((r) => ({
      id: `er_rel_${r.id}`,
      source: `er_${r.sourceSchemaId}`,
      target: `er_${r.targetSchemaId}`,
      type: "er-relationship",
    }));

    const allNodes = containerNode
      ? [containerNode, ...schemaNodes]
      : schemaNodes;

    mainStore.setNodes(allNodes);
    mainStore.setEdges(erEdges);
  },

  // ── AI Generation ─────────────────────────────────────────────

  applyAIGeneratedEr: async (schemas, relationships) => {
    set({ schemas, relationships, selectedSchemaId: null, selectedRelationshipId: null });
    get().syncSchemasToCode();
    
    // Apply layout automatically
    const { nodes } = await layoutErDiagram(schemas, relationships, "LR");
    get().syncToMainStore(nodes);
  },

  // ── Layout ───────────────────────────────────────────────────

  applyLayout: async () => {
    const { schemas, relationships } = get();
    const { nodes } = await layoutErDiagram(schemas, relationships, "LR");
    get().syncToMainStore(nodes);
  },

  // ── Persistence ───────────────────────────────────────────────

  loadFromAstData: (data) => {
    const schemas = data.schemas || [];
    const relationships = data.relationships || [];
    set({
      schemas,
      relationships,
      selectedSchemaId: null,
      selectedRelationshipId: null,
    });
    get().syncSchemasToCode();
    // Only sync to main store if we have actual schemas to render.
    // Otherwise we'd wipe the canvas nodes that were just loaded from ast_data.
    if (schemas.length > 0) {
      get().syncToMainStore();
    }
  },

  getAstData: () => {
    const { schemas, relationships } = get();
    return { schemas, relationships };
  },

  // ── Reset ─────────────────────────────────────────────────────

  reset: () => {
    set({
      schemas: [],
      relationships: [],
      selectedSchemaId: null,
      selectedRelationshipId: null,
      erCode: "",
    });
  },
}));
