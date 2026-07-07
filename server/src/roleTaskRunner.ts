import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { HookProvider } from '../../core/src/provider.js';
import type { RoleTaskInputCard, RoleTaskOverride } from './clientMessageHandler.js';

type WsSend = (message: Record<string, unknown>) => void;

const ROLE_TASK_FILES: Record<string, string> = {
  weather: 'weather.md',
  dresser: 'dresser.md',
  travel: 'travel.md',
  captain: 'captain.md',
};
const ROLE_TASK_TIMEOUT_MS = 120_000;
const WEATHER_LOOKUP_TIMEOUT_MS = 6_000;
const CODEX_ROLE_TASK_ENV = {
  modelProvider: 'LIGHTORY_CODEX_MODEL_PROVIDER',
  model: 'LIGHTORY_CODEX_MODEL',
  reasoningEffort: 'LIGHTORY_CODEX_REASONING_EFFORT',
  providerName: 'LIGHTORY_CODEX_PROVIDER_NAME',
  providerBaseUrl: 'LIGHTORY_CODEX_PROVIDER_BASE_URL',
  providerWireApi: 'LIGHTORY_CODEX_PROVIDER_WIRE_API',
  providerRequiresOpenAiAuth: 'LIGHTORY_CODEX_PROVIDER_REQUIRES_OPENAI_AUTH',
} as const;

export interface RoleTaskRunnerOptions {
  provider: HookProvider;
  rolesDir: string;
  cwd: string;
}

interface CommandSpec {
  command: string;
  args: string[];
  env?: Record<string, string>;
  displayCommand?: string;
  input?: string;
  outputPath?: string;
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
    if (roleId === 'weather') {
      emitStatus('started');
      void runWeatherRoleTask(taskMarkdown)
        .then((output) => {
          const failed = isRoleTaskFailureOutput(output);
          emit({
            status: failed ? 'error' : 'done',
            stream: failed ? 'stderr' : 'stdout',
            content: output.endsWith('\n') ? output : `${output}\n`,
          });
          emitStatus(failed ? 'error' : 'done', failed ? undefined : inferWeatherIcon(output));
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          const output = `天气卡：查询失败，天气服务暂时没有返回结果。请稍后重新查询。${message ? ` (${message})` : ''}`;
          emit({ status: 'error', stream: 'stderr', content: `${output}\n` });
          emitStatus('error');
        });
      return;
    }

    const prompt = buildRoleTaskPrompt(roleId, taskMarkdown, inputCards);
    const command = buildRoleTaskCommand(options.provider, prompt, options.cwd, runId);
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

    const child = spawn(command.command, command.args, {
      cwd: options.cwd,
      env: command.env ?? process.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Role task timed out after ${Math.round(ROLE_TASK_TIMEOUT_MS / 1000)} seconds.\n`,
      });
      child.kill();
    }, ROLE_TASK_TIMEOUT_MS);

    if (command.input !== undefined) {
      child.stdin.end(command.input);
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const content = chunk.toString();
      stderr += content;
      traceRoleTaskStderr(options.provider.id, runId, roleId, content);
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const commandName = command.displayCommand ?? command.command;
      const hint = errorMessageHasMissingCommand(error)
        ? missingCommandHint(options.provider.id)
        : '';
      emitStatus('error');
      emit({
        status: 'error',
        stream: 'stderr',
        content: `Failed to start ${commandName}: ${error.message}\n${hint}`,
      });
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (timedOut) {
        cleanupTaskOutput(command.outputPath);
        return;
      }
      const output = readTaskOutput(command.outputPath) || stdout.trim();
      const semanticFailure = isRoleTaskFailureOutput(output);
      const ok = code === 0 && !semanticFailure;
      const hint =
        code === 127 && options.provider.id === 'opencode'
          ? missingCommandHint(options.provider.id)
          : '';
      const errorOutput = stderr.trim() || stdout.trim();
      const content =
        signal !== null
          ? `Task stopped by signal ${signal}.`
          : ok
            ? output
            : [
                semanticFailure ? output : errorOutput,
                semanticFailure
                  ? 'Task output indicates the role did not complete successfully.'
                  : '',
                semanticFailure ? '' : `Task exited with code ${code ?? 'unknown'}.`,
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
      cleanupTaskOutput(command.outputPath);
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
    `Execute this ${roleId} role task using only the task text below.`,
    '',
    'Do not read local files. Do not list directories. Do not run shell commands.',
    'If the task needs current weather, use built-in web search only.',
    'Return only the final child-friendly card or checklist text.',
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

function buildRoleTaskCommand(
  provider: HookProvider,
  prompt: string,
  cwd: string,
  runId: string,
): CommandSpec | null {
  switch (provider.id) {
    case 'claude':
      return { command: 'claude', args: [prompt] };
    case 'codex':
      const outputPath = path.join(os.tmpdir(), `lightory-${runId}-last-message.txt`);
      return {
        command: 'codex',
        args: [
          'exec',
          ...buildCodexRoleTaskIsolationArgs(),
          '--color',
          'never',
          '--sandbox',
          'read-only',
          ...buildCodexRoleTaskConfigArgs(),
          '--cd',
          cwd,
          '--output-last-message',
          outputPath,
          '-',
        ],
        env: buildRoleTaskEnv({ CODEX_SESSION_ID: `pixel-role-${runId}`, PWD: cwd }),
        input: prompt,
        outputPath,
      };
    case 'opencode':
      const opencodeCommand = process.env['LIGHTORY_OPENCODE_BIN'] ?? 'opencode';
      return {
        command: opencodeCommand,
        args: ['run', prompt],
        env: buildRoleTaskEnv({ PWD: cwd }),
        displayCommand: opencodeCommand,
      };
    default:
      return null;
  }
}

function buildCodexRoleTaskIsolationArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  return env[CODEX_ROLE_TASK_ENV.modelProvider] ? ['--ignore-user-config'] : [];
}

function buildRoleTaskEnv(overrides: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') env[key] = value;
  }
  Object.assign(env, overrides);
  for (const key of Object.keys(env)) {
    if (key.startsWith('CODEX_') && key !== 'CODEX_SESSION_ID') {
      delete env[key];
    }
  }
  return env;
}

function buildCodexRoleTaskConfigArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  const args: string[] = [];
  const addConfig = (value: string | undefined, key: string, format = tomlString) => {
    if (!value) return;
    args.push('-c', `${key}=${format(value)}`);
  };

  const providerId = env[CODEX_ROLE_TASK_ENV.modelProvider];
  addConfig(providerId, 'model_provider');
  addConfig(env[CODEX_ROLE_TASK_ENV.model], 'model');
  addConfig(env[CODEX_ROLE_TASK_ENV.reasoningEffort], 'model_reasoning_effort');

  if (providerId) {
    addConfig(env[CODEX_ROLE_TASK_ENV.providerName], `model_providers.${providerId}.name`);
    addConfig(env[CODEX_ROLE_TASK_ENV.providerBaseUrl], `model_providers.${providerId}.base_url`);
    addConfig(env[CODEX_ROLE_TASK_ENV.providerWireApi], `model_providers.${providerId}.wire_api`);
    addConfig(
      env[CODEX_ROLE_TASK_ENV.providerRequiresOpenAiAuth],
      `model_providers.${providerId}.requires_openai_auth`,
      tomlBoolean,
    );
  }

  return args;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function tomlBoolean(value: string): string {
  return /^(1|true|yes)$/i.test(value) ? 'true' : 'false';
}

function errorMessageHasMissingCommand(error: Error): boolean {
  return 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

function missingCommandHint(providerId: string): string {
  if (providerId !== 'opencode') return '';
  return 'OpenCode CLI was not found. Install it, add it to PATH, set LIGHTORY_OPENCODE_BIN to its absolute path, or restart this server with --provider codex to run role tasks through Codex.\n';
}

function readTaskOutput(outputPath: string | undefined): string {
  if (!outputPath || !fs.existsSync(outputPath)) return '';
  return fs.readFileSync(outputPath, 'utf8').trim();
}

function cleanupTaskOutput(outputPath: string | undefined): void {
  if (!outputPath) return;
  try {
    fs.rmSync(outputPath, { force: true });
  } catch {
    // Best effort cleanup only.
  }
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
  buildCodexRoleTaskConfigArgs,
  buildCodexRoleTaskIsolationArgs,
  buildRoleTaskCommand,
  buildRoleTaskEnv,
  buildRoleTaskPrompt,
  describeWeatherCode,
  formatInputCards,
  inferWeatherIcon,
  parseWeatherQuery,
  runWeatherRoleTask,
};
