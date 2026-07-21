import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RoleTaskConsoleEntry } from '../components/roleTaskConsoleTypes.js';
import type { OfficeState } from '../office/engine/officeState.js';
import { getRoleAgentId } from '../roles.js';
import { MockRobotApiClient, MockRobotEventBus } from './mockRobotApi.js';
import { buildRaceTrackListPlan } from './race/racePlanBuilder.js';
import { HttpRobotApiClient } from './robotApiClient.js';
import { normalizeRobotHttpBaseUrl } from './robotBaseUrl.js';
import { WebSocketRobotEventClient } from './robotEventClient.js';
import {
  buildPlanForIntent,
  type RobotIntent,
  type RobotIntentPlannerOutcome,
} from './robotPlanBuilder.js';
import { validateRobotPlanLocally } from './robotPlanSchema.js';
import type {
  PlanValidationResult,
  RobotApiClient,
  RobotConnectionConfig,
  RobotEvent,
  RobotEventClient,
  RobotPlan,
  RobotToolDefinition,
  VideoStreamInfo,
} from './types.js';
import {
  HttpVideoStreamClient,
  MockVideoStreamClient,
  type VideoStreamClient,
} from './videoStreamClient.js';

const STORAGE_KEY = 'lightory.robot.connection';
const ROBOT_ROLE_ID = 'travel';

interface RobotRuntimeOptions {
  getOfficeState: () => OfficeState;
  planRobotIntent: (
    content: string,
    tools: RobotToolDefinition[],
  ) => Promise<RobotIntentPlannerOutcome>;
  onRobotIntentPlanned?: (intent: RobotIntent) => void;
}

interface PendingConfirmation {
  plan: RobotPlan;
  validation: PlanValidationResult;
  message?: string;
}

type VideoConsoleIntent =
  | { type: 'start'; profile: VideoStreamInfo['profile'] }
  | { type: 'status' }
  | { type: 'stop' };

export interface RaceKnownFacts {
  track?: {
    trackId?: string;
    recordedPoints?: string[];
    source: string;
  };
  latestLap?: Record<string, unknown>;
  latestRaceToolResult?: {
    tool: string;
    ok: boolean;
    message: string;
    args?: Record<string, unknown>;
    data?: unknown;
  };
  recentRobotEvents: Array<Record<string, unknown>>;
}

export interface RobotRuntime {
  config: RobotConnectionConfig;
  setConfig: (config: RobotConnectionConfig) => void;
  tools: RobotToolDefinition[];
  connected: boolean;
  statusText: string;
  entries: RoleTaskConsoleEntry[];
  raceKnownFacts: RaceKnownFacts;
  activePlanId: string | null;
  pendingConfirmation: PendingConfirmation | null;
  executeIntent: (intent: RobotIntent, confirmationMessage?: string) => void;
  handleConsoleInput: (content: string) => boolean;
  confirmPendingPlan: () => void;
  cancelPendingPlan: () => void;
  emergencyStop: () => void;
}

export function useRobotRuntime({
  getOfficeState,
  planRobotIntent,
  onRobotIntentPlanned,
}: RobotRuntimeOptions): RobotRuntime {
  const [config, setConfigState] = useState<RobotConnectionConfig>(loadConfig);
  const [tools, setTools] = useState<RobotToolDefinition[]>([]);
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState('Robot disconnected');
  const [entries, setEntries] = useState<RoleTaskConsoleEntry[]>([]);
  const [raceKnownFacts, setRaceKnownFacts] = useState<RaceKnownFacts>(createEmptyRaceKnownFacts);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const entryIdRef = useRef(100000);
  const activePlanIdRef = useRef<string | null>(null);
  const activeVideoStreamIdRef = useRef<string | null>(null);
  const robotPlansRef = useRef<Map<string, RobotPlan>>(new Map());
  const toolsRef = useRef<RobotToolDefinition[]>([]);

  const clients = useMemo(() => createClients(config), [config]);

  useEffect(() => {
    activePlanIdRef.current = activePlanId;
  }, [activePlanId]);

  useEffect(() => {
    toolsRef.current = tools;
  }, [tools]);

  const appendEntry = useCallback(
    (
      content: string,
      status: RoleTaskConsoleEntry['status'] = 'running',
      stream: RoleTaskConsoleEntry['stream'] = 'system',
      roleId = 'robot',
    ) => {
      setEntries((prev) =>
        [
          ...prev,
          {
            id: ++entryIdRef.current,
            runId: activePlanIdRef.current ?? 'robot-runtime',
            roleId,
            status,
            stream,
            content,
          },
        ].slice(-500),
      );
    },
    [],
  );

  useEffect(() => {
    let disposed = false;
    setConnected(false);
    setStatusText('Connecting robot...');
    setTools([]);
    setRaceKnownFacts(createEmptyRaceKnownFacts());
    clients.api
      .getHealth()
      .then((health) => {
        if (disposed) return;
        setConnected(true);
        setStatusText(`${health.robotId} ${health.softwareVersion}`);
        return clients.api.getTools();
      })
      .then((nextTools) => {
        if (!disposed && nextTools) {
          setTools(nextTools);
          if (nextTools.some((tool) => tool.name === 'race.track.list')) {
            void refreshRaceTrackFacts(
              clients.api,
              nextTools,
              robotPlansRef,
              appendEntry,
            ).catch((error: Error) => {
              if (!disposed) appendEntry(`Race track refresh failed: ${error.message}`, 'error', 'stderr');
            });
          }
        }
      })
      .catch((error: Error) => {
        if (disposed) return;
        setConnected(false);
        setStatusText(error.message);
        appendEntry(`Robot connection failed: ${error.message}`, 'error', 'stderr');
      });

    void clients.events.connect();
    const unsubscribe = clients.events.subscribe((event) => {
      handleRobotEvent(event, appendEntry, getOfficeState);
      const plan =
        'planId' in event && typeof event.planId === 'string'
          ? robotPlansRef.current.get(event.planId)
          : undefined;
      setRaceKnownFacts((prev) => updateRaceKnownFactsFromRobotEvent(prev, event, plan));
      if (event.type === 'plan.started') setActivePlanId(event.planId);
      if (
        event.type === 'plan.done' ||
        event.type === 'plan.failed' ||
        event.type === 'plan.stopped'
      ) {
        setActivePlanId(null);
      }
    });

    return () => {
      disposed = true;
      unsubscribe();
      clients.events.close();
    };
  }, [appendEntry, clients, getOfficeState]);

  const setConfig = useCallback((nextConfig: RobotConnectionConfig) => {
    const normalized = normalizeConfig(nextConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setConfigState(normalized);
  }, []);

  const executePlan = useCallback(
    async (plan: RobotPlan, validation: PlanValidationResult) => {
      if (!validation.ok) {
        appendEntry(formatValidation(validation), 'error', 'stderr');
        return;
      }
      appendEntry(`Submit plan ${plan.planId}: ${plan.intent}`, 'running');
      setActivePlanId(plan.planId);
      await clients.api.submitPlan(plan);
      await clients.api.executePlan(plan.planId);
    },
    [appendEntry, clients.api],
  );

  const preparePlan = useCallback(
    async (intent: RobotIntent): Promise<{ plan: RobotPlan; validation: PlanValidationResult }> => {
      const plan = buildPlanForIntent(
        { padId: 'pad-webview', sessionId: getSessionId(), mapId: config.mapId },
        intent,
      );
      robotPlansRef.current.set(plan.planId, plan);
      appendEntry(`Build robot-plan/v1 ${plan.planId}: ${plan.intent}`);
      const localValidation = validateRobotPlanLocally(plan, toolsRef.current);
      if (!localValidation.ok) return { plan, validation: localValidation };
      const robotValidation = await clients.api.validatePlan(plan);
      appendEntry(
        formatValidation(robotValidation),
        robotValidation.ok ? 'done' : 'error',
        robotValidation.ok ? 'system' : 'stderr',
      );
      return { plan, validation: robotValidation };
    },
    [appendEntry, clients.api, config.mapId],
  );

  const handleConsoleInput = useCallback(
    (content: string): boolean => {
      const videoIntent = parseVideoIntent(content);
      if (videoIntent) {
        handleVideoConsoleIntent(videoIntent, clients.video, activeVideoStreamIdRef, appendEntry);
        return true;
      }

      appendEntry(content, 'done', 'system', 'user');
      appendEntry('Planning robot intent with model...', 'running');
      void planRobotIntent(content, toolsRef.current)
        .then((outcome) => {
          if (outcome.type === 'unsupported') {
            appendEntry(`Robot intent unsupported: ${outcome.reason}`, 'error', 'stderr');
            return null;
          }
          if (outcome.type === 'error') {
            appendEntry(`Robot intent planner failed: ${outcome.message}`, 'error', 'stderr');
            return null;
          }
          onRobotIntentPlanned?.(outcome.intent);
          return preparePlan(outcome.intent).then((result) => ({
            ...result,
            confirmationMessage: outcome.confirmationMessage,
          }));
        })
        .then((result) => {
          if (!result) return;
          const { plan, validation, confirmationMessage } = result;
          if (!validation.ok) {
            appendEntry(formatValidation(validation), 'error', 'stderr');
            return;
          }
          if (plan.requiresUserConfirmation) {
            setPendingConfirmation({ plan, validation, message: confirmationMessage });
            appendEntry(
              confirmationMessage ?? `High-risk plan waiting for confirmation: ${plan.intent}`,
              'running',
            );
            return;
          }
          void executePlan(plan, validation);
        })
        .catch((error: Error) =>
          appendEntry(`Robot plan failed: ${error.message}`, 'error', 'stderr'),
        );
      return true;
    },
    [appendEntry, clients.video, executePlan, onRobotIntentPlanned, planRobotIntent, preparePlan],
  );

  const executeIntent = useCallback(
    (intent: RobotIntent, confirmationMessage?: string) => {
      onRobotIntentPlanned?.(intent);
      void preparePlan(intent)
        .then(({ plan, validation }) => {
          if (!validation.ok) {
            appendEntry(formatValidation(validation), 'error', 'stderr');
            return;
          }
          if (plan.requiresUserConfirmation) {
            setPendingConfirmation({ plan, validation, message: confirmationMessage });
            appendEntry(
              confirmationMessage ?? `High-risk plan waiting for confirmation: ${plan.intent}`,
              'running',
            );
            return;
          }
          void executePlan(plan, validation);
        })
        .catch((error: Error) =>
          appendEntry(`Robot plan failed: ${error.message}`, 'error', 'stderr'),
        );
    },
    [appendEntry, executePlan, onRobotIntentPlanned, preparePlan],
  );

  const confirmPendingPlan = useCallback(() => {
    const pending = pendingConfirmation;
    if (!pending) return;
    setPendingConfirmation(null);
    void executePlan(pending.plan, pending.validation).catch((error: Error) =>
      appendEntry(`Robot execute failed: ${error.message}`, 'error', 'stderr'),
    );
  }, [appendEntry, executePlan, pendingConfirmation]);

  const cancelPendingPlan = useCallback(() => {
    if (!pendingConfirmation) return;
    appendEntry(`Cancelled plan ${pendingConfirmation.plan.planId}.`, 'done');
    setPendingConfirmation(null);
  }, [appendEntry, pendingConfirmation]);

  const emergencyStop = useCallback(() => {
    const planId = activePlanIdRef.current;
    appendEntry('Emergency stop requested.', 'running', 'stderr');
    void Promise.all([
      planId ? clients.api.stopPlan(planId, 'pad emergency stop') : Promise.resolve(),
      clients.api.stopAll('pad emergency stop'),
    ]).catch((error: Error) =>
      appendEntry(`Emergency stop failed: ${error.message}`, 'error', 'stderr'),
    );
  }, [appendEntry, clients.api]);

  return {
    config,
    setConfig,
    tools,
    connected,
    statusText,
    entries,
    raceKnownFacts,
    activePlanId,
    pendingConfirmation,
    executeIntent,
    handleConsoleInput,
    confirmPendingPlan,
    cancelPendingPlan,
    emergencyStop,
  };
}

function createClients(config: RobotConnectionConfig): {
  api: RobotApiClient;
  events: RobotEventClient;
  video: VideoStreamClient;
} {
  if (config.mode === 'mock') {
    const events = new MockRobotEventBus();
    return { api: new MockRobotApiClient(events), events, video: new MockVideoStreamClient() };
  }
  return {
    api: new HttpRobotApiClient(config),
    events: new WebSocketRobotEventClient(config),
    video: new HttpVideoStreamClient(config),
  };
}

export function createEmptyRaceKnownFacts(): RaceKnownFacts {
  return { recentRobotEvents: [] };
}

export function createRaceKnownFactsFromTrackList(data: unknown): RaceKnownFacts {
  const tracks = isRecord(data) && Array.isArray(data.tracks) ? data.tracks.filter(isRecord) : [];
  const selected = tracks.find(hasCompleteRacePoints) ?? tracks[0];
  if (!selected) return createEmptyRaceKnownFacts();
  const trackId = typeof selected.trackId === 'string' && selected.trackId.trim()
    ? selected.trackId.trim()
    : 'default-abcd';
  const recordedPoints = extractRecordedPointNames(selected);
  return {
    track: {
      trackId,
      ...(recordedPoints.length > 0 ? { recordedPoints } : {}),
      source: 'race.track.list',
    },
    recentRobotEvents: [],
  };
}

export function updateRaceKnownFactsFromRobotEvent(
  current: RaceKnownFacts,
  event: RobotEvent,
  plan?: RobotPlan,
): RaceKnownFacts {
  const step = findPlanStep(plan, 'stepId' in event ? event.stepId : undefined);
  const summary = summarizeRobotEventFact(event, step);
  const next: RaceKnownFacts = {
    ...current,
    recentRobotEvents: [...current.recentRobotEvents, summary].slice(-20),
  };

  if (
    (event.type === 'plan.step.done' || event.type === 'plan.step.failed') &&
    step?.tool.startsWith('race.')
  ) {
    next.latestRaceToolResult = {
      tool: step.tool,
      ok: event.result.ok,
      message: event.result.message,
      args: step.args,
      data: event.result.data,
    };
  }

  if (
    (event.type === 'plan.step.done' || event.type === 'plan.step.failed') &&
    step?.tool === 'race.runLap'
  ) {
    const args = step.args;
    const trackId = typeof args.trackId === 'string' ? args.trackId : undefined;
    const order = Array.isArray(args.order)
      ? args.order.filter((point): point is string => typeof point === 'string')
      : undefined;
    const openRoute =
      order && order.length > 1 && order[0] === order.at(-1) ? order.slice(0, -1) : order;
    const recordedPoints = openRoute ? [...new Set(openRoute)] : undefined;
    next.track = {
      ...(trackId ? { trackId } : {}),
      ...(recordedPoints && recordedPoints.length > 0 ? { recordedPoints } : {}),
      source: 'race.runLap',
    };
    next.latestLap = {
      ...(isRecord(event.result.data) ? event.result.data : {}),
      status: isRecord(event.result.data) && typeof event.result.data.status === 'string'
        ? event.result.data.status
        : event.result.status,
      ...(trackId ? { trackId } : {}),
      ...(order ? { order } : {}),
      ...(isRecord(args.strategy) ? { strategy: args.strategy } : {}),
      ...(isRecord(args.safety) ? { safety: args.safety } : {}),
      message: event.result.message,
    };
  }

  if (
    event.type === 'plan.step.done' &&
    step?.tool === 'race.track.list'
  ) {
    const hydrated = createRaceKnownFactsFromTrackList(event.result.data);
    if (hydrated.track) next.track = hydrated.track;
  }

  if (
    event.type === 'plan.step.done' &&
    step?.tool === 'race.track.get'
  ) {
    const track = isRecord(event.result.data) && isRecord(event.result.data.track)
      ? event.result.data.track
      : undefined;
    const hydrated = track ? createRaceKnownFactsFromTrackList({ tracks: [track] }) : undefined;
    if (hydrated?.track) next.track = { ...hydrated.track, source: 'race.track.get' };
  }

  if (
    event.type === 'plan.step.done' &&
    (step?.tool === 'localization.recordCurrentPose' || step?.tool === 'poi.upsert')
  ) {
    const pointName = getRecordedPointName(step.args, event.result.data);
    if (pointName) {
      const trackId = getTrackIdFromArgsOrData(step.args, event.result.data) ?? current.track?.trackId ?? 'default-abcd';
      next.track = {
        trackId,
        recordedPoints: [...new Set([...(current.track?.recordedPoints ?? []), pointName])],
        source: step.tool,
      };
    }
  }

  if (
    event.type === 'plan.step.done' &&
    step?.tool === 'poi.delete' &&
    current.track?.recordedPoints
  ) {
    const deletedPoint = getRecordedPointName(step.args, event.result.data);
    if (deletedPoint) {
      next.track = {
        ...current.track,
        recordedPoints: current.track.recordedPoints.filter((point) => point !== deletedPoint),
        source: 'poi.delete',
      };
    }
  }

  if (
    event.type === 'plan.step.done' &&
    step?.tool === 'race.track.clear'
  ) {
    const trackId = getTrackIdFromArgsOrData(step.args, event.result.data);
    if (!trackId || trackId === current.track?.trackId) {
      next.track = undefined;
    }
  }

  if (
    event.type === 'plan.step.done' &&
    step?.tool === 'race.track.save'
  ) {
    const args = step.args;
    const trackId = typeof args.trackId === 'string' ? args.trackId : undefined;
    const recordedPoints = Array.isArray(args.pointNames)
      ? args.pointNames.filter((point): point is string => typeof point === 'string')
      : undefined;
    next.track = {
      ...(trackId ? { trackId } : {}),
      ...(recordedPoints && recordedPoints.length > 0 ? { recordedPoints } : {}),
      source: 'race.track.save',
    };
  }

  return next;
}

async function refreshRaceTrackFacts(
  api: RobotApiClient,
  tools: RobotToolDefinition[],
  robotPlansRef: MutableRefObject<Map<string, RobotPlan>>,
  appendEntry: (
    content: string,
    status?: RoleTaskConsoleEntry['status'],
    stream?: RoleTaskConsoleEntry['stream'],
    roleId?: string,
  ) => void,
): Promise<void> {
  const plan = buildRaceTrackListPlan({ padId: 'pad-webview', sessionId: getSessionId() });
  robotPlansRef.current.set(plan.planId, plan);
  appendEntry('Refresh saved race tracks.', 'running');
  const localValidation = validateRobotPlanLocally(plan, tools);
  if (!localValidation.ok) {
    appendEntry(formatValidation(localValidation), 'error', 'stderr');
    return;
  }
  const robotValidation = await api.validatePlan(plan);
  appendEntry(
    formatValidation(robotValidation),
    robotValidation.ok ? 'done' : 'error',
    robotValidation.ok ? 'system' : 'stderr',
  );
  if (!robotValidation.ok) return;
  await api.submitPlan(plan);
  await api.executePlan(plan.planId);
}

function findPlanStep(
  plan: RobotPlan | undefined,
  stepId: string | undefined,
): RobotPlan['steps'][number] | undefined {
  if (!plan || !stepId) return undefined;
  return plan.steps.find((step) => step.id === stepId);
}

function summarizeRobotEventFact(
  event: RobotEvent,
  step: RobotPlan['steps'][number] | undefined,
): Record<string, unknown> {
  if (event.type === 'plan.step.done' || event.type === 'plan.step.failed') {
    return {
      type: event.type,
      ...(step?.tool ? { tool: step.tool } : {}),
      ok: event.result.ok,
      message: event.result.message,
      ...(step?.args ? { args: step.args } : {}),
    };
  }
  if ('planId' in event) return { type: event.type, planId: event.planId };
  return { type: event.type };
}

function handleRobotEvent(
  event: RobotEvent,
  appendEntry: (
    content: string,
    status?: RoleTaskConsoleEntry['status'],
    stream?: RoleTaskConsoleEntry['stream'],
  ) => void,
  getOfficeState: () => OfficeState,
): void {
  const os = getOfficeState();
  const roleAgentId = getRoleAgentId(ROBOT_ROLE_ID);
  if (event.type === 'plan.started' || event.type === 'plan.step.started') {
    os.setRoleTaskWorking(roleAgentId);
  }
  if (event.type === 'plan.done') {
    os.setRoleTaskWeather(roleAgentId, 'sun');
  }
  if (event.type === 'plan.failed' || event.type === 'safety.blocked') {
    os.clearRoleTaskState(roleAgentId);
  }
  appendEntry(
    formatEvent(event),
    event.type.includes('failed') ? 'error' : 'running',
    event.type.includes('failed') ? 'stderr' : 'system',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasCompleteRacePoints(track: Record<string, unknown>): boolean {
  const points = extractRecordedPointNames(track);
  const names = new Set(points.map((point) => point.toUpperCase()));
  return ['A', 'B', 'C', 'D'].every((point) => names.has(point));
}

function extractRecordedPointNames(track: Record<string, unknown>): string[] {
  const points = isRecord(track.points)
    ? Object.keys(track.points)
    : Array.isArray(track.points)
      ? track.points
          .map((point) => (isRecord(point) && typeof point.name === 'string' ? point.name : undefined))
          .filter((point): point is string => Boolean(point))
      : Array.isArray(track.order)
        ? track.order.filter((point): point is string => typeof point === 'string')
        : [];
  return [...new Set(points)].filter((point) => ['A', 'B', 'C', 'D'].includes(point.toUpperCase()));
}

function getRecordedPointName(args: Record<string, unknown>, data: unknown): string | undefined {
  const rawFromData = isRecord(data) && isRecord(data.point) && typeof data.point.name === 'string'
    ? data.point.name
    : undefined;
  const raw = rawFromData ?? (typeof args.name === 'string' ? args.name : undefined);
  const normalized = raw?.trim().toUpperCase();
  return normalized && ['A', 'B', 'C', 'D'].includes(normalized) ? normalized : undefined;
}

function getTrackIdFromArgsOrData(
  args: Record<string, unknown>,
  data: unknown,
): string | undefined {
  if (isRecord(data) && typeof data.trackId === 'string' && data.trackId.trim()) {
    return data.trackId.trim();
  }
  return typeof args.trackId === 'string' && args.trackId.trim() ? args.trackId.trim() : undefined;
}

function formatEvent(event: RobotEvent): string {
  if (event.type === 'plan.step.started')
    return `Event ${event.type}: ${event.planId} ${event.stepId}`;
  if (event.type === 'plan.step.done' || event.type === 'plan.step.failed') {
    return `Event ${event.type}: ${event.planId} ${event.stepId} ${event.result.message}`;
  }
  if (event.type === 'plan.stopped') return `Event ${event.type}: ${event.planId} ${event.reason}`;
  if (event.type === 'plan.failed') {
    return `Event ${event.type}: ${event.planId} ${event.error.code}${event.error.detail ? ` ${event.error.detail}` : ''}`;
  }
  if (event.type === 'safety.blocked') return `Event ${event.type}: ${event.reason}`;
  if (event.type === 'robot.status') return `Event ${event.type}: ${event.data.mode ?? 'online'}`;
  if ('planId' in event) return `Event ${event.type}: ${event.planId}`;
  return `Event ${event.type}`;
}

function formatValidation(validation: PlanValidationResult): string {
  if (validation.ok) {
    const warnings = validation.warnings.map((issue) => issue.code).join(', ');
    return `Validate ${validation.planId}: ok${warnings ? `, warnings: ${warnings}` : ''}`;
  }
  return `Validate ${validation.planId}: ${validation.errors.map((issue) => `${issue.code} ${issue.message}`).join('; ')}`;
}

function handleVideoConsoleIntent(
  intent: VideoConsoleIntent,
  video: VideoStreamClient,
  activeVideoStreamIdRef: MutableRefObject<string | null>,
  appendEntry: (
    content: string,
    status?: RoleTaskConsoleEntry['status'],
    stream?: RoleTaskConsoleEntry['stream'],
  ) => void,
): void {
  if (intent.type === 'start') {
    appendEntry(`Start ${intent.profile} video stream.`, 'running');
    void video
      .start(intent.profile)
      .then((stream) => {
        activeVideoStreamIdRef.current = stream.streamId;
        appendEntry(formatVideoStream(stream), 'done');
      })
      .catch((error: Error) =>
        appendEntry(`Robot video failed: ${error.message}`, 'error', 'stderr'),
      );
    return;
  }

  const streamId = activeVideoStreamIdRef.current;
  if (!streamId) {
    appendEntry('No active video stream.', 'done');
    return;
  }

  if (intent.type === 'status') {
    appendEntry(`Query video stream ${streamId}.`, 'running');
    void video
      .getState(streamId)
      .then((stream) =>
        appendEntry(stream ? formatVideoStream(stream) : `Video ${streamId}: stopped`, 'done'),
      )
      .catch((error: Error) =>
        appendEntry(`Robot video state failed: ${error.message}`, 'error', 'stderr'),
      );
    return;
  }

  appendEntry(`Stop video stream ${streamId}.`, 'running');
  void video
    .stop(streamId)
    .then(() => {
      activeVideoStreamIdRef.current = null;
      appendEntry(`Video ${streamId}: stopped`, 'done');
    })
    .catch((error: Error) =>
      appendEntry(`Robot video stop failed: ${error.message}`, 'error', 'stderr'),
    );
}

function parseVideoIntent(input: string): VideoConsoleIntent | null {
  const text = input.trim().toLowerCase();
  if (!/视频|video|摄像头/u.test(text)) return null;
  if (/状态|state|查询/u.test(text)) return { type: 'status' };
  if (/停止|关闭|stop|close/u.test(text)) return { type: 'stop' };
  if (/teleop|遥控|远程操控/u.test(text)) return { type: 'start', profile: 'teleop' };
  if (/snapshot|快照/u.test(text)) return { type: 'start', profile: 'snapshot' };
  return { type: 'start', profile: 'monitor' };
}

function formatVideoStream(stream: VideoStreamInfo): string {
  const endpoint = stream.signalingUrl ?? stream.url ?? 'native video channel';
  return `Video ${stream.streamId}: ${stream.profile}/${stream.transport} ${stream.resolution.width}x${stream.resolution.height}@${stream.fps}fps, latency ${stream.latencyTargetMs}ms, endpoint ${endpoint}`;
}

function loadConfig(): RobotConnectionConfig {
  const fallback: RobotConnectionConfig = {
    mode: 'mock',
    baseUrl: 'https://mock.robot.local',
    robotId: 'mock-robot-001',
    mapId: 'map_01',
    token: '',
    certificateFingerprint: '',
  };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;
  try {
    return normalizeConfig({ ...fallback, ...(JSON.parse(raw) as Partial<RobotConnectionConfig>) });
  } catch {
    return fallback;
  }
}

function normalizeConfig(config: RobotConnectionConfig): RobotConnectionConfig {
  const normalized = { ...config, mapId: config.mapId?.trim() || 'map_01' };
  if (config.mode === 'mock') return normalized;
  return { ...normalized, baseUrl: normalizeRobotHttpBaseUrl(config.baseUrl) };
}

function getSessionId(): string {
  const key = 'lightory.robot.sessionId';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `sess_${Date.now().toString(36)}`;
  sessionStorage.setItem(key, next);
  return next;
}
