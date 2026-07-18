import socket
import sys
from pathlib import Path
from types import SimpleNamespace


SNAPSHOT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SNAPSHOT_ROOT))


def test_registry_exposes_existing_tools_in_order():
    from robot_api.registry import DEFAULT_REGISTRY

    tool_names = [tool["name"] for tool in DEFAULT_REGISTRY.list_tools()]
    assert tool_names[:7] == [
        "base.state",
        "base.stop",
        "base.driveDistance",
        "base.rotateAngle",
        "base.velocityProfile",
        "reactive.run",
        "vision.stream",
    ]
    assert "localization.health" in tool_names
    assert "localization.setInitialPose" in tool_names
    assert "localization.recordCurrentPose" in tool_names
    assert "poi.upsert" in tool_names
    assert "race.track.save" in tool_names
    assert DEFAULT_REGISTRY.get("base.driveDistance")["timeoutMs"] == 15000


def test_validator_preserves_confirmation_and_stop_warning():
    from robot_api.validator import validate_plan

    plan = {
        "schemaVersion": "robot-plan/v1",
        "planId": "plan_1",
        "constraints": {"allowedTools": ["base.driveDistance"], "maxSteps": 1},
        "steps": [
            {
                "id": "drive",
                "tool": "base.driveDistance",
                "args": {"distanceMeters": 0.5, "maxSpeedMps": 0.2},
            }
        ],
    }

    result = validate_plan(plan)

    assert result["ok"] is False
    assert [error["code"] for error in result["errors"]] == ["confirmation_required"]
    assert [warning["code"] for warning in result["warnings"]] == ["no_stop_fallback"]


def test_validator_allows_race_stop_without_user_confirmation():
    from robot_api.validator import validate_plan

    result = validate_plan({
        "schemaVersion": "robot-plan/v1",
        "planId": "race_stop",
        "constraints": {"allowedTools": ["race.stop"], "maxSteps": 1},
        "steps": [{"id": "stop", "tool": "race.stop", "args": {}, "safety": {"requiresLease": "base"}}],
    })

    assert result["ok"] is True
    assert result["errors"] == []


def test_envelope_preserves_schema_and_robot_metadata():
    from robot_api.envelope import make_envelope
    from robot_api.schemas import ROBOT_ID, SOFTWARE_VERSION

    envelope = make_envelope("req_1", True, "done", "ok", {"value": 1})

    assert envelope["schemaVersion"] == "robot-api/v1"
    assert envelope["requestId"] == "req_1"
    assert envelope["robot"] == {
        "robotId": ROBOT_ID,
        "hostname": socket.gethostname(),
        "softwareVersion": SOFTWARE_VERSION,
    }
    assert envelope["timing"]["durationMs"] == 0


def test_video_stream_uses_monitor_fallback_without_request():
    from robot_api.executor import make_video_stream

    stream = make_video_stream(None, "bad-profile")

    assert stream["streamId"] == "mentorpi_rgb0_mjpeg"
    assert stream["profile"] == "monitor"
    assert stream["url"] == "http://192.168.1.6:8080/stream?topic=/ascamera/camera_publisher/rgb0/image"


def test_service_app_registers_existing_http_routes():
    from robot_api.executor import RobotApiService

    service = RobotApiService(FakeRos())
    routes = {(route.method, route.resource.canonical) for route in service.app().router.routes()}

    assert ("GET", "/api/health") in routes
    assert ("GET", "/api/tools") in routes
    assert ("POST", "/api/plans/validate") in routes
    assert ("POST", "/api/plans/{plan_id}/execute") in routes
    assert ("POST", "/api/watchdog/stop-all") in routes


def test_execute_step_dispatches_base_state_to_base_handlers():
    import asyncio
    from robot_api.executor import RobotApiService

    result = asyncio.run(RobotApiService(FakeRos()).execute_step({"tool": "base.state", "args": {}}))

    assert result == {"connected": True, "batteryRaw": 81, "pose": {"frame": "odom", "x": 1.0, "y": 2.0, "thetaRad": 0.3}}


def test_poi_store_persists_map_points(tmp_path):
    from robot_api.tools.poi import POIStore

    store = POIStore(tmp_path / "race_tracks.json")
    pose = {"frame": "map", "x": 1.2, "y": 0.4, "thetaRad": 0.1}

    store.upsert_poi("A", pose, "default-abcd", "map_01")
    reloaded = POIStore(tmp_path / "race_tracks.json")

    assert reloaded.get_poi("A")["point"]["pose"] == pose
    assert reloaded.list_pois()["points"][0]["name"] == "A"


def test_validator_rejects_non_map_poi_pose():
    from robot_api.validator import validate_plan

    result = validate_plan({
        "schemaVersion": "robot-plan/v1",
        "planId": "bad_poi",
        "constraints": {"allowedTools": ["poi.upsert"], "maxSteps": 1},
        "steps": [{"id": "poi", "tool": "poi.upsert", "args": {"name": "A", "pose": {"frame": "odom", "x": 0, "y": 0, "thetaRad": 0}}}],
    })

    assert result["ok"] is False
    assert any(error["code"] == "pose_frame" for error in result["errors"])


def test_record_current_pose_dispatches_to_poi_store(tmp_path):
    import asyncio
    from robot_api.executor import RobotApiService
    from robot_api.tools.poi import POIStore

    service = RobotApiService(FakeRos())
    service.poi_store = POIStore(tmp_path / "race_tracks.json")
    service.localization_tools.poi_store = service.poi_store
    result = asyncio.run(service.execute_step({"tool": "localization.recordCurrentPose", "args": {"name": "A"}}))

    assert result["point"]["name"] == "A"
    assert result["point"]["pose"]["frame"] == "map"
    assert service.poi_store.get_poi("A")["point"]["pose"]["x"] == 3.0


def test_lidar_sector_snapshot_filters_invalid_ranges():
    from robot_api.tools.lidar import compute_lidar_snapshot

    snapshot = compute_lidar_snapshot(
        {
            "frameId": "lidar_frame",
            "angleMin": -1.57079632679,
            "angleIncrement": 0.78539816339,
            "rangeMin": 0.02,
            "rangeMax": 10.0,
            "ranges": [float("nan"), 0.0, 0.4, 0.8, float("inf")],
            "receivedAt": "2026-07-18T00:00:00.000Z",
        }
    )

    assert snapshot["front"]["minDistanceMeters"] == 0.4
    assert snapshot["right"]["minDistanceMeters"] is None
    assert snapshot["left"]["minDistanceMeters"] == 0.8


def test_lidar_safety_stops_when_front_is_too_close():
    from robot_api.race.safety import check_front_stop

    result = check_front_stop(
        {
            "front": {"minDistanceMeters": 0.24},
            "left": {"minDistanceMeters": 1.0},
            "right": {"minDistanceMeters": 0.9},
        },
        front_stop_distance_meters=0.35,
    )

    assert result == {
        "ok": False,
        "nearestObstacleMeters": 0.24,
        "sector": "front",
        "thresholdMeters": 0.35,
        "stopReason": "front_obstacle_too_close",
    }


def test_lidar_handlers_read_snapshot_from_ros_adapter():
    import asyncio
    from robot_api.executor import RobotApiService

    result = asyncio.run(RobotApiService(FakeRos()).execute_step({"tool": "lidar.checkSafety", "args": {"frontStopDistanceMeters": 0.35}}))

    assert result["ok"] is False
    assert result["sector"] == "front"


def test_race_geometry_previews_closed_abcd_lap():
    from robot_api.race.geometry import preview_route

    points = {
        "A": {"pose": {"frame": "map", "x": 0.0, "y": 0.0, "thetaRad": 0.0}},
        "B": {"pose": {"frame": "map", "x": 1.0, "y": 0.0, "thetaRad": 0.0}},
        "C": {"pose": {"frame": "map", "x": 1.0, "y": 1.0, "thetaRad": 0.0}},
        "D": {"pose": {"frame": "map", "x": 0.0, "y": 1.0, "thetaRad": 0.0}},
    }

    preview = preview_route(points, ["A", "B", "C", "D", "A"])

    assert preview["totalDistanceMeters"] == 4.0
    assert [segment["from"] for segment in preview["segments"]] == ["A", "B", "C", "D"]
    assert preview["segments"][1]["headingRad"] == 1.5707963267948966


def test_lookahead_target_can_move_onto_next_segment_before_waypoint():
    from robot_api.race.geometry import lookahead_target

    route = [
        {"name": "A", "x": 0.0, "y": 0.0},
        {"name": "B", "x": 1.0, "y": 0.0},
        {"name": "C", "x": 1.0, "y": 1.0},
    ]

    target = lookahead_target({"x": 0.9, "y": 0.0}, route, current_segment_index=0, lookahead_meters=0.35)

    assert target["segmentIndex"] == 1
    assert target["point"]["x"] == 1.0
    assert round(target["point"]["y"], 2) == 0.25


def test_race_controller_command_slows_for_large_heading_error():
    from robot_api.race.controller import compute_velocity_command

    straight = compute_velocity_command(
        {"x": 0.0, "y": 0.0, "thetaRad": 0.0},
        {"x": 1.0, "y": 0.0},
        {"maxSpeedMps": 0.25, "minTurnSpeedMps": 0.08},
    )
    turn = compute_velocity_command(
        {"x": 0.0, "y": 0.0, "thetaRad": 0.0},
        {"x": 0.0, "y": 1.0},
        {"maxSpeedMps": 0.25, "minTurnSpeedMps": 0.08},
    )

    assert straight["linearX"] > turn["linearX"]
    assert turn["linearX"] == 0.08
    assert turn["angularZ"] > 0


def test_race_preview_tool_reads_saved_track(tmp_path):
    import asyncio
    from robot_api.executor import RobotApiService
    from robot_api.tools.poi import POIStore

    service = RobotApiService(FakeRos())
    service.poi_store = POIStore(tmp_path / "race_tracks.json")
    service.poi_tools.store = service.poi_store
    service.race_tools.poi_store = service.poi_store
    for name, x, y in [("A", 0, 0), ("B", 1, 0), ("C", 1, 1), ("D", 0, 1)]:
        service.poi_store.upsert_poi(name, {"frame": "map", "x": x, "y": y, "thetaRad": 0.0})
    service.poi_store.save_track("default-abcd", "ABCD", ["A", "B", "C", "D"])

    result = asyncio.run(service.execute_step({"tool": "race.previewLap", "args": {"trackId": "default-abcd"}}))

    assert result["trackId"] == "default-abcd"
    assert result["route"]["totalDistanceMeters"] == 4.0
    assert "提前看向下一个点" in result["childSummary"]


class FakeRos:
    def __init__(self):
        self.pose = SimpleNamespace(x=1.0, y=2.0, yaw=0.3)
        self.stop_calls = 0

    def state(self):
        return {"connected": True, "batteryRaw": 81, "pose": {"frame": "odom", "x": 1.0, "y": 2.0, "thetaRad": 0.3}}

    def publish_velocity(self, linear_x, angular_z):
        pass

    async def publish_stop(self):
        self.stop_calls += 1

    def localization_health(self):
        return {"hasMapPose": True}

    def lookup_map_pose(self):
        return {"frame": "map", "x": 3.0, "y": 4.0, "thetaRad": 0.5}

    def publish_initial_pose(self, pose, covariance_preset):
        self.initial_pose = (pose, covariance_preset)

    def lidar_snapshot(self):
        return {
            "front": {"minDistanceMeters": 0.2},
            "left": {"minDistanceMeters": 1.0},
            "right": {"minDistanceMeters": 0.8},
            "scanAgeMs": 10,
        }
