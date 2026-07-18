from typing import Any, Dict, List, Optional

from .math_utils import as_number
from .registry import TOOL_BY_NAME
from .schemas import (
    DEFAULT_ANGULAR_RADPS,
    DEFAULT_LINEAR_MPS,
    DEFAULT_REACTIVE_DURATION_MS,
    DEFAULT_REACTIVE_STOP_ON_SILENCE_MS,
    MAX_ANGULAR_RADPS,
    MAX_DISTANCE_METERS,
    MAX_LINEAR_MPS,
    MAX_PROFILE_DURATION_MS,
    MAX_REACTIVE_DURATION_MS,
    MAX_ROTATE_RAD,
)


def validate_plan(plan: Any) -> Dict[str, Any]:
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
        if tool['risk'] in ('high', 'critical') and not is_stop_tool(tool_name) and not plan.get('requiresUserConfirmation'):
            errors.append({'code': 'confirmation_required', 'message': f'Tool {tool_name} requires confirmation.', 'stepId': step_id})
        errors.extend(validate_step_args(step))
    for step in steps:
        for dep in step.get('dependsOn') or []:
            if dep not in step_ids:
                errors.append({'code': 'missing_dependency', 'message': f'Missing dependency {dep}.', 'stepId': step.get('id')})
    if not any(step.get('tool') == 'base.stop' for step in steps if isinstance(step, dict)):
        warnings.append({'code': 'no_stop_fallback', 'message': 'Plan has no explicit base.stop fallback.'})
    return validation_result(plan_id, errors, warnings, plan if not errors else None)


def is_stop_tool(tool_name: Any) -> bool:
    return tool_name in ('base.stop', 'race.stop')


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
    if tool == 'localization.setInitialPose':
        errors.extend(validate_pose_arg(args.get('pose'), step_id, 'pose'))
        preset = args.get('covariancePreset', 'normal')
        if preset not in ('confident', 'normal'):
            errors.append({'code': 'covariance_preset', 'message': 'covariancePreset must be confident or normal.', 'stepId': step_id})
    if tool == 'localization.recordCurrentPose':
        validate_point_name_arg(args.get('name'), step_id, errors)
    if tool == 'poi.upsert':
        validate_point_name_arg(args.get('name'), step_id, errors)
        errors.extend(validate_pose_arg(args.get('pose'), step_id, 'pose'))
    if tool in ('poi.get', 'poi.delete'):
        validate_point_name_arg(args.get('name'), step_id, errors)
    if tool == 'race.track.save':
        point_names = args.get('pointNames', ['A', 'B', 'C', 'D'])
        if not isinstance(point_names, list) or len(point_names) < 4 or len(set(point_names)) < 4:
            errors.append({'code': 'track_points', 'message': 'race.track.save requires at least four unique pointNames.', 'stepId': step_id})
        else:
            for point_name in point_names:
                validate_point_name_arg(point_name, step_id, errors)
    if tool in ('race.track.get', 'race.track.clear') and not valid_text_id(args.get('trackId')):
        errors.append({'code': 'track_id', 'message': 'trackId is required.', 'stepId': step_id})
    if tool in ('race.previewLap', 'race.runLap'):
        order = args.get('order', ['A', 'B', 'C', 'D', 'A'])
        if not isinstance(order, list) or len(order) < 5 or order[0] != order[-1] or len(set(order[:-1])) < 4:
            errors.append({'code': 'race_order', 'message': 'Race order must be a closed route with at least four unique points.', 'stepId': step_id})
        else:
            for point_name in order[:-1]:
                validate_point_name_arg(point_name, step_id, errors)
        strategy = args.get('strategy') if isinstance(args.get('strategy'), dict) else {}
        max_speed = as_number(strategy.get('maxSpeedMps', 0.25))
        min_speed = as_number(strategy.get('minTurnSpeedMps', 0.08))
        lookahead = as_number(strategy.get('lookaheadMeters', 0.35))
        waypoint_radius = as_number(strategy.get('waypointRadiusMeters', 0.18))
        finish_radius = as_number(strategy.get('finishRadiusMeters', 0.22))
        if max_speed is None or max_speed <= 0 or max_speed > MAX_LINEAR_MPS:
            errors.append({'code': 'race_speed_limit', 'message': 'strategy.maxSpeedMps must be <= 0.5.', 'stepId': step_id})
        if min_speed is None or min_speed <= 0 or (max_speed is not None and min_speed > max_speed):
            errors.append({'code': 'race_min_speed', 'message': 'strategy.minTurnSpeedMps must be positive and <= maxSpeedMps.', 'stepId': step_id})
        if lookahead is None or lookahead <= 0:
            errors.append({'code': 'race_lookahead', 'message': 'strategy.lookaheadMeters must be positive.', 'stepId': step_id})
        if waypoint_radius is None or waypoint_radius <= 0:
            errors.append({'code': 'race_waypoint_radius', 'message': 'strategy.waypointRadiusMeters must be positive.', 'stepId': step_id})
        if finish_radius is None or finish_radius <= 0:
            errors.append({'code': 'race_finish_radius', 'message': 'strategy.finishRadiusMeters must be positive.', 'stepId': step_id})
        safety = args.get('safety') if isinstance(args.get('safety'), dict) else {}
        front_stop = as_number(safety.get('frontStopDistanceMeters', 0.35))
        max_duration = as_number(safety.get('maxDurationMs', 120000))
        if front_stop is None or front_stop <= 0:
            errors.append({'code': 'race_front_stop', 'message': 'safety.frontStopDistanceMeters must be positive.', 'stepId': step_id})
        if max_duration is None or max_duration <= 0 or max_duration > 120000:
            errors.append({'code': 'race_duration', 'message': 'safety.maxDurationMs must be <= 120000ms.', 'stepId': step_id})
    return errors


def validate_pose_arg(pose: Any, step_id: Any, field: str) -> List[Dict[str, Any]]:
    errors: List[Dict[str, Any]] = []
    if not isinstance(pose, dict):
        return [{'code': 'pose_required', 'message': f'{field} must be an object.', 'stepId': step_id}]
    if pose.get('frame') != 'map':
        errors.append({'code': 'pose_frame', 'message': f'{field}.frame must be map.', 'stepId': step_id})
    for number_field in ('x', 'y', 'thetaRad'):
        if as_number(pose.get(number_field)) is None:
            errors.append({'code': 'pose_number', 'message': f'{field}.{number_field} must be a finite number.', 'stepId': step_id})
    return errors


def validate_point_name_arg(value: Any, step_id: Any, errors: List[Dict[str, Any]]) -> None:
    if value not in ('A', 'B', 'C', 'D'):
        errors.append({'code': 'point_name', 'message': 'MVP race point name must be A, B, C, or D.', 'stepId': step_id})


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


def valid_node_id(value: Any) -> bool:
    if not isinstance(value, str) or not value or len(value) > 32:
        return False
    first = value[0]
    return first.isalpha() and all(ch.isalnum() or ch in ('_', '-') for ch in value)


def valid_text_id(value: Any) -> bool:
    return isinstance(value, str) and 0 < len(value) <= 64
