import {
  useDiagramStore,
  type DfdNode,
  type DfdEdge,
} from "../store/useDiagramStore";
import { generateDiagramFromDescription } from "../utils/gemini";

export const PaneLeftForm = () => {
  const {
    nodes,
    edges,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
    projectDescription,
    setProjectDescription,
    isGenerating,
    setIsGenerating,
    setMermaidCode,
    preferredDiagramType,
    setPreferredDiagramType,
  } = useDiagramStore();

  const handleSmartSuggest = async () => {
    if (!projectDescription.trim()) return;
    setIsGenerating(true);
    try {
      const generatedCode = await generateDiagramFromDescription(
        projectDescription,
        preferredDiagramType,
      );
      setMermaidCode(generatedCode);
    } catch (error: any) {
      alert(error.message || "Failed to generate diagram.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-1/3 md:h-full bg-white shadow-sm overflow-y-auto w-full md:w-64 lg:w-72 xl:w-80 2xl:w-96 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
      <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          DiagramSathi{" "}
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
            Aegis MVP
          </span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          DFD Level 0 Generator Form
        </p>
      </div>

      <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50">
        <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wider">
          AI Grounding
        </h3>
        <textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe your project, features or the system architecture to generate a diagram..."
          className="w-full text-sm bg-white border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 mb-2 resize-none h-24"
        />
        <div className="flex gap-2 mb-3 items-center">
          <span className="text-xs text-slate-500 font-medium">Type:</span>
          <select
            value={preferredDiagramType}
            onChange={(e) => setPreferredDiagramType(e.target.value as any)}
            className="flex-1 text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-400"
          >
            <option value="auto">Auto-detect from text</option>
            <option value="dfd">Force DFD</option>
            <option value="er">Force ER Diagram</option>
          </select>
        </div>
        <button
          onClick={handleSmartSuggest}
          disabled={isGenerating || !projectDescription.trim()}
          className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white py-2 rounded transition-colors font-medium cursor-pointer flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Diagram...
            </>
          ) : (
            "✨ Smart Suggest"
          )}
        </button>
      </div>

      <div className="p-4 flex-1">
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 border-b text-sm uppercase tracking-wider pb-1">
            Entities & Processes
          </h3>
          <ul className="space-y-2 mb-3">
            {nodes.map((n: DfdNode) => (
              <li
                key={n.id}
                className="text-sm flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200"
              >
                <div className="text-xs text-slate-400 font-mono mb-[-4px]">
                  ID: {n.id}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-1 gap-2 mr-2">
                    <select
                      value={n.type}
                      onChange={(e) =>
                        updateNode(n.id, {
                          type: e.target.value as
                            | "process"
                            | "entity"
                            | "datastore",
                        })
                      }
                      className={`text-xs p-1 rounded border min-w-[90px] focus:outline-none ${
                        n.type === "process"
                          ? "bg-amber-50 text-amber-900 border-amber-200"
                          : n.type === "datastore"
                            ? "bg-green-50 text-green-900 border-green-200"
                            : "bg-blue-50 text-blue-900 border-blue-200"
                      }`}
                    >
                      <option value="entity">Entity</option>
                      <option value="process">Process</option>
                      <option value="datastore">Datastore</option>
                    </select>
                    <input
                      type="text"
                      value={n.label}
                      onChange={(e) =>
                        updateNode(n.id, { label: e.target.value })
                      }
                      className="flex-1 text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                      placeholder="Node Label"
                    />
                  </div>
                  <button
                    onClick={() => removeNode(n.id)}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title="Remove Node"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => addNode({ label: "New Node", type: "process" })}
            className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded transition-colors font-medium cursor-pointer"
          >
            + Add Node
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-slate-700 mb-3 border-b text-sm uppercase tracking-wider pb-1">
            Data Flows
          </h3>
          <ul className="space-y-2 mb-3">
            {edges.map((e: DfdEdge) => (
              <li
                key={e.id}
                className="text-sm flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200"
              >
                <div className="flex flex-col gap-2 relative pr-8">
                  <div className="flex items-center gap-1">
                    <select
                      value={e.source}
                      onChange={(ev) =>
                        updateEdge(e.id, { source: ev.target.value })
                      }
                      className="flex-1 text-xs bg-white border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-400 w-1/2"
                    >
                      {nodes.map((n) => (
                        <option key={`src-${n.id}`} value={n.id}>
                          {n.id} ({n.label})
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 shrink-0">→</span>
                    <select
                      value={e.target}
                      onChange={(ev) =>
                        updateEdge(e.id, { target: ev.target.value })
                      }
                      className="flex-1 text-xs bg-white border border-slate-200 rounded p-1 focus:outline-none focus:border-blue-400 w-1/2"
                    >
                      {nodes.map((n) => (
                        <option key={`tgt-${n.id}`} value={n.id}>
                          {n.id} ({n.label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={e.label}
                    onChange={(ev) =>
                      updateEdge(e.id, { label: ev.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    placeholder="Flow Label"
                  />

                  <button
                    onClick={() => removeEdge(e.id)}
                    className="absolute right-[-8px] top-1 text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title="Remove Flow"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() =>
              addEdge({
                source: nodes[0]?.id || "",
                target: nodes[1]?.id || "",
                label: "New Flow",
              })
            }
            className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded transition-colors font-medium cursor-pointer"
            disabled={nodes.length < 2}
          >
            + Add Flow
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        Changes reflect automatically in Code & Canvas.
      </div>
    </div>
  );
};
