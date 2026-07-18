import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    navigation_share = get_package_share_directory('navigation')
    localization_launch = os.path.join(navigation_share, 'launch', 'include', 'localization.launch.py')
    params_file = os.path.join(navigation_share, 'config', 'nav2_params.yaml')

    return LaunchDescription([
        DeclareLaunchArgument('map', default_value='/home/ubuntu/ros2_ws/src/slam/maps/map_01.yaml'),
        DeclareLaunchArgument('use_sim_time', default_value='false'),
        Node(
            name='nav2_container',
            package='rclcpp_components',
            executable='component_container_isolated',
            parameters=[params_file, {'autostart': True}],
            arguments=['--ros-args', '--log-level', 'info'],
            remappings=[('/tf', 'tf'), ('/tf_static', 'tf_static')],
            output='screen',
        ),
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(localization_launch),
            launch_arguments={
                'namespace': '',
                'map': LaunchConfiguration('map'),
                'params_file': params_file,
                'use_sim_time': LaunchConfiguration('use_sim_time'),
                'use_namespace': 'false',
                'autostart': 'true',
                'container_name': 'nav2_container',
            }.items(),
        ),
    ])
