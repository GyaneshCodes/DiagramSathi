import {
  useInternalNode,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  Position,
} from "@xyflow/react";
import { useErDiagramStore } from "../../store/useErDiagramStore";
import { useTheme } from "../../context/ThemeContext";
import { buildRoundedPath } from "./ElkPolylineEdge";

/**
 * Renders a relationship edge between two ER schema nodes.
 * Uses ELK's orthogonal routing with bendPoints if available,
 * ensuring separate, non-overlapping paths with cardinality labels (1 / N).
 */
export const ErRelationshipEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition: passedSourcePos,
  targetPosition: passedTargetPos,
  markerEnd,
  style,
  data,
}: EdgeProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
    const elkStart = data?.startPoint as { x: number; y: number } | undefined;
    const elkEnd = data?.endPoint as { x: number; y: number } | undefined;
    const bendPoints = (data?.bendPoints as { x: number; y: number }[]) || [];
    const hasElkRouting = !!(elkStart && elkEnd);

    let edgePath = "";
    let sLabelX = 0;
    let sLabelY = 0;
    let tLabelX = 0;
    let tLabelY = 0;

    if (hasElkRouting) {
      const allPoints = [elkStart!, ...bendPoints, elkEnd!];
      edgePath = buildRoundedPath(allPoints);

      // Source label placement based on initial exit direction
      const pStart = allPoints[0];
      const pNext = allPoints[1] || allPoints[0];
      const dxStart = pNext.x - pStart.x;
      const dyStart = pNext.y - pStart.y;

      if (Math.abs(dxStart) >= Math.abs(dyStart)) {
        sLabelX = pStart.x + (dxStart > 0 ? 18 : -18);
        sLabelY = pStart.y - 14;
      } else {
        sLabelX = pStart.x + 20;
        sLabelY = pStart.y + (dyStart > 0 ? 18 : -18);
      }

      // Target label placement based on incoming entry direction
      const pEnd = allPoints[allPoints.length - 1];
      const pPrevEnd = allPoints[allPoints.length - 2] || allPoints[0];
      const dxEnd = pEnd.x - pPrevEnd.x;
      const dyEnd = pEnd.y - pPrevEnd.y;

      if (Math.abs(dxEnd) >= Math.abs(dyEnd)) {
        tLabelX = pEnd.x + (dxEnd > 0 ? -18 : 18);
        tLabelY = pEnd.y - 14;
      } else {
        tLabelX = pEnd.x + 20;
        tLabelY = pEnd.y + (dyEnd > 0 ? -18 : 18);
      }
    } else {
      // Fallback Bézier routing when ELK routing data is not yet computed
      const hasExplicitCoords =
        typeof sourceX === "number" &&
        !isNaN(sourceX) &&
        typeof targetX === "number" &&
        !isNaN(targetX) &&
        typeof sourceY === "number" &&
        !isNaN(sourceY) &&
        typeof targetY === "number" &&
        !isNaN(targetY);

      let sx = sourceX;
      let sy = sourceY;
      let tx = targetX;
      let ty = targetY;
      let sourcePosition = passedSourcePos || Position.Right;
      let targetPosition = passedTargetPos || Position.Left;

      if (!hasExplicitCoords) {
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

        if (Math.abs(dx) > Math.abs(dy)) {
          sourcePosition = dx > 0 ? Position.Right : Position.Left;
          targetPosition = dx > 0 ? Position.Left : Position.Right;
        } else {
          sourcePosition = dy > 0 ? Position.Bottom : Position.Top;
          targetPosition = dy > 0 ? Position.Top : Position.Bottom;
        }

        sx = sourcePosition === Position.Right ? sPos.x + sW
                 : sourcePosition === Position.Left ? sPos.x
                 : sPos.x + sW / 2;
        sy = sourcePosition === Position.Bottom ? sPos.y + sH
                 : sourcePosition === Position.Top ? sPos.y
                 : sPos.y + sH / 2;
        tx = targetPosition === Position.Right ? tPos.x + tW
                 : targetPosition === Position.Left ? tPos.x
                 : tPos.x + tW / 2;
        ty = targetPosition === Position.Bottom ? tPos.y + tH
                 : targetPosition === Position.Top ? tPos.y
                 : tPos.y + tH / 2;
      }

      if (sx === tx && sy === ty) return null;

      const [bezierPath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition,
        targetX: tx,
        targetY: ty,
        targetPosition,
        curvature: 0.35,
      });

      edgePath = bezierPath;
      const labelOffset = 18;
      sLabelX = sourcePosition === Position.Right ? sx + labelOffset
                     : sourcePosition === Position.Left ? sx - labelOffset
                     : sx;
      sLabelY = sy - 12;
      tLabelX = targetPosition === Position.Right ? tx + labelOffset
                     : targetPosition === Position.Left ? tx - labelOffset
                     : tx;
      tLabelY = ty - 12;
    }

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

    const edgeStroke = isDark ? "var(--edge-color, #94a3b8)" : "#64748b";
    const badgeClass = isDark
      ? "text-slate-200 bg-slate-800/95 border-slate-700/90 shadow-sm"
      : "text-slate-800 bg-white border-slate-300/90 shadow-sm";

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: edgeStroke,
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
            <span className={`text-[12px] font-bold border px-2 py-0.5 rounded transition-colors duration-150 ${badgeClass}`}>
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
            <span className={`text-[12px] font-bold border px-2 py-0.5 rounded transition-colors duration-150 ${badgeClass}`}>
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
