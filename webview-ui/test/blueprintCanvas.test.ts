import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  eraseStrokeSegments,
  findNodesIntersectingEraser,
} from '../src/blueprint/canvas/eraseStrokes.js';
import {
  projectBlueprintToFlow,
  toBlueprintPosition,
} from '../src/blueprint/canvas/flowProjection.js';
import { WebGeometryInkRecognizer } from '../src/blueprint/canvas/recognition/webGeometryInkRecognizer.js';
import { createEmptyBlueprintDocument } from '../src/blueprint/domain/document.js';
import type { BlueprintNode, InkPoint, InkStroke } from '../src/blueprint/domain/types.js';

const recognizer = new WebGeometryInkRecognizer();

test('recognizes a hand-drawn rectangle without mutating the blueprint', async () => {
  const stroke = makeStroke('rectangle', [
    ...line(20, 20, 220, 20, 10),
    ...line(220, 20, 220, 140, 7).slice(1),
    ...line(220, 140, 20, 140, 10).slice(1),
    ...line(20, 140, 20, 20, 7).slice(1),
  ]);

  const candidates = await recognizer.recognize({
    requestId: 'request-1',
    strokes: [stroke],
    mode: 'shape',
  });

  assert.equal(candidates[0]?.kind, 'rectangle');
  assert.equal((candidates[0]?.confidence ?? 0) >= 0.85, true);
  assert.deepEqual(candidates[0]?.strokeIds, ['rectangle']);
});

test('recognizes an ellipse and a two-stroke arrow', async () => {
  const ellipsePoints = Array.from({ length: 33 }, (_, index) => {
    const angle = (index / 32) * Math.PI * 2;
    return point(180 + Math.cos(angle) * 90, 130 + Math.sin(angle) * 55, index);
  });
  const ellipse = await recognizer.recognize({
    requestId: 'ellipse-request',
    strokes: [makeStroke('ellipse', ellipsePoints)],
    mode: 'shape',
  });
  assert.equal(ellipse[0]?.kind, 'ellipse');

  const arrow = await recognizer.recognize({
    requestId: 'arrow-request',
    strokes: [
      makeStroke('shaft', line(40, 80, 220, 80, 12)),
      makeStroke('head', [point(185, 55, 0), point(220, 80, 1), point(185, 105, 2)]),
    ],
    mode: 'shape',
  });
  assert.equal(arrow[0]?.kind, 'arrow');
  assert.deepEqual(arrow[0]?.line, { start: { x: 40, y: 80 }, end: { x: 220, y: 80 } });
});

test('returns a manual-conversion candidate when geometry confidence is too low', async () => {
  const candidate = await recognizer.recognize({
    requestId: 'unknown-request',
    strokes: [
      makeStroke('wobbly', [
        point(10, 10, 0),
        point(70, 40, 1),
        point(30, 90, 2),
        point(100, 120, 3),
      ]),
    ],
    mode: 'shape',
  });

  assert.equal(candidate[0]?.kind, 'unknown');
  assert.deepEqual(candidate[0]?.strokeIds, ['wobbly']);
  assert.ok(candidate[0]?.bounds);
});

test('projects containers before children and converts child drag positions', () => {
  const container = makeNode('system', 'container', 100, 80, 500, 320);
  const child = { ...makeNode('move', 'function', 180, 150, 160, 100), parentId: 'system' };
  const document = { ...createEmptyBlueprintDocument(), nodes: [child, container] };

  const projection = projectBlueprintToFlow(document);
  assert.deepEqual(
    projection.nodes.map(({ id }) => id),
    ['system', 'move'],
  );
  assert.deepEqual(projection.nodes[1]?.position, { x: 80, y: 70 });
  assert.deepEqual(toBlueprintPosition('move', { x: 120, y: 90 }, document), {
    x: 220,
    y: 170,
  });
});

test('eraser splits only the crossed part of an ink stroke', () => {
  let sequence = 0;
  const replacements = eraseStrokeSegments(
    [makeStroke('original', line(0, 50, 200, 50, 2))],
    [point(100, 30, 0), point(100, 70, 1)],
    16,
    () => `fragment-${(sequence += 1)}`,
  );

  assert.equal(replacements.length, 1);
  assert.equal(replacements[0]?.sourceStrokeId, 'original');
  assert.equal(replacements[0]?.strokes.length, 2);
  assert.ok((replacements[0]?.strokes[0]?.points.at(-1)?.x ?? 100) < 100);
  assert.ok((replacements[0]?.strokes[1]?.points[0]?.x ?? 100) > 100);
});

test('eraser detects a recognized module crossed by the gesture', () => {
  const module = makeNode('move', 'function', 100, 100, 180, 120);
  const untouched = makeNode('voice', 'function', 400, 100, 180, 120);
  const matches = findNodesIntersectingEraser(
    [module, untouched],
    [point(60, 160, 0), point(320, 160, 1)],
    20,
  );

  assert.deepEqual(
    matches.map(({ id }) => id),
    ['move'],
  );
});

function makeNode(
  id: string,
  kind: BlueprintNode['kind'],
  x: number,
  y: number,
  width: number,
  height: number,
): BlueprintNode {
  return {
    id,
    kind,
    label: id,
    position: { x, y },
    size: { width, height },
    sourceStrokeIds: [],
    recognition: { source: 'manual' },
  };
}

function makeStroke(id: string, points: InkPoint[]): InkStroke {
  return { id, points, pointerKind: 'mouse', createdAt: 1 };
}

function line(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  segments: number,
): InkPoint[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const ratio = index / segments;
    return point(startX + (endX - startX) * ratio, startY + (endY - startY) * ratio, index);
  });
}

function point(x: number, y: number, t: number): InkPoint {
  return { x, y, t, pressure: 0.5 };
}
