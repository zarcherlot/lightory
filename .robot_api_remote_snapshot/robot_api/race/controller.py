import asyncio
import math
import time
from typing import Any, Dict, List

from .geometry import distance, heading, heading_error, lookahead_target
from .safety import check_front_stop
from .timing import RaceTimer


DEFAULT_STRATEGY = {
    'name': 'baseline',
    'maxSpeedMps': 0.25,
    'minTurnSpeedMps': 0.08,
    'lookaheadMeters': 0.35,
    'waypointRadiusMeters': 0.18,
    'finishRadiusMeters': 0.22,
}

DEFAULT_SAFETY = {
    'frontStopDistanceMeters': 0.35,
    'maxDurationMs': 120000,
}


class RaceController:
    def __init__(self, ros: Any) -> None:
        self.ros = ros
        self.stop_requested = False
        self.active = False
        self.status: Dict[str, Any] = {'active': False, 'state': 'idle'}
        self.last_result: Dict[str, Any] | None = None

    def request_stop(self) -> None:
        self.stop_requested = True

    async def run_lap(
        self,
        track_id: str,
        route: List[Dict[str, Any]],
        strategy: Dict[str, Any],
        safety: Dict[str, Any],
    ) -> Dict[str, Any]:
        merged_strategy = {**DEFAULT_STRATEGY, **(strategy or {})}
        merged_safety = {**DEFAULT_SAFETY, **(safety or {})}
        self.stop_requested = False
        self.active = True
        timer = RaceTimer()
        segment_index = 0
        visited: List[str] = []
        safety_events: List[Dict[str, Any]] = []
        waypoint_arrival_radius = max(
            float(merged_strategy['waypointRadiusMeters']),
            float(merged_strategy['lookaheadMeters']),
        )
        self.status = {'active': True, 'state': 'running', 'trackId': track_id, 'currentTarget': route[1]['name']}
        try:
            while timer.elapsed_ms() < int(merged_safety['maxDurationMs']):
                if self.stop_requested:
                    return self._finish(track_id, 'stopped', timer.elapsed_ms(), visited, 'stop_requested', safety_events)
                snapshot = self.ros.lidar_snapshot()
                safety_check = check_front_stop(snapshot, float(merged_safety['frontStopDistanceMeters']))
                if not safety_check['ok']:
                    safety_events.append(safety_check)
                    return self._finish(track_id, 'stopped', timer.elapsed_ms(), visited, safety_check['stopReason'], safety_events)
                pose = self.ros.lookup_map_pose()
                segment_index = advance_visited_waypoints(
                    pose,
                    route,
                    segment_index,
                    visited,
                    waypoint_arrival_radius,
                )
                if has_completed_lap(pose, route, segment_index, float(merged_strategy['finishRadiusMeters'])):
                    return self._finish(track_id, 'done', timer.elapsed_ms(), visited, 'finished', safety_events)
                target = lookahead_target(pose, route, segment_index, float(merged_strategy['lookaheadMeters']))
                command = compute_velocity_command(pose, target['point'], merged_strategy)
                self.ros.publish_velocity(command['linearX'], command['angularZ'])
                next_point = route[min(segment_index + 1, len(route) - 1)]
                self.status = {
                    'active': True,
                    'state': 'running',
                    'trackId': track_id,
                    'currentTarget': next_point['name'],
                    'elapsedMs': timer.elapsed_ms(),
                    'command': command,
                }
                await asyncio.sleep(0.1)
            return self._finish(track_id, 'stopped', timer.elapsed_ms(), visited, 'timeout', safety_events)
        finally:
            await self.ros.publish_stop()
            self.active = False

    def _finish(
        self,
        track_id: str,
        status: str,
        elapsed_ms: int,
        visited: List[str],
        stop_reason: str,
        safety_events: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        result = {
            'trackId': track_id,
            'status': status,
            'elapsedMs': elapsed_ms,
            'segments': [{'to': name} for name in visited],
            'stopReason': stop_reason,
            'safetyEvents': safety_events,
        }
        self.last_result = result
        self.status = {'active': False, 'state': status, 'trackId': track_id, 'lastResult': result}
        return result


def compute_velocity_command(
    pose: Dict[str, float],
    target: Dict[str, float],
    strategy: Dict[str, Any],
) -> Dict[str, float]:
    target_heading = heading(pose, target)
    error = heading_error(float(pose['thetaRad']), target_heading)
    max_speed = float(strategy.get('maxSpeedMps', DEFAULT_STRATEGY['maxSpeedMps']))
    min_speed = float(strategy.get('minTurnSpeedMps', DEFAULT_STRATEGY['minTurnSpeedMps']))
    turn_ratio = min(abs(error) / (math.pi / 2.0), 1.0)
    linear = max(min_speed, max_speed * (1.0 - 0.75 * turn_ratio))
    angular = max(min(error * 1.8, 0.785398), -0.785398)
    return {'linearX': round(linear, 4), 'angularZ': round(angular, 4), 'headingErrorRad': error}


def advance_visited_waypoints(
    pose: Dict[str, float],
    route: List[Dict[str, Any]],
    segment_index: int,
    visited: List[str],
    waypoint_radius_meters: float,
) -> int:
    while segment_index < len(route) - 2:
        next_point = route[segment_index + 1]
        if distance(pose, next_point) > waypoint_radius_meters:
            break
        if next_point['name'] not in visited:
            visited.append(next_point['name'])
        segment_index += 1
    return segment_index


def has_completed_lap(
    pose: Dict[str, float],
    route: List[Dict[str, Any]],
    segment_index: int,
    finish_radius_meters: float,
) -> bool:
    return segment_index >= len(route) - 2 and distance(pose, route[-1]) <= finish_radius_meters
