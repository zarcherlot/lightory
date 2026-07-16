import type { AgentAssignment } from '../domain/types.js';

export function assignmentStatusLabel(status: AgentAssignment['status']): string {
  if (status === 'draft') return '填写合同';
  if (status === 'awaiting-confirmation') return '等待确认';
  if (status === 'working') return '已派工';
  if (status === 'awaiting-review') return '等待验收';
  if (status === 'returned') return '已退回';
  return '方案通过';
}
