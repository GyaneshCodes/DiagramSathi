import { create } from "zustand";
import { getProject, updateProject, createProject } from "../lib/projects";
import { applyElkLayout } from "../utils/elkLayout";
import { measureNodes } from "../utils/measureNodes";

// Basic structure for our Abstract Syntax Tree (AST) representing a DFD diagram.
export interface DfdNode {
  id: string;
  label: string;
  type: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  parentId?: string;
  color?: string;
}

export interface DfdEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: "solid" | "dashed" | "dotted";
  data?: {
    startPoint?: { x: number; y: number };
    bendPoints?: { x: number; y: number }[];
    endPoint?: { x: number; y: number };
  };
}

interface DiagramState {
  nodes: DfdNode[];
  edges: DfdEdge[];
  currentProjectId: string | null;
  projectTitle: string;
  projectDescription: string;
  diagramType: "dfd" | "er" | "flowchart";
  preferredDiagramType: "dfd" | "flowchart";
  dfdLevel: number;
  layoutVersion: number;
  isLayouting: boolean;
  isGenerating: boolean;
  activeTool: "cursor" | "pan";
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isExporting: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  showCodeInRightPanel: boolean;
  direction: "TB" | "LR";
  mermaidCode: string;

  // Actions
  setNodes: (nodes: DfdNode[]) => void;
  setEdges: (edges: DfdEdge[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setProjectTitle: (title: string) => void;
  setProjectDescription: (desc: string) => void;
  setDiagramType: (type: "dfd" | "er" | "flowchart") => void;
  setPreferredDiagramType: (type: "dfd" | "flowchart") => void;
  setDfdLevel: (level: number) => void;
  setIsGenerating: (is: boolean) => void;
  setActiveTool: (tool: "cursor" | "pan") => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setIsExporting: (exporting: boolean) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setShowCodeInRightPanel: (show: boolean) => void;
  setDirection: (dir: "TB" | "LR") => void;
  setMermaidCode: (code: string) => void;
  
  addNode: (node: Partial<DfdNode>) => void;
  addEdge: (edge: Partial<DfdEdge>) => void;
  updateNode: (id: string, data: Partial<DfdNode>) => void;
  updateEdge: (id: string, data: Partial<DfdEdge>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  applyAIGeneratedDiagram: (nodes: DfdNode[], edges: DfdEdge[]) => void;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (userId: string) => Promise<void>;
  applyLayoutAsync: () => Promise<void>;
  saveLayoutToSupabase: () => Promise<void>;
  resetToBlank: (type: "dfd" | "flowchart") => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: [],
  edges: [],
  currentProjectId: null,
  projectTitle: "Untitled Diagram",
  projectDescription: "",
  diagramType: "dfd",
  preferredDiagramType: "dfd",
  dfdLevel: 0,
  layoutVersion: 0,
  isLayouting: false,
  isGenerating: false,
  activeTool: "cursor",
  selectedNodeId: null,
  selectedEdgeId: null,
  isExporting: false,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  showCodeInRightPanel: false,
  direction: "LR",
  mermaidCode: "",

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setProjectTitle: (title) => set({ projectTitle: title }),
  setProjectDescription: (projectDescription) => set({ projectDescription }),
  setDiagramType: (type) => set({ diagramType: type }),
  setPreferredDiagramType: (type) => set({ preferredDiagramType: type }),
  setDfdLevel: (level) => set({ dfdLevel: level }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setLeftPanelCollapsed: (leftPanelCollapsed) => set({ leftPanelCollapsed }),
  setRightPanelCollapsed: (rightPanelCollapsed) => set({ rightPanelCollapsed }),
  setShowCodeInRightPanel: (showCodeInRightPanel) => set({ showCodeInRightPanel }),
  setDirection: (direction) => {
    set({ direction });
    get().applyLayoutAsync();
  },
  setMermaidCode: (mermaidCode) => set({ mermaidCode }),

  addNode: (node) => {
    const id = `node_${Math.random().toString(36).substr(2, 9)}`;
    const newNode = { 
      id, 
      label: "New Node", 
      type: "rectangle",
      position: { x: Math.random() * 100, y: Math.random() * 100 },
      ...node 
    } as DfdNode;
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  addEdge: (edge) => {
    const id = `e_${get().edges.length + 1}_${Math.random().toString(36).substr(2, 4)}`;
    const newEdge = { id, source: "", target: "", ...edge } as DfdEdge;
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
  },

  updateEdge: (id, data) => {
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }));
  },

  applyAIGeneratedDiagram: (nodes, edges) => {
    set({ nodes, edges, layoutVersion: (get().layoutVersion + 1) % 1000 });
    get().applyLayoutAsync();
  },

  resetToBlank: (type) => {
    set({
      nodes: [],
      edges: [],
      currentProjectId: null,
      projectTitle: "Untitled Diagram",
      projectDescription: "",
      diagramType: type,
      preferredDiagramType: type,
      dfdLevel: 0,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  loadProject: async (projectId) => {
    try {
      const project = await getProject(projectId);
      if (project.ast_data) {
        const { nodes, edges } = project.ast_data as any;
        set({
          nodes: nodes || [],
          edges: edges || [],
          currentProjectId: projectId,
          projectTitle: project.title,
          projectDescription: project.description || "",
          diagramType: project.diagram_type,
          layoutVersion: (get().layoutVersion + 1) % 1000,
        });
      } else {
        set({ 
          currentProjectId: projectId, 
          projectTitle: project.title,
          projectDescription: project.description || "",
          diagramType: project.diagram_type 
        });
      }
    } catch (err) {
      console.error("Failed to load project:", err);
    }
  },

  saveProject: async (userId) => {
    const { currentProjectId, nodes, edges, projectTitle, projectDescription, diagramType } = get();
    
    try {
      if (currentProjectId) {
        await updateProject(currentProjectId, {
          title: projectTitle,
          description: projectDescription,
          ast_data: { nodes, edges },
        });
      } else {
        const newProject = await createProject(userId, {
          title: projectTitle,
          description: projectDescription,
          diagram_type: diagramType,
          ast_data: { nodes, edges },
          status: "active",
        });
        set({ currentProjectId: newProject.id });
      }
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  },

  applyLayoutAsync: async () => {
    const { nodes, edges, dfdLevel } = get();
    if (nodes.length === 0) return;

    set({ isLayouting: true });

    try {
      // 1. Measure nodes (off-screen rendering to get precise dimensions)
      const measuredNodes = await measureNodes(nodes);
      
      // 2. Run ELK layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = await applyElkLayout(
        measuredNodes,
        edges,
        "LR",
        dfdLevel
      );

      set({
        nodes: layoutedNodes,
        edges: layoutedEdges,
        isLayouting: false,
        layoutVersion: (get().layoutVersion + 1) % 1000,
      });

      // 3. Auto-save layout
      get().saveLayoutToSupabase();
    } catch (err) {
      console.error("ELK layout failed:", err);
      set({ isLayouting: false });
    }
  },

  saveLayoutToSupabase: async () => {
    const { currentProjectId, nodes, edges } = get();
    if (!currentProjectId) return;

    try {
      await updateProject(currentProjectId, {
        ast_data: { nodes, edges },
      });
    } catch (err) {
      console.error("Failed to save layout state", err);
    }
  },
}));

