import math
from typing import Any, Optional


def as_number(value: Any) -> Optional[float]:
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    return None


def clamp(value: float, low: float, high: float) -> float:
    return min(max(value, low), high)


def shortest_angle_delta(start: float, current: float) -> float:
    return math.atan2(math.sin(current - start), math.cos(current - start))
