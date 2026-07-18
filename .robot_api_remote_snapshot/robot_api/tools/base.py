import asyncio
import audioop
import math
import subprocess
import time
from typing import Any, Dict, List, Optional

from ..schemas import (
    CMD_PERIOD_SEC,
    DEFAULT_ANGULAR_RADPS,
    DEFAULT_LINEAR_MPS,
    DEFAULT_MIC_DEVICE,
    DEFAULT_MIC_SAMPLE_RATE_HZ,
    DEFAULT_REACTIVE_DURATION_MS,
    DEFAULT_REACTIVE_STARTUP_NO_INPUT_MS,
    DEFAULT_REACTIVE_STOP_ON_SILENCE_MS,
    MIC_BYTES_PER_SAMPLE,
    MIC_FRAME_MS,
    MAX_ANGULAR_RADPS,
    MAX_LINEAR_MPS,
    MAX_PROFILE_DURATION_MS,
    MAX_REACTIVE_DURATION_MS,
    MAX_TOOL_DURATION_MS,
)
from ..math_utils import clamp, shortest_angle_delta


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


class BaseToolHandlers:
    def __init__(self, ros: Any) -> None:
        self.ros = ros

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
