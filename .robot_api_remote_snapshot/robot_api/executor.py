import asyncio
import json
from typing import Any, Dict, Optional

from aiohttp import WSMsgType, web

from .envelope import make_envelope, now_iso, request_id
from .registry import DEFAULT_REGISTRY
from .schemas import ROBOT_ID, SOFTWARE_VERSION
from .tools.base import BaseToolHandlers
from .tools.lidar import LidarToolHandlers
from .tools.localization import LocalizationToolHandlers
from .tools.poi import POIStore, POIToolHandlers
from .tools.race import RaceToolHandlers
from .validator import create_plan_state, mark_pending_skipped, validate_plan


class RobotApiService:
    def __init__(self, ros: Any) -> None:
        self.ros = ros
        self.plans: Dict[str, Dict[str, Any]] = {}
        self.current_task: Optional[asyncio.Task[Any]] = None
        self.current_plan_id: Optional[str] = None
        self.event_seq = 0
        self.ws_clients: set[web.WebSocketResponse] = set()
        self.video_stream: Optional[Dict[str, Any]] = None
        self.poi_store = POIStore()
        self.base_tools = BaseToolHandlers(ros)
        self.lidar_tools = LidarToolHandlers(ros)
        self.localization_tools = LocalizationToolHandlers(ros, self.poi_store)
        self.poi_tools = POIToolHandlers(self.poi_store)
        self.race_tools = RaceToolHandlers(ros, self.poi_store)

    def app(self) -> web.Application:
        app = web.Application(middlewares=[cors_middleware])
        app.router.add_get('/api/health', self.handle_health)
        app.router.add_get('/api/tools', self.handle_tools)
        app.router.add_get('/api/tools/{tool_name}', self.handle_tool)
        app.router.add_post('/api/plans/validate', self.handle_validate)
        app.router.add_post('/api/plans', self.handle_submit)
        app.router.add_post('/api/plans/{plan_id}/execute', self.handle_execute)
        app.router.add_post('/api/plans/{plan_id}/stop', self.handle_stop_plan)
        app.router.add_get('/api/plans/{plan_id}', self.handle_get_plan)
        app.router.add_post('/api/watchdog/stop-all', self.handle_stop_all)
        app.router.add_get('/api/events', self.handle_events)
        app.router.add_post('/api/video/start', self.handle_video_start)
        app.router.add_post('/api/video/stop', self.handle_video_stop)
        app.router.add_get('/api/video/state', self.handle_video_state)
        app.router.add_route('OPTIONS', '/{tail:.*}', self.handle_options)
        return app

    async def handle_options(self, request: web.Request) -> web.Response:
        return web.Response(status=204)

    async def handle_health(self, request: web.Request) -> web.Response:
        return self.ok(request, {'ok': True, 'robotId': ROBOT_ID, 'softwareVersion': SOFTWARE_VERSION})

    async def handle_tools(self, request: web.Request) -> web.Response:
        return self.ok(request, DEFAULT_REGISTRY.list_tools())

    async def handle_tool(self, request: web.Request) -> web.Response:
        tool = DEFAULT_REGISTRY.get(request.match_info['tool_name'])
        if tool is None:
            return self.fail(request, 'tool_not_found', 'Robot tool is unavailable.', 404)
        return self.ok(request, tool)

    async def handle_validate(self, request: web.Request) -> web.Response:
        plan = await read_json(request)
        return self.ok(request, self.validate_plan(plan))

    async def handle_submit(self, request: web.Request) -> web.Response:
        plan = await read_json(request)
        validation = self.validate_plan(plan)
        if not validation['ok']:
            return self.ok(request, validation)
        state = create_plan_state(plan)
        self.plans[plan['planId']] = {'plan': plan, 'state': state}
        await self.emit({'type': 'plan.accepted', 'planId': plan['planId']})
        return self.ok(request, state, status='accepted', message='plan accepted')

    async def handle_execute(self, request: web.Request) -> web.Response:
        plan_id = request.match_info['plan_id']
        record = self.plans.get(plan_id)
        if record is None:
            return self.fail(request, 'plan_not_found', 'Plan not found.', 404)
        if self.current_task is not None and not self.current_task.done():
            return self.fail(request, 'base_busy', 'Another plan is running.', 409, api_status='blocked')
        self.current_plan_id = plan_id
        self.current_task = asyncio.create_task(self.execute_plan(record['plan'], record['state']))
        return self.ok(request, record['state'], status='running', message='plan running')

    async def handle_stop_plan(self, request: web.Request) -> web.Response:
        plan_id = request.match_info['plan_id']
        record = self.plans.get(plan_id)
        if record is None:
            return self.fail(request, 'plan_not_found', 'Plan not found.', 404)
        await self.stop_active_plan(plan_id, 'plan stop requested')
        return self.ok(request, record['state'], status='cancelled', message='plan stopped')

    async def handle_get_plan(self, request: web.Request) -> web.Response:
        record = self.plans.get(request.match_info['plan_id'])
        if record is None:
            return self.fail(request, 'plan_not_found', 'Plan not found.', 404)
        return self.ok(request, record['state'])

    async def handle_stop_all(self, request: web.Request) -> web.Response:
        await self.stop_active_plan(self.current_plan_id, 'watchdog stop-all')
        await self.ros.publish_stop()
        await self.emit({'type': 'safety.blocked', 'reason': 'watchdog stop-all'})
        return self.ok(request, {'stopped': True}, status='cancelled', message='all motion stopped')

    async def handle_events(self, request: web.Request) -> web.WebSocketResponse:
        ws = web.WebSocketResponse(heartbeat=15)
        await ws.prepare(request)
        self.ws_clients.add(ws)
        try:
            async for msg in ws:
                if msg.type == WSMsgType.ERROR:
                    break
        finally:
            self.ws_clients.discard(ws)
        return ws

    async def handle_video_start(self, request: web.Request) -> web.Response:
        body = await read_json(request)
        profile = body.get('profile', 'monitor') if isinstance(body, dict) else 'monitor'
        self.video_stream = make_video_stream(request, profile)
        await self.emit({'type': 'video.state', 'data': self.video_stream})
        return self.ok(request, self.video_stream, message='video started')

    async def handle_video_stop(self, request: web.Request) -> web.Response:
        self.video_stream = None
        return self.ok(request, None, message='video stopped')

    async def handle_video_state(self, request: web.Request) -> web.Response:
        return self.ok(request, self.video_stream)

    def validate_plan(self, plan: Any) -> Dict[str, Any]:
        return validate_plan(plan)

    async def execute_plan(self, plan: Dict[str, Any], state: Dict[str, Any]) -> None:
        plan_id = plan['planId']
        state['status'] = 'running'
        await self.emit({'type': 'plan.started', 'planId': plan_id})
        try:
            for step_state, step in zip(state['steps'], plan['steps']):
                if state['status'] != 'running':
                    return
                state['currentStepId'] = step['id']
                step_state['status'] = 'running'
                step_state['startedAt'] = now_iso()
                await self.emit({'type': 'plan.step.started', 'planId': plan_id, 'stepId': step['id']})
                result_data = await self.execute_step(step)
                result = make_envelope('step', True, 'done', f"{step['tool']} done", result_data)
                step_state['status'] = 'done'
                step_state['endedAt'] = now_iso()
                step_state['result'] = result
                await self.emit({'type': 'plan.step.done', 'planId': plan_id, 'stepId': step['id'], 'result': result})
            state['currentStepId'] = None
            state['status'] = 'done'
            await self.emit({'type': 'plan.done', 'planId': plan_id})
        except asyncio.CancelledError:
            await self.ros.publish_stop()
            mark_pending_skipped(state)
            state['status'] = 'stopped'
            await self.emit({'type': 'plan.stopped', 'planId': plan_id, 'reason': 'cancelled'})
        except Exception as exc:
            await self.ros.publish_stop()
            state['status'] = 'failed'
            error = {'code': 'execution_failed', 'retryable': False, 'detail': str(exc)}
            await self.emit({'type': 'plan.failed', 'planId': plan_id, 'error': error})
        finally:
            if self.current_plan_id == plan_id:
                self.current_plan_id = None

    async def execute_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        tool = step['tool']
        args = step.get('args') or {}
        if tool == 'vision.stream':
            return self.video_stream or make_video_stream(None, args.get('profile', 'monitor'))
        if tool.startswith('localization.'):
            return await self.localization_tools.execute_step(step)
        if tool.startswith('poi.') or tool.startswith('race.track.'):
            return await self.poi_tools.execute_step(step)
        if tool.startswith('lidar.'):
            return await self.lidar_tools.execute_step(step)
        if tool.startswith('race.'):
            return await self.race_tools.execute_step(step)
        return await self.base_tools.execute_step(step)

    async def stop_active_plan(self, plan_id: Optional[str], reason: str) -> None:
        if self.current_task is not None and not self.current_task.done():
            self.current_task.cancel()
            try:
                await self.current_task
            except asyncio.CancelledError:
                pass
        await self.ros.publish_stop()
        if plan_id and plan_id in self.plans:
            state = self.plans[plan_id]['state']
            mark_pending_skipped(state)
            state['status'] = 'stopped'
            await self.emit({'type': 'plan.stopped', 'planId': plan_id, 'reason': reason})

    async def emit(self, event: Dict[str, Any]) -> None:
        self.event_seq += 1
        event = dict(event)
        event['eventId'] = f'robot_evt_{self.event_seq}'
        stale = []
        for ws in self.ws_clients:
            try:
                await ws.send_str(json.dumps(event))
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.ws_clients.discard(ws)

    def ok(self, request: web.Request, data: Any, status: str = 'done', message: str = 'ok') -> web.Response:
        return web.json_response(make_envelope(request_id(request), True, status, message, data))

    def fail(
        self,
        request: web.Request,
        code: str,
        message: str,
        http_status: int,
        api_status: str = 'invalid_request',
    ) -> web.Response:
        envelope = make_envelope(
            request_id(request),
            False,
            api_status,
            message,
            None,
            {'code': code, 'retryable': http_status >= 500},
        )
        return web.json_response(envelope, status=http_status)

def make_video_stream(request: Optional[web.Request], profile: str) -> Dict[str, Any]:
    host = '192.168.1.6'
    if request is not None:
        host = request.host.split(':')[0]
    topic = '/ascamera/camera_publisher/rgb0/image'
    return {
        'streamId': 'mentorpi_rgb0_mjpeg',
        'profile': profile if profile in ('teleop', 'monitor', 'snapshot') else 'monitor',
        'transport': 'mjpeg',
        'url': f'http://{host}:8080/stream?topic={topic}',
        'expiresAt': '2099-01-01T00:00:00.000Z',
        'resolution': {'width': 640, 'height': 480},
        'fps': 15,
        'latencyTargetMs': 600,
    }


async def read_json(request: web.Request) -> Any:
    try:
        return await request.json()
    except Exception:
        return {}


@web.middleware
async def cors_middleware(request: web.Request, handler: Any) -> web.StreamResponse:
    response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Request-Id, Idempotency-Key'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response
