import { useEffect, useState } from 'react';

import {
  buildCaptainTaskMarkdown,
  buildDresserTaskMarkdown,
  buildTravelTaskMarkdown,
  buildWeatherTaskMarkdown,
  type CaptainRoleConfig,
  createDefaultRoleConfig,
  type DresserRoleConfig,
  type RoleRuntimeConfig,
  syncSimpleToMarkdown,
  type TravelRoleConfig,
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

  const save = () => {
    onSave(syncSimpleToMarkdown(draft));
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={role.name}
      className="w-[min(760px,calc(100vw-32px))] max-h-[calc(100vh-40px)] overflow-y-auto"
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
          <RoleSimpleEditor draft={draft} onChange={setDraft} />
        ) : (
          <textarea
            className="w-full h-300 resize-none bg-bg-dark border-2 border-border text-text p-10 text-sm leading-snug outline-none focus:border-accent"
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

interface RoleSimpleEditorProps {
  draft: RoleRuntimeConfig;
  onChange: (config: RoleRuntimeConfig) => void;
}

function RoleSimpleEditor({ draft, onChange }: RoleSimpleEditorProps) {
  switch (draft.simple.roleId) {
    case 'weather':
      return (
        <WeatherSimpleEditor
          config={draft.simple.weather}
          onChange={(weather) =>
            onChange({
              ...draft,
              simple: { roleId: 'weather', weather },
              markdown: buildWeatherTaskMarkdown(weather),
            })
          }
        />
      );
    case 'dresser':
      return (
        <DresserSimpleEditor
          config={draft.simple.dresser}
          onChange={(dresser) =>
            onChange({
              ...draft,
              simple: { roleId: 'dresser', dresser },
              markdown: buildDresserTaskMarkdown(dresser),
            })
          }
        />
      );
    case 'travel':
      return (
        <TravelSimpleEditor
          config={draft.simple.travel}
          onChange={(travel) =>
            onChange({
              ...draft,
              simple: { roleId: 'travel', travel },
              markdown: buildTravelTaskMarkdown(travel),
            })
          }
        />
      );
    case 'captain':
      return (
        <CaptainSimpleEditor
          config={draft.simple.captain}
          onChange={(captain) =>
            onChange({
              ...draft,
              simple: { roleId: 'captain', captain },
              markdown: buildCaptainTaskMarkdown(captain),
            })
          }
        />
      );
  }
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
    <SimpleGrid>
      <TextField label="城市" value={config.city} onChange={(city) => update({ city })} />
      <SelectField
        label="日期"
        value={config.date}
        options={['今天', '明天', '后天', '本周末']}
        onChange={(date) => update({ date })}
      />
      <OptionPanel title="天气卡包含">
        <Checkbox
          checked={config.outputs.condition}
          onChange={() => updateOutput('condition')}
          label="天气情况"
        />
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
      </OptionPanel>
    </SimpleGrid>
  );
}

interface DresserSimpleEditorProps {
  config: DresserRoleConfig;
  onChange: (config: DresserRoleConfig) => void;
}

function DresserSimpleEditor({ config, onChange }: DresserSimpleEditorProps) {
  const update = (patch: Partial<DresserRoleConfig>) => onChange({ ...config, ...patch });
  const updateOutput = (key: keyof DresserRoleConfig['outputs']) =>
    onChange({
      ...config,
      outputs: { ...config.outputs, [key]: !config.outputs[key] },
    });

  return (
    <SimpleGrid>
      <TextField
        label="活动场景"
        value={config.activity}
        onChange={(activity) => update({ activity })}
      />
      <SelectField
        label="穿衣风格"
        value={config.style}
        options={['舒服、方便活动', '保暖优先', '防雨优先', '清爽透气']}
        onChange={(style) => update({ style })}
      />
      <OptionPanel title="穿衣卡包含">
        <Checkbox checked={config.outputs.top} onChange={() => updateOutput('top')} label="上衣" />
        <Checkbox
          checked={config.outputs.bottom}
          onChange={() => updateOutput('bottom')}
          label="下装"
        />
        <Checkbox
          checked={config.outputs.shoes}
          onChange={() => updateOutput('shoes')}
          label="鞋子"
        />
        <Checkbox
          checked={config.outputs.accessories}
          onChange={() => updateOutput('accessories')}
          label="可选配件"
        />
      </OptionPanel>
    </SimpleGrid>
  );
}

interface TravelSimpleEditorProps {
  config: TravelRoleConfig;
  onChange: (config: TravelRoleConfig) => void;
}

function TravelSimpleEditor({ config, onChange }: TravelSimpleEditorProps) {
  const update = (patch: Partial<TravelRoleConfig>) => onChange({ ...config, ...patch });
  const updateOutput = (key: keyof TravelRoleConfig['outputs']) =>
    onChange({
      ...config,
      outputs: { ...config.outputs, [key]: !config.outputs[key] },
    });

  return (
    <SimpleGrid>
      <TextField
        label="目的地"
        value={config.destination}
        onChange={(destination) => update({ destination })}
      />
      <SelectField
        label="出行方式"
        value={config.transport}
        options={['步行或短途出行', '坐车出行', '骑行出行', '户外活动']}
        onChange={(transport) => update({ transport })}
      />
      <OptionPanel title="出行卡包含">
        <Checkbox
          checked={config.outputs.umbrella}
          onChange={() => updateOutput('umbrella')}
          label="是否带伞"
        />
        <Checkbox
          checked={config.outputs.waterBottle}
          onChange={() => updateOutput('waterBottle')}
          label="水杯"
        />
        <Checkbox
          checked={config.outputs.sunProtection}
          onChange={() => updateOutput('sunProtection')}
          label="防晒或防风"
        />
        <Checkbox
          checked={config.outputs.safety}
          onChange={() => updateOutput('safety')}
          label="安全提醒"
        />
      </OptionPanel>
    </SimpleGrid>
  );
}

interface CaptainSimpleEditorProps {
  config: CaptainRoleConfig;
  onChange: (config: CaptainRoleConfig) => void;
}

function CaptainSimpleEditor({ config, onChange }: CaptainSimpleEditorProps) {
  const update = (patch: Partial<CaptainRoleConfig>) => onChange({ ...config, ...patch });
  const updateOutput = (key: keyof CaptainRoleConfig['outputs']) =>
    onChange({
      ...config,
      outputs: { ...config.outputs, [key]: !config.outputs[key] },
    });

  return (
    <SimpleGrid>
      <TextField
        label="播报对象"
        value={config.audience}
        onChange={(audience) => update({ audience })}
      />
      <SelectField
        label="播报语气"
        value={config.tone}
        options={['有趣、亲切、像广播一样', '简短有力', '温柔提醒', '像故事开场一样']}
        onChange={(tone) => update({ tone })}
      />
      <OptionPanel title="广播包含">
        <Checkbox
          checked={config.outputs.weatherSummary}
          onChange={() => updateOutput('weatherSummary')}
          label="天气摘要"
        />
        <Checkbox
          checked={config.outputs.clothingSummary}
          onChange={() => updateOutput('clothingSummary')}
          label="穿衣摘要"
        />
        <Checkbox
          checked={config.outputs.travelSummary}
          onChange={() => updateOutput('travelSummary')}
          label="出行摘要"
        />
        <Checkbox
          checked={config.outputs.checklist}
          onChange={() => updateOutput('checklist')}
          label="最终准备清单"
        />
      </OptionPanel>
    </SimpleGrid>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-4 text-sm leading-tight">
      {label}
      <input
        className="bg-bg-dark border-2 border-border px-8 py-6 text-text outline-none focus:border-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-4 text-sm leading-tight">
      {label}
      <select
        className="bg-bg-dark border-2 border-border px-8 py-6 text-text outline-none focus:border-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SimpleGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10">{children}</div>;
}

function OptionPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 pixel-panel">
      <div className="px-10 py-6 text-sm leading-tight text-text-muted border-b border-border">
        {title}
      </div>
      {children}
    </div>
  );
}
