import './blueprint-workbench.css';

import {
  ArrowCounterClockwise,
  ArrowRight,
  ArrowUUpLeft,
  CaretDown,
  Circle,
  CursorClick,
  DotsThree,
  Flag,
  Hand,
  MagnifyingGlass,
  Microphone,
  PencilSimple,
  Play,
  Rectangle,
  Robot,
  ShieldWarning,
  Sparkle,
  Stop,
  TextT,
  UsersThree,
  Warning,
  X,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

type ToolId = 'select' | 'pen' | 'connector' | 'rectangle' | 'circle' | 'text';
type AgentId = 'route' | 'voice' | 'sensor' | 'vision' | 'data';

interface AgentInfo {
  id: AgentId;
  name: string;
  skill: string;
  limitation: string;
  sprite: number;
  available: boolean;
  assigned?: string;
}

const agents: AgentInfo[] = [
  {
    id: 'route',
    name: '路线工程师',
    skill: '路径规划',
    limitation: '转向后偶尔忘记更新朝向',
    sprite: 0,
    available: true,
    assigned: '移动',
  },
  {
    id: 'voice',
    name: '语音工程师',
    skill: '语音播报',
    limitation: '容易混淆播放时机',
    sprite: 1,
    available: true,
    assigned: '语音',
  },
  {
    id: 'sensor',
    name: '传感工程师',
    skill: '距离检测',
    limitation: '暂未开放距离 Tool',
    sprite: 2,
    available: false,
  },
  {
    id: 'vision',
    name: '视觉工程师',
    skill: '图像识别',
    limitation: '暂未开放视觉 Tool',
    sprite: 3,
    available: false,
  },
  {
    id: 'data',
    name: '数据工程师',
    skill: '记录分析',
    limitation: '只能读取已确认的实验记录',
    sprite: 4,
    available: false,
  },
];

const tools: Array<{ id: ToolId; label: string; icon: typeof Hand }> = [
  { id: 'select', label: '选择', icon: CursorClick },
  { id: 'pen', label: '画笔', icon: PencilSimple },
  { id: 'connector', label: '连线', icon: ArrowRight },
  { id: 'rectangle', label: '矩形', icon: Rectangle },
  { id: 'circle', label: '圆形', icon: Circle },
  { id: 'text', label: '文字', icon: TextT },
];

function PixelAvatar({ sprite, dimmed = false }: { sprite: number; dimmed?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`blueprint-avatar ${dimmed ? 'is-dimmed' : ''}`}
      style={{ backgroundImage: `url('/assets/characters/char_${sprite}.png')` }}
    />
  );
}

function StageProgress() {
  return (
    <div className="blueprint-stage" aria-label="当前阶段 3，共 5 阶段">
      <span className="blueprint-stage-label">阶段进度</span>
      {[1, 2, 3, 4, 5].map((stage) => (
        <span key={stage} className={`blueprint-stage-step ${stage === 3 ? 'is-current' : ''}`}>
          {stage}
        </span>
      ))}
    </div>
  );
}

function AgentCard({
  agent,
  selected,
  onClick,
}: {
  agent: AgentInfo;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`blueprint-agent-card ${selected ? 'is-selected' : ''} ${
        agent.available ? '' : 'is-locked'
      }`}
      onClick={onClick}
      type="button"
    >
      <PixelAvatar dimmed={!agent.available} sprite={agent.sprite} />
      <span className="blueprint-agent-copy">
        <strong>{agent.name}</strong>
        <small>专长：{agent.skill}</small>
        <span className="blueprint-agent-status">
          <i /> {agent.available ? `已分配 · ${agent.assigned}` : '能力未解锁'}
        </span>
      </span>
      <DotsThree aria-hidden="true" size={20} weight="bold" />
    </button>
  );
}

export function BlueprintWorkbench() {
  const [activeTool, setActiveTool] = useState<ToolId>('pen');
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(null);
  const [teamDrawerOpen, setTeamDrawerOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(true);
  const [faultOpen, setFaultOpen] = useState(false);
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'paused'>('idle');

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [selectedAgentId],
  );

  const startSimulation = () => {
    setSimulationState('running');
    window.setTimeout(() => {
      setSimulationState('paused');
      setFaultOpen(true);
    }, 1100);
  };

  return (
    <main className="blueprint-lab">
      <header className="blueprint-command-bar">
        <button aria-label="打开项目菜单" className="blueprint-icon-button" type="button">
          <UsersThree size={27} weight="bold" />
        </button>
        <div className="blueprint-title-group">
          <strong>总工程师工作台</strong>
          <span>原型 01</span>
        </div>
        <div className="blueprint-command-divider" />
        <div className="blueprint-mission">
          <span>当前任务</span>
          <strong>家庭寻宝</strong>
          <CaretDown size={16} weight="bold" />
        </div>
        <div className="blueprint-goal">
          <span>目标</span>
          <p>设计一个能帮助小车找到宝藏的系统</p>
        </div>
        <StageProgress />
        <button className="blueprint-stop" type="button">
          <Stop size={21} weight="fill" />
          紧急停止
        </button>
      </header>

      <section className="blueprint-canvas" aria-label="寻宝系统架构画布">
        <div className="blueprint-grid" />
        <nav className="blueprint-tool-rail" aria-label="蓝图工具">
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={activeTool === id}
              className={activeTool === id ? 'is-active' : ''}
              key={id}
              onClick={() => setActiveTool(id)}
              type="button"
            >
              <Icon size={24} weight={activeTool === id ? 'fill' : 'regular'} />
              <span>{label}</span>
            </button>
          ))}
          <div className="blueprint-tool-divider" />
          <button aria-label="撤销" type="button">
            <ArrowUUpLeft size={23} />
          </button>
          <button aria-label="重做" type="button">
            <ArrowCounterClockwise size={23} />
          </button>
          <div className="blueprint-palette">
            <i className="is-cyan" />
            <i className="is-amber" />
          </div>
        </nav>

        <div className="blueprint-system-title">
          <Sparkle size={18} weight="fill" />
          <span>寻宝系统</span>
        </div>

        <div className="blueprint-flow">
          <div className="blueprint-start-node">
            <span><Flag size={32} weight="duotone" /></span>
            <strong>开始</strong>
            <small>触发器</small>
          </div>
          <ArrowRight className="blueprint-arrow arrow-one" size={58} />
          <div className="blueprint-subsystem">
            <div className="blueprint-node blueprint-node-move">
              <Robot size={58} weight="duotone" />
              <strong>移动</strong>
              <small>基础移动 Tool</small>
              <span className="blueprint-assignee">路线工程师</span>
            </div>
            <ArrowRight className="blueprint-inner-arrow" size={48} />
            <div className="blueprint-node blueprint-node-voice">
              <Microphone size={58} weight="duotone" />
              <strong>语音</strong>
              <small>语音 Tool</small>
              <span className="blueprint-assignee">语音工程师</span>
            </div>
          </div>
          <ArrowRight className="blueprint-arrow arrow-two" size={58} />
          <button className="blueprint-clue-node" type="button">
            <MagnifyingGlass size={46} weight="duotone" />
            <strong>线索卡</strong>
            <small>数据成果</small>
          </button>
        </div>

        <button
          className={`blueprint-suspicious-link ${simulationState === 'paused' ? 'is-fault' : ''}`}
          onClick={() => setFaultOpen(true)}
          type="button"
        >
          <span className="blueprint-dashed-line" />
          <Warning size={25} weight="fill" />
          <strong>{simulationState === 'paused' ? '实验结果与预期不同' : '可疑连接 · 点击检查'}</strong>
        </button>

        {mentorOpen && (
          <aside className="blueprint-mentor">
            <PixelAvatar sprite={3} />
            <div>
              <span>AI 导师 · 提问</span>
              <strong>小车做到什么，才算找到宝藏？</strong>
              <small>先写下你的判断，我不会替你决定。</small>
            </div>
            <button aria-label="收起导师问题" onClick={() => setMentorOpen(false)} type="button">
              <X size={18} />
            </button>
          </aside>
        )}

        {!mentorOpen && (
          <button className="blueprint-mentor-orb" onClick={() => setMentorOpen(true)} type="button">
            <Sparkle size={22} weight="fill" />
            导师
          </button>
        )}

        <div className="blueprint-minimap" aria-hidden="true">
          <span>缩略图</span>
          <div><i /><i /><i /></div>
        </div>

        {selectedAgent && (
          <aside className="blueprint-context-panel">
            <button aria-label="关闭 Agent 详情" onClick={() => setSelectedAgentId(null)} type="button">
              <X size={17} />
            </button>
            <span>当前工程师</span>
            <strong>{selectedAgent.name}</strong>
            <dl>
              <div><dt>专长</dt><dd>{selectedAgent.skill}</dd></div>
              <div><dt>已知短板</dt><dd>{selectedAgent.limitation}</dd></div>
            </dl>
            <p><ShieldWarning size={17} weight="fill" /> 需要总工程师复核</p>
          </aside>
        )}

        {faultOpen && (
          <aside className="blueprint-fault-panel">
            <header>
              <span><Warning size={20} weight="fill" /> 调试检查</span>
              <button aria-label="关闭调试检查" onClick={() => setFaultOpen(false)} type="button"><X size={18} /></button>
            </header>
            <div className="blueprint-evidence-row">
              <div><span>你的预期</span><strong>移动完成后再播放线索</strong></div>
              <ArrowRight size={24} />
              <div className="is-actual"><span>实际发生</span><strong>转向途中提前播放</strong></div>
            </div>
            <p>第一个不同发生在哪里？请选择要检查的模块。</p>
            <div className="blueprint-fault-actions">
              <button onClick={() => setSelectedAgentId('route')} type="button">检查“移动”</button>
              <button onClick={() => setSelectedAgentId('voice')} type="button">检查“语音”</button>
            </div>
          </aside>
        )}
      </section>

      <footer className="blueprint-team-dock">
        <div className="blueprint-team-heading">
          <span>当前项目小队</span>
          <small>只显示本任务正在协作的 Agent</small>
        </div>
        <div className="blueprint-agent-list">
          {agents.slice(0, 2).map((agent) => (
            <AgentCard
              agent={agent}
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              selected={selectedAgentId === agent.id}
            />
          ))}
          <button className="blueprint-more-agents" onClick={() => setTeamDrawerOpen(true)} type="button">
            <UsersThree size={25} />
            <span><strong>更多工程师</strong><small>按技能搜索与分组</small></span>
            <b>+3</b>
          </button>
        </div>
        <button
          className={`blueprint-run ${simulationState === 'running' ? 'is-running' : ''}`}
          disabled={simulationState === 'running'}
          onClick={startSimulation}
          type="button"
        >
          {simulationState === 'running' ? <Sparkle size={30} /> : <Play size={32} weight="fill" />}
          {simulationState === 'idle' ? '开始模拟' : simulationState === 'running' ? '模拟运行中' : '重新模拟'}
        </button>
      </footer>

      {teamDrawerOpen && (
        <div className="blueprint-drawer-backdrop" onClick={() => setTeamDrawerOpen(false)} role="presentation">
          <aside className="blueprint-team-drawer" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span>Agent 工程师库</span><small>按本任务可用 Tool 筛选</small></div>
              <button aria-label="关闭工程师库" onClick={() => setTeamDrawerOpen(false)} type="button"><X size={21} /></button>
            </header>
            <label className="blueprint-agent-search">
              <MagnifyingGlass size={20} />
              <input aria-label="搜索 Agent 技能" placeholder="搜索技能，例如：移动、语音" />
            </label>
            <div className="blueprint-drawer-group">
              <span>当前任务可用</span>
              {agents.slice(0, 2).map((agent) => (
                <AgentCard agent={agent} key={agent.id} onClick={() => setSelectedAgentId(agent.id)} selected={selectedAgentId === agent.id} />
              ))}
            </div>
            <div className="blueprint-drawer-group">
              <span>等待解锁</span>
              {agents.slice(2).map((agent) => (
                <AgentCard agent={agent} key={agent.id} onClick={() => setSelectedAgentId(agent.id)} selected={selectedAgentId === agent.id} />
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
