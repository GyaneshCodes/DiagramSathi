import { useDiagramStore } from "../../store/useDiagramStore";
import { useErDiagramStore } from "../../store/useErDiagramStore";
import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

/**
 * CodeEditorPanel Component
 * 
 * Shows Mermaid.js code for DFD/Flowchart, or custom ER DSL for ER diagrams.
 * Changes are bidirectional: code ↔ AST.
 */
export const CodeEditorPanel = () => {
  const { mermaidCode, setMermaidCode, diagramType } = useDiagramStore();
  const { erCode, setErCode, syncCodeToSchemas } = useErDiagramStore();

  const isEr = diagramType === "er";
  const code = isEr ? erCode : mermaidCode;

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCodeChange = useCallback(
    (value: string) => {
      if (isEr) {
        setErCode(value);
        // Debounced parse for ER
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          syncCodeToSchemas();
        }, 400);
      } else {
        setMermaidCode(value);
      }
    },
    [isEr, setErCode, setMermaidCode, syncCodeToSchemas]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-1/3 md:h-full bg-panel/60 backdrop-blur-xl shadow-xl w-full md:w-64 lg:w-72 xl:w-80 2xl:w-96 border-t md:border-t-0 md:border-l border-border/80 shrink-0">
      <div className="p-4 border-b border-border/80 flex justify-between items-center bg-transparent">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-neutral uppercase tracking-wider">
          {isEr ? "ER Schema Code" : "Mermaid.js Code"}
        </h2>
        {!isEr && (
          <button
            onClick={() => {
              const cleanedCode = mermaidCode
                .split("\n")
                .filter(
                  (line) =>
                    !line.trim().startsWith("%% @nodePosition:") &&
                    !line.trim().startsWith("%% @nodeSize:")
                )
                .join("\n");
              setMermaidCode(cleanedCode);
            }}
            className="text-neutral/50 hover:text-primary transition-colors p-1 rounded-full hover:bg-neutral/10"
            title="Force Sync (Reset Layout)"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 p-2">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-full bg-bg/50 text-info font-mono text-xs p-3 rounded-md border border-transparent focus:border-primary/50 focus:outline-none resize-none placeholder:text-neutral/40"
          spellCheck="false"
          placeholder={
            isEr
              ? "Define schemas and relationships...\n\nUser[color: blue]{\n  userId: number required unique pk\n  username: string\n}\n\nUser < Post"
              : "Enter Mermaid code here..."
          }
        />
      </div>
    </div>
  );
};

