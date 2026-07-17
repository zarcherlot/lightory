# Lightory 蓝图工作台 MVP 开发计划

> 状态：P3 实施完成，待产品验收（P0—P2 已完成）
> 面向对象：Coding Agent
> 产品与验收基线：[lightory-blueprint-mvp-spec.md](./lightory-blueprint-mvp-spec.md)
> 当前代码基线：Git commit `9a8a18e`

## 1. 约束

- 本文只拆解实施顺序，不修改产品定义；与 MVP 规范冲突时，以 MVP 规范为准。
- 先完成桌面浏览器纵向闭环，再接 Android ML Kit，最后做平板实机验收。
- “家庭寻宝”是首个任务数据，不得出现任务专属页面、组件或 `taskId` 条件分支。
- 当前 `design-lab/BlueprintWorkbench` 只作为视觉和交互参照，不在其中继续堆业务逻辑。
- 不复用 `OfficeCanvas`。现有沙盒界面保持独立；只复用机器人 Tool、计划校验、安全确认、事件和急停能力。
- 自动测试和教学故障使用确定性 Agent Provider；生产路径复用现有服务端 Agent 能力并要求结构化输出。训练故障不得下发真实小车。

## 2. 本轮交付目标

浏览器中使用鼠标完整走通以下闭环：

```text
定义目标 -> 绘制架构 -> 分配 Agent -> 确认任务复述
-> 验收草案 -> 确认交付连接 -> 布置试验场 -> 写下预期
-> 主动构建 -> 查看编译结果 -> 模拟运行
-> 首个差异点暂停 -> 孩子诊断并退回修改 -> 重新模拟成功
-> 生成孩子的工程足迹
```

同时加载“家庭寻宝”和最小“博物馆导览”测试任务，证明两者使用同一套组件和领域模型。

## 3. 代码边界

新增正式模块，逐步从视觉原型迁移：

```text
webview-ui/src/blueprint/
  domain/       领域类型、命令、Reducer、状态机和校验
  tasks/        TaskDefinition JSON、Schema 与 Loader
  canvas/       EngineeringCanvas、InkLayer、GraphLayer、坐标与手势
  agents/       Agent 定义、任务合同、Mock Agent 与交付控制器
  workflow/     AgentWorkflow、依赖分析、并行批次和增量构建
  compiler/     结构化交付、RobotPlan 编译和安全门槛
  test-field/   通用场景编辑、基础模拟和可观察结果
  simulation/   训练故障和 ReviewChallengeEngine
  debugging/    DebugWorkbench、复验和前后对比
  mentor/       MentorController 与逐级提示状态
  robot/        RobotRuntimeAdapter；本轮只定义边界，不执行真实硬件
  persistence/  BlueprintRepository 与浏览器实现
  components/   工作台外壳及通用 UI
  fixtures/     测试任务、Agent、Tool 和故障数据
```

领域对象不得依赖 React、React Flow、ML Kit 或具体渲染坐标格式。核心类型以 MVP 规范第 6.2 节为起点，只允许向后兼容地补充字段。

## 4. 固定技术方案

- React 19 + TypeScript + Vite，沿用现有工程。
- `@xyflow/react`：结构节点、边、嵌套、选择和视口。
- `perfect-freehand`：保留压力信息的原始笔迹渲染。
- Pointer Events：统一鼠标、触摸笔和触控输入。
- `WebGeometryInkRecognizer`：桌面端确定性识别矩形、椭圆、直线和箭头。
- 纯 TypeScript `blueprintReducer`：所有正式修改通过命令进入，支持撤销、重做和测试。
- `TaskDefinitionLoader`：只接受 JSON，校验 schemaVersion 及 Tool、Agent、测试和故障引用。
- `BlueprintRepository`：隔离持久化实现；浏览器 MVP 保存 `blueprint/v1`，重新载入不得丢失原始笔迹和工程记录。

## 5. 分阶段实施

### P0：领域模型与任务加载

实施状态：已完成。领域模型、任务 Loader、两个通用任务 fixture、浏览器 Repository、纯 Reducer、撤销/重做及 P0 单元测试已落地。

实现：

- MVP 规范第 6.2 节中的核心类型、序列化格式和运行时校验。
- `TaskDefinitionLoader`、Tool/Agent/Fault 引用完整性检查。
- `family-treasure-hunt.json` 和最小 `museum-guide.json`。
- `BlueprintDocument` 空文档工厂、版本检查和 Repository 接口。
- 领域命令：创建、重命名、移动、连接、包含、删除、撤销和重做。

门槛：

- 两个任务 fixture 均能加载为相同领域对象。
- 非法 schema、缺失 Tool/Agent/Fault 引用必须拒绝并返回可读错误。
- `blueprint/v1` 保存后重载深度等价，原始笔迹可追溯。

### P1：通用工程画布

实施状态：已完成。正式工作台入口、结构节点投影、Pointer Events 笔迹、浏览器几何识别、候选确认、关系选择、撤销/重做、任务隔离和刷新恢复已落地。

实现：

- `EngineeringCanvas`、缩放和平移、鼠标/笔输入路由。
- `InkLayer` 保存未确认笔迹；识别确认后移除源笔迹，拒绝识别则保留。
- `BlueprintGraphLayer` 渲染开始/结束流程控制、功能模块、子系统和两类连线；开始模块只有输出端，表示程序入口。
- `WebGeometryInkRecognizer`、候选确认/拒绝、置信度门槛和手动转换。
- 节点支持重新命名、改类型、缩放和橡皮删除；橡皮也可删除连线。
- 手绘直线与箭头均可确认成真实连线；识别菜单自动避让视口边缘。
- 子系统是通用分层画布：总图双击进入，在独立页面绘制其内部模块和笔迹。
- 节点命名支持键盘；语音和 Android 中文手写留接口。

门槛：

- 鼠标可完成规范第 4 节第 1—4 步。
- 低置信度结果不得修改正式蓝图；识别、编辑、擦除和清空均可撤销。
- 架构画布不读取任务 ID，不包含家庭寻宝专属组件。

### P2：Agent 分配、复述与验收

实施状态：已完成。基线为 P1 commit `18ef357`。

本阶段闭环：

```text
查看能力与短板 -> 分配到模块 -> 孩子编写任务合同
-> Agent 复述 -> 孩子确认 -> Mock Agent 提交草案
-> 孩子接受或带意见退回 -> Agent 提交新版本
```

产品权限：

- 孩子决定 Agent、目标、输入、输出、Tool 和验收标准。
- Agent 只读取自己的任务合同及显式引用；未确认不得工作，未验收不得写入正式蓝图。
- 退回必须填写修改意见；旧版本、意见和决定必须保留。
- Agent 卡片始终显示能力、已知短板和“需要总工程师复核”。
- 两个任务共用组件，不得出现 `taskId` 分支。

领域实现：

- 增加 `AgentTaskContract`、`AgentRestatement`、`AssignmentReview`。
- `AgentAssignment` 增加合同、复述和创建时间；文档增加评审记录。
- 旧 `blueprint/v1` 存档由迁移函数补字段，不升级 schemaVersion。
- 命令覆盖创建分配、更新合同、复述、确认、交付、接受、退回、重交和验收后继续修改。
- Reducer 拒绝越级状态、空合同、空退回意见、非法 Agent/Tool 和重复活动分配。

```text
draft -> awaiting-confirmation -> working -> awaiting-review
                                      ^          |       |
                                      |          v       v
                                      +------ returned  accepted
```

Mock Agent：

- `assignmentStateMachine.ts` 负责转换与前置校验。
- `mockAgentRuntime.ts` 根据 Agent 定义和合同确定性生成复述与交付。
- v1 根据 `knownLimitations` 包含一个可从合同审查出的疏漏，但不标答案；v2 根据退回意见修正。
- P2 不运行 `FaultScenario`；模拟证据与因果调试属于 P4。

通用前端：

- 底部 `AgentDock` 显示候选/入选工程师及像素角色；点击后在右侧显示能力、边界和已知短板。
- 支持拖放分配及“点 Agent 再点模块”的触控替代操作。
- `AssignmentDrawer` 由孩子填写目标、输入、输出、验收标准和 Tool，不自动代写。
- 复述区显示理解、交付和不确定项；孩子确认后才开始。
- 交付以紫色虚线草案光环显示；接受或带意见退回，多版本不覆盖。
- 已验收任务可由孩子主动重开；已验收交付和评审历史保持只读并继续保留。

实施顺序：

1. 领域类型、旧存档迁移、命令与状态机测试。
2. 确定性 Mock Agent、复述与多版本交付。
3. AgentDock 和拖放/点选分配。
4. 合同、复述确认、草案验收和版本历史。
5. 持久化、刷新恢复和双任务回归。

门槛：

- 未经孩子确认，Agent 不能工作；未经孩子验收，草案不能进入正式蓝图。
- Agent 只能读取任务合同和显式引用制品，不能自行改变总体目标、架构或分工。
- 退回意见不能为空；v2 递增且旧版本保留；删除节点能级联并可撤销。
- 浏览器走通“移动模块 -> 路线工程师 -> 合同 -> 复述 -> v1 -> 退回 -> v2 -> 接受 -> 刷新恢复”。
- lint、类型检查、前端全量测试、生产构建和浏览器回归通过。

### P3：可执行蓝图与通用试验场

实施状态：已完成并提交。P3 不再建设独立计划 DAG；工程总图连线同时提供触发关系和可选消息输入，系统从拓扑计算先后关系与并行批次。

构建链路：

```text
BlueprintDocument -> AgentWorkflow -> 结构化 AgentArtifact
-> 确定性编译 -> RobotPlan -> 双重安全校验 -> 通用试验场
```

实现：

- 领域模型已扩展 `AgentWorkflow`、`AgentArtifact`、`SceneDefinition`、`ExperimentExpectation` 和 `DebugSession` 占位；旧 `data` / `artifact` 连线迁移为 `message`，旧 `trigger` / `completion` 连线迁移为 `trigger`。旧成果节点仅兼容读取，不再作为新建概念暴露。
- 工程总图连线统一为 `触发信号` 或 `传递消息`：两者都会让下游自动等待并启动，只有 `传递消息` 会把上游已验收交付作为下游 Agent 可见输入。空触发条件和空消息必须拒绝。
- 开始/结束是独立流程控制，使用三角标识，不分配 Agent；开始无输入，结束无输出，结束默认安全停车。
- `AgentWorkflow` 从功能节点和连线拓扑生成批次、等待关系和脏节点；确认复述即派工，依赖满足后自动运行最早可执行批次，同批 Agent 可并行。
- `AgentRuntimeAdapter` 已定义，当前实现为 `DeterministicAgentRuntimeAdapter`。Agent 只接收角色、孩子确认的合同、Tool 白名单、输出 Schema 和 `message` 连线可见的上游制品；不得读取完整蓝图或直接生成 `RobotPlan`。
- `BlueprintCompiler` 将已验收 `movement-v1` / `speech-v1` 制品确定性编译为受限 `RobotPlan`，保留依赖关系，拆分长距离/大角度动作，每个底盘动作后强制 stop；缺动作、旧格式、未验收/已变脏制品和危险参数必须报错。
- “工程进度”是可选面板；“动作预览”由孩子主动触发，展示儿童动作摘要、等待关系、本地安全校验和可展开技术步骤。当前只生成模拟候选，不调用 Robot API。
- 试验场是独立页面，不与工程总图混层；P3 首个能力是 8×6 米平面移动模拟，支持小车起点、目标/地标、障碍物、区域/普通对象、拖动、尺寸/朝向/语义编辑、撤销重做、刷新恢复。
- 模拟器执行 `RobotPlan` 的前进、转向、停止和语音步骤，保留轨迹、语音、到达目标、边界/障碍碰撞证据；蓝图或场景变更后旧实验失效。并行批次只允许语音与一个底盘动作并行，多个底盘动作冲突时停止。
- 实验前至少保存一项可观察预期；运行时逐项展示预期与实际，首个可观察差异暂停，不播放后续成功步骤。AI 和模拟器不得改写孩子预期。

门槛：

- 家庭寻宝可完成“自由布置场景 -> 引用目标和障碍 -> 批准任务并派工 -> 验收工程师方案 -> 动作预览 -> 模拟 -> 逐项验收”。
- 缺少语音模块时小车能移动但不播报；顺序错误时行为顺序可观察；安全参数错误时路径明显偏离；危险参数无法进入运行时。
- 修改单个合同后只重建该节点及下游，未受影响的已验收制品版本保持不变。
- 同一工作台和试验场加载家庭寻宝与博物馆导览，不读取 `taskId`，不加载任务专属前端资源。
- lint、类型检查、单元测试、生产构建和浏览器回归通过。

### P4：小迷糊故障、诊断与复验

产品意图：小迷糊机制用于强化孩子“总工程师”代入感。孩子不是让一个 LLM 一次性完成项目，而是拆分任务、分配小 Agent、检查它们可能迷糊的交付，并通过证据定位问题。P4 先设计和实现“小 Agent 如何犯迷糊”的规则，不先做复杂调试界面。

实现：

- 每个小 Agent 都可以登记与自身职责和已知短板相关的候选错误；当前项目规则只激活一个错误，后续可交给大模型在候选中选择。
- 当前启用候选：路线工程师低速移动、路线工程师错误前进距离、语音工程师错误播报时机。错误必须进入 Agent 交付产物或 DSL，并能在试验场形成可观察结果；不要用独立提示卡编造证据。
- `ReviewChallengeEngine` 只负责从任务允许故障、当前已分配 Agent 和项目已有调试记录中筛选候选；已有一次调试记录后不得再激活第二个错误。
- 孩子运行前必须写下预期；实际结果在首个差异点暂停。
- `DebugWorkbench` 只显示输入、输出、事件、参数和传感证据，不标注答案。
- 孩子选择问题类别，补充任务合同或退回 Agent；Agent 复述修改后提交新版本。
- 复用 P3 增量构建，只重跑受影响节点及其下游；复验通过后记录错误前后对比。
- `ReviewChallengeEngine` 保证至少一次有效复核；当前规则先用确定性产物变体实现，后续 LLM 只能在可验证、可修复的 fault schema 内动态选择。

门槛：

- 没有预期、诊断、修复和复验记录时，项目不能完成。
- Agent 声称“已修好”不能代替复验。
- 未修复版本无法进入 `RobotRuntimeAdapter`。

### P5：AI 导师与工程足迹

实现：

- `MentorController` 根据当前门槛、失败次数和孩子已有证据，每次只产生一个问题。
- 提示状态遵循：开放问题 → 指向区域 → 两个方向 → 局部示例 → 必要时示范一步。
- 导师输出只能写入提示记录，不能写入 `BlueprintDocument` 的正式决定。
- 工程足迹记录孩子定义的目标、确认、退回、诊断、修复和复验。

门槛：

- 孩子未作答时提示不升级；安全风险可以直接阻止运行并解释。
- 完成页优先展示孩子的决策和修正，而非 Agent 生成数量。

### P6：整合、测试与原型迁移

实现：

- 将 `design-lab/BlueprintWorkbench` 的视觉语言迁移到正式工作台组件。
- 保留独立开发入口，待完整 E2E 通过后再决定主入口切换。
- 完成规范第 7.1 节的单元、组件、序列化、通用性和浏览器 E2E 测试。
- 在 E2E 中使用鼠标完成规范第 4 节的完整构建、模拟和调试流程。

门槛：

- `npm run lint`、类型检查、单元测试、构建和 E2E 全部通过。
- 家庭寻宝与博物馆导览使用相同页面和组件。
- 浏览器控制台无错误；1280×800 下无关键遮挡或裁切。

### P7：Android 与真实硬件边界

仅在 P0—P6 通过后开始：

- Android `recognizeInk` 桥和 ML Kit 中文/形状候选。
- 触控笔压力、防误触、双指缩放、暂停恢复和实机验收。
- 将孩子已验收、已编译并通过复核与安全校验的 `RobotPlan` 映射到现有 Robot API。
- 前期真实硬件只开放 `voice` 与 `basic-movement` 对应 Tool。

## 6. 现有工程复用策略

可复用：

- `webview-ui/src/robot/types.ts` 的 Tool、计划和事件类型。
- `robotPlanSchema.ts` 的本地安全校验。
- `mockRobotApi.ts`、`robotApiClient.ts`、`robotEventClient.ts`。
- `useRobotRuntime.ts` 的连接、确认、事件和急停语义。

不得直接复用：

- `OfficeCanvas` 的渲染、坐标或编辑状态。
- 现有角色调度流程作为孩子的 Agent 教育状态机。
- 让自然语言直接生成并执行机器人计划的入口。

正式接入时新增 `RobotRuntimeAdapter`，只接受由已验收 `AgentArtifact` 确定性编译、且已经复验和安全校验的 `RobotPlan`。Agent 输出和自然语言不得直接进入机器人执行接口。

## 7. Coding Agent 工作规则

- 每次只实施一个阶段；阶段门槛通过后再进入下一阶段。
- 每个 PR/提交必须列出对应的规范章节和自动测试。
- 领域层先写测试，再实现 UI；不得把业务状态只保存在组件局部 state。
- 不得删除或弱化孩子确认、验收、写预期、诊断和复验步骤。
- 不得自动修复 Agent 错误、直接高亮答案或用最终成功结果替代学习过程。
- 新任务数据不得包含 React 组件、CSS、坐标或页面跳转逻辑。
- 不得在训练故障仍存在时调用真实 Robot API。
- 遇到规范未定义且会改变角色权限、任务通用性或安全边界的问题，停止实现并先补充决策记录。

## 8. P3 第一批实施任务

1. [完成] 领域与迁移：`AgentWorkflow`、结构化 `AgentArtifact`、场景、实验预期、旧连线迁移和旧成果节点兼容读取。
2. [完成] 构建链路：拓扑批次、脏节点传播、自动派工、确定性 Agent Adapter、结构化输出边界。
3. [完成] 编译链路：`movement-v1` / `speech-v1` 到安全 `RobotPlan`，动作拆分、本地校验、儿童动作预览。
4. [完成] 试验场：平面移动场景编辑、模拟执行、轨迹/语音/碰撞证据、预期对照和首个差异暂停。
5. [完成] 交互收敛：`触发信号` / `传递消息` 连线、开始/结束流程控制、工程进度可选、验收证据可读。
6. [完成] 通用性验证：家庭寻宝与博物馆导览共用同一工作台、试验场、编译器和模拟器；前端不得出现任务 ID 分支。

P3 不接真实小车，不实现 STT/TTS，不注入 P4 教学故障，不新增灯光或音乐等尚未开放的 Tool。
