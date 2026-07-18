import asyncio
import math
import time
from typing import Any, Dict, Optional

import rclpy
from geometry_msgs.msg import PoseWithCovarianceStamped, Twist
from nav_msgs.msg import Odometry
from rclpy.duration import Duration
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import LaserScan
from std_msgs.msg import UInt16
from tf2_ros import Buffer, TransformException, TransformListener

from .schemas import CMD_PERIOD_SEC, STOP_PUBLISHES, Pose2D
from .tools.lidar import compute_lidar_snapshot


class RobotRosAdapter(Node):
    def __init__(self) -> None:
        super().__init__('robot_api_adapter')
        self.cmd_pub = self.create_publisher(Twist, '/controller/cmd_vel', 1)
        self.initial_pose_pub = self.create_publisher(PoseWithCovarianceStamped, '/initialpose', 1)
        self.create_subscription(Odometry, '/odom', self._odom_callback, 10)
        self.create_subscription(UInt16, '/ros_robot_controller/battery', self._battery_callback, 10)
        self.create_subscription(LaserScan, '/scan', self._scan_callback, qos_profile_sensor_data)
        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)
        self.pose: Optional[Pose2D] = None
        self.battery: Optional[int] = None
        self.last_scan_at: Optional[float] = None
        self.last_scan: Optional[Dict[str, Any]] = None

    def _odom_callback(self, msg: Odometry) -> None:
        q = msg.pose.pose.orientation
        yaw = math.atan2(
            2.0 * (q.w * q.z + q.x * q.y),
            1.0 - 2.0 * (q.y * q.y + q.z * q.z),
        )
        self.pose = Pose2D(msg.pose.pose.position.x, msg.pose.pose.position.y, yaw)

    def _battery_callback(self, msg: UInt16) -> None:
        self.battery = int(msg.data)

    def _scan_callback(self, msg: LaserScan) -> None:
        self.last_scan_at = time.monotonic()
        self.last_scan = {
            'frameId': msg.header.frame_id,
            'angleMin': float(msg.angle_min),
            'angleIncrement': float(msg.angle_increment),
            'rangeMin': float(msg.range_min),
            'rangeMax': float(msg.range_max),
            'ranges': list(msg.ranges),
            'receivedAt': now_iso(),
            'scanAgeMs': 0,
        }

    def publish_velocity(self, linear_x: float, angular_z: float) -> None:
        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.angular.z = float(angular_z)
        self.cmd_pub.publish(msg)

    def publish_initial_pose(self, pose: Dict[str, Any], covariance_preset: str = 'normal') -> None:
        covariance = 0.05 if covariance_preset == 'confident' else 0.25
        yaw = float(pose['thetaRad'])
        msg = PoseWithCovarianceStamped()
        msg.header.frame_id = 'map'
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.pose.pose.position.x = float(pose['x'])
        msg.pose.pose.position.y = float(pose['y'])
        msg.pose.pose.orientation.z = math.sin(yaw / 2.0)
        msg.pose.pose.orientation.w = math.cos(yaw / 2.0)
        msg.pose.covariance[0] = covariance
        msg.pose.covariance[7] = covariance
        msg.pose.covariance[35] = 0.0685389 if covariance_preset == 'confident' else 0.2741556
        self.initial_pose_pub.publish(msg)

    def lookup_map_pose(self) -> Dict[str, Any]:
        try:
            transform = self.tf_buffer.lookup_transform('map', 'base_footprint', rclpy.time.Time(), timeout=Duration(seconds=0.2))
        except TransformException as exc:
            raise RuntimeError(f'AMCL map pose is unavailable: {exc}') from exc
        translation = transform.transform.translation
        rotation = transform.transform.rotation
        yaw = math.atan2(
            2.0 * (rotation.w * rotation.z + rotation.x * rotation.y),
            1.0 - 2.0 * (rotation.y * rotation.y + rotation.z * rotation.z),
        )
        return {
            'frame': 'map',
            'x': float(translation.x),
            'y': float(translation.y),
            'thetaRad': yaw,
            'recordedAt': now_iso(),
        }

    def localization_health(self) -> Dict[str, Any]:
        topics = {name: types for name, types in self.get_topic_names_and_types()}
        has_scan = '/scan' in topics or '/scan_raw' in topics
        scan_age_ms = None if self.last_scan_at is None else int((time.monotonic() - self.last_scan_at) * 1000)
        map_pose = None
        map_pose_error = None
        try:
            map_pose = self.lookup_map_pose()
        except Exception as exc:
            map_pose_error = str(exc)
        return {
            'mapFrame': 'map',
            'baseFrame': 'base_footprint',
            'hasInitialPosePublisher': True,
            'hasScanTopic': has_scan,
            'scanAgeMs': scan_age_ms,
            'hasOdomPose': self.pose is not None,
            'hasMapPose': map_pose is not None,
            'mapPose': map_pose,
            'mapPoseError': map_pose_error,
            'topics': {
                'amclPose': '/amcl_pose' in topics,
                'map': '/map' in topics,
                'scan': '/scan' in topics,
                'scanRaw': '/scan_raw' in topics,
                'tf': '/tf' in topics,
            },
        }

    def lidar_snapshot(self) -> Dict[str, Any]:
        if self.last_scan is None:
            raise RuntimeError('No lidar scan has been received yet.')
        scan = dict(self.last_scan)
        scan['scanAgeMs'] = None if self.last_scan_at is None else int((time.monotonic() - self.last_scan_at) * 1000)
        return compute_lidar_snapshot(scan)

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


def now_iso() -> str:
    return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
