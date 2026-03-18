import { create } from "zustand";
import dagre from "dagre";

// Basic structure for our Abstract Syntax Tree (AST) representing a DFD Level 0 diagram.
export interface DfdNode {
  id: string;
  label: string;
  type: "process" | "entity" | "datastore";
  position?: { x: number; y: number }; // Added for bidirectional sync
}

export interface DfdEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface DiagramState {
  // Raw text representation
  mermaidCode: string;

  // AST representation
  nodes: DfdNode[];
  edges: DfdEdge[];
  diagramType: "dfd" | "er";

  // AI Generation State
  projectDescription: string;
  isGenerating: boolean;
  preferredDiagramType: "auto" | "dfd" | "er";

  // Actions
  setMermaidCode: (code: string) => void;
  updateAstFromCode: (code: string) => void;
  updateCodeFromAst: (nodes: DfdNode[], edges: DfdEdge[]) => void;
  setProjectDescription: (desc: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setPreferredDiagramType: (type: "auto" | "dfd" | "er") => void;

  // Form Actions
  addNode: (node: Omit<DfdNode, "id">) => void;
  updateNode: (id: string, updates: Partial<DfdNode>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void; // New action
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<DfdEdge, "id">) => void;
  updateEdge: (id: string, updates: Partial<DfdEdge>) => void;
  removeEdge: (id: string) => void;
}

const DEFAULT_CODE = `graph TD
  %% DiagramSathi Generated DFD
  User[User] -->|Input Data| System((Main System))
  System -->|Store Data| DB[(Database)]
  %% @nodePosition: User 100 100
  %% @nodePosition: System 300 100
  %% @nodePosition: DB 500 100
`;

// A very naive parser/generator for MVP.
// In a production app, we would use a robust parser (e.g. jison or regex tokenizer)
const generateMermaidFromAst = (
  nodes: DfdNode[],
  edges: DfdEdge[],
  diagramType: "dfd" | "er" = "dfd",
): string => {
  if (diagramType === "er") {
    let code = "erDiagram\n  %% DiagramSathi Generated ER\n";
    edges.forEach((e) => {
      code += `  ${e.source} ||--o{ ${e.target} : "${e.label || "relates"}"\n`;
    });
    nodes.forEach((n) => {
      const isConnected = edges.some(
        (e) => e.source === n.id || e.target === n.id,
      );
      if (!isConnected) {
        code += `  ${n.id} {\n  }\n`;
      }
    });
    nodes.forEach((n) => {
      if (n.position) {
        code += `  %% @nodePosition: ${n.id} ${Math.round(n.position.x)} ${Math.round(n.position.y)}\n`;
      }
    });
    return code;
  }

  let code = "graph TD\n  %% DiagramSathi Generated DFD\n";

  nodes.forEach((n) => {
    if (n.type === "process") code += `  ${n.id}((${n.label}))\n`;
    else if (n.type === "datastore") code += `  ${n.id}[(${n.label})]\n`;
    else code += `  ${n.id}[${n.label}]\n`; // entity default
  });

  edges.forEach((e) => {
    code += `  ${e.source} -->|${e.label}| ${e.target}\n`;
  });

  // Inject positional metadata at the bottom
  nodes.forEach((n) => {
    if (n.position) {
      code += `  %% @nodePosition: ${n.id} ${Math.round(n.position.x)} ${Math.round(n.position.y)}\n`;
    }
  });

  return code;
};

const parseMermaidToAst = (code: string) => {
  const nodesMap = new Map<string, DfdNode>();
  const edges: DfdEdge[] = [];
  const positions: Record<string, { x: number; y: number }> = {};

  const isEr = code.trim().startsWith("erDiagram");
  const lines = code.split("\n");

  const posRegex =
    /^\s*%%\s*@nodePosition:\s*([a-zA-Z0-9_]+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;
  // Matches DFD edges
  const dfdEdgeRegex =
    /([a-zA-Z0-9_]+)(?:\[.*?\]|\(\(.*?\)\)|\[\(.*?\)\])?\s*(?:-->|---|-.->|==>)\s*(?:\|([^|]*)\|\s*)?([a-zA-Z0-9_]+)/;
  // Matches DFD Node definitions
  const nodeDefRegex =
    /([a-zA-Z0-9_]+)\s*(?:(\[\((.*?)\)\])|(\(\((.*?)\)\))|(\[(.*?)\]))/g;
  // Matches ER edges e.g. CUSTOMER ||--o{ ORDER : "places"
  const erEdgeRegex =
    /([a-zA-Z0-9_-]+)\s+(?:\|\||}\||\}o|\|o|o\||o\}|\|\{|\{o|\{\||-\|)[-.]+(?:o\{|\|\||o\||\|\{|\}o|\}|\{|-\|)\s+([a-zA-Z0-9_-]+)(?:\s*:\s*(.*))?/;

  lines.forEach((line) => {
    // Parse positions
    const posMatch = line.match(posRegex);
    if (posMatch) {
      const id = posMatch[1];
      const x = parseFloat(posMatch[2]);
      const y = parseFloat(posMatch[3]);
      if (!isNaN(x) && !isNaN(y)) {
        positions[id] = { x, y };
      }
      return;
    }

    if (line.trim().startsWith("%")) return;

    if (isEr) {
      const erMatch = line.match(erEdgeRegex);
      if (erMatch) {
        const source = erMatch[1];
        const target = erMatch[2];
        const label = (erMatch[3] || "").replace(/"/g, "").trim();

        edges.push({
          id: `e_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          source,
          target,
          label,
        });

        if (!nodesMap.has(source))
          nodesMap.set(source, { id: source, label: source, type: "entity" });
        if (!nodesMap.has(target))
          nodesMap.set(target, { id: target, label: target, type: "entity" });
      } else {
        const entityMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*\{/);
        if (entityMatch) {
          const id = entityMatch[1];
          if (!nodesMap.has(id))
            nodesMap.set(id, { id, label: id, type: "entity" });
        }
      }
    } else {
      // Parse DFD edges
      const edgeMatch = line.match(dfdEdgeRegex);
      if (edgeMatch) {
        const source = edgeMatch[1];
        const label = edgeMatch[2] || "";
        const target = edgeMatch[3];

        edges.push({
          id: `e_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          source,
          target,
          label,
        });

        if (!nodesMap.has(source))
          nodesMap.set(source, { id: source, label: source, type: "entity" });
        if (!nodesMap.has(target))
          nodesMap.set(target, { id: target, label: target, type: "entity" });
      }

      // Parse DFD node definitions
      nodeDefRegex.lastIndex = 0; // Reset global regex state for each line
      let ndMatch;
      while ((ndMatch = nodeDefRegex.exec(line)) !== null) {
        const id = ndMatch[1];
        const isDatastore = !!ndMatch[2];
        const datastoreLabel = ndMatch[3];
        const isProcess = !!ndMatch[4];
        const processLabel = ndMatch[5];
        const isEntity = !!ndMatch[6];
        const entityLabel = ndMatch[7];

        let type: "process" | "entity" | "datastore" = "entity";
        let label = id;

        if (isDatastore) {
          type = "datastore";
          label = datastoreLabel;
        } else if (isProcess) {
          type = "process";
          label = processLabel;
        } else if (isEntity) {
          type = "entity";
          label = entityLabel;
        }

        if (nodesMap.has(id)) {
          const existing = nodesMap.get(id)!;
          existing.type = type;
          existing.label = label || id;
        } else {
          nodesMap.set(id, { id, label: label || id, type });
        }
      }
    }
  });

  const nodes = Array.from(nodesMap.values());
  let needsLayout = false;

  nodes.forEach((n) => {
    if (positions[n.id]) {
      n.position = positions[n.id];
    } else {
      needsLayout = true;
    }
  });

  if (needsLayout && nodes.length > 0) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: isEr ? "LR" : "TB",
      ranksep: isEr ? 180 : 120, // Increase vertical/horizontal spacing between layers
      nodesep: isEr ? 100 : 80, // Increase spacing between nodes in the same layer
      edgesep: 40, // Space between edges
      marginx: 50,
      marginy: 50,
    });

    // Provide larger estimated bounds for nodes to prevent overlapping text/edges
    nodes.forEach((n) => {
      // Entity/Process nodes in our UI are relatively wide
      // processes have min-w-[120px] and min-h-[120px]
      const width = n.type === "process" ? 140 : 160;
      const height = n.type === "process" ? 140 : 80;
      dagreGraph.setNode(n.id, { width, height });
    });

    edges.forEach((e) => {
      dagreGraph.setEdge(e.source, e.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((n) => {
      const nodeWithPosition = dagreGraph.node(n.id);
      if (nodeWithPosition) {
        // Must match the estimated widths above to center correctly
        const width = n.type === "process" ? 140 : 160;
        const height = n.type === "process" ? 140 : 80;
        n.position = {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        };
      }
    });
  }

  return {
    nodes,
    edges,
    diagramType: isEr ? ("er" as const) : ("dfd" as const),
  };
};

export const useDiagramStore = create<DiagramState>((set, get) => ({
  diagramType: "dfd",
  mermaidCode: DEFAULT_CODE,
  projectDescription: "",
  isGenerating: false,
  preferredDiagramType: "auto",
  nodes: [
    { id: "User", label: "User", type: "entity", position: { x: 100, y: 100 } },
    {
      id: "System",
      label: "Main System",
      type: "process",
      position: { x: 300, y: 100 },
    },
    {
      id: "DB",
      label: "Database",
      type: "datastore",
      position: { x: 500, y: 100 },
    },
  ],
  edges: [
    { id: "e1", source: "User", target: "System", label: "Input Data" },
    { id: "e2", source: "System", target: "DB", label: "Store Data" },
  ],

  setMermaidCode: (code) => {
    set({ mermaidCode: code });
    // Attempt bidirectional parse
    get().updateAstFromCode(code);
  },

  setProjectDescription: (desc) => set({ projectDescription: desc }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setPreferredDiagramType: (type) => set({ preferredDiagramType: type }),

  updateAstFromCode: (code) => {
    const {
      nodes: parsedNodes,
      edges: parsedEdges,
      diagramType,
    } = parseMermaidToAst(code);
    set({ nodes: parsedNodes, edges: parsedEdges, diagramType });
  },

  updateCodeFromAst: (nodes, edges) => {
    const newCode = generateMermaidFromAst(nodes, edges, get().diagramType);
    set({ mermaidCode: newCode });
  },

  addNode: (nodeData) => {
    const id = `n_${Date.now()}`;
    const newNode = { ...nodeData, id, position: { x: 100, y: 100 } };
    const newNodes = [...get().nodes, newNode];
    set({ nodes: newNodes });
    get().updateCodeFromAst(newNodes, get().edges);
  },

  updateNode: (id: string, updates: Partial<DfdNode>) => {
    const newNodes = get().nodes.map((n: DfdNode) =>
      n.id === id ? { ...n, ...updates } : n,
    );
    set({ nodes: newNodes });
    get().updateCodeFromAst(newNodes, get().edges);
  },

  updateNodePosition: (id: string, position: { x: number; y: number }) => {
    const currentNode = get().nodes.find((n) => n.id === id);
    if (
      currentNode?.position &&
      currentNode.position.x === position.x &&
      currentNode.position.y === position.y
    ) {
      return;
    }

    const newNodes = get().nodes.map((n: DfdNode) =>
      n.id === id ? { ...n, position } : n,
    );
    set({ nodes: newNodes });
    get().updateCodeFromAst(newNodes, get().edges);
  },

  removeNode: (id: string) => {
    const newNodes = get().nodes.filter((n: DfdNode) => n.id !== id);
    const newEdges = get().edges.filter(
      (e: DfdEdge) => e.source !== id && e.target !== id,
    );
    set({ nodes: newNodes, edges: newEdges });
    get().updateCodeFromAst(newNodes, newEdges);
  },

  addEdge: (edgeData: Omit<DfdEdge, "id">) => {
    const id = `e_${Date.now()}`;
    const newEdge = { ...edgeData, id };
    const newEdges = [...get().edges, newEdge];
    set({ edges: newEdges });
    get().updateCodeFromAst(get().nodes, newEdges);
  },

  updateEdge: (id: string, updates: Partial<DfdEdge>) => {
    const newEdges = get().edges.map((e: DfdEdge) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    set({ edges: newEdges });
    get().updateCodeFromAst(get().nodes, newEdges);
  },

  removeEdge: (id: string) => {
    const newEdges = get().edges.filter((e: DfdEdge) => e.id !== id);
    set({ edges: newEdges });
    get().updateCodeFromAst(get().nodes, newEdges);
  },
}));
