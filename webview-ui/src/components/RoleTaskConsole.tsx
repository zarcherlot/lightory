import { useEffect, useRef, useState } from 'react';

import { getRoleDefinition } from '../roles.js';
import { transport } from '../transport/index.js';

interface NewsCandidate {
  id: string;
  title: string;
  source: string;
  reason: string;
  copyText: string;
}

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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries, showNewsPicker, selectedNewsIds, copyworkText]);

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
    const selected = FILTERED_NEWS_CANDIDATES.filter((candidate) =>
      selectedNewsIds.has(candidate.id),
    );
    if (selected.length === 0) return;
    setCopyworkText(selected.map((candidate) => candidate.copyText).join('\n'));
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
          entries.map((entry) => (
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
              {getRoleSpeakerName(entry.roleId)}：{formatConsoleContent(entry.content)}
            </pre>
          ))
        )}
        {showNewsPicker ? (
          <NewsCopyworkTui
            candidates={FILTERED_NEWS_CANDIDATES}
            filteredOut={FILTERED_OUT_NEWS}
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
  filteredOut,
  selectedIds,
  copyworkText,
  onToggle,
  onGenerate,
}: {
  candidates: NewsCandidate[];
  filteredOut: Array<{ title: string; reason: string }>;
  selectedIds: Set<string>;
  copyworkText: string;
  onToggle: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="mt-10 border-2 border-border bg-bg px-8 py-8 text-xs leading-tight">
      <div className="mb-6 text-text">新闻摘抄 TUI</div>
      <div className="mb-8 text-text-muted">
        已过滤掉不适合小学生摘抄的内容，勾选 1 条或多条后生成手抄文字。
      </div>
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
                  <div className="mt-3 text-text-muted break-words">{candidate.source}</div>
                  <div className="mt-3 text-status-success break-words">{candidate.reason}</div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="mt-8 border-t-2 border-border pt-6">
        <div className="text-text-muted mb-4">已过滤：</div>
        {filteredOut.map((item) => (
          <div key={item.title} className="text-text-muted">
            - {item.title}：{item.reason}
          </div>
        ))}
      </div>
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
          <div className="mb-5 text-text-muted">适合摘抄的文字：</div>
          <pre className="m-0 whitespace-pre-wrap break-words text-text">{copyworkText}</pre>
        </div>
      ) : null}
    </div>
  );
}

function getRoleSpeakerName(roleId: string): string {
  if (roleId === 'user') return 'Console';
  if (roleId === 'assistant') return 'Lightory';
  return getRoleDefinition(roleId)?.name ?? roleId;
}

function formatConsoleContent(content: string): string {
  return content.replace(/^\s*(?:[^：:\n]{1,16}卡|趣味广播)[：:]\s*/u, '');
}

function isNewsCopyworkIntent(content: string): boolean {
  return /(新闻|摘抄|热点|时事|手抄)/u.test(content);
}

const FILTERED_NEWS_CANDIDATES: NewsCandidate[] = [
  {
    id: 'space',
    title: '中国航天科普活动走进校园',
    source: '类型：科技教育',
    reason: '适合摘抄：积极、知识性强，没有敏感或惊吓内容。',
    copyText:
      '近日，航天科普活动走进多地校园，学生通过模型展示和互动实验了解火箭、卫星等知识，激发了探索科学的兴趣。',
  },
  {
    id: 'heritage',
    title: '多地博物馆推出暑期儿童讲解活动',
    source: '类型：文化生活',
    reason: '适合摘抄：贴近暑假生活，能引导学生关注传统文化。',
    copyText:
      '暑假期间，多地博物馆推出儿童讲解和体验活动，让孩子们在参观中了解历史文物，感受传统文化的魅力。',
  },
  {
    id: 'sports',
    title: '社区青少年运动营鼓励每天锻炼',
    source: '类型：健康体育',
    reason: '适合摘抄：主题健康，容易联系学生自己的暑假安排。',
    copyText:
      '一些社区开设青少年运动营，鼓励孩子每天参加跑步、球类等活动，帮助大家养成坚持锻炼的好习惯。',
  },
];

const FILTERED_OUT_NEWS = [
  {
    title: '事故伤亡细节类新闻',
    reason: '内容可能造成不适，不适合小学生摘抄。',
  },
  {
    title: '成人争议和低俗娱乐新闻',
    reason: '教育价值较弱，容易偏离摘抄训练目标。',
  },
];
