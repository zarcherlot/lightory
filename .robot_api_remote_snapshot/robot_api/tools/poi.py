import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional


DEFAULT_POI_STORE_PATH = Path('/home/ubuntu/ros2_ws/src/robot_api/data/race_tracks.json')


TOOLS: List[Dict[str, Any]] = [
    {
        'name': 'poi.upsert',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Create or update a named point of interest in the map.',
        'inputSchema': {
            'type': 'object',
            'required': ['name', 'pose'],
            'properties': {
                'name': {'type': 'string'},
                'pose': {'type': 'object'},
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
    {
        'name': 'poi.get',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Read one named point of interest.',
        'inputSchema': {'type': 'object', 'required': ['name'], 'properties': {'name': {'type': 'string'}, 'trackId': {'type': 'string'}}, 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'poi.list',
        'version': '1.0.0',
        'category': 'race',
        'description': 'List saved points of interest.',
        'inputSchema': {'type': 'object', 'properties': {'trackId': {'type': 'string'}}, 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'poi.delete',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Delete one named point of interest.',
        'inputSchema': {'type': 'object', 'required': ['name'], 'properties': {'name': {'type': 'string'}, 'trackId': {'type': 'string'}}, 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'race.track.save',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Save a named race track from stored map points.',
        'inputSchema': {'type': 'object'},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'race.track.get',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Read a saved race track.',
        'inputSchema': {'type': 'object', 'required': ['trackId'], 'properties': {'trackId': {'type': 'string'}}, 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'race.track.list',
        'version': '1.0.0',
        'category': 'race',
        'description': 'List saved race tracks.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'race.track.clear',
        'version': '1.0.0',
        'category': 'race',
        'description': 'Clear a saved race track and its points.',
        'inputSchema': {'type': 'object', 'required': ['trackId'], 'properties': {'trackId': {'type': 'string'}}, 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
]


class POIStore:
    def __init__(self, path: Path = DEFAULT_POI_STORE_PATH) -> None:
        self.path = path

    def upsert_poi(self, name: str, pose: Dict[str, Any], track_id: str = 'default-abcd', map_id: str = 'map_01') -> Dict[str, Any]:
        validate_point_name(name)
        validate_map_pose(pose)
        data = self._load()
        track = self._ensure_track(data, track_id, map_id)
        now = now_iso()
        point = {'name': name, 'pose': pose, 'mapId': map_id, 'updatedAt': now}
        existing = track['points'].get(name)
        if existing is None:
            point['createdAt'] = now
        else:
            point['createdAt'] = existing.get('createdAt', now)
        track['points'][name] = point
        track['updatedAt'] = now
        self._save(data)
        return {'trackId': track_id, 'point': point}

    def get_poi(self, name: str, track_id: str = 'default-abcd') -> Dict[str, Any]:
        validate_point_name(name)
        track = self._load().get('tracks', {}).get(track_id)
        point = track.get('points', {}).get(name) if isinstance(track, dict) else None
        if point is None:
            raise ValueError(f'Point {name} is not recorded.')
        return {'trackId': track_id, 'point': point}

    def list_pois(self, track_id: str = 'default-abcd') -> Dict[str, Any]:
        track = self._load().get('tracks', {}).get(track_id) or {}
        points = track.get('points', {}) if isinstance(track, dict) else {}
        return {'trackId': track_id, 'points': [points[name] for name in sorted(points.keys())]}

    def delete_poi(self, name: str, track_id: str = 'default-abcd') -> Dict[str, Any]:
        validate_point_name(name)
        data = self._load()
        track = data.get('tracks', {}).get(track_id)
        deleted = False
        if isinstance(track, dict):
            deleted = track.get('points', {}).pop(name, None) is not None
            track['updatedAt'] = now_iso()
            self._save(data)
        return {'trackId': track_id, 'name': name, 'deleted': deleted}

    def save_track(self, track_id: str, name: str, point_names: List[str], map_id: str = 'map_01') -> Dict[str, Any]:
        if len(point_names) < 4 or len(set(point_names)) < 4:
            raise ValueError('A race track needs at least four unique points.')
        data = self._load()
        track = self._ensure_track(data, track_id, map_id)
        missing = [point for point in point_names if point not in track['points']]
        if missing:
            raise ValueError(f'Missing race points: {", ".join(missing)}.')
        validate_track_points_same_map(track, point_names, map_id)
        now = now_iso()
        track['name'] = name
        track['order'] = point_names
        track['mapId'] = map_id
        track['updatedAt'] = now
        self._save(data)
        return {'track': track}

    def get_track(self, track_id: str) -> Dict[str, Any]:
        track = self._load().get('tracks', {}).get(track_id)
        if not isinstance(track, dict):
            raise ValueError(f'Track {track_id} is not saved.')
        return {'track': track}

    def list_tracks(self) -> Dict[str, Any]:
        tracks = self._load().get('tracks', {})
        return {'tracks': [tracks[track_id] for track_id in sorted(tracks.keys())]}

    def clear_track(self, track_id: str) -> Dict[str, Any]:
        data = self._load()
        deleted = data.get('tracks', {}).pop(track_id, None) is not None
        self._save(data)
        return {'trackId': track_id, 'deleted': deleted}

    def _ensure_track(self, data: Dict[str, Any], track_id: str, map_id: str) -> Dict[str, Any]:
        tracks = data.setdefault('tracks', {})
        now = now_iso()
        track = tracks.get(track_id)
        if not isinstance(track, dict):
            track = {'trackId': track_id, 'name': track_id, 'mapId': map_id, 'points': {}, 'order': [], 'lastLapResults': [], 'createdAt': now}
            tracks[track_id] = track
        track.setdefault('points', {})
        track.setdefault('order', [])
        track.setdefault('lastLapResults', [])
        track.setdefault('createdAt', now)
        track.setdefault('mapId', map_id)
        return track

    def _load(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {'schemaVersion': 'race-poi-store/v1', 'tracks': {}}
        try:
            data = json.loads(self.path.read_text(encoding='utf-8'))
        except Exception:
            return {'schemaVersion': 'race-poi-store/v1', 'tracks': {}}
        if not isinstance(data, dict):
            return {'schemaVersion': 'race-poi-store/v1', 'tracks': {}}
        data.setdefault('schemaVersion', 'race-poi-store/v1')
        data.setdefault('tracks', {})
        return data

    def _save(self, data: Dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding='utf-8')


class POIToolHandlers:
    def __init__(self, store: POIStore) -> None:
        self.store = store

    async def execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        tool = step['tool']
        args = step.get('args') or {}
        if tool == 'poi.upsert':
            return self.store.upsert_poi(str(args['name']), args['pose'], str(args.get('trackId', 'default-abcd')), str(args.get('mapId', 'map_01')))
        if tool == 'poi.get':
            return self.store.get_poi(str(args['name']), str(args.get('trackId', 'default-abcd')))
        if tool == 'poi.list':
            return self.store.list_pois(str(args.get('trackId', 'default-abcd')))
        if tool == 'poi.delete':
            return self.store.delete_poi(str(args['name']), str(args.get('trackId', 'default-abcd')))
        if tool == 'race.track.save':
            return self.store.save_track(str(args.get('trackId', 'default-abcd')), str(args.get('name', 'ABCD timed race')), list(args.get('pointNames', ['A', 'B', 'C', 'D'])), str(args.get('mapId', 'map_01')))
        if tool == 'race.track.get':
            return self.store.get_track(str(args['trackId']))
        if tool == 'race.track.list':
            return self.store.list_tracks()
        if tool == 'race.track.clear':
            return self.store.clear_track(str(args['trackId']))
        raise ValueError(f'Unsupported tool {tool}')


def validate_map_pose(pose: Any) -> None:
    if not isinstance(pose, dict):
        raise ValueError('Pose must be an object.')
    if pose.get('frame') != 'map':
        raise ValueError('Race points must use frame "map".')
    for field in ('x', 'y', 'thetaRad'):
        value = pose.get(field)
        if not isinstance(value, (int, float)):
            raise ValueError(f'Pose {field} must be a number.')


def validate_point_name(name: str) -> None:
    if name not in {'A', 'B', 'C', 'D'}:
        raise ValueError('MVP race point name must be A, B, C, or D.')


def validate_track_points_same_map(track: Dict[str, Any], point_names: List[str], map_id: str) -> None:
    points = track.get('points') if isinstance(track.get('points'), dict) else {}
    mismatched = []
    for name in point_names:
        point = points.get(name)
        point_map_id = point.get('mapId') if isinstance(point, dict) else None
        if point_map_id != map_id:
            mismatched.append(f'{name}:{point_map_id or "missing"}')
    if mismatched:
        raise ValueError(f'Race track points must be recorded on the same map {map_id}: {", ".join(mismatched)}.')


def now_iso() -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
