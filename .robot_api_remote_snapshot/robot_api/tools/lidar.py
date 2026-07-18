import math
from typing import Any, Dict, Iterable, List, Optional

from ..race.safety import check_front_stop


TOOLS: List[Dict[str, Any]] = [
    {
        'name': 'lidar.snapshot',
        'version': '1.0.0',
        'category': 'safety',
        'description': 'Read front/left/right lidar sector minimum distances.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'lidar.checkSafety',
        'version': '1.0.0',
        'category': 'safety',
        'description': 'Check whether the front lidar sector is safe for race motion.',
        'inputSchema': {
            'type': 'object',
            'properties': {'frontStopDistanceMeters': {'type': 'number'}},
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
]


class LidarToolHandlers:
    def __init__(self, ros: Any) -> None:
        self.ros = ros

    async def execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        tool = step['tool']
        args = step.get('args') or {}
        if tool == 'lidar.snapshot':
            return self.ros.lidar_snapshot()
        if tool == 'lidar.checkSafety':
            return check_front_stop(
                self.ros.lidar_snapshot(),
                float(args.get('frontStopDistanceMeters', 0.35)),
            )
        raise ValueError(f'Unsupported tool {tool}')


def compute_lidar_snapshot(scan: Dict[str, Any]) -> Dict[str, Any]:
    ranges = scan.get('ranges')
    if not isinstance(ranges, list):
        raise RuntimeError('No lidar scan is available.')
    angle_min = float(scan.get('angleMin', 0.0))
    angle_increment = float(scan.get('angleIncrement', 0.0))
    if angle_increment == 0:
        raise RuntimeError('Lidar scan angle increment is invalid.')
    range_min = float(scan.get('rangeMin', 0.0))
    range_max = float(scan.get('rangeMax', float('inf')))
    sectors = {
        'front': (-math.radians(20), math.radians(20)),
        'left': (math.radians(35), math.radians(85)),
        'right': (-math.radians(85), -math.radians(35)),
    }
    return {
        'frameId': scan.get('frameId'),
        'receivedAt': scan.get('receivedAt'),
        'scanAgeMs': scan.get('scanAgeMs'),
        'front': sector_summary(ranges, angle_min, angle_increment, range_min, range_max, sectors['front']),
        'left': sector_summary(ranges, angle_min, angle_increment, range_min, range_max, sectors['left']),
        'right': sector_summary(ranges, angle_min, angle_increment, range_min, range_max, sectors['right']),
    }


def sector_summary(
    ranges: List[Any],
    angle_min: float,
    angle_increment: float,
    range_min: float,
    range_max: float,
    bounds: tuple[float, float],
) -> Dict[str, Any]:
    values = valid_sector_values(ranges, angle_min, angle_increment, range_min, range_max, bounds)
    return {
        'minDistanceMeters': min(values) if values else None,
        'sampleCount': len(values),
        'angleMinRad': bounds[0],
        'angleMaxRad': bounds[1],
    }


def valid_sector_values(
    ranges: List[Any],
    angle_min: float,
    angle_increment: float,
    range_min: float,
    range_max: float,
    bounds: tuple[float, float],
) -> List[float]:
    low, high = bounds
    values = []
    for index, raw in enumerate(ranges):
        if not isinstance(raw, (int, float)):
            continue
        value = float(raw)
        if not math.isfinite(value) or value == 0.0 or value < range_min or value > range_max:
            continue
        angle = normalize_angle(angle_min + index * angle_increment)
        if angle_in_bounds(angle, low, high):
            values.append(value)
    return values


def angle_in_bounds(angle: float, low: float, high: float) -> bool:
    return low <= angle <= high


def normalize_angle(angle: float) -> float:
    return math.atan2(math.sin(angle), math.cos(angle))
