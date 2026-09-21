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

  // 2. Pre-process and Extract all Node Declarations & Custom Styles
  const nodeMap = new Map<string, DfdNode>();
  const styleMap = new Map<string, { fillColor?: string; color?: string }>();
  
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
    // Ignore empty, comments, direction headers, subgraph headers, and closing 'end'
    if (!line || line.startsWith("%%") || dirRegex.test(line)) continue;
    if (/^\s*subgraph\s+/i.test(line) || /^\s*end\s*$/i.test(line)) continue;

    // Parse 'style NodeID fill:#fff,stroke:#333'
    const styleMatch = line.match(/^\s*style\s+([a-zA-Z0-9_.-]+)\s+(.*)/i);
    if (styleMatch) {
      const nodeId = styleMatch[1];
      const styleBody = styleMatch[2];
      const fillM = styleBody.match(/fill:\s*(#[a-zA-Z0-9]+|[a-zA-Z]+)/i);
      const strokeM = styleBody.match(/stroke:\s*(#[a-zA-Z0-9]+|[a-zA-Z]+)/i);
      styleMap.set(nodeId, {
        fillColor: fillM ? fillM[1] : undefined,
        color: strokeM ? strokeM[1] : undefined,
      });
      continue;
    }

    let nodeMatch;
    shapeRegex.lastIndex = 0;
    let matchedAnyShape = false;

    while ((nodeMatch = shapeRegex.exec(line)) !== null) {
      matchedAnyShape = true;
      const id = nodeMatch[1];
      if (id.toLowerCase() === "subgraph" || id.toLowerCase() === "end") continue;

      let label = "";
      let type = "rectangle";

      if (nodeMatch[2] !== undefined) {
        label = nodeMatch[2];
        type = "cylinder"; // Cylinder shape
      } else if (nodeMatch[3] !== undefined) {
        label = nodeMatch[3];
        type = diagramType === "flowchart" ? "stadium" : "circle";
      } else if (nodeMatch[4] !== undefined) {
        label = nodeMatch[4];
        type = diagramType === "flowchart" ? "hexagon" : "rectangle";
      } else if (nodeMatch[5] !== undefined || nodeMatch[6] !== undefined) {
        label = nodeMatch[5] !== undefined ? nodeMatch[5] : nodeMatch[6];
        type = diagramType === "flowchart" ? "parallelogram" : "rectangle";
      } else if (nodeMatch[7] !== undefined) {
        label = nodeMatch[7];
        type = "rectangle"; // Rectangle shape
      } else if (nodeMatch[8] !== undefined) {
        label = nodeMatch[8];
        type = "circle"; // Circle shape
      } else if (nodeMatch[9] !== undefined) {
        label = nodeMatch[9];
        type = diagramType === "flowchart" ? "diamond" : "rectangle";
      }

      if (label.startsWith('"') && label.endsWith('"')) {
        label = label.substring(1, label.length - 1);
      }

      if (!nodeMap.has(id)) {
        const customStyle = styleMap.get(id);
        const nodeObj: DfdNode = {
          id,
          label: label || id,
          type,
          fillColor: customStyle?.fillColor,
          color: customStyle?.color,
        };
        nodeMap.set(id, nodeObj);
        nodes.push(nodeObj);
      }
    }

    // Support standalone node declarations without shape wrapping (e.g. "A" or "user-profile")
    if (!matchedAnyShape && !line.includes("-->") && !line.includes("-.->") && !line.includes("->") && !line.includes("==>") && !line.includes("---")) {
      const standaloneMatch = line.match(/^([a-zA-Z0-9_.-]+)$/);
      if (standaloneMatch) {
        const id = standaloneMatch[1];
        if (id.toLowerCase() !== "end" && id.toLowerCase() !== "subgraph" && !nodeMap.has(id)) {
          const customStyle = styleMap.get(id);
          const nodeObj: DfdNode = {
            id,
            label: id,
            type: "rectangle",
            fillColor: customStyle?.fillColor,
            color: customStyle?.color,
          };
          nodeMap.set(id, nodeObj);
          nodes.push(nodeObj);
        }
      }
    }
  }

  // Apply styles parsed after node declarations
  styleMap.forEach((st, id) => {
    const existing = nodeMap.get(id);
    if (existing) {
      if (st.fillColor) existing.fillColor = st.fillColor;
      if (st.color) existing.color = st.color;
    }
  });

  // 3. Normalize Edge Lines and Parse Connections
  // Track counts to generate deterministic edge IDs
  const edgeCountMap = new Map<string, number>();

  const getDeterministicEdgeId = (src: string, tgt: string) => {
    const pairKey = `${src}_${tgt}`;
    const currentCount = edgeCountMap.get(pairKey) ?? 0;
    edgeCountMap.set(pairKey, currentCount + 1);
    return `e_${src}_${tgt}_${currentCount}`;
  };

  const determineEdgeStyle = (operatorStr: string): { style: "solid" | "dashed" | "line" | "thick" | "dashed-line" | "bidirectional"; animated: boolean } => {
    if (operatorStr.includes("-.->")) return { style: "dashed", animated: true };
    if (operatorStr.includes("-.-")) return { style: "dashed-line", animated: true };
    if (operatorStr.includes("==>")) return { style: "thick", animated: false };
    if (operatorStr.includes("---")) return { style: "line", animated: false };
    if (operatorStr.includes("<-->")) return { style: "bidirectional", animated: false };
    return { style: "solid", animated: false };
  };

  // Comprehensive Single-Pass Edge Segment Tokenizer
  // Matches: Source + Operator (with optional inline label or pipe label) + Target
  // Group 1: Source ID
  // Group 2: Full Operator Token
  // Group 3: Dash label (-- label ---)
  // Group 4: Thick label (== label ==>)
  // Group 5: Arrow label (-- label -->)
  // Group 6: Pipe label (|label|)
  // Group 7: Target ID
  const edgeSegmentRegex = /([a-zA-Z0-9_.-]+)\s*(?:(--\s*(.*?)\s*---|==\s*(.*?)\s*==>|--\s*(.*?)\s*-->|==>|-.->|-->|---|<-+->|-.-)(?:\s*\|(.*?)\|)?)\s*([a-zA-Z0-9_.-]+)/g;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("%%") || dirRegex.test(line) || /^\s*subgraph\s+/i.test(line) || /^\s*end\s*$/i.test(line) || /^\s*style\s+/i.test(line)) continue;

    // Normalize edge line: strip any inline shape wrappers so we are left with pure node IDs
    const normalizedLine = normalizeEdgeLine(line);

    edgeSegmentRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = edgeSegmentRegex.exec(normalizedLine)) !== null) {
      const source = match[1];
      const operatorStr = match[2];
      const inlineLabel = match[3] || match[4] || match[5];
      const pipeLabel = match[6];
      let rawLabel = pipeLabel !== undefined ? pipeLabel : (inlineLabel !== undefined ? inlineLabel : "");
      if (rawLabel.startsWith('"') && rawLabel.endsWith('"')) {
        rawLabel = rawLabel.substring(1, rawLabel.length - 1);
      }
      const target = match[7];

      const { style, animated } = determineEdgeStyle(operatorStr);

      if (source && target && source.toLowerCase() !== "end" && target.toLowerCase() !== "end") {
        edges.push({
          id: getDeterministicEdgeId(source, target),
          source,
          target,
          label: rawLabel,
          animated,
          style: style as any,
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
      }

      // Move lastIndex to target node position to support chained edges (A --> B --> C)
      const targetPos = match.index + match[0].length - target.length;
      if (targetPos > match.index) {
        edgeSegmentRegex.lastIndex = targetPos;
      }
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
    let arrow = "-->";
    if (edge.style === ("line" as any)) {
      arrow = "---";
    } else if (edge.style === ("thick" as any)) {
      arrow = "==>";
    } else if (edge.style === ("dashed-line" as any)) {
      arrow = "-.-";
    } else if (edge.style === "dashed" || edge.animated) {
      arrow = "-.->";
    } else if (edge.style === ("bidirectional" as any)) {
      arrow = "<-->";
    }

    if (edge.label) {
      lines.push(`  ${edge.source} ${arrow}|"${edge.label.replace(/"/g, '\\"')}"| ${edge.target}`);
    } else {
      lines.push(`  ${edge.source} ${arrow} ${edge.target}`);
    }
  });

  return lines.join("\n");
}
