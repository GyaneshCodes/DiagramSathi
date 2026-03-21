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
    applyAIGeneratedDiagram,
    preferredDiagramType,
    setPreferredDiagramType,
  } = useDiagramStore();

  const handleSmartSuggest = async () => {
    if (!projectDescription.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateDiagramFromDescription(
        projectDescription,
        preferredDiagramType,
      );
      applyAIGeneratedDiagram(result.nodes, result.edges);
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "Failed to generate diagram.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-1/3 md:h-full bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-y-auto w-full md:w-64 lg:w-72 xl:w-80 2xl:w-96 border-b md:border-b-0 md:border-r border-slate-800/50 shrink-0">
      <div className="p-4 border-b border-slate-800/50 shrink-0 bg-transparent">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
          DiagramSathi
        </h2>
        <p className="text-sm text-slate-400 mt-1">Make All Kind of Diagrams</p>
      </div>

      <div className="p-4 border-b border-slate-800/50 shrink-0 bg-transparent">
        <h3 className="font-semibold text-slate-300 mb-2 text-sm uppercase tracking-wider">
          AI Grounding
        </h3>
        <textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe your project, features or the system architecture to generate a diagram..."
          className="w-full text-sm bg-slate-950/50 text-slate-200 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] mb-2 resize-none h-24 placeholder:text-slate-500"
        />
        <div className="flex gap-2 mb-3 items-center">
          <span className="text-xs text-slate-400 font-medium">Type:</span>
          <select
            value={preferredDiagramType}
            onChange={(e) =>
              setPreferredDiagramType(e.target.value as "auto" | "dfd" | "er")
            }
            className="flex-1 text-xs bg-slate-950/50 text-slate-200 border border-slate-700 rounded-md p-1.5 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
          >
            <option value="auto" className="bg-slate-900 text-slate-200">
              Auto-detect from text
            </option>
            <option value="dfd" className="bg-slate-900 text-slate-200">
              Force DFD
            </option>
            <option value="er" className="bg-slate-900 text-slate-200">
              Force ER Diagram
            </option>
          </select>
        </div>
        <button
          onClick={handleSmartSuggest}
          disabled={isGenerating || !projectDescription.trim()}
          className="w-full text-sm bg-[#6366f1] hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-300 disabled:border-transparent disabled:cursor-not-allowed text-white py-2 rounded-md transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 mt-2"
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
          <h3 className="font-semibold text-slate-300 mb-3 border-b border-slate-700/50 text-sm uppercase tracking-wider pb-1">
            Nodes
          </h3>
          <ul className="space-y-2 mb-3">
            {nodes.map((n: DfdNode) => (
              <li
                key={n.id}
                className="text-sm flex flex-col gap-2 bg-slate-800/30 p-2 rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="text-[10px] text-slate-500 font-mono mb-[-4px]">
                  ID: {n.id}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-1 gap-2 mr-2">
                    <select
                      value={n.type}
                      onChange={(e) =>
                        updateNode(n.id, {
                          type: e.target.value as DfdNode["type"],
                        })
                      }
                      className="text-xs p-1 rounded-md border min-w-[90px] focus:outline-none focus:ring-1 focus:ring-[#6366f1] bg-[#6366f1]/20 text-[#6366f1] border-[#6366f1]/30 appearance-none cursor-pointer"
                    >
                      <option
                        value="rectangle"
                        className="bg-slate-900 text-slate-200"
                      >
                        Rectangle
                      </option>
                      <option
                        value="square"
                        className="bg-slate-900 text-slate-200"
                      >
                        Square
                      </option>
                      <option
                        value="circle"
                        className="bg-slate-900 text-slate-200"
                      >
                        Circle
                      </option>
                      <option
                        value="diamond"
                        className="bg-slate-900 text-slate-200"
                      >
                        Diamond
                      </option>
                      <option
                        value="parallelogram"
                        className="bg-slate-900 text-slate-200"
                      >
                        Parallelogram
                      </option>
                      <option
                        value="hexagon"
                        className="bg-slate-900 text-slate-200"
                      >
                        Hexagon
                      </option>
                      <option
                        value="cylinder"
                        className="bg-slate-900 text-slate-200"
                      >
                        Cylinder
                      </option>
                    </select>
                    <input
                      type="text"
                      value={n.label}
                      onChange={(e) =>
                        updateNode(n.id, { label: e.target.value })
                      }
                      className="flex-1 text-sm bg-slate-950/50 text-slate-200 border border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] placeholder:text-slate-600"
                      placeholder="Node Label"
                    />
                  </div>
                  <button
                    onClick={() => removeNode(n.id)}
                    className="text-red-400 hover:bg-red-900/30 p-1.5 rounded-md transition-colors"
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
            onClick={() => addNode({ label: "New Node", type: "rectangle" })}
            className="w-full text-sm border border-[#6366f1]/50 text-[#6366f1] hover:bg-[#6366f1]/10 hover:border-[#6366f1] py-1.5 rounded-md transition-colors font-medium flex items-center justify-center gap-1 mt-1"
          >
            + Add Node
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-slate-300 mb-3 border-b border-slate-700/50 text-sm uppercase tracking-wider pb-1">
            Data Flows
          </h3>
          <ul className="space-y-2 mb-3">
            {edges.map((e: DfdEdge) => (
              <li
                key={e.id}
                className="text-sm flex flex-col gap-2 bg-slate-800/30 p-2 rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex flex-col gap-2 relative pr-8">
                  <div className="flex items-center gap-1">
                    <select
                      value={e.source}
                      onChange={(ev) =>
                        updateEdge(e.id, { source: ev.target.value })
                      }
                      className="flex-1 text-xs bg-slate-950/50 text-slate-200 border border-slate-700 rounded-md p-1 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] w-1/2"
                    >
                      {nodes.map((n) => (
                        <option
                          key={`src-${n.id}`}
                          value={n.id}
                          className="bg-slate-900 text-slate-200"
                        >
                          {n.id} ({n.label})
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-500 shrink-0">→</span>
                    <select
                      value={e.target}
                      onChange={(ev) =>
                        updateEdge(e.id, { target: ev.target.value })
                      }
                      className="flex-1 text-xs bg-slate-950/50 text-slate-200 border border-slate-700 rounded-md p-1 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] w-1/2"
                    >
                      {nodes.map((n) => (
                        <option
                          key={`tgt-${n.id}`}
                          value={n.id}
                          className="bg-slate-900 text-slate-200"
                        >
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
                    className="w-full text-xs bg-slate-950/50 text-slate-200 border border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] placeholder:text-slate-600"
                    placeholder="Flow Label"
                  />

                  <button
                    onClick={() => removeEdge(e.id)}
                    className="absolute right-[-8px] top-1 text-red-400 hover:bg-red-900/30 p-1.5 rounded-md transition-colors"
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
            className="w-full text-sm border border-[#6366f1]/50 text-[#6366f1] hover:bg-[#6366f1]/10 hover:border-[#6366f1] disabled:opacity-50 disabled:cursor-not-allowed py-1.5 rounded-md transition-colors font-medium flex items-center justify-center gap-1 mt-1"
            disabled={nodes.length < 2}
          >
            + Add Flow
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-slate-800/50 bg-transparent text-[11px] text-slate-500 text-center">
        Changes reflect automatically in Code & Canvas.
      </div>
    </div>
  );
};
