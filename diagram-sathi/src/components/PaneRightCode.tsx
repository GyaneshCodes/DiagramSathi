import { useDiagramStore } from "../store/useDiagramStore";
import { RefreshCw } from "lucide-react";

export const PaneRightCode = () => {
  const { mermaidCode, setMermaidCode } = useDiagramStore();

  return (
    <div className="flex flex-col h-1/3 md:h-full bg-slate-900 shadow-sm w-full md:w-64 lg:w-72 xl:w-80 2xl:w-96 border-t md:border-t-0 md:border-l border-slate-700 shrink-0">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200 uppercase tracking-wider">
          Mermaid.js Code
        </h2>
        <button
          onClick={() => setMermaidCode(mermaidCode)}
          className="text-slate-400 hover:text-white transition-colors"
          title="Force Sync"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 p-2">
        <textarea
          value={mermaidCode}
          onChange={(e) => setMermaidCode(e.target.value)}
          className="w-full h-full bg-slate-900 text-green-400 font-mono text-xs p-3 focus:outline-none resize-none"
          spellCheck="false"
          placeholder="Enter Mermaid code here..."
        />
      </div>
    </div>
  );
};
