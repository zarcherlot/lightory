import './blueprint-workbench-page.css';

import { CaretDown, FloppyDisk, ShieldWarning, Sparkle } from '@phosphor-icons/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { BlueprintCommand, BlueprintCommandInput } from '../domain/commands.js';
import { createEmptyBlueprintDocument } from '../domain/document.js';
import { blueprintHistoryReducer, createBlueprintHistoryState } from '../domain/reducer.js';
import type { BlueprintRevision, TaskDefinition } from '../domain/types.js';
import {
  blueprintFixtureCatalog,
  familyTreasureHuntDefinition,
  museumGuideDefinition,
} from '../fixtures/index.js';
import { LocalStorageBlueprintRepository } from '../persistence/blueprintRepository.js';
import { loadTaskDefinition } from '../tasks/taskDefinitionLoader.js';
import { EngineeringCanvas } from './EngineeringCanvas.js';

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
  const repository = useMemo(() => new LocalStorageBlueprintRepository(window.localStorage), []);

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

  const onCommand = useCallback((command: BlueprintCommandInput) => {
    dispatch({
      type: 'command',
      command: { ...command, revision: createRevision(command.type) } as BlueprintCommand,
    });
  }, []);

  return (
    <main className="engineering-workbench">
      <header className="engineering-command-bar">
        <div className="engineering-brand">
          <Sparkle size={22} weight="fill" />
          <strong>总工程师工作台</strong>
          <span>P1</span>
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
        <span>第一阶段 · 绘制系统架构</span>
        <strong>请画出功能模块、成果和它们之间的关系</strong>
        <small>当前只开放：语音、基础移动</small>
      </section>

      <ReactFlowProvider>
        <EngineeringCanvas
          canRedo={history.future.length > 0}
          canUndo={history.past.length > 0}
          document={history.present}
          onCommand={onCommand}
          onRedo={() => dispatch({ type: 'history.redo' })}
          onUndo={() => dispatch({ type: 'history.undo' })}
        />
      </ReactFlowProvider>
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
