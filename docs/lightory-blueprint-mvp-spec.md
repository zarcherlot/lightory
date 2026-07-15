# Lightory 蓝图工作台纵向原型实施规范

> 状态：待产品核对
> 实施对象：Coding Agent
> 实施优先级：当前阶段唯一产品实施规范

## 1. 目标

验证孩子能否像总工程师一样，通过手绘蓝图、组织 Agent、验收交付和调试错误完成一个小型工程闭环。

本阶段只实现可运行的纵向原型，不实现完整“家庭寻宝”课程。原型完成后，孩子应能亲自完成：

1. 绘制系统结构。
2. 定义模块名称和关系。
3. 给 Agent 分配任务。
4. 确认 Agent 对任务的理解。
5. 验收或退回 Agent 的方案。
6. 制定执行顺序和检查点。
7. 运行模拟并观察数据流。
8. 定位一个可解释的错误，修改后重新验证。

## 2. 产品系统与通用性

### 2.1 App、小车与 AI 的关系

Lightory 由三个边界清晰的部分组成：

- **平板 App 是工程工作台**：孩子在这里定义目标、画架构、制定计划、组织 Agent、验收和调试。产品的主要学习价值发生在 App 中。
- **小车是现实执行器**：提供可观察的传感与动作能力，让孩子验证设计是否在现实世界成立；小车不是自主替孩子完成任务的 AI 玩具。
- **AI 是协作团队**：AI 导师负责提问和引导，Agent 工程师负责受委托的局部工作，二者都没有总工程师权限。

小车通过 Robot API 向 App 声明能力。App 只能使用实际在线、已授权的 Tool，不得让 AI 虚构硬件能力。前期只开放：

- `voice`：播放孩子确认过的语音内容。
- `basic-movement`：前进、后退、转向、停止等受安全约束的基础移动。

纵向原型先使用与真实 Tool 语义一致的模拟器；真实小车接入延后，但领域模型和计划不得为模拟器特化。

### 2.2 一个通用工作台，而非一个任务一个前端包

- “家庭寻宝”只是第一条验收任务，不是页面结构或代码分支。
- 后续“博物馆导览”“校园任务”等必须复用同一个工作台、工程对象、Agent 协作和调试流程。
- 新任务以可独立加载的 JSON 数据定义目标背景、可用 Tool、Agent、阶段门槛、检查点、预设故障和成功条件。
- 任务定义不得包含 React 组件名、屏幕坐标、CSS 或页面跳转逻辑。
- 前端只渲染通用对象：目标、节点、关系、计划、Agent、交付、测试结果和调试记录。
- 新增普通任务不得修改、重新构建或重新发布前端；只有新增通用交互能力时才允许改前端代码。

### 2.3 学习路径

产品共用一套工作台，按能力逐步解除约束：

1. **教学关卡**：认识语音和基础移动 Tool，导师提供较强的步骤提示。
2. **家庭寻宝毕业任务**：孩子综合使用目标、架构、分工、计划、测试和调试。
3. **自由工坊**：孩子自拟任务，在真实 Tool 能力和安全规则内自由设计。

关卡只能控制可用能力和提示强度，不得替换工作台或生成任务专属界面。

## 3. 角色、权限与产品边界

### 3.1 孩子是总工程师

孩子必须亲自完成或最终确认：

- 说明“要解决什么问题”和成功标准。
- 将目标拆成模块，绘制总体架构和交付关系。
- 查看每个 Agent 的能力，决定是否聘用以及如何分工。
- 为 Agent 写出或口述任务、输入、输出和验收标准。
- 确认 Agent 的任务复述，解决不清楚或互相冲突的要求。
- 制定步骤顺序、并行关系和检查点。
- 验收或退回交付，预测运行结果并发起实验。
- 对照预期与实际定位问题，选择修复方案并重新验证。

界面必须留下孩子的工程足迹：自己提出的目标、做出的决定、退回的交付、发现的错误和完成的修复。完成度不得只按最终结果评价。

### 3.2 Agent 工程师能做什么

Agent 只能在孩子确认的任务合同内：

- 介绍自己的 Tool、输入、输出和限制。
- 询问缺失信息并复述对任务的理解。
- 提交局部设计、参数建议、计划片段或测试结果。
- 解释失败原因，按孩子的修改意见重新交付。
- 明确表示不确定、能力不足或依赖缺失。

### 3.3 Agent 工程师不能做什么

- 不得替孩子定义总目标、总体架构或完整计划。
- 不得自行聘用其他 Agent、改变分工或扩大任务范围。
- 不得未经确认写入正式蓝图、接受自己的交付或启动小车。
- 不得绕过 Tool 权限、安全限制、检查点或紧急停止。
- 不得隐藏错误、伪造测试结果或把推测表达成事实。
- 不得一次性生成完整项目并只让孩子点击“同意”。

### 3.4 Agent 工作流

Agent 被拖入模块后必须按以下状态运行：

```text
等待分配 -> 复述任务 -> 等待孩子确认 -> 工作中
        -> 提交草案 -> 等待验收 -> 接受或退回
```

- Agent 的交付先以半透明草案显示，不直接写入正式蓝图。
- 被退回时保留上一版及孩子的修改意见。
- 原型使用确定性 Mock Agent，不连接真实大模型。
- 每个项目至少包含一次“Agent 交付有误 -> 孩子发现 -> 修改 -> 复验”的有效循环；仅点击接受不能完成项目。

### 3.5 Agent 是会犯错的“小迷糊”

Agent 的产品角色不是全能专家，而是“有专长但会迷糊的实习工程师”。这个设定适用于所有模式，不是教学关卡的临时剧情。

#### Agent 为什么会犯错

- 每个 Agent 只有局部能力，并且只能看到孩子交给它的任务合同和引用制品，默认看不到完整项目。
- Agent 具有明确的已知短板，例如容易漏掉转向后的朝向、混淆播放时机或忽略交付格式。
- Agent 可能误解需求、遗漏条件、使用错误参数、接错输入输出、安排错误顺序或提出无法执行的方案。
- Agent 提交草案时必须列出自己的理解、假设和不确定项，但不能指出系统安排的具体错误位置。
- Agent 卡片始终显示“需要总工程师复核”，不得使用“智能完成”“保证正确”等表达。

#### 如何保证每种模式都有调试机会

- **教学关卡**：使用课程指定的单一故障，错误位置和证据固定，导师可逐级提示。
- **家庭寻宝等毕业任务**：从与当前 Tool、架构和能力等级兼容的故障模板中选择，孩子事前不知道错误位置。
- **自由工坊**：先检查真实 Agent 交付；若已经存在可安全验证的问题，保留该问题供孩子审查；若没有，则由 `ReviewChallengeEngine` 生成一个“小迷糊版本”进入模拟器。挑战解决后的复盘必须说明它是训练故障。

所有模式至少产生一个有因果关系、可观察、可修复的错误。错误不得是乱码、随机失败或与 Agent 能力无关的刁难，也不得重复注入孩子已经掌握的同类问题。

#### 孩子如何纠正 Agent

1. Agent 提交后，状态统一显示为“等待总工程师验收”，不能直接成为正式结果。
2. 孩子先写出预期或选择检查标准，再运行模拟。
3. 系统在预期与实际第一次不同的位置暂停，只展示输入、输出、事件和传感证据。
4. 孩子判断问题属于需求、架构、分工、接口、计划、参数还是执行。
5. 孩子决定修改蓝图、补充任务合同，或带着证据把交付退回 Agent。
6. Agent 必须复述“哪里错了、为什么错、准备改什么”，经孩子确认后才能提交新版本。
7. 修复必须重新实验；不能以 Agent 声称“已经修好”作为结束条件。

系统不得在后台静默修复、自动接受或把错误位置直接高亮为答案。错误和修复都写入孩子的工程足迹，评价重点包括发现问题、使用证据、坚持复验和改进沟通。

所有训练故障先在模拟器运行；通过孩子验收和安全校验后才允许下发真实小车。

### 3.6 AI 导师的苏格拉底式引导

AI 导师不是答案生成器。每次介入应优先提出一个短问题，让孩子观察、预测、解释或选择理由：

1. **澄清目标**：“小车做到什么，才算真的找到宝藏？”
2. **暴露假设**：“你为什么认为移动完成后一定能播放这条线索？”
3. **检查证据**：“实际转了多少度？和你刚才预测的一样吗？”
4. **比较方案**：“先移动再说话和先说话再移动，分别会发生什么？”
5. **追踪因果**：“第一个和预期不同的地方在哪里？”
6. **促成反思**：“这次修复说明下次设计时要多加什么检查？”

导师采用逐级提示，且每轮只提升一级：

```text
等待孩子尝试 -> 开放问题 -> 指向观察区域 -> 给两个候选方向
              -> 展示局部示例 -> 仅在安全或持续受阻时示范一步
```

- 孩子没有作答前，导师不得继续展开完整方案。
- 同一问题连续失败后才升级提示；升级原因写入学习记录。
- 涉及碰撞、跌落等安全风险时可直接阻止运行并解释原因。
- 导师不能代替孩子确认任何总工程师决定。

## 4. 验收演示

Coding Agent 必须实现以下固定流程：

1. 孩子绘制大框并命名为“寻宝系统”。
2. 在其中绘制两个矩形，命名为“移动”和“语音”。
3. 绘制一个圆形，命名为“线索卡”。
4. 用箭头建立数据或触发关系。
5. 将“路线工程师”和“语音工程师”拖入相应模块。
6. 两个 Agent 分别复述任务，孩子确认后才开始工作。
7. 孩子接受 Agent 提交的草案。
8. 在计划视图中设置“移动”先于“语音”，并添加检查点。
9. 启动模拟，节点依次亮起，数据沿连线流动。
10. “移动”模块因预设的错误角度在首个异常点暂停。
11. 孩子将该模块展开到调试台，修改角度并重新运行。
12. 模拟成功，界面显示本次由孩子完成的决定与修正。

浏览器端必须可以用鼠标完整走通该流程；Android 平板端必须通过触控笔完成绘制和识别验收。

## 5. 通用界面与交互

### 5.1 总体布局

- 主界面是全屏蓝图画布，不使用固定的成人项目管理式多栏布局。
- 顶部保留目标、当前步骤、撤销、重做、运行和紧急停止。
- Agent、导师、计划和调试工具以浮动坞或上下文抽屉出现。
- Agent 卡片同时展示擅长能力、已知短板和“需要总工程师复核”状态；不显示本次错误答案。
- 视觉采用深色工程蓝图、青色光效和 2.5D 层次；首版不实现三维编辑器。

### 5.2 两种视图

架构视图负责：

- 功能模块、数据成果和子系统。
- 包含关系。
- 数据与触发关系。
- Agent 分配和交付草案。

计划视图负责：

- 步骤顺序和并行关系。
- 检查点。
- 运行状态和失败位置。

两种视图共享同一批节点。架构关系不得自动转换成计划，计划也不得改写架构。

### 5.3 最小绘图语法

| 手绘形状 | 结构含义 |
| --- | --- |
| 矩形 | 功能模块 |
| 圆形或椭圆 | 数据、线索或交付成果 |
| 包围其他节点的大框 | 子系统，转换为 `parentId` |
| 带箭头的连线 | 数据或触发关系 |

连线建立后必须选择“数据”或“触发”。执行顺序只在计划视图中配置。

### 5.4 笔迹与识别

- 原始笔迹永久保留，结构化节点只是笔迹的投影。
- 笔画结束并空闲 `250ms` 后，对空间相邻笔画发起识别。
- 置信度 `>= 0.85` 的几何结果可吸附成标准形状，并立即提供撤销入口。
- 低置信度结果只显示候选，不修改蓝图。
- 手写文字显示候选，必须由孩子确认；同时支持语音和键盘输入标签。
- 识别失败时允许手动转换，不阻塞项目。

### 5.5 输入手势

- 触控笔默认绘制；切换为选择工具后可移动节点。
- 单指选择和拖动结构节点，双指平移或缩放。
- 触控笔工作期间忽略手掌触点。
- 桌面鼠标行为由当前的绘制或选择工具决定，滚轮缩放。
- 所有创建、识别、移动、修改和删除操作支持撤销、重做。

### 5.6 运行与调试

- 运行时数据沿连线移动，当前节点发光，已完成节点保留完成态。
- 首个实际结果与预期不一致时立即暂停，不继续播放后续成功动画。
- 孩子可以将故障模块展开到局部调试台。
- 调试台同时显示预期、实际、Agent 解释和可修改参数。
- 修复后只重跑受影响路径，并保留错误前后的对比记录。

### 5.7 通用任务投影

打开任何任务时，前端只执行以下投影，不加载任务专属页面：

```text
TaskDefinition
  -> 目标与约束
  -> 可用 Tool 和 Agent 坞
  -> 空白或带脚手架的 BlueprintDocument
  -> 阶段门槛、测试场景与故障场景
```

任务可以改变文案、素材、Agent、Tool、提示和测试数据，但不能改变第 5.1—5.6 节的基础交互语法。

## 6. 技术方案

### 6.1 技术选型

- 使用 `perfect-freehand` 绘制带压力信息的平滑笔迹。
- 使用 `@xyflow/react` 渲染结构节点、边、嵌套、选择、视口和运行态动画。
- 桌面开发使用 `WebGeometryInkRecognizer`，以确定性算法识别矩形、椭圆、直线和箭头。
- Android WebView 使用 ML Kit Digital Ink Recognition 识别形状和中文手写。
- 领域模型不得依赖 React Flow、ML Kit 或渲染组件的数据结构。
- 不复用现有 `OfficeCanvas`；新建独立的 `EngineeringCanvas`。

### 6.2 核心模型

```ts
type PointerKind = 'mouse' | 'touch' | 'pen';
type BlueprintNodeKind = 'function' | 'artifact' | 'container';
type BlueprintRelation = 'data' | 'trigger';

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  safetyConstraints: string[];
}

interface TaskDefinition {
  schemaVersion: 'lightory-task/v1';
  id: string;
  version: string;
  title: string;
  story: string;
  goalPrompt: string;
  availableToolIds: string[];
  availableAgentIds: string[];
  stageGates: Array<'goal' | 'architecture' | 'assignment' | 'plan' | 'test'>;
  testScenarioIds: string[];
  faultScenarioIds: string[];
  successCriteria: string[];
}

type AgentFaultType =
  | 'requirement-misread' | 'condition-omitted' | 'wrong-parameter'
  | 'interface-mismatch' | 'wrong-order' | 'unsupported-action';

interface AgentDefinition {
  id: string;
  name: string;
  capabilityIds: string[];
  knownLimitations: string[];
  contextScope: 'assignment-only';
  fallibilityPolicyId: string;
}

interface FallibilityPolicy {
  id: string;
  mode: 'scripted' | 'adaptive';
  minimumReviewCycles: number;
  allowedFaultTypes: AgentFaultType[];
  simulatorOnly: true;
}

interface FaultScenario {
  id: string;
  agentId: string;
  type: AgentFaultType;
  observableEvidence: string[];
  repairCriteria: string[];
  debrief: string;
}

interface InkPoint {
  x: number;
  y: number;
  t: number;
  pressure: number;
}

interface InkStroke {
  id: string;
  points: InkPoint[];
  pointerKind: PointerKind;
  createdAt: number;
}

interface BlueprintNode {
  id: string;
  kind: BlueprintNodeKind;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  parentId?: string;
  sourceStrokeIds: string[];
  recognition: {
    source: 'web' | 'android-mlkit' | 'manual';
    confidence?: number;
  };
}

interface BlueprintEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: BlueprintRelation;
  label?: string;
  sourceStrokeIds: string[];
}

interface PlanStep {
  id: string;
  nodeId: string;
  dependsOn: string[];
  checkpoint: boolean;
}

interface AgentAssignment {
  id: string;
  nodeId: string;
  agentId: string;
  status: 'draft' | 'awaiting-confirmation' | 'working'
    | 'awaiting-review' | 'accepted' | 'returned';
}

interface AgentDelivery {
  id: string;
  assignmentId: string;
  version: number;
  summary: string;
  assumptions: string[];
  uncertainties: string[];
  artifact: Record<string, unknown>;
  status: 'draft' | 'accepted' | 'returned';
}

interface DebugSession {
  id: string;
  deliveryId: string;
  expected: Record<string, unknown>;
  actual?: Record<string, unknown>;
  evidence: string[];
  diagnosis?: AgentFaultType;
  correction?: string;
  retestPassed?: boolean;
}

interface BlueprintRevision {
  id: string;
  createdAt: number;
  reason: string;
}

interface BlueprintDocument {
  schemaVersion: 'blueprint/v1';
  strokes: InkStroke[];
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  planSteps: PlanStep[];
  assignments: AgentAssignment[];
  deliveries: AgentDelivery[];
  debugSessions: DebugSession[];
  revisions: BlueprintRevision[];
}
```

识别器必须通过统一接口接入：

```ts
type RecognitionKind =
  | 'rectangle' | 'ellipse' | 'arrow' | 'line' | 'text' | 'unknown';

interface InkRecognitionRequest {
  requestId: string;
  strokes: InkStroke[];
  mode: 'shape' | 'text';
  language?: string;
}

interface RecognitionCandidate {
  requestId: string;
  strokeIds: string[];
  kind: RecognitionKind;
  confidence: number;
  textCandidates?: string[];
  bounds?: { x: number; y: number; width: number; height: number };
}

interface InkRecognizer {
  recognize(request: InkRecognitionRequest): Promise<RecognitionCandidate[]>;
}
```

Android 桥只新增 `recognizeInk` 请求和识别结果事件，不得提供通用文件、网络、Shell 或硬件控制能力。机器人控制继续遵循 [Pad Robot API 规范](./pad-robot-api-control-requirements.md)。Android 容器约束遵循 [Android Pad 开发计划](./android-pad-development-plan.md)。

### 6.3 前端模块

- `EngineeringCanvas`：Pointer Event、坐标转换、手势和视口。
- `InkLayer`：原始笔迹、候选结果和吸附预览。
- `BlueprintGraphLayer`：结构节点、连线和包含关系。
- `PlanView`：步骤依赖、并行关系和检查点。
- `AgentDock`：Agent 能力展示、拖放和任务复述。
- `AgentAssignmentController`：Agent 状态及交付验收。
- `SimulationRuntime`：确定性运行、数据流动画和故障暂停。
- `ReviewChallengeEngine`：按模式选择真实问题或兼容的训练故障，保证至少一次有效复核且只作用于模拟器。
- `DebugWorkbench`：参数修改、局部重试和结果对比。
- `InkRecognizer` 适配层：浏览器与 Android 两种实现。
- `TaskDefinitionLoader`：加载内置或外部 JSON 任务数据，拒绝可执行代码，并校验 schema 及 Tool、Agent、测试和故障引用。
- `MentorController`：根据孩子的尝试和提示级别生成一个引导问题，不直接修改工程对象。

## 7. 测试与完成标准

### 7.1 自动测试

- 单元测试：几何识别、坐标变换、笔画分组、包含关系、计划依赖和状态机。
- 组件测试：候选确认/拒绝、Agent 拖放/验收、撤销/重做、双视图同步。
- 调试闭环测试：未记录预期不能直接判定成功；故障在首个差异点暂停；修复后必须复验；Agent 必须解释改动。
- 小迷糊机制测试：三种模式都产生一次有效复核；自由工坊已有真实问题时不再注入；无问题时只在模拟器生成训练故障并在复盘中说明来源。
- 序列化测试：`blueprint/v1` 保存后重新载入无信息丢失。
- 任务通用性测试：同一套组件分别加载家庭寻宝和一个最小博物馆导览 fixture，不出现任务 ID 分支或专属页面。
- 导师测试：未作答不升级、连续失败逐级提示、安全风险直接阻止、导师不能提交决定。
- 浏览器 E2E：使用鼠标完成第 4 节全部步骤，包括错误修复。

### 7.2 Android 实机验收

- 触控笔延迟、压力数据和连续笔迹可用。
- 防误触、笔/手指切换及双指缩放符合第 5.5 节。
- ML Kit 能返回形状和中文标签候选。
- WebView 暂停、恢复后蓝图状态不丢失。

### 7.3 完成定义

- 第 4 节固定演示在浏览器和 Android 平板上均可完成。
- 孩子不确认时，Agent 无法开始工作或提交正式结果。
- 项目不能在没有完成至少一次 Agent 错误复核与重新验证的情况下结束。
- AI 导师只能创建问题或提示，不能直接修改 `BlueprintDocument`。
- 替换 `TaskDefinition` 后，工作台能加载不同任务而无需修改前端代码。
- 原始笔迹在结构化识别、撤销和重新载入后仍可追溯。
- 预设错误能稳定复现；孩子能根据证据定位、纠正并复验；系统不会替孩子静默修复。
- 未修复或未通过安全校验的“小迷糊版本”永远不能下发真实小车。
- 类型检查、单元测试、前端构建和 E2E 全部通过。

## 8. 本阶段不做

- 真实大模型 Agent 和开放式对话。
- 真实小车执行及完整家庭寻宝课程。
- 云同步、账号、多人协作和家长端。
- iPad 原生识别桥。
- 完整课程系统、自由工坊和商业级视觉包装。
- 三维全息编辑器。

开发顺序固定为：桌面浏览器纵向流程 → Android ML Kit 接入 → Android 平板实机验收。桌面触摸模拟不能替代平板验收。
