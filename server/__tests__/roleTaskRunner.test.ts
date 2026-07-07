import { describe, expect, it } from 'vitest';

import type { HookProvider } from '../../core/src/provider.js';
import { __test } from '../src/roleTaskRunner.js';

const codexProvider = {
  id: 'codex',
  displayName: 'Codex',
} as HookProvider;

describe('roleTaskRunner', () => {
  it.each([
    ['Shanghai today: ☀️ +31°C', 'sun'],
    ['上海今天：晴，31°C', 'sun'],
    ['clear sky with a few clouds', 'sun'],
    ['Shanghai: 🌧 +24°C', 'rain'],
    ['light snow', 'snow'],
    ['thunderstorm', 'storm'],
    ['overcast clouds', 'cloud'],
  ])('infers %s as %s', (output, icon) => {
    expect(__test.inferWeatherIcon(output)).toBe(icon);
  });

  it('runs Codex role tasks with user config by default and stdin prompt', () => {
    const command = __test.buildRoleTaskCommand(codexProvider, 'hello role', 'D:\\repo', 'run-1');

    expect(command?.command).toBe('codex');
    expect(command?.args).toEqual(
      expect.arrayContaining([
        'exec',
        '--sandbox',
        'read-only',
        '--cd',
        'D:\\repo',
        '--output-last-message',
        '-',
      ]),
    );
    expect(command?.args).not.toContain('--ignore-user-config');
    expect(command?.input).toBe('hello role');
  });

  it('isolates user config when LIGHTORY_CODEX_MODEL_PROVIDER is configured', () => {
    expect(
      __test.buildCodexRoleTaskIsolationArgs({
        LIGHTORY_CODEX_MODEL_PROVIDER: 'local_provider',
      }),
    ).toEqual(['--ignore-user-config']);
  });

  it('does not inherit parent Codex runtime environment into role task processes', () => {
    const env = __test.buildRoleTaskEnv({
      CODEX_SESSION_ID: 'pixel-role-test',
      PWD: '/repo',
    });

    expect(env.CODEX_SESSION_ID).toBe('pixel-role-test');
    expect(env.PWD).toBe('/repo');
    expect(env.CODEX_SANDBOX).toBeUndefined();
    expect(env.CODEX_SANDBOX_NETWORK_DISABLED).toBeUndefined();
    expect(env.CODEX_THREAD_ID).toBeUndefined();
  });

  it('builds Codex config overrides from LIGHTORY_CODEX environment variables', () => {
    expect(
      __test.buildCodexRoleTaskConfigArgs({
        LIGHTORY_CODEX_MODEL_PROVIDER: 'local_provider',
        LIGHTORY_CODEX_MODEL: 'gpt-test',
        LIGHTORY_CODEX_REASONING_EFFORT: 'low',
        LIGHTORY_CODEX_PROVIDER_NAME: 'Local Provider',
        LIGHTORY_CODEX_PROVIDER_BASE_URL: 'https://example.test/v1',
        LIGHTORY_CODEX_PROVIDER_WIRE_API: 'responses',
        LIGHTORY_CODEX_PROVIDER_REQUIRES_OPENAI_AUTH: 'true',
      }),
    ).toEqual([
      '-c',
      'model_provider="local_provider"',
      '-c',
      'model="gpt-test"',
      '-c',
      'model_reasoning_effort="low"',
      '-c',
      'model_providers.local_provider.name="Local Provider"',
      '-c',
      'model_providers.local_provider.base_url="https://example.test/v1"',
      '-c',
      'model_providers.local_provider.wire_api="responses"',
      '-c',
      'model_providers.local_provider.requires_openai_auth=true',
    ]);
  });

  it('formats upstream role input cards for the task prompt', () => {
    expect(
      __test.formatInputCards([
        {
          sourceRoleId: 'weather',
          card: 'weather-card',
          content: 'rainy and windy',
        },
      ]),
    ).toBe(
      'Input cards received from upstream roles:\n- weather-card from weather:\nrainy and windy',
    );
  });

  it('builds a role task prompt from runtime markdown overrides', () => {
    const prompt = __test.buildRoleTaskPrompt('weather', '查询杭州明天的天气。', [
      {
        sourceRoleId: 'captain',
        card: 'plan-card',
        content: 'bring a water bottle',
      },
    ]);

    expect(prompt).toContain('Execute this weather role task');
    expect(prompt).toContain('plan-card from captain');
    expect(prompt).toContain('bring a water bottle');
    expect(prompt).toContain('查询杭州明天的天气。');
  });

  it('parses weather city and relative date from role markdown', () => {
    expect(
      __test.parseWeatherQuery('任务：查询上海明天的天气。', new Date('2026-07-07T08:00:00')),
    ).toEqual({
      city: '上海',
      dateText: '明天',
      date: '2026-07-08',
    });
  });

  it('runs weather role tasks through direct weather lookup', async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith('https://geocoding-api.open-meteo.com/')) {
        return new Response(
          JSON.stringify({ results: [{ latitude: 31.23, longitude: 121.47, name: '上海' }] }),
        );
      }
      if (url.startsWith('https://api.open-meteo.com/')) {
        return new Response(
          JSON.stringify({
            daily: {
              time: ['2026-07-08'],
              weather_code: [61],
              temperature_2m_max: [31.4],
              temperature_2m_min: [25.2],
              precipitation_probability_max: [70],
              wind_speed_10m_max: [18],
            },
          }),
        );
      }
      return new Response('', { status: 404 });
    }) as typeof fetch;

    try {
      const output = await __test.runWeatherRoleTask('任务：查询上海2026-07-08的天气。');

      expect(output).toContain('天气卡：上海2026-07-08 有雨');
      expect(output).toContain('温度25°C-31°C');
      expect(output).toContain('可能下雨（概率70%）');
      expect(calls).toHaveLength(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
