from typing import Any, Dict, List

from ..race.controller import DEFAULT_SAFETY, DEFAULT_STRATEGY, RaceController
from ..race.geometry import preview_route, route_points
from .poi import POIStore


TOOLS: List[Dict[str, Any]] = [
    {
        'name': 'race.status',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Read current race controller status and last result.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'race.previewLap',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Preview the A-B-C-D-A lap geometry from saved map points.',
        'inputSchema': {'type': 'object'},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'race.runLap',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Run one timed A-B-C-D-A lap using continuous lookahead control.',
        'inputSchema': {
            'type': 'object',
            'required': ['trackId'],
            'properties': {
                'trackId': {'type': 'string', 'default': 'default-abcd'},
                'mapId': {'type': 'string'},
                'order': {'type': 'array', 'items': {'type': 'string'}},
                'strategy': {'type': 'object'},
                'safety': {'type': 'object'},
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'high',
        'requiresConfirmation': True,
        'requiresLease': 'base',
        'timeoutMs': 120000,
    },
    {
        'name': 'race.stop',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Stop the active race and publish repeated zero velocity.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'critical',
        'requiresConfirmation': False,
        'requiresLease': 'base',
        'timeoutMs': 1000,
    },
]


class RaceToolHandlers:
    def __init__(self, ros: Any, poi_store: POIStore) -> None:
        self.ros = ros
        self.poi_store = poi_store
        self.controller = RaceController(ros)

    async def execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        tool = step['tool']
        args = step.get('args') or {}
        if tool == 'race.status':
            return self.status()
        if tool == 'race.previewLap':
            return self.preview_lap(args)
        if tool == 'race.runLap':
            return await self.run_lap(args)
        if tool == 'race.stop':
            self.controller.request_stop()
            await self.ros.publish_stop()
            return {'stopped': True, 'status': self.status()}
        raise ValueError(f'Unsupported tool {tool}')

    def status(self) -> Dict[str, Any]:
        return {'controller': self.controller.status, 'lastResult': self.controller.last_result}

    def preview_lap(self, args: Dict[str, Any]) -> Dict[str, Any]:
        track_id = str(args.get('trackId', 'default-abcd'))
        order = list(args.get('order', ['A', 'B', 'C', 'D', 'A']))
        track = self.poi_store.get_track(track_id)['track']
        validate_track_map(track, order, args.get('mapId'))
        route = preview_route(track['points'], order)
        return {
            'trackId': track_id,
            'route': route,
            'strategy': {**DEFAULT_STRATEGY, **(args.get('strategy') or {})},
            'childSummary': f"这条路线会按 {'-'.join(order)} 跑一圈，小车会提前看向下一个点，弯道会自动慢一点。",
        }

    async def run_lap(self, args: Dict[str, Any]) -> Dict[str, Any]:
        track_id = str(args.get('trackId', 'default-abcd'))
        order = list(args.get('order', ['A', 'B', 'C', 'D', 'A']))
        track = self.poi_store.get_track(track_id)['track']
        validate_track_map(track, order, args.get('mapId'))
        route = route_points(track['points'], order)
        return await self.controller.run_lap(
            track_id,
            route,
            {**DEFAULT_STRATEGY, **(args.get('strategy') or {})},
            {**DEFAULT_SAFETY, **(args.get('safety') or {})},
        )


def validate_track_map(track: Dict[str, Any], order: List[str], requested_map_id: Any = None) -> None:
    track_map_id = track.get('mapId')
    if requested_map_id is not None and str(requested_map_id) != str(track_map_id):
        raise ValueError(f'Race track map mismatch: requested {requested_map_id}, saved {track_map_id}.')
    points = track.get('points') if isinstance(track.get('points'), dict) else {}
    mismatched = []
    for name in order[:-1]:
        point = points.get(name)
        point_map_id = point.get('mapId') if isinstance(point, dict) else None
        if point_map_id != track_map_id:
            mismatched.append(f'{name}:{point_map_id or "missing"}')
    if mismatched:
        raise ValueError(f'Race track points must be recorded on the same map {track_map_id}: {", ".join(mismatched)}.')
