import { supabase } from "./supabase";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  diagram_type: "dfd" | "er";
  mermaid_code: string | null;
  ast_data: Record<string, unknown> | null;
  canvas_settings: Record<string, unknown> | null;
  status: "draft" | "active" | "trashed";
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Fetch all non-trashed projects for the current user */
export async function getUserProjects(
  status?: "draft" | "active" | "trashed",
) {
  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (status === "trashed") {
    query = query.eq("status", "trashed");
  } else if (status) {
    query = query.eq("status", status);
  } else {
    query = query.neq("status", "trashed");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}

/** Get a single project by ID */
export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) throw error;
  return data as Project;
}

/** Create a new project */
export async function createProject(
  userId: string,
  data: Partial<Pick<Project, "title" | "description" | "diagram_type" | "mermaid_code" | "ast_data" | "status">>,
) {
  const now = new Date().toISOString();
  const { data: newProject, error } = await supabase
    .from("projects")
    .insert({ 
      user_id: userId, 
      created_at: now,
      updated_at: now,
      ...data 
    })
    .select()
    .single();

  if (error) throw error;
  return newProject as Project;
}

/** Update project fields (used for auto-save) */
export async function updateProject(
  projectId: string,
  fields: Partial<Pick<Project, "title" | "description" | "mermaid_code" | "ast_data" | "canvas_settings" | "status">>,
) {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

/** Soft-delete (move to trash) */
export async function moveToTrash(projectId: string) {
  return updateProject(projectId, { status: "trashed" });
}

/** Restore from trash */
export async function restoreFromTrash(projectId: string) {
  return updateProject(projectId, { status: "active" });
}

/** Permanently delete */
export async function permanentlyDelete(projectId: string) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
}

/** Log an AI generation */
export async function logAiGeneration(
  userId: string,
  projectId: string | null,
  prompt: string,
  responseAst: Record<string, unknown>,
) {
  const { error } = await supabase.from("ai_generations").insert({
    user_id: userId,
    project_id: projectId,
    prompt,
    response_ast: responseAst,
  });

  if (error) console.error("Failed to log AI generation:", error.message);
}
