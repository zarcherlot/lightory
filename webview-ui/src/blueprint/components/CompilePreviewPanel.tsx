import {
  ArrowRight,
  CheckCircle,
  Code,
  Robot,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

import type { RobotPlanStep } from '../../robot/types.js';
import type { BlueprintCompileResult } from '../compiler/types.js';
import type { BlueprintDocument } from '../domain/types.js';

export function CompilePreviewPanel({
  document,
  onClose,
  result,
}: {
  document: BlueprintDocument;
  onClose: () => void;
  result: BlueprintCompileResult;
}) {
  const labels = new Map(document.nodes.map((node) => [node.id, node.label || node.id]));
  const previewBatches = result.ok ? groupPreviewByDependency(result.preview) : [];
  const planStepBatches = result.plan ? groupPlanStepsByDependency(result.plan.steps) : [];
  return (
    <aside className="engineering-compile-preview" aria-label="动作预览">
      <header>
        <span>
          <Robot size={21} weight="fill" />
          <strong>动作预览</strong>
        </span>
        <button aria-label="关闭动作预览" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>
      <p>这里把你验收的交付翻译成小车动作，不会自动修改蓝图。</p>

      {result.errors.length > 0 && (
        <section className="engineering-compile-issues is-error">
          <strong><WarningCircle size={17} weight="fill" /> 还不能生成动作</strong>
          {result.errors.map((issue, index) => (
            <span key={`${issue.code}-${issue.nodeId ?? index}`}>{issue.message}</span>
          ))}
        </section>
      )}

      {result.ok && result.plan && (
        <>
          <section className="engineering-compile-status">
            <CheckCircle size={18} weight="fill" />
            <span><strong>RobotPlan 候选已通过本地校验</strong><small>仍需在测试场验证任务效果</small></span>
          </section>
          <div className="engineering-action-list">
            {previewBatches.flatMap((batch, batchIndex) => batch.map((action) => (
              <article key={action.id}>
                <b>{batchIndex + 1}</b>
                <span>
                  <small>{action.nodeLabel}</small>
                  <strong>{action.description}</strong>
                  <em>
                    {action.dependsOnNodeIds.length > 0
                      ? <>等待 {action.dependsOnNodeIds.map((id) => labels.get(id) ?? id).join('、')} <ArrowRight size={12} /></>
                      : '可直接开始'}
                  </em>
                </span>
              </article>
            )))}
          </div>
          {result.warnings.length > 0 && (
            <section className="engineering-compile-issues">
              {result.warnings.map((issue, index) => (
                <span key={`${issue.code}-${index}`}>{issue.message}</span>
              ))}
            </section>
          )}
          <details className="engineering-plan-details">
            <summary><Code size={16} /> 查看工程步骤</summary>
            <ol>
              {planStepBatches.flatMap((batch, batchIndex) => batch.map((step) => (
                <li key={step.id}>
                  <code>第 {batchIndex + 1} 批 · {step.tool}</code>
                  <span>{JSON.stringify(step.args)}</span>
                  {step.dependsOn && <small>等待：{step.dependsOn.join('、')}</small>}
                </li>
              )))}
            </ol>
          </details>
        </>
      )}

      <footer>仅生成模拟候选 · 未发送给小车</footer>
    </aside>
  );
}

function groupPlanStepsByDependency(steps: RobotPlanStep[]): RobotPlanStep[][] {
  const remaining = new Map(steps.map((step) => [step.id, step]));
  const completed = new Set<string>();
  const batches: RobotPlanStep[][] = [];
  while (remaining.size > 0) {
    const batch = steps.filter(
      (step) =>
        remaining.has(step.id) &&
        (step.dependsOn ?? []).every((stepId) => completed.has(stepId)),
    );
    if (batch.length === 0) return [steps];
    batches.push(batch);
    for (const step of batch) {
      remaining.delete(step.id);
      completed.add(step.id);
    }
  }
  return batches;
}

function groupPreviewByDependency(
  preview: BlueprintCompileResult['preview'],
): Array<BlueprintCompileResult['preview']> {
  const remaining = new Map(preview.map((action) => [action.id, action]));
  const completed = new Set<string>();
  const batches: Array<BlueprintCompileResult['preview']> = [];
  while (remaining.size > 0) {
    const batch = preview.filter(
      (action) =>
        remaining.has(action.id) &&
        action.dependsOnNodeIds.every((nodeId) => completed.has(nodeId)),
    );
    if (batch.length === 0) return [preview];
    batches.push(batch);
    for (const action of batch) {
      remaining.delete(action.id);
      completed.add(action.nodeId);
    }
  }
  return batches;
}
