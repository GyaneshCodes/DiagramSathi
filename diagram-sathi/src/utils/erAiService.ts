/**
 * erAiService.ts
 *
 * Handles AI-generated ER diagram response validation and normalization.
 */

import type {
  ErSchema,
  ErColumn,
  ErRelationship,
  ErRelationshipType,
  ErColorName,
  ErDataType,
} from "../store/useErDiagramStore";
import { ER_DATA_TYPES, ER_COLORS } from "../store/useErDiagramStore";

const VALID_COLORS = Object.keys(ER_COLORS) as ErColorName[];
const VALID_REL_TYPES: ErRelationshipType[] = [
  "one-to-one", "one-to-many", "many-to-one", "many-to-many",
];

function uid(): string {
  return Math.random().toString(36).substr(2, 9);
}

interface AIErColumn {
  name?: string;
  dataType?: string;
  key?: string;
  required?: boolean;
  unique?: boolean;
  extras?: string;
}

interface AIErSchema {
  id?: string;
  name?: string;
  color?: string;
  columns?: AIErColumn[];
}

interface AIErRelationship {
  source?: string;
  target?: string;
  type?: string;
}

interface AIErResponse {
  schemas?: AIErSchema[];
  relationships?: AIErRelationship[];
}

/**
 * Validates and normalizes an AI-generated ER response into
 * proper ErSchema[] and ErRelationship[] arrays.
 */
export function normalizeAIErResponse(
  raw: AIErResponse
): { schemas: ErSchema[]; relationships: ErRelationship[] } {
  const schemas: ErSchema[] = [];
  const relationships: ErRelationship[] = [];

  if (!raw || !Array.isArray(raw.schemas)) {
    return { schemas, relationships };
  }

  // Normalize schemas
  for (const aiSchema of raw.schemas) {
    if (!aiSchema.name && !aiSchema.id) continue;

    const id = aiSchema.id || aiSchema.name || `schema_${uid()}`;
    const name = aiSchema.name || aiSchema.id || "Unnamed";
    const color: ErColorName = VALID_COLORS.includes(aiSchema.color as ErColorName)
      ? (aiSchema.color as ErColorName)
      : "blue";

    const columns: ErColumn[] = [];
    if (Array.isArray(aiSchema.columns)) {
      for (const aiCol of aiSchema.columns) {
        if (!aiCol.name) continue;

        const dataType: ErDataType =
          ER_DATA_TYPES.includes(aiCol.dataType as ErDataType)
            ? (aiCol.dataType as ErDataType)
            : "string";

        const key = aiCol.key === "PK" ? "PK"
                  : aiCol.key === "FK" ? "FK"
                  : "none";

        columns.push({
          id: `col_${uid()}`,
          name: aiCol.name,
          dataType,
          key: key as "none" | "PK" | "FK",
          required: !!aiCol.required,
          unique: !!aiCol.unique,
          extras: aiCol.extras || "",
        });
      }
    }

    schemas.push({
      id,
      name,
      columns,
      color,
      fontFamily: "Inter",
    });
  }

  // Normalize relationships
  if (Array.isArray(raw.relationships)) {
    for (const aiRel of raw.relationships) {
      if (!aiRel.source || !aiRel.target) continue;

      // Verify source and target exist in schemas
      const sourceExists = schemas.some((s) => s.id === aiRel.source);
      const targetExists = schemas.some((s) => s.id === aiRel.target);
      if (!sourceExists || !targetExists) continue;

      const type: ErRelationshipType = VALID_REL_TYPES.includes(
        aiRel.type as ErRelationshipType
      )
        ? (aiRel.type as ErRelationshipType)
        : "one-to-many";

      relationships.push({
        id: `rel_${uid()}`,
        sourceSchemaId: aiRel.source,
        targetSchemaId: aiRel.target,
        type,
      });
    }
  }

  return { schemas, relationships };
}
