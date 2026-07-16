import './blueprint-workbench-page.css';

import {
  CaretDown,
  FloppyDisk,
  GitBranch,
  MapTrifold,
  PlayCircle,
  ShieldWarning,
  Sparkle,
} from '@phosphor-icons/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { getMockRobotTools } from '../../robot/mockRobotApi.js';
import { compileAcceptedBlueprint } from '../compiler/index.js';
import type { BlueprintCommand, BlueprintCommandInput } from '../domain/commands.js';
import { createEmptyBlueprintDocument } from '../domain/document.js';
import { blueprintHistoryReducer, createBlueprintHistoryState } from '../domain/reducer.js';
import type { AgentWorkflow, BlueprintRevision, TaskDefinition } from '../domain/types.js';
import {
  blueprintFixtureCatalog,
  familyTreasureHuntDefinition,
  museumGuideDefinition,
} from '../fixtures/index.js';
import { LocalStorageBlueprintRepository } from '../persistence/blueprintRepository.js';
import { loadTaskDefinition } from '../tasks/taskDefinitionLoader.js';
import { TestFieldEditor } from '../test-field/index.js';
import {
  analyzeAgentWorkflow,
  DeterministicAgentRuntimeAdapter,
  executeNextAgentBuildBatch,
} from '../workflow/index.js';
import { CompilePreviewPanel } from './CompilePreviewPanel.js';
import { EngineeringCanvas } from './EngineeringCanvas.js';
import { WorkflowInspector } from './WorkflowInspector.js';

const tasks = [
  loadTaskDefinition(familyTreasureHuntDefinition, blueprintFixtureCatalog),
  loadTaskDefinition(museumGuideDefinition, blueprintFixtureCatalog),
];

export function BlueprintWorkbenchPage() {
  const [taskId, setTaskId] = useState(tasks[0]!.id);
  const task = tasks.find(({ id }) => id === taskId) ?? tasks[0]!;
  return <BlueprintProject key={task.id} onSelectTask={setTaskId} task={task} tasks={tasks} />;
}

function BlueprintProject({
  task,
  tasks: availableTasks,
  onSelectTask,
}: {
  task: TaskDefinition;
  tasks: TaskDefinition[];
  onSelectTask: (taskId: string) => void;
}) {
  const [history, dispatch] = useReducer(
    blueprintHistoryReducer,
    createEmptyBlueprintDocument(),
    createBlueprintHistoryState,
  );
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving'>('loading');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [activeView, setActiveView] = useState<'architecture' | 'test-field'>('architecture');
  const [compileResult, setCompileResult] = useState<ReturnType<typeof compileAcceptedBlueprint>>();
  const [buildState, setBuildState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [buildMessage, setBuildMessage] = useState<string>();
  const lastAutoBuildRef = useRef<string | undefined>(undefined);
  const repository = useMemo(() => new LocalStorageBlueprintRepository(window.localStorage), []);
  const agentRuntime = useMemo(() => new DeterministicAgentRuntimeAdapter(), []);

  useEffect(() => {
    let active = true;
    void repository.load(task.id).then((document) => {
      if (!active) return;
      dispatch({ type: 'document.replace', document: document ?? createEmptyBlueprintDocument() });
      setHydrated(true);
      setSaveState('saved');
    });
    return () => {
      active = false;
    };
  }, [repository, task.id]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      void repository.save(task.id, history.present).then(() => setSaveState('saved'));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [history.present, hydrated, repository, task.id]);

  useEffect(() => {
    setCompileResult(undefined);
  }, [history.present]);

  const onCommand = useCallback((command: BlueprintCommandInput) => {
    dispatch({
      type: 'command',
      command: { ...command, revision: createRevision(command.type) } as BlueprintCommand,
    });
  }, []);
  const workflowAnalysis = useMemo(
    () => analyzeAgentWorkflow(history.present),
    [history.present],
  );
  const availableAgents = useMemo(
    () => blueprintFixtureCatalog.agents.filter(({ id }) => task.availableAgentIds.includes(id)),
    [task.availableAgentIds],
  );
  const runNextBuildBatch = useCallback(async (workflowOverride?: AgentWorkflow) => {
    setBuildState('running');
    setBuildMessage('正在按孩子确认的连接准备工程师输入…');
    try {
      const result = await executeNextAgentBuildBatch({
        document: history.present.workflow
          ? history.present
          : { ...history.present, workflow: workflowOverride },
        agents: availableAgents,
        adapter: agentRuntime,
        workspaceId: task.id,
        createId: createP3Id,
      });
      for (const delivery of result.deliveries) {
        onCommand({
          type: 'workflow.delivery-submit',
          assignmentId: delivery.assignmentId,
          delivery,
        });
      }
      setBuildState('done');
      setBuildMessage(result.message);
      if (result.deliveries.length > 0) setWorkflowOpen(false);
    } catch (error) {
      setBuildState('error');
      setBuildMessage(error instanceof Error ? error.message : '工程师工作失败，请检查蓝图。');
    }
  }, [agentRuntime, availableAgents, history.present, onCommand, task.id]);
  useEffect(() => {
    if (!hydrated || buildState === 'running' || workflowAnalysis.issues.length > 0) return;
    const assignmentById = new Map(history.present.assignments.map((item) => [item.id, item]));
    const runnable = workflowAnalysis.workflow.nodes.filter((node) => {
      const assignment = assignmentById.get(node.assignmentId);
      const upstreamReady = node.dependsOnNodeIds.every(
        (nodeId) => workflowAnalysis.workflow.nodes.find((item) => item.nodeId === nodeId)?.status === 'accepted',
      );
      return upstreamReady && assignment?.status === 'working' && (node.status === 'ready' || node.status === 'dirty');
    });
    if (runnable.length === 0) return;
    const signature = runnable
      .map((node) => `${node.assignmentId}:${assignmentById.get(node.assignmentId)?.contract.revision ?? 0}`)
      .sort()
      .join('|');
    if (lastAutoBuildRef.current === signature) return;
    lastAutoBuildRef.current = signature;
    setBuildMessage('任务已批准，工程师正在开始工作…');
    if (!history.present.workflow) {
      onCommand({ type: 'workflow.prepare', workflow: workflowAnalysis.workflow });
    }
    void runNextBuildBatch(workflowAnalysis.workflow);
  }, [buildState, history.present, hydrated, onCommand, runNextBuildBatch, workflowAnalysis]);
  const previewActions = useCallback(() => {
    setWorkflowOpen(false);
    setCompileResult(
      compileAcceptedBlueprint({
        document: history.present,
        robotTools: getMockRobotTools(),
        padId: 'child-workbench',
        sessionId: task.id,
        createId: createP3Id,
      }),
    );
  }, [history.present, task.id]);

  return (
    <main className="engineering-workbench">
      <header className="engineering-command-bar">
        <div className="engineering-brand">
          <Sparkle size={22} weight="fill" />
          <strong>总工程师工作台</strong>
          <span>P3</span>
        </div>
        <TaskPicker
          availableTasks={availableTasks}
          onSelectTask={onSelectTask}
          selectedTask={task}
        />
        <div className="engineering-goal">
          <small>目标问题</small>
          <strong>{task.goalPrompt}</strong>
        </div>
        <div className="engineering-save-state" aria-live="polite">
          <FloppyDisk size={18} />
          {saveState === 'loading' ? '正在载入' : saveState === 'saving' ? '保存中' : '已保存'}
        </div>
        <button className="engineering-stop" type="button">
          <ShieldWarning size={20} weight="fill" />
          紧急停止
        </button>
      </header>

      <section className="engineering-task-strip">
        <nav className="engineering-view-switch" aria-label="工作台页面">
          <button
            aria-current={activeView === 'architecture' ? 'page' : undefined}
            onClick={() => {
              setActiveView('architecture');
              setWorkflowOpen(false);
              setCompileResult(undefined);
            }}
            type="button"
          ><GitBranch size={15} />工程总图</button>
          <button
            aria-current={activeView === 'test-field' ? 'page' : undefined}
            onClick={() => {
              setActiveView('test-field');
              setWorkflowOpen(false);
              setCompileResult(undefined);
            }}
            type="button"
          ><MapTrifold size={15} />试验场</button>
        </nav>
        <strong>
          {activeView === 'architecture'
            ? '请画出模块，并说明模块之间怎样触发或传消息'
            : '布置实验环境：位置、方向和障碍都由你决定'}
        </strong>
        {activeView === 'architecture' && (
          <>
            <button className="engineering-workflow-toggle" onClick={() => {
              setCompileResult(undefined);
              setWorkflowOpen((open) => !open);
            }} type="button">
              工程进度
              {workflowAnalysis.issues.length > 0 && <b>{workflowAnalysis.issues.length}</b>}
            </button>
            <button className="engineering-workflow-toggle" onClick={previewActions} type="button">
              <PlayCircle size={15} weight="fill" />
              动作预览
            </button>
          </>
        )}
        <small>{activeView === 'architecture' ? '当前只开放：语音、基础移动' : '平面移动模拟 · 未连接小车'}</small>
      </section>

      {workflowOpen && (
        <WorkflowInspector
          analysis={workflowAnalysis}
          buildMessage={buildMessage}
          buildState={buildState}
          document={history.present}
          onClose={() => setWorkflowOpen(false)}
          onBuild={() => {
            setBuildState('idle');
            setBuildMessage(undefined);
            if (!history.present.workflow) {
              onCommand({ type: 'workflow.prepare', workflow: workflowAnalysis.workflow });
            }
            void runNextBuildBatch(workflowAnalysis.workflow);
          }}
        />
      )}

      {compileResult && (
        <CompilePreviewPanel
          document={history.present}
          onClose={() => setCompileResult(undefined)}
          result={compileResult}
        />
      )}

      {activeView === 'architecture' ? (
        <ReactFlowProvider>
          <EngineeringCanvas
            agents={availableAgents}
            canRedo={history.future.length > 0}
            canUndo={history.past.length > 0}
            document={history.present}
            onCommand={onCommand}
            onRedo={() => dispatch({ type: 'history.redo' })}
            onUndo={() => dispatch({ type: 'history.undo' })}
            tools={blueprintFixtureCatalog.tools.filter(({ id }) =>
              task.availableToolIds.includes(id),
            )}
          />
        </ReactFlowProvider>
      ) : (
        <TestFieldEditor
          canRedo={history.future.length > 0}
          canUndo={history.past.length > 0}
          onCommand={onCommand}
          onRedo={() => dispatch({ type: 'history.redo' })}
          onUndo={() => dispatch({ type: 'history.undo' })}
          document={history.present}
          taskSuccessCriteria={task.successCriteria}
        />
      )}
    </main>
  );
}

function TaskPicker({
  selectedTask,
  availableTasks,
  onSelectTask,
}: {
  selectedTask: TaskDefinition;
  availableTasks: TaskDefinition[];
  onSelectTask: (taskId: string) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node))
        detailsRef.current?.removeAttribute('open');
    };
    window.document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => window.document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  return (
    <details className="engineering-task-picker" ref={detailsRef}>
      <summary>
        <span>
          <small>当前任务</small>
          <strong>{selectedTask.title}</strong>
        </span>
        <CaretDown size={15} />
      </summary>
      <div className="engineering-task-menu" role="menu">
        {availableTasks.map((item) => (
          <button
            aria-current={item.id === selectedTask.id ? 'true' : undefined}
            key={item.id}
            onClick={() => {
              detailsRef.current?.removeAttribute('open');
              onSelectTask(item.id);
            }}
            role="menuitem"
            type="button"
          >
            <strong>{item.title}</strong>
            <span>{item.goalPrompt}</span>
          </button>
        ))}
      </div>
    </details>
  );
}

function createRevision(reason: string): BlueprintRevision {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return { id: `revision-${suffix}`, createdAt: Date.now(), reason };
}

function createP3Id(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}
