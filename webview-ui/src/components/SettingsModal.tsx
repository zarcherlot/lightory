import { useEffect, useState } from 'react';

import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js';
import { normalizeRobotHttpBaseUrl } from '../robot/robotBaseUrl.js';
import type { RobotConnectionConfig, RobotToolDefinition } from '../robot/types.js';
import { transport } from '../transport/index.js';
import { Button } from './ui/Button.js';
import { Checkbox } from './ui/Checkbox.js';
import { MenuItem } from './ui/MenuItem.js';
import { Modal } from './ui/Modal.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDebugMode: boolean;
  onToggleDebugMode: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  showRoleVisualizer: boolean;
  onToggleRoleVisualizer: () => void;
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
  hooksEnabled: boolean;
  onToggleHooksEnabled: () => void;
  robotConfig: RobotConnectionConfig;
  robotConnected: boolean;
  robotStatusText: string;
  robotTools: RobotToolDefinition[];
  onRobotConfigChange: (config: RobotConnectionConfig) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDebugMode,
  onToggleDebugMode,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  showRoleVisualizer,
  onToggleRoleVisualizer,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
  hooksEnabled,
  onToggleHooksEnabled,
  robotConfig,
  robotConnected,
  robotStatusText,
  robotTools,
  onRobotConfigChange,
}: SettingsModalProps) {
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled);
  const [draftRobotConfig, setDraftRobotConfig] = useState(robotConfig);

  useEffect(() => {
    if (isOpen) setDraftRobotConfig(robotConfig);
  }, [isOpen, robotConfig]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <MenuItem
        onClick={() => {
          transport.send({ type: 'openSessionsFolder' });
          onClose();
        }}
      >
        Open Sessions Folder
      </MenuItem>
      <MenuItem
        onClick={() => {
          transport.send({ type: 'exportLayout' });
          onClose();
        }}
      >
        Export Layout
      </MenuItem>
      <MenuItem
        onClick={() => {
          transport.send({ type: 'importLayout' });
          onClose();
        }}
      >
        Import Layout
      </MenuItem>
      <MenuItem
        onClick={() => {
          transport.send({ type: 'addExternalAssetDirectory' });
          onClose();
        }}
      >
        Add Asset Directory
      </MenuItem>
      {externalAssetDirectories.map((dir) => (
        <div key={dir} className="flex items-center justify-between py-4 px-10 gap-8">
          <span
            className="text-xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap"
            title={dir}
          >
            {dir.split(/[/\\]/).pop() ?? dir}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transport.send({ type: 'removeExternalAssetDirectory', path: dir })}
            className="shrink-0"
          >
            x
          </Button>
        </div>
      ))}
      <Checkbox
        label="Sound Notifications"
        checked={soundLocal}
        onChange={() => {
          const newVal = !isSoundEnabled();
          setSoundEnabled(newVal);
          setSoundLocal(newVal);
          transport.send({ type: 'setSoundEnabled', enabled: newVal });
        }}
      />
      <Checkbox
        label="Watch All Sessions"
        checked={watchAllSessions}
        onChange={onToggleWatchAllSessions}
      />
      <Checkbox
        label="Instant Detection (Hooks)"
        checked={hooksEnabled}
        onChange={onToggleHooksEnabled}
      />
      <Checkbox
        label="Always Show Labels"
        checked={alwaysShowOverlay}
        onChange={onToggleAlwaysShowOverlay}
      />
      <Checkbox
        label="Role Visualizer"
        checked={showRoleVisualizer}
        onChange={onToggleRoleVisualizer}
      />
      <Checkbox label="Debug View" checked={isDebugMode} onChange={onToggleDebugMode} />
      <div className="mt-10 pt-8 border-t-2 border-border">
        <div className="px-10 mb-6 flex items-center justify-between gap-8">
          <span className="text-sm text-text">Robot API</span>
          <span
            className={robotConnected ? 'text-2xs text-status-success' : 'text-2xs text-text-muted'}
          >
            {robotStatusText}
          </span>
        </div>
        <Checkbox
          label="Use Mock Robot"
          checked={draftRobotConfig.mode === 'mock'}
          onChange={() =>
            setDraftRobotConfig((prev) => ({
              ...prev,
              mode: prev.mode === 'mock' ? 'real' : 'mock',
            }))
          }
        />
        <label className="block px-10 py-4 text-2xs text-text-muted">
          Base URL
          <input
            className="mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent"
            value={draftRobotConfig.baseUrl}
            onChange={(event) =>
              setDraftRobotConfig((prev) => ({ ...prev, baseUrl: event.target.value }))
            }
            disabled={draftRobotConfig.mode === 'mock'}
          />
        </label>
        <label className="block px-10 py-4 text-2xs text-text-muted">
          Map ID
          <input
            className="mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent"
            value={draftRobotConfig.mapId}
            onChange={(event) =>
              setDraftRobotConfig((prev) => ({ ...prev, mapId: event.target.value }))
            }
            disabled={draftRobotConfig.mode === 'mock'}
          />
        </label>
        <label className="block px-10 py-4 text-2xs text-text-muted">
          Token
          <input
            className="mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent"
            value={draftRobotConfig.token}
            onChange={(event) =>
              setDraftRobotConfig((prev) => ({ ...prev, token: event.target.value }))
            }
            disabled={draftRobotConfig.mode === 'mock'}
          />
        </label>
        <label className="block px-10 py-4 text-2xs text-text-muted">
          Certificate Fingerprint
          <input
            className="mt-2 w-full bg-bg-dark border-2 border-border px-6 py-4 text-xs text-text outline-none focus:border-accent"
            value={draftRobotConfig.certificateFingerprint}
            onChange={(event) =>
              setDraftRobotConfig((prev) => ({
                ...prev,
                certificateFingerprint: event.target.value,
              }))
            }
            disabled={draftRobotConfig.mode === 'mock'}
          />
        </label>
        <div className="px-10 py-4">
          <Button
            size="sm"
            variant="accent"
            onClick={() =>
              onRobotConfigChange({
                ...draftRobotConfig,
                baseUrl:
                  draftRobotConfig.mode === 'mock'
                    ? draftRobotConfig.baseUrl
                    : normalizeRobotHttpBaseUrl(draftRobotConfig.baseUrl),
              })
            }
          >
            Save Robot
          </Button>
        </div>
        <div className="px-10 py-4 max-h-120 overflow-y-auto">
          {robotTools.length === 0 ? (
            <div className="text-2xs text-text-muted">No robot tools loaded.</div>
          ) : (
            robotTools.map((tool) => (
              <div key={tool.name} className="py-2 border-b border-border/60">
                <div className="text-2xs text-text">{tool.name}</div>
                <div className="text-2xs text-text-muted">
                  {tool.risk}
                  {tool.requiresConfirmation ? ' confirmation' : ''}
                  {tool.requiresLease ? ` lease:${tool.requiresLease}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
