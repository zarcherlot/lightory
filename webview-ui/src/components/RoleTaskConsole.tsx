import { useEffect, useRef, useState } from 'react';

import { getRoleDefinition } from '../roles.js';
import { transport } from '../transport/index.js';

export interface RoleTaskConsoleEntry {
  id: number;
  runId: string;
  roleId: string;
  status: 'started' | 'running' | 'done' | 'error';
  stream: 'system' | 'stdout' | 'stderr';
  content: string;
}

export interface ConsoleRoleOption {
  id: string;
  name: string;
}

interface RoleTaskConsoleProps {
  entries: RoleTaskConsoleEntry[];
  roleOptions?: ConsoleRoleOption[];
  isSettingsOpen: boolean;
  robotConnected?: boolean;
  robotStatusText?: string;
  hasActiveRobotPlan?: boolean;
  hasPendingRobotConfirmation?: boolean;
  onToggleSettings: () => void;
  onSubmitInput?: (content: string) => boolean;
  onRobotEmergencyStop?: () => void;
  onConfirmRobotPlan?: () => void;
  onCancelRobotPlan?: () => void;
}

export function RoleTaskConsole({
  entries,
  roleOptions = [],
  isSettingsOpen,
  robotConnected = false,
  robotStatusText = 'Robot disconnected',
  hasActiveRobotPlan = false,
  hasPendingRobotConfirmation = false,
  onToggleSettings,
  onSubmitInput,
  onRobotEmergencyStop,
  onConfirmRobotPlan,
  onCancelRobotPlan,
}: RoleTaskConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const mentionQuery = getMentionQuery(draft);
  const mentionOptions =
    mentionQuery === null
      ? []
      : roleOptions.filter((role) =>
          `${role.name} ${role.id}`.toLowerCase().includes(mentionQuery.toLowerCase()),
        );
  const showMentionList = mentionQuery !== null && mentionOptions.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries]);

  const sendInput = () => {
    const content = draft.trim();
    if (!content) return;
    const handled = onSubmitInput?.(content) ?? false;
    if (!handled) transport.send({ type: 'consoleUserInput', content });
    setDraft('');
  };

  const selectMention = (role: ConsoleRoleOption) => {
    setDraft((value) => replaceMentionQuery(value, role.name));
  };

  return (
    <section className="absolute right-0 top-0 bottom-0 z-[25] w-360 max-w-[42vw] bg-bg-dark border-l-2 border-border shadow-pixel flex flex-col">
      <div className="h-32 px-12 flex items-center justify-between border-b-2 border-border bg-bg">
        <span className="text-sm text-text">Console</span>
        <div className="flex items-center gap-8">
          <span
            className={robotConnected ? 'text-2xs text-status-success' : 'text-2xs text-text-muted'}
          >
            {robotStatusText}
          </span>
          <button
            type="button"
            className="w-44 h-20 border-2 border-danger bg-danger text-white text-2xs leading-none cursor-pointer shadow-pixel disabled:opacity-50 disabled:cursor-default"
            onClick={onRobotEmergencyStop}
            disabled={!robotConnected && !hasActiveRobotPlan}
            title="Emergency stop"
            aria-label="Emergency stop"
          >
            急停
          </button>
          <button
            type="button"
            className={`w-20 h-20 border-2 flex items-center justify-center text-sm leading-none cursor-pointer ${
              isSettingsOpen
                ? 'bg-active-bg border-accent text-text'
                : 'bg-btn-bg border-transparent text-text-muted hover:bg-btn-hover hover:text-text'
            }`}
            onClick={onToggleSettings}
            title="Settings"
            aria-label="Settings"
          >
            ⚙<span className="sr-only">Settings</span>
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-12 py-10 text-2xs leading-tight">
        {entries.length === 0 ? (
          <div className="text-text-muted">
            输入环境信息或控制命令，例如：这里是主卧、去主卧、说你好。
          </div>
        ) : (
          entries.map((entry) => <ConsoleMessage key={entry.id} entry={entry} />)
        )}
      </div>
      {hasPendingRobotConfirmation && (
        <div className="border-t-2 border-border bg-bg px-8 py-8 flex items-center gap-6">
          <span className="min-w-0 flex-1 text-2xs text-warning">高风险移动计划等待用户确认</span>
          <button
            type="button"
            className="w-52 border-2 border-accent bg-accent text-white text-2xs leading-none cursor-pointer shadow-pixel"
            onClick={onConfirmRobotPlan}
          >
            确认
          </button>
          <button
            type="button"
            className="w-52 border-2 border-border bg-btn-bg text-text text-2xs leading-none cursor-pointer"
            onClick={onCancelRobotPlan}
          >
            取消
          </button>
        </div>
      )}
      <form
        className="relative border-t-2 border-border bg-bg px-8 py-8 flex gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          sendInput();
        }}
      >
        {showMentionList && (
          <div className="absolute left-8 right-70 bottom-full mb-6 max-h-180 overflow-y-auto border-2 border-border bg-bg-dark shadow-pixel z-10">
            {mentionOptions.map((role) => (
              <button
                key={role.id}
                type="button"
                className="block w-full px-8 py-6 text-left text-xs text-text hover:bg-btn-hover focus:bg-btn-hover outline-none"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectMention(role);
                }}
              >
                @{role.name}
              </button>
            ))}
          </div>
        )}
        <input
          className="min-w-0 flex-1 bg-bg-dark border-2 border-border px-8 py-6 text-xs text-text outline-none focus:border-accent"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="用户输入 / 环境声明 / 确认回复"
          aria-label="Console user input"
        />
        <button
          type="submit"
          className="w-56 border-2 border-accent bg-accent text-white text-xs leading-none cursor-pointer shadow-pixel disabled:opacity-50 disabled:cursor-default"
          disabled={!draft.trim()}
          title="Send console input"
        >
          发送
        </button>
      </form>
    </section>
  );
}

function getMentionQuery(value: string): string | null {
  const match = value.match(/(?:^|\s)@([^\s@]*)$/u);
  return match?.[1] ?? null;
}

function replaceMentionQuery(value: string, roleName: string): string {
  return value.replace(/(^|\s)@([^\s@]*)$/u, `$1@${roleName} `);
}

function ConsoleMessage({ entry }: { entry: RoleTaskConsoleEntry }) {
  const isUser = entry.roleId === 'user';
  const speaker = getRoleSpeakerName(entry.roleId);

  return (
    <div className={`mb-8 flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[82%] flex-col gap-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <div
            className={`px-2 text-[13px] leading-none ${
              entry.stream === 'stderr' ? 'text-status-error' : 'text-text-muted'
            }`}
          >
            {speaker}
          </div>
        )}
        <pre
          className={`m-0 max-w-full whitespace-pre-wrap break-words border-2 px-10 py-7 text-2xs leading-snug shadow-pixel ${
            isUser
              ? 'rounded-tl-[10px] rounded-tr-[2px] rounded-bl-[10px] rounded-br-[10px] border-accent bg-accent text-white'
              : entry.stream === 'stderr'
                ? 'rounded-tl-[2px] rounded-tr-[10px] rounded-bl-[10px] rounded-br-[10px] border-danger bg-bg text-status-error'
                : 'rounded-tl-[2px] rounded-tr-[10px] rounded-bl-[10px] rounded-br-[10px] border-border bg-bg text-text'
          }`}
        >
          {formatConsoleContent(entry.content)}
        </pre>
      </div>
    </div>
  );
}

function getRoleSpeakerName(roleId: string): string {
  if (roleId === 'user') return 'User';
  return getRoleDefinition(roleId)?.name ?? roleId;
}

function formatConsoleContent(content: string): string {
  return content
    .replace(/^\s*用户输入[:：]\s*/u, '')
    .replace(/^\s*Console intent[:：]\s*/u, '')
    .replace(/^\s*(?:[^：:\n]{1,16}卡|趣味广播)[：:]\s*/u, '')
    .trim();
}
