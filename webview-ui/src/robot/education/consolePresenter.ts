import type { RaceTutorOutput } from '../../../../core/src/messages.js';
import type { RoleTaskConsoleEntry } from '../../components/roleTaskConsoleTypes.js';

export function presentRaceTutorOutput(
  message: RaceTutorOutput,
): Array<Omit<RoleTaskConsoleEntry, 'id'>> {
  if (!message.ok) {
    return [
      {
        runId: message.requestId,
        roleId: 'AI老师',
        status: 'error',
        stream: 'stderr',
        content: message.error ?? 'AI 导师暂时不可用。',
      },
    ];
  }

  const entries: Array<Omit<RoleTaskConsoleEntry, 'id'>> = [
    {
      runId: message.requestId,
      roleId: 'AI老师',
      status: 'done',
      stream: 'stdout',
      content: message.publicReply ?? '',
    },
  ];

  for (const expert of message.expertReplies ?? []) {
    entries.push({
      runId: message.requestId,
      roleId: expertRoleLabel(expert.expertId),
      status: 'done',
      stream: 'stdout',
      content: expert.publicReply,
    });
  }

  return entries.filter((entry) => entry.content.trim());
}

function expertRoleLabel(expertId: string): string {
  if (expertId === 'localization') return '定位工程师';
  if (expertId === 'motion') return '运动控制专家';
  if (expertId === 'safety') return '安全工程师';
  if (expertId === 'strategy') return '竞速策略专家';
  return '专家';
}
