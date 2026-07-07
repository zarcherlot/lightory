import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let tmpBase: string;

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return { ...actual, homedir: () => tmpBase };
});

const { areHooksInstalled, installHooks, uninstallHooks, copyHookScript } =
  await import('../src/providers/hook/codex/codexHookInstaller.js');

function readConfig(): string {
  return fs.readFileSync(path.join(tmpBase, '.codex', 'config.toml'), 'utf-8');
}

describe('codexHookInstaller', () => {
  beforeEach(() => {
    tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pxl-codex-hook-test-'));
    fs.mkdirSync(path.join(tmpBase, '.codex'), { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('installHooks adds managed hook tables to config.toml', () => {
    installHooks();
    const config = readConfig();

    expect(config).toContain('# >>> Pixel Agents Codex hooks >>>');
    expect(config).toContain('hooks.SessionStart =');
    expect(config).toContain('hooks.PreToolUse =');
    expect(config).toContain('hooks.PostToolUse =');
    expect(config).toContain('hooks.Stop =');
    expect(config).toContain('codex-hook.js');
  });

  it('installHooks preserves existing config and is idempotent', () => {
    fs.writeFileSync(path.join(tmpBase, '.codex', 'config.toml'), 'model = "gpt-5.5"\n');

    installHooks();
    installHooks();
    const config = readConfig();

    expect(config.startsWith('model = "gpt-5.5"')).toBe(true);
    expect(config.match(/hooks\.SessionStart =/gu)).toHaveLength(1);
  });

  it('installHooks writes hook keys before table sections so they stay top-level', () => {
    fs.writeFileSync(
      path.join(tmpBase, '.codex', 'config.toml'),
      'model = "gpt-5.5"\n\n[projects."/tmp/project"]\ntrust_level = "trusted"\n',
    );

    installHooks();
    const config = readConfig();

    expect(config.indexOf('hooks.SessionStart =')).toBeLessThan(
      config.indexOf('[projects."/tmp/project"]'),
    );
  });

  it('areHooksInstalled returns true after install', () => {
    installHooks();
    expect(areHooksInstalled()).toBe(true);
  });

  it('areHooksInstalled returns false before install', () => {
    expect(areHooksInstalled()).toBe(false);
  });

  it('uninstallHooks removes only the managed block', () => {
    fs.writeFileSync(
      path.join(tmpBase, '.codex', 'config.toml'),
      'model = "gpt-5.5"\n\n[projects."/tmp"]\ntrust_level = "trusted"\n',
    );

    installHooks();
    uninstallHooks();
    const config = readConfig();

    expect(config).toContain('model = "gpt-5.5"');
    expect(config).toContain('[projects."/tmp"]');
    expect(config).not.toContain('Pixel Agents Codex hooks');
    expect(config).not.toContain('codex-hook.js');
  });

  it('copyHookScript copies to ~/.pixel-agents/hooks/', () => {
    const mockExtPath = path.join(tmpBase, 'mock-ext');
    const hookSrc = path.join(mockExtPath, 'dist', 'hooks');
    fs.mkdirSync(hookSrc, { recursive: true });
    fs.writeFileSync(path.join(hookSrc, 'codex-hook.js'), '// mock hook script');

    copyHookScript(mockExtPath);

    const dst = path.join(tmpBase, '.pixel-agents', 'hooks', 'codex-hook.js');
    expect(fs.existsSync(dst)).toBe(true);
    expect(fs.readFileSync(dst, 'utf-8')).toBe('// mock hook script');
  });

  it('copyHookScript accepts a dist directory as the root path', () => {
    const mockDistPath = path.join(tmpBase, 'mock-ext', 'dist');
    const hookSrc = path.join(mockDistPath, 'hooks');
    fs.mkdirSync(hookSrc, { recursive: true });
    fs.writeFileSync(path.join(hookSrc, 'codex-hook.js'), '// mock hook script from dist');

    copyHookScript(mockDistPath);

    const dst = path.join(tmpBase, '.pixel-agents', 'hooks', 'codex-hook.js');
    expect(fs.existsSync(dst)).toBe(true);
    expect(fs.readFileSync(dst, 'utf-8')).toBe('// mock hook script from dist');
  });

  it('copyHookScript sets executable permissions', () => {
    if (process.platform === 'win32') return;

    const mockExtPath = path.join(tmpBase, 'mock-ext');
    const hookSrc = path.join(mockExtPath, 'dist', 'hooks');
    fs.mkdirSync(hookSrc, { recursive: true });
    fs.writeFileSync(path.join(hookSrc, 'codex-hook.js'), '// mock');

    copyHookScript(mockExtPath);

    const dst = path.join(tmpBase, '.pixel-agents', 'hooks', 'codex-hook.js');
    expect(fs.statSync(dst).mode & 0o100).toBeTruthy();
  });
});
