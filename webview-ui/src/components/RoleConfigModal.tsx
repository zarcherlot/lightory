import { useEffect, useState } from 'react';

import {
  buildWeatherTaskMarkdown,
  createDefaultRoleConfig,
  type RoleRuntimeConfig,
  type WeatherRoleConfig,
} from '../roleConfig.js';
import { getRoleDefinition } from '../roles.js';
import { Button } from './ui/Button.js';
import { Checkbox } from './ui/Checkbox.js';
import { Modal } from './ui/Modal.js';

interface RoleConfigModalProps {
  roleId: string | null;
  config?: RoleRuntimeConfig;
  onClose: () => void;
  onSave: (config: RoleRuntimeConfig) => void;
  onRunRole: (config: RoleRuntimeConfig) => void;
}

export function RoleConfigModal({
  roleId,
  config,
  onClose,
  onSave,
  onRunRole,
}: RoleConfigModalProps) {
  const role = roleId ? getRoleDefinition(roleId) : undefined;
  const [draft, setDraft] = useState<RoleRuntimeConfig>(() =>
    roleId ? (config ?? createDefaultRoleConfig(roleId)) : createDefaultRoleConfig('weather'),
  );

  useEffect(() => {
    if (!roleId) return;
    setDraft(config ?? createDefaultRoleConfig(roleId));
  }, [config, roleId]);

  if (!roleId || !role) return null;

  const weather = draft.weather;
  const save = () => {
    onSave(syncSimpleToMarkdown(draft));
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={role.name}
      className="w-[min(720px,calc(100vw-32px))] max-h-[calc(100vh-40px)] overflow-y-auto"
      zIndex={70}
    >
      <div className="px-10 pb-10">
        <div className="text-sm leading-tight text-text-muted mb-10">
          我负责：{role.responsibility}
        </div>

        <div className="flex gap-6 mb-12">
          <Button
            variant={draft.mode === 'simple' ? 'active' : 'default'}
            size="sm"
            onClick={() => setDraft((current) => ({ ...current, mode: 'simple' }))}
          >
            简单模式
          </Button>
          <Button
            variant={draft.mode === 'markdown' ? 'active' : 'default'}
            size="sm"
            onClick={() =>
              setDraft((current) => ({ ...syncSimpleToMarkdown(current), mode: 'markdown' }))
            }
          >
            Markdown 模式
          </Button>
        </div>

        {draft.mode === 'simple' ? (
          roleId === 'weather' && weather ? (
            <WeatherSimpleEditor
              config={weather}
              onChange={(nextWeather) =>
                setDraft((current) => ({
                  ...current,
                  weather: nextWeather,
                  markdown: buildWeatherTaskMarkdown(nextWeather),
                }))
              }
            />
          ) : (
            <div className="pixel-panel px-10 py-8 text-sm leading-tight text-text-muted">
              这个角色暂时没有表单配置，可切到 Markdown 模式调整任务说明。
            </div>
          )
        ) : (
          <textarea
            className="w-full h-260 resize-none bg-bg-dark border-2 border-border text-text p-10 text-sm leading-snug outline-none focus:border-accent"
            value={draft.markdown}
            onChange={(event) =>
              setDraft((current) => ({ ...current, markdown: event.target.value }))
            }
          />
        )}

        <div className="flex flex-wrap justify-end gap-6 mt-12">
          <Button variant="default" size="md" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="default"
            size="md"
            onClick={() => onRunRole(syncSimpleToMarkdown(draft))}
          >
            运行这个角色
          </Button>
          <Button variant="accent" size="md" onClick={save}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface WeatherSimpleEditorProps {
  config: WeatherRoleConfig;
  onChange: (config: WeatherRoleConfig) => void;
}

function WeatherSimpleEditor({ config, onChange }: WeatherSimpleEditorProps) {
  const update = (patch: Partial<WeatherRoleConfig>) => onChange({ ...config, ...patch });
  const updateOutput = (key: keyof WeatherRoleConfig['outputs']) =>
    onChange({
      ...config,
      outputs: { ...config.outputs, [key]: !config.outputs[key] },
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10">
      <label className="flex flex-col gap-4 text-sm leading-tight">
        城市
        <input
          className="bg-bg-dark border-2 border-border px-8 py-6 text-text outline-none focus:border-accent"
          value={config.city}
          onChange={(event) => update({ city: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-4 text-sm leading-tight">
        日期
        <select
          className="bg-bg-dark border-2 border-border px-8 py-6 text-text outline-none focus:border-accent"
          value={config.date}
          onChange={(event) => update({ date: event.target.value })}
        >
          <option value="今天">今天</option>
          <option value="明天">明天</option>
          <option value="后天">后天</option>
          <option value="本周末">本周末</option>
        </select>
      </label>

      <div className="md:col-span-2 pixel-panel">
        <div className="px-10 py-6 text-sm leading-tight text-text-muted border-b border-border">
          我会输出
        </div>
        <Checkbox
          checked={config.outputs.temperature}
          onChange={() => updateOutput('temperature')}
          label="温度"
        />
        <Checkbox
          checked={config.outputs.rain}
          onChange={() => updateOutput('rain')}
          label="是否下雨"
        />
        <Checkbox
          checked={config.outputs.wind}
          onChange={() => updateOutput('wind')}
          label="风力"
        />
        <Checkbox
          checked={config.outputs.airQuality}
          onChange={() => updateOutput('airQuality')}
          label="空气质量"
        />
      </div>
    </div>
  );
}

function syncSimpleToMarkdown(config: RoleRuntimeConfig): RoleRuntimeConfig {
  if (config.roleId !== 'weather' || !config.weather) return config;
  return {
    ...config,
    markdown: buildWeatherTaskMarkdown(config.weather),
  };
}
