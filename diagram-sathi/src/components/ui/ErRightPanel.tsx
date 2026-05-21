import {
  useErDiagramStore,
  ER_COLORS,
  ER_FONTS,
  ER_DATA_TYPES,
  type ErColorName,
  type ErFontFamily,
  type ErDataType,
  type ErRelationshipType,
} from "../../store/useErDiagramStore";
import {
  Type,
  Palette,
  Columns3,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Link2,
} from "lucide-react";
import { useState } from "react";

const REL_TYPE_OPTIONS: { value: ErRelationshipType; label: string }[] = [
  { value: "one-to-one", label: "1 : 1" },
  { value: "one-to-many", label: "1 : N" },
  { value: "many-to-one", label: "N : 1" },
  { value: "many-to-many", label: "M : N" },
];

const EXTRAS_WORD_LIMIT = 5;

/**
 * ErRightPanel — ER-specific property editors for the right sidebar.
 */
export const ErRightPanel = () => {
  const {
    schemas,
    relationships,
    selectedSchemaId,
    selectedRelationshipId,
    updateSchema,
    addColumn,
    updateColumn,
    removeColumn,
    updateRelationship,
  } = useErDiagramStore();

  const selectedSchema = schemas.find((s) => s.id === selectedSchemaId);
  const selectedRelationship = relationships.find(
    (r) => r.id === selectedRelationshipId
  );

  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());

  const toggleCol = (colId: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  // ── Nothing Selected ───────────────────────────────────────────
  if (!selectedSchema && !selectedRelationship) {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-200">
        <div className="bg-bg/40 p-3 rounded-lg border border-border/40">
          <p className="text-[10px] text-neutral/50 italic leading-relaxed">
            Select a schema or relationship on the canvas to edit its properties.
          </p>
        </div>
      </div>
    );
  }

  // ── Schema Selected ────────────────────────────────────────────
  if (selectedSchema) {
    return (
      <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
        {/* Schema Name */}
        <div>
          <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Type size={12} /> Schema Name
          </label>
          <input
            type="text"
            value={selectedSchema.name}
            onChange={(e) =>
              updateSchema(selectedSchema.id, { name: e.target.value })
            }
            className="w-full text-xs bg-bg border border-border/80 rounded block p-2.5 text-neutral outline-none focus:border-primary placeholder:text-neutral/30"
            placeholder="Schema name..."
          />
        </div>

        {/* Columns */}
        <div>
          <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Columns3 size={12} /> Columns
          </label>

          <div className="flex flex-col gap-1.5">
            {selectedSchema.columns.map((col) => {
              const isExpanded = expandedCols.has(col.id);
              return (
                <div
                  key={col.id}
                  className="border border-border/60 rounded-md bg-bg/30 overflow-hidden"
                >
                  {/* Column header */}
                  <div
                    className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-neutral/5 transition-colors"
                    onClick={() => toggleCol(col.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={12} className="text-neutral/40 shrink-0" />
                    ) : (
                      <ChevronRight size={12} className="text-neutral/40 shrink-0" />
                    )}
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateColumn(selectedSchema.id, col.id, {
                          name: e.target.value,
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-xs bg-transparent text-neutral outline-none font-medium"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeColumn(selectedSchema.id, col.id);
                      }}
                      className="p-0.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Expanded column properties */}
                  {isExpanded && (
                    <div className="px-3 pb-2.5 pt-1 flex flex-col gap-2 border-t border-border/40">
                      {/* Key */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral/50 w-16 shrink-0">
                          Key
                        </span>
                        <select
                          value={col.key}
                          onChange={(e) =>
                            updateColumn(selectedSchema.id, col.id, {
                              key: e.target.value as "none" | "PK" | "FK",
                            })
                          }
                          className="flex-1 text-[10px] bg-bg border border-border/60 rounded p-1.5 text-neutral outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="none">None</option>
                          <option value="PK">PK (Primary Key)</option>
                          <option value="FK">FK (Foreign Key)</option>
                        </select>
                      </div>

                      {/* Data Type */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral/50 w-16 shrink-0">
                          Type
                        </span>
                        <select
                          value={col.dataType}
                          onChange={(e) =>
                            updateColumn(selectedSchema.id, col.id, {
                              dataType: e.target.value as ErDataType,
                            })
                          }
                          className="flex-1 text-[10px] bg-bg border border-border/60 rounded p-1.5 text-neutral outline-none focus:border-primary cursor-pointer"
                        >
                          {ER_DATA_TYPES.map((dt) => (
                            <option key={dt} value={dt}>
                              {dt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Required */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] text-neutral/50 w-16 shrink-0">
                          Required
                        </span>
                        <input
                          type="checkbox"
                          checked={col.required}
                          onChange={(e) =>
                            updateColumn(selectedSchema.id, col.id, {
                              required: e.target.checked,
                            })
                          }
                          className="accent-primary cursor-pointer"
                        />
                      </label>

                      {/* Unique */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] text-neutral/50 w-16 shrink-0">
                          Unique
                        </span>
                        <input
                          type="checkbox"
                          checked={col.unique}
                          onChange={(e) =>
                            updateColumn(selectedSchema.id, col.id, {
                              unique: e.target.checked,
                            })
                          }
                          className="accent-primary cursor-pointer"
                        />
                      </label>

                      {/* Extras (button to show textbox, 5 word limit) */}
                      <ExtrasField
                        value={col.extras}
                        onChange={(val) =>
                          updateColumn(selectedSchema.id, col.id, {
                            extras: val,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => addColumn(selectedSchema.id)}
            className="w-full mt-2 text-[10px] text-primary/70 hover:text-primary border border-dashed border-primary/30 hover:border-primary/60 rounded-md py-1.5 transition-colors flex items-center justify-center gap-1 font-medium"
          >
            <Plus size={12} /> Add Column
          </button>
        </div>

        {/* Schema Design */}
        <div>
          <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Palette size={12} /> Schema Design
          </label>

          {/* Color swatches */}
          <div className="mb-3">
            <span className="text-[10px] text-neutral/50 mb-1.5 block">
              Color
            </span>
            <div className="flex gap-2">
              {(Object.keys(ER_COLORS) as ErColorName[]).map((colorName) => (
                <button
                  key={colorName}
                  onClick={() =>
                    updateSchema(selectedSchema.id, { color: colorName })
                  }
                  className={`w-7 h-7 rounded-md transition-all cursor-pointer ${
                    selectedSchema.color === colorName
                      ? "ring-2 ring-white/60 ring-offset-1 ring-offset-bg scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: ER_COLORS[colorName] }}
                  title={colorName}
                />
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <span className="text-[10px] text-neutral/50 mb-1.5 block">
              Font
            </span>
            <select
              value={selectedSchema.fontFamily}
              onChange={(e) =>
                updateSchema(selectedSchema.id, {
                  fontFamily: e.target.value as ErFontFamily,
                })
              }
              className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer"
            >
              {ER_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // ── Relationship Selected ──────────────────────────────────────
  if (selectedRelationship) {
    return (
      <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
        <div>
          <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Link2 size={12} /> Relationship Type
          </label>
          <select
            value={selectedRelationship.type}
            onChange={(e) =>
              updateRelationship(selectedRelationship.id, {
                type: e.target.value as ErRelationshipType,
              })
            }
            className="w-full text-xs bg-bg border border-border/80 rounded block p-2.5 text-neutral outline-none focus:border-primary cursor-pointer"
          >
            {REL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 block">
              Source
            </label>
            <select
              value={selectedRelationship.sourceSchemaId}
              onChange={(e) =>
                updateRelationship(selectedRelationship.id, {
                  sourceSchemaId: e.target.value,
                })
              }
              className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer truncate"
            >
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider mb-1.5 block">
              Target
            </label>
            <select
              value={selectedRelationship.targetSchemaId}
              onChange={(e) =>
                updateRelationship(selectedRelationship.id, {
                  targetSchemaId: e.target.value,
                })
              }
              className="w-full text-xs bg-bg border border-border/80 rounded block p-2 text-neutral outline-none focus:border-primary cursor-pointer truncate"
            >
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ── Extras Field Component ──────────────────────────────────────────

function ExtrasField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [showInput, setShowInput] = useState(!!value);

  const handleChange = (input: string) => {
    // Enforce word limit
    const words = input.split(/\s+/).filter(Boolean);
    if (words.length <= EXTRAS_WORD_LIMIT) {
      onChange(input);
    } else {
      onChange(words.slice(0, EXTRAS_WORD_LIMIT).join(" "));
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="text-[10px] text-primary/60 hover:text-primary transition-colors text-left cursor-pointer"
      >
        + Add extra info
      </button>
    );
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-neutral/50 w-16 shrink-0">
          Extra
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. reference to User"
          className="flex-1 text-[10px] bg-bg border border-border/60 rounded p-1.5 text-neutral outline-none focus:border-primary placeholder:text-neutral/30"
        />
      </div>
      <span className="text-[9px] text-neutral/30 text-right">
        {wordCount}/{EXTRAS_WORD_LIMIT} words
      </span>
    </div>
  );
}
