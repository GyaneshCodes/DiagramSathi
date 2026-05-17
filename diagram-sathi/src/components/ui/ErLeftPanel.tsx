import { useErDiagramStore, ER_COLORS } from "../../store/useErDiagramStore";
import { Table2, Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * ErLeftPanel — ER-specific controls for the left sidebar.
 * Shows schema list, relationship list, and add buttons.
 */
export const ErLeftPanel = () => {
  const {
    schemas,
    relationships,
    selectedSchemaId,
    selectedRelationshipId,
    setSelectedSchemaId,
    setSelectedRelationshipId,
    addSchema,
    removeSchema,
    addRelationship,
    removeRelationship,
  } = useErDiagramStore();

  const [showAddRel, setShowAddRel] = useState(false);
  const [relSource, setRelSource] = useState("");
  const [relTarget, setRelTarget] = useState("");

  const handleAddRelationship = () => {
    if (relSource && relTarget && relSource !== relTarget) {
      addRelationship(relSource, relTarget, "one-to-many");
      setShowAddRel(false);
      setRelSource("");
      setRelTarget("");
    }
  };

  const getRelLabel = (rel: typeof relationships[0]) => {
    const src = schemas.find((s) => s.id === rel.sourceSchemaId);
    const tgt = schemas.find((s) => s.id === rel.targetSchemaId);
    const typeLabels: Record<string, string> = {
      "one-to-one": "1:1",
      "one-to-many": "1:N",
      "many-to-one": "N:1",
      "many-to-many": "M:N",
    };
    return `${src?.name || "?"} → ${tgt?.name || "?"} (${typeLabels[rel.type] || "1:N"})`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Schemas Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-2">
            <Table2 size={12} /> Schemas
          </h3>
          <button
            onClick={() => {
              const newId = addSchema();
              setSelectedSchemaId(newId);
            }}
            className="p-1 text-neutral/40 hover:text-primary hover:bg-primary/10 cursor-pointer rounded transition-colors"
            title="Add Schema"
          >
            <Plus size={14} />
          </button>
        </div>
        <ul className="space-y-0.5">
          {schemas.map((s) => (
            <li
              key={s.id}
              onClick={() => setSelectedSchemaId(s.id)}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md text-xs transition-colors group ${
                selectedSchemaId === s.id
                  ? "bg-primary/20 text-primary"
                  : "text-neutral/70 hover:bg-neutral/10 hover:text-neutral"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: ER_COLORS[s.color] }}
              />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto text-[9px] opacity-40">
                {s.columns.length} cols
              </span>
              {selectedSchemaId === s.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSchema(s.id);
                  }}
                  className="p-1 text-red-500 hover:bg-red-500/20 rounded cursor-pointer transition-colors"
                  title="Delete Schema"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          ))}
          {schemas.length === 0 && (
            <li className="text-[10px] text-neutral/40 italic px-2 py-2">
              No schemas yet. Click + to add one.
            </li>
          )}
        </ul>
      </div>

      {/* Relationships Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold text-neutral/40 uppercase tracking-wider flex items-center gap-2">
            <Link2 size={12} /> Relationships
          </h3>
          <button
            onClick={() => {
              if (schemas.length >= 2) {
                setShowAddRel(!showAddRel);
                if (!relSource && schemas.length > 0) setRelSource(schemas[0].id);
                if (!relTarget && schemas.length > 1) setRelTarget(schemas[1].id);
              }
            }}
            disabled={schemas.length < 2}
            className="p-1 text-neutral/40 hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            title="Add Relationship"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Add Relationship inline form */}
        {showAddRel && (
          <div className="mb-2 p-2 rounded-md border border-border/60 bg-bg/40 flex flex-col gap-2">
            <select
              value={relSource}
              onChange={(e) => setRelSource(e.target.value)}
              className="w-full text-[10px] bg-bg border border-border/60 rounded p-1.5 text-neutral outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Select source...</option>
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={relTarget}
              onChange={(e) => setRelTarget(e.target.value)}
              className="w-full text-[10px] bg-bg border border-border/60 rounded p-1.5 text-neutral outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Select target...</option>
              {schemas.filter((s) => s.id !== relSource).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <button
                onClick={handleAddRelationship}
                disabled={!relSource || !relTarget || relSource === relTarget}
                className="flex-1 text-[10px] bg-primary/80 hover:bg-primary text-white py-1 rounded transition-colors disabled:opacity-40 font-medium"
              >
                Create (1:N)
              </button>
              <button
                onClick={() => setShowAddRel(false)}
                className="text-[10px] text-neutral/50 hover:text-neutral px-2 py-1 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-0.5">
          {relationships.map((r) => (
            <li
              key={r.id}
              onClick={() => setSelectedRelationshipId(r.id)}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md text-xs transition-colors group ${
                selectedRelationshipId === r.id
                  ? "bg-primary/20 text-primary"
                  : "text-neutral/70 hover:bg-neutral/10 hover:text-neutral"
              }`}
            >
              <Link2 size={12} className="shrink-0" />
              <span className="truncate">{getRelLabel(r)}</span>
              {selectedRelationshipId === r.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRelationship(r.id);
                  }}
                  className="ml-auto p-1 text-red-500 hover:bg-red-500/20 rounded cursor-pointer transition-colors"
                  title="Delete Relationship"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          ))}
          {relationships.length === 0 && (
            <li className="text-[10px] text-neutral/40 italic px-2 py-2">
              No relationships yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
