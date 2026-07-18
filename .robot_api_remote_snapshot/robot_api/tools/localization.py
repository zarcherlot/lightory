import math
import time
from typing import Any, Dict, List

from .poi import POIStore


TOOLS: List[Dict[str, Any]] = [
    {
        'name': 'localization.health',
        'version': '1.0.0',
        'category': 'localization',
        'description': 'Report whether AMCL/map localization signals appear usable.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'localization.setInitialPose',
        'version': '1.0.0',
        'category': 'localization',
        'description': 'Set the AMCL initial pose in map frame.',
        'inputSchema': {
            'type': 'object',
            'required': ['pose'],
            'properties': {
                'pose': {'type': 'object'},
                'covariancePreset': {'type': 'string', 'enum': ['confident', 'normal']},
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'high',
        'requiresConfirmation': True,
        'timeoutMs': 1000,
    },
    {
        'name': 'localization.state',
        'version': '1.0.0',
        'category': 'localization',
        'description': 'Read the current robot pose in map frame.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'localization.recordCurrentPose',
        'version': '1.0.0',
        'category': 'localization',
        'description': 'Record the current map pose as race point A, B, C, or D.',
        'inputSchema': {
            'type': 'object',
            'required': ['name'],
            'properties': {
                'name': {'type': 'string'},
                'trackId': {'type': 'string'},
                'mapId': {'type': 'string'},
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
]


class LocalizationToolHandlers:
    def __init__(self, ros: Any, poi_store: POIStore) -> None:
        self.ros = ros
        self.poi_store = poi_store

    async def execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        tool = step['tool']
        args = step.get('args') or {}
        if tool == 'localization.health':
            return self.ros.localization_health()
        if tool == 'localization.setInitialPose':
            pose = normalize_pose(args.get('pose'))
            preset = str(args.get('covariancePreset', 'normal'))
            self.ros.publish_initial_pose(pose, preset)
            return {'set': True, 'pose': pose, 'covariancePreset': preset}
        if tool == 'localization.state':
            return {'pose': self.ros.lookup_map_pose(), 'status': 'localized'}
        if tool == 'localization.recordCurrentPose':
            pose = self.ros.lookup_map_pose()
            return self.poi_store.upsert_poi(
                str(args['name']),
                pose,
                str(args.get('trackId', 'default-abcd')),
                str(args.get('mapId', 'map_01')),
            )
        raise ValueError(f'Unsupported tool {tool}')


def normalize_pose(raw: Any) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError('pose must be an object.')
    frame = raw.get('frame', 'map')
    if frame != 'map':
        raise ValueError('localization pose must use frame "map".')
    return {
        'frame': 'map',
        'x': require_number(raw.get('x'), 'x'),
        'y': require_number(raw.get('y'), 'y'),
        'thetaRad': normalize_angle(require_number(raw.get('thetaRad'), 'thetaRad')),
        'recordedAt': raw.get('recordedAt') or now_iso(),
    }


def require_number(value: Any, field: str) -> float:
    if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        raise ValueError(f'pose.{field} must be a finite number.')
    return float(value)


def normalize_angle(value: float) -> float:
    return math.atan2(math.sin(value), math.cos(value))


def now_iso() -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
