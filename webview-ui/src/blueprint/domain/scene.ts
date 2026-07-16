import type { SceneDefinition, SceneEntity } from './types.js';

export const DEFAULT_SCENE_WIDTH_METERS = 8;
export const DEFAULT_SCENE_HEIGHT_METERS = 6;
export const DEFAULT_SCENE_GRID_METERS = 0.5;

export function createEmptySceneDefinition(): SceneDefinition {
  return {
    schemaVersion: 'lightory-scene/v1',
    widthMeters: DEFAULT_SCENE_WIDTH_METERS,
    heightMeters: DEFAULT_SCENE_HEIGHT_METERS,
    gridSizeMeters: DEFAULT_SCENE_GRID_METERS,
    entities: [],
  };
}

export function clampSceneEntity(
  scene: SceneDefinition,
  entity: SceneEntity,
): SceneEntity {
  const width = Math.min(Math.max(entity.size.width, 0.25), scene.widthMeters);
  const height = Math.min(Math.max(entity.size.height, 0.25), scene.heightMeters);
  return {
    ...entity,
    position: {
      x: clamp(entity.position.x, 0, scene.widthMeters - width),
      y: clamp(entity.position.y, 0, scene.heightMeters - height),
    },
    size: { width, height },
    rotation: normalizeDegrees(entity.rotation),
  };
}

export function snapSceneValue(value: number, increment = 0.25): number {
  return Number((Math.round(value / increment) * increment).toFixed(2));
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
