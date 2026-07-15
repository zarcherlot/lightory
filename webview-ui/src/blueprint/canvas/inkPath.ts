import { getStroke } from 'perfect-freehand';

import type { InkPoint } from '../domain/types.js';

export function getInkSvgPath(points: InkPoint[], complete = true): string {
  const outline = getStroke(
    points.map(({ x, y, pressure }) => [x, y, pressure]),
    {
      size: 5,
      thinning: 0.45,
      smoothing: 0.55,
      streamline: 0.4,
      simulatePressure: false,
      last: complete,
    },
  );
  return getSvgPathFromStroke(outline);
}

function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 4) return '';
  const average = (a: number[], b: number[]) => [(a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2];
  let current = points[0]!;
  let next = points[1]!;
  const third = points[2]!;
  const start = average(next, third);
  let path = `M${current[0]!.toFixed(2)},${current[1]!.toFixed(2)} Q${next[0]!.toFixed(2)},${next[1]!.toFixed(2)} ${start[0]!.toFixed(2)},${start[1]!.toFixed(2)} T`;

  for (let index = 2; index < points.length - 1; index += 1) {
    current = points[index]!;
    next = points[index + 1]!;
    const midpoint = average(current, next);
    path += `${midpoint[0]!.toFixed(2)},${midpoint[1]!.toFixed(2)} `;
  }
  return `${path}Z`;
}
