import { CaretDown, ShieldWarning } from '@phosphor-icons/react';

import type { AgentAssignment, AgentDefinition, BlueprintNode } from '../domain/types.js';
import { assignmentStatusLabel } from './agentPresentation.js';

export function AgentDock({
  agents,
  assignments,
  nodes,
  expanded,
  selectedAgentId,
  onSelectAgent,
  onToggle,
  onOpenAssignment,
  onBeginDrag,
}: {
  agents: AgentDefinition[];
  assignments: AgentAssignment[];
  nodes: BlueprintNode[];
  expanded: boolean;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string | null) => void;
  onToggle: () => void;
  onOpenAssignment: (assignmentId: string) => void;
  onBeginDrag: () => void;
}) {
  return (
    <aside className={`engineering-agent-dock ${expanded ? 'is-expanded' : ''}`}>
      <button className="engineering-agent-dock-toggle" onClick={onToggle} type="button">
        <span>AI 工程师小队</span>
        <small>候选 {agents.length} · 已入选 {new Set(assignments.map(({ agentId }) => agentId)).size}</small>
        <CaretDown className={expanded ? '' : 'is-reversed'} size={18} />
      </button>
      {expanded && (
        <div className="engineering-agent-list">
          {agents.map((agent, index) => {
            const agentAssignments = assignments.filter(({ agentId }) => agentId === agent.id);
            return (
              <article
                className={`engineering-agent-card ${selectedAgentId === agent.id ? 'is-selected' : ''} ${agentAssignments.length ? 'is-enlisted' : ''}`}
                draggable
                key={agent.id}
                onClick={() => onSelectAgent(selectedAgentId === agent.id ? null : agent.id)}
                onPointerDown={onBeginDrag}
                onDragStart={(event) => {
                  onBeginDrag();
                  event.dataTransfer.setData('application/x-lightory-agent', agent.id);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <PixelAgentAvatar index={index} />
                <div className="engineering-agent-card-copy">
                  <strong>{agent.name}</strong>
                  <span>{agentAssignments.length ? '入选工程师' : '候选工程师'}</span>
                  <small><ShieldWarning size={13} /> 会犯错，需要你复核</small>
                </div>
                {agentAssignments.slice(0, 1).map((assignment) => (
                  <button
                    className="engineering-agent-assignment-chip"
                    key={assignment.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenAssignment(assignment.id);
                    }}
                    type="button"
                  >
                    {nodes.find(({ id }) => id === assignment.nodeId)?.label ?? '已删除模块'}
                    <span>{assignmentStatusLabel(assignment.status)}</span>
                  </button>
                ))}
              </article>
            );
          })}
          <div className="engineering-agent-dock-hint">拖到功能模块分配任务 · 点击头像查看详情</div>
        </div>
      )}
    </aside>
  );
}

export function PixelAgentAvatar({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="engineering-pixel-agent"
      style={{ backgroundImage: `url('/assets/characters/char_${index % 6}.png')` }}
    />
  );
}
