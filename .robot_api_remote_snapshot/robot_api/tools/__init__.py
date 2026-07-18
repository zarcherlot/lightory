from . import base, lidar, localization, poi, race

TOOLS = base.TOOLS + localization.TOOLS + poi.TOOLS + lidar.TOOLS + race.TOOLS
TOOL_BY_NAME = {tool['name']: tool for tool in TOOLS}

__all__ = ['TOOLS', 'TOOL_BY_NAME', 'base', 'localization', 'poi', 'lidar', 'race']
