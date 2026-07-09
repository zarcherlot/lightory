import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RoleTaskConsoleEntry } from '../components/RoleTaskConsole.js';
import type { OfficeState } from '../office/engine/officeState.js';
import { getRoleAgentId } from '../roles.js';
import { MockRobotApiClient, MockRobotEventBus } from './mockRobotApi.js';
import { HttpRobotApiClient } from './robotApiClient.js';
import { WebSocketRobotEventClient } from './robotEventClient.js';
import { buildPlanForIntent, parseRobotIntent, type RobotIntent } from './robotPlanBuilder.js';
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
}

interface PendingConfirmation {
  plan: RobotPlan;
  validation: PlanValidationResult;
}

type VideoConsoleIntent =
  | { type: 'start'; profile: VideoStreamInfo['profile'] }
  | { type: 'status' }
  | { type: 'stop' };

export interface RobotRuntime {
  config: RobotConnectionConfig;
  setConfig: (config: RobotConnectionConfig) => void;
  tools: RobotToolDefinition[];
  connected: boolean;
  statusText: string;
  entries: RoleTaskConsoleEntry[];
  activePlanId: string | null;
  pendingConfirmation: PendingConfirmation | null;
  handleConsoleInput: (content: string) => boolean;
  confirmPendingPlan: () => void;
  cancelPendingPlan: () => void;
  emergencyStop: () => void;
}

export function useRobotRuntime({ getOfficeState }: RobotRuntimeOptions): RobotRuntime {
  const [config, setConfigState] = useState<RobotConnectionConfig>(loadConfig);
  const [tools, setTools] = useState<RobotToolDefinition[]>([]);
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState('Robot disconnected');
  const [entries, setEntries] = useState<RoleTaskConsoleEntry[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const entryIdRef = useRef(100000);
  const activePlanIdRef = useRef<string | null>(null);
  const activeVideoStreamIdRef = useRef<string | null>(null);
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
    ) => {
      setEntries((prev) =>
        [
          ...prev,
          {
            id: ++entryIdRef.current,
            runId: activePlanIdRef.current ?? 'robot-runtime',
            roleId: 'robot',
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
          appendEntry(`Robot registry loaded: ${nextTools.length} tools.`, 'done');
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
    setConfigState(nextConfig);
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
      const plan = buildPlanForIntent({ padId: 'pad-webview', sessionId: getSessionId() }, intent);
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
    [appendEntry, clients.api],
  );

  const handleConsoleInput = useCallback(
    (content: string): boolean => {
      const videoIntent = parseVideoIntent(content);
      if (videoIntent) {
        handleVideoConsoleIntent(videoIntent, clients.video, activeVideoStreamIdRef, appendEntry);
        return true;
      }

      const intent = parseRobotIntent(content);
      if (!intent) return false;
      appendEntry(`Console intent: ${content}`, 'running');
      void preparePlan(intent)
        .then(({ plan, validation }) => {
          if (!validation.ok) {
            appendEntry(formatValidation(validation), 'error', 'stderr');
            return;
          }
          if (plan.requiresUserConfirmation) {
            setPendingConfirmation({ plan, validation });
            appendEntry(`High-risk plan waiting for confirmation: ${plan.intent}`, 'running');
            return;
          }
          void executePlan(plan, validation);
        })
        .catch((error: Error) =>
          appendEntry(`Robot plan failed: ${error.message}`, 'error', 'stderr'),
        );
      return true;
    },
    [appendEntry, clients.video, executePlan, preparePlan],
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
    activePlanId,
    pendingConfirmation,
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

function formatEvent(event: RobotEvent): string {
  if (event.type === 'plan.step.started')
    return `Event ${event.type}: ${event.planId} ${event.stepId}`;
  if (event.type === 'plan.step.done' || event.type === 'plan.step.failed') {
    return `Event ${event.type}: ${event.planId} ${event.stepId} ${event.result.message}`;
  }
  if (event.type === 'plan.stopped') return `Event ${event.type}: ${event.planId} ${event.reason}`;
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
    token: '',
    certificateFingerprint: '',
  };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<RobotConnectionConfig>) };
  } catch {
    return fallback;
  }
}

function getSessionId(): string {
  const key = 'lightory.robot.sessionId';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `sess_${Date.now().toString(36)}`;
  sessionStorage.setItem(key, next);
  return next;
}
