import socket
import time
import uuid
from typing import Any, Dict, Optional

from .schemas import ROBOT_ID, SOFTWARE_VERSION


def make_envelope(
    request_id_value: str,
    ok: bool,
    status: str,
    message: str,
    data: Any,
    error: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now = now_iso()
    return {
        'schemaVersion': 'robot-api/v1',
        'ok': ok,
        'requestId': request_id_value,
        'status': status,
        'message': message,
        'data': data,
        'error': error,
        'timing': {'startedAt': now, 'endedAt': now, 'durationMs': 0},
        'robot': {'robotId': ROBOT_ID, 'hostname': socket.gethostname(), 'softwareVersion': SOFTWARE_VERSION},
    }


def request_id(request: Any) -> str:
    return request.headers.get('X-Request-Id') or request.query.get('requestId') or str(uuid.uuid4())


def now_iso() -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())

