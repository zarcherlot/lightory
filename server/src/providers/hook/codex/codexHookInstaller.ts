import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { HOOK_SCRIPTS_DIR } from '../../../constants.js';
import { CODEX_HOOK_EVENTS, CODEX_HOOK_SCRIPT_NAME } from './constants.js';

const MANAGED_BLOCK_START = '# >>> Pixel Agents Codex hooks >>>';
const MANAGED_BLOCK_END = '# <<< Pixel Agents Codex hooks <<<';

function getCodexConfigPath(): string {
  return path.join(os.homedir(), '.codex', 'config.toml');
}

function getHookScriptPath(): string {
  return path.join(os.homedir(), HOOK_SCRIPTS_DIR, CODEX_HOOK_SCRIPT_NAME);
}

function readCodexConfig(): string {
  const configPath = getCodexConfigPath();
  try {
    if (fs.existsSync(configPath)) return fs.readFileSync(configPath, 'utf-8');
  } catch (e) {
    console.error(`[Pixel Agents] Failed to read Codex config: ${e}`);
  }
  return '';
}

function writeCodexConfig(contents: string): void {
  const configPath = getCodexConfigPath();
  const dir = path.dirname(configPath);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${configPath}.pixel-agents-tmp`;
    fs.writeFileSync(tmpPath, contents, 'utf-8');
    fs.renameSync(tmpPath, configPath);
  } catch (e) {
    console.error(`[Pixel Agents] Failed to write Codex config: ${e}`);
  }
}

function removeManagedBlock(contents: string): { contents: string; removed: boolean } {
  const start = contents.indexOf(MANAGED_BLOCK_START);
  if (start === -1) return { contents, removed: false };

  const end = contents.indexOf(MANAGED_BLOCK_END, start);
  if (end === -1) return { contents, removed: false };

  const afterEnd = end + MANAGED_BLOCK_END.length;
  const nextNewline = contents.indexOf('\n', afterEnd);
  const removeEnd = nextNewline === -1 ? contents.length : nextNewline + 1;
  const before = contents.slice(0, start).replace(/[ \t]+\n$/u, '\n');
  const after = contents.slice(removeEnd);
  return { contents: `${before}${after}`.replace(/\n{3,}/gu, '\n\n'), removed: true };
}

function makeHookCommand(): string {
  return `node "${getHookScriptPath()}"`;
}

function makeManagedBlock(): string {
  const command = makeHookCommand().replace(/\\/gu, '\\\\').replace(/"/gu, '\\"');
  const parts = [MANAGED_BLOCK_START];
  for (const event of CODEX_HOOK_EVENTS) {
    parts.push(
      `hooks.${event} = [`,
      '  { hooks = [',
      `    { type = "command", command = "${command}", timeout = 5 },`,
      '  ] },',
      ']',
      '',
    );
  }
  parts.push(MANAGED_BLOCK_END);
  return parts.join('\n');
}

function insertManagedBlock(contents: string, block: string): string {
  const trimmed = contents.trimEnd();
  if (!trimmed) return `${block}\n`;

  const firstTable = trimmed.search(/^\[/mu);
  if (firstTable === -1) return `${trimmed}\n\n${block}\n`;

  const beforeTables = trimmed.slice(0, firstTable).trimEnd();
  const tables = trimmed.slice(firstTable).trimStart();
  return `${beforeTables}${beforeTables ? '\n\n' : ''}${block}\n\n${tables}\n`;
}

function resolveBundledHookScript(rootPath: string): string {
  const extensionBundlePath = path.join(rootPath, 'dist', 'hooks', CODEX_HOOK_SCRIPT_NAME);
  if (fs.existsSync(extensionBundlePath)) return extensionBundlePath;
  return path.join(rootPath, 'hooks', CODEX_HOOK_SCRIPT_NAME);
}

export function areHooksInstalled(): boolean {
  const contents = readCodexConfig();
  if (!contents.includes(MANAGED_BLOCK_START) || !contents.includes(CODEX_HOOK_SCRIPT_NAME)) {
    return false;
  }
  return CODEX_HOOK_EVENTS.every((event) => contents.includes(`hooks.${event} =`));
}

export function installHooks(): void {
  const current = readCodexConfig();
  const withoutOldBlock = removeManagedBlock(current).contents;
  const next = insertManagedBlock(withoutOldBlock, makeManagedBlock());
  if (next !== current) {
    writeCodexConfig(next);
    console.log('[Pixel Agents] Codex hooks installed in ~/.codex/config.toml');
  }
}

export function uninstallHooks(): void {
  const current = readCodexConfig();
  const result = removeManagedBlock(current);
  if (result.removed) {
    writeCodexConfig(result.contents.trimEnd() ? `${result.contents.trimEnd()}\n` : '');
    console.log('[Pixel Agents] Codex hooks removed from ~/.codex/config.toml');
  }
}

export function copyHookScript(extensionPath: string): void {
  const src = resolveBundledHookScript(extensionPath);
  const dst = getHookScriptPath();
  const dstDir = path.dirname(dst);

  try {
    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true, mode: 0o700 });
    if (!fs.existsSync(src)) {
      console.warn(`[Pixel Agents] Codex hook script not found at ${src}`);
      return;
    }
    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o700);
    console.log(`[Pixel Agents] Codex hook script installed at ${dst}`);
  } catch (e) {
    console.error(`[Pixel Agents] Failed to copy Codex hook script: ${e}`);
  }
}
