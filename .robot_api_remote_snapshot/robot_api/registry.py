from typing import Any, Dict, List, Optional

from .tools import base, lidar, localization, poi, race


class ToolRegistry:
    def __init__(self, tools: List[Dict[str, Any]]) -> None:
        self._tools = tools
        self._by_name = {tool['name']: tool for tool in tools}

    def list_tools(self) -> List[Dict[str, Any]]:
        return self._tools

    def get(self, name: str) -> Optional[Dict[str, Any]]:
        return self._by_name.get(name)


TOOLS = base.TOOLS + localization.TOOLS + poi.TOOLS + lidar.TOOLS + race.TOOLS
DEFAULT_REGISTRY = ToolRegistry(TOOLS)
TOOL_BY_NAME = {tool['name']: tool for tool in TOOLS}
