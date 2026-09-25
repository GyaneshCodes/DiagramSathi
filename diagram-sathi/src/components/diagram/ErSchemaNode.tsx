import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  useErDiagramStore,
  ER_COLORS,
  type ErColumn,
} from "../../store/useErDiagramStore";
import { useTheme } from "../../context/ThemeContext";

const KEY_BADGE_COLORS: Record<string, string> = {
  PK: "#eab308",
  FK: "#3b82f6",
};

function ColumnRow({
  col,
  font,
  isDark,
}: {
  col: ErColumn;
  font: string;
  isDark: boolean;
}) {
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

  // Badge styles
  const badgeStyle = isDark
    ? {
        backgroundColor: KEY_BADGE_COLORS[col.key] + "30",
        color: KEY_BADGE_COLORS[col.key],
      }
    : col.key === "PK"
      ? {
          backgroundColor: "#fef3c7",
          color: "#b45309",
          border: "1px solid #fde68a",
        }
      : {
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          border: "1px solid #bae6fd",
        };

  return (
    <div
      className="group/row relative flex items-center justify-between px-3 py-1.5 border-b last:border-b-0 transition-colors duration-150"
      style={{
        borderColor: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
        fontFamily: font,
      }}
    >
      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${col.id}-left`}
        className="!w-2 !h-2 !min-w-0 !min-h-0 !rounded-full !bg-blue-500 !border !border-white/80 dark:!border-slate-900 !opacity-0 group-hover/row:!opacity-100 transition-opacity !-left-1"
      />
      <Handle
        type="source"
        position={Position.Left}
        id={`${col.id}-left-src`}
        className="!w-2 !h-2 !min-w-0 !min-h-0 !rounded-full !bg-blue-500 !border !border-white/80 dark:!border-slate-900 !opacity-0 group-hover/row:!opacity-100 transition-opacity !-left-1"
      />

      <span
        className={`text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
          isDark ? "text-slate-200" : "text-slate-800"
        }`}
      >
        {col.key !== "none" && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs"
            style={badgeStyle}
          >
            {col.key}
          </span>
        )}
        {col.name}:
      </span>
      <span
        className={`text-xs ml-3 text-right whitespace-nowrap ${
          isDark ? "text-slate-300" : "text-slate-500 font-medium"
        }`}
        style={{ fontFamily: font }}
      >
        {rightParts.join(" ")}
      </span>

      {/* Right handles */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${col.id}-right`}
        className="!w-2 !h-2 !min-w-0 !min-h-0 !rounded-full !bg-blue-500 !border !border-white/80 dark:!border-slate-900 !opacity-0 group-hover/row:!opacity-100 transition-opacity !-right-1"
      />
      <Handle
        type="target"
        position={Position.Right}
        id={`${col.id}-right-tgt`}
        className="!w-2 !h-2 !min-w-0 !min-h-0 !rounded-full !bg-blue-500 !border !border-white/80 dark:!border-slate-900 !opacity-0 group-hover/row:!opacity-100 transition-opacity !-right-1"
      />
    </div>
  );
}

export const ErSchemaNode = ({ id, selected }: NodeProps<Node>) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
        className="rounded-lg overflow-hidden transition-all duration-200"
        style={{
          border: `2px solid ${borderColor}`,
          background: isDark ? "#0f172a" : "#f8fafc",
          boxShadow: isDark
            ? selected
              ? `0 0 0 2px ${borderColor}40, 0 4px 20px rgba(0,0,0,0.4)`
              : "0 2px 12px rgba(0,0,0,0.3)"
            : selected
              ? `0 0 0 2px ${borderColor}50, 0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)`
              : "0 4px 14px -2px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 transition-colors duration-150"
          style={{
            background: isDark ? `${borderColor}18` : `${borderColor}14`,
            borderBottom: isDark
              ? `1px solid ${borderColor}40`
              : `1px solid ${borderColor}30`,
          }}
        >
          <span
            className={`text-sm font-bold tracking-wide ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
            style={{ fontFamily: font }}
          >
            {schema.name}
          </span>
        </div>

        {/* Columns */}
        {schema.columns.length > 0 && (
          <div className="flex flex-col">
            {schema.columns.map((col) => (
              <ColumnRow key={col.id} col={col} font={font} isDark={isDark} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {schema.columns.length === 0 && (
          <div
            className={`px-3 py-3 text-[10px] italic ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
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
