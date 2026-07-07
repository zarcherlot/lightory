export type RoleConfigMode = 'simple' | 'markdown';

export interface WeatherRoleConfig {
  city: string;
  date: string;
  outputs: {
    temperature: boolean;
    rain: boolean;
    wind: boolean;
    airQuality: boolean;
  };
}

export interface RoleRuntimeConfig {
  roleId: string;
  mode: RoleConfigMode;
  weather?: WeatherRoleConfig;
  markdown: string;
}

export const defaultWeatherRoleConfig: WeatherRoleConfig = {
  city: '上海',
  date: '明天',
  outputs: {
    temperature: true,
    rain: true,
    wind: true,
    airQuality: false,
  },
};

export function buildWeatherTaskMarkdown(config: WeatherRoleConfig): string {
  const outputItems = [
    config.outputs.temperature ? '温度' : null,
    config.outputs.rain ? '是否下雨' : null,
    config.outputs.wind ? '风力' : null,
    config.outputs.airQuality ? '空气质量' : null,
  ].filter(Boolean);

  return [
    '# 晴雨小侦探任务',
    '',
    '你是晴雨小侦探，随身带着放大镜和小云朵，负责侦查天空线索。',
    '',
    '任务：',
    '',
    `- 查询${config.city}${config.date}的天气。`,
    '- 输出一张简短的天气卡。',
    `- 天气卡必须包含：${outputItems.join('、') || '天气情况'}。`,
    '- 如果无法联网查询，请明确说明查询失败，并给出需要重新查询的提示。',
    '',
    '输出格式：',
    '',
    '天气卡：<天气摘要>',
  ].join('\n');
}

export function createDefaultRoleConfig(roleId: string): RoleRuntimeConfig {
  if (roleId === 'weather') {
    return {
      roleId,
      mode: 'simple',
      weather: defaultWeatherRoleConfig,
      markdown: buildWeatherTaskMarkdown(defaultWeatherRoleConfig),
    };
  }
  return {
    roleId,
    mode: 'simple',
    markdown: '',
  };
}
