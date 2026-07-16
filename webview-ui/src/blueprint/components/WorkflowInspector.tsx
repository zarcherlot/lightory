import { CheckCircle, GitBranch, WarningCircle, X } from '@phosphor-icons/react';

import type { BlueprintDocument } from '../domain/types.js';
import type { AgentWorkflowAnalysis } from '../workflow/agentWorkflow.js';

export function WorkflowInspector({
  analysis,
  buildMessage,
  buildState,
  document,
  onBuild,
  onClose,
}: {
  analysis: AgentWorkflowAnalysis;
  buildMessage?: string;
  buildState: 'idle' | 'running' | 'done' | 'error';
  document: BlueprintDocument;
  onBuild: () => void;
  onClose: () => void;
}) {
  const labels = new Map(document.nodes.map((node) => [node.id, node.label || node.id]));
  const canRequestRework = analysis.issues.length === 0 && analysis.workflow.nodes.some((node) => {
    const assignment = document.assignments.find(({ id }) => id === node.assignmentId);
    const upstreamReady = node.dependsOnNodeIds.every(
      (nodeId) => analysis.workflow.nodes.find((item) => item.nodeId === nodeId)?.status === 'accepted',
    );
    return upstreamReady && node.status === 'dirty' && assignment?.status === 'accepted';
  });
  const blockedReason = describeBlockedReason(analysis, document);
  return (
    <aside className="engineering-workflow-inspector" aria-label="工程进度">
      <header>
        <span>
          <GitBranch size={20} weight="bold" />
          <strong>工程进度</strong>
        </span>
        <button aria-label="关闭工程进度" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>
      <p>这里查看谁正在工作、谁在等待，以及修改后哪些工程师需要重做。</p>

      {analysis.issues.length > 0 && (
        <div className="engineering-workflow-issues">
          {analysis.issues.map((issue) => (
            <span key={issue}>
              <WarningCircle size={16} weight="fill" /> {issue}
            </span>
          ))}
        </div>
      )}

      <div className="engineering-workflow-batches">
        {analysis.workflow.batches.length === 0 ? (
          <small>分配工程师并连接模块后，这里会出现工作顺序。</small>
        ) : (
          analysis.workflow.batches.map((batch, index) => (
            <section key={batch.join(':')}>
              <small>第 {index + 1} 组{batch.length > 1 ? ' · 可以同时工作' : ''}</small>
              <div>
                {batch.map((nodeId) => {
                  const workflowNode = analysis.workflow.nodes.find((item) => item.nodeId === nodeId);
                  const assignment = document.assignments.find(({ id }) => id === workflowNode?.assignmentId);
                  return (
                    <span className={`is-${workflowNode?.status ?? 'waiting'}`} key={nodeId}>
                      <b>{labels.get(nodeId) ?? nodeId}</b>
                      <small>{workflowStatusLabel(workflowNode?.status, assignment?.status)}</small>
                    </span>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {canRequestRework && (
        <button className="engineering-workflow-prepare" disabled={buildState === 'running'} onClick={onBuild} type="button">
          <CheckCircle size={18} weight="fill" />
          {buildState === 'running' ? '工程师正在重做…' : '确认让受影响的工程师重做'}
        </button>
      )}
      {!canRequestRework && buildState !== 'running' && (
        <small className="engineering-workflow-ready is-blocked">{blockedReason}</small>
      )}
      {buildMessage && (
        <div className={`engineering-workflow-message is-${buildState}`} aria-live="polite">
          {buildMessage}
        </div>
      )}
    </aside>
  );
}

function workflowStatusLabel(status?: string, assignmentStatus?: string): string {
  if (assignmentStatus === 'draft' || assignmentStatus === 'awaiting-confirmation') {
    return '先确认合同';
  }
  if (status === 'ready') return '已派工，准备开始';
  if (status === 'dirty') return assignmentStatus === 'accepted' ? '修改后需要重做' : '准备重新工作';
  if (status === 'awaiting-review') return '等你验收';
  if (status === 'accepted') return '已经通过';
  if (status === 'blocked') return '等待前一组完成';
  return '先确认合同';
}

function describeBlockedReason(
  analysis: AgentWorkflowAnalysis,
  document: BlueprintDocument,
): string {
  if (analysis.issues.length > 0) return '先处理上面的红色提醒，工程师才能继续。';
  if (analysis.workflow.nodes.length === 0) return '先给功能模块分配工程师。';
  if (analysis.workflow.nodes.every(({ status }) => status === 'accepted')) {
    return '当前方案的工程任务已经全部完成。';
  }
  const needsContract = analysis.workflow.nodes.some((node) => {
    const assignment = document.assignments.find(({ id }) => id === node.assignmentId);
    return assignment?.status === 'draft' || assignment?.status === 'awaiting-confirmation';
  });
  if (needsContract) return '有合同修改了，请先让工程师复述并由你确认。';
  if (analysis.workflow.nodes.some(({ status }) => status === 'awaiting-review')) {
    return '先验收上一组工程师提交的方案。';
  }
  return '工程师会按蓝图连接自动排队，不需要你重复点击开工。';
}
