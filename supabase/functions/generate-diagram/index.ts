import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildSystemPrompt(preferredType: string, dfdLevel: number): string {
  const baseRules = `You are a diagram generation engine. You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "nodes": [
    { "id": "UniqueId", "label": "Short Label", "type": "rectangle" }
  ],
  "edges": [
    { "source": "SourceId", "target": "TargetId", "label": "Flow Label" }
  ]
}

Rules for ALL diagrams:
- Node IDs must be PascalCase with no spaces
- CRITICAL: Edge 'source' and 'target' MUST exactly match the 'id' of existing nodes. NEVER use the 'label' field for source/target!
- Edge labels must be concise (max 3 words)
- Each data flow must have a clear Source and Destination role
- Minimum 3 nodes, maximum 15 nodes
- Valid node types: "rectangle", "circle", "cylinder", "diamond", "hexagon", "parallelogram", "square"`;

  if (preferredType === 'dfd') {
    if (dfdLevel === 0) {
      return `${baseRules}\n\nGenerating DFD Level 0 (Context Diagram).
CRITICAL LEVEL 0 RULES:
- Exactly ONE central process (type: "circle").
- External entities (type: "rectangle") represent external actors/sources/sinks.
- Data stores (type: "cylinder") represent databases.
- ALL data flows (edges) MUST connect directly between an External Entity and the central process, or between the central process and a Data Store.
- FORBIDDEN: NEVER connect external entities directly to each other in Level 0.`;
    }
    return `${baseRules}\n\nGenerating DFD Level 1 (Decomposed Sub-Processes).
CRITICAL LEVEL 1 RULES:
- Include 3 to 5 sub-processes (type: "circle"). Process labels MUST begin with sequential numbers (e.g. "1. Borrow Book", "2. Return Book", "3. Manage Catalog").
- External entities (type: "rectangle") represent input/output actors.
- Data stores (type: "cylinder") represent shared persistent tables/stores.
- Data flows MUST clearly connect entities to sub-processes, sub-processes to data stores, or sub-processes to each other.`;
  }
  
  if (preferredType === 'er') {
    return `You are a database design expert. You MUST respond with ONLY valid JSON.
    
Output format:
{
  "schemas": [
    {
      "id": "User",
      "name": "User",
      "color": "blue",
      "columns": [
        { "name": "userId", "dataType": "number", "key": "PK", "required": true, "unique": true },
        { "name": "username", "dataType": "string", "key": "none", "required": true, "unique": true }
      ]
    }
  ],
  "relationships": [
    { "source": "User", "target": "UserAttempt", "type": "one-to-many" }
  ]
}

Rules:
- Valid colors: "green", "blue", "orange", "yellow", "grey", "purple"
- Valid dataTypes: "string", "number", "decimal", "boolean", "date", "timestamp", "datetime", "JSON", "array"
- Valid key values: "none", "PK", "FK"
- Valid relationship types: "one-to-one", "one-to-many", "many-to-one", "many-to-many"
- Minimum 2 schemas, maximum 10 schemas.`;
  }

  return `${baseRules}\n\nGenerating Flowchart. Start/End (rectangle), steps (rectangle), decisions (diamond), I/O (parallelogram). Decisions have Yes/No edges.`;
}

async function fetchGroq(model: string, systemPrompt: string, userPrompt: string, apiKey: string) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const ACTIVE_GROQ_MODELS = [
  "groq/compound",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b"
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY environment variable in Supabase secrets.");

    const body = await req.json();
    const { description, preferredType = 'dfd', dfdLevel = 0 } = body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Please provide a description." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const systemPrompt = buildSystemPrompt(preferredType, dfdLevel);
    const userPrompt = `Generate a diagram for: ${description}`;

    let text;
    let lastErr: any = null;

    for (const model of ACTIVE_GROQ_MODELS) {
      try {
        console.log(`[Groq] Attempting model: ${model}`);
        text = await fetchGroq(model, systemPrompt, userPrompt, GROQ_API_KEY);
        if (text) {
          console.log(`[Groq] Success using model: ${model}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[Groq] Model ${model} failed:`, err.message);
        lastErr = err;
      }
    }

    if (!text) {
      throw lastErr || new Error("All Groq models failed.");
    }

    let cleanJson = text.trim();
    
    // Extract JSON block from markdown fences if present
    const markdownMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
      cleanJson = markdownMatch[1].trim();
    } else {
      // Find JSON object bounds
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr: any) {
      return new Response(JSON.stringify({ 
        error: `Groq returned invalid JSON. Parse Error: ${parseErr.message}`,
        raw_text: text 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    const msg = error.message || "Unknown error";
    console.error('[ERROR] Full error:', error);
    
    return new Response(JSON.stringify({
      error: `Generation Error: ${msg}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
