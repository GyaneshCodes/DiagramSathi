import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateDiagramFromDescription = async (
  description: string,
  preferredType: "auto" | "dfd" | "er" = "auto",
): Promise<string> => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.",
    );
  }

  const typeInstruction =
    preferredType === "auto"
      ? "The diagram can be a Data Flow Diagram (DFD Level 0, Level 1, etc.) or an Entity-Relationship (ER) diagram, depending on what best fits the description or what is requested."
      : preferredType === "dfd"
        ? "You MUST generate a Data Flow Diagram (DFD Level 0, Level 1, etc.) using the 'graph TD' Mermaid syntax."
        : "You MUST generate an Entity-Relationship (ER) Diagram using the 'erDiagram' Mermaid syntax.";

  const prompt = `
You are an expert system architect and diagram generator.
Based on the following project description, generate a valid Mermaid code.
${typeInstruction}
Use proper Mermaid syntax (e.g., 'graph TD' with nodes/edges for DFDs, or 'erDiagram' for ER diagrams).
Do not include any conversational text, markdown formatting blocks (like \`\`\`mermaid), or explanations. Return ONLY the raw valid Mermaid code.

Project Description:
${description}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "";
    // Clean up markdown wrappers if the model happens to include them despite instructions
    text = text
      .replace(/^```(mermaid)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(
      `Failed to generate diagram: ${error?.message || "Unknown error"}`,
    );
  }
};
