import { useDiagramStore } from "../store/useDiagramStore";
import { RefreshCw } from "lucide-react";

export const PaneRightCode = () => {
  const { mermaidCode, setMermaidCode } = useDiagramStore();

  return (
    <div className="flex flex-col h-1/3 md:h-full bg-slate-900/60 backdrop-blur-xl shadow-xl w-full md:w-64 lg:w-72 xl:w-80 2xl:w-96 border-t md:border-t-0 md:border-l border-slate-800/50 shrink-0">
      <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-transparent">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-100 uppercase tracking-wider">
          Mermaid.js Code
        </h2>
        <button
          onClick={() => setMermaidCode(mermaidCode)}
          className="text-slate-500 hover:text-[#6366f1] transition-colors"
          title="Force Sync"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 p-2">
        <textarea
          value={mermaidCode}
          onChange={(e) => setMermaidCode(e.target.value)}
          className="w-full h-full bg-slate-950/50 text-cyan-400 font-mono text-xs p-3 rounded-md border border-transparent focus:border-[#6366f1]/50 focus:outline-none resize-none placeholder:text-slate-700"
          spellCheck="false"
          placeholder="Enter Mermaid code here..."
        />
      </div>
    </div>
  );
};
