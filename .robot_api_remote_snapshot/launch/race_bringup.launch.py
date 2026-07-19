import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, OpaqueFunction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration


def _package_path(package_name, source_path):
    if os.environ.get("need_compile", "False") == "True":
        return get_package_share_directory(package_name)
    return source_path


def launch_setup(context):
    os.environ.setdefault("need_compile", "False")
    os.environ.setdefault("MACHINE_TYPE", "LanderPi_Mecanum")
    os.environ.setdefault("LIDAR_TYPE", "MS200")
    os.environ.setdefault("DEPTH_CAMERA_TYPE", "aurora")

    controller_path = _package_path("controller", "/home/ubuntu/ros2_ws/src/driver/controller")
    peripherals_path = _package_path("peripherals", "/home/ubuntu/ros2_ws/src/peripherals")
    robot_api_path = _package_path("robot_api", "/home/ubuntu/ros2_ws/src/robot_api")

    use_sim_time = LaunchConfiguration("use_sim_time", default="false")
    map_file = LaunchConfiguration("map", default="/home/ubuntu/ros2_ws/src/slam/maps/map_01.yaml")

    controller_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(controller_path, "launch", "controller.launch.py")),
        launch_arguments={
            "namespace": "",
            "use_namespace": "false",
            "frame_prefix": "",
            "odom_frame": "odom",
            "base_frame": "base_footprint",
            "map_frame": "map",
            "imu_frame": "imu_link",
            "use_sim_time": use_sim_time,
            "enable_odom": "true",
        }.items(),
    )

    lidar_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(peripherals_path, "launch", "lidar.launch.py")),
        launch_arguments={
            "lidar_frame": "lidar_frame",
            "scan_topic": "scan",
            "scan_raw": "scan_raw",
        }.items(),
    )

    init_pose_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(controller_path, "launch", "init_pose.launch.py")),
        launch_arguments={
            "namespace": "",
            "use_namespace": "false",
            "action_name": "init",
        }.items(),
    )

    localization_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(robot_api_path, "launch", "race_localization.launch.py")),
        launch_arguments={
            "map": map_file,
            "use_sim_time": use_sim_time,
        }.items(),
    )

    robot_api_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(robot_api_path, "launch", "robot_api.launch.py")),
    )

    return [
        DeclareLaunchArgument("map", default_value="/home/ubuntu/ros2_ws/src/slam/maps/map_01.yaml"),
        DeclareLaunchArgument("use_sim_time", default_value="false"),
        controller_launch,
        lidar_launch,
        init_pose_launch,
        localization_launch,
        robot_api_launch,
    ]


def generate_launch_description():
    return LaunchDescription([OpaqueFunction(function=launch_setup)])
