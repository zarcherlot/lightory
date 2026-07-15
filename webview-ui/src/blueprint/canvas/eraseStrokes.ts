import type { StrokeReplacement } from '../domain/commands.js';
import type { InkPoint, InkStroke } from '../domain/types.js';
import type { BlueprintEdge, BlueprintNode } from '../domain/types.js';

export function findEdgesIntersectingEraser(
  edges: BlueprintEdge[],
  nodes: BlueprintNode[],
  eraserPath: Array<{ x: number; y: number }>,
  radius: number,
): BlueprintEdge[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const samples = resamplePath(eraserPath, Math.max(2, radius / 2));
  return edges.filter((edge) => {
    const source = nodeById.get(edge.sourceId);
    const target = nodeById.get(edge.targetId);
    if (!source || !target) return false;
    const start = { x: source.position.x + source.size.width / 2, y: source.position.y + source.size.height / 2 };
    const end = { x: target.position.x + target.size.width / 2, y: target.position.y + target.size.height / 2 };
    return samples.some((point) => distanceToSegment(point, start, end) <= radius);
  });
}

export function findNodesIntersectingEraser(
  nodes: BlueprintNode[],
  eraserPath: Array<{ x: number; y: number }>,
  radius: number,
): BlueprintNode[] {
  if (eraserPath.length === 0) return [];
  const samples = resamplePath(eraserPath, Math.max(2, radius / 2));
  return nodes.filter((node) =>
    samples.some(
      (point) =>
        point.x >= node.position.x - radius &&
        point.x <= node.position.x + node.size.width + radius &&
        point.y >= node.position.y - radius &&
        point.y <= node.position.y + node.size.height + radius,
    ),
  );
}

export function eraseStrokeSegments(
  strokes: InkStroke[],
  eraserPath: Array<{ x: number; y: number }>,
  radius: number,
  createId: () => string,
): StrokeReplacement[] {
  if (eraserPath.length === 0 || radius <= 0) return [];

  return strokes.flatMap((stroke) => {
    const samples = resampleStroke(stroke.points, Math.max(2, radius / 3));
    const keptSegments: InkPoint[][] = [];
    let current: InkPoint[] = [];

    for (const point of samples) {
      if (distanceToPath(point, eraserPath) <= radius) {
        if (current.length >= 2) keptSegments.push(current);
        current = [];
      } else {
        current.push(point);
      }
    }
    if (current.length >= 2) keptSegments.push(current);
    if (keptSegments.length === 1 && keptSegments[0]?.length === samples.length) return [];

    return [
      {
        sourceStrokeId: stroke.id,
        strokes: keptSegments.map((points) => ({
          ...stroke,
          id: createId(),
          points,
        })),
      },
    ];
  });
}

function resampleStroke(points: InkPoint[], spacing: number): InkPoint[] {
  if (points.length < 2) return points;
  const result: InkPoint[] = [points[0]!];
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]!;
    const end = points[index]!;
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(1, Math.ceil(distance / spacing));
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      result.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
        t: start.t + (end.t - start.t) * ratio,
        pressure: start.pressure + (end.pressure - start.pressure) * ratio,
      });
    }
  }
  return result;
}

function resamplePath(
  points: Array<{ x: number; y: number }>,
  spacing: number,
): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;
  const result = [points[0]!];
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]!;
    const end = points[index]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / spacing));
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      result.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      });
    }
  }
  return result;
}

function distanceToPath(
  point: { x: number; y: number },
  path: Array<{ x: number; y: number }>,
): number {
  if (path.length === 1) return Math.hypot(point.x - path[0]!.x, point.y - path[0]!.y);
  let closest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < path.length; index += 1) {
    closest = Math.min(closest, distanceToSegment(point, path[index - 1]!, path[index]!));
  }
  return closest;
}

function distanceToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const ratio = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
}
