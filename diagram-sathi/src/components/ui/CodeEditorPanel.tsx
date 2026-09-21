import { useDiagramStore } from "../../store/useDiagramStore";
import { useErDiagramStore } from "../../store/useErDiagramStore";
import {
  RefreshCw,
  Play,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Wand2,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import mermaid from "mermaid";
import toast from "react-hot-toast";
import { parseMermaidCode, serializeAstToMermaid } from "../../utils/mermaidParser";

// Initialize mermaid for headless parsing
try {
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    securityLevel: "loose",
  });
} catch {
  // Ignore re-init warnings
}

/** Custom Transparent CodeMirror 6 Theme matching DiagramSathi */
const diagramSathiTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    color: "var(--neutral, #f8fafc)",
    fontSize: "12px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "var(--primary, #6366f1)",
    padding: "10px 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--primary, #6366f1)",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "rgba(99, 102, 241, 0.3) !important",
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    color: "rgba(255, 255, 255, 0.3)",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--primary, #6366f1)",
    fontWeight: "bold",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".cm-tooltip-autocomplete": {
    backgroundColor: "#1e1b4b !important",
    border: "1px solid rgba(255, 255, 255, 0.15) !important",
    borderRadius: "8px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete ul li": {
    padding: "4px 8px",
    fontSize: "11px",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--primary, #6366f1) !important",
    color: "#ffffff !important",
  },
});

const diagramSathiHighlighting = HighlightStyle.define([
  { tag: t.keyword, color: "#f43f5e", fontWeight: "bold" },
  { tag: t.string, color: "#10b981" },
  { tag: t.comment, color: "#64748b", fontStyle: "italic" },
  { tag: t.variableName, color: "#38bdf8" },
  { tag: t.operator, color: "#f59e0b" },
  { tag: t.bracket, color: "#a855f7" },
]);

/**
 * CodeEditorPanel Component
 * 
 * Features:
 * - Transparent CodeMirror 6 Theme (matches DiagramSathi glassmorphism)
 * - Mermaid IntelliSense / Autocomplete (keywords, shapes, arrows, canvas node IDs)
 * - Standard VS Code Ctrl+Enter behavior
 * - Prominent "Apply to Canvas" Primary Header Action Bar
 * - Real-time Mermaid syntax diagnostics
 */
export const CodeEditorPanel = () => {
  const { mermaidCode, setMermaidCode, appendCodeToAst, diagramType, setShowCodeInRightPanel, nodes } = useDiagramStore();
  const { erCode, setErCode, syncCodeToSchemas } = useErDiagramStore();

  const isEr = diagramType === "er";
  const code = isEr ? erCode : mermaidCode;

  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate Mermaid syntax on change (debounced 350ms)
  const validateMermaid = useCallback(async (text: string) => {
    if (isEr || !text.trim()) {
      setSyntaxError(null);
      return;
    }
    try {
      await mermaid.parse(text);
      setSyntaxError(null);
    } catch (err: any) {
      const errMsg = err?.str || err?.message || "Syntax Error";
      const firstLine = errMsg.split("\n")[0].replace(/^Error:\s*/i, "");
      setSyntaxError(firstLine);
    }
  }, [isEr]);

  const handleCodeChange = useCallback(
    (value: string) => {
      if (isEr) {
        setErCode(value);
      } else {
        setMermaidCode(value);
      }

      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
      validateTimerRef.current = setTimeout(() => {
        validateMermaid(value);
      }, 350);
    },
    [isEr, setErCode, setMermaidCode, validateMermaid]
  );

  // Trigger Apply to Canvas
  const handleApplyToCanvas = useCallback(() => {
    if (isEr) {
      syncCodeToSchemas();
    } else {
      appendCodeToAst(mermaidCode);
    }
    setApplied(true);
    toast.success("Applied to Canvas!");
    setTimeout(() => setApplied(false), 1500);
  }, [isEr, mermaidCode, appendCodeToAst, syncCodeToSchemas]);

  // Custom Mermaid Completion Source
  const mermaidCompletions = useCallback((context: CompletionContext) => {
    const word = context.matchBefore(/[\w\-=>.|]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const keywords = [
      { label: "flowchart LR", type: "keyword", detail: "Flowchart Left-to-Right" },
      { label: "flowchart TD", type: "keyword", detail: "Flowchart Top-Down" },
      { label: "graph LR", type: "keyword", detail: "Graph Left-to-Right" },
      { label: "graph TD", type: "keyword", detail: "Graph Top-Down" },
      { label: "subgraph", type: "keyword", detail: "Subgraph container" },
      { label: "end", type: "keyword", detail: "Close subgraph block" },
      { label: "style", type: "keyword", detail: "Node styling directive" },
    ];

    const shapes = [
      { label: '["Rectangle Label"]', type: "text", detail: "Rectangle Shape" },
      { label: '("Circle Label")', type: "text", detail: "Circle Shape" },
      { label: '[("Database Label")]', type: "text", detail: "Cylinder/Database Shape" },
      { label: '{"Decision Label"}', type: "text", detail: "Diamond Decision Shape" },
      { label: '(["Stadium Label"])', type: "text", detail: "Stadium Shape" },
      { label: '{{ "Hexagon Label" }}', type: "text", detail: "Hexagon Shape" },
    ];

    const arrows = [
      { label: "-->", type: "operator", detail: "Solid Arrow" },
      { label: "---", type: "operator", detail: "Solid Line (no arrow)" },
      { label: "-.->", type: "operator", detail: "Dashed Arrow" },
      { label: "==>", type: "operator", detail: "Thick Arrow" },
      { label: "-->|Label|", type: "operator", detail: "Arrow with Label" },
    ];

    const canvasNodeSuggestions = nodes.map((n) => ({
      label: n.id,
      type: "variable",
      detail: `Canvas Node: "${n.label}"`,
    }));

    return {
      from: word.from,
      options: [...keywords, ...shapes, ...arrows, ...canvasNodeSuggestions],
    };
  }, [nodes]);

  // Extensions array memoized (standard VS Code Ctrl+Enter behavior)
  const editorExtensions = useMemo(() => {
    return [
      markdown(),
      diagramSathiTheme,
      syntaxHighlighting(diagramSathiHighlighting),
      autocompletion({ override: [mermaidCompletions] }),
    ];
  }, [mermaidCompletions]);

  // AST Pretty Printer Format Code
  const handleFormatCode = useCallback(() => {
    if (!code || !code.trim()) return;
    try {
      if (isEr) {
        const formatted = code
          .split("\n")
          .map((line) => line.trimEnd())
          .filter((line, idx, arr) => !(line.trim() === "" && arr[idx - 1]?.trim() === ""))
          .join("\n");
        setErCode(formatted);
      } else {
        const parsed = parseMermaidCode(code, diagramType);
        const formatted = serializeAstToMermaid(parsed.nodes, parsed.edges, parsed.direction, parsed.diagramType);
        setMermaidCode(formatted);
      }
      toast.success("Code formatted & prettified!");
    } catch {
      toast.error("Format failed");
    }
  }, [code, isEr, diagramType, setErCode, setMermaidCode]);

  // Copy Code
  const handleCopyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Clean metadata / refresh code from current AST
  const handleRefreshFromAst = useCallback(() => {
    if (isEr) return;
    const storeState = useDiagramStore.getState();
    const formatted = serializeAstToMermaid(
      storeState.nodes,
      storeState.edges,
      storeState.direction,
      storeState.diagramType === "er" ? "dfd" : storeState.diagramType
    );
    setMermaidCode(formatted);
    toast.success("Code refreshed from Canvas!");
  }, [isEr, setMermaidCode]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-transparent shrink-0 select-none overflow-hidden">
      {/* Primary Header & Actions Bar */}
      <div className="p-3 border-b border-border/70 flex flex-col gap-2.5 bg-bg/20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCodeInRightPanel(false)}
              className="p-1 text-neutral/60 hover:text-primary hover:bg-neutral/10 rounded-md transition-colors"
              title="Back to Properties Inspector"
            >
              <ArrowLeft size={15} />
            </button>
            <h2 className="text-xs font-semibold tracking-wider text-neutral uppercase">
              {isEr ? "ER Schema Code" : "Mermaid Code"}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleFormatCode}
              className="p-1.5 text-neutral/70 hover:text-primary hover:bg-neutral/10 rounded-md transition-colors"
              title="Format & Prettify Code"
            >
              <Wand2 size={14} />
            </button>
            <button
              onClick={handleCopyCode}
              className="p-1.5 text-neutral/70 hover:text-primary hover:bg-neutral/10 rounded-md transition-colors"
              title="Copy Code"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            {!isEr && (
              <button
                onClick={handleRefreshFromAst}
                className="p-1.5 text-neutral/70 hover:text-primary hover:bg-neutral/10 rounded-md transition-colors"
                title="Refresh Code from Canvas"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Prominent Apply to Canvas Action Button */}
        <button
          onClick={handleApplyToCanvas}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white shadow-md transition-all ${
            applied
              ? "bg-emerald-600 shadow-emerald-500/20"
              : "bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-primary/25"
          }`}
          title="Apply code changes to canvas"
        >
          {applied ? <Check size={14} /> : <Play size={14} className="fill-current" />}
          <span>{applied ? "Applied to Canvas!" : "Apply to Canvas"}</span>
        </button>
      </div>

      {/* CodeMirror 6 Transparent Editor Area */}
      <div className="flex-1 overflow-hidden relative font-mono">
        <CodeMirror
          value={code}
          height="100%"
          extensions={editorExtensions}
          onChange={handleCodeChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            closeBrackets: true,
          }}
          className="h-full font-mono border-none"
        />
      </div>

      {/* Diagnostics / Status Footer */}
      <div className="p-2.5 px-3 border-t border-border/70 bg-bg/40 flex items-center justify-between text-[11px] font-mono shrink-0">
        {!isEr && syntaxError ? (
          <div className="flex items-center gap-1.5 text-amber-400 font-medium truncate max-w-[85%]" title={syntaxError}>
            <AlertCircle size={13} className="shrink-0 text-amber-400" />
            <span className="truncate">{syntaxError}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 size={13} className="shrink-0" />
            <span>Syntax Valid</span>
          </div>
        )}
        <span className="text-neutral/40 text-[10px]">Click Apply to Sync</span>
      </div>
    </div>
  );
};
