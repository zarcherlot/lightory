import '@xyflow/react/dist/style.css';

import {
  ArrowCounterClockwise,
  ArrowRight,
  Circle,
  CursorClick,
  Eraser,
  PencilSimple,
  Rectangle,
  Trash,
} from '@phosphor-icons/react';
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type NodeChange,
  type OnNodeDrag,
  ReactFlow,
  useReactFlow,
  ViewportPortal,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  BLUEPRINT_ARTIFACT_NODE_COLOR,
  BLUEPRINT_FUNCTION_NODE_COLOR,
  BLUEPRINT_GRID_COLOR,
  BLUEPRINT_MINIMAP_MASK_COLOR,
} from '../../constants.js';
import { eraseStrokeSegments, findNodesIntersectingEraser } from '../canvas/eraseStrokes.js';
import {
  type BlueprintFlowEdge,
  type BlueprintFlowNode,
  projectBlueprintToFlow,
  toBlueprintPosition,
} from '../canvas/flowProjection.js';
import { getInkSvgPath } from '../canvas/inkPath.js';
import {
  type RecognitionCandidate,
  WebGeometryInkRecognizer,
} from '../canvas/recognition/index.js';
import type { BlueprintCommandInput } from '../domain/commands.js';
import type {
  BlueprintDocument,
  BlueprintNode,
  BlueprintNodeKind,
  BlueprintRelation,
  InkPoint,
  InkStroke,
} from '../domain/types.js';
import { ArtifactNodeView, ContainerNodeView, FunctionNodeView } from './BlueprintNodeViews.js';

export type CanvasTool = 'select' | 'pen' | 'eraser' | 'connector';

interface EngineeringCanvasProps {
  document: BlueprintDocument;
  canUndo: boolean;
  canRedo: boolean;
  onCommand: (command: BlueprintCommandInput) => void;
  onUndo: () => void;
  onRedo: () => void;
}

interface PendingConnection {
  sourceId: string;
  targetId: string;
  sourceStrokeIds: string[];
}

const nodeTypes = {
  function: FunctionNodeView,
  artifact: ArtifactNodeView,
  container: ContainerNodeView,
};

const recognizer = new WebGeometryInkRecognizer();

export function EngineeringCanvas(props: EngineeringCanvasProps) {
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const projection = useMemo(() => projectBlueprintToFlow(props.document), [props.document]);
  const [flowNodes, setFlowNodes] = useState<BlueprintFlowNode[]>(projection.nodes);
  const [candidate, setCandidate] = useState<RecognitionCandidate | null>(null);
  const [candidateLabel, setCandidateLabel] = useState('');
  const [currentStroke, setCurrentStroke] = useState<InkStroke | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [connectorDraft, setConnectorDraft] = useState<{
    sourceId: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingNode, setEditingNode] = useState<{
    id: string;
    label: string;
    kind: BlueprintNodeKind;
  } | null>(null);
  const pendingStrokesRef = useRef<InkStroke[]>([]);
  const recognitionTimerRef = useRef<number | null>(null);

  useEffect(() => setFlowNodes(projection.nodes), [projection.nodes]);
  useEffect(() => {
    if (!candidate) return;
    if (candidate.kind === 'ellipse') setCandidateLabel('线索卡');
    else if (candidate.kind === 'rectangle') setCandidateLabel('新模块');
    else if (candidate.kind === 'unknown') setCandidateLabel('新模块');
    else setCandidateLabel('');
  }, [candidate]);

  useEffect(() => {
    if (!candidate) return;
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.engineering-recognition-card')) return;
      setCandidate(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCandidate(null);
    };
    window.document.addEventListener('pointerdown', dismissOnOutsidePointer, true);
    window.document.addEventListener('keydown', dismissOnEscape);
    return () => {
      window.document.removeEventListener('pointerdown', dismissOnOutsidePointer, true);
      window.document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [candidate]);

  useEffect(
    () => () => {
      if (recognitionTimerRef.current !== null) window.clearTimeout(recognitionTimerRef.current);
    },
    [],
  );

  const handleNodesChange = useCallback((changes: NodeChange<BlueprintFlowNode>[]) => {
    setFlowNodes((nodes) => applyNodeChanges(changes, nodes));
  }, []);

  const handleNodeDragStop: OnNodeDrag<BlueprintFlowNode> = useCallback(
    (_event, node) => {
      props.onCommand({
        type: 'node.move',
        nodeId: node.id,
        position: toBlueprintPosition(node.id, node.position, props.document),
      });
    },
    [props],
  );

  const handleStrokeComplete = useCallback(
    (stroke: InkStroke) => {
      props.onCommand({ type: 'stroke.add', stroke });
      pendingStrokesRef.current.push(stroke);
      if (recognitionTimerRef.current !== null) window.clearTimeout(recognitionTimerRef.current);
      recognitionTimerRef.current = window.setTimeout(() => {
        const group = pendingStrokesRef.current;
        pendingStrokesRef.current = [];
        void recognizer
          .recognize({ requestId: createId('recognition'), strokes: group, mode: 'shape' })
          .then((results) => setCandidate(results[0] ?? null));
      }, 250);
    },
    [props],
  );

  const createNodeFromCandidate = useCallback(
    (kind: BlueprintNodeKind) => {
      if (!candidate?.bounds || !candidateLabel.trim()) return;
      const id = createId(kind);
      const bounds = candidate.bounds;
      const node: BlueprintNode = {
        id,
        kind,
        label: candidateLabel.trim(),
        position: { x: bounds.x, y: bounds.y },
        size: {
          width: Math.max(kind === 'artifact' ? 130 : 170, bounds.width),
          height: Math.max(kind === 'artifact' ? 130 : 110, bounds.height),
        },
        sourceStrokeIds: [],
        recognition: { source: 'web', confidence: candidate.confidence },
      };
      props.onCommand({ type: 'node.create', node });

      if (kind === 'container') {
        for (const child of props.document.nodes) {
          if (isNodeInside(child, node)) {
            props.onCommand({ type: 'node.set-parent', nodeId: child.id, parentId: id });
          }
        }
      }
      for (const strokeId of candidate.strokeIds) {
        props.onCommand({ type: 'stroke.delete', strokeId });
      }
      setCandidate(null);
    },
    [candidate, candidateLabel, props],
  );

  const connectRecognizedArrow = useCallback(() => {
    if (!candidate?.line) return;
    const source = findNodeAtPoint(candidate.line.start, props.document.nodes);
    const target = findNodeAtPoint(candidate.line.end, props.document.nodes);
    if (!source || !target || source.id === target.id) return;
    setPendingConnection({
      sourceId: source.id,
      targetId: target.id,
      sourceStrokeIds: candidate.strokeIds,
    });
    setCandidate(null);
  }, [candidate, props.document.nodes]);

  const confirmConnection = useCallback(
    (relation: BlueprintRelation) => {
      if (!pendingConnection) return;
      props.onCommand({
        type: 'edge.create',
        edge: {
          id: createId('edge'),
          sourceId: pendingConnection.sourceId,
          targetId: pendingConnection.targetId,
          relation,
          sourceStrokeIds: pendingConnection.sourceStrokeIds,
        },
      });
      for (const strokeId of pendingConnection.sourceStrokeIds) {
        props.onCommand({ type: 'stroke.delete', strokeId });
      }
      setPendingConnection(null);
    },
    [pendingConnection, props],
  );

  const candidateScreenPosition = candidate?.bounds
    ? flowToScreenPosition({
        x: candidate.bounds.x + candidate.bounds.width / 2,
        y: candidate.bounds.y + candidate.bounds.height,
      })
    : null;

  return (
    <div className="engineering-canvas-shell">
      <CanvasToolbar
        activeTool={activeTool}
        canRedo={props.canRedo}
        canUndo={props.canUndo}
        onRedo={props.onRedo}
        onClear={() => setShowClearConfirm(true)}
        onSelectTool={setActiveTool}
        onUndo={props.onUndo}
      />
      <ReactFlow<BlueprintFlowNode, BlueprintFlowEdge>
        colorMode="dark"
        deleteKeyCode={['Backspace', 'Delete']}
        edges={projection.edges}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.35}
        nodeTypes={nodeTypes}
        nodes={flowNodes}
        nodesConnectable={false}
        nodesDraggable={activeTool === 'select'}
        onEdgesDelete={(edges) =>
          edges.forEach((edge) => props.onCommand({ type: 'edge.delete', edgeId: edge.id }))
        }
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={(_event, flowNode) => {
          const node = props.document.nodes.find(({ id }) => id === flowNode.id);
          if (node) setEditingNode({ id: node.id, label: node.label, kind: node.kind });
        }}
        onNodesChange={handleNodesChange}
        onNodesDelete={(nodes) =>
          nodes.forEach((node) => props.onCommand({ type: 'node.delete', nodeId: node.id }))
        }
        panOnDrag={activeTool === 'select'}
        selectionOnDrag={activeTool === 'select'}
      >
        <Background
          color={BLUEPRINT_GRID_COLOR}
          gap={24}
          size={1}
          variant={BackgroundVariant.Lines}
        />
        <MiniMap
          className="engineering-minimap"
          maskColor={BLUEPRINT_MINIMAP_MASK_COLOR}
          nodeColor={(node) =>
            node.type === 'artifact' ? BLUEPRINT_ARTIFACT_NODE_COLOR : BLUEPRINT_FUNCTION_NODE_COLOR
          }
        />
        <Controls className="engineering-controls" showInteractive={false} />
        <ViewportPortal>
          <InkRenderer currentStroke={currentStroke} document={props.document} />
          {connectorDraft && (
            <ConnectorPreview start={connectorDraft.start} end={connectorDraft.end} />
          )}
        </ViewportPortal>
      </ReactFlow>

      <InkCaptureLayer
        active={activeTool === 'pen'}
        currentStroke={currentStroke}
        onChange={setCurrentStroke}
        onComplete={handleStrokeComplete}
        screenToFlowPosition={screenToFlowPosition}
      />

      <EraserCaptureLayer
        active={activeTool === 'eraser'}
        onErase={(eraserPath) => {
          const hitNodes = findNodesIntersectingEraser(props.document.nodes, eraserPath, 20);
          const nodeStrokeIds = new Set(hitNodes.flatMap(({ sourceStrokeIds }) => sourceStrokeIds));
          const replacements = eraseStrokeSegments(
            props.document.strokes.filter(({ id }) => !nodeStrokeIds.has(id)),
            eraserPath,
            20,
            () => createId('stroke'),
          );
          for (const strokeId of nodeStrokeIds) {
            props.onCommand({ type: 'stroke.delete', strokeId });
          }
          for (const node of hitNodes) props.onCommand({ type: 'node.delete', nodeId: node.id });
          if (replacements.length > 0) props.onCommand({ type: 'stroke.replace', replacements });
        }}
        screenToFlowPosition={screenToFlowPosition}
      />

      <ConnectorCaptureLayer
        active={activeTool === 'connector'}
        draft={connectorDraft}
        nodes={props.document.nodes}
        onChange={setConnectorDraft}
        onComplete={(sourceId, targetId) => {
          setPendingConnection({ sourceId, targetId, sourceStrokeIds: [] });
          setConnectorDraft(null);
        }}
        screenToFlowPosition={screenToFlowPosition}
      />

      {candidate && candidateScreenPosition && (
        <RecognitionCard
          candidate={candidate}
          label={candidateLabel}
          onConnectArrow={connectRecognizedArrow}
          onCreateNode={createNodeFromCandidate}
          onDismiss={() => setCandidate(null)}
          onLabelChange={setCandidateLabel}
          style={{ left: candidateScreenPosition.x, top: candidateScreenPosition.y }}
        />
      )}

      {pendingConnection && (
        <div className="engineering-relation-dialog" role="dialog" aria-label="选择连线关系">
          <strong>这条连线表示什么？</strong>
          <span>总工程师需要明确模块之间的交付。</span>
          <div>
            <button onClick={() => confirmConnection('trigger')} type="button">
              触发
            </button>
            <button onClick={() => confirmConnection('data')} type="button">
              数据
            </button>
            <button className="is-ghost" onClick={() => setPendingConnection(null)} type="button">
              取消
            </button>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="engineering-clear-backdrop" role="presentation">
          <div className="engineering-clear-dialog" role="dialog" aria-label="清空工程画布">
            <strong>清空整张工程画布？</strong>
            <span>草图、模块和连线都会清除；你仍可使用“撤销”恢复。</span>
            <div>
              <button
                onClick={() => {
                  props.onCommand({ type: 'document.clear' });
                  setShowClearConfirm(false);
                }}
                type="button"
              >
                确认清空
              </button>
              <button className="is-ghost" onClick={() => setShowClearConfirm(false)} type="button">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {editingNode && (
        <NodeEditDialog
          draft={editingNode}
          onCancel={() => setEditingNode(null)}
          onChange={setEditingNode}
          onSave={() => {
            props.onCommand({
              type: 'node.update',
              nodeId: editingNode.id,
              label: editingNode.label,
              kind: editingNode.kind,
            });
            setEditingNode(null);
          }}
        />
      )}
    </div>
  );
}

function CanvasToolbar({
  activeTool,
  canUndo,
  canRedo,
  onSelectTool,
  onUndo,
  onRedo,
  onClear,
}: {
  activeTool: CanvasTool;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: CanvasTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}) {
  const tools = [
    { id: 'select' as const, label: '选择', icon: CursorClick },
    { id: 'pen' as const, label: '画笔', icon: PencilSimple },
    { id: 'eraser' as const, label: '橡皮', icon: Eraser },
    { id: 'connector' as const, label: '连线', icon: ArrowRight },
  ];
  return (
    <nav className="engineering-toolbar" aria-label="工程画布工具">
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          aria-pressed={activeTool === id}
          className={activeTool === id ? 'is-active' : ''}
          key={id}
          onClick={() => onSelectTool(id)}
          type="button"
        >
          <Icon size={23} weight={activeTool === id ? 'fill' : 'regular'} />
          <span>{label}</span>
        </button>
      ))}
      <div className="engineering-toolbar-divider" />
      <button disabled={!canUndo} onClick={onUndo} type="button">
        <ArrowCounterClockwise size={22} />
        <span>撤销</span>
      </button>
      <button disabled={!canRedo} onClick={onRedo} type="button">
        <ArrowCounterClockwise className="is-flipped" size={22} />
        <span>重做</span>
      </button>
      <button onClick={onClear} type="button">
        <Trash size={22} />
        <span>清空</span>
      </button>
      <div className="engineering-shape-legend">
        <span>
          <Rectangle size={18} /> 功能/子系统
        </span>
        <span>
          <Circle size={18} /> 成果
        </span>
      </div>
    </nav>
  );
}

function InkCaptureLayer({
  active,
  currentStroke,
  onChange,
  onComplete,
  screenToFlowPosition,
}: {
  active: boolean;
  currentStroke: InkStroke | null;
  onChange: (stroke: InkStroke | null) => void;
  onComplete: (stroke: InkStroke) => void;
  screenToFlowPosition: (point: { x: number; y: number }) => { x: number; y: number };
}) {
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!active || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange({
      id: createId('stroke'),
      pointerKind: normalizePointerKind(event.pointerType),
      createdAt: Date.now(),
      points: [toInkPoint(event.nativeEvent, screenToFlowPosition)],
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentStroke || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    const points = events.map((item) => toInkPoint(item, screenToFlowPosition));
    onChange({ ...currentStroke, points: [...currentStroke.points, ...points] });
  };

  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentStroke) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const finalStroke = {
      ...currentStroke,
      points: [...currentStroke.points, toInkPoint(event.nativeEvent, screenToFlowPosition)],
    };
    onComplete(finalStroke);
    onChange(null);
  };

  return (
    <div
      className={`engineering-ink-capture ${active ? 'is-active' : ''}`}
      onPointerCancel={finish}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finish}
    />
  );
}

function EraserCaptureLayer({
  active,
  onErase,
  screenToFlowPosition,
}: {
  active: boolean;
  onErase: (path: Array<{ x: number; y: number }>) => void;
  screenToFlowPosition: (point: { x: number; y: number }) => { x: number; y: number };
}) {
  const pathRef = useRef<Array<{ x: number; y: number }>>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const updateCursor = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setCursor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  };
  const addPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    pathRef.current.push(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    updateCursor(event);
  };
  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    addPoint(event);
    event.currentTarget.releasePointerCapture(event.pointerId);
    onErase(pathRef.current);
    pathRef.current = [];
  };

  return (
    <div
      className={`engineering-eraser-capture ${active ? 'is-active' : ''}`}
      onPointerCancel={finish}
      onPointerDown={(event) => {
        if (!active || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pathRef.current = [];
        addPoint(event);
      }}
      onPointerLeave={() => setCursor(null)}
      onPointerMove={(event) => {
        updateCursor(event);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) addPoint(event);
      }}
      onPointerUp={finish}
    >
      {active && cursor && (
        <span className="engineering-eraser-cursor" style={{ left: cursor.x, top: cursor.y }} />
      )}
    </div>
  );
}

function ConnectorCaptureLayer({
  active,
  draft,
  nodes,
  onChange,
  onComplete,
  screenToFlowPosition,
}: {
  active: boolean;
  draft: {
    sourceId: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
  nodes: BlueprintNode[];
  onChange: (
    draft: {
      sourceId: string;
      start: { x: number; y: number };
      end: { x: number; y: number };
    } | null,
  ) => void;
  onComplete: (sourceId: string, targetId: string) => void;
  screenToFlowPosition: (point: { x: number; y: number }) => { x: number; y: number };
}) {
  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft) return;
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const target = findNodeAtPoint(point, nodes, false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (target && target.id !== draft.sourceId) onComplete(draft.sourceId, target.id);
    else onChange(null);
  };

  return (
    <div
      className={`engineering-connector-capture ${active ? 'is-active' : ''}`}
      onPointerCancel={finish}
      onPointerDown={(event) => {
        if (!active || event.button !== 0) return;
        const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const source = findNodeAtPoint(point, nodes, false);
        if (!source) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        onChange({ sourceId: source.id, start: point, end: point });
      }}
      onPointerMove={(event) => {
        if (!draft || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        onChange({
          ...draft,
          end: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        });
      }}
      onPointerUp={finish}
    />
  );
}

function ConnectorPreview({
  start,
  end,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
}) {
  return (
    <svg className="engineering-connector-preview" aria-hidden="true">
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      <circle cx={end.x} cy={end.y} r="5" />
    </svg>
  );
}

function InkRenderer({
  document,
  currentStroke,
}: {
  document: BlueprintDocument;
  currentStroke: InkStroke | null;
}) {
  const consumed = new Set([
    ...document.nodes.flatMap(({ sourceStrokeIds }) => sourceStrokeIds),
    ...document.edges.flatMap(({ sourceStrokeIds }) => sourceStrokeIds),
  ]);
  const visibleStrokes = document.strokes.filter((stroke) => !consumed.has(stroke.id));
  const strokes = currentStroke ? [...visibleStrokes, currentStroke] : visibleStrokes;
  return (
    <svg className="engineering-ink-viewport" aria-hidden="true">
      {strokes.map((stroke) => (
        <path
          className={consumed.has(stroke.id) ? 'is-consumed' : ''}
          d={getInkSvgPath(stroke.points, stroke.id !== currentStroke?.id)}
          key={stroke.id}
        />
      ))}
    </svg>
  );
}

function NodeEditDialog({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: { id: string; label: string; kind: BlueprintNodeKind };
  onChange: (draft: { id: string; label: string; kind: BlueprintNodeKind }) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const kinds: Array<{ id: BlueprintNodeKind; label: string }> = [
    { id: 'function', label: '功能模块' },
    { id: 'artifact', label: '成果节点' },
    { id: 'container', label: '子系统' },
  ];
  return (
    <div className="engineering-clear-backdrop" role="presentation">
      <div className="engineering-node-edit-dialog" role="dialog" aria-label="编辑模块">
        <strong>编辑模块</strong>
        <label>
          名称
          <input
            autoFocus
            value={draft.label}
            onChange={(event) => onChange({ ...draft, label: event.target.value })}
          />
        </label>
        <fieldset>
          <legend>模块类型</legend>
          <div>
            {kinds.map((kind) => (
              <button
                aria-pressed={draft.kind === kind.id}
                className={draft.kind === kind.id ? 'is-active' : ''}
                key={kind.id}
                onClick={() => onChange({ ...draft, kind: kind.id })}
                type="button"
              >
                {kind.label}
              </button>
            ))}
          </div>
        </fieldset>
        <small>提示：选择工具下双击模块，可以随时再次编辑。</small>
        <div className="engineering-node-edit-actions">
          <button disabled={!draft.label.trim()} onClick={onSave} type="button">
            保存修改
          </button>
          <button className="is-ghost" onClick={onCancel} type="button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function RecognitionCard({
  candidate,
  label,
  style,
  onLabelChange,
  onCreateNode,
  onConnectArrow,
  onDismiss,
}: {
  candidate: RecognitionCandidate;
  label: string;
  style: React.CSSProperties;
  onLabelChange: (label: string) => void;
  onCreateNode: (kind: BlueprintNodeKind) => void;
  onConnectArrow: () => void;
  onDismiss: () => void;
}) {
  const confidence = Math.round(candidate.confidence * 100);
  return (
    <div className="engineering-recognition-card" role="dialog" style={style}>
      <div>
        <strong>识别候选：{recognitionLabel(candidate.kind)}</strong>
        <span className={candidate.confidence >= 0.85 ? 'is-confident' : ''}>{confidence}%</span>
      </div>
      {candidate.kind === 'rectangle' || candidate.kind === 'ellipse' ? (
        <>
          <label>
            名称
            <input value={label} onChange={(event) => onLabelChange(event.target.value)} />
          </label>
          <div className="engineering-recognition-actions">
            {candidate.kind === 'rectangle' ? (
              <>
                <button
                  disabled={!label.trim()}
                  onClick={() => onCreateNode('function')}
                  type="button"
                >
                  功能模块
                </button>
                <button
                  disabled={!label.trim()}
                  onClick={() => onCreateNode('container')}
                  type="button"
                >
                  子系统
                </button>
              </>
            ) : (
              <button
                disabled={!label.trim()}
                onClick={() => onCreateNode('artifact')}
                type="button"
              >
                成果节点
              </button>
            )}
            <button className="is-ghost" onClick={onDismiss} type="button">
              保留笔迹
            </button>
          </div>
        </>
      ) : candidate.kind === 'unknown' ? (
        <>
          <p className="engineering-recognition-help">
            我不太确定。请由总工程师决定这段笔迹表示什么。
          </p>
          <label>
            名称
            <input value={label} onChange={(event) => onLabelChange(event.target.value)} />
          </label>
          <div className="engineering-recognition-actions">
            <button disabled={!label.trim()} onClick={() => onCreateNode('function')} type="button">
              功能模块
            </button>
            <button
              disabled={!label.trim()}
              onClick={() => onCreateNode('container')}
              type="button"
            >
              子系统
            </button>
            <button disabled={!label.trim()} onClick={() => onCreateNode('artifact')} type="button">
              成果节点
            </button>
            <button className="is-ghost" onClick={onDismiss} type="button">
              保留笔迹
            </button>
          </div>
        </>
      ) : candidate.kind === 'arrow' ? (
        <div className="engineering-recognition-actions">
          <button onClick={onConnectArrow} type="button">
            建立连接
          </button>
          <button className="is-ghost" onClick={onDismiss} type="button">
            保留笔迹
          </button>
        </div>
      ) : (
        <div className="engineering-recognition-actions">
          <span>直线已识别，画出箭头或使用连线工具建立关系。</span>
          <button className="is-ghost" onClick={onDismiss} type="button">
            知道了
          </button>
        </div>
      )}
    </div>
  );
}

function toInkPoint(
  event: PointerEvent,
  screenToFlowPosition: (point: { x: number; y: number }) => { x: number; y: number },
): InkPoint {
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
  return {
    ...position,
    t: event.timeStamp,
    pressure: event.pointerType === 'mouse' ? 0.5 : Math.max(0, Math.min(1, event.pressure)),
  };
}

function normalizePointerKind(pointerType: string): InkStroke['pointerKind'] {
  return pointerType === 'pen' || pointerType === 'touch' ? pointerType : 'mouse';
}

function isNodeInside(child: BlueprintNode, parent: BlueprintNode): boolean {
  if (child.id === parent.id) return false;
  const centerX = child.position.x + child.size.width / 2;
  const centerY = child.position.y + child.size.height / 2;
  return (
    centerX >= parent.position.x &&
    centerX <= parent.position.x + parent.size.width &&
    centerY >= parent.position.y &&
    centerY <= parent.position.y + parent.size.height
  );
}

function findNodeAtPoint(
  point: { x: number; y: number },
  nodes: BlueprintNode[],
  allowNearby = true,
): BlueprintNode | null {
  const direct = nodes
    .filter(
      (node) =>
        point.x >= node.position.x &&
        point.x <= node.position.x + node.size.width &&
        point.y >= node.position.y &&
        point.y <= node.position.y + node.size.height,
    )
    .sort((a, b) => {
      if (a.kind === 'container' && b.kind !== 'container') return 1;
      if (a.kind !== 'container' && b.kind === 'container') return -1;
      return a.size.width * a.size.height - b.size.width * b.size.height;
    })[0];
  if (direct) return direct;
  if (!allowNearby) return null;
  const ranked = nodes
    .map((node) => ({
      node,
      distance: Math.hypot(
        point.x - (node.position.x + node.size.width / 2),
        point.y - (node.position.y + node.size.height / 2),
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
  return ranked[0] && ranked[0].distance <= 80 ? ranked[0].node : null;
}

function recognitionLabel(kind: RecognitionCandidate['kind']): string {
  if (kind === 'rectangle') return '功能模块或子系统';
  if (kind === 'ellipse') return '成果节点';
  if (kind === 'arrow') return '模块连接';
  if (kind === 'line') return '连接线';
  return '待确认模块';
}

function createId(prefix: string): string {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}
