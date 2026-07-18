from typing import Any, Dict, Optional


def check_front_stop(snapshot: Dict[str, Any], front_stop_distance_meters: float = 0.35) -> Dict[str, Any]:
    nearest_sector, nearest_distance = nearest_obstacle(snapshot)
    front_distance = sector_distance(snapshot, 'front')
    if front_distance is not None and front_distance <= front_stop_distance_meters:
        return {
            'ok': False,
            'nearestObstacleMeters': front_distance,
            'sector': 'front',
            'thresholdMeters': front_stop_distance_meters,
            'stopReason': 'front_obstacle_too_close',
        }
    return {
        'ok': True,
        'nearestObstacleMeters': nearest_distance,
        'sector': nearest_sector,
        'thresholdMeters': front_stop_distance_meters,
        'stopReason': None,
    }


def nearest_obstacle(snapshot: Dict[str, Any]) -> tuple[Optional[str], Optional[float]]:
    nearest_sector = None
    nearest_distance = None
    for sector in ('front', 'left', 'right'):
        distance = sector_distance(snapshot, sector)
        if distance is None:
            continue
        if nearest_distance is None or distance < nearest_distance:
            nearest_sector = sector
            nearest_distance = distance
    return nearest_sector, nearest_distance


def sector_distance(snapshot: Dict[str, Any], sector: str) -> Optional[float]:
    sector_data = snapshot.get(sector)
    if not isinstance(sector_data, dict):
        return None
    distance = sector_data.get('minDistanceMeters')
    return float(distance) if isinstance(distance, (int, float)) else None
