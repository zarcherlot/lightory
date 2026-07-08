export interface NewsCandidate {
  id: string;
  title: string;
  summary: string;
  reason: string;
}

export interface RoleTaskConsoleEntryLike {
  id?: number;
  runId?: string;
  roleId: string;
  status: 'started' | 'running' | 'done' | 'error';
  stream: 'system' | 'stdout' | 'stderr';
  content: string;
}

export function formatConsoleContent(entry: RoleTaskConsoleEntryLike): string {
  if (
    entry.stream === 'stdout' &&
    ['newsCollector', 'newsFilter', 'copyworkPicker'].includes(entry.roleId)
  ) {
    return extractDoneLine(entry.content);
  }
  return entry.content.replace(/^\s*趣味广播[：:]\s*/u, '').trim();
}

export function parseCopyworkCandidates(entries: RoleTaskConsoleEntryLike[]): NewsCandidate[] {
  const content = [...entries]
    .reverse()
    .find(
      (entry) =>
        entry.roleId === 'copyworkPicker' &&
        entry.status === 'done' &&
        entry.stream === 'stdout' &&
        entry.content.trim(),
    )
    ?.content.trim();
  if (!content) return [];

  const candidateBlock = extractCandidateBlock(content);
  const lines = candidateBlock
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+[.、]\s*/u.test(line));

  const sourceLines = lines.length > 0 ? lines : candidateBlock.split('\n').filter(Boolean);
  return sourceLines.map(parseCandidateLine).filter((candidate) => candidate !== null);
}

export function formatCopyworkSummary(candidate: NewsCandidate): string {
  const reason = candidate.reason
    ? `\n推荐理由：${candidate.reason.replace(/^适合原因[：:]\s*/u, '')}`
    : '';
  return `新闻信息：${candidate.title}${reason}`;
}

export function extractGeneratedCopyworkTitle(
  entries: RoleTaskConsoleEntryLike[],
  afterEntryId: number,
): string {
  const content = [...entries]
    .reverse()
    .find(
      (entry) =>
        (entry.id ?? 0) > afterEntryId &&
        entry.roleId === 'summarizer' &&
        entry.status === 'done' &&
        entry.stream === 'stdout' &&
        entry.content.trim(),
    )
    ?.content.trim();
  if (!content) return '';

  return (
    content
      .replace(/^\s*(?:用户意图卡|新闻标题|标题|摘要总结)[：:]\s*/u, '')
      .split('\n')
      .map((line) =>
        line
          .trim()
          .replace(/^\s*[-*]\s*/u, '')
          .replace(/^\s*(?:新闻标题|标题|摘要总结)[：:]\s*/u, ''),
      )
      .find((line) => line && !line.startsWith('已完成')) ?? ''
  );
}

function extractDoneLine(content: string): string {
  return (
    content
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('已完成')) ?? ''
  );
}

function extractCandidateBlock(content: string): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('已完成'));
  const cardIndex = lines.findIndex((line) => /^(候选新闻卡|新闻主题|新闻信息)[：:]?$/u.test(line));
  const candidateLines = cardIndex >= 0 ? lines.slice(cardIndex + 1) : lines;
  return candidateLines
    .filter((line) => !/^传递给/u.test(line))
    .join('\n')
    .trim();
}

function parseCandidateLine(line: string, index: number): NewsCandidate | null {
  const cleaned = line.replace(/^\d+[.、]\s*/u, '').trim();
  if (
    !cleaned ||
    cleaned.startsWith('已完成') ||
    /^(候选新闻卡|新闻主题|新闻信息)[：:]?$/u.test(cleaned)
  ) {
    return null;
  }

  const reasonMatch = cleaned.match(/[（(]适合原因[：:]\s*([^）)]+)[）)]/u);
  const withoutReason = cleaned.replace(/[（(]适合原因[：:]\s*[^）)]+[）)]/u, '').trim();
  const withoutLabel = withoutReason.replace(
    /^(?:主题|标题|新闻主题|新闻标题|新闻信息)[：:]\s*/u,
    '',
  );
  const separatorMatch = withoutLabel.match(/[：:]/u);
  const title = separatorMatch
    ? mergeNewsInfo(withoutLabel, separatorMatch.index ?? 0)
    : withoutLabel.trim();
  const summary = '';

  if (!title) return null;
  return {
    id: `copywork-${index}`,
    title,
    summary,
    reason: reasonMatch ? `适合原因：${reasonMatch[1].trim()}` : '',
  };
}

function mergeNewsInfo(text: string, separatorIndex: number): string {
  const before = text.slice(0, separatorIndex).trim();
  const after = text.slice(separatorIndex + 1).trim();
  if (!before) return after;
  if (!after) return before;
  if (/[，。！？；、,.!?;]$/u.test(before)) return `${before}${after}`;
  return `${before}，${after}`;
}
