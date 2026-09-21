# PLAN: Fix Dashboard Diagram Generation Multiple Triggers & Refreshes

**Task Slug:** `dashboard-generation-fix`  
**Project Type:** WEB (React 19 + TypeScript + Vite + Zustand + React Router)  
**Primary Agent:** `frontend-specialist` / `orchestrator`  
**Relevant Skills:** `clean-code`, `plan-writing`, `react-best-practices`

---

## 1. Overview
When a diagram generation prompt is submitted from the dashboard (`HeroSection.tsx`), the application navigates to `/editor`. The diagram is generated, but the page triggers multiple refreshes and the AI generation runs twice more, resulting in duplicate nodes and edges being generated on the canvas.

This plan outlines the surgical fixes across:
1. `LeftLayersPanel.tsx` (single-execution ref guard & immediate flag consumption)
2. `Editor.tsx` (suppression of redundant database re-fetch on newly created projects)
3. `App.tsx` (route unification with optional parameter to prevent component tree destruction)

---

## 2. Success Criteria
- [ ] Submitting a prompt from the Dashboard creates exactly ONE generation request.
- [ ] No multiple canvas reloads or page refreshes occur.
- [ ] Diagram nodes and edges are added to the canvas once without duplicate diagrams.
- [ ] The project successfully auto-saves to Supabase and the URL updates cleanly to `/editor/:id` without remounting the editor.
- [ ] `tsc -b && vite build` completes with 0 errors.

---

## 3. Tech Stack & Architecture Context
- **Framework:** React 19, Vite, React Router v7 / v6
- **State Management:** Zustand (`useDiagramStore`)
- **Backend:** Supabase Edge Functions (`generate-diagram`) & Supabase Database

---

## 4. Affected Files
1. `diagram-sathi/src/components/ui/LeftLayersPanel.tsx`
2. `diagram-sathi/src/pages/Editor.tsx`
3. `diagram-sathi/src/App.tsx`

---

## 5. Task Breakdown

### Task 1: Add One-Time Auto-Trigger Ref Guard in `LeftLayersPanel.tsx`
- **Agent:** `frontend-specialist`
- **Action:**
  - Introduce `hasAutoTriggeredRef = useRef(false)`.
  - Check `if (isGenerating && projectDescription.trim() && !hasAutoTriggeredRef.current)`.
  - Mark `hasAutoTriggeredRef.current = true`.
  - Immediately call `setIsGenerating(false)` so no re-renders or StrictMode double mounts can trigger another execution.
- **Verification:** StrictMode double-mount in dev mode only executes `handleSmartSuggest()` once.

### Task 2: Prevent Redundant `loadProject` Re-fetch in `Editor.tsx`
- **Agent:** `frontend-specialist`
- **Action:**
  - In `Editor.tsx`'s `useEffect` for `id`, check if `currentProjectId === id && nodes.length > 0`.
  - If already loaded in memory, mark `hasLoadedProject.current = true` and return early without calling `loadProject(id)`.
- **Verification:** Navigating to `/editor/:id` does not re-query Supabase or trigger canvas layout resets.

### Task 3: Unify Editor Route in `App.tsx`
- **Agent:** `frontend-specialist`
- **Action:**
  - Replace the separate `/editor` and `/editor/:id` route declarations with a single `<Route path="/editor/:id?" element={<ProtectedRoute><Editor /></ProtectedRoute>} />`.
- **Verification:** URL replacement via `navigate('/editor/' + id, { replace: true })` updates the browser URL without unmounting the Editor component tree.

---

## 6. Phase X: Verification Plan
1. **Automated Verification:**
   - Run `npm run build` inside `diagram-sathi` to verify TypeScript compile and Vite bundle integrity.
2. **Manual / Runtime Flow:**
   - Go to Dashboard (`/home`).
   - Enter prompt in input field and click "Generate".
   - Confirm:
     - Only 1 API request is sent to Supabase Edge Function.
     - Canvas renders the diagram cleanly once.
     - URL smoothly transitions to `/editor/:id`.
     - Zero duplicate diagrams or canvas flickering.
