import * as fs from 'fs';
import * as path from 'path';

import type { HookProvider } from '../../core/src/provider.js';
import type { RoleTaskInputCard, RoleTaskOverride } from './clientMessageHandler.js';
import { buildLlmRoleCommand, executeLlmRolePrompt } from './llmRoleExecutor.js';

type WsSend = (message: Record<string, unknown>) => void;

const ROLE_TASK_FILES: Record<string, string> = {
  coordinator: 'coordinator.md',
  weather: 'weather.md',
  dresser: 'dresser.md',
  travel: 'travel.md',
  captain: 'captain.md',
  navigator: 'navigator.md',
  encyclopedia: 'encyclopedia.md',
  calculator: 'calculator.md',
  translator: 'translator.md',
  storyteller: 'storyteller.md',
  poster: 'poster.md',
  checker: 'checker.md',
  summarizer: 'summarizer.md',
  questioner: 'questioner.md',
};
const ROLE_TASK_TIMEOUT_MS = 120_000;
const WEATHER_LOOKUP_TIMEOUT_MS = 6_000;
export interface RoleTaskRunnerOptions {
  provider: HookProvider;
  rolesDir: string;
  cwd: string;
}

export function createRoleTaskRunner(options: RoleTaskRunnerOptions) {
  return (
    roleId: string,
    send: WsSend,
    inputCards: RoleTaskInputCard[] = [],
    taskOverride?: RoleTaskOverride,
  ): void => {
    const relativeTaskFile = ROLE_TASK_FILES[roleId];
    const runId = `${roleId}-${Date.now().toString(36)}`;

    const emit = (message: Record<string, unknown>) => {
      send({ type: 'roleTaskConsole', runId, roleId, ...message });
    };
    const emitStatus = (status: string, weatherIcon?: string) => {
      send({ type: 'roleTaskStatus', runId, roleId, status, weatherIcon });
    };

    if (!relativeTaskFile) {
      emitStatus('error');
      emit({ status: 'error', stream: 'stderr', content: `Unknown role task: ${roleId}\n` });
      return;
    }

    const taskPath = path.join(options.rolesDir, relativeTaskFile);
    if (!taskOverride && !fs.existsSync(taskPath)) {
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Role task file not found: ${path.join('roles', relativeTaskFile)}\n`,
      });
      return;
    }

    const taskMarkdown = taskOverride?.markdown ?? fs.readFileSync(taskPath, 'utf8');
    const prompt = buildRoleTaskPrompt(roleId, taskMarkdown, inputCards);
    const command = buildLlmRoleCommand(options.provider, prompt, options.cwd, runId);
    if (!command) {
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Provider ${options.provider.displayName} cannot launch role tasks.\n`,
      });
      return;
    }

    emitStatus('started');

    void executeLlmRolePrompt({
      provider: options.provider,
      cwd: options.cwd,
      runId,
      prompt,
      timeoutMs: ROLE_TASK_TIMEOUT_MS,
      timeoutError: `Role task timed out after ${Math.round(ROLE_TASK_TIMEOUT_MS / 1000)} seconds.`,
      unavailableError: `Provider ${options.provider.displayName} cannot launch role tasks.`,
      onStderr: (content) => traceRoleTaskStderr(options.provider.id, runId, roleId, content),
    }).then((result) => {
      const output = result.ok ? result.output : '';
      const semanticFailure = isRoleTaskFailureOutput(output);
      const ok = result.ok && !semanticFailure;
      const hint =
        !result.ok &&
        (result.exitCode === 127 || result.errorCode === 'ENOENT') &&
        options.provider.id === 'opencode'
          ? missingCommandHint(options.provider.id)
          : '';
      const content =
        ok
          ? output
          : [
              semanticFailure ? output : result.ok ? '' : result.error,
              semanticFailure ? 'Task output indicates the role did not complete successfully.' : '',
              hint,
            ]
              .filter(Boolean)
              .join('\n');
      emit({
        status: ok ? 'done' : 'error',
        stream: ok ? 'stdout' : 'stderr',
        content: content.endsWith('\n') ? content : `${content}\n`,
      });
      emitStatus(ok ? 'done' : 'error', ok ? inferWeatherIcon(output) : undefined);
    });
  };
}

function formatInputCards(inputCards: RoleTaskInputCard[]): string {
  if (inputCards.length === 0) {
    return 'Input cards received from upstream roles: none.';
  }
  return [
    'Input cards received from upstream roles:',
    ...inputCards.map(
      (input) =>
        `- ${input.card} from ${input.sourceRoleId}:\n${input.content.trim() || '(empty card)'}`,
    ),
  ].join('\n');
}

function buildRoleTaskPrompt(
  roleId: string,
  taskMarkdown: string,
  inputCards: RoleTaskInputCard[],
): string {
  return [
    `You are running the ${roleId} role in a desktop robot console.`,
    '',
    'Stay in character and speak directly to the user in natural Chinese.',
    'If the user is chatting, reply conversationally as this role, not like a generic chatbot.',
    'If the user gives a robot operation request, follow the role instructions and produce the role-specific plan, decision, or handoff.',
    'Do not claim the robot has executed a physical action unless an execution result is present in the inputs.',
    'Do not read local files. Do not list directories. Do not run shell commands.',
    'Return only the role response that should appear in the console.',
    '',
    formatInputCards(inputCards),
    '',
    taskMarkdown,
  ].join('\n');
}

function traceRoleTaskStderr(
  providerId: string,
  runId: string,
  roleId: string,
  content: string,
): void {
  if (providerId !== 'codex') return;
  const trimmed = content.trim();
  if (!trimmed) return;
  console.error(`[Lightory] roleTask stderr run=${runId} role=${roleId}\n${trimmed}`);
}

function isRoleTaskFailureOutput(output: string): boolean {
  const normalized = output.trim().toLowerCase();
  if (!normalized) return true;
  return [
    '查询失败',
    '无法联网',
    '无法获取',
    '稍后重新查询',
    'failed to',
    'cannot access',
    'could not',
    'unable to',
  ].some((token) => normalized.includes(token));
}

interface WeatherQuery {
  city: string;
  dateText: string;
  date: string;
}

interface GeocodeResponse {
  results?: Array<{
    latitude?: number;
    longitude?: number;
    name?: string;
    country?: string;
  }>;
}

interface ForecastResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
}

async function runWeatherRoleTask(taskMarkdown: string): Promise<string> {
  const query = parseWeatherQuery(taskMarkdown);
  const location = await geocodeCity(query.city);
  const forecast = await fetchForecast(location.latitude, location.longitude);
  const daily = forecast.daily;
  const index = daily?.time?.findIndex((date) => date === query.date) ?? -1;
  if (!daily || index < 0) {
    return `天气卡：查询失败，没找到${query.city}${query.dateText}的天气预报。请稍后重新查询。`;
  }

  const weatherCode = daily.weather_code?.[index];
  const condition = describeWeatherCode(weatherCode);
  const min = formatTemperature(daily.temperature_2m_min?.[index]);
  const max = formatTemperature(daily.temperature_2m_max?.[index]);
  const rainProbability = daily.precipitation_probability_max?.[index];
  const windSpeed = daily.wind_speed_10m_max?.[index];
  const rainText =
    typeof rainProbability === 'number'
      ? rainProbability >= 50
        ? `可能下雨（概率${Math.round(rainProbability)}%）`
        : `不太可能下雨（概率${Math.round(rainProbability)}%）`
      : condition.includes('雨')
        ? '可能下雨'
        : '不太可能下雨';
  const windText =
    typeof windSpeed === 'number'
      ? `${Math.round(windSpeed)} km/h，约${windSpeedToScale(windSpeed)}级风`
      : '暂无风力数据';
  const airQualityText = taskMarkdown.includes('空气质量') ? '，空气质量暂无数据' : '';

  return `天气卡：${location.name || query.city}${query.dateText} ${condition}，温度${min}-${max}，${rainText}，风力${windText}${airQualityText}。`;
}

function parseWeatherQuery(taskMarkdown: string, now = new Date()): WeatherQuery {
  const normalized = taskMarkdown.replace(/\s+/g, '');
  const match =
    normalized.match(
      /查询(.+?)(今天|明天|后天|大后天|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}月\d{1,2}日)的天气/,
    ) ?? normalized.match(/查询(.+?)天气/);
  const city = (match?.[1] ?? '上海').replace(/[，。,.：:]+$/g, '') || '上海';
  const dateText = match?.[2] ?? '明天';
  return { city, dateText, date: resolveWeatherDate(dateText, now) };
}

function resolveWeatherDate(dateText: string, now: Date): string {
  const relativeDays: Record<string, number> = { 今天: 0, 明天: 1, 后天: 2, 大后天: 3 };
  if (dateText in relativeDays) return addDaysIso(now, relativeDays[dateText]);

  const isoMatch = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const monthDayMatch = dateText.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (monthDayMatch) {
    const year = now.getFullYear();
    return `${year}-${monthDayMatch[1].padStart(2, '0')}-${monthDayMatch[2].padStart(2, '0')}`;
  }

  return addDaysIso(now, 1);
}

function addDaysIso(now: Date, days: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function geocodeCity(city: string): Promise<{
  latitude: number;
  longitude: number;
  name: string;
}> {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'zh',
    format: 'json',
  });
  const response = await fetchJsonWithTimeout<GeocodeResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
  );
  const first = response.results?.[0];
  if (typeof first?.latitude !== 'number' || typeof first.longitude !== 'number') {
    throw new Error(`找不到城市：${city}`);
  }
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    name: first.name ?? city,
  };
}

async function fetchForecast(latitude: number, longitude: number): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  return fetchJsonWithTimeout<ForecastResponse>(`https://api.open-meteo.com/v1/forecast?${params}`);
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`天气服务 HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function formatTemperature(value: number | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)}°C` : '?°C';
}

function describeWeatherCode(code: number | undefined): string {
  if (code === undefined) return '天气未知';
  if (code === 0) return '晴';
  if ([1, 2].includes(code)) return '多云';
  if (code === 3) return '阴';
  if ([45, 48].includes(code)) return '有雾';
  if ([51, 53, 55, 56, 57].includes(code)) return '毛毛雨';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '有雨';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '有雪';
  if ([95, 96, 99].includes(code)) return '雷雨';
  return '天气未知';
}

function windSpeedToScale(kmh: number): number {
  if (kmh < 1) return 0;
  if (kmh < 6) return 1;
  if (kmh < 12) return 2;
  if (kmh < 20) return 3;
  if (kmh < 29) return 4;
  if (kmh < 39) return 5;
  if (kmh < 50) return 6;
  if (kmh < 62) return 7;
  if (kmh < 75) return 8;
  if (kmh < 89) return 9;
  if (kmh < 103) return 10;
  if (kmh < 118) return 11;
  return 12;
}

function missingCommandHint(providerId: string): string {
  if (providerId !== 'opencode') return '';
  return 'OpenCode CLI was not found. Install it, add it to PATH, set LIGHTORY_OPENCODE_BIN to its absolute path, or restart this server with --provider codex to run role tasks through Codex.\n';
}

function inferWeatherIcon(output: string): string {
  const text = output.toLowerCase();
  if (hasAny(text, ['⛈', '🌩', 'thunder', 'storm', '雷', '暴风'])) return 'storm';
  if (hasAny(text, ['❄', '🌨', 'snow', 'sleet', '雪', '雨夹雪'])) return 'snow';
  if (hasAny(text, ['☔', '🌧', 'rain', 'drizzle', 'shower', '雨', '阵雨'])) return 'rain';
  if (hasAny(text, ['☀', '🌞', 'sunny', 'sun', 'clear', '晴'])) return 'sun';
  if (hasAny(text, ['⛅', '🌤', '🌥', '☁', '🌫', 'cloud', 'overcast', 'fog', '阴', '云', '雾'])) {
    return 'cloud';
  }
  return 'cloud';
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

export const __test = {
  buildRoleTaskPrompt,
  describeWeatherCode,
  formatInputCards,
  inferWeatherIcon,
  parseWeatherQuery,
  runWeatherRoleTask,
};
