import type { RaceTutorOutput } from '../../../../core/src/messages.js';
import type { RoleTaskConsoleEntry } from '../../components/RoleTaskConsole.js';

const EXPERT_ROLE_IDS: Record<string, string> = {
  localization: 'race-localization',
  motion: 'race-motion',
  safety: 'race-safety',
  strategy: 'race-strategy',
};

export function presentRaceTutorOutput(
  message: RaceTutorOutput,
): Array<Omit<RoleTaskConsoleEntry, 'id'>> {
  if (!message.ok) {
    return [
      {
        runId: message.requestId,
        roleId: 'race-tutor',
        status: 'error',
        stream: 'stderr',
        content: message.error ?? 'AI 导师暂时不可用。',
      },
    ];
  }

  const entries: Array<Omit<RoleTaskConsoleEntry, 'id'>> = [
    {
      runId: message.requestId,
      roleId: 'race-tutor',
      status: 'done',
      stream: 'stdout',
      content: message.publicReply ?? '',
    },
  ];

  for (const expert of message.expertReplies ?? []) {
    if (!expert.publicReply.trim()) continue;
    entries.push({
      runId: message.requestId,
      roleId: EXPERT_ROLE_IDS[expert.expertId] ?? `race-${expert.expertId}`,
      status: 'done',
      stream: 'stdout',
      content: expert.publicReply,
    });
  }

  const draftSummary = summarizeRaceDraft(message.raceDraftPatch);
  if (draftSummary) {
    entries.push({
      runId: message.requestId,
      roleId: 'race-tutor',
      status: 'done',
      stream: 'system',
      content: draftSummary,
    });
  }

  return entries.filter((entry) => entry.content.trim());
}

function summarizeRaceDraft(patch: Record<string, unknown> | undefined): string | null {
  if (!patch) return null;
  const nextPoint = typeof patch.nextPoint === 'string' ? patch.nextPoint.trim().toUpperCase() : '';
  if (/^[ABCD]$/.test(nextPoint)) return `赛道草稿：下一步记录 ${nextPoint} 点。`;
  const recordedPoints = Array.isArray(patch.recordedPoints)
    ? patch.recordedPoints.filter((point): point is string => typeof point === 'string')
    : [];
  if (recordedPoints.length > 0) {
    return `赛道草稿：已记录 ${recordedPoints.join('、')} 点。`;
  }
  const lastResult = patch.lastResult;
  if (lastResult && typeof lastResult === 'object' && !Array.isArray(lastResult)) {
    const result = lastResult as Record<string, unknown>;
    if (typeof result.elapsedMs === 'number') {
      return `计时结果：本圈用时 ${(result.elapsedMs / 1000).toFixed(1)} 秒。`;
    }
    if (typeof result.stopReason === 'string') {
      return `本圈已停止：${result.stopReason}`;
    }
  }
  return null;
}
