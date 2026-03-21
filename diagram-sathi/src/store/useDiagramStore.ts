import { create } from "zustand";
import dagre from "dagre";

// Basic structure for our Abstract Syntax Tree (AST) representing a DFD Level 0 diagram.
export interface DfdNode {
  id: string;
  label: string;
  type: "rectangle" | "square" | "circle" | "diamond" | "parallelogram" | "hexagon" | "cylinder";
  position?: { x: number; y: number }; // Added for bidirectional sync
  width?: number;
  height?: number;
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

  // Layout trigger — incremented only when a brand-new diagram is generated
  layoutVersion: number;

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

  // AI Generation
  applyAIGeneratedDiagram: (nodes: Omit<DfdNode, "position" | "width" | "height">[], edges: Omit<DfdEdge, "id">[]) => void;

  // Form Actions
  addNode: (node: Omit<DfdNode, "id">) => void;
  updateNode: (id: string, updates: Partial<DfdNode>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
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
  %% @nodeType: User rectangle
  %% @nodePosition: System 300 100
  %% @nodeType: System circle
  %% @nodePosition: DB 500 100
  %% @nodeType: DB cylinder
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
      if (n.width && n.height) {
        code += `  %% @nodeSize: ${n.id} ${Math.round(n.width)} ${Math.round(n.height)}\n`;
      }
    });
    return code;
  }

  let code = "graph TD\n  %% DiagramSathi Generated Diagram\n";

  nodes.forEach((n) => {
    let brackets = ["[", "]"];
    switch (n.type) {
      case "circle": brackets = ["((", "))"]; break;
      case "cylinder": brackets = ["[(", ")]"]; break;
      case "diamond": brackets = ["{", "}"]; break;
      case "hexagon": brackets = ["{{", "}}"]; break;
      case "parallelogram": brackets = ["[/", "/]"]; break;
      case "rectangle": 
      case "square": 
      default:
        brackets = ["[", "]"]; break;
    }
    code += `  ${n.id}${brackets[0]}${n.label}${brackets[1]}\n`;
  });

  edges.forEach((e) => {
    code += `  ${e.source} -->|${e.label}| ${e.target}\n`;
  });

  // Inject positional, type and size metadata at the bottom
  nodes.forEach((n) => {
    if (n.position) {
      code += `  %% @nodePosition: ${n.id} ${Math.round(n.position.x)} ${Math.round(n.position.y)}\n`;
    }
    code += `  %% @nodeType: ${n.id} ${n.type}\n`;
    if (n.width && n.height) {
      code += `  %% @nodeSize: ${n.id} ${Math.round(n.width)} ${Math.round(n.height)}\n`;
    }
  });

  return code;
};

const parseMermaidToAst = (code: string) => {
  const nodesMap = new Map<string, DfdNode>();
  const edges: DfdEdge[] = [];
  const positions: Record<string, { x: number; y: number }> = {};
  const sizes: Record<string, { width: number; height: number }> = {};
  const types: Record<string, string> = {};

  const isEr = code.trim().startsWith("erDiagram");
  const lines = code.split("\n");

  const posRegex =
    /^\s*%%\s*@nodePosition:\s*([a-zA-Z0-9_]+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;
  const typeRegex =
    /^\s*%%\s*@nodeType:\s*([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*$/;
  const sizeRegex =
    /^\s*%%\s*@nodeSize:\s*([a-zA-Z0-9_]+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;
  // Matches edges
  const dfdEdgeRegex =
    /([a-zA-Z0-9_]+)(?:\[.*?\]|\(\(.*?\)\)|\[\(.*?\)\]|\{\{.*?\}\}|\{.*?\}|\[\/.*?\/\]|\[\\.*?\\\])?\s*(?:-->|---|-.->|==>)\s*(?:\|([^|]*)\|\s*)?([a-zA-Z0-9_]+)/;
  // Matches Node definitions with all brackets
  // 1=id, 2=cylinder, 3=circle, 4=hexagon, 5=diamond, 6=parallelogram, 7=parallelogramAlt, 8=trapezoid, 9=trapezoidAlt, 10=rectangle
  const nodeDefRegex =
    /([a-zA-Z0-9_]+)\s*(?:\[\((.*?)\)\]|\(\((.*?)\)\)|\{\{(.*?)\}\}|\{(.*?)\}|\[\/(.*?)\/\]|\[\\(.*?)\\\]|\[\/(.*?)\\\]|\[\\(.*?)\/\]|\[(.*?)\])/g;
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

    const typeMatch = line.match(typeRegex);
    if (typeMatch) {
      types[typeMatch[1]] = typeMatch[2];
      return;
    }

    const sizeMatch = line.match(sizeRegex);
    if (sizeMatch) {
      const id = sizeMatch[1];
      const w = parseFloat(sizeMatch[2]);
      const h = parseFloat(sizeMatch[3]);
      if (!isNaN(w) && !isNaN(h)) {
        sizes[id] = { width: w, height: h };
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
          nodesMap.set(source, { id: source, label: source, type: "rectangle" });
        if (!nodesMap.has(target))
          nodesMap.set(target, { id: target, label: target, type: "rectangle" });
      } else {
        const entityMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*\{/);
        if (entityMatch) {
          const id = entityMatch[1];
          if (!nodesMap.has(id))
            nodesMap.set(id, { id, label: id, type: "rectangle" });
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
          nodesMap.set(source, { id: source, label: source, type: "rectangle" });
        if (!nodesMap.has(target))
          nodesMap.set(target, { id: target, label: target, type: "rectangle" });
      }

      // Parse DFD node definitions
      nodeDefRegex.lastIndex = 0; // Reset global regex state for each line
      let ndMatch;
      while ((ndMatch = nodeDefRegex.exec(line)) !== null) {
        const id = ndMatch[1];
        
        // 1=id, 2=cylinder, 3=circle, 4=hexagon, 5=diamond, 6=parallelogram, 7=parallelogramAlt, 8=trapezoid, 9=trapezoidAlt, 10=rectangle
        let type: DfdNode["type"] = "rectangle";
        let label = id;

        if (ndMatch[2] !== undefined) { type = "cylinder"; label = ndMatch[2]; }
        else if (ndMatch[3] !== undefined) { type = "circle"; label = ndMatch[3]; }
        else if (ndMatch[4] !== undefined) { type = "hexagon"; label = ndMatch[4]; }
        else if (ndMatch[5] !== undefined) { type = "diamond"; label = ndMatch[5]; }
        else if (ndMatch[6] !== undefined || ndMatch[7] !== undefined) { type = "parallelogram"; label = ndMatch[6] || ndMatch[7]; }
        else if (ndMatch[8] !== undefined || ndMatch[9] !== undefined || ndMatch[10] !== undefined) { 
          type = "rectangle"; 
          label = ndMatch[8] || ndMatch[9] || ndMatch[10]; 
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
    // Explicit type override from metadata comments
    if (types[n.id]) {
      n.type = types[n.id] as DfdNode["type"];
    }

    if (positions[n.id]) {
      n.position = positions[n.id];
    } else {
      needsLayout = true;
    }

    if (sizes[n.id]) {
      n.width = sizes[n.id].width;
      n.height = sizes[n.id].height;
    }
  });

  if (needsLayout && nodes.length > 0) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: isEr ? "LR" : "TB",
      ranksep: 80,
      nodesep: 60,
      edgesep: 30,
      marginx: 40,
      marginy: 40,
    });

    const getNodeDimensions = (n: DfdNode) => {
      const w = n.width || (n.type === "circle" || n.type === "square" || n.type === "diamond" ? 140 : 180);
      const h = n.height || (n.type === "circle" || n.type === "square" || n.type === "diamond" ? 140 : 60);
      return { w, h };
    };

    nodes.forEach((n) => {
      const { w, h } = getNodeDimensions(n);
      dagreGraph.setNode(n.id, { width: w, height: h });
    });

    edges.forEach((e) => {
      dagreGraph.setEdge(e.source, e.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((n) => {
      const nodeWithPosition = dagreGraph.node(n.id);
      if (nodeWithPosition) {
        const { w, h } = getNodeDimensions(n);
        n.position = {
          x: nodeWithPosition.x - w / 2,
          y: nodeWithPosition.y - h / 2,
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
  layoutVersion: 0,
  projectDescription: "",
  isGenerating: false,
  preferredDiagramType: "auto",
  nodes: [
    { id: "User", label: "User", type: "rectangle", position: { x: 100, y: 100 } },
    {
      id: "System",
      label: "Main System",
      type: "circle",
      position: { x: 300, y: 100 },
    },
    {
      id: "DB",
      label: "Database",
      type: "cylinder",
      position: { x: 500, y: 100 },
    },
  ],
  edges: [
    { id: "e1", source: "User", target: "System", label: "Input Data" },
    { id: "e2", source: "System", target: "DB", label: "Store Data" },
  ],

  setMermaidCode: (code) => {
    set({ mermaidCode: code, layoutVersion: get().layoutVersion + 1 });
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

  applyAIGeneratedDiagram: (aiNodes, aiEdges) => {
    const nodes: DfdNode[] = aiNodes.map((n, index) => ({
      ...n,
      id: n.id || `ai_${index}`,
      label: n.label || n.id,
      type: n.type || "rectangle",
      width: 180,
      height: 60,
    }));
    const edges: DfdEdge[] = aiEdges.map((e, index) => ({
      ...e,
      id: `e_ai_${index}_${Date.now()}`,
    }));
    set({ nodes, edges, diagramType: "dfd", layoutVersion: get().layoutVersion + 1 });
    get().updateCodeFromAst(nodes, edges);
  },

  addNode: (nodeData) => {
    const id = `n_${Date.now()}`;
    const newNode = { ...nodeData, id, position: { x: 100, y: 100 }, width: 150, height: 50 } as DfdNode;
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
