import type { DfdNode, DfdEdge } from "../store/useDiagramStore";

const GUEST_DIAGRAM_KEY = "ds_guest_diagram";
const GUEST_AI_CREDITS_KEY = "ds_guest_ai_credits";
const PENDING_CLAIM_KEY = "ds_pending_claim";
const DEFAULT_AI_CREDITS = 3;

export interface GuestDiagramData {
  title: string;
  description: string;
  diagramType: "dfd" | "er" | "flowchart";
  dfdLevel: number;
  nodes: DfdNode[];
  edges: DfdEdge[];
  mermaidCode: string;
  direction: "TB" | "LR";
  erData?: any;
  updatedAt: string;
}

/**
 * Saves current diagram state into browser localStorage for guests.
 */
export function saveGuestDiagram(data: Partial<GuestDiagramData>): void {
  try {
    const existing = loadGuestDiagram() || {
      title: "Untitled Diagram",
      description: "",
      diagramType: "dfd",
      dfdLevel: 0,
      nodes: [],
      edges: [],
      mermaidCode: "",
      direction: "LR",
      updatedAt: new Date().toISOString(),
    };

    const merged: GuestDiagramData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(GUEST_DIAGRAM_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("[GuestStorage] Failed to save guest diagram:", err);
  }
}

/**
 * Loads the saved guest diagram from localStorage.
 */
export function loadGuestDiagram(): GuestDiagramData | null {
  try {
    const raw = localStorage.getItem(GUEST_DIAGRAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestDiagramData;
  } catch (err) {
    console.warn("[GuestStorage] Failed to parse guest diagram:", err);
    return null;
  }
}

/**
 * Clears the guest diagram from localStorage.
 */
export function clearGuestDiagram(): void {
  try {
    localStorage.removeItem(GUEST_DIAGRAM_KEY);
  } catch (err) {
    console.warn("[GuestStorage] Failed to clear guest diagram:", err);
  }
}

/**
 * Returns remaining guest AI generation credits (default: 3).
 */
export function getGuestAiCredits(): number {
  try {
    const val = localStorage.getItem(GUEST_AI_CREDITS_KEY);
    if (val === null) {
      localStorage.setItem(GUEST_AI_CREDITS_KEY, String(DEFAULT_AI_CREDITS));
      return DEFAULT_AI_CREDITS;
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? DEFAULT_AI_CREDITS : Math.max(0, parsed);
  } catch {
    return DEFAULT_AI_CREDITS;
  }
}

/**
 * Checks whether guest user has remaining AI generation credits.
 */
export function hasGuestAiCredits(): boolean {
  return getGuestAiCredits() > 0;
}

/**
 * Decrements guest AI credits by 1 and returns remaining credits.
 */
export function decrementGuestAiCredits(): number {
  try {
    const current = getGuestAiCredits();
    const next = Math.max(0, current - 1);
    localStorage.setItem(GUEST_AI_CREDITS_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

/**
 * Sets a flag indicating that a guest diagram is waiting to be claimed upon authentication.
 */
export function setPendingClaim(pending: boolean): void {
  try {
    if (pending) {
      localStorage.setItem(PENDING_CLAIM_KEY, "true");
    } else {
      localStorage.removeItem(PENDING_CLAIM_KEY);
    }
  } catch {}
}

/**
 * Checks if a pending claim flag is set.
 */
export function isPendingClaim(): boolean {
  try {
    return localStorage.getItem(PENDING_CLAIM_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Clears the pending claim flag.
 */
export function clearPendingClaim(): void {
  try {
    localStorage.removeItem(PENDING_CLAIM_KEY);
  } catch {}
}
