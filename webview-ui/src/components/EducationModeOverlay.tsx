import { useEffect, useRef, useState } from 'react';

import { CHARACTER_SITTING_OFFSET_PX, TOOL_OVERLAY_VERTICAL_OFFSET } from '../constants.js';
import type { OfficeState } from '../office/engine/officeState.js';
import { CharacterState, TILE_SIZE } from '../office/types.js';
import { getRoleConfigSummary, type RoleRuntimeConfig } from '../roleConfig.js';
import { getRoleAgentId, roleDefinitions } from '../roles.js';
import { Button } from './ui/Button.js';

const CARD_COLORS: Record<string, string> = {
  天气卡: 'var(--education-card-weather)',
  天气结果卡: 'var(--education-card-weather)',
  穿衣卡: 'var(--education-card-dresser)',
  穿衣建议卡: 'var(--education-card-dresser)',
  出行卡: 'var(--education-card-travel)',
  出行提醒卡: 'var(--education-card-travel)',
  计划卡: 'var(--education-card-plan)',
  趣味广播: 'var(--education-card-plan)',
  路线卡: 'var(--education-card-route)',
  路线提醒卡: 'var(--education-card-route)',
  知识卡: 'var(--education-card-knowledge)',
  知识讲解卡: 'var(--education-card-knowledge)',
  计算卡: 'var(--education-card-math)',
  计算结果卡: 'var(--education-card-math)',
  翻译卡: 'var(--education-card-translate)',
  翻译结果卡: 'var(--education-card-translate)',
  故事卡: 'var(--education-card-story)',
  故事草稿卡: 'var(--education-card-story)',
  海报卡: 'var(--education-card-poster)',
  海报方案卡: 'var(--education-card-poster)',
  检查卡: 'var(--education-card-check)',
  检查结果卡: 'var(--education-card-check)',
  总结卡: 'var(--education-card-summary)',
  问题卡: 'var(--education-card-question)',
  追问卡: 'var(--education-card-question)',
};

const ACCEPTS_CARD: Record<string, string[]> = {
  weather: [],
  dresser: ['天气卡'],
  travel: ['天气卡'],
  captain: ['穿衣卡', '出行卡'],
  navigator: ['天气卡', '出行卡'],
  encyclopedia: ['问题卡'],
  calculator: ['天气卡', '路线卡', '计划卡'],
  translator: ['计划卡', '总结卡', '知识卡'],
  storyteller: ['天气卡', '知识卡', '计划卡', '总结卡'],
  poster: ['计划卡', '总结卡', '故事卡'],
  checker: [
    '天气卡',
    '穿衣卡',
    '出行卡',
    '路线卡',
    '知识卡',
    '计算卡',
    '翻译卡',
    '故事卡',
    '海报卡',
    '计划卡',
    '总结卡',
    '问题卡',
  ],
  summarizer: [
    '天气卡',
    '穿衣卡',
    '出行卡',
    '路线卡',
    '知识卡',
    '计算卡',
    '翻译卡',
    '故事卡',
    '海报卡',
    '检查卡',
    '计划卡',
    '问题卡',
  ],
  questioner: [
    '天气卡',
    '穿衣卡',
    '出行卡',
    '路线卡',
    '知识卡',
    '计算卡',
    '翻译卡',
    '故事卡',
    '海报卡',
    '检查卡',
    '计划卡',
    '总结卡',
  ],
};

interface DraggedCard {
  sourceRoleId: string;
  card: string;
}

interface RolePosition {
  roleId: string;
  screenX: number;
  screenY: number;
}

interface ConnectionFeedback {
  id: number;
  sourceRoleId: string;
  targetRoleId: string;
  card: string;
}

export interface EducationConnection {
  sourceRoleId: string;
  targetRoleId: string;
  card: string;
}

export interface EducationConnectionPulse extends EducationConnection {
  pulseId: number;
}

export type EducationRunStatus = 'idle' | 'running' | 'pausing' | 'paused' | 'completed' | 'error';

interface ErrorFeedback {
  id: number;
  text: string;
}

interface EducationModeOverlayProps {
  officeState: OfficeState;
  activeRoleIds: Set<string>;
  isEditMode: boolean;
  runStatus: EducationRunStatus;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panRef: React.RefObject<{ x: number; y: number }>;
  activeFlowConnections: EducationConnectionPulse[];
  roleConfigs: Record<string, RoleRuntimeConfig>;
  roleResultCards: Record<string, string>;
  onConfigureRole: (roleId: string) => void;
  onRunTeam: (connections: EducationConnection[]) => void;
  onPauseRun: () => void;
  onResumeRun: () => void;
  onStopRun: () => void;
  onBackToEdit: () => void;
}

export function EducationModeOverlay({
  officeState,
  activeRoleIds,
  isEditMode,
  runStatus,
  containerRef,
  zoom,
  panRef,
  activeFlowConnections,
  roleConfigs,
  roleResultCards,
  onConfigureRole,
  onRunTeam,
  onPauseRun,
  onResumeRun,
  onStopRun,
  onBackToEdit,
}: EducationModeOverlayProps) {
  const [, setTick] = useState(0);
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [hoveredTargetRoleId, setHoveredTargetRoleId] = useState<string | null>(null);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [connections, setConnections] = useState<EducationConnection[]>([]);
  const [connectionFeedbacks, setConnectionFeedbacks] = useState<ConnectionFeedback[]>([]);
  const [errorFeedback, setErrorFeedback] = useState<ErrorFeedback | null>(null);
  const feedbackIdRef = useRef(0);
  const seenFlowPulseIdsRef = useRef<Set<number>>(new Set());
  const rolePositionsRef = useRef<RolePosition[]>([]);

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      setTick((n) => n + 1);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    for (const connection of activeFlowConnections) {
      if (seenFlowPulseIdsRef.current.has(connection.pulseId)) continue;
      seenFlowPulseIdsRef.current.add(connection.pulseId);
      const id = ++feedbackIdRef.current;
      setConnectionFeedbacks((prev) => [...prev, { id, ...connection }]);
      window.setTimeout(() => {
        setConnectionFeedbacks((prev) => prev.filter((feedback) => feedback.id !== id));
      }, 1900);
    }
  }, [activeFlowConnections]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const getRoleAtPoint = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return (
        rolePositionsRef.current.find(
          (position) =>
            Math.abs(position.screenX - x) <= 52 && Math.abs(position.screenY - 42 - y) <= 52,
        ) ?? null
      );
    };

    const handleMouseMove = (event: MouseEvent) => {
      const role = getRoleAtPoint(event.clientX, event.clientY);
      setHoveredRoleId((roleId) => (roleId === role?.roleId ? roleId : (role?.roleId ?? null)));
    };

    const handleMouseLeave = () => setHoveredRoleId(null);

    const handleClick = (event: MouseEvent) => {
      const role = getRoleAtPoint(event.clientX, event.clientY);
      if (!role) return;
      setSelectedRoleId((roleId) => (roleId === role.roleId ? null : role.roleId));
      if (isEditMode) onConfigureRole(role.roleId);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('click', handleClick);
    };
  }, [containerRef, isEditMode, onConfigureRole]);

  const el = containerRef.current;
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const canvasW = Math.round(rect.width * dpr);
  const canvasH = Math.round(rect.height * dpr);
  const layout = officeState.getLayout();
  const mapW = layout.cols * TILE_SIZE * zoom;
  const mapH = layout.rows * TILE_SIZE * zoom;
  const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(panRef.current.x);
  const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(panRef.current.y);
  const placedRoles = roleDefinitions.filter((role) => activeRoleIds.has(role.id));
  const canRun = placedRoles.length > 0;
  const rolePositions: RolePosition[] = roleDefinitions
    .map((role) => {
      const ch = officeState.characters.get(getRoleAgentId(role.id));
      if (!ch) return null;
      const sittingOffset =
        ch.state === CharacterState.TYPE || ch.state === CharacterState.BUSY
          ? CHARACTER_SITTING_OFFSET_PX
          : 0;
      return {
        roleId: role.id,
        screenX: (deviceOffsetX + ch.x * zoom) / dpr,
        screenY:
          (deviceOffsetY + (ch.y + sittingOffset - TOOL_OVERLAY_VERTICAL_OFFSET) * zoom) / dpr,
      };
    })
    .filter((position): position is RolePosition => position !== null);
  rolePositionsRef.current = rolePositions;

  const getPosition = (roleId: string) =>
    rolePositions.find((position) => position.roleId === roleId) ?? null;

  const isValidTarget = (card: string, sourceRoleId: string, targetRoleId: string) =>
    sourceRoleId !== targetRoleId && (ACCEPTS_CARD[targetRoleId] ?? []).includes(card);

  const getConnectionKey = (connection: EducationConnection) =>
    `${connection.sourceRoleId}->${connection.targetRoleId}:${connection.card}`;

  const getRoleConnectionKeys = (roleId: string | null) => {
    if (!roleId) return new Set<string>();
    return new Set(
      connections
        .filter(
          (connection) => connection.sourceRoleId === roleId || connection.targetRoleId === roleId,
        )
        .map(getConnectionKey),
    );
  };

  const hoveredConnectionKeys = getRoleConnectionKeys(hoveredRoleId);
  const selectedConnectionKeys = getRoleConnectionKeys(selectedRoleId);
  const focusedConnectionKeys =
    hoveredConnectionKeys.size > 0 ? hoveredConnectionKeys : selectedConnectionKeys;
  const hasFocusedConnections = focusedConnectionKeys.size > 0;

  const showError = (text: string) => {
    const id = ++feedbackIdRef.current;
    setErrorFeedback({ id, text });
    window.setTimeout(() => {
      setErrorFeedback((current) => (current?.id === id ? null : current));
    }, 2000);
  };

  const showConnection = (sourceRoleId: string, targetRoleId: string, card: string) => {
    const id = ++feedbackIdRef.current;
    setConnections((prev) => {
      if (
        prev.some(
          (connection) =>
            connection.sourceRoleId === sourceRoleId &&
            connection.targetRoleId === targetRoleId &&
            connection.card === card,
        )
      ) {
        return prev;
      }
      return [...prev, { sourceRoleId, targetRoleId, card }];
    });
    setConnectionFeedbacks((prev) => [...prev, { id, sourceRoleId, targetRoleId, card }]);
    window.setTimeout(() => {
      setConnectionFeedbacks((prev) => prev.filter((feedback) => feedback.id !== id));
    }, 1900);
  };

  const getFailureText = (card: string, targetRoleId: string) => {
    const target = roleDefinitions.find((role) => role.id === targetRoleId);
    const acceptingRole = placedRoles.find((role) => (ACCEPTS_CARD[role.id] ?? []).includes(card));
    if (acceptingRole)
      return `${target?.name ?? '这个角色'}不需要${card}，可以交给${acceptingRole.name}。`;
    return `${target?.name ?? '这个角色'}暂时不能接收${card}。`;
  };

  const statusText = (() => {
    if (isEditMode) return null;
    if (runStatus === 'running') return '运行中';
    if (runStatus === 'pausing') return '准备暂停';
    if (runStatus === 'paused') return '已暂停';
    if (runStatus === 'completed') return '已完成';
    if (runStatus === 'error') return '遇到问题';
    return '已停止';
  })();

  return (
    <>
      <div className="absolute top-10 left-10 z-30 pixel-panel px-10 py-8 max-w-360">
        <div className="flex items-center justify-between gap-8 mb-4">
          <div className="text-sm leading-tight text-text-muted">任务卡</div>
          {statusText ? (
            <div className="text-xs leading-none text-text-muted">{statusText}</div>
          ) : null}
        </div>
        <div className="text-base leading-tight mb-8">明天去学校 / 公园，需要准备什么？</div>
        {isEditMode ? (
          <Button
            variant={canRun ? 'accent' : 'disabled'}
            size="icon_lg"
            disabled={!canRun}
            onClick={() => onRunTeam(connections)}
            title={canRun ? '运行小队' : '先把角色拖进房间'}
            aria-label="运行小队"
          >
            <IconGlyph label="运行">▶</IconGlyph>
          </Button>
        ) : runStatus === 'running' || runStatus === 'pausing' ? (
          <div className="flex flex-wrap gap-6">
            <Button
              variant={runStatus === 'pausing' ? 'disabled' : 'default'}
              size="icon_lg"
              disabled={runStatus === 'pausing'}
              onClick={onPauseRun}
              title="当前这批角色完成后暂停"
              aria-label="暂停"
            >
              <IconGlyph label="暂停">Ⅱ</IconGlyph>
            </Button>
            <Button
              variant="default"
              size="icon_lg"
              onClick={onStopRun}
              title="停止后续角色运行"
              aria-label="停止"
            >
              <IconGlyph label="停止">■</IconGlyph>
            </Button>
          </div>
        ) : runStatus === 'paused' ? (
          <div className="flex flex-wrap gap-6">
            <Button
              variant="accent"
              size="icon_lg"
              onClick={onResumeRun}
              title="继续运行下一批角色"
              aria-label="继续运行"
            >
              <IconGlyph label="继续">▶</IconGlyph>
            </Button>
            <Button
              variant="default"
              size="icon_lg"
              onClick={onStopRun}
              title="停止后续角色运行"
              aria-label="停止"
            >
              <IconGlyph label="停止">■</IconGlyph>
            </Button>
          </div>
        ) : runStatus === 'completed' ? (
          <div className="flex flex-wrap gap-6">
            <Button
              variant="accent"
              size="icon_lg"
              onClick={() => onRunTeam(connections)}
              title="按当前连接再运行一次"
              aria-label="再跑一次"
            >
              <IconGlyph label="再跑一次">↻</IconGlyph>
            </Button>
            <Button
              variant="default"
              size="icon_lg"
              onClick={onBackToEdit}
              title="回到编辑模式调整小队"
              aria-label="回到编辑"
            >
              <IconGlyph label="回到编辑">✎</IconGlyph>
            </Button>
          </div>
        ) : runStatus === 'error' ? (
          <div className="flex flex-wrap gap-6">
            <Button
              variant="accent"
              size="icon_lg"
              onClick={() => onRunTeam(connections)}
              title="重新运行当前小队"
              aria-label="再试一次"
            >
              <IconGlyph label="再试一次">↻</IconGlyph>
            </Button>
            <Button
              variant="default"
              size="icon_lg"
              onClick={onBackToEdit}
              title="回到编辑模式修正连接"
              aria-label="回到编辑"
            >
              <IconGlyph label="回到编辑">✎</IconGlyph>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            <Button
              variant="accent"
              size="icon_lg"
              onClick={() => onRunTeam(connections)}
              title="按当前连接重新运行"
              aria-label="再跑一次"
            >
              <IconGlyph label="再跑一次">↻</IconGlyph>
            </Button>
            <Button
              variant="default"
              size="icon_lg"
              onClick={onBackToEdit}
              title="回到编辑模式"
              aria-label="回到编辑"
            >
              <IconGlyph label="回到编辑">✎</IconGlyph>
            </Button>
          </div>
        )}
      </div>

      {isEditMode && draggedCard && (
        <div className="absolute inset-0 z-32 pointer-events-none">
          {rolePositions.map((position) => {
            const valid = isValidTarget(
              draggedCard.card,
              draggedCard.sourceRoleId,
              position.roleId,
            );
            const hovered = hoveredTargetRoleId === position.roleId;
            return (
              <div
                key={position.roleId}
                className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 shadow-pixel ${
                  valid
                    ? 'border-status-success bg-status-success/20'
                    : 'border-danger bg-danger/15'
                } ${hovered ? 'scale-110' : ''}`}
                style={{
                  left: position.screenX,
                  top: position.screenY - 42,
                  width: 112,
                  height: 112,
                  pointerEvents: 'auto',
                  transition: 'transform 120ms ease',
                }}
                onDragEnter={() => setHoveredTargetRoleId(position.roleId)}
                onDragLeave={() =>
                  setHoveredTargetRoleId((id) => (id === position.roleId ? null : id))
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = valid ? 'copy' : 'none';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const payload = event.dataTransfer.getData('application/x-education-card');
                  let cardPayload = draggedCard;
                  if (payload) {
                    try {
                      cardPayload = JSON.parse(payload) as DraggedCard;
                    } catch {
                      cardPayload = draggedCard;
                    }
                  }
                  if (!cardPayload) return;
                  if (isValidTarget(cardPayload.card, cardPayload.sourceRoleId, position.roleId)) {
                    showConnection(cardPayload.sourceRoleId, position.roleId, cardPayload.card);
                  } else {
                    showError(getFailureText(cardPayload.card, position.roleId));
                  }
                  setDraggedCard(null);
                  setHoveredTargetRoleId(null);
                }}
              />
            );
          })}
        </div>
      )}

      {(connections.length > 0 || connectionFeedbacks.length > 0) && (
        <svg className="absolute inset-0 z-33 pointer-events-none w-full h-full">
          <defs>
            {[...connections, ...connectionFeedbacks].map((feedback, index) => {
              const color = CARD_COLORS[feedback.card] ?? 'var(--color-accent-bright)';
              return (
                <marker
                  key={`marker-${feedback.sourceRoleId}-${feedback.targetRoleId}-${feedback.card}-${index}`}
                  id={`education-arrow-${feedback.sourceRoleId}-${feedback.targetRoleId}-${feedback.card}-${index}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill={color} />
                </marker>
              );
            })}
          </defs>
          {connections.map((connection, index) => {
            const source = getPosition(connection.sourceRoleId);
            const target = getPosition(connection.targetRoleId);
            if (!source || !target) return null;
            return (
              <ConnectionCurve
                key={`${connection.sourceRoleId}-${connection.targetRoleId}-${connection.card}`}
                source={source}
                target={target}
                card={connection.card}
                markerId={`education-arrow-${connection.sourceRoleId}-${connection.targetRoleId}-${connection.card}-${index}`}
                persistent
                emphasized={
                  !hasFocusedConnections || focusedConnectionKeys.has(getConnectionKey(connection))
                }
                muted={
                  hasFocusedConnections && !focusedConnectionKeys.has(getConnectionKey(connection))
                }
              />
            );
          })}
          {connectionFeedbacks.map((feedback, index) => {
            const source = getPosition(feedback.sourceRoleId);
            const target = getPosition(feedback.targetRoleId);
            if (!source || !target) return null;
            return (
              <ConnectionCurve
                key={feedback.id}
                source={source}
                target={target}
                card={feedback.card}
                markerId={`education-arrow-${feedback.sourceRoleId}-${feedback.targetRoleId}-${feedback.card}-${connections.length + index}`}
                persistent={false}
                emphasized
                muted={false}
              />
            );
          })}
        </svg>
      )}

      {errorFeedback && (
        <div
          key={errorFeedback.id}
          className="absolute left-1/2 top-92 -translate-x-1/2 z-40 pixel-panel px-12 py-7 text-sm leading-tight max-w-420 text-center border-danger"
        >
          {errorFeedback.text}
        </div>
      )}

      {roleDefinitions.map((role) => {
        const ch = officeState.characters.get(getRoleAgentId(role.id));
        if (!ch) return null;
        const configSummary = getRoleConfigSummary(roleConfigs[role.id]);

        const sittingOffset =
          ch.state === CharacterState.TYPE || ch.state === CharacterState.BUSY
            ? CHARACTER_SITTING_OFFSET_PX
            : 0;
        const screenX = (deviceOffsetX + ch.x * zoom) / dpr;
        const screenY =
          (deviceOffsetY + (ch.y + sittingOffset - TOOL_OVERLAY_VERTICAL_OFFSET) * zoom) / dpr;

        if (!isEditMode) {
          const resultContent = roleResultCards[role.id];
          if (ch.roleTaskState !== 'weather' && !resultContent) return null;
          return (
            <div
              key={role.id}
              className="absolute z-31 -translate-x-1/2 pixel-panel px-8 py-6 w-220 text-center pointer-events-none"
              style={{ left: screenX, top: screenY - 88 }}
            >
              <div
                className="inline-block border-2 bg-bg-dark px-7 py-3 text-xs leading-none"
                style={{ borderColor: CARD_COLORS[role.resultCard] ?? undefined }}
              >
                {role.resultCard}
              </div>
              {resultContent ? (
                <div className="mt-5 max-h-76 overflow-hidden text-xs leading-tight text-left text-text break-words">
                  {formatResultCardPreview(resultContent)}
                </div>
              ) : (
                <div className="text-xs leading-tight mt-4">{role.name}完成</div>
              )}
            </div>
          );
        }

        return (
          <div
            key={role.id}
            className="absolute z-34 flex flex-col items-center gap-4 -translate-x-1/2 pointer-events-none"
            style={{ left: screenX, top: screenY - 92 }}
          >
            {role.abilityCards.map((card) => (
              <div
                key={card}
                draggable
                className={`px-8 py-4 bg-bg border-2 shadow-pixel text-sm leading-none whitespace-nowrap pointer-events-auto select-none ${
                  connections.some(
                    (connection) => connection.sourceRoleId === role.id && connection.card === card,
                  )
                    ? 'border-status-success'
                    : 'border-accent'
                }`}
                style={{ cursor: 'grab', borderColor: CARD_COLORS[card] ?? undefined }}
                onDragStart={(event) => {
                  const payload = { sourceRoleId: role.id, card };
                  setDraggedCard(payload);
                  event.dataTransfer.setData(
                    'application/x-education-card',
                    JSON.stringify(payload),
                  );
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onDragEnd={() => {
                  setDraggedCard(null);
                  setHoveredTargetRoleId(null);
                }}
                title={`拖动${card}到需要它的角色身上`}
              >
                {card}
              </div>
            ))}
            <div className="px-7 py-3 bg-bg-dark/90 border-2 border-border text-xs leading-tight max-w-180 text-center">
              {role.name}
              {configSummary ? (
                <div className="mt-2 text-2xs text-text-muted">{configSummary}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

function formatResultCardPreview(content: string): string {
  return content
    .replace(/^\s*([^：:\n]{1,16}卡|趣味广播)[：:]\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 96);
}

function IconGlyph({ children, label }: { children: string; label: string }) {
  return (
    <>
      <span aria-hidden="true" className="text-lg leading-none">
        {children}
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}

interface ConnectionCurveProps {
  source: RolePosition;
  target: RolePosition;
  card: string;
  markerId: string;
  persistent: boolean;
  emphasized: boolean;
  muted: boolean;
}

function ConnectionCurve({
  source,
  target,
  card,
  markerId,
  persistent,
  emphasized,
  muted,
}: ConnectionCurveProps) {
  const sourceY = source.screenY - 104;
  const targetY = target.screenY - 56;
  const midY = Math.min(sourceY, targetY) - 72;
  const color = CARD_COLORS[card] ?? 'var(--color-accent-bright)';
  const labelX = (source.screenX + target.screenX) / 2;
  const labelY = midY - 8;
  const opacity = muted ? '0.16' : emphasized ? (persistent ? '0.82' : '0.9') : '0.55';

  return (
    <g className={persistent ? 'education-connection-persistent' : 'education-connection-feedback'}>
      <path
        d={`M ${source.screenX} ${sourceY} C ${source.screenX} ${midY}, ${target.screenX} ${midY}, ${target.screenX} ${targetY}`}
        fill="none"
        stroke={color}
        strokeWidth={emphasized && !muted ? '5' : '4'}
        strokeLinecap="round"
        opacity={opacity}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fill={color}
        stroke="var(--education-card-label-stroke)"
        strokeWidth="4"
        paintOrder="stroke"
        opacity={muted ? '0.24' : '1'}
        style={{ fontSize: 18 }}
      >
        {card}
      </text>
    </g>
  );
}
