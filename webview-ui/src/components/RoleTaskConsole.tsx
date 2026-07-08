import { useEffect, useRef, useState } from 'react';

import { getRoleDefinition } from '../roles.js';
import { transport } from '../transport/index.js';
import {
  extractGeneratedCopyworkTitle,
  formatConsoleContent,
  type NewsCandidate,
  parseCopyworkCandidates,
} from './roleTaskConsoleUtils.js';

export interface RoleTaskConsoleEntry {
  id: number;
  runId: string;
  roleId: string;
  status: 'started' | 'running' | 'done' | 'error';
  stream: 'system' | 'stdout' | 'stderr';
  content: string;
}

interface RoleTaskConsoleProps {
  entries: RoleTaskConsoleEntry[];
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export function RoleTaskConsole({
  entries,
  isSettingsOpen,
  onToggleSettings,
}: RoleTaskConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [showNewsPicker, setShowNewsPicker] = useState(false);
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(() => new Set());
  const [copyworkText, setCopyworkText] = useState('');
  const [summaryRequestAfterEntryId, setSummaryRequestAfterEntryId] = useState<number | null>(null);
  const copyworkCandidates = parseCopyworkCandidates(entries);
  const shouldShowNewsPicker = showNewsPicker || copyworkCandidates.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries, shouldShowNewsPicker, selectedNewsIds, copyworkText]);

  useEffect(() => {
    if (summaryRequestAfterEntryId === null) return;
    const title = extractGeneratedCopyworkTitle(entries, summaryRequestAfterEntryId);
    if (!title) return;
    setCopyworkText(title);
    setSummaryRequestAfterEntryId(null);
  }, [entries, summaryRequestAfterEntryId]);

  const sendInput = () => {
    const content = draft.trim();
    if (!content) return;
    transport.send({ type: 'consoleUserInput', content });
    if (isNewsCopyworkIntent(content)) {
      setShowNewsPicker(true);
      setSelectedNewsIds(new Set());
      setCopyworkText('');
    }
    setDraft('');
  };

  const toggleNews = (id: string) => {
    setSelectedNewsIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setCopyworkText('');
  };

  const generateCopywork = () => {
    const selected = copyworkCandidates.filter((candidate) => selectedNewsIds.has(candidate.id));
    if (selected.length === 0) return;
    const afterEntryId = entries.at(-1)?.id ?? 0;
    setSummaryRequestAfterEntryId(afterEntryId);
    setCopyworkText('正在生成10字左右标题...');
    transport.send({
      type: 'startRoleTask',
      roleId: 'summarizer',
      col: 0,
      row: 0,
      inputCards: [
        {
          sourceRoleId: 'copyworkPicker',
          card: '已选新闻',
          content: selected.map(formatSelectedNewsForSummary).join('\n'),
        },
      ],
      taskOverride: {
        markdown: buildCopyworkTitleTaskMarkdown(),
      },
    });
  };

  return (
    <section className="absolute right-0 top-0 bottom-0 z-[25] w-360 max-w-[42vw] bg-bg-dark border-l-2 border-border shadow-pixel flex flex-col max-md:left-0 max-md:top-auto max-md:w-full max-md:max-w-none max-md:h-[42vh] max-md:border-l-0 max-md:border-t-2">
      <div className="h-32 px-12 flex items-center justify-between border-b-2 border-border bg-bg">
        <span className="text-sm text-text">Console</span>
        <div className="flex items-center gap-8">
          <span className="text-2xs text-text-muted">Robot runtime</span>
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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-12 py-8 text-2xs leading-tight max-md:text-xs"
      >
        {entries.length === 0 ? (
          <div className="text-text-muted">输入“今天新闻摘抄”，我会给出过滤后的候选新闻。</div>
        ) : (
          entries.map((entry) => {
            const content = formatConsoleContent(entry);
            if (!content) return null;
            return (
              <pre
                key={entry.id}
                className={`m-0 whitespace-pre-wrap break-words ${
                  entry.stream === 'stderr'
                    ? 'text-status-error'
                    : entry.stream === 'system'
                      ? 'text-status-success'
                      : 'text-text'
                }`}
              >
                {getRoleSpeakerName(entry.roleId)}：{content}
              </pre>
            );
          })
        )}
        {shouldShowNewsPicker ? (
          <NewsCopyworkTui
            candidates={copyworkCandidates}
            selectedIds={selectedNewsIds}
            copyworkText={copyworkText}
            onToggle={toggleNews}
            onGenerate={generateCopywork}
          />
        ) : null}
      </div>
      <form
        className="border-t-2 border-border bg-bg px-8 py-8 flex gap-6 max-md:pb-[calc(8px+env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();
          sendInput();
        }}
      >
        <input
          className="min-w-0 flex-1 bg-bg-dark border-2 border-border px-8 py-6 text-xs text-text outline-none focus:border-accent"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="例如：今天新闻摘抄"
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

function NewsCopyworkTui({
  candidates,
  selectedIds,
  copyworkText,
  onToggle,
  onGenerate,
}: {
  candidates: NewsCandidate[];
  selectedIds: Set<string>;
  copyworkText: string;
  onToggle: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="mt-10 border-2 border-border bg-bg px-8 py-8 text-xs leading-tight">
      <div className="mb-6 text-text">新闻摘抄</div>
      {candidates.length === 0 ? (
        <div className="border-2 border-border bg-bg-dark px-7 py-6 text-text-muted">
          正在整理适合摘抄的新闻。
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {candidates.map((candidate) => {
            const checked = selectedIds.has(candidate.id);
            return (
              <label
                key={candidate.id}
                className={`block border-2 px-7 py-6 cursor-pointer ${
                  checked ? 'border-accent bg-active-bg' : 'border-border bg-bg-dark'
                }`}
              >
                <div className="flex items-start gap-6">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(candidate.id)}
                    className="mt-2"
                  />
                  <div className="min-w-0">
                    <div className="text-text break-words">
                      [{checked ? 'x' : ' '}] {candidate.title}
                    </div>
                    {candidate.summary ? (
                      <div className="mt-3 text-text-muted break-words">{candidate.summary}</div>
                    ) : null}
                    {candidate.reason ? (
                      <div className="mt-3 text-status-success break-words">{candidate.reason}</div>
                    ) : null}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className="mt-8 w-full border-2 border-accent bg-accent px-8 py-7 text-xs leading-none text-white shadow-pixel disabled:opacity-50 disabled:cursor-default"
        disabled={selectedIds.size === 0}
        onClick={onGenerate}
      >
        生成摘抄总结
      </button>
      {copyworkText ? (
        <div className="mt-8 border-2 border-accent bg-bg-dark px-8 py-7">
          <div className="mb-5 text-text-muted">摘要总结：</div>
          <pre className="m-0 whitespace-pre-wrap break-words text-text">{copyworkText}</pre>
        </div>
      ) : null}
    </div>
  );
}

function formatSelectedNewsForSummary(candidate: NewsCandidate, index: number): string {
  return `${index + 1}. ${candidate.title}${candidate.reason ? `（${candidate.reason}）` : ''}`;
}

function buildCopyworkTitleTaskMarkdown(): string {
  return [
    '# 新闻标题总结任务',
    '',
    '你是新闻标题编辑，负责把学生勾选的新闻总结成一句话标题。',
    '',
    '任务：',
    '',
    '- 阅读上游“已选新闻”卡。',
    '- 如果只有一条新闻，提炼成一个准确、简短的新闻标题。',
    '- 如果有多条新闻，概括它们共同重点，形成一个综合新闻标题。',
    '- 不要输出“主题”两个字。',
    '- 不要输出解释、推荐理由、列表或多段文字。',
    '- 标题控制在 10 个汉字左右，最多不超过 14 个汉字。',
    '',
    '输出格式：',
    '',
    '新闻标题：<一句话新闻标题>',
  ].join('\n');
}

function getRoleSpeakerName(roleId: string): string {
  if (roleId === 'user') return 'Console';
  if (roleId === 'assistant') return 'Lightory';
  return getRoleDefinition(roleId)?.name ?? roleId;
}

function isNewsCopyworkIntent(content: string): boolean {
  return /(新闻|摘抄|热点|时事|手抄)/u.test(content);
}
