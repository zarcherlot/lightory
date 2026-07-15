# Lightory 蓝图工作台 MVP 开发计划

> 状态：实施中（P0、P1、P2 已完成，下一阶段 P3 待核对）
> 面向对象：Coding Agent
> 产品与验收基线：[lightory-blueprint-mvp-spec.md](./lightory-blueprint-mvp-spec.md)
> 当前视觉原型基线：Git commit `1e0e14e`

## 1. 约束

- 本文只拆解实施顺序，不修改产品定义；与 MVP 规范冲突时，以 MVP 规范为准。
- 先完成桌面浏览器纵向闭环，再接 Android ML Kit，最后做平板实机验收。
- “家庭寻宝”是首个任务数据，不得出现任务专属页面、组件或 `taskId` 条件分支。
- 当前 `design-lab/BlueprintWorkbench` 只作为视觉和交互参照，不在其中继续堆业务逻辑。
- 不复用 `OfficeCanvas`。现有沙盒界面保持独立；只复用机器人 Tool、计划校验、安全确认、事件和急停能力。
- MVP 使用确定性 Mock Agent 与模拟器，不接真实大模型，不向真实小车下发训练故障。

## 2. 本轮交付目标

浏览器中使用鼠标完整走通以下闭环：

```text
定义目标 -> 绘制架构 -> 分配 Agent -> 确认任务复述
-> 验收草案 -> 制定计划与检查点 -> 写下预期 -> 模拟运行
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
  planning/     PlanView、依赖和检查点
  simulation/   SimulationRuntime、故障场景和 ReviewChallengeEngine
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
- `BlueprintGraphLayer` 渲染开始模块、功能模块、成果、子系统和两类连线；开始模块只有输出端，表示程序入口。
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

### P3：计划视图

实现：

- 架构视图与计划视图共享节点 ID，但分别保存架构关系和执行依赖。
- 步骤排序、并行依赖、检查点及循环依赖检测。
- 运行前门槛：目标、Agent 验收、执行顺序、检查点和孩子预期均已确认。

门槛：

- 可设置“移动先于语音”并添加检查点。
- 改变计划不得改写架构边；改变架构边不得自动生成计划。

### P4：模拟、错误复核与调试

实现：

- 确定性 `SimulationRuntime`，按计划点亮节点并沿连线传递事件。
- 家庭寻宝固定首个训练故障：路线工程师提交错误转向角度，类型为 `wrong-parameter`。
- 孩子运行前必须写下预期；实际结果在首个差异点暂停。
- `DebugWorkbench` 只显示输入、输出、事件、参数和传感证据，不标注答案。
- 孩子选择问题类别，补充任务合同或退回 Agent；Agent 复述修改后提交新版本。
- 只重跑受影响路径，复验通过后记录错误前后对比。
- `ReviewChallengeEngine` 保证至少一次有效复核，且只向模拟器注入训练故障。

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
- 在 E2E 中使用鼠标完成规范第 4 节全部 12 步。

门槛：

- `npm run lint`、类型检查、单元测试、构建和 E2E 全部通过。
- 家庭寻宝与博物馆导览使用相同页面和组件。
- 浏览器控制台无错误；1280×800 下无关键遮挡或裁切。

### P7：Android 与真实硬件边界

仅在 P0—P6 通过后开始：

- Android `recognizeInk` 桥和 ML Kit 中文/形状候选。
- 触控笔压力、防误触、双指缩放、暂停恢复和实机验收。
- 将已通过复核和安全校验的计划映射到现有 Robot API。
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

正式接入时新增 `RobotRuntimeAdapter`，只接受由 `BlueprintDocument.planSteps` 编译、且已经验收、复验和安全校验的 `RobotPlan` 候选。

## 7. Coding Agent 工作规则

- 每次只实施一个阶段；阶段门槛通过后再进入下一阶段。
- 每个 PR/提交必须列出对应的规范章节和自动测试。
- 领域层先写测试，再实现 UI；不得把业务状态只保存在组件局部 state。
- 不得删除或弱化孩子确认、验收、写预期、诊断和复验步骤。
- 不得自动修复 Agent 错误、直接高亮答案或用最终成功结果替代学习过程。
- 新任务数据不得包含 React 组件、CSS、坐标或页面跳转逻辑。
- 不得在训练故障仍存在时调用真实 Robot API。
- 遇到规范未定义且会改变角色权限、任务通用性或安全边界的问题，停止实现并先补充决策记录。

## 8. 第一批实施任务

下一次编码从 P0 开始，限定为：

1. 建立 `src/blueprint/domain`、`tasks`、`fixtures` 和 `persistence`。
2. 落地核心 TypeScript 类型与 `blueprint/v1` 空文档工厂。
3. 实现 `lightory-task/v1` Loader 和引用校验。
4. 添加家庭寻宝与博物馆导览两个 fixture。
5. 实现纯 Reducer 的节点/边命令、撤销和重做。
6. 添加任务通用性、非法引用和序列化单元测试。

P0 不修改当前视觉原型，不接画布库，不接 Agent，不接真实小车。
