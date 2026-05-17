/**
 * erDslParser.ts
 *
 * Two-way transpiler between the custom ER DSL and the internal ER AST.
 *
 * DSL Syntax:
 *   SchemaName[color: blue]{
 *     columnName: dataType modifier1 modifier2 ...
 *   }
 *
 *   SchemaA < SchemaB   // one-to-many
 *   SchemaA > SchemaB   // many-to-one
 *   SchemaA - SchemaB   // one-to-one
 *   SchemaA <> SchemaB  // many-to-many
 */

import type {
  ErSchema,
  ErColumn,
  ErRelationship,
  ErRelationshipType,
  ErColorName,
  ErDataType,
} from "../store/useErDiagramStore";
import { ER_DATA_TYPES } from "../store/useErDiagramStore";

// ── Symbol ↔ Relationship Type Mapping ──────────────────────────────

const SYMBOL_TO_TYPE: Record<string, ErRelationshipType> = {
  "-": "one-to-one",
  "<": "one-to-many",
  ">": "many-to-one",
  "<>": "many-to-many",
};

const TYPE_TO_SYMBOL: Record<ErRelationshipType, string> = {
  "one-to-one": "-",
  "one-to-many": "<",
  "many-to-one": ">",
  "many-to-many": "<>",
};

// ── Valid colors ────────────────────────────────────────────────────

const VALID_COLORS: ErColorName[] = [
  "green", "blue", "orange", "yellow", "grey", "purple",
];

// ── Parse (DSL → AST) ──────────────────────────────────────────────

interface ParseResult {
  schemas: ErSchema[];
  relationships: ErRelationship[];
}

function uid(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function parseErCode(code: string): ParseResult {
  const schemas: ErSchema[] = [];
  const relationships: ErRelationship[] = [];
  const lines = code.split("\n");

  let currentSchema: ErSchema | null = null;
  let insideBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line || line.startsWith("//")) continue;

    // Check for relationship lines (not inside a block)
    if (!insideBlock) {
      const relMatch = line.match(
        /^(\w+)\s*(<>|<|>|-)\s*(\w+)$/
      );
      if (relMatch) {
        const [, source, symbol, target] = relMatch;
        const type = SYMBOL_TO_TYPE[symbol] || "one-to-many";
        relationships.push({
          id: `rel_${uid()}`,
          sourceSchemaId: source,
          targetSchemaId: target,
          type,
        });
        continue;
      }

      // Check for schema header: Name[key: val, ...]{
      const headerMatch = line.match(
        /^(\w+)\s*(?:\[([^\]]*)\])?\s*\{$/
      );
      if (headerMatch) {
        const [, name, propsStr] = headerMatch;
        let color: ErColorName = "blue";

        if (propsStr) {
          const props = propsStr.split(",").map((p) => p.trim());
          for (const prop of props) {
            const [key, val] = prop.split(":").map((s) => s.trim());
            if (key === "color" && VALID_COLORS.includes(val as ErColorName)) {
              color = val as ErColorName;
            }
          }
        }

        currentSchema = {
          id: name,
          name,
          columns: [],
          color,
          fontFamily: "Inter",
        };
        insideBlock = true;
        continue;
      }
    }

    // Inside a schema block
    if (insideBlock && currentSchema) {
      // Closing brace
      if (line === "}") {
        schemas.push(currentSchema);
        currentSchema = null;
        insideBlock = false;
        continue;
      }

      // Parse column: name: type modifier1 modifier2 ...
      const colMatch = line.match(/^(\w+)\s*:\s*(.+)$/);
      if (colMatch) {
        const [, colName, rest] = colMatch;
        const column = parseColumnDef(colName, rest.trim());
        currentSchema.columns.push(column);
      }
    }
  }

  // If schema wasn't closed properly, still add it
  if (currentSchema) {
    schemas.push(currentSchema);
  }

  return { schemas, relationships };
}

function parseColumnDef(name: string, definition: string): ErColumn {
  const column: ErColumn = {
    id: `col_${uid()}`,
    name,
    dataType: "string",
    key: "none",
    required: false,
    unique: false,
    extras: "",
  };

  // Tokenize — handle parenthesized groups as single tokens
  const tokens: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (const ch of definition) {
    if (ch === "(") {
      parenDepth++;
      current += ch;
    } else if (ch === ")") {
      parenDepth--;
      current += ch;
    } else if (ch === " " && parenDepth === 0) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);

  const extraParts: string[] = [];

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    const lower = token.toLowerCase();

    // Data type (first token, or token matching known types)
    if (t === 0) {
      // Check if it starts with a known data type
      const baseType = lower.replace(/\(.*\)$/, "");
      if (ER_DATA_TYPES.includes(baseType as ErDataType)) {
        column.dataType = baseType as ErDataType;
        // If it has parenthesized content like string(easy, medium, hard), add to extras
        const parenMatch = token.match(/\((.+)\)$/);
        if (parenMatch) {
          extraParts.push(`(${parenMatch[1]})`);
        }
        continue;
      }
      // If first token is "fk", handle it
      if (lower === "fk") {
        column.key = "FK";
        // Check for "reference to X" pattern
        if (
          t + 2 < tokens.length &&
          tokens[t + 1].toLowerCase() === "reference" &&
          tokens[t + 2].toLowerCase() === "to"
        ) {
          const refTarget = tokens[t + 3] || "";
          extraParts.push(`reference to ${refTarget}`);
          t += 3; // skip "reference to X"
        }
        continue;
      }
    }

    // Modifiers
    if (lower === "required") {
      column.required = true;
    } else if (lower === "unique") {
      column.unique = true;
    } else if (lower === "pk") {
      column.key = "PK";
    } else if (lower === "fk") {
      column.key = "FK";
      // Check for "reference to X" pattern
      if (
        t + 2 < tokens.length &&
        tokens[t + 1].toLowerCase() === "reference" &&
        tokens[t + 2].toLowerCase() === "to"
      ) {
        const refTarget = tokens[t + 3] || "";
        extraParts.push(`reference to ${refTarget}`);
        t += 3;
      }
    } else if (lower === "reference" && t + 1 < tokens.length && tokens[t + 1].toLowerCase() === "to") {
      const refTarget = tokens[t + 2] || "";
      extraParts.push(`reference to ${refTarget}`);
      t += 2;
    } else if (t > 0) {
      // Unknown token — treat as extra
      extraParts.push(token);
    }
  }

  // Enforce 5-word limit on extras
  const extrasStr = extraParts.join(" ");
  const extraWords = extrasStr.split(/\s+/).filter(Boolean);
  column.extras = extraWords.slice(0, 5).join(" ");

  return column;
}

// ── Serialize (AST → DSL) ──────────────────────────────────────────

export function serializeErToCode(
  schemas: ErSchema[],
  relationships: ErRelationship[]
): string {
  const parts: string[] = [];

  for (const schema of schemas) {
    // Header
    let header = `${schema.name}[color: ${schema.color}]{`;
    parts.push(header);

    // Columns
    for (const col of schema.columns) {
      const modifiers: string[] = [];

      // Data type
      modifiers.push(col.dataType);

      // Key
      if (col.key === "PK") modifiers.push("pk");
      if (col.key === "FK") modifiers.push("fk");

      // Required & Unique
      if (col.required) modifiers.push("required");
      if (col.unique) modifiers.push("unique");

      // Extras
      if (col.extras?.trim()) modifiers.push(col.extras.trim());

      parts.push(`  ${col.name}: ${modifiers.join(" ")}`);
    }

    parts.push("}");
    parts.push("");
  }

  // Relationships
  for (const rel of relationships) {
    const symbol = TYPE_TO_SYMBOL[rel.type] || "<";
    parts.push(`${rel.sourceSchemaId} ${symbol} ${rel.targetSchemaId}`);
  }

  return parts.join("\n").trim();
}
