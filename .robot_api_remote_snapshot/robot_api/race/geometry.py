import math
from typing import Any, Dict, List


def preview_route(points: Dict[str, Dict[str, Any]], order: List[str]) -> Dict[str, Any]:
    route = route_points(points, order)
    segments = []
    total = 0.0
    for index in range(len(route) - 1):
        start = route[index]
        end = route[index + 1]
        length = distance(start, end)
        total += length
        segments.append({
            'from': start['name'],
            'to': end['name'],
            'distanceMeters': round(length, 4),
            'headingRad': heading(start, end),
        })
    return {'order': order, 'segments': segments, 'totalDistanceMeters': round(total, 4)}


def route_points(points: Dict[str, Dict[str, Any]], order: List[str]) -> List[Dict[str, Any]]:
    route = []
    for name in order:
        point = points.get(name)
        if not isinstance(point, dict):
            raise ValueError(f'Missing race point {name}.')
        pose = point.get('pose') if isinstance(point.get('pose'), dict) else point
        if pose.get('frame') != 'map':
            raise ValueError(f'Race point {name} must use map frame.')
        route.append({'name': name, 'x': float(pose['x']), 'y': float(pose['y']), 'thetaRad': float(pose.get('thetaRad', 0.0))})
    return route


def lookahead_target(
    pose: Dict[str, float],
    route: List[Dict[str, Any]],
    current_segment_index: int,
    lookahead_meters: float,
) -> Dict[str, Any]:
    segment_index = min(current_segment_index, len(route) - 2)
    start = route[segment_index]
    end = route[segment_index + 1]
    projection = project_fraction(pose, start, end)
    remaining = lookahead_meters + projection * distance(start, end)
    for index in range(segment_index, len(route) - 1):
        seg_start = route[index]
        seg_end = route[index + 1]
        seg_len = distance(seg_start, seg_end)
        if seg_len == 0:
            continue
        if remaining <= seg_len or index == len(route) - 2:
            fraction = min(max(remaining / seg_len, 0.0), 1.0)
            return {
                'segmentIndex': index,
                'point': {
                    'x': seg_start['x'] + (seg_end['x'] - seg_start['x']) * fraction,
                    'y': seg_start['y'] + (seg_end['y'] - seg_start['y']) * fraction,
                },
            }
        remaining -= seg_len
    final = route[-1]
    return {'segmentIndex': len(route) - 2, 'point': {'x': final['x'], 'y': final['y']}}


def project_fraction(point: Dict[str, float], start: Dict[str, Any], end: Dict[str, Any]) -> float:
    dx = end['x'] - start['x']
    dy = end['y'] - start['y']
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return 0.0
    raw = ((point['x'] - start['x']) * dx + (point['y'] - start['y']) * dy) / length_sq
    return min(max(raw, 0.0), 1.0)


def distance(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    return math.hypot(float(b['x']) - float(a['x']), float(b['y']) - float(a['y']))


def heading(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    return math.atan2(float(b['y']) - float(a['y']), float(b['x']) - float(a['x']))


def heading_error(current_theta: float, target_heading: float) -> float:
    return math.atan2(math.sin(target_heading - current_theta), math.cos(target_heading - current_theta))
