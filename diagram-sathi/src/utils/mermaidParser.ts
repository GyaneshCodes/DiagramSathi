import type { DfdNode, DfdEdge } from "../store/useDiagramStore";

export interface ParsedMermaid {
  nodes: DfdNode[];
  edges: DfdEdge[];
  direction: "LR" | "TB";
  diagramType: "dfd" | "flowchart";
}

/** Helper to clean inline shape/label declarations from edge statements */
function normalizeEdgeLine(line: string): string {
  // Matches any node ID (supporting hyphens, underscores, dots) followed by a shape wrapper (e.g. ID([Label]), ID[[Label]], etc.)
  // and replaces it with just the node ID.
  const shapeDeclarationRegex = /([a-zA-Z0-9_.-]+)\s*(?:\[\((.*?)\)\]|\(\[(.*?)\]\)|\{\{(.*?)\}\}|\[\/(.*?)\/\]|\[\\(.*?)\\\]|\[(.*?)\]|\((.*?)\)|\{(.*?)\})/g;
  return line.replace(shapeDeclarationRegex, "$1");
}

/** Parses Mermaid/DFD DSL code into internal DfdNode/DfdEdge AST */
export function parseMermaidCode(code: string, currentType: "dfd" | "flowchart"): ParsedMermaid {
  const nodes: DfdNode[] = [];
  const edges: DfdEdge[] = [];
  let direction: "LR" | "TB" = "LR";
  let diagramType = currentType;

  // 1. Detect DSL Type and Direction
  const lines = code.split("\n");
  const isDfdDsl = /^\s*(dfd|data\s+flow\s+diagram)/i.test(code);
  const isFlowchartDsl = /^\s*(graph|flowchart)/i.test(code);

  if (isDfdDsl) {
    diagramType = "dfd";
  } else if (isFlowchartDsl) {
    diagramType = "flowchart";
  }

  const dirRegex = /^\s*(graph|flowchart|dfd|data\s+flow\s+diagram)\s+(LR|TB|TD|BT|RL)/i;
  for (let line of lines) {
    const dirMatch = line.trim().match(dirRegex);
    if (dirMatch) {
      const dir = dirMatch[2].toUpperCase();
      direction = (dir === "TB" || dir === "TD") ? "TB" : "LR";
      break;
    }
  }

  // 2. Pre-process and Extract all Node Declarations
  const nodeMap = new Map<string, DfdNode>();
  
  // Ordered matcher supporting hyphens/dots in IDs:
  // Group 2: Cylinder [()]
  // Group 3: Stadium ([])
  // Group 4: Hexagon {{}}
  // Group 5 & 6: Parallelogram [/ /] or [\ \]
  // Group 7: Rectangle []
  // Group 8: Circle ()
  // Group 9: Diamond {}
  const shapeRegex = /([a-zA-Z0-9_.-]+)\s*(?:\[\((.*?)\)\]|\(\[(.*?)\]\)|\{\{(.*?)\}\}|\[\/(.*?)\/\]|\[\\(.*?)\\\]|\[(.*?)\]|\((.*?)\)|\{(.*?)\})/g;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("%%") || dirRegex.test(line)) continue;

    let nodeMatch;
    shapeRegex.lastIndex = 0;
    let matchedAnyShape = false;

    while ((nodeMatch = shapeRegex.exec(line)) !== null) {
      matchedAnyShape = true;
      const id = nodeMatch[1];
      let label = "";
      let type = "rectangle";

      if (nodeMatch[2] !== undefined) {
        label = nodeMatch[2];
        type = "cylinder"; // Cylinder shape (Allowed in DFD and Flowcharts)
      } else if (nodeMatch[3] !== undefined) {
        label = nodeMatch[3];
        // Stadium is only allowed in Flowchart; falls back to Circle (Process) in DFD
        type = diagramType === "flowchart" ? "stadium" : "circle";
      } else if (nodeMatch[4] !== undefined) {
        label = nodeMatch[4];
        type = diagramType === "flowchart" ? "hexagon" : "rectangle";
      } else if (nodeMatch[5] !== undefined || nodeMatch[6] !== undefined) {
        label = nodeMatch[5] !== undefined ? nodeMatch[5] : nodeMatch[6];
        type = diagramType === "flowchart" ? "parallelogram" : "rectangle";
      } else if (nodeMatch[7] !== undefined) {
        label = nodeMatch[7];
        type = "rectangle"; // Rectangle shape (Allowed in DFD and Flowcharts)
      } else if (nodeMatch[8] !== undefined) {
        label = nodeMatch[8];
        type = "circle"; // Circle shape (Allowed in DFD and Flowcharts)
      } else if (nodeMatch[9] !== undefined) {
        label = nodeMatch[9];
        type = diagramType === "flowchart" ? "diamond" : "rectangle";
      }

      if (label.startsWith('"') && label.endsWith('"')) {
        label = label.substring(1, label.length - 1);
      }

      if (!nodeMap.has(id)) {
        const nodeObj: DfdNode = { id, label: label || id, type };
        nodeMap.set(id, nodeObj);
        nodes.push(nodeObj);
      }
    }

    // Support standalone node declarations without shape wrapping (e.g. "A" or "user-profile")
    if (!matchedAnyShape && !line.includes("-->") && !line.includes("-.->") && !line.includes("->")) {
      const standaloneMatch = line.match(/^([a-zA-Z0-9_.-]+)$/);
      if (standaloneMatch) {
        const id = standaloneMatch[1];
        if (!nodeMap.has(id)) {
          const nodeObj: DfdNode = { id, label: id, type: "rectangle" };
          nodeMap.set(id, nodeObj);
          nodes.push(nodeObj);
        }
      }
    }
  }

  // 3. Normalize Edge Lines and Parse Connections
  const edgeLabelRegex = /([a-zA-Z0-9_.-]+)\s*(?:-->|-.->)\s*\|(.*?)\|\s*([a-zA-Z0-9_.-]+)/g;
  // Re-order choice precedence to evaluate simple arrows before label-matching patterns
  const edgeRegex = /([a-zA-Z0-9_.-]+)\s*(?:-.->|-->|->|--\s*(.*?)\s*-->|--\s*(.*?)\s*->)\s*([a-zA-Z0-9_.-]+)/g;

  // Track counts to generate deterministic edge IDs
  const edgeCountMap = new Map<string, number>();

  const getDeterministicEdgeId = (src: string, tgt: string) => {
    const pairKey = `${src}_${tgt}`;
    const currentCount = edgeCountMap.get(pairKey) ?? 0;
    edgeCountMap.set(pairKey, currentCount + 1);
    return `e_${src}_${tgt}_${currentCount}`;
  };

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("%%") || dirRegex.test(line)) continue;

    // Normalize edge line: strip any inline shape wrappers so we are left with pure node IDs
    const normalizedLine = normalizeEdgeLine(line);

    // Parse Edges with pipe labels (A -->|Label| B)
    let edgeMatch;
    edgeLabelRegex.lastIndex = 0;
    while ((edgeMatch = edgeLabelRegex.exec(normalizedLine)) !== null) {
      const source = edgeMatch[1];
      const label = edgeMatch[2];
      const target = edgeMatch[3];
      const animated = line.includes("-.->");
      const style = line.includes("-.->") ? "dashed" : "solid";

      edges.push({
        id: getDeterministicEdgeId(source, target),
        source,
        target,
        label,
        animated,
        style
      });

      // Ensure nodes mentioned in edges exist in the registry
      if (!nodeMap.has(source)) {
        const n = { id: source, label: source, type: "rectangle" };
        nodeMap.set(source, n);
        nodes.push(n);
      }
      if (!nodeMap.has(target)) {
        const n = { id: target, label: target, type: "rectangle" };
        nodeMap.set(target, n);
        nodes.push(n);
      }

      // Reset lastIndex backward by the target node's length to overlap chained edges correctly
      edgeLabelRegex.lastIndex -= target.length;
    }

    // Parse standard Edges (A -- Label --> B or A --> B)
    edgeRegex.lastIndex = 0;
    while ((edgeMatch = edgeRegex.exec(normalizedLine)) !== null) {
      const source = edgeMatch[1];
      // Capture groups re-aligned because of simple arrow reordering
      const label = edgeMatch[2] || edgeMatch[3] || "";
      const target = edgeMatch[4];
      const animated = edgeMatch[0].includes("-.->") || line.includes("-.->");
      const style = animated ? "dashed" : "solid";

      if (!edges.some(e => e.source === source && e.target === target && e.label === label)) {
        edges.push({
          id: getDeterministicEdgeId(source, target),
          source,
          target,
          label,
          animated,
          style
        });
      }

      if (!nodeMap.has(source)) {
        const n = { id: source, label: source, type: "rectangle" };
        nodeMap.set(source, n);
        nodes.push(n);
      }
      if (!nodeMap.has(target)) {
        const n = { id: target, label: target, type: "rectangle" };
        nodeMap.set(target, n);
        nodes.push(n);
      }

      // Reset lastIndex backward by the target node's length to overlap chained edges correctly
      edgeRegex.lastIndex -= target.length;
    }
  }

  return { nodes, edges, direction, diagramType };
}

/** Serializes internal DfdNode/DfdEdge AST to Mermaid/DFD DSL code */
export function serializeAstToMermaid(
  nodes: DfdNode[],
  edges: DfdEdge[],
  direction: "LR" | "TB",
  diagramType: "dfd" | "flowchart"
): string {
  const header = `${diagramType} ${direction}`;
  const lines: string[] = [`%% type: ${diagramType}`, header];

  nodes.forEach(node => {
    if (node.type === "er-container") return;
    
    let left = "[";
    let right = "]";
    switch (node.type) {
      case "stadium":
        if (diagramType === "flowchart") {
          left = "(["; right = "])";
        } else {
          left = "("; right = ")"; // fallback for DFD circle (Process)
        }
        break;
      case "circle": case "process":
        left = "("; right = ")";
        break;
      case "cylinder": case "datastore":
        left = "[("; right = ")]";
        break;
      case "diamond":
        left = diagramType === "flowchart" ? "{" : "[";
        right = diagramType === "flowchart" ? "}" : "]";
        break;
      case "parallelogram":
        left = diagramType === "flowchart" ? "[/" : "[";
        right = diagramType === "flowchart" ? "/]" : "]";
        break;
      case "hexagon":
        left = diagramType === "flowchart" ? "{{" : "[";
        right = diagramType === "flowchart" ? "}}" : "]";
        break;
    }
    
    lines.push(`  ${node.id}${left}"${node.label.replace(/"/g, '\\"')}"${right}`);
  });

  edges.forEach(edge => {
    const arrow = edge.style === "dashed" || edge.animated ? "-.->" : "-->";
    if (edge.label) {
      lines.push(`  ${edge.source} ${arrow}|"${edge.label.replace(/"/g, '\\"')}"| ${edge.target}`);
    } else {
      lines.push(`  ${edge.source} ${arrow} ${edge.target}`);
    }
  });

  return lines.join("\n");
}
