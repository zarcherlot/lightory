import type { InkPoint, InkStroke } from '../../domain/types.js';
import type { InkRecognitionRequest, InkRecognizer, RecognitionCandidate } from './types.js';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WebGeometryInkRecognizer implements InkRecognizer {
  async recognize(request: InkRecognitionRequest): Promise<RecognitionCandidate[]> {
    if (request.mode !== 'shape' || request.strokes.length === 0) return [];

    const arrow = recognizeArrow(request.requestId, request.strokes);
    if (arrow) return [arrow];

    if (request.strokes.length !== 1) return [unknownCandidate(request.requestId, request.strokes)];
    const stroke = request.strokes[0];
    if (!stroke || stroke.points.length < 2) return [];
    const candidate = recognizeSingleStroke(request.requestId, stroke);
    return candidate ? [candidate] : [unknownCandidate(request.requestId, request.strokes)];
  }
}

function recognizeSingleStroke(requestId: string, stroke: InkStroke): RecognitionCandidate | null {
  const bounds = getBounds(stroke.points);
  if (bounds.width < 8 && bounds.height < 8) return null;

  const pathLength = getPathLength(stroke.points);
  const directness = distance(stroke.points[0]!, stroke.points.at(-1)!) / pathLength;
  if (directness >= 0.96) {
    return {
      requestId,
      strokeIds: [stroke.id],
      kind: 'line',
      confidence: clamp(directness),
      bounds,
      line: { start: point(stroke.points[0]!), end: point(stroke.points.at(-1)!) },
    };
  }

  const closedness =
    distance(stroke.points[0]!, stroke.points.at(-1)!) / Math.max(bounds.width, bounds.height);
  if (closedness > 0.28) return null;

  const rectangleError =
    average(
      stroke.points.map((item) =>
        Math.min(
          Math.abs(item.x - bounds.x),
          Math.abs(item.x - (bounds.x + bounds.width)),
          Math.abs(item.y - bounds.y),
          Math.abs(item.y - (bounds.y + bounds.height)),
        ),
      ),
    ) / Math.max(1, Math.min(bounds.width, bounds.height));

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const rx = Math.max(1, bounds.width / 2);
  const ry = Math.max(1, bounds.height / 2);
  const ellipseError = average(
    stroke.points.map((item) =>
      Math.abs(Math.sqrt(((item.x - cx) / rx) ** 2 + ((item.y - cy) / ry) ** 2) - 1),
    ),
  );

  const rectangleConfidence = clamp(1 - rectangleError * 4 - closedness * 0.15);
  const ellipseConfidence = clamp(1 - ellipseError * 2 - closedness * 0.15);
  const kind = rectangleConfidence >= ellipseConfidence ? 'rectangle' : 'ellipse';
  const confidence = Math.max(rectangleConfidence, ellipseConfidence);
  if (confidence < 0.55) return null;

  return {
    requestId,
    strokeIds: [stroke.id],
    kind,
    confidence,
    bounds,
  };
}

function recognizeArrow(requestId: string, strokes: InkStroke[]): RecognitionCandidate | null {
  if (strokes.length < 2 || strokes.length > 3) return null;
  const ranked = strokes
    .map((stroke) => ({ stroke, length: getPathLength(stroke.points) }))
    .sort((a, b) => b.length - a.length);
  const shaft = ranked[0]?.stroke;
  if (!shaft || shaft.points.length < 2) return null;
  const start = shaft.points[0]!;
  const end = shaft.points.at(-1)!;
  if (distance(start, end) / getPathLength(shaft.points) < 0.92) return null;

  const heads = ranked.slice(1).map(({ stroke }) => stroke);
  const threshold = Math.max(18, Math.min(50, getPathLength(shaft.points) * 0.25));
  const startMatches = heads.filter((stroke) => endpointNear(stroke, start, threshold)).length;
  const endMatches = heads.filter((stroke) => endpointNear(stroke, end, threshold)).length;
  const tip = endMatches >= startMatches ? end : start;
  const tail = tip === end ? start : end;
  if (Math.max(startMatches, endMatches) !== heads.length) return null;

  return {
    requestId,
    strokeIds: strokes.map(({ id }) => id),
    kind: 'arrow',
    confidence: heads.length === 2 ? 0.93 : 0.87,
    bounds: getBounds(strokes.flatMap(({ points }) => points)),
    line: { start: point(tail), end: point(tip) },
  };
}

function endpointNear(stroke: InkStroke, target: InkPoint, threshold: number): boolean {
  const first = stroke.points[0];
  const last = stroke.points.at(-1);
  return Boolean(
    first && last && Math.min(distance(first, target), distance(last, target)) <= threshold,
  );
}

function unknownCandidate(requestId: string, strokes: InkStroke[]): RecognitionCandidate {
  return {
    requestId,
    strokeIds: strokes.map(({ id }) => id),
    kind: 'unknown',
    confidence: 0,
    bounds: getBounds(strokes.flatMap(({ points }) => points)),
  };
}

function getBounds(points: InkPoint[]): Bounds {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getPathLength(points: InkPoint[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distance(points[index - 1]!, points[index]!);
  }
  return Math.max(length, 0.001);
}

function distance(a: InkPoint, b: InkPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function point(value: InkPoint): { x: number; y: number } {
  return { x: value.x, y: value.y };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
