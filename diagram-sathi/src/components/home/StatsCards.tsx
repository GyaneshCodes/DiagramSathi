import { useState } from "react";
import { Layers, BarChart3, TrendingUp, Sparkles, Plus, Check, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDiagramStore } from "../../store/useDiagramStore";

interface StatsCardsProps {
  totalDiagrams: number;
  mostCreatedType: string;
  typeBreakdown: Record<string, number>;
  loading: boolean;
  selectedFilter?: string | null;
  onSelectFilter?: (type: string | null) => void;
}

// Known diagram type label map with dynamic fallback formatter
const KNOWN_TYPE_LABELS: Record<string, string> = {
  dfd: "DFD",
  er: "ER Diagram",
  flowchart: "Flowchart",
  sequence: "Sequence Diagram",
  class: "Class Diagram",
  architecture: "Architecture",
  mindmap: "Mindmap",
  None: "—",
};

// Curated palette array for dynamic color generation for ANY current or future diagram type
const TYPE_COLOR_PALETTE = [
  { text: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-400/30", gradient: "from-emerald-500/10 to-teal-500/5" },
  { text: "text-cyan-400", bg: "bg-cyan-400", border: "border-cyan-400/30", gradient: "from-cyan-500/10 to-blue-500/5" },
  { text: "text-amber-400", bg: "bg-amber-400", border: "border-amber-400/30", gradient: "from-amber-500/10 to-orange-500/5" },
  { text: "text-rose-400", bg: "bg-rose-400", border: "border-rose-400/30", gradient: "from-rose-500/10 to-pink-500/5" },
  { text: "text-indigo-400", bg: "bg-indigo-400", border: "border-indigo-400/30", gradient: "from-indigo-500/10 to-purple-500/5" },
  { text: "text-teal-400", bg: "bg-teal-400", border: "border-teal-400/30", gradient: "from-teal-500/10 to-emerald-500/5" },
];

/**
 * Format any diagram type key into a human-readable label automatically.
 */
export function formatTypeLabel(typeKey: string): string {
  if (!typeKey || typeKey === "None") return "—";
  if (KNOWN_TYPE_LABELS[typeKey.toLowerCase()]) {
    return KNOWN_TYPE_LABELS[typeKey.toLowerCase()];
  }
  // Automatic fallback formatter for future diagram types (e.g., "user_flow" -> "User Flow")
  return typeKey
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get deterministic color theme for any type key (existing or future)
 */
export function getTypeTheme(typeKey: string, index = 0) {
  const hash = typeKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const paletteIndex = (hash + index) % TYPE_COLOR_PALETTE.length;
  return TYPE_COLOR_PALETTE[paletteIndex];
}

export function StatsCards({
  totalDiagrams,
  mostCreatedType,
  typeBreakdown,
  loading,
  selectedFilter = null,
  onSelectFilter,
}: StatsCardsProps) {
  const navigate = useNavigate();
  const resetToBlank = useDiagramStore((s) => s.resetToBlank);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // Dynamic type calculations for ANY diagram types present in breakdown
  const typeEntries = Object.entries(typeBreakdown).filter(([_, count]) => count > 0);
  const calculatedTotalFromTypes = typeEntries.reduce((acc, [_, count]) => acc + count, 0);
  const effectiveTotal = Math.max(totalDiagrams, calculatedTotalFromTypes);

  // Quick launch helper for most created diagram
  const handleQuickLaunch = (e: React.MouseEvent, typeKey: string) => {
    e.stopPropagation();
    if (!typeKey || typeKey === "None") return;
    const validTypes = ["flowchart", "dfd", "er"];
    const targetType = validTypes.includes(typeKey.toLowerCase())
      ? (typeKey.toLowerCase() as "flowchart" | "dfd" | "er")
      : "flowchart";
    
    resetToBlank(targetType);
    navigate("/editor");
  };

  const formattedMostCreated = formatTypeLabel(mostCreatedType);
  const mostCreatedTheme = getTypeTheme(mostCreatedType);

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-neutral/80">
              Architect&apos;s Stats
            </h2>
            {selectedFilter && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase font-bold">
                <Filter className="w-3 h-3" />
                Filtered: {selectedFilter === "pinned" ? "Pinned" : formatTypeLabel(selectedFilter)}
                <button
                  onClick={() => onSelectFilter?.(null)}
                  className="ml-1 hover:text-neutral cursor-pointer"
                  title="Clear Filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral/40 font-mono uppercase tracking-widest hidden sm:inline-block">
            DYNAMIC METRICS &amp; FILTERS
          </span>
        </div>

        {/* 4 Dynamic Interactive Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: TOTAL DIAGRAMS */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => onSelectFilter?.(null)}
            className={`relative flex flex-col justify-between p-4 rounded-xl border bg-panel overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] ${
              selectedFilter === null
                ? "border-primary/50 shadow-md shadow-primary/10"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-indigo-500/5 opacity-50" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-neutral/5 border border-border flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Active
              </span>
            </div>
            <div className="relative z-10 mt-4">
              <p className="text-[10px] text-neutral/40 font-medium uppercase tracking-wider font-mono">
                Total Diagrams
              </p>
              <p className="text-2xl font-black text-neutral mt-0.5 tracking-tight">
                {loading ? "—" : totalDiagrams}
              </p>
            </div>
            <div className="relative z-10 mt-3 pt-2 border-t border-border/40 flex justify-between items-center text-[10px] text-neutral/40 font-mono">
              <span>Show All Recents</span>
              {selectedFilter === null && <Check className="w-3 h-3 text-primary" />}
            </div>
          </motion.div>

          {/* CARD 2: DYNAMIC TYPE DISTRIBUTION BAR */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
            className={`relative flex flex-col justify-between p-4 rounded-xl border bg-panel overflow-hidden transition-all duration-300 group hover:scale-[1.02] ${
              selectedFilter && selectedFilter !== "pinned"
                ? "border-emerald-400/50 shadow-md shadow-emerald-500/10"
                : "border-border hover:border-emerald-400/30"
            }`}
          >
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-teal-500/5 opacity-50" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-neutral/5 border border-border flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                {typeEntries.length} Types
              </span>
            </div>

            <div className="relative z-10 mt-3 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] text-neutral/40 font-medium uppercase tracking-wider font-mono">
                  Type Distribution
                </p>
                <span className="text-[10px] text-neutral/60 font-mono font-bold">
                  {hoveredType ? formatTypeLabel(hoveredType) : "All"}
                </span>
              </div>

              {/* Dynamic Segmented Progress Bar for ANY diagram types */}
              <div className="w-full bg-neutral/10 h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-border/30">
                {typeEntries.length === 0 ? (
                  <div className="w-full h-full bg-neutral/20 rounded-full" />
                ) : (
                  typeEntries.map(([typeKey, count], idx) => {
                    const percent = Math.round((count / effectiveTotal) * 100);
                    const theme = getTypeTheme(typeKey, idx);
                    const isSelected = selectedFilter === typeKey;
                    return (
                      <div
                        key={typeKey}
                        onMouseEnter={() => setHoveredType(typeKey)}
                        onMouseLeave={() => setHoveredType(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFilter?.(isSelected ? null : typeKey);
                        }}
                        style={{ width: `${Math.max(percent, 8)}%` }}
                        className={`h-full ${theme.bg} rounded-xs cursor-pointer transition-all duration-300 hover:opacity-100 ${
                          isSelected ? "ring-1 ring-white opacity-100" : "opacity-80"
                        }`}
                        title={`${formatTypeLabel(typeKey)}: ${count} (${percent}%)`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Micro badges below */}
            <div className="relative z-10 mt-3 pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
              {typeEntries.map(([typeKey, count], idx) => {
                const theme = getTypeTheme(typeKey, idx);
                const isSelected = selectedFilter === typeKey;
                return (
                  <button
                    key={typeKey}
                    onClick={() => onSelectFilter?.(isSelected ? null : typeKey)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                      isSelected
                        ? `${theme.bg} text-neutral-900 border-white font-bold`
                        : `${theme.border} bg-neutral/5 ${theme.text} hover:bg-neutral/10`
                    }`}
                  >
                    {formatTypeLabel(typeKey)}: {count}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* CARD 3: MOST CREATED & QUICK LAUNCH */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.51 }}
            onClick={() => {
              if (mostCreatedType && mostCreatedType !== "None") {
                onSelectFilter?.(selectedFilter === mostCreatedType ? null : mostCreatedType);
              }
            }}
            className={`relative flex flex-col justify-between p-4 rounded-xl border bg-panel overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] ${
              selectedFilter === mostCreatedType
                ? `${mostCreatedTheme.border} shadow-md`
                : "border-border hover:border-amber-400/30"
            }`}
          >
            <div className={`absolute inset-0 bg-linear-to-br ${mostCreatedTheme.gradient} opacity-50`} />
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-neutral/5 border border-border flex items-center justify-center shrink-0">
                <Sparkles className={`w-4 h-4 ${mostCreatedTheme.text}`} />
              </div>

              {mostCreatedType && mostCreatedType !== "None" && (
                <button
                  onClick={(e) => handleQuickLaunch(e, mostCreatedType)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-mono font-bold transition-all shadow-xs cursor-pointer"
                  title={`Create new ${formattedMostCreated}`}
                >
                  <Plus className="w-3 h-3" />
                  + New
                </button>
              )}
            </div>

            <div className="relative z-10 mt-3">
              <p className="text-[10px] text-neutral/40 font-medium uppercase tracking-wider font-mono">
                Most Created Type
              </p>
              <p className="text-xl font-black text-neutral mt-0.5 tracking-tight truncate">
                {loading ? "—" : formattedMostCreated}
              </p>
            </div>

            <div className="relative z-10 mt-3 pt-2 border-t border-border/40 flex justify-between items-center text-[10px] text-neutral/40 font-mono">
              <span>Filter by {formattedMostCreated}</span>
              {selectedFilter === mostCreatedType && <Check className="w-3 h-3 text-primary" />}
            </div>
          </motion.div>

          {/* CARD 4: ACTIVE PROJECTS & PINNED METRICS */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.59 }}
            onClick={() => onSelectFilter?.(selectedFilter === "pinned" ? null : "pinned")}
            className={`relative flex flex-col justify-between p-4 rounded-xl border bg-panel overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] ${
              selectedFilter === "pinned"
                ? "border-amber-400/50 shadow-md shadow-amber-500/10"
                : "border-border hover:border-amber-400/30"
            }`}
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 to-orange-500/5 opacity-50" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-neutral/5 border border-border flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-mono font-semibold">
                Workspace
              </span>
            </div>

            <div className="relative z-10 mt-3">
              <p className="text-[10px] text-neutral/40 font-medium uppercase tracking-wider font-mono">
                Active &amp; Pinned
              </p>
              <p className="text-2xl font-black text-neutral mt-0.5 tracking-tight">
                {loading ? "—" : totalDiagrams}
              </p>
            </div>

            <div className="relative z-10 mt-3 pt-2 border-t border-border/40 flex justify-between items-center text-[10px] text-neutral/40 font-mono">
              <span>Filter Pinned Diagrams</span>
              {selectedFilter === "pinned" && <Check className="w-3 h-3 text-amber-400" />}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

