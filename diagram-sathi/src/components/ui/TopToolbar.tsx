import { MousePointer2, Hand, RefreshCw } from "lucide-react";
import { useDiagramStore } from "../../store/useDiagramStore";

/**
 * TopToolbar Component
 * 
 * Hand-tailored floating toolbar providing the primary interactions over the 
 * canvas (Cursor/Select mode, Pan/Hand mode, and Auto-align/Refresh Layout).
 */
export const TopToolbar = () => {
  const { activeTool, setActiveTool, forceLayoutRefresh } = useDiagramStore();

  const tools = [
    { id: "cursor", icon: MousePointer2, label: "Cursor (V)" },
    { id: "pan", icon: Hand, label: "Hand (H)" },
  ] as const;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center bg-[#2b2d31]/95 backdrop-blur-xl border border-slate-700/60 rounded-xl p-1.5 gap-1.5 shadow-2xl z-50">
      <div className="flex items-center gap-1.5">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id as any)}
            title={t.label}
            className={`w-10 h-10 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center ${
              activeTool === t.id
                ? "bg-[#0b84ff] text-white shadow-md shadow-[#0b84ff]/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            <t.icon size={20} strokeWidth={activeTool === t.id ? 2.5 : 2} />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1"></div>

      <button
        onClick={forceLayoutRefresh}
        title="Reset Layout (Auto-align)"
        className="w-10 h-10 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center group"
      >
        <RefreshCw size={20} strokeWidth={2} className="group-hover:rotate-180 transition-transform duration-500 ease-in-out" />
      </button>
    </div>
  );
};
