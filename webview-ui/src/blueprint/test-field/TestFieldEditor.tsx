import './test-field.css';

import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  CursorClick,
  MapPin,
  NavigationArrow,
  Ruler,
  SelectionAll,
  Trash,
  Wall,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { getMockRobotTools } from '../../robot/mockRobotApi.js';
import { compileAcceptedBlueprint } from '../compiler/blueprintCompiler.js';
import type { BlueprintCompileResult } from '../compiler/types.js';
import type { BlueprintCommandInput } from '../domain/commands.js';
import { clampSceneEntity, snapSceneValue } from '../domain/scene.js';
import type {
  BlueprintDocument,
  ExperimentExpectation,
  SceneDefinition,
  SceneEntity,
  SceneEntityKind,
} from '../domain/types.js';
import { evaluateExperiment, findFirstExperimentDifference } from './experimentEvaluation.js';
import { simulateRobotPlan } from './simulationEngine.js';
import type { SimulationRun } from './simulationTypes.js';

interface TestFieldEditorProps {
  document: BlueprintDocument;
  canUndo: boolean;
  canRedo: boolean;
  onCommand: (command: BlueprintCommandInput) => void;
  onUndo: () => void;
  onRedo: () => void;
  taskSuccessCriteria: string[];
}

const entityPresets: Array<{
  kind: Extract<SceneEntityKind, 'robot-start' | 'target-landmark' | 'obstacle'>;
  label: string;
  description: string;
  icon: typeof NavigationArrow;
}> = [
  { kind: 'robot-start', label: '小车起点', description: '决定初始位置和方向', icon: NavigationArrow },
  { kind: 'target-landmark', label: '目标 / 地标', description: '用来判断是否到达', icon: MapPin },
  { kind: 'obstacle', label: '障碍物', description: '碰到时实验会停止', icon: Wall },
];

export function TestFieldEditor({
  document,
  canUndo,
  canRedo,
  onCommand,
  onUndo,
  onRedo,
  taskSuccessCriteria,
}: TestFieldEditorProps) {
  const scene = document.scene;
  const [selectedId, setSelectedId] = useState<string>();
  const [inspectorMode, setInspectorMode] = useState<'entity' | 'experiment'>('entity');
  const [experiment, setExperiment] = useState<{
    revisionId: string;
    compile: BlueprintCompileResult;
    run?: SimulationRun;
  }>();
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const stageRef = useRef<HTMLDivElement>(null);
  const selectedEntity = scene.entities.find(({ id }) => id === selectedId);
  const currentRevisionId = document.revisions.at(-1)?.id ?? '';
  const experimentStale = experiment !== undefined && experiment.revisionId !== currentRevisionId;
  const currentEvent = experiment?.run?.events[playbackIndex];

  useEffect(() => {
    if (selectedId && !scene.entities.some(({ id }) => id === selectedId)) {
      setSelectedId(undefined);
    }
  }, [scene.entities, selectedId]);

  const addEntity = (kind: (typeof entityPresets)[number]['kind']) => {
    const entity = createSceneEntity(kind, scene);
    onCommand({ type: 'scene.entity-create', entity });
    setSelectedId(entity.id);
    setInspectorMode('entity');
  };

  const prepareExperiment = () => {
    const compile = compileAcceptedBlueprint({
      document,
      robotTools: getMockRobotTools(),
      padId: 'child-workbench',
      sessionId: 'test-field',
      createId: createTestFieldId,
    });
    const run = compile.ok && compile.plan
      ? simulateRobotPlan({ plan: compile.plan, scene, createId: createTestFieldId })
      : undefined;
    setExperiment({ revisionId: currentRevisionId, compile, ...(run ? { run } : {}) });
    setPlaybackIndex(-1);
    setInspectorMode('experiment');
    setSelectedId(undefined);
  };

  return (
    <section className="test-field-workspace">
      <aside className="test-field-palette" aria-label="试验场图元">
        <header>
          <SelectionAll size={19} weight="bold" />
          <span><strong>布置试验场</strong><small>点击添加，再拖到合适位置</small></span>
        </header>
        <div className="test-field-palette-list">
          {entityPresets.map(({ kind, label, description, icon: Icon }) => {
            const disabled = kind === 'robot-start' && scene.entities.some((entity) => entity.kind === kind);
            return (
              <button disabled={disabled} key={kind} onClick={() => addEntity(kind)} type="button">
                <Icon size={22} weight={kind === 'target-landmark' ? 'fill' : 'bold'} />
                <span><strong>{label}</strong><small>{disabled ? '已经放置' : description}</small></span>
              </button>
            );
          })}
        </div>
        <div className="test-field-palette-note">
          <Ruler size={17} />
          <span><strong>{scene.widthMeters} × {scene.heightMeters} 米</strong><small>每个大格 {scene.gridSizeMeters} 米</small></span>
        </div>
        <div className="test-field-history-actions">
          <button disabled={!canUndo} onClick={onUndo} type="button"><ArrowCounterClockwise size={17} />撤销</button>
          <button disabled={!canRedo} onClick={onRedo} type="button"><ArrowRight size={17} />重做</button>
        </div>
      </aside>

      <div className="test-field-stage-shell">
        <header>
          <span><strong>家庭实验地面</strong><small>坐标和尺寸使用真实米制</small></span>
          <em>{scene.entities.length} 个场景图元</em>
        </header>
        <div
          aria-label="二维试验场"
          className="test-field-stage"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(undefined);
          }}
          ref={stageRef}
          role="application"
          style={{ '--test-grid-columns': scene.widthMeters / scene.gridSizeMeters, '--test-grid-rows': scene.heightMeters / scene.gridSizeMeters } as React.CSSProperties}
        >
          {scene.entities.length === 0 && (
            <div className="test-field-empty">
              <CursorClick size={28} />
              <strong>先放置小车起点</strong>
              <span>再添加目标和障碍，搭出你的实验环境</span>
            </div>
          )}
          {scene.entities.map((entity) => (
            <SceneEntityView
              collision={currentEvent?.collisionEntityId === entity.id}
              entity={entity}
              simulationOrigin={Boolean(experiment?.run && !experimentStale && entity.kind === 'robot-start')}
              key={entity.id}
              onCommand={onCommand}
              onSelect={() => {
                setSelectedId(entity.id);
                setInspectorMode('entity');
              }}
              scene={scene}
              selected={selectedId === entity.id}
              stageRef={stageRef}
            />
          ))}
          {experiment?.run && experiment.run.status !== 'invalid' && !experimentStale && (
            <SimulationOverlay
              playbackIndex={playbackIndex}
              run={experiment.run}
              scene={scene}
            />
          )}
        </div>
        <footer>
          <span><i className="is-start" />起点</span>
          <span><i className="is-target" />目标</span>
          <span><i className="is-obstacle" />障碍</span>
          <small>轨迹与事件来自本地确定性模拟 · 未连接真实小车</small>
        </footer>
      </div>

      <aside className="test-field-inspector" aria-label="场景图元详情">
        <nav className="test-field-inspector-tabs" aria-label="试验场侧栏">
          <button
            aria-current={inspectorMode === 'entity' ? 'page' : undefined}
            onClick={() => setInspectorMode('entity')}
            type="button"
          >图元设定</button>
          <button
            aria-current={inspectorMode === 'experiment' ? 'page' : undefined}
            onClick={() => setInspectorMode('experiment')}
            type="button"
          >实验记录</button>
        </nav>
        {inspectorMode === 'experiment' ? (
          <ExperimentPanel
            experiment={experiment}
            expectations={document.experimentExpectations}
            onJumpTo={setPlaybackIndex}
            onPrepare={prepareExperiment}
            onSaveExpectations={(expectations) =>
              onCommand({ type: 'experiment.expectations-set', expectations })
            }
            playbackIndex={playbackIndex}
            scene={scene}
            stale={experimentStale}
            taskSuccessCriteria={taskSuccessCriteria}
          />
        ) : selectedEntity ? (
            <SceneEntityInspector
              entity={selectedEntity}
              key={selectedEntity.id}
              onCommand={onCommand}
            />
        ) : (
          <div className="test-field-inspector-empty">
            <CursorClick size={30} />
            <strong>选择一个场景图元</strong>
            <p>你可以定义它叫什么、代表什么，以及它的尺寸和朝向。</p>
            <small>AI 不会替你改变实验环境。</small>
          </div>
        )}
      </aside>
    </section>
  );
}

function SceneEntityView({
  entity,
  scene,
  selected,
  stageRef,
  onSelect,
  onCommand,
  collision,
  simulationOrigin,
}: {
  entity: SceneEntity;
  scene: SceneDefinition;
  selected: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onCommand: (command: BlueprintCommandInput) => void;
  collision: boolean;
  simulationOrigin: boolean;
}) {
  const [dragPosition, setDragPosition] = useState<SceneEntity['position']>();
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    origin: SceneEntity['position'];
    latestPosition?: SceneEntity['position'];
  } | undefined>(undefined);
  const position = dragPosition ?? entity.position;

  useEffect(() => setDragPosition(undefined), [entity.position.x, entity.position.y]);

  const finishDrag = (pointerId: number) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== pointerId) return;
    const finalPosition = drag.latestPosition;
    if (
      finalPosition &&
      (finalPosition.x !== entity.position.x || finalPosition.y !== entity.position.y)
    ) {
      onCommand({ type: 'scene.entity-move', entityId: entity.id, position: finalPosition });
    }
    dragRef.current = undefined;
    setDragPosition(undefined);
  };

  return (
    <button
      aria-label={`${entity.label}，位置 ${position.x} 米，${position.y} 米`}
      className={`test-field-entity is-${entity.kind}${selected ? ' is-selected' : ''}${collision ? ' is-collision' : ''}${simulationOrigin ? ' is-simulation-origin' : ''}`}
      onPointerCancel={(event) => finishDrag(event.pointerId)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        onSelect();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          origin: entity.position,
        };
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        const stage = stageRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !stage) return;
        const rect = stage.getBoundingClientRect();
        const candidate = clampSceneEntity(scene, {
          ...entity,
          position: {
            x: snapSceneValue(drag.origin.x + ((event.clientX - drag.clientX) / rect.width) * scene.widthMeters),
            y: snapSceneValue(drag.origin.y + ((event.clientY - drag.clientY) / rect.height) * scene.heightMeters),
          },
        });
        drag.latestPosition = candidate.position;
        setDragPosition(candidate.position);
      }}
      onPointerUp={(event) => finishDrag(event.pointerId)}
      style={{
        '--entity-rotation': `${entity.rotation}deg`,
        left: `${(position.x / scene.widthMeters) * 100}%`,
        top: `${(position.y / scene.heightMeters) * 100}%`,
        width: `${(entity.size.width / scene.widthMeters) * 100}%`,
        height: `${(entity.size.height / scene.heightMeters) * 100}%`,
        transform: `rotate(var(--entity-rotation))`,
      } as React.CSSProperties}
      type="button"
    >
      <span className="test-field-entity-symbol" aria-hidden="true">
        {entity.kind === 'robot-start' ? <NavigationArrow size={26} weight="fill" /> : entity.kind === 'target-landmark' ? <MapPin size={24} weight="fill" /> : <Wall size={22} weight="bold" />}
      </span>
      <strong>{entity.label}</strong>
      <small>{position.x.toFixed(2)}m · {position.y.toFixed(2)}m</small>
    </button>
  );
}

function SimulationOverlay({
  run,
  scene,
  playbackIndex,
}: {
  run: SimulationRun;
  scene: SceneDefinition;
  playbackIndex: number;
}) {
  const event = run.events[playbackIndex];
  const pose = event?.pose ?? run.initialPose;
  const pathEndIndex = event?.pathEndIndex ?? 0;
  const visiblePath = run.path.slice(0, pathEndIndex + 1);
  return (
    <div className="test-field-simulation-layer" aria-hidden="true">
      <svg preserveAspectRatio="none" viewBox={`0 0 ${scene.widthMeters} ${scene.heightMeters}`}>
        <polyline
          points={visiblePath.map(({ xMeters, yMeters }) => `${xMeters},${yMeters}`).join(' ')}
        />
      </svg>
      <div
        className={`test-field-simulated-robot${event?.status === 'blocked' ? ' is-blocked' : ''}`}
        style={{
          '--robot-x': `${(pose.xMeters / scene.widthMeters) * 100}%`,
          '--robot-y': `${(pose.yMeters / scene.heightMeters) * 100}%`,
          '--robot-size': `${((run.robotRadiusMeters * 2) / scene.widthMeters) * 100}%`,
          '--robot-heading': `${pose.headingDegrees}deg`,
        } as React.CSSProperties}
      >
        <NavigationArrow size={25} weight="fill" />
        {event?.speechText && <span>{event.speechText}</span>}
      </div>
    </div>
  );
}

function ExperimentPanel({
  experiment,
  expectations,
  scene,
  stale,
  playbackIndex,
  onPrepare,
  onJumpTo,
  onSaveExpectations,
  taskSuccessCriteria,
}: {
  experiment?: { compile: BlueprintCompileResult; run?: SimulationRun };
  expectations: ExperimentExpectation[];
  scene: SceneDefinition;
  stale: boolean;
  playbackIndex: number;
  onPrepare: () => void;
  onJumpTo: (index: number) => void;
  onSaveExpectations: (expectations: ExperimentExpectation[]) => void;
  taskSuccessCriteria: string[];
}) {
  const run = experiment?.run;
  const atEnd = run !== undefined && playbackIndex >= run.events.length - 1;
  const currentEvent = run?.events[playbackIndex];
  const evaluation = run
    ? evaluateExperiment({ expectations, run, scene, playbackIndex })
    : undefined;
  const firstDifference = run
    ? findFirstExperimentDifference({ expectations, run, scene })
    : undefined;
  const pausedAtDifference =
    firstDifference !== undefined && playbackIndex >= firstDifference && evaluation?.status === 'failed';
  const nextIndex = run
    ? Math.min(playbackIndex + 1, firstDifference ?? run.events.length - 1, run.events.length - 1)
    : -1;
  const runUntilIndex = run ? firstDifference ?? run.events.length - 1 : -1;
  return (
    <div className="test-field-experiment-panel">
      <header><small>确定性本地模拟</small><strong>实验控制台</strong></header>
      <p>实验只执行你验收后的蓝图，不会让 AI 临时改变动作。</p>
      <ExpectationEditor
        expectations={expectations}
        onSave={onSaveExpectations}
        scene={scene}
        taskSuccessCriteria={taskSuccessCriteria}
      />
      {stale && (
        <div className="test-field-experiment-warning"><WarningCircle size={17} weight="fill" />蓝图或场景已经改变，请重新准备实验。</div>
      )}
      {experiment && experiment.compile.errors.length > 0 && (
        <div className="test-field-experiment-issues">
          <strong>还不能开始</strong>
          {experiment.compile.errors.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}
        </div>
      )}
      {run?.issues.length && (
        run.status === 'invalid' ||
        run.events.length === 0 ||
        currentEvent?.status === 'blocked' ||
        atEnd
      ) ? (
        <div className="test-field-experiment-issues">
          <strong>{run.status === 'invalid' ? '实验条件不完整' : '实验已安全停止'}</strong>
          {run.issues.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}
        </div>
      ) : null}
      {run && (
        <>
          {pausedAtDifference && (
            <div className="test-field-difference-alert">
              <XCircle size={18} weight="fill" />
              <span><strong>发现第一个差异，实验已暂停</strong><small>先比较你写的预期和实际证据，再决定修改哪里。</small></span>
            </div>
          )}
          <div className={`test-field-experiment-status is-${currentEvent?.status ?? 'ready'}`}>
            <small>{playbackIndex < 0 ? '准备完成' : `步骤 ${playbackIndex + 1} / ${run.events.length}`}</small>
            <strong>{currentEvent?.title ?? '等待总工程师开始'}</strong>
            <span>{currentEvent?.detail ?? '你可以单步观察，也可以运行到最后。'}</span>
          </div>
          <div className="test-field-experiment-actions">
            <button
              disabled={stale || run.events.length === 0 || atEnd || pausedAtDifference}
              onClick={() => onJumpTo(nextIndex)}
              type="button"
            >单步执行</button>
            <button
              disabled={stale || run.events.length === 0 || atEnd || pausedAtDifference}
              onClick={() => onJumpTo(runUntilIndex)}
              type="button"
            >运行到底</button>
            <button disabled={stale || playbackIndex < 0} onClick={() => onJumpTo(-1)} type="button">重置</button>
          </div>
          <div className="test-field-experiment-timeline">
            {run.events.map((event, index) => (
              <button
                className={`${index === playbackIndex ? 'is-active' : ''}${event.status === 'blocked' ? ' is-blocked' : ''}`}
                disabled={stale || index > playbackIndex}
                key={event.id}
                onClick={() => onJumpTo(index)}
                type="button"
              >
                <b>{index + 1}</b>
                <span><strong>{event.title}</strong><small>{event.parallel ? `第 ${event.batchIndex + 1} 批 · 并行` : `第 ${event.batchIndex + 1} 批`}</small></span>
              </button>
            ))}
          </div>
          {evaluation && (
            <div className="test-field-expectation-results" aria-label="预期和实际对照">
              <header><strong>预期 / 实际</strong><small>由证据自动对照，不修改你的标准</small></header>
              {evaluation.results.map((result) => (
                <div className={`is-${result.status}`} key={result.expectationId}>
                  {result.status === 'passed'
                    ? <CheckCircle size={17} weight="fill" />
                    : result.status === 'failed'
                      ? <XCircle size={17} weight="fill" />
                      : <span className="test-field-pending-dot" />}
                  <span><strong>{result.expected}</strong><small>{result.actual}</small></span>
                </div>
              ))}
            </div>
          )}
          {(atEnd || pausedAtDifference) && evaluation && (
            <div className={`test-field-experiment-result is-${evaluation.status}`}>
              <strong>{evaluation.status === 'passed' ? '全部符合你的预期' : '实验结果与预期不同'}</strong>
              <span>{evaluation.status === 'passed' ? '这次方案通过实验验收' : '差异已保留，请回到工程总图排查'}</span>
            </div>
          )}
        </>
      )}
      <button
        className="test-field-prepare-button"
        disabled={expectations.length === 0}
        onClick={onPrepare}
        type="button"
      >
        {experiment ? '重新准备实验' : '准备实验'}
      </button>
      {expectations.length === 0 && <small className="test-field-prepare-hint">先由总工程师写下至少一项预期。</small>}
      <footer>本地模拟 · 未连接真实小车</footer>
    </div>
  );
}

function ExpectationEditor({
  expectations,
  scene,
  taskSuccessCriteria,
  onSave,
}: {
  expectations: ExperimentExpectation[];
  scene: SceneDefinition;
  taskSuccessCriteria: string[];
  onSave: (expectations: ExperimentExpectation[]) => void;
}) {
  const targets = scene.entities.filter(({ kind }) => kind === 'target-landmark');
  const savedTarget = expectations.find(({ kind }) => kind === 'reach-target');
  const savedSpeech = expectations.find(({ kind }) => kind === 'say-text');
  const savedOrder = expectations.find(({ kind }) => kind === 'speech-after-target');
  const [editing, setEditing] = useState(expectations.length === 0);
  const [checkTarget, setCheckTarget] = useState(Boolean(savedTarget));
  const [targetId, setTargetId] = useState(
    savedTarget?.kind === 'reach-target' ? savedTarget.targetEntityId : targets[0]?.id ?? '',
  );
  const [checkSpeech, setCheckSpeech] = useState(Boolean(savedSpeech));
  const [speechText, setSpeechText] = useState(
    savedSpeech?.kind === 'say-text' ? savedSpeech.text : '',
  );
  const [checkSafety, setCheckSafety] = useState(
    expectations.some(({ kind }) => kind === 'avoid-collision'),
  );
  const [checkOrder, setCheckOrder] = useState(Boolean(savedOrder));
  const canSave = (checkTarget && Boolean(targetId)) || (checkSpeech && Boolean(speechText.trim())) || checkSafety;

  useEffect(() => {
    if (!targetId && targets[0]) setTargetId(targets[0].id);
    if (expectations.length === 0) setEditing(true);
  }, [expectations.length, targetId, targets]);

  if (!editing) {
    return (
      <section className="test-field-expectation-summary">
        <header><span><small>总工程师的实验计划</small><strong>我预测会发生什么</strong></span><button onClick={() => setEditing(true)} type="button">修改预期</button></header>
        {expectations.map((expectation) => (
          <span key={expectation.id}>{describeExpectation(expectation, scene)}</span>
        ))}
      </section>
    );
  }

  return (
    <section className="test-field-expectation-editor">
      <header><small>第 1 步 · 先预测，后实验</small><strong>你认为小车会怎样？</strong></header>
      {taskSuccessCriteria.length > 0 && (
        <details><summary>查看任务验收提醒</summary>{taskSuccessCriteria.map((criterion) => <span key={criterion}>{criterion}</span>)}</details>
      )}
      <label>
        <input checked={checkTarget} disabled={targets.length === 0} onChange={(event) => setCheckTarget(event.target.checked)} type="checkbox" />
        最终到达
        <select disabled={!checkTarget} onChange={(event) => setTargetId(event.target.value)} value={targetId}>
          {targets.length === 0 && <option value="">先在场地放置目标</option>}
          {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
        </select>
      </label>
      <label>
        <input checked={checkSpeech} onChange={(event) => setCheckSpeech(event.target.checked)} type="checkbox" />
        小车会说
        <input disabled={!checkSpeech} maxLength={80} onChange={(event) => setSpeechText(event.target.value)} placeholder="写下你预计听到的话" value={speechText} />
      </label>
      <label className="is-safety">
        <input checked={checkSafety} onChange={(event) => setCheckSafety(event.target.checked)} type="checkbox" />
        全程不碰撞、不越界
      </label>
      <label className="is-safety">
        <input
          checked={checkOrder}
          disabled={!checkTarget || !checkSpeech || !targetId || !speechText.trim()}
          onChange={(event) => setCheckOrder(event.target.checked)}
          type="checkbox"
        />
        必须到达目标以后再说话
      </label>
      <div>
        {expectations.length > 0 && <button onClick={() => setEditing(false)} type="button">取消</button>}
        <button
          className="is-primary"
          disabled={!canSave}
          onClick={() => {
            const next: ExperimentExpectation[] = [];
            if (checkTarget && targetId) next.push({ id: createTestFieldId('expect-target'), kind: 'reach-target', targetEntityId: targetId });
            if (checkSpeech && speechText.trim()) next.push({ id: createTestFieldId('expect-speech'), kind: 'say-text', text: speechText.trim() });
            if (checkSafety) next.push({ id: createTestFieldId('expect-safety'), kind: 'avoid-collision' });
            if (checkOrder && checkTarget && targetId && checkSpeech && speechText.trim()) {
              next.push({ id: createTestFieldId('expect-order'), kind: 'speech-after-target', targetEntityId: targetId, text: speechText.trim() });
            }
            onSave(next);
            setEditing(false);
          }}
          type="button"
        >确认我的预期</button>
      </div>
    </section>
  );
}

function describeExpectation(expectation: ExperimentExpectation, scene: SceneDefinition): string {
  if (expectation.kind === 'avoid-collision') return '✓ 全程不碰撞、不越界';
  if (expectation.kind === 'say-text') return `✓ 小车说：“${expectation.text}”`;
  if (expectation.kind === 'speech-after-target') {
    const target = scene.entities.find(({ id }) => id === expectation.targetEntityId);
    return `✓ 到达“${target?.label ?? '目标'}”后再说话`;
  }
  const target = scene.entities.find(({ id }) => id === expectation.targetEntityId);
  return `✓ 最终到达“${target?.label ?? '目标'}”`;
}

function SceneEntityInspector({
  entity,
  onCommand,
}: {
  entity: SceneEntity;
  onCommand: (command: BlueprintCommandInput) => void;
}) {
  const [label, setLabel] = useState(entity.label);
  const [meaning, setMeaning] = useState(entity.meaning);
  const [width, setWidth] = useState(entity.size.width.toString());
  const [height, setHeight] = useState(entity.size.height.toString());
  const [rotation, setRotation] = useState(entity.rotation.toString());

  useEffect(() => {
    setLabel(entity.label);
    setMeaning(entity.meaning);
    setWidth(entity.size.width.toString());
    setHeight(entity.size.height.toString());
    setRotation(entity.rotation.toString());
  }, [entity]);

  const kindLabel = entityPresets.find(({ kind }) => kind === entity.kind)?.label ?? '场景图元';
  return (
    <form
      className="test-field-entity-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!label.trim()) return;
        onCommand({
          type: 'scene.entity-update',
          entityId: entity.id,
          label,
          meaning,
          size: {
            width: Number(width) || entity.size.width,
            height: Number(height) || entity.size.height,
          },
          rotation: Number(rotation) || 0,
        });
      }}
    >
      <header><small>{kindLabel}</small><strong>{entity.label}</strong></header>
      <label>名称<input maxLength={24} onChange={(event) => setLabel(event.target.value)} value={label} /></label>
      <label>它在实验中代表什么<textarea maxLength={100} onChange={(event) => setMeaning(event.target.value)} rows={3} value={meaning} /></label>
      <fieldset>
        <legend>大小（米）</legend>
        <label>宽<input min="0.25" onChange={(event) => setWidth(event.target.value)} step="0.25" type="number" value={width} /></label>
        <label>高<input min="0.25" onChange={(event) => setHeight(event.target.value)} step="0.25" type="number" value={height} /></label>
      </fieldset>
      <label>朝向
        <select onChange={(event) => setRotation(event.target.value)} value={rotation}>
          <option value="0">向上 · 0°</option>
          <option value="90">向右 · 90°</option>
          <option value="180">向下 · 180°</option>
          <option value="270">向左 · 270°</option>
        </select>
      </label>
      <div className="test-field-position-readout">
        <span>X <strong>{entity.position.x.toFixed(2)}m</strong></span>
        <span>Y <strong>{entity.position.y.toFixed(2)}m</strong></span>
      </div>
      <button className="is-primary" type="submit">保存图元设定</button>
      <button
        className="is-delete"
        onClick={() => onCommand({ type: 'scene.entity-delete', entityId: entity.id })}
        type="button"
      ><Trash size={17} />删除这个图元</button>
    </form>
  );
}

function createSceneEntity(kind: (typeof entityPresets)[number]['kind'], scene: SceneDefinition): SceneEntity {
  const sameKindCount = scene.entities.filter((entity) => entity.kind === kind).length;
  const defaults = kind === 'robot-start'
    ? { label: '小车起点', meaning: '小车开始实验的位置', position: { x: 0.75, y: 4.5 }, size: { width: 0.75, height: 0.75 } }
    : kind === 'target-landmark'
      ? { label: `目标${sameKindCount + 1}`, meaning: '小车需要到达的目标', position: { x: 6.25, y: 0.75 + sameKindCount }, size: { width: 0.75, height: 0.75 } }
      : { label: `障碍${sameKindCount + 1}`, meaning: '小车不能穿过的区域', position: { x: 3.25, y: 2.5 + sameKindCount * 0.75 }, size: { width: 1.5, height: 0.5 } };
  return clampSceneEntity(scene, {
    id: createTestFieldId(kind),
    kind,
    ...defaults,
    rotation: 0,
    sourceStrokeIds: [],
  });
}

function createTestFieldId(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}
