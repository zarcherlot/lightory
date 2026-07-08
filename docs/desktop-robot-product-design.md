# Desktop Robot MVP Product Design

## Hardware Assumption

The robot is a wheeled desktop or home robot with a mobile base, one manipulator arm, a vision sensor, speaker, microphone, LED output, and persistent local memory.

## Atomic Roles

Roles are long-lived responsibilities with state, handoff contracts, and conversation ownership.

| Role         | Responsibility                                                                                               | Owns State                  | Output Card |
| ------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------- | ----------- |
| 交互入口员   | Accept user console/mic input and classify it as intent, confirmation, or environment declaration.           | Current dialog turn         | 用户意图卡  |
| 家庭记忆员   | Persist household POI, room aliases, no-go zones, object locations, and user declarations like "这里是主卧". | Map, POI, object memory     | 地图记忆卡  |
| 视觉观察员   | Convert camera input into object, person, route, and risk facts.                                             | Last visual frame summary   | 视觉事实卡  |
| 听觉监听员   | Convert microphone input into speech or sound facts, including interruption and confirmation.                | Last audio event            | 听觉事实卡  |
| 任务规划员   | Break user intent into observe, navigate, move, manipulate, and feedback steps.                              | Current task plan           | 任务计划卡  |
| 确认追问员   | Ask one concrete question when required information or safety consent is missing.                            | Pending confirmation        | 确认请求卡  |
| 安全监督员   | Gate movement and arm actions; request confirmation or stop unsafe plans.                                    | Safety policy context       | 安全许可卡  |
| 领航员       | Read map memory and visual facts, then produce a route for the wheeled base.                                 | Current route hypothesis    | 路线卡      |
| 底盘驾驶员   | Execute route segments as base commands and report progress/failure.                                         | Base execution state        | 移动结果卡  |
| 机械臂操作员 | Execute grasp/place/push/hand-over steps and report progress/failure.                                        | Manipulator execution state | 操作结果卡  |
| 语音播报员   | Turn confirmations, warnings, and results into short speaker text.                                           | Last spoken response        | 语音输出卡  |
| LED 表情员   | Encode idle, listening, thinking, moving, blocked, and error states as LED patterns.                         | Current LED mode            | LED 状态卡  |
| 状态诊断员   | Summarize battery, network, sensors, base, arm, and runtime health.                                          | Health snapshot             | 诊断卡      |

## Skills

Skills are replaceable algorithms or hardware adapters used by roles. They should not be top-level roles unless they need independent memory, dialog ownership, or handoffs.

| Skill                                                          | Used By            |
| -------------------------------------------------------------- | ------------------ |
| A*, D*, RRT, frontier exploration, local obstacle avoidance    | 领航员             |
| SLAM map import/export, POI lookup, semantic room matching     | 家庭记忆员, 领航员 |
| Object detection, depth estimation, pose estimation, OCR       | 视觉观察员         |
| Wake word, ASR, VAD, speaker diarization, sound classification | 听觉监听员         |
| TTS, barge-in handling, volume control                         | 语音播报员         |
| Arm inverse kinematics, grasp planning, force thresholding     | 机械臂操作员       |
| Motor control, velocity profiling, docking                     | 底盘驾驶员         |
| LED pattern library                                            | LED 表情员         |
| Safety policy checks, collision envelope checks                | 安全监督员         |
| Local memory persistence and retrieval                         | 家庭记忆员         |

## MVP Scope

1. Console accepts user input.
2. Console classifies input into environment declaration, confirmation reply, or user intent.
3. Default role dock shows robot roles and robot cards.
4. Users can wire robot role cards into a simple workflow.
5. Role markdown tasks run through the existing task runner.
6. Household POI examples are represented in prompts before a real persistent memory adapter is connected.

## Deferred

- Real hardware command execution.
- Persistent memory CRUD APIs.
- Map file schema and POI editor.
- Streaming microphone/camera inputs.
- Safety policy engine.
- Real LED, TTS, base, and arm adapters.
