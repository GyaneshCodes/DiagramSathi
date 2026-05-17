import { type NodeProps, type Node } from "@xyflow/react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useErDiagramStore } from "../../store/useErDiagramStore";
import { Code2 } from "lucide-react";

/**
 * ErContainerNode — a bounding rectangle rendered behind all ER schema nodes.
 * The "Code Editor" button floats just above the container, visible only when
 * an ER schema or relationship is selected.
 * Not draggable/selectable. Auto-sized by the ER store's syncToMainStore().
 */
export const ErContainerNode = (_props: NodeProps<Node>) => {
  const setShowCodeInRightPanel = useDiagramStore(
    (s) => s.setShowCodeInRightPanel
  );
  const setRightPanelCollapsed = useDiagramStore(
    (s) => s.setRightPanelCollapsed
  );

  const hasSelection = useErDiagramStore(
    (s) => s.selectedSchemaId !== null || s.selectedRelationshipId !== null
  );

  return (
    <div className="w-full h-full relative pointer-events-none">
      {/* Code Editor button — positioned just above the container */}
      {hasSelection && (
        <button
          className="pointer-events-auto absolute -top-10 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 backdrop-blur-sm cursor-pointer shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-200"
          onClick={() => {
            setRightPanelCollapsed(false);
            setShowCodeInRightPanel(true);
          }}
          title="Open ER Code Editor"
        >
          <Code2 size={12} />
          Code Editor
        </button>
      )}

      {/* Container visual — transparent background, visible dashed border */}
      <div
        className="w-full h-full rounded-2xl"
        style={{
          border: "1.5px dashed rgba(148, 163, 184, 0.35)",
          background: "transparent",
        }}
      />
    </div>
  );
};
