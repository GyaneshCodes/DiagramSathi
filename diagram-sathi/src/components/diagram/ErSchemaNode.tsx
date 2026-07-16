import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  useErDiagramStore,
  ER_COLORS,
  type ErColumn,
} from "../../store/useErDiagramStore";

const KEY_BADGE_COLORS: Record<string, string> = {
  PK: "#eab308",
  FK: "#3b82f6",
};

function ColumnRow({ col, font }: { col: ErColumn; font: string }) {
  const rightParts: string[] = [];

  // Data type
  rightParts.push(col.dataType);

  // Modifiers
  if (col.required) rightParts.push("required");
  if (col.unique) rightParts.push("unique");
  if (col.key === "PK") rightParts.push("pk");
  if (col.key === "FK") rightParts.push("fk");

  // Extras
  if (col.extras?.trim()) rightParts.push(col.extras.trim());

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 border-b last:border-b-0"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        fontFamily: font,
      }}
    >
      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 shrink-0">
        {col.key !== "none" && (
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded"
            style={{
              backgroundColor: KEY_BADGE_COLORS[col.key] + "30",
              color: KEY_BADGE_COLORS[col.key],
            }}
          >
            {col.key}
          </span>
        )}
        {col.name}:
      </span>
      <span
        className="text-xs text-slate-300 ml-3 text-right whitespace-nowrap"
        style={{ fontFamily: font }}
      >
        {rightParts.join(" ")}
      </span>
    </div>
  );
}

export const ErSchemaNode = ({ id, selected }: NodeProps<Node>) => {
  const schemaId = id.replace("er_", "");
  const schema = useErDiagramStore((s) =>
    s.schemas.find((sc) => sc.id === schemaId)
  );

  if (!schema) return null;

  const borderColor = ER_COLORS[schema.color] || ER_COLORS.blue;
  const font = schema.fontFamily || "Inter";

  const handleClass =
    "!w-2 !h-2 !bg-slate-400 !border-2 !border-slate-800 !opacity-0 pointer-events-none";

  return (
    <div
      className="group relative"
      style={{
        width: 300,
        minHeight: 44,
        fontFamily: font,
      }}
    >
      {/* Colored left accent + border */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: `2px solid ${borderColor}`,
          background: "#0f172a",
          boxShadow: selected
            ? `0 0 0 2px ${borderColor}40, 0 4px 20px rgba(0,0,0,0.4)`
            : "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            background: `${borderColor}18`,
            borderBottom: `1px solid ${borderColor}40`,
          }}
        >
          <span
            className="text-sm font-bold text-slate-100 tracking-wide"
            style={{ fontFamily: font }}
          >
            {schema.name}
          </span>
        </div>

        {/* Columns */}
        {schema.columns.length > 0 && (
          <div className="flex flex-col">
            {schema.columns.map((col) => (
              <ColumnRow key={col.id} col={col} font={font} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {schema.columns.length === 0 && (
          <div className="px-3 py-3 text-[10px] text-slate-500 italic">
            No columns defined
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle type="source" position={Position.Top} id="top-source" className={handleClass} />
      <Handle type="target" position={Position.Top} id="top-target" className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className={handleClass} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className={handleClass} />
      <Handle type="source" position={Position.Left} id="left-source" className={handleClass} />
      <Handle type="target" position={Position.Left} id="left-target" className={handleClass} />
      <Handle type="source" position={Position.Right} id="right-source" className={handleClass} />
      <Handle type="target" position={Position.Right} id="right-target" className={handleClass} />
    </div>
  );
};
