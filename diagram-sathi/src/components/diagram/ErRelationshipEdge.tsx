import {
  useInternalNode,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  Position,
} from "@xyflow/react";
import { useErDiagramStore } from "../../store/useErDiagramStore";

/**
 * Renders a relationship edge between two ER schema nodes.
 * Shows cardinality labels (1 / N) at each endpoint.
 */
export const ErRelationshipEdge = ({
  id,
  source,
  target,
  markerEnd,
  style,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  // Look up the relationship to get the type
  const relId = id.replace("er_rel_", "");
  const relationship = useErDiagramStore((s) =>
    s.relationships.find((r) => r.id === relId)
  );

  if (!sourceNode || !targetNode || !sourceNode.internals || !targetNode.internals) {
    return null;
  }

  try {
    const sPos = sourceNode.internals.positionAbsolute;
    const tPos = targetNode.internals.positionAbsolute;
    const sW = sourceNode.measured?.width ?? 300;
    const sH = sourceNode.measured?.height ?? 76;
    const tW = targetNode.measured?.width ?? 300;
    const tH = targetNode.measured?.height ?? 76;

    const sCx = sPos.x + sW / 2;
    const sCy = sPos.y + sH / 2;
    const tCx = tPos.x + tW / 2;
    const tCy = tPos.y + tH / 2;

    const dx = tCx - sCx;
    const dy = tCy - sCy;

    let sourcePosition: Position;
    let targetPosition: Position;

    if (Math.abs(dx) > Math.abs(dy)) {
      sourcePosition = dx > 0 ? Position.Right : Position.Left;
      targetPosition = dx > 0 ? Position.Left : Position.Right;
    } else {
      sourcePosition = dy > 0 ? Position.Bottom : Position.Top;
      targetPosition = dy > 0 ? Position.Top : Position.Bottom;
    }

    const sx = sourcePosition === Position.Right ? sPos.x + sW
             : sourcePosition === Position.Left ? sPos.x
             : sPos.x + sW / 2;
    const sy = sourcePosition === Position.Bottom ? sPos.y + sH
             : sourcePosition === Position.Top ? sPos.y
             : sPos.y + sH / 2;
    const tx = targetPosition === Position.Right ? tPos.x + tW
             : targetPosition === Position.Left ? tPos.x
             : tPos.x + tW / 2;
    const ty = targetPosition === Position.Bottom ? tPos.y + tH
             : targetPosition === Position.Top ? tPos.y
             : tPos.y + tH / 2;

    if (sx === tx && sy === ty) return null;

    const [edgePath] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition,
      targetX: tx,
      targetY: ty,
      targetPosition,
    });

    // Cardinality labels
    let sourceLabel = "1";
    let targetLabel = "N";

    if (relationship) {
      switch (relationship.type) {
        case "one-to-one":
          sourceLabel = "1";
          targetLabel = "1";
          break;
        case "one-to-many":
          sourceLabel = "1";
          targetLabel = "N";
          break;
        case "many-to-one":
          sourceLabel = "N";
          targetLabel = "1";
          break;
        case "many-to-many":
          sourceLabel = "N";
          targetLabel = "N";
          break;
      }
    }

    // Offset labels slightly from the endpoints
    const labelOffset = 18;
    const sLabelX = sourcePosition === Position.Right ? sx + labelOffset
                   : sourcePosition === Position.Left ? sx - labelOffset
                   : sx;
    const sLabelY = sourcePosition === Position.Bottom ? sy + labelOffset
                   : sourcePosition === Position.Top ? sy - labelOffset
                   : sy;
    const tLabelX = targetPosition === Position.Right ? tx + labelOffset
                   : targetPosition === Position.Left ? tx - labelOffset
                   : tx;
    const tLabelY = targetPosition === Position.Bottom ? ty + labelOffset
                   : targetPosition === Position.Top ? ty - labelOffset
                   : ty;

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: "var(--edge-color, #94a3b8)",
            strokeWidth: 2.5,
          }}
        />
        <EdgeLabelRenderer>
          {/* Source cardinality label */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sLabelX}px,${sLabelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-10"
          >
            <span className="text-[12px] font-bold text-neutral bg-panel border border-border px-2 py-0.5 rounded shadow-sm">
              {sourceLabel}
            </span>
          </div>
          {/* Target cardinality label */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${tLabelX}px,${tLabelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-10"
          >
            <span className="text-[12px] font-bold text-neutral bg-panel border border-border px-2 py-0.5 rounded shadow-sm">
              {targetLabel}
            </span>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  } catch (err) {
    console.error("ER Edge Render Error:", err);
    return null;
  }
};
