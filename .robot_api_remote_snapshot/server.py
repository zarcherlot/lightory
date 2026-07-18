import asyncio
import json
import audioop
import math
import socket
import subprocess
import threading
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import rclpy
from aiohttp import WSMsgType, web
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from rclpy.node import Node
from std_msgs.msg import UInt16


MAX_LINEAR_MPS = 0.5
DEFAULT_LINEAR_MPS = 0.2
MAX_ANGULAR_RADPS = 0.785398
DEFAULT_ANGULAR_RADPS = 0.349066
MAX_DISTANCE_METERS = 2.0
MAX_ROTATE_RAD = math.tau
MAX_TOOL_DURATION_MS = 15000
MAX_PROFILE_DURATION_MS = 20000
MAX_REACTIVE_DURATION_MS = 120000
DEFAULT_REACTIVE_DURATION_MS = 30000
DEFAULT_REACTIVE_STOP_ON_SILENCE_MS = 5000
DEFAULT_REACTIVE_STARTUP_NO_INPUT_MS = 5000
DEFAULT_MIC_DEVICE = 'plughw:2,0'
DEFAULT_MIC_SAMPLE_RATE_HZ = 16000
MIC_FRAME_MS = 100
MIC_BYTES_PER_SAMPLE = 2
CMD_PERIOD_SEC = 0.1
STOP_PUBLISHES = 4
ROBOT_ID = 'mentorpi-192-168-1-6'
SOFTWARE_VERSION = 'robot-api-0.1.0'


TOOLS: List[Dict[str, Any]] = [
    {
        'name': 'base.state',
        'version': '1.0.0',
        'category': 'base',
        'description': 'Read odometry and battery state.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'base.stop',
        'version': '1.0.0',
        'category': 'base',
        'description': 'Publish repeated zero velocity commands.',
        'inputSchema': {'type': 'object', 'additionalProperties': False},
        'outputSchema': {'type': 'object'},
        'risk': 'critical',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
    {
        'name': 'base.driveDistance',
        'version': '1.0.0',
        'category': 'base',
        'description': 'Drive a bounded distance using odometry when available.',
        'inputSchema': {
            'type': 'object',
            'required': ['distanceMeters'],
            'properties': {
                'distanceMeters': {'type': 'number'},
                'maxSpeedMps': {'type': 'number', 'default': DEFAULT_LINEAR_MPS, 'minimum': 0, 'maximum': MAX_LINEAR_MPS},
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'high',
        'requiresConfirmation': True,
        'requiresLease': 'base',
        'timeoutMs': MAX_TOOL_DURATION_MS,
    },
    {
        'name': 'base.rotateAngle',
        'version': '1.0.0',
        'category': 'base',
        'description': 'Rotate a bounded angle using odometry yaw when available.',
        'inputSchema': {
            'type': 'object',
            'required': ['angleRad'],
            'properties': {
                'angleRad': {'type': 'number'},
                'maxAngularRadps': {'type': 'number', 'default': DEFAULT_ANGULAR_RADPS, 'minimum': 0, 'maximum': MAX_ANGULAR_RADPS},
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'high',
        'requiresConfirmation': True,
        'requiresLease': 'base',
        'timeoutMs': MAX_TOOL_DURATION_MS,
    },
    {
        'name': 'base.velocityProfile',
        'version': '1.0.0',
        'category': 'base',
        'description': 'Execute bounded velocity segments.',
        'inputSchema': {
            'type': 'object',
            'required': ['segments'],
            'properties': {
                'segments': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'required': ['linearX', 'angularZ', 'durationMs'],
                        'properties': {
                            'linearX': {'type': 'number', 'minimum': -MAX_LINEAR_MPS, 'maximum': MAX_LINEAR_MPS},
                            'angularZ': {'type': 'number', 'minimum': -MAX_ANGULAR_RADPS, 'maximum': MAX_ANGULAR_RADPS},
                            'durationMs': {'type': 'number', 'exclusiveMinimum': 0},
                        },
                        'additionalProperties': False,
                    },
                },
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'high',
        'requiresConfirmation': True,
        'requiresLease': 'base',
        'timeoutMs': MAX_PROFILE_DURATION_MS,
    },
    {
        'name': 'reactive.run',
        'version': '1.0.0',
        'category': 'audio',
        'description': 'Run a bounded realtime reactive graph on the robot side.',
        'inputSchema': {
            'type': 'object',
            'required': ['durationMs', 'sources', 'processors', 'outputs'],
            'properties': {
                'durationMs': {'type': 'number', 'minimum': 250, 'maximum': MAX_REACTIVE_DURATION_MS},
                'sources': {'type': 'array'},
                'processors': {'type': 'array'},
                'outputs': {'type': 'array'},
                'safety': {'type': 'object'},
            },
            'additionalProperties': False,
        },
        'outputSchema': {'type': 'object'},
        'risk': 'high',
        'requiresConfirmation': True,
        'timeoutMs': MAX_REACTIVE_DURATION_MS,
    },
    {
        'name': 'vision.stream',
        'version': '1.0.0',
        'category': 'vision',
        'description': 'Return web_video_server MJPEG stream metadata.',
        'inputSchema': {'type': 'object'},
        'outputSchema': {'type': 'object'},
        'risk': 'low',
        'requiresConfirmation': False,
        'timeoutMs': 1000,
    },
]
TOOL_BY_NAME = {tool['name']: tool for tool in TOOLS}


@dataclass
class Pose2D:
    x: float
    y: float
    yaw: float


class RobotRosAdapter(Node):
    def __init__(self) -> None:
        super().__init__('robot_api_adapter')
        self.cmd_pub = self.create_publisher(Twist, '/controller/cmd_vel', 1)
        self.create_subscription(Odometry, '/odom', self._odom_callback, 10)
        self.create_subscription(UInt16, '/ros_robot_controller/battery', self._battery_callback, 10)
        self.pose: Optional[Pose2D] = None
        self.battery: Optional[int] = None

    def _odom_callback(self, msg: Odometry) -> None:
        q = msg.pose.pose.orientation
        yaw = math.atan2(
            2.0 * (q.w * q.z + q.x * q.y),
            1.0 - 2.0 * (q.y * q.y + q.z * q.z),
        )
        self.pose = Pose2D(msg.pose.pose.position.x, msg.pose.pose.position.y, yaw)

    def _battery_callback(self, msg: UInt16) -> None:
        self.battery = int(msg.data)

    def publish_velocity(self, linear_x: float, angular_z: float) -> None:
        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.angular.z = float(angular_z)
        self.cmd_pub.publish(msg)

    async def publish_stop(self) -> None:
        for _ in range(STOP_PUBLISHES):
            self.publish_velocity(0.0, 0.0)
            await asyncio.sleep(CMD_PERIOD_SEC)

    def state(self) -> Dict[str, Any]:
        return {
            'connected': True,
            'batteryRaw': self.battery,
            'pose': None
            if self.pose is None
            else {'frame': 'odom', 'x': self.pose.x, 'y': self.pose.y, 'thetaRad': self.pose.yaw},
        }


class RobotApiService:
    def __init__(self, ros: RobotRosAdapter) -> None:
        self.ros = ros
        self.plans: Dict[str, Dict[str, Any]] = {}
        self.current_task: Optional[asyncio.Task[Any]] = None
        self.current_plan_id: Optional[str] = None
        self.event_seq = 0
        self.ws_clients: set[web.WebSocketResponse] = set()
        self.video_stream: Optional[Dict[str, Any]] = None

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
        return self.ok(request, TOOLS)

    async def handle_tool(self, request: web.Request) -> web.Response:
        tool = TOOL_BY_NAME.get(request.match_info['tool_name'])
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
        errors: List[Dict[str, Any]] = []
        warnings: List[Dict[str, Any]] = []
        plan_id = plan.get('planId', '') if isinstance(plan, dict) else ''
        if not isinstance(plan, dict):
            return validation_result('', [{'code': 'invalid_json', 'message': 'Plan must be an object.'}], [])
        if plan.get('schemaVersion') != 'robot-plan/v1':
            errors.append({'code': 'schema_version', 'message': 'Unsupported robot plan schema.'})
        steps = plan.get('steps')
        constraints = plan.get('constraints') or {}
        if not isinstance(steps, list) or not steps:
            errors.append({'code': 'steps_required', 'message': 'Plan must include steps.'})
            steps = []
        max_steps = constraints.get('maxSteps', len(steps))
        if len(steps) > max_steps:
            errors.append({'code': 'max_steps', 'message': 'Plan exceeds maxSteps.'})
        allowed_tools = constraints.get('allowedTools') or []
        step_ids = set()
        for step in steps:
            step_id = step.get('id') if isinstance(step, dict) else None
            if not step_id or step_id in step_ids:
                errors.append({'code': 'duplicate_step', 'message': 'Step id is missing or duplicated.', 'stepId': step_id})
                continue
            step_ids.add(step_id)
            tool_name = step.get('tool')
            tool = TOOL_BY_NAME.get(tool_name)
            if tool is None:
                errors.append({'code': 'missing_tool', 'message': f'Robot tool {tool_name} is unavailable.', 'stepId': step_id})
                continue
            if tool_name not in allowed_tools:
                errors.append({'code': 'tool_not_allowed', 'message': f'Tool {tool_name} is not in allowedTools.', 'stepId': step_id})
            if tool['risk'] in ('high', 'critical') and tool_name != 'base.stop' and not plan.get('requiresUserConfirmation'):
                errors.append({'code': 'confirmation_required', 'message': f'Tool {tool_name} requires confirmation.', 'stepId': step_id})
            errors.extend(validate_step_args(step))
        for step in steps:
            for dep in step.get('dependsOn') or []:
                if dep not in step_ids:
                    errors.append({'code': 'missing_dependency', 'message': f'Missing dependency {dep}.', 'stepId': step.get('id')})
        if not any(step.get('tool') == 'base.stop' for step in steps if isinstance(step, dict)):
            warnings.append({'code': 'no_stop_fallback', 'message': 'Plan has no explicit base.stop fallback.'})
        return validation_result(plan_id, errors, warnings, plan if not errors else None)

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
        if tool == 'base.state':
            return self.ros.state()
        if tool == 'base.stop':
            await self.ros.publish_stop()
            return {'stopped': True}
        if tool == 'base.driveDistance':
            return await self.drive_distance(float(args['distanceMeters']), float(args.get('maxSpeedMps', DEFAULT_LINEAR_MPS)))
        if tool == 'base.rotateAngle':
            return await self.rotate_angle(float(args['angleRad']), float(args.get('maxAngularRadps', DEFAULT_ANGULAR_RADPS)))
        if tool == 'base.velocityProfile':
            return await self.velocity_profile(args['segments'])
        if tool == 'reactive.run':
            return await self.reactive_run(args)
        if tool == 'vision.stream':
            return self.video_stream or make_video_stream(None, args.get('profile', 'monitor'))
        raise ValueError(f'Unsupported tool {tool}')

    async def drive_distance(self, distance: float, speed: float) -> Dict[str, Any]:
        direction = 1.0 if distance >= 0 else -1.0
        speed = min(abs(speed), MAX_LINEAR_MPS) * direction
        start = self.ros.pose
        started = time.monotonic()
        expected = abs(distance) / max(abs(speed), 0.01)
        timeout = min(MAX_TOOL_DURATION_MS / 1000.0, expected * 1.5 + 1.0)
        while time.monotonic() - started < timeout:
            self.ros.publish_velocity(speed, 0.0)
            await asyncio.sleep(CMD_PERIOD_SEC)
            if start is not None and self.ros.pose is not None:
                travelled = math.hypot(self.ros.pose.x - start.x, self.ros.pose.y - start.y)
                if travelled >= abs(distance):
                    break
            elif time.monotonic() - started >= expected:
                break
        await self.ros.publish_stop()
        return {'distanceMeters': distance, 'elapsedMs': int((time.monotonic() - started) * 1000)}

    async def rotate_angle(self, angle: float, angular_speed: float) -> Dict[str, Any]:
        direction = 1.0 if angle >= 0 else -1.0
        angular = min(abs(angular_speed), MAX_ANGULAR_RADPS) * direction
        start_yaw = self.ros.pose.yaw if self.ros.pose is not None else None
        started = time.monotonic()
        expected = abs(angle) / max(abs(angular), 0.01)
        timeout = min(MAX_TOOL_DURATION_MS / 1000.0, expected * 1.5 + 1.0)
        while time.monotonic() - started < timeout:
            self.ros.publish_velocity(0.0, angular)
            await asyncio.sleep(CMD_PERIOD_SEC)
            if start_yaw is not None and self.ros.pose is not None:
                delta = abs(shortest_angle_delta(start_yaw, self.ros.pose.yaw))
                if delta >= abs(angle):
                    break
            elif time.monotonic() - started >= expected:
                break
        await self.ros.publish_stop()
        return {'angleRad': angle, 'elapsedMs': int((time.monotonic() - started) * 1000)}

    async def velocity_profile(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        started = time.monotonic()
        for segment in segments:
            linear_x = clamp(float(segment.get('linearX', 0.0)), -MAX_LINEAR_MPS, MAX_LINEAR_MPS)
            angular_z = clamp(float(segment.get('angularZ', 0.0)), -MAX_ANGULAR_RADPS, MAX_ANGULAR_RADPS)
            duration = int(segment.get('durationMs', 0)) / 1000.0
            segment_started = time.monotonic()
            while time.monotonic() - segment_started < duration:
                self.ros.publish_velocity(linear_x, angular_z)
                await asyncio.sleep(CMD_PERIOD_SEC)
        await self.ros.publish_stop()
        return {'segments': len(segments), 'elapsedMs': int((time.monotonic() - started) * 1000)}

    async def reactive_run(self, graph: Dict[str, Any]) -> Dict[str, Any]:
        duration_ms = int(clamp(float(graph.get('durationMs', DEFAULT_REACTIVE_DURATION_MS)), 250, MAX_REACTIVE_DURATION_MS))
        outputs = graph.get('outputs') if isinstance(graph.get('outputs'), list) else []
        safety = graph.get('safety') if isinstance(graph.get('safety'), dict) else {}
        base_outputs = [output for output in outputs if isinstance(output, dict) and output.get('type') == 'base.motionReactive']
        led_outputs = [output for output in outputs if isinstance(output, dict) and output.get('type') == 'led.reactivePattern']
        speech_outputs = [output for output in outputs if isinstance(output, dict) and output.get('type') == 'speech.reactiveCue']
        source = first_node(graph.get('sources'), 'audio.microphone') or {}
        source_args = source.get('args') if isinstance(source.get('args'), dict) else {}
        mic_device = str(source_args.get('device', DEFAULT_MIC_DEVICE))
        sample_rate = int(clamp(float(source_args.get('sampleRateHz', DEFAULT_MIC_SAMPLE_RATE_HZ)), 8000, 48000))
        stop_on_silence_ms = int(clamp(float(safety.get('stopOnSilenceMs', DEFAULT_REACTIVE_STOP_ON_SILENCE_MS)), 1000, 30000))
        startup_no_input_ms = int(clamp(float(safety.get('startupNoInputMs', DEFAULT_REACTIVE_STARTUP_NO_INPUT_MS)), 1000, 30000))
        max_speed = clamp(float(safety.get('maxSpeedMps', DEFAULT_LINEAR_MPS)), 0.01, MAX_LINEAR_MPS)
        max_angular = clamp(float(safety.get('maxAngularRadps', DEFAULT_ANGULAR_RADPS)), 0.01, MAX_ANGULAR_RADPS)
        if base_outputs:
            base_args = base_outputs[0].get('args') if isinstance(base_outputs[0].get('args'), dict) else {}
            max_speed = min(max_speed, clamp(float(base_args.get('maxSpeedMps', max_speed)), 0.01, MAX_LINEAR_MPS))
            max_angular = min(max_angular, clamp(float(base_args.get('maxAngularRadps', max_angular)), 0.01, MAX_ANGULAR_RADPS))

        started = time.monotonic()
        last_sound_at = started
        active_started = False
        stop_reason = 'duration_complete'
        beat_index = 0
        frames = 0
        peak_rms = 0
        last_rms = 0
        beat_hold_ms = 450
        motion_until = started
        held_linear = 0.0
        held_angular = 0.0
        arecord = start_microphone_capture(mic_device, sample_rate)
        try:
            while (time.monotonic() - started) * 1000 < duration_ms:
                frame = await asyncio.to_thread(read_microphone_frame, arecord, sample_rate)
                if not frame:
                    raise RuntimeError('microphone capture ended unexpectedly')
                rms = audioop.rms(frame, MIC_BYTES_PER_SAMPLE)
                peak_rms = max(peak_rms, rms)
                frames += 1
                active_rms = max(90, peak_rms * 0.15)
                onset_threshold = max(130, last_rms * 1.6, active_rms * 1.4)
                has_sound = rms >= active_rms
                is_onset = rms >= onset_threshold and rms > last_rms + 50
                now = time.monotonic()
                if has_sound:
                    last_sound_at = now
                    active_started = True
                if not active_started:
                    if (now - started) * 1000 >= startup_no_input_ms:
                        stop_reason = 'no_input_timeout'
                        break
                    if base_outputs:
                        self.ros.publish_velocity(0.0, 0.0)
                    last_rms = rms
                    continue
                if (now - last_sound_at) * 1000 >= stop_on_silence_ms:
                    stop_reason = 'silence_timeout'
                    break
                if is_onset:
                    beat_index += 1
                    if base_outputs:
                        energy = clamp((rms - active_rms) / max(peak_rms - active_rms, 1), 0.0, 1.0)
                        phase = beat_index % 4
                        linear_sign = 1.0 if phase in (0, 1) else -1.0
                        angular_sign = 1.0 if phase in (0, 3) else -1.0
                        held_linear = linear_sign * max_speed * (0.45 + 0.55 * energy)
                        held_angular = angular_sign * max_angular * (0.55 + 0.45 * energy)
                        motion_until = now + beat_hold_ms / 1000.0
                if base_outputs and now < motion_until:
                    self.ros.publish_velocity(held_linear, held_angular)
                else:
                    self.ros.publish_velocity(0.0, 0.0)
                last_rms = rms
        finally:
            stop_microphone_capture(arecord)
            await self.ros.publish_stop()
        return {
            'mode': 'reactive_graph_v1',
            'audioInput': 'alsa_arecord',
            'micDevice': mic_device,
            'sampleRateHz': sample_rate,
            'beatTracker': 'rms_onset_v1',
            'stopReason': stop_reason,
            'activeStarted': active_started,
            'startupNoInputMs': startup_no_input_ms,
            'stopOnSilenceMs': stop_on_silence_ms,
            'baseOutputs': len(base_outputs),
            'ledOutputs': len(led_outputs),
            'speechOutputs': len(speech_outputs),
            'frames': frames,
            'beats': beat_index,
            'peakRms': peak_rms,
            'beatHoldMs': beat_hold_ms,
            'elapsedMs': int((time.monotonic() - started) * 1000),
        }

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


def validate_step_args(step: Dict[str, Any]) -> List[Dict[str, Any]]:
    errors = []
    tool = step.get('tool')
    args = step.get('args') or {}
    step_id = step.get('id')
    if tool == 'base.driveDistance':
        distance = as_number(args.get('distanceMeters'))
        speed = as_number(args.get('maxSpeedMps', DEFAULT_LINEAR_MPS))
        if distance is None or abs(distance) > MAX_DISTANCE_METERS:
            errors.append({'code': 'distance_limit', 'message': 'distanceMeters must be within +/-2.0.', 'stepId': step_id})
        if speed is None or speed <= 0 or speed > MAX_LINEAR_MPS:
            errors.append({'code': 'speed_limit', 'message': 'maxSpeedMps must be <= 0.5.', 'stepId': step_id})
    if tool == 'base.rotateAngle':
        angle = as_number(args.get('angleRad'))
        speed = as_number(args.get('maxAngularRadps', DEFAULT_ANGULAR_RADPS))
        if angle is None or abs(angle) > MAX_ROTATE_RAD + 0.001:
            errors.append({'code': 'angle_limit', 'message': 'angleRad must be within +/-2*pi.', 'stepId': step_id})
        if speed is None or speed <= 0 or speed > MAX_ANGULAR_RADPS:
            errors.append({'code': 'angular_limit', 'message': 'maxAngularRadps must be <= 0.785398 (45deg/s).', 'stepId': step_id})
    if tool == 'base.velocityProfile':
        segments = args.get('segments')
        if not isinstance(segments, list) or not segments:
            errors.append({'code': 'segments_required', 'message': 'segments must be a non-empty array.', 'stepId': step_id})
            return errors
        total_ms = 0
        for segment in segments:
            duration = as_number(segment.get('durationMs')) if isinstance(segment, dict) else None
            linear = as_number(segment.get('linearX', 0)) if isinstance(segment, dict) else None
            angular = as_number(segment.get('angularZ', 0)) if isinstance(segment, dict) else None
            total_ms += int(duration or 0)
            if duration is None or duration <= 0:
                errors.append({'code': 'segment_duration', 'message': 'durationMs must be positive.', 'stepId': step_id})
            if linear is None or abs(linear) > MAX_LINEAR_MPS:
                errors.append({'code': 'segment_linear_limit', 'message': 'linearX must be within +/-0.5.', 'stepId': step_id})
            if angular is None or abs(angular) > MAX_ANGULAR_RADPS:
                errors.append({'code': 'segment_angular_limit', 'message': 'angularZ must be within +/-0.785398 (45deg/s).', 'stepId': step_id})
        if total_ms > MAX_PROFILE_DURATION_MS:
            errors.append({'code': 'profile_duration_limit', 'message': 'velocity profile must be <= 20000ms.', 'stepId': step_id})
    if tool == 'reactive.run':
        errors.extend(validate_reactive_graph(step, args))
    return errors


def first_node(raw: Any, node_type: str) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, list):
        return None
    for node in raw:
        if isinstance(node, dict) and node.get('type') == node_type:
            return node
    return None


def start_microphone_capture(device: str, sample_rate: int) -> subprocess.Popen[bytes]:
    command = [
        'arecord',
        '-q',
        '-D',
        device,
        '-f',
        'S16_LE',
        '-r',
        str(sample_rate),
        '-c',
        '1',
        '-t',
        'raw',
    ]
    return subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def read_microphone_frame(process: subprocess.Popen[bytes], sample_rate: int) -> bytes:
    if process.stdout is None:
        return b''
    frame_bytes = int(sample_rate * MIC_FRAME_MS / 1000) * MIC_BYTES_PER_SAMPLE
    return process.stdout.read(frame_bytes)


def stop_microphone_capture(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=1.0)
        except subprocess.TimeoutExpired:
            process.kill()
    if process.stdout is not None:
        process.stdout.close()
    if process.stderr is not None:
        process.stderr.close()


def validate_reactive_graph(step: Dict[str, Any], graph: Dict[str, Any]) -> List[Dict[str, Any]]:
    step_id = step.get('id')
    errors: List[Dict[str, Any]] = []
    duration = as_number(graph.get('durationMs', DEFAULT_REACTIVE_DURATION_MS))
    if duration is None or duration <= 0 or duration > MAX_REACTIVE_DURATION_MS:
        errors.append({'code': 'reactive_duration_limit', 'message': 'durationMs must be <= 120000ms.', 'stepId': step_id})
    source_ids = validate_reactive_sources(graph.get('sources'), step_id, errors)
    processor_ids = validate_reactive_processors(graph.get('processors'), source_ids, step_id, errors)
    output_types = validate_reactive_outputs(graph.get('outputs'), source_ids | processor_ids, step_id, errors)
    safety = graph.get('safety') if isinstance(graph.get('safety'), dict) else {}
    if graph.get('safety') is not None and not isinstance(graph.get('safety'), dict):
        errors.append({'code': 'reactive_safety', 'message': 'safety must be an object.', 'stepId': step_id})
    speed = as_number(safety.get('maxSpeedMps', DEFAULT_LINEAR_MPS)) if isinstance(safety, dict) else None
    angular = as_number(safety.get('maxAngularRadps', DEFAULT_ANGULAR_RADPS)) if isinstance(safety, dict) else None
    silence_ms = as_number(safety.get('stopOnSilenceMs', DEFAULT_REACTIVE_STOP_ON_SILENCE_MS)) if isinstance(safety, dict) else None
    if speed is None or speed <= 0 or speed > MAX_LINEAR_MPS:
        errors.append({'code': 'reactive_speed_limit', 'message': 'safety.maxSpeedMps must be <= 0.5.', 'stepId': step_id})
    if angular is None or angular <= 0 or angular > MAX_ANGULAR_RADPS:
        errors.append({'code': 'reactive_angular_limit', 'message': 'safety.maxAngularRadps must be <= 0.785398.', 'stepId': step_id})
    if silence_ms is None or silence_ms <= 0:
        errors.append({'code': 'reactive_silence_limit', 'message': 'safety.stopOnSilenceMs must be positive.', 'stepId': step_id})
    if 'base.motionReactive' in output_types:
        step_safety = step.get('safety') if isinstance(step.get('safety'), dict) else {}
        if step_safety.get('requiresLease') != 'base':
            errors.append({'code': 'lease_required', 'message': 'base.motionReactive requires base lease.', 'stepId': step_id})
        if step_safety.get('stopOnObstacle') is not True:
            errors.append({'code': 'reactive_obstacle_stop', 'message': 'base.motionReactive requires stopOnObstacle.', 'stepId': step_id})
    return errors


def validate_reactive_sources(raw: Any, step_id: Any, errors: List[Dict[str, Any]]) -> set[str]:
    ids: set[str] = set()
    if not isinstance(raw, list) or not raw:
        errors.append({'code': 'reactive_sources_required', 'message': 'sources must be a non-empty array.', 'stepId': step_id})
        return ids
    for node in raw:
        if not isinstance(node, dict) or not valid_node_id(node.get('id')) or node.get('id') in ids:
            errors.append({'code': 'reactive_source_id', 'message': 'source id is invalid.', 'stepId': step_id})
            continue
        if node.get('type') != 'audio.microphone':
            errors.append({'code': 'reactive_source_type', 'message': 'source type is unsupported.', 'stepId': step_id})
        ids.add(node['id'])
    return ids


def validate_reactive_processors(raw: Any, known_ids: set[str], step_id: Any, errors: List[Dict[str, Any]]) -> set[str]:
    ids: set[str] = set()
    if not isinstance(raw, list) or not raw:
        errors.append({'code': 'reactive_processors_required', 'message': 'processors must be a non-empty array.', 'stepId': step_id})
        return ids
    allowed = {'audio.beatTracker', 'audio.onsetDetector', 'audio.moodEstimator'}
    all_ids = set(known_ids)
    for node in raw:
        if not isinstance(node, dict) or not valid_node_id(node.get('id')) or node.get('id') in all_ids:
            errors.append({'code': 'reactive_processor_id', 'message': 'processor id is invalid.', 'stepId': step_id})
            continue
        if node.get('type') not in allowed:
            errors.append({'code': 'reactive_processor_type', 'message': 'processor type is unsupported.', 'stepId': step_id})
        if node.get('input') not in all_ids:
            errors.append({'code': 'reactive_processor_input', 'message': 'processor input is invalid.', 'stepId': step_id})
        ids.add(node['id'])
        all_ids.add(node['id'])
    return ids


def validate_reactive_outputs(raw: Any, known_ids: set[str], step_id: Any, errors: List[Dict[str, Any]]) -> set[str]:
    types: set[str] = set()
    ids: set[str] = set()
    if not isinstance(raw, list) or not raw:
        errors.append({'code': 'reactive_outputs_required', 'message': 'outputs must be a non-empty array.', 'stepId': step_id})
        return types
    allowed = {'base.motionReactive', 'led.reactivePattern', 'speech.reactiveCue'}
    for node in raw:
        if not isinstance(node, dict) or not valid_node_id(node.get('id')) or node.get('id') in ids:
            errors.append({'code': 'reactive_output_id', 'message': 'output id is invalid.', 'stepId': step_id})
            continue
        if node.get('type') not in allowed:
            errors.append({'code': 'reactive_output_type', 'message': 'output type is unsupported.', 'stepId': step_id})
        if node.get('input') not in known_ids:
            errors.append({'code': 'reactive_output_input', 'message': 'output input is invalid.', 'stepId': step_id})
        if node.get('type') == 'base.motionReactive':
            args = node.get('args') if isinstance(node.get('args'), dict) else {}
            speed = as_number(args.get('maxSpeedMps', DEFAULT_LINEAR_MPS))
            angular = as_number(args.get('maxAngularRadps', DEFAULT_ANGULAR_RADPS))
            if speed is None or speed <= 0 or speed > MAX_LINEAR_MPS:
                errors.append({'code': 'reactive_output_speed', 'message': 'base.motionReactive maxSpeedMps must be <= 0.5.', 'stepId': step_id})
            if angular is None or angular <= 0 or angular > MAX_ANGULAR_RADPS:
                errors.append({'code': 'reactive_output_angular', 'message': 'base.motionReactive maxAngularRadps must be <= 0.785398.', 'stepId': step_id})
        ids.add(node['id'])
        if isinstance(node.get('type'), str):
            types.add(node['type'])
    return types


def valid_node_id(value: Any) -> bool:
    if not isinstance(value, str) or not value or len(value) > 32:
        return False
    first = value[0]
    return first.isalpha() and all(ch.isalnum() or ch in ('_', '-') for ch in value)


def create_plan_state(plan: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'planId': plan['planId'],
        'status': 'pending',
        'steps': [{'id': step['id'], 'tool': step['tool'], 'status': 'pending'} for step in plan['steps']],
    }


def validation_result(plan_id: str, errors: List[Dict[str, Any]], warnings: List[Dict[str, Any]], plan: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    result: Dict[str, Any] = {'ok': not errors, 'planId': plan_id, 'errors': errors, 'warnings': warnings}
    if plan is not None:
        result['normalizedPlan'] = plan
    return result


def mark_pending_skipped(state: Dict[str, Any]) -> None:
    for step in state.get('steps', []):
        if step.get('status') in ('pending', 'running'):
            step['status'] = 'skipped'
    state['currentStepId'] = None


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


def request_id(request: web.Request) -> str:
    return request.headers.get('X-Request-Id') or request.query.get('requestId') or str(uuid.uuid4())


def now_iso() -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())


def as_number(value: Any) -> Optional[float]:
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    return None


def clamp(value: float, low: float, high: float) -> float:
    return min(max(value, low), high)


def shortest_angle_delta(start: float, current: float) -> float:
    return math.atan2(math.sin(current - start), math.cos(current - start))


def main() -> None:
    rclpy.init()
    ros = RobotRosAdapter()
    spin_thread = threading.Thread(target=rclpy.spin, args=(ros,), daemon=True)
    spin_thread.start()
    service = RobotApiService(ros)
    try:
        web.run_app(service.app(), host='0.0.0.0', port=8088)
    finally:
        ros.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
