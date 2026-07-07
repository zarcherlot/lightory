import * as fs from 'fs';
import * as path from 'path';

import { CONFIG_FILE_NAME, LAYOUT_FILE_DIR } from './constants.js';
import { getHomeDir } from './homeDir.js';

export interface AdapterSettings {
  soundEnabled: boolean;
  lastSeenVersion: string;
  alwaysShowLabels: boolean;
  watchAllSessions: boolean;
  hooksEnabled: boolean;
  hooksInfoShown: boolean;
}

/** All keys in AdapterSettings. Used by adapters to map `lightory.foo` -> `foo`. */
export const ADAPTER_SETTING_KEYS = [
  'soundEnabled',
  'lastSeenVersion',
  'alwaysShowLabels',
  'watchAllSessions',
  'hooksEnabled',
  'hooksInfoShown',
] as const;

export type AdapterSettingKey = (typeof ADAPTER_SETTING_KEYS)[number];

export interface LightoryConfig {
  settings: AdapterSettings;
  externalAssetDirectories: string[];
}

const DEFAULT_ADAPTER_SETTINGS: AdapterSettings = {
  soundEnabled: true,
  lastSeenVersion: '',
  alwaysShowLabels: false,
  watchAllSessions: false,
  hooksEnabled: true,
  hooksInfoShown: false,
};

function getConfigFilePath(): string {
  return path.join(getHomeDir(), LAYOUT_FILE_DIR, CONFIG_FILE_NAME);
}

/** Coerce a loose object into a valid AdapterSettings with defaults for missing/wrong-typed fields. */
function parseAdapterSettings(raw: unknown): AdapterSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdapterSettings>;
  return {
    soundEnabled:
      typeof obj.soundEnabled === 'boolean'
        ? obj.soundEnabled
        : DEFAULT_ADAPTER_SETTINGS.soundEnabled,
    lastSeenVersion:
      typeof obj.lastSeenVersion === 'string'
        ? obj.lastSeenVersion
        : DEFAULT_ADAPTER_SETTINGS.lastSeenVersion,
    alwaysShowLabels:
      typeof obj.alwaysShowLabels === 'boolean'
        ? obj.alwaysShowLabels
        : DEFAULT_ADAPTER_SETTINGS.alwaysShowLabels,
    watchAllSessions:
      typeof obj.watchAllSessions === 'boolean'
        ? obj.watchAllSessions
        : DEFAULT_ADAPTER_SETTINGS.watchAllSessions,
    hooksEnabled:
      typeof obj.hooksEnabled === 'boolean'
        ? obj.hooksEnabled
        : DEFAULT_ADAPTER_SETTINGS.hooksEnabled,
    hooksInfoShown:
      typeof obj.hooksInfoShown === 'boolean'
        ? obj.hooksInfoShown
        : DEFAULT_ADAPTER_SETTINGS.hooksInfoShown,
  };
}

export function readConfig(): LightoryConfig {
  const filePath = getConfigFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      return {
        settings: { ...DEFAULT_ADAPTER_SETTINGS },
        externalAssetDirectories: [],
      };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LightoryConfig> & {
      standalone?: unknown;
    };
    return {
      settings: parseAdapterSettings(parsed.settings ?? parsed.standalone),
      externalAssetDirectories: Array.isArray(parsed.externalAssetDirectories)
        ? parsed.externalAssetDirectories.filter((d): d is string => typeof d === 'string')
        : [],
    };
  } catch (err) {
    console.error('[Lightory] Failed to read config file:', err);
    return {
      settings: { ...DEFAULT_ADAPTER_SETTINGS },
      externalAssetDirectories: [],
    };
  }
}

export function writeConfig(config: LightoryConfig): void {
  const filePath = getConfigFilePath();
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const json = JSON.stringify(config, null, 2);
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error('[Lightory] Failed to write config file:', err);
  }
}
