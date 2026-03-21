import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface AINode {
  id: string;
  label: string;
  type: "rectangle" | "circle" | "cylinder" | "diamond" | "hexagon" | "parallelogram" | "square";
}

export interface AIEdge {
  source: string;
  target: string;
  label: string;
}

export interface AIGeneratedDiagram {
  nodes: AINode[];
  edges: AIEdge[];
}

export const generateDiagramFromDescription = async (
  description: string,
  preferredType: "auto" | "dfd" | "er" = "auto",
): Promise<AIGeneratedDiagram> => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.",
    );
  }

  const typeInstruction =
    preferredType === "auto"
      ? "Choose the most appropriate diagram type based on the description. Use DFD for system flows or ER for database schemas."
      : preferredType === "dfd"
        ? "Generate a Data Flow Diagram (DFD)."
        : "Generate an Entity-Relationship (ER) Diagram.";

  const prompt = `
You are an expert system architect and diagram generator.
${typeInstruction}

Based on the following project description, generate a structured diagram as a JSON object.

RULES:
1. Return ONLY a valid JSON object. No markdown, no explanation, no code fences.
2. The JSON must have exactly two keys: "nodes" (array) and "edges" (array).
3. Each node must have: "id" (unique string, no spaces, camelCase), "label" (human-readable name), "type" (one of: "rectangle", "circle", "cylinder", "diamond", "hexagon").
4. Use "cylinder" type for databases/data stores, "circle" for core processes, "diamond" for decision points, "hexagon" for services/APIs, and "rectangle" for everything else.
5. Each edge must have: "source" (node id), "target" (node id), "label" (describing what flows or happens, e.g. "sends request", "returns data", "validates token").
6. Define nodes in logical top-to-bottom or left-to-right order reflecting the actual flow.
7. Every edge label must be extremely short (maximum 4 words, no full sentences). Never leave it empty.
8. Do NOT create circular references unless the diagram explicitly requires a feedback loop.
9. Generate between 4 and 12 nodes for a clear, readable diagram.

EXAMPLE OUTPUT:
{"nodes":[{"id":"client","label":"Client App","type":"rectangle"},{"id":"api","label":"API Gateway","type":"hexagon"},{"id":"auth","label":"Auth Service","type":"circle"},{"id":"db","label":"User Database","type":"cylinder"}],"edges":[{"source":"client","target":"api","label":"sends request"},{"source":"api","target":"auth","label":"validates credentials"},{"source":"auth","target":"db","label":"queries user data"},{"source":"auth","target":"api","label":"returns token"}]}

Project Description:
${description}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "";
    // Strip any markdown code fences if model wraps them
    text = text
      .replace(/^```(?:json)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();

    const parsed: AIGeneratedDiagram = JSON.parse(text);

    // Validate structure
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error("AI response missing nodes or edges arrays.");
    }

    return parsed;
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    if (error instanceof SyntaxError) {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
    throw new Error(
      `Failed to generate diagram: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
