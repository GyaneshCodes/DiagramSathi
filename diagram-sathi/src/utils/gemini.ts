import { supabase } from '../lib/supabase';

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
  preferredType: "auto" | "dfd" | "er" | "flowchart" | "sequence" = "auto",
  maxRetries = 3
): Promise<AIGeneratedDiagram> => {
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt + 1}/${maxRetries}...`);

      const { data, error } = await Promise.race([
        supabase.functions.invoke('generate-diagram', {
          body: { description, preferredType }
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timed out. The AI service may be slow — please try again.")), 30000))
      ]);

      if (error) {
         console.error("[Gemini] Edge function error (raw):", error);
         let errorMessage = error.message || "Failed to call diagram generation API";
         let isRetryable = false;

         // Extract real error from the response body
         if (error.context && typeof error.context.clone === 'function') {
           try {
             const errorBody = await error.context.clone().json();
             const innerErr = typeof errorBody?.error === 'string' ? errorBody.error : errorBody?.error?.message || errorBody?.error;
             
             if (typeof innerErr === 'string' && (innerErr.includes("high demand") || innerErr.includes("UNAVAILABLE") || innerErr.includes("503"))) {
               isRetryable = true;
               errorMessage = "The AI service is currently under high demand. Retrying...";
             } else if (typeof innerErr === 'string') {
               errorMessage = innerErr;
             } else if (innerErr?.message) {
               errorMessage = innerErr.message;
             }
           } catch (_) {}
         }
         
         // Also check if the raw message hints at retryable conditions
         if (errorMessage.includes("non-2xx") || errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE")) {
           isRetryable = true;
         }

         const customErr = new Error(errorMessage);
         (customErr as any).isRetryable = isRetryable;
         throw customErr;
      }

      if (!data) throw new Error("No response received from diagram generation API");

      let parsed: AIGeneratedDiagram;
      if (typeof data === 'string') {
          try {
              parsed = JSON.parse(data);
          } catch (_) {
              throw new Error("Invalid format received from AI. Please try again.");
          }
      } else {
          parsed = data as AIGeneratedDiagram;
      }

      // Check for an error field in the parsed data (edge function returned 200 but with error payload)
      if ((parsed as any).error) {
        const errMsg = typeof (parsed as any).error === 'string' ? (parsed as any).error : (parsed as any).error.message || "Unknown AI error";
        const isHighDemand = errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
        const customErr = new Error(errMsg);
        (customErr as any).isRetryable = isHighDemand;
        throw customErr;
      }

      if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error("AI response missing nodes or edges arrays. Please try a different query.");
      }

      console.log(`[Gemini] Success! Got ${parsed.nodes.length} nodes and ${parsed.edges.length} edges.`);
      return parsed;
    } catch (error: any) {
      console.warn(`[Gemini] Attempt ${attempt + 1} failed:`, error.message);
      lastError = error;

      const isRetryable = error.isRetryable || 
                         error.message.includes("timed out") || 
                         error.message.includes("high demand") || 
                         error.message.includes("Failed to fetch") ||
                         error.message.includes("UNAVAILABLE") ||
                         error.message.includes("non-2xx");
      
      if (isRetryable && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 2000;
        console.log(`[Gemini] Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (error instanceof SyntaxError) {
        throw new Error("AI returned invalid JSON. Please try again.");
      }
      throw new Error(`Failed to generate diagram: ${error.message || "Unknown error"}`);
    }
  }

  throw lastError;
};
