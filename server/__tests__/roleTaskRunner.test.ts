import { describe, expect, it } from 'vitest';

import { __test } from '../src/roleTaskRunner.js';

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
});
