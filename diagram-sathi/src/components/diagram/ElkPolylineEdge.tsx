import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";

/**
 * ElkPolylineEdge Component
 *
 * Renders a polyline edge based on the FULL routing path provided by ELK.
 * Uses ELK's startPoint/endPoint (if available) instead of React Flow's
 * auto-calculated sourceX/Y/targetX/Y, ensuring pixel-perfect orthogonal
 * routing that matches exactly what the layout engine computed.
 */

/** Radius for rounded corners at bend points */
const CORNER_RADIUS = 6;

/**
 * Builds an SVG path with rounded corners at each bend point.
 * Uses arc commands (A) instead of sharp line-to (L) for clean 90° turns.
 * Exported so ER relationship edges can share the exact same clean rounded polyline rendering.
 */
export function buildRoundedPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Direction vectors
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // Segment lengths
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    // Cross product to detect turns vs collinear straight segments
    const cross = dx1 * dy2 - dy1 * dx2;

    // Clamp radius to half the shorter segment
    const r = Math.min(CORNER_RADIUS, len1 / 2, len2 / 2);

    if (r <= 0 || len1 === 0 || len2 === 0 || Math.abs(cross) < 1e-3) {
      // Degenerate segment or collinear — smoothly draw a line to avoid loop distortion
      path += ` L ${curr.x},${curr.y}`;
      continue;
    }

    // Start of the arc (back from the bend point along incoming segment)
    const arcStartX = curr.x - (dx1 / len1) * r;
    const arcStartY = curr.y - (dy1 / len1) * r;

    // End of the arc (forward from bend point along outgoing segment)
    const arcEndX = curr.x + (dx2 / len2) * r;
    const arcEndY = curr.y + (dy2 / len2) * r;

    // Determine sweep direction
    const sweep = cross > 0 ? 1 : 0;

    path += ` L ${arcStartX},${arcStartY}`;
    path += ` A ${r} ${r} 0 0 ${sweep} ${arcEndX},${arcEndY}`;
  }

  // Line to the final point
  const last = points[points.length - 1];
  path += ` L ${last.x},${last.y}`;

  return path;
}

export const ElkPolylineEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  markerEnd,
  style,
  data,
}: EdgeProps) => {
  // Prefer ELK's exact routing coordinates over React Flow's approximations
  const elkStart = data?.startPoint as { x: number; y: number } | undefined;
  const elkEnd = data?.endPoint as { x: number; y: number } | undefined;
  const bendPoints = (data?.bendPoints as { x: number; y: number }[]) || [];

  const start = elkStart || { x: sourceX, y: sourceY };
  const end = elkEnd || { x: targetX, y: targetY };

  // Build the full point chain: start → bends → end
  const allPoints = [start, ...bendPoints, end];

  // Construct rounded SVG path
  const path = buildRoundedPath(allPoints);

  // Find best segment for label positioning — prioritizing horizontal segments
  let bestSegmentIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < allPoints.length - 1; i++) {
    const p1 = allPoints[i];
    const p2 = allPoints[i + 1];
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const len = Math.sqrt(dx * dx + dy * dy);
    const isHorizontal = dx >= dy;
    // Strongly favor horizontal segments so labels align comfortably along lines
    const score = isHorizontal ? len * 3 : len;

    if (score > maxScore) {
      maxScore = score;
      bestSegmentIndex = i;
    }
  }

  // Midpoint of the chosen segment
  const p1 = allPoints[bestSegmentIndex] || start;
  const p2 = allPoints[bestSegmentIndex + 1] || end;
  let labelX = (p1.x + p2.x) / 2;
  let labelY = (p1.y + p2.y) / 2;

  // Stagger labels for parallel lines to prevent overlapping text
  const pairIndex = (data?.pairIndex as number) ?? 0;
  const pairTotal = (data?.pairTotal as number) ?? 1;
  const isHorizontal = Math.abs(p2.x - p1.x) >= Math.abs(p2.y - p1.y);

  if (isHorizontal) {
    labelY -= 14;
    if (pairTotal > 1) {
      labelX += (pairIndex - (pairTotal - 1) / 2) * 55;
    }
  } else {
    labelX += 18;
    if (pairTotal > 1) {
      labelY += (pairIndex - (pairTotal - 1) / 2) * 32;
    }
  }

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background: "var(--edge-label-bg, rgba(15, 23, 42, 0.92))",
              color: "var(--edge-label-text, #f1f5f9)",
              pointerEvents: "all",
              whiteSpace: "nowrap",
              border: "1px solid var(--border-color, rgba(51, 65, 85, 0.8))",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
            }}
            className="nodrag nopan z-20"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ElkPolylineEdge;
