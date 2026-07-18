import threading

import rclpy
from aiohttp import web

from .executor import RobotApiService
from .ros_adapter import RobotRosAdapter


def create_app(ros: RobotRosAdapter) -> web.Application:
    return RobotApiService(ros).app()


def main() -> None:
    rclpy.init()
    ros = RobotRosAdapter()
    spin_thread = threading.Thread(target=rclpy.spin, args=(ros,), daemon=True)
    spin_thread.start()
    try:
        web.run_app(create_app(ros), host='0.0.0.0', port=8088)
    finally:
        ros.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
