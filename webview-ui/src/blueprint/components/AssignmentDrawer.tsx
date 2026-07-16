import { CheckCircle, ClipboardText, Robot, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

import {
  createMockRestatement,
  validateAgentTaskContract,
} from '../agents/index.js';
import type { BlueprintCommandInput } from '../domain/commands.js';
import type {
  AgentAssignment,
  AgentDefinition,
  AgentDelivery,
  AgentTaskContract,
  BlueprintDocument,
  ToolDefinition,
} from '../domain/types.js';
import { assignmentStatusLabel } from './agentPresentation.js';

export function AssignmentDrawer({
  assignment,
  agent,
  document,
  tools,
  onClose,
  onCommand,
}: {
  assignment: AgentAssignment;
  agent: AgentDefinition;
  document: BlueprintDocument;
  tools: ToolDefinition[];
  onClose: () => void;
  onCommand: (command: BlueprintCommandInput) => void;
}) {
  const [contract, setContract] = useState(assignment.contract);
  const [outputsDraft, setOutputsDraft] = useState(assignment.contract.expectedOutputs.join('\n'));
  const [criteriaDraft, setCriteriaDraft] = useState(assignment.contract.acceptanceCriteria.join('\n'));
  const [returnComment, setReturnComment] = useState('');
  const node = document.nodes.find(({ id }) => id === assignment.nodeId)!;
  const deliveries = useMemo(
    () =>
      document.deliveries
        .filter(({ assignmentId }) => assignmentId === assignment.id)
        .sort((a, b) => b.version - a.version),
    [assignment.id, document.deliveries],
  );
  const latestDelivery = deliveries[0];
  const reviews = useMemo(
    () => document.assignmentReviews.filter(({ assignmentId }) => assignmentId === assignment.id),
    [assignment.id, document.assignmentReviews],
  );
  const usableTools = tools.filter(({ id }) => agent.capabilityIds.includes(id));
  const submittedContract = useMemo(() => ({
    ...contract,
    expectedOutputs: lines(outputsDraft),
    acceptanceCriteria: lines(criteriaDraft),
  }), [contract, criteriaDraft, outputsDraft]);
  const issues = validateAgentTaskContract(submittedContract, { agent, node, availableTools: tools });

  useEffect(() => {
    setContract(assignment.contract);
    setOutputsDraft(assignment.contract.expectedOutputs.join('\n'));
    setCriteriaDraft(assignment.contract.acceptanceCriteria.join('\n'));
  }, [assignment.contract, assignment.id, assignment.status]);
  useEffect(() => setReturnComment(''), [latestDelivery?.id]);

  const inputOptions = useMemo(
    () => document.nodes.filter(({ id }) => id !== assignment.nodeId),
    [assignment.nodeId, document.nodes],
  );

  return (
    <aside className="engineering-assignment-drawer" aria-label="Agent 任务合同">
      <header>
        <div>
          <small>你是总工程师</small>
          <strong>
            {node.label} · {agent.name}
          </strong>
          <span>{assignmentStatusLabel(assignment.status)}</span>
        </div>
        <button aria-label="关闭任务合同" onClick={onClose} type="button">
          <X size={20} />
        </button>
      </header>

      {assignment.status === 'draft' && (
        <ContractEditor
          contract={contract}
          criteriaDraft={criteriaDraft}
          inputOptions={inputOptions}
          issues={issues}
          tools={usableTools}
          onChange={setContract}
          onCriteriaDraftChange={setCriteriaDraft}
          onOutputsDraftChange={setOutputsDraft}
          outputsDraft={outputsDraft}
          onSubmit={() => {
            onCommand({
              type: 'assignment.contract-update',
              assignmentId: assignment.id,
              contract: submittedContract,
            });
            onCommand({
              type: 'assignment.restatement-submit',
              assignmentId: assignment.id,
              restatement: createMockRestatement(
                agent,
                { ...assignment, contract: submittedContract },
                inputOptions.filter(({ id }) => submittedContract.inputNodeIds.includes(id)),
              ),
            });
          }}
        />
      )}

      {assignment.status === 'awaiting-confirmation' && assignment.restatement && (
        <section className="engineering-agent-dialogue">
          <div className="engineering-agent-dialogue-title">
            <Robot size={20} /> Agent 复述
          </div>
          <p>{assignment.restatement.summary}</p>
          <DetailList title="我会使用的输入" items={assignment.restatement.understoodInputs} />
          <DetailList title="我会交付" items={assignment.restatement.promisedOutputs} />
          <DetailList title="我还不确定" items={assignment.restatement.uncertainties} />
          <div className="engineering-assignment-actions">
            <button
              onClick={() => onCommand({ type: 'assignment.confirm', assignmentId: assignment.id })}
              type="button"
            >
              批准任务并派工
            </button>
            <button
              className="is-ghost"
              onClick={() =>
                onCommand({
                  type: 'assignment.contract-update',
                  assignmentId: assignment.id,
                  contract: assignment.contract,
                })
              }
              type="button"
            >
              需要修改
            </button>
          </div>
        </section>
      )}

      {assignment.status === 'working' && (
        <section className="engineering-agent-ready">
          <Robot size={34} weight="duotone" />
          <strong>任务已经批准</strong>
          <span>{agent.name}会在需要的上游结果准备好后自动开始；你可以关闭这里继续安排工程。</span>
        </section>
      )}

      {(assignment.status === 'awaiting-review' ||
        assignment.status === 'returned' ||
        assignment.status === 'accepted') &&
        latestDelivery && (
          <section className="engineering-delivery-review">
            <div className="engineering-delivery-heading">
              <ClipboardText size={20} />
              <strong>工程师方案 v{latestDelivery.version}</strong>
            </div>
            <p>{latestDelivery.summary}</p>
            <DetailList title="工程师准备怎样做" items={readPlanDetails(latestDelivery)} />
            <DetailList title="假设" items={latestDelivery.assumptions} />
            <DetailList title="不确定项" items={latestDelivery.uncertainties} />
            <DetailList title="覆盖的验收标准" items={readCoverage(latestDelivery.artifact)} />

            {assignment.status === 'awaiting-review' && (
              <>
                <label className="engineering-return-comment">
                  退回意见（退回时必填）
                  <textarea
                    value={returnComment}
                    onChange={(event) => setReturnComment(event.target.value)}
                    placeholder="请指出要修改什么，以及你依据哪条验收标准"
                  />
                </label>
                <div className="engineering-assignment-actions">
                  <button
                    onClick={() =>
                      onCommand({
                        type: 'assignment.accept',
                        assignmentId: assignment.id,
                        deliveryId: latestDelivery.id,
                        review: {
                          id: createP2Id('review'),
                          assignmentId: assignment.id,
                          deliveryId: latestDelivery.id,
                          decision: 'accepted',
                          comment: '总工程师确认通过',
                          createdAt: Date.now(),
                        },
                      })
                    }
                    type="button"
                  >
                    <CheckCircle size={16} /> 方案通过
                  </button>
                  <button
                    className="is-return"
                    disabled={!returnComment.trim()}
                    onClick={() =>
                      onCommand({
                        type: 'assignment.return',
                        assignmentId: assignment.id,
                        deliveryId: latestDelivery.id,
                        review: {
                          id: createP2Id('review'),
                          assignmentId: assignment.id,
                          deliveryId: latestDelivery.id,
                          decision: 'returned',
                          comment: returnComment.trim(),
                          createdAt: Date.now(),
                        },
                      })
                    }
                    type="button"
                  >
                    指出问题，请他修改
                  </button>
                </div>
              </>
            )}

            {assignment.status === 'returned' && (
              <div className="engineering-agent-dialogue is-revision">
                <strong>Agent 复述修改意见</strong>
                <p>我理解你要我修改：{reviews.at(-1)?.comment}</p>
                <button
                  onClick={() =>
                    onCommand({
                      type: 'assignment.resubmit',
                      assignmentId: assignment.id,
                      restatement: {
                        summary: `我会按退回意见修改：${reviews.at(-1)?.comment ?? ''}`,
                        understoodInputs: assignment.restatement?.understoodInputs ?? [],
                        promisedOutputs: assignment.contract.expectedOutputs,
                        uncertainties: ['修改后仍请总工程师重新验收。'],
                      },
                    })
                  }
                  type="button"
                >
                  确认复述，重新工作
                </button>
              </div>
            )}

            {assignment.status === 'accepted' && (
              <div className="engineering-delivery-accepted">
                <span><CheckCircle size={19} weight="fill" /> 已由总工程师验收</span>
                <button onClick={() => onCommand({ type: 'assignment.reopen', assignmentId: assignment.id })} type="button">
                  继续修改任务
                </button>
                <small>已验收版本会保留在历史记录中。</small>
              </div>
            )}
          </section>
        )}

      {deliveries.length > 1 && (
        <details className="engineering-delivery-history">
          <summary>查看历史版本（{deliveries.length}）</summary>
          {deliveries.slice(1).map((delivery) => (
            <div key={delivery.id}>
              v{delivery.version} · {delivery.status} — {delivery.summary}
            </div>
          ))}
        </details>
      )}
    </aside>
  );
}

function ContractEditor({
  contract,
  inputOptions,
  tools,
  issues,
  outputsDraft,
  criteriaDraft,
  onChange,
  onOutputsDraftChange,
  onCriteriaDraftChange,
  onSubmit,
}: {
  contract: AgentTaskContract;
  inputOptions: BlueprintDocument['nodes'];
  tools: ToolDefinition[];
  issues: string[];
  outputsDraft: string;
  criteriaDraft: string;
  onChange: (contract: AgentTaskContract) => void;
  onOutputsDraftChange: (value: string) => void;
  onCriteriaDraftChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="engineering-contract-editor">
      <label>
        <span>1. 任务目标</span>
        <textarea
          value={contract.goal}
          onChange={(event) => onChange({ ...contract, goal: event.target.value })}
          placeholder="这个 Agent 要解决什么局部问题？"
        />
      </label>
      <fieldset>
        <legend>2. 输入节点</legend>
        {inputOptions.length === 0 ? (
          <small>当前没有其他节点，可暂不选择输入。</small>
        ) : (
          inputOptions.map((node) => (
            <label key={node.id}>
              <input
                checked={contract.inputNodeIds.includes(node.id)}
                onChange={() =>
                  onChange({ ...contract, inputNodeIds: toggleId(contract.inputNodeIds, node.id) })
                }
                type="checkbox"
              />
              {node.label}
            </label>
          ))
        )}
      </fieldset>
      <label>
        <span>3. 交付结果（每行一项）</span>
        <textarea
          value={outputsDraft}
          onChange={(event) => onOutputsDraftChange(event.target.value)}
          placeholder="移动步骤和转向参数"
        />
      </label>
      <label>
        <span>4. 验收标准（每行一项）</span>
        <textarea
          value={criteriaDraft}
          onChange={(event) => onCriteriaDraftChange(event.target.value)}
          placeholder="怎样才算真的完成？"
        />
      </label>
      <fieldset>
        <legend>允许使用的 Tool</legend>
        {tools.map((tool) => (
          <label key={tool.id}>
            <input
              checked={contract.toolIds.includes(tool.id)}
              onChange={() =>
                onChange({ ...contract, toolIds: toggleId(contract.toolIds, tool.id) })
              }
              type="checkbox"
            />
            {tool.name}
          </label>
        ))}
      </fieldset>
      {issues.length > 0 && (
        <ul className="engineering-contract-issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      <button disabled={issues.length > 0} onClick={onSubmit} type="button">
        请 Agent 复述任务
      </button>
    </section>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="engineering-delivery-list">
      <strong>{title}</strong>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <span>无</span>
      )}
    </div>
  );
}

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}
function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
function readCoverage(artifact: AgentDelivery['artifact']): string[] {
  return Array.isArray(artifact.payload.acceptanceCoverage)
    ? artifact.payload.acceptanceCoverage.filter((item): item is string => typeof item === 'string')
    : [];
}

function readPlanDetails(delivery: AgentDelivery): string[] {
  const { artifact } = delivery;
  if (artifact.schemaId.endsWith('/movement-v1') && Array.isArray(artifact.payload.actions)) {
    return artifact.payload.actions.flatMap((action) => {
      if (!action || typeof action !== 'object') return [];
      const value = action as Record<string, unknown>;
      if (value.type === 'driveDistance' && typeof value.distanceMeters === 'number') {
        return [`${value.distanceMeters >= 0 ? '前进' : '后退'} ${Math.abs(value.distanceMeters)} 米`];
      }
      if (value.type === 'rotateAngle' && typeof value.angleRad === 'number') {
        const degrees = Math.round((Math.abs(value.angleRad) * 180) / Math.PI);
        return [`${value.angleRad >= 0 ? '左转' : '右转'} ${degrees} 度`];
      }
      return [];
    });
  }
  if (artifact.schemaId.endsWith('/speech-v1')) {
    const text = typeof artifact.payload.text === 'string' ? artifact.payload.text : '';
    const timing = artifact.payload.trigger === 'after-input' ? '收到上游结果后' : '任务开始时';
    return text ? [`${timing}说：“${text}”`] : ['没有写清要说的话'];
  }
  const outputs = artifact.payload.outputs;
  return Array.isArray(outputs) ? outputs.filter((item): item is string => typeof item === 'string') : [artifact.childSummary];
}
function createP2Id(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}
