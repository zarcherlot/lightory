import { ShieldWarning, Toolbox, X } from '@phosphor-icons/react';

import type { AgentDefinition, ToolDefinition } from '../domain/types.js';
import { PixelAgentAvatar } from './AgentDock.js';

export function AgentDetailPanel({
  agent,
  agentIndex,
  tools,
  onClose,
}: {
  agent: AgentDefinition;
  agentIndex: number;
  tools: ToolDefinition[];
  onClose: () => void;
}) {
  const available = agent.capabilityIds.map((id) => tools.find((tool) => tool.id === id));
  return (
    <aside className="engineering-agent-detail" aria-label={`${agent.name}详情`}>
      <header>
        <PixelAgentAvatar index={agentIndex} />
        <div><small>当前选中 Agent</small><strong>{agent.name}</strong></div>
        <button aria-label="关闭 Agent 详情" onClick={onClose} type="button"><X size={20} /></button>
      </header>
      <section>
        <h3><Toolbox size={18} /> 它能做什么</h3>
        {available.map((tool) => tool && <div className="engineering-agent-capability" key={tool.id}><strong>{tool.name}</strong><span>{tool.description}</span></div>)}
      </section>
      <section className="is-warning">
        <h3><ShieldWarning size={18} /> 小迷糊提醒</h3>
        <p>Agent 只知道你分配的局部任务，不理解整个工程，并且可能交付错误结果。</p>
        <ul>{agent.knownLimitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <footer>下一步：把它拖到功能模块，或保持选中后点击模块。</footer>
    </aside>
  );
}
