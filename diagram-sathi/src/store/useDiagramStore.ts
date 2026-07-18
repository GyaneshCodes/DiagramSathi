import { create } from "zustand";
import { useErDiagramStore } from "./useErDiagramStore";
import { getProject, updateProject, createProject } from "../lib/projects";
import { applyElkLayout } from "../utils/elkLayout";
import { getLayoutedElements } from "../utils/layoutGraph";
import { measureNodes } from "../utils/measureNodes";
import type { ReactFlowInstance } from "@xyflow/react";
import { parseMermaidCode, serializeAstToMermaid } from "../utils/mermaidParser";
import type { DiagramThemeType } from "../utils/diagramThemes";

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
  fillColor?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
}

export interface DfdEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
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
  preferredDiagramType: "dfd" | "flowchart" | "er";
  dfdLevel: number;
  layoutVersion: number;
  isLayouting: boolean;
  isGenerating: boolean;
  activeTool: "cursor" | "pan";
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  isExporting: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  showCodeInRightPanel: boolean;
  direction: "TB" | "LR";
  mermaidCode: string;
  latestGeneratedNodeIds: string[];
  projectStatus: "draft" | "active" | "trashed";
  reactFlowInstance: ReactFlowInstance | null;
  diagramTheme: DiagramThemeType;

  // Actions
  setNodes: (nodes: DfdNode[]) => void;
  setEdges: (edges: DfdEdge[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setProjectTitle: (title: string) => void;
  setProjectDescription: (desc: string) => void;
  setDiagramType: (type: "dfd" | "er" | "flowchart") => void;
  setPreferredDiagramType: (type: "dfd" | "flowchart" | "er") => void;
  setDfdLevel: (level: number) => void;
  setIsGenerating: (is: boolean) => void;
  setActiveTool: (tool: "cursor" | "pan") => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setSelectedSelection: (nodeIds: string[], edgeIds: string[]) => void;
  setIsExporting: (exporting: boolean) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setShowCodeInRightPanel: (show: boolean) => void;
  setDirection: (dir: "TB" | "LR") => void;
  setMermaidCode: (code: string) => void;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  setDiagramTheme: (theme: DiagramThemeType) => void;
  
  addNode: (node: Partial<DfdNode>) => void;
  addEdge: (edge: Partial<DfdEdge>) => void;
  updateNode: (id: string, data: Partial<DfdNode>) => void;
  updateNodes: (ids: string[], data: Partial<DfdNode>) => void;
  updateEdge: (id: string, data: Partial<DfdEdge>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  applyAIGeneratedDiagram: (nodes: DfdNode[], edges: DfdEdge[]) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (userId: string, isDraft?: boolean) => Promise<void>;
  applyLayoutAsync: () => Promise<void>;
  forceLayoutRefresh: () => void;
  saveLayoutToSupabase: () => Promise<void>;
  resetToBlank: (type: "dfd" | "flowchart" | "er") => void;
  syncCodeToAst: () => void;
  syncAstToCode: () => void;
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
  selectedNodeIds: [],
  selectedEdgeIds: [],
  isExporting: false,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  showCodeInRightPanel: false,
  direction: "LR",
  mermaidCode: "",
  latestGeneratedNodeIds: [],
  projectStatus: "active",
  reactFlowInstance: null,
  diagramTheme: "default",

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
  setSelectedNodeId: (id) => set((state) => ({
    selectedNodeId: id,
    selectedEdgeId: id ? null : state.selectedEdgeId,
    selectedNodeIds: id ? [id] : [],
    selectedEdgeIds: id ? [] : state.selectedEdgeIds,
  })),
  setSelectedEdgeId: (id) => set((state) => ({
    selectedEdgeId: id,
    selectedNodeId: id ? null : state.selectedNodeId,
    selectedEdgeIds: id ? [id] : [],
    selectedNodeIds: id ? [] : state.selectedNodeIds,
  })),
  setSelectedSelection: (nodeIds, edgeIds) => {
    const { selectedNodeIds, selectedEdgeIds } = get();
    
    const nodesSet = new Set(selectedNodeIds);
    const nodesEqual = 
      selectedNodeIds.length === nodeIds.length &&
      nodeIds.every((id) => nodesSet.has(id));
      
    const edgesSet = new Set(selectedEdgeIds);
    const edgesEqual = 
      selectedEdgeIds.length === edgeIds.length &&
      edgeIds.every((id) => edgesSet.has(id));
      
    if (nodesEqual && edgesEqual) return;

    set({
      selectedNodeIds: nodeIds,
      selectedEdgeIds: edgeIds,
      selectedNodeId: nodeIds.length === 1 ? nodeIds[0] : null,
      selectedEdgeId: edgeIds.length === 1 ? edgeIds[0] : null,
    });
  },
  setIsExporting: (isExporting) => set({ isExporting }),
  setLeftPanelCollapsed: (leftPanelCollapsed) => set({ leftPanelCollapsed }),
  setRightPanelCollapsed: (rightPanelCollapsed) => set({ rightPanelCollapsed }),
  setShowCodeInRightPanel: (showCodeInRightPanel) => set({ showCodeInRightPanel }),
  setDirection: (direction) => {
    set({ direction });
    get().applyLayoutAsync();
  },
  setMermaidCode: (mermaidCode) => set({ mermaidCode }),
  setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),
  setDiagramTheme: (diagramTheme) => {
    set({ diagramTheme });
    get().applyLayoutAsync();
  },

  addNode: (node) => {
    const { nodes } = get();
    let maxX = 0;
    let maxY = 100;

    if (nodes.length > 0) {
      nodes.forEach((n) => {
        if (n.type === "er-container") return;
        const x = n.position?.x || 0;
        const w = n.width || 180;
        const nodeRight = x + w;
        if (nodeRight > maxX) {
          maxX = nodeRight;
          maxY = n.position?.y ?? 100;
        }
      });
    }

    const id = `node_${Math.random().toString(36).substr(2, 9)}`;
    const newNode = { 
      id, 
      label: "New Node", 
      type: "rectangle",
      position: { 
        x: nodes.length > 0 ? maxX + 200 : 100, 
        y: maxY 
      },
      ...node 
    } as DfdNode;
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    
    if (get().diagramType !== "er") {
      get().applyLayoutAsync();
    }
    get().syncAstToCode();
  },

  addEdge: (edge) => {
    const id = `e_${get().edges.length + 1}_${Math.random().toString(36).substr(2, 4)}`;
    const newEdge = { id, source: "", target: "", ...edge } as DfdEdge;
    set((state) => ({ edges: [...state.edges, newEdge] }));
    
    if (get().diagramType !== "er") {
      get().applyLayoutAsync();
    }
    get().syncAstToCode();
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
    
    // Auto-layout when shape type changes
    if (data.type && get().diagramType !== "er") {
      get().applyLayoutAsync();
    }
    get().syncAstToCode();
  },

  updateNodes: (ids, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (ids.includes(n.id) ? { ...n, ...data } : n)),
    }));
    get().applyLayoutAsync();
    get().syncAstToCode();
  },

  updateEdge: (id, data) => {
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
    
    // Auto-layout when edge source/target changes
    if ((data.source || data.target) && get().diagramType !== "er") {
      get().applyLayoutAsync();
    }
    get().syncAstToCode();
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      selectedNodeIds: state.selectedNodeIds.filter((nid) => nid !== id),
    }));
    
    if (get().diagramType !== "er") {
      get().applyLayoutAsync();
    }
    get().syncAstToCode();
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      selectedEdgeIds: state.selectedEdgeIds.filter((eid) => eid !== id),
    }));
    
    if (get().diagramType !== "er") {
      get().applyLayoutAsync();
    }
    get().syncAstToCode();
  },

  applyAIGeneratedDiagram: async (newNodes, newEdges) => {
    const { nodes: existingNodes, edges: existingEdges, dfdLevel, direction, diagramType } = get();

    set({ isLayouting: true });

    try {
      const measuredNewNodes = await measureNodes(newNodes);
      
      let layoutedNewNodes: DfdNode[] = [];
      let layoutedNewEdges: DfdEdge[] = [];

      if (diagramType === "dfd" || diagramType === "flowchart") {
        // Run Dagre layout
        const result = getLayoutedElements(
          measuredNewNodes as any[],
          newEdges as any[],
          { direction }
        );
        layoutedNewNodes = result.nodes as unknown as DfdNode[];
        // Clear ELK specific routing metadata so React Flow defaults to floating/dynamic edges
        layoutedNewEdges = newEdges.map(e => ({
          ...e,
          sourceHandle: undefined,
          targetHandle: undefined,
          data: undefined
        }));
      } else {
        // Fallback to ELK
        const result = await applyElkLayout(
          measuredNewNodes,
          newEdges,
          direction,
          dfdLevel
        );
        layoutedNewNodes = result.nodes;
        layoutedNewEdges = result.edges;
      }

      let maxX = 0;
      if (existingNodes.length > 0) {
        existingNodes.forEach(node => {
          const nodeRight = (node.position?.x || 0) + (node.width || 180);
          if (nodeRight > maxX) {
            maxX = nodeRight;
          }
        });
      }

      const offset = maxX > 0 ? maxX + 300 : 0;

      const offsetNewNodes = layoutedNewNodes.map(node => ({
        ...node,
        position: {
          x: (node.position?.x || 0) + offset,
          y: node.position?.y || 0
        }
      }));

      const offsetNewEdges = layoutedNewEdges.map(edge => {
        if (!edge.data) return edge;
        const newData = { ...edge.data };
        if (newData.startPoint) {
          newData.startPoint = { x: newData.startPoint.x + offset, y: newData.startPoint.y };
        }
        if (newData.endPoint) {
          newData.endPoint = { x: newData.endPoint.x + offset, y: newData.endPoint.y };
        }
        if (newData.bendPoints) {
          newData.bendPoints = newData.bendPoints.map((p: any) => ({ x: p.x + offset, y: p.y }));
        }
        return { ...edge, data: newData };
      });

      const latestGeneratedNodeIds = offsetNewNodes.map(n => n.id);

      set({
        nodes: [...existingNodes, ...offsetNewNodes],
        edges: [...existingEdges, ...offsetNewEdges],
        layoutVersion: (get().layoutVersion + 1) % 1000,
        latestGeneratedNodeIds,
        isLayouting: false
      });

      get().syncAstToCode();
      get().saveLayoutToSupabase();
    } catch (err) {
      console.error("AI Layout failed", err);
      set({ isLayouting: false });
    }
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
      dfdLevel: type === "dfd" ? 0 : 0,
      selectedNodeId: null,
      selectedEdgeId: null,
      projectStatus: "active",
      mermaidCode: "",
    });
    if (type === "er") {
      useErDiagramStore.getState().reset();
      useErDiagramStore.getState().syncToMainStore();
    } else {
      useErDiagramStore.getState().reset();
    }
  },

  loadProject: async (projectId) => {
    try {
      const project = await getProject(projectId);
      const ast = project.ast_data as { nodes?: any[]; edges?: any[] } | null;
      const canvasSettings = project.canvas_settings as { direction?: "TB" | "LR" } | null;

      set({
        currentProjectId: projectId,
        projectTitle: project.title,
        projectDescription: project.description || "",
        nodes: ast?.nodes || [],
        edges: ast?.edges || [],
        diagramType: project.diagram_type || "dfd",
        preferredDiagramType: project.diagram_type || "dfd",
        dfdLevel: project.dfd_level || 0,
        projectStatus: project.status,
        mermaidCode: project.mermaid_code || "",
        direction: canvasSettings?.direction || "LR",
        layoutVersion: (get().layoutVersion + 1) % 1000,
      });

      // Hydrate ER store for ER diagrams
      if (project.diagram_type === "er") {
        const erData = project.er_data as { schemas?: any[]; relationships?: any[] } | null;
        if (erData && erData.schemas && erData.schemas.length > 0) {
          useErDiagramStore.getState().loadFromAstData(erData);
        } else {
          useErDiagramStore.getState().reset();
        }
      } else {
        useErDiagramStore.getState().reset();
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      throw err;
    }
  },

  saveProject: async (userId, isDraft) => {
    const { currentProjectId, nodes, edges, projectTitle, projectDescription, diagramType, projectStatus, direction } = get();
    
    // Determine target status
    let targetStatus = projectStatus;
    if (isDraft !== undefined) {
      targetStatus = isDraft ? "draft" : "active";
    }

    try {
      if (currentProjectId) {
        const erData = useErDiagramStore.getState().getAstData();
        
        await updateProject(currentProjectId, {
          title: projectTitle,
          description: projectDescription,
          diagram_type: diagramType,
          ast_data: { nodes: get().nodes, edges: get().edges },
          dfd_level: get().dfdLevel,
          er_data: erData,
          canvas_settings: { direction },
          status: targetStatus,
        });
        set({ projectStatus: targetStatus });
      } else {
        const erData = diagramType === "er" ? useErDiagramStore.getState().getAstData() : undefined;
        const newProject = await createProject(userId, {
          title: projectTitle,
          description: projectDescription,
          diagram_type: diagramType,
          ast_data: { nodes, edges },
          er_data: erData,
          canvas_settings: { direction },
          status: targetStatus || "active",
        });
        set({ currentProjectId: newProject.id, projectStatus: newProject.status });
      }
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  },

  applyLayoutAsync: async () => {
    const { nodes, edges, dfdLevel, direction, diagramType } = get();
    if (nodes.length === 0) return;

    set({ isLayouting: true });

    try {
      // 1. Measure nodes (off-screen rendering to get precise dimensions)
      const measuredNodes = await measureNodes(nodes);
      
      let layoutedNodes: DfdNode[] = [];
      let layoutedEdges: DfdEdge[] = [];

      if (diagramType === "dfd" || diagramType === "flowchart") {
        // Run Dagre layout
        const result = getLayoutedElements(
          measuredNodes as any[],
          edges as any[],
          { direction }
        );
        layoutedNodes = result.nodes as unknown as DfdNode[];
        // Clear ELK specific routing metadata so React Flow defaults to floating/dynamic edges
        layoutedEdges = edges.map(e => ({
          ...e,
          sourceHandle: undefined,
          targetHandle: undefined,
          data: undefined
        }));
      } else {
        // Fallback to ELK layout
        const result = await applyElkLayout(
          measuredNodes,
          edges,
          direction,
          dfdLevel
        );
        layoutedNodes = result.nodes;
        layoutedEdges = result.edges;
      }

      set({
        nodes: layoutedNodes,
        edges: layoutedEdges,
        isLayouting: false,
        layoutVersion: (get().layoutVersion + 1) % 1000,
      });

      // 3. Auto-save layout
      get().saveLayoutToSupabase();
    } catch (err) {
      console.error("Layout failed:", err);
      set({ isLayouting: false });
    }
  },

  forceLayoutRefresh: () => {
    if (get().diagramType === "er") {
      useErDiagramStore.getState().applyLayout();
    } else {
      get().applyLayoutAsync();
    }
  },

  saveLayoutToSupabase: async () => {
    const { currentProjectId, nodes, edges, direction } = get();
    if (!currentProjectId) return;

    try {
      await updateProject(currentProjectId, {
        ast_data: { nodes, edges },
        canvas_settings: { direction },
      });
    } catch (err) {
      console.error("Failed to save layout state", err);
    }
  },

  syncCodeToAst: () => {
    const currentType = get().diagramType;
    if (currentType === "er") return;
    const code = get().mermaidCode;
    if (!code || !code.trim()) return;
    try {
      const { nodes, edges, direction, diagramType } = parseMermaidCode(code, currentType);
      
      // Preserve coordinates and styling from matching existing nodes
      const oldNodes = get().nodes;
      const mergedNodes = nodes.map(newN => {
        const oldN = oldNodes.find(o => o.id === newN.id);
        if (oldN) {
          return {
            ...newN,
            position: oldN.position || newN.position,
            width: oldN.width || newN.width,
            height: oldN.height || newN.height,
            color: oldN.color || newN.color,
            fillColor: oldN.fillColor || newN.fillColor
          };
        }
        return newN;
      });

      set({
        nodes: mergedNodes,
        edges,
        direction,
        diagramType,
        preferredDiagramType: diagramType
      });

      // Automatically compute layouts/dimensions for the new structure
      get().applyLayoutAsync();
    } catch (err) {
      console.error("Failed to parse Mermaid code:", err);
    }
  },

  syncAstToCode: () => {
    const { nodes, edges, direction, diagramType } = get();
    if (diagramType === "er") return;
    const code = serializeAstToMermaid(nodes, edges, direction, diagramType);
    set({ mermaidCode: code });
  },
}));

