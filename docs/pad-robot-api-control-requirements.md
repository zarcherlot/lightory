# Pad Agent 生成 DSL、机器人 HTTPS/WebSocket 执行需求文档

## 结论

最终方案：Pad 运行 agent 编排和 vibe coding，生成受限 DSL `robot-plan/v1`；机器人本体不执行任意 TS/JS/Python 脚本，只提供 HTTPS/WebSocket API、tool registry、plan validator、plan executor 和安全执行层。

```text
Pad / 上位机
  Lightory UI
  Agent 编排运行时
  Vibe coding / task planner
  Robot SDK
  DSL generator
  HTTPS API client
  WebSocket event client
  Video client
        |
        | HTTPS: tool registry / validate / submit / stop / map / memory
        | WebSocket: plan state / step events / robot status / teleop session
        | WebRTC/RTSP/HLS: video stream
        v
机器人本体 Linux 沙盒
  robot-api service
  tool registry
  plan validator
  plan executor
  safety proxy
  robot-watchdog daemon
  robot-base / robot-arm / robot-memory / robot-speech / robot-led adapters
  video-stream service
  hardware drivers / ROS / vendor SDK
```

这个边界比“Pad 生成脚本下发到本体执行”安全得多：

- Pad 可以自由处理用户需求、对话、推理、联网、代码生成和 UI。
- Robot 只执行自己声明过的 tool，不运行任意生成代码。
- 所有硬件动作都经过本体 validator、safety proxy、watchdog 和 adapter。
- 本体可独立处理 Pad 断线、网络抖动、plan 错误和急停。

## 核心原则

- Pad 负责“想清楚要做什么”。
- Robot 负责“按受限工具安全执行”。
- Vibe coding 产物只能在 Pad runtime 内运行。
- Robot 只接受 `robot-plan/v1` DSL，不接受任意 JS/TS/Python。
- DSL 只能调用 robot tool registry 中声明的 tool。
- 高风险 tool 必须由 Robot 侧强制验证，不信任 Pad。
- HTTPS 负责请求/响应，WebSocket 负责事件流和低延迟状态同步。
- 视频和高频控制不走 HTTPS 请求体。
- 本体安全不依赖 Pad 持续在线。

## Pad 形态可行性

| 形态             | HTTPS/WebSocket 可行性                                                | 结论                       |
| ---------------- | --------------------------------------------------------------------- | -------------------------- |
| iPadOS 原生 App  | 可行。系统网络栈原生支持 HTTPS/WebSocket/WebRTC。                     | 推荐正式控制端。           |
| Android 原生 App | 可行。系统网络栈原生支持 HTTPS/WebSocket/WebRTC。                     | 推荐正式控制端。           |
| WebView 包壳 App | 可行。UI 复用 Web，原生层负责 Keychain/Keystore、发现、证书 pinning。 | 推荐 MVP 折中方案。        |
| Pad Web/PWA      | 可行。浏览器支持 HTTPS/WebSocket/WebRTC，但本地发现和证书体验弱。     | 可做局域网调试和轻量控制。 |

### iOS

- 需要 Local Network 权限。
- 推荐使用 mDNS/Bonjour 发现机器人，例如 `_robotapi._tcp.local`。
- 设备密钥、pairing token、证书 pin 存 Keychain。
- App 进入后台后不依赖长连接维持动作安全。
- WebRTC/HLS 支持成熟，适合视频主链路。

### Android

- 支持 NSD/mDNS、二维码配对和前台服务。
- 设备密钥、pairing token、证书 pin 存 Android Keystore。
- WebSocket/WebRTC 实现自由度高。
- 即使可以后台保活，也不把运动安全绑定在 Pad 长连接上。

## 配对与安全连接

MVP 使用局域网 HTTPS + WebSocket，必须做 pairing 和证书/公钥固定。

### 配对流程

```text
Robot 首次启动显示二维码
Pad 扫码获取 robotId、baseUrl、pairingCode、robotPublicKeyFingerprint
Pad 调 POST /api/pairing/claim
Robot 返回短期 session token 和长期 device credential
Pad 保存 credential 到 Keychain / Keystore
后续请求使用 Bearer token 或 mTLS
```

### API 安全要求

- 所有 API 只允许 HTTPS/WSS。
- Pad 侧 pin robot public key 或证书 fingerprint。
- token 有过期时间，可撤销。
- 高风险 API 需要 fresh confirmation token。
- Robot API 不暴露通用 shell。
- Robot API 只暴露 plan、registry、watchdog、memory、map、video、teleop 等受限端点。

## 运行时边界

### Pad 侧运行

- agent 编排运行时。
- 角色 prompt 和任务状态机。
- vibe coding 生成 TS/JS。
- 用户需求拆解、计划生成、解释和确认。
- DSL `robot-plan/v1` 生成。
- Robot SDK 参数构造和本地预校验。
- HTTPS client、WebSocket event client。
- 视频播放。

### Robot 侧运行

- `robot-api` HTTPS/WebSocket 服务。
- tool registry。
- DSL schema validator。
- plan validator。
- plan executor。
- safety proxy。
- robot-watchdog daemon。
- tool adapters / CLI / daemon。
- 本地导航、避障、机械臂安全限制、急停。
- 视频采集与编码。

### 明确禁止

- Robot 执行 Pad 生成的任意 JS/TS/Python。
- DSL 内包含 shell、eval、网络请求、文件写入等通用代码能力。
- Pad 直接调用底层硬件 adapter 绕过 plan validator。
- 机器人 tool 绕过 safety proxy 直接触达硬件。

## Robot API

### HTTPS Endpoints

```http
GET  /api/health
GET  /api/tools
GET  /api/tools/:toolName

POST /api/plans/validate
POST /api/plans
GET  /api/plans/:planId
POST /api/plans/:planId/execute
POST /api/plans/:planId/stop

GET  /api/map
GET  /api/memory/poi
POST /api/memory/poi

GET  /api/watchdog/state
POST /api/watchdog/stop-all

POST /api/video/start
POST /api/video/stop
GET  /api/video/state

POST /api/teleop/base/start
POST /api/teleop/base/stop
```

### WebSocket Endpoints

```text
WSS /api/events
WSS /api/teleop/base/:sessionId
```

### Event Types

```ts
type RobotEvent =
  | { type: 'robot.status'; data: RobotStatus }
  | { type: 'plan.accepted'; planId: string }
  | { type: 'plan.started'; planId: string }
  | { type: 'plan.step.started'; planId: string; stepId: string }
  | { type: 'plan.step.done'; planId: string; stepId: string; result: RobotApiEnvelope }
  | { type: 'plan.step.failed'; planId: string; stepId: string; result: RobotApiEnvelope }
  | { type: 'plan.done'; planId: string }
  | { type: 'plan.failed'; planId: string; error: RobotApiError }
  | { type: 'plan.stopped'; planId: string; reason: string }
  | { type: 'watchdog.lease.expired'; leaseId: string; resource: string }
  | { type: 'safety.blocked'; planId?: string; reason: string }
  | { type: 'video.state'; data: VideoStreamInfo };
```

## Robot Tool Registry

机器人本体启动后提供 tool registry。Pad 先读取 registry，再生成 DSL。

```http
GET /api/tools
GET /api/tools/base.followPath
```

### Tool 定义

```ts
interface RobotToolDefinition {
  name: string;
  version: string;
  category: 'base' | 'arm' | 'vision' | 'audio' | 'speech' | 'led' | 'memory' | 'watchdog';
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  risk: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
  requiresLease?: 'base' | 'arm';
  timeoutMs: number;
  rateLimit?: {
    maxCalls: number;
    perSeconds: number;
  };
}
```

### MVP Tool Set

| Tool                 | 风险     | 说明                               |
| -------------------- | -------- | ---------------------------------- |
| `speech.say`         | low      | 扬声器播报短句                     |
| `led.setMode`        | low      | 设置 LED 状态                      |
| `memory.getPoi`      | low      | 查询 POI                           |
| `memory.upsertPoi`   | medium   | 写入 POI，需要 schema 校验         |
| `base.state`         | low      | 查询底盘状态                       |
| `base.stop`          | critical | 急停，永远允许                     |
| `base.driveDistance` | high     | 按里程计移动受限距离               |
| `base.rotateAngle`   | high     | 按里程计旋转受限角度               |
| `base.velocityProfile` | high   | 执行受限速度曲线                   |
| `base.followPath`    | high     | 低速路径执行，需要 safety 和 lease |
| `reactive.run`       | high     | 运行受限实时反应式协同 graph       |
| `arm.state`          | low      | 查询机械臂状态                     |
| `arm.stop`           | critical | 机械臂急停，永远允许               |
| `arm.grasp`          | high     | 抓取，需要 safety 和确认           |
| `arm.place`          | high     | 放置，需要 safety                  |
| `vision.snapshot`    | low      | 获取低频视觉摘要                   |
| `watchdog.acquire`   | medium   | 获取动作 lease                     |
| `watchdog.heartbeat` | medium   | 维持动作 lease                     |
| `watchdog.release`   | medium   | 释放动作 lease                     |

## DSL: robot-plan/v1

Pad 生成的 DSL 是声明式 ActionPlan，不是代码。

```ts
interface RobotPlan {
  schemaVersion: 'robot-plan/v1';
  planId: string;
  createdAt: string;
  createdBy: {
    padId: string;
    sessionId: string;
    agentRunId: string;
  };
  intent: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  requiresUserConfirmation: boolean;
  assumptions: string[];
  steps: RobotPlanStep[];
  constraints: RobotPlanConstraints;
}

interface RobotPlanStep {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  dependsOn?: string[];
  condition?: RobotPlanCondition;
  timeoutMs?: number;
  safety?: {
    requiresLease?: 'base' | 'arm';
    stopOnObstacle?: boolean;
    maxSpeedMps?: number;
    noGoZones?: string[];
  };
}

interface RobotPlanConstraints {
  maxDurationMs: number;
  maxSteps: number;
  allowedTools: string[];
  forbiddenTools?: string[];
}

interface RobotPlanCondition {
  sourceStepId: string;
  path: string;
  equals?: unknown;
  exists?: boolean;
}
```

### Reactive Graph

`reactive.run` 用于“边感知边输出”的协同任务，例如跟着拍手/唱歌/音乐跳舞、跟着音乐闪灯、根据现场声音做一段表演。Pad 侧 LLM 只生成受限 graph 配置；音频采集、节拍/情绪分析、运动和灯光输出循环都在 Robot 侧执行。

v1 节点类型受限为：

- source：`audio.microphone`
- processor：`audio.beatTracker`、`audio.onsetDetector`、`audio.moodEstimator`
- output：`base.motionReactive`、`led.reactivePattern`、`speech.reactiveCue`

如果 graph 包含 `base.motionReactive`，plan 必须是 high risk、需要用户确认，并且 step safety 必须包含 `requiresLease: "base"` 和 `stopOnObstacle: true`。线速度上限 0.5m/s，角速度上限 0.785398rad/s，默认分别为 0.2m/s 和 0.349066rad/s。Robot 侧应先监听声音再运动；默认启动 5 秒没有有效声音则结束，运行中静音 5 秒则停止。

```json
{
  "id": "s1",
  "tool": "reactive.run",
  "args": {
    "durationMs": 30000,
    "sources": [{ "id": "mic", "type": "audio.microphone", "args": { "sampleRateHz": 16000 } }],
    "processors": [{ "id": "beat", "type": "audio.beatTracker", "input": "mic", "args": {} }],
    "outputs": [
      {
        "id": "base",
        "type": "base.motionReactive",
        "input": "beat",
        "args": { "style": "dance", "maxSpeedMps": 0.35, "maxAngularRadps": 0.6 }
      },
      {
        "id": "led",
        "type": "led.reactivePattern",
        "input": "beat",
        "args": { "style": "cheerful" }
      }
    ],
    "safety": {
      "requiresLease": ["base"],
      "stopOnObstacle": true,
      "startupNoInputMs": 5000,
      "stopOnSilenceMs": 5000,
      "maxSpeedMps": 0.35,
      "maxAngularRadps": 0.6
    }
  },
  "timeoutMs": 31000,
  "safety": { "requiresLease": "base", "stopOnObstacle": true, "maxSpeedMps": 0.35 }
}
```

### DSL 示例：记录当前位置

```json
{
  "schemaVersion": "robot-plan/v1",
  "planId": "plan_memory_001",
  "createdAt": "2026-07-09T10:00:00.000Z",
  "createdBy": {
    "padId": "pad-001",
    "sessionId": "sess-001",
    "agentRunId": "agent-001"
  },
  "intent": "用户声明这里是主卧",
  "risk": "medium",
  "requiresUserConfirmation": false,
  "assumptions": ["当前位置来自机器人当前定位"],
  "constraints": {
    "maxDurationMs": 3000,
    "maxSteps": 2,
    "allowedTools": ["base.state", "memory.upsertPoi"]
  },
  "steps": [
    {
      "id": "s1",
      "tool": "base.state",
      "args": {}
    },
    {
      "id": "s2",
      "tool": "memory.upsertPoi",
      "dependsOn": ["s1"],
      "args": {
        "poi": {
          "name": "主卧",
          "aliases": ["卧室", "master bedroom"],
          "type": "room",
          "source": "user",
          "confidence": 0.8
        }
      }
    }
  ]
}
```

### DSL 示例：移动到主卧

```json
{
  "schemaVersion": "robot-plan/v1",
  "planId": "plan_move_001",
  "createdAt": "2026-07-09T10:01:00.000Z",
  "createdBy": {
    "padId": "pad-001",
    "sessionId": "sess-001",
    "agentRunId": "agent-002"
  },
  "intent": "移动到主卧",
  "risk": "high",
  "requiresUserConfirmation": true,
  "assumptions": ["主卧 POI 已存在", "机器人定位可用"],
  "constraints": {
    "maxDurationMs": 30000,
    "maxSteps": 6,
    "allowedTools": [
      "speech.say",
      "memory.getPoi",
      "watchdog.acquire",
      "base.followPath",
      "watchdog.release",
      "led.setMode"
    ]
  },
  "steps": [
    {
      "id": "s1",
      "tool": "speech.say",
      "args": { "text": "我准备移动到主卧。" }
    },
    {
      "id": "s2",
      "tool": "memory.getPoi",
      "args": { "name": "主卧" }
    },
    {
      "id": "s3",
      "tool": "watchdog.acquire",
      "args": { "resource": "base", "ttlMs": 1500 }
    },
    {
      "id": "s4",
      "tool": "base.followPath",
      "dependsOn": ["s2", "s3"],
      "args": {
        "targetPoi": "主卧",
        "maxSpeedMps": 0.15
      },
      "timeoutMs": 30000,
      "safety": {
        "requiresLease": "base",
        "stopOnObstacle": true,
        "maxSpeedMps": 0.15
      }
    },
    {
      "id": "s5",
      "tool": "watchdog.release",
      "dependsOn": ["s4"],
      "args": { "resource": "base" }
    }
  ]
}
```

## Robot Plan Validator

Robot API 收到 plan 后，先 validate，不执行。

```http
POST /api/plans/validate
```

### Validator 必须检查

- `schemaVersion` 是否支持。
- `planId` 是否重复。
- `steps.length <= maxSteps`。
- tool 是否存在于 registry。
- tool 是否在 `allowedTools`。
- args 是否符合 tool input schema。
- 是否有循环依赖。
- 是否引用不存在的 step。
- plan risk 是否与 tool risk 匹配。
- 高风险 tool 是否声明 user confirmation。
- `base`、`arm` 动作是否有 lease。
- 是否超出最大速度、距离、力度、时长。
- 是否涉及 no-go zone。
- 是否缺少 stop / release 兜底。
- 是否请求了 Robot 不支持的 capability。

```ts
interface PlanValidationResult {
  ok: boolean;
  planId: string;
  normalizedPlan?: RobotPlan;
  errors: Array<{
    code: string;
    message: string;
    stepId?: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
    stepId?: string;
  }>;
}
```

## Robot Plan Executor

Executor 是本体侧解释器，只按 DSL 执行 tool。

### 执行规则

- 按依赖拓扑顺序执行。
- 默认串行执行；MVP 不支持并行硬件动作。
- `base.stop`、`arm.stop` 可随时插队。
- 每一步都有 timeout。
- 任一步失败，默认停止后续步骤。
- 高风险步骤执行前再次检查 safety。
- plan 执行中持续写审计日志。
- executor 不提供 shell、文件系统、网络通用能力。

```ts
interface RobotPlanState {
  planId: string;
  status: 'pending' | 'validating' | 'running' | 'done' | 'failed' | 'stopped';
  currentStepId?: string;
  steps: Array<{
    id: string;
    tool: string;
    status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
    startedAt?: string;
    endedAt?: string;
    result?: RobotApiEnvelope;
  }>;
}
```

## 通信层设计

### Pad 模块

```text
pad/src/robot/
  robotSdk.ts
  robotPlanBuilder.ts
  robotPlanSchema.ts
  toolRegistryClient.ts
  robotApiClient.ts
  robotEventClient.ts
  videoStreamClient.ts
```

### Robot 模块

```text
robot/
  robot-api
  tool-registry
  plan-validator
  plan-executor
  safety-proxy
  robot-watchdog
  base-adapter
  arm-adapter
  memory-store
  speech-adapter
  led-adapter
  video-stream
```

### HTTPS Client

```ts
interface RobotApiClient {
  getTools(): Promise<RobotToolDefinition[]>;
  validatePlan(plan: RobotPlan): Promise<PlanValidationResult>;
  submitPlan(plan: RobotPlan): Promise<RobotPlanState>;
  executePlan(planId: string): Promise<RobotPlanState>;
  stopPlan(planId: string, reason: string): Promise<RobotPlanState>;
  getPlanState(planId: string): Promise<RobotPlanState>;
}
```

### WebSocket Client

```ts
interface RobotEventClient {
  connect(): Promise<void>;
  subscribe(handler: (event: RobotEvent) => void): () => void;
  close(): void;
}
```

### 连接稳定性

- HTTPS 请求全部带 `requestId` 和 `idempotencyKey`。
- `POST /api/plans` 以 `planId` 幂等去重。
- WebSocket 断开后自动重连并从 `lastEventId` 恢复事件。
- Robot 侧事件保留最近 N 分钟或 N 条。
- Pad 断线重连后先 `GET /api/plans/:id` 读取最终状态。
- 查询请求可以重试；执行类请求只按幂等键重放，不盲目重复动作。
- 急停 `POST /api/watchdog/stop-all` 为最高优先级。

## 统一 JSON Envelope

所有 Robot API 返回 `robot-api/v1` envelope。

```ts
interface RobotApiEnvelope<T = unknown> {
  schemaVersion: 'robot-api/v1';
  ok: boolean;
  requestId: string;
  status: RobotApiStatus;
  message: string;
  data: T;
  error?: RobotApiError;
  timing: {
    startedAt: string;
    endedAt: string;
    durationMs: number;
  };
  robot: {
    robotId: string;
    hostname: string;
    softwareVersion: string;
  };
}

type RobotApiStatus =
  | 'done'
  | 'accepted'
  | 'running'
  | 'blocked'
  | 'timeout'
  | 'cancelled'
  | 'unsafe'
  | 'invalid_request'
  | 'hardware_error'
  | 'unavailable';

interface RobotApiError {
  code: string;
  retryable: boolean;
  detail?: string;
}
```

## Watchdog

Watchdog 是本体侧常驻进程，负责资源租约、心跳、超时停机和急停。

```http
GET  /api/watchdog/state
POST /api/watchdog/stop-all
```

Plan executor 内部调用 watchdog：

- `base.followPath` 必须持有 `base` lease。
- `arm.grasp/place` 必须持有 `arm` lease。
- Pad 或 executor 断线后，TTL 到期自动 stop。
- 急停不需要 lease。
- 同一资源只允许一个活动 lease。
- Watchdog 写审计日志。

## 安全要求

### Robot 侧强制安全

- DSL validator 不信任 Pad。
- Tool risk、参数范围、速度、力度、距离、时长都由 Robot 侧限制。
- 高风险动作必须检查 `requiresUserConfirmation` 和 fresh confirmation token。
- 移动和机械臂动作必须通过 safety proxy。
- 本体本地避障、碰撞、低电量、跌落风险优先于 plan。
- 任意 validator 或 executor 错误都不能让硬件保持运动。

### Pad 侧安全

- Pad 生成 plan 前做本地预校验。
- UI 清楚展示高风险动作和确认问题。
- 用户急停按钮始终可见。
- Pad 断线后不假设动作成功，必须重连查询 plan state。

### API 安全

- 只允许 HTTPS/WSS。
- Pairing token 和 session token 可撤销、可过期。
- Pad 侧 pin robot public key 或证书 fingerprint。
- 高风险请求需要 fresh confirmation token。
- Robot API 不提供 shell 或任意命令执行。
- Robot API 有 allowlist、rate limit、audit log。

## 地图坐标与 POI Schema

MVP 使用 2D 家庭地图，单位米，右手系：

- `map`：全屋固定坐标，`x` 向右，`y` 向前，`thetaRad` 逆时针。
- `odom`：短期里程计坐标。
- `base_link`：底盘中心。
- 所有 POI 存 `map` frame。

```ts
interface Pose2D {
  frame: 'map' | 'odom' | 'base_link';
  x: number;
  y: number;
  thetaRad: number;
  covariance?: number[];
}

interface RobotMap {
  schemaVersion: 'robot-map/v1';
  mapId: string;
  name: string;
  frame: 'map';
  resolutionMeters: number;
  origin: Pose2D;
  rooms: RoomRegion[];
  noGoZones: MapPolygon[];
  poi: RobotPoi[];
  updatedAt: string;
}

interface RobotPoi {
  id: string;
  name: string;
  aliases: string[];
  type: 'room' | 'dock' | 'table' | 'sofa' | 'bed' | 'doorway' | 'object' | 'custom';
  pose?: Pose2D;
  radiusMeters?: number;
  roomId?: string;
  source: 'user' | 'vision' | 'import' | 'system';
  confidence: number;
  updatedAt: string;
  metadata?: Record<string, string | number | boolean>;
}

interface RoomRegion {
  id: string;
  name: string;
  aliases: string[];
  polygon: MapPolygon;
}

interface MapPolygon {
  frame: 'map';
  points: Array<{ x: number; y: number }>;
}
```

## 视频流

视频不走 HTTPS 响应体。HTTPS 只负责启动、停止、查询视频服务和获取短期 token。视频流走独立通道。

| 方案       | 延迟   | iOS      | Android  | Web              | 结论     |
| ---------- | ------ | -------- | -------- | ---------------- | -------- |
| WebRTC     | 低     | 支持     | 支持     | 支持             | 主方案   |
| RTSP       | 低到中 | 原生需库 | 支持较好 | 浏览器不原生支持 | 调试备用 |
| HLS/LL-HLS | 中     | 支持好   | 支持     | 支持             | 监控备用 |
| MJPEG      | 中     | 支持     | 支持     | 支持             | 简单调试 |

```http
POST /api/video/start
POST /api/video/stop
GET  /api/video/state
```

```ts
interface VideoStreamInfo {
  streamId: string;
  profile: 'teleop' | 'monitor' | 'snapshot';
  transport: 'webrtc' | 'rtsp' | 'hls' | 'mjpeg';
  url?: string;
  signalingUrl?: string;
  token?: string;
  expiresAt: string;
  resolution: { width: number; height: number };
  fps: number;
  latencyTargetMs: number;
}
```

## 10Hz 与高频控制

默认 plan 不做高频控制。正式移动以 `base.followPath` 这类本体 autonomous tool 为主。

如果需要低速 teleop：

- HTTPS 只启动 teleop session 和获取 token。
- 高频控制走专用 WebSocket/QUIC/UDP session。
- MVP 可先用 WebSocket：`WSS /api/teleop/base/:sessionId`。
- 本体对速度包做 `seq`、`sentAt`、过期丢弃。
- 200-300ms 没有新速度包，本体速度归零。
- 本地限速、避障、watchdog 优先级高于 Pad。

## MVP 开发范围

当前工程目录只开发客户端侧能力。硬件本体侧作为外部依赖和接口契约，不在本仓库实现真实驱动、watchdog daemon、plan executor 或视频编码服务。

### 客户端侧 MVP

客户端侧包括 Pad Web/WebView UI、agent 编排、DSL 生成、Robot API client、WebSocket event client、mock robot API 和 console 集成。

#### C0: Robot API Client 与连接配置

- 新增客户端 Robot 连接配置模型：`baseUrl`、`robotId`、`token`、`certificateFingerprint`。
- 实现 `RobotApiClient`：
  - `getHealth()`
  - `getTools()`
  - `getTool(toolName)`
  - `validatePlan(plan)`
  - `submitPlan(plan)`
  - `executePlan(planId)`
  - `stopPlan(planId, reason)`
  - `getPlanState(planId)`
- 实现请求 envelope 解析：`robot-api/v1`。
- 实现错误分类：offline、auth、protocol、validation、business。
- 实现 requestId / idempotencyKey。
- MVP 可先用手动输入 `baseUrl/token`；二维码配对和证书 pinning 先保留接口，不做完整原生能力。

#### C1: WebSocket Event Client

- 实现 `RobotEventClient`：
  - 连接 `WSS /api/events`。
  - 接收 plan、step、watchdog、safety、video 状态事件。
  - 支持断线重连。
  - 支持 `lastEventId` 恢复事件。
- 将事件写入 console。
- 将 plan/step 状态映射到角色运行态和 UI 状态。

#### C2: Tool Registry Client

- 从 `GET /api/tools` 拉取机器人 tool registry。
- 在客户端保存当前 robot capability snapshot。
- 如果 registry 缺失某个 tool，Pad agent 生成 plan 时要降级或提示无法执行。
- 在角色配置或 debug 面板展示可用 tool、risk、requiresConfirmation、requiresLease。
- 提供 mock registry 供无机器人开发。

#### C3: robot-plan/v1 Schema 与 Builder

- 在客户端定义 `robot-plan/v1` TypeScript 类型。
- 增加 plan builder：
  - 用户环境声明 -> `memory.upsertPoi` plan。
  - 去某个 POI -> `memory.getPoi + watchdog.acquire + base.followPath + watchdog.release` plan。
  - 语音确认 -> `speech.say` plan。
  - LED 状态 -> `led.setMode` plan。
- 本地预校验：
  - tool 是否存在。
  - step 依赖是否成环。
  - 是否超过 maxSteps/maxDuration。
  - high/critical risk 是否需要用户确认。
- 本地预校验只用于用户体验，最终以 Robot validator 为准。

#### C4: Agent 编排与 Console 集成

- Console 输入继续作为用户意图入口，但不再映射为“交互入口员”角色。
- Console 负责识别当前 MVP 支持的机器人意图，并触发对应 agent 角色可视化：
  - “这里是主卧” -> 任务规划员、家庭记忆员。
  - “去主卧” -> 任务规划员、安全监督员、家庭记忆员、底盘驾驶员、视觉观察员、语音播报员、LED 表情员。
  - “说……” -> 任务规划员、语音播报员。
  - “LED: ……” -> 任务规划员、LED 表情员。
- 首屏默认展示完整机器人 agent 团队，Console 任务只负责补齐和点亮相关角色，不显示角色 dock。
- 输入“这里是主卧”时：
  - Console 识别为环境声明。
  - 可视化任务规划员与家庭记忆员协作。
  - 客户端生成 `memory.upsertPoi` plan。
  - 调 `POST /api/plans/validate`。
  - 验证通过后 submit/execute。
  - console 展示 planId、step、结果。
- 输入“去主卧”时：
  - Console 识别为移动意图。
  - 可视化任务规划员、安全监督员、家庭记忆员、底盘驾驶员、视觉观察员、语音播报员和 LED 表情员协作。
  - 生成移动 plan。
  - UI 要求用户确认高风险移动。
  - 确认后 submit/execute。
  - 事件流驱动 console 和角色状态。
- 输入“说……”时：
  - Console 识别为语音播报意图。
  - 可视化任务规划员与语音播报员协作。
  - 生成 `speech.say` plan，验证通过后 submit/execute。
- 输入“LED: ……”时：
  - Console 识别为 LED 状态意图。
  - 可视化任务规划员与 LED 表情员协作。
  - 生成 `led.setMode` plan，验证通过后 submit/execute。
- 用户点击急停：
  - 调 `POST /api/plans/:id/stop`。
  - 同时调 `POST /api/watchdog/stop-all`。

#### C5: Mock Robot API

- 当前工程必须提供 mock robot API，便于没有硬件时开发和测试。
- mock 支持：
  - `GET /api/health`
  - `GET /api/tools`
  - `POST /api/plans/validate`
  - `POST /api/plans`
  - `POST /api/plans/:id/execute`
  - `GET /api/plans/:id`
  - `POST /api/plans/:id/stop`
  - `WSS /api/events` 或本地模拟事件总线。
- mock 能模拟：
  - validate 成功/失败。
  - plan step started/done/failed。
  - watchdog lease expired。
  - safety blocked。
  - robot offline。

#### C6: Pad UI / WebView 适配

- 当前 Web UI 先作为 Pad UI 原型。
- 右侧 console 显示 Robot API 请求、plan validation、step event。
- 设置面板增加 Robot 连接状态和 mock/real 切换。
- Console 是默认主入口，承载用户输入、教程脚本、确认、错误恢复和 Robot API 日志。
- Console 识别到机器人任务后，客户端自动把相关核心角色加入场景，并打开角色可视化，使“agent 编排 => 可视化”的产品思想默认成立。
- 首屏默认展示核心机器人 agent 团队，避免进入界面后只有空场景和 console。用户一进来应能看到“这些角色会协作控制机器人”。
- 角色 dock 不再显示；初始角色已经在场景内，后续由 Console 任务自动补齐相关角色。
- 角色头顶不显示角色名、配置摘要或长文字说明，避免遮挡场景。
- “xx卡”表达改为“xx员”，避免在角色头顶重复出现抽象卡片概念；可视化重点是角色协作关系，不是卡片收集游戏。
- 角色体系收敛为核心机器人职责：
  - 任务规划员：把用户意图拆成 `robot-plan/v1`，决定 tool、假设、风险和确认需求。
  - 安全监督员：检查 high/critical 风险、用户确认、lease、速度、禁区和急停状态。
  - 家庭记忆员：管理 POI、房间别名、地图记忆和用户环境声明。
  - 底盘驾驶员：负责 `base.state`、`base.followPath`、`base.stop` 和 base lease。
  - 机械臂操作员：负责抓取、放置、递送、机械臂 stop 和 arm lease。
  - 视觉观察员：读取摄像头/视觉摘要，提供障碍物、物体、通道和人体事实。
  - 语音播报员：把确认、提醒、结果转成适合扬声器播放的短句。
  - LED 表情员：把等待、执行中、成功、错误和安全状态转成 LED 灯效。
- Console 是输入入口，不再人格化成“交互入口员”；天气、旅行、翻译、故事、海报、百科等通用角色不再出现在机器人控制主流程中。
- 画布上的角色状态响应 plan events。

#### C7: 视频客户端占位

- 定义 `VideoStreamClient` 接口。
- 支持读取 `POST /api/video/start` 返回的 `VideoStreamInfo`。
- MVP 可以先展示 stream metadata，不必须完成 WebRTC 播放。
- 后续 Pad App 原生层接 WebRTC。

### 硬件本体侧需求契约

本体侧不在当前工程实现，但需要按以下契约交付给客户端联调。

#### R0: Robot API Service

- 提供 HTTPS/WSS 服务。
- 支持 pairing/token/certificate pinning。
- 所有响应使用 `robot-api/v1` envelope。
- 支持 requestId/idempotencyKey。

#### R1: Tool Registry

- 实现 `GET /api/tools`、`GET /api/tools/:toolName`。
- 每个 tool 提供 inputSchema、outputSchema、risk、requiresConfirmation、requiresLease、timeoutMs。

#### R2: Plan Validator / Executor

- 实现 `POST /api/plans/validate`。
- 实现 submit/execute/state/stop。
- 不执行任意代码，只解释 `robot-plan/v1`。
- 强制校验 tool allowlist、args schema、risk、lease、no-go zone、速度/力度限制。

#### R3: Watchdog / Safety

- 本体侧必须有 watchdog daemon。
- lease 过期自动 stop。
- 急停始终最高优先级。
- safety proxy 拦截移动和机械臂高风险动作。

#### R4: Hardware Tool Adapters

- `base.state/stop/followPath`
- `arm.state/stop/grasp/place`
- `memory.getPoi/upsertPoi`
- `speech.say`
- `led.setMode`
- `vision.snapshot`

#### R5: Video Service

- 提供 video start/stop/state API。
- WebRTC 为主，RTSP/HLS 可备用。
- 视频流不通过 Robot API JSON 响应体传输。

## 数据流

### 用户声明“这里是主卧”

```text
Pad agent 理解为环境声明
Pad 生成 robot-plan/v1
Pad HTTPS: POST /api/plans/validate
Robot validator 通过
Pad HTTPS: POST /api/plans
Pad HTTPS: POST /api/plans/:id/execute
Robot executor 调 memory.upsertPoi
Robot WS: plan.step.done
Pad console 显示结果
```

### 用户要求“去主卧”

```text
Pad agent 查询 GET /api/tools
Pad agent 生成 plan
Pad UI 请求用户确认高风险移动
Pad HTTPS: POST /api/plans/validate
Robot validator 检查 POI、速度、lease、安全约束
Pad HTTPS: POST /api/plans
Pad HTTPS: POST /api/plans/:id/execute
Robot executor acquire base lease
Robot executor 调 base.followPath
Watchdog 维持 lease
Robot WS: plan.step.* / plan.done
Pad console / UI 展示进度
```

## 失败处理

| 场景                 | 处理                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| HTTPS 连接失败       | Pad 显示本体离线，不执行 plan                                        |
| WebSocket 断开       | 自动重连，用 lastEventId 补事件；同时 GET plan state                 |
| 证书/public key 变化 | 阻止连接，要求重新配对                                               |
| Plan validate 失败   | Pad 展示 validator errors，agent 重新生成 plan                       |
| Tool 不存在          | Pad 刷新 registry 或降级任务                                         |
| 动作执行中 Pad 断线  | Watchdog lease 到期，本体自动 stop                                   |
| API 返回非 JSON      | 标记 protocol error，不继续执行                                      |
| Step failed          | Executor 停止后续 step，返回失败原因                                 |
| 视频断开             | UI 显示视觉不可用，不影响急停                                        |
| 用户急停             | Pad 发送 `POST /api/plans/:id/stop` 和 `POST /api/watchdog/stop-all` |

## 客户端侧验收标准

当前工程 MVP 只按客户端侧验收。

- 能配置 mock/real robot endpoint。
- 能读取 mock robot tool registry。
- 能显示 tool risk、requiresConfirmation、requiresLease。
- 能生成合法 `robot-plan/v1`。
- 本地预校验能发现缺失 tool、循环依赖、超出 maxSteps、高风险未确认。
- 能调用 mock `POST /api/plans/validate` 并展示结构化 validation errors。
- 能 submit/execute mock plan。
- 能通过 mock event stream 收到 `plan.step.started`、`plan.step.done`、`plan.done`。
- Console 能展示 planId、stepId、tool、status、message。
- 输入“这里是主卧”能生成并执行 `memory.upsertPoi` plan。
- 输入“去主卧”能生成移动 plan，并在执行前要求用户确认。
- 点击急停能调用 stop plan 和 watchdog stop-all。
- API 非 JSON、schemaVersion 不匹配、响应超限能归类为 protocol error。
- WebSocket 断开能重连并读取 plan state。

## 硬件本体侧联调验收标准

这些验收不在当前工程内完成，但用于后续和本体团队联调。

- Robot 能 validate plan 并返回结构化错误。
- Robot 不接受任意 JS/TS/Python 脚本。
- Robot executor 只执行 registry 中声明的 tool。
- `base.followPath` 必须经过 confirmation、lease 和 safety 检查。
- 用户输入“这里是主卧”能通过 plan 写入真实 POI。
- 用户输入“去主卧”能通过 plan 执行真实移动。
- Pad 断线后 watchdog 能自动停止底盘或机械臂。
- 证书/public key 变化时拒绝连接。
- Pad 能播放 WebRTC 视频流，HTTPS 不承载视频数据。

## 已决策事项

- Pad 正式控制端优先做 WebView 包壳 App、原生 App 或 PWA；通信统一走 HTTPS/WSS。
- 不再把 SSH 作为控制链路。
- Pad 运行 agent 编排和 vibe coding。
- Robot 只接受 `robot-plan/v1` DSL。
- Robot 不执行任意生成代码。
- Robot tool 使用 registry + schema + risk metadata。
- 本体 API 使用 `robot-api/v1` envelope。
- 地图和 POI 使用 `robot-map/v1`。
- 本体侧必须有 `robot-watchdog` daemon。
- 视频使用 WebRTC 主方案，RTSP/HLS 备用。
- 当前工程仅开发客户端侧功能；硬件本体侧按接口契约独立实现。
