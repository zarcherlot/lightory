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

  it('runs Codex role tasks with isolated user config and stdin prompt', () => {
    const command = __test.buildRoleTaskCommand(codexProvider, 'hello role', 'D:\\repo', 'run-1');

    expect(command?.command).toBe('codex');
    expect(command?.args).toEqual(
      expect.arrayContaining([
        'exec',
        '--ignore-user-config',
        '--sandbox',
        'read-only',
        '--cd',
        'D:\\repo',
        '--output-last-message',
        '-',
      ]),
    );
    expect(command?.args).not.toContain('model_provider="my_codex"');
    expect(command?.input).toBe('hello role');
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
});
