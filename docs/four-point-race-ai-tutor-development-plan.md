# Four-Point Race AI Tutor Development Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Console-first four-point race STEM tutor MVP, using real LLM agents and a real MentorPi robot.

**Architecture:** Pad/Web Console hosts the AI tutor session and sends high-level race plans. The robot-side `robot_api` exposes modular tools for localization, POI/race point persistence, lidar safety, and continuous lap execution. The robot executes `race.runLap` locally using AMCL pose, lidar checks, and a lightweight lookahead controller.

**Tech Stack:** TypeScript/React/Fastify/Codex role execution on the Pad/server side; ROS2 Humble, Python, `aiohttp`, Nav2 `map_server`/AMCL, LaserScan, TF, and `/controller/cmd_vel` on the robot side.

---

## 1. Implementation Constraints

- Keep [four-point-race-ai-tutor-mvp-requirements.md](./four-point-race-ai-tutor-mvp-requirements.md) as the product source of truth.
- Keep [pad-robot-api-control-requirements.md](./pad-robot-api-control-requirements.md) as low-level API reference only.
- Do not use mock robot execution as the MVP path.
- Do not modify robot packages outside `/home/ubuntu/ros2_ws/src/robot_api` for MVP implementation.
- Do not start full Nav2 `navigation.launch.py` for the race flow.
- Do not implement point-to-point stop-and-spin racing. The race lap must use continuous lookahead tracking so the robot can arc through turns.
- Console output shown to the child must remain child-facing. Raw prompts, raw API logs, stack traces, JSON plans, and expert internal notes must be hidden from the default Console.
- `robot_api` must be modularized before adding more tools; continuing to append all features to `server.py` is not acceptable.

## 2. Target Architecture

### 2.1 Robot Side

Create or refactor the robot package toward this structure:

```text
robot_api/
  server.py
  envelope.py
  registry.py
  validator.py
  executor.py
  ros_adapter.py
  schemas.py
  tools/
    base.py
    localization.py
    poi.py
    lidar.py
    race.py
  race/
    controller.py
    geometry.py
    session_store.py
    safety.py
    timing.py
```

Responsibilities:

- `server.py`: route registration and service assembly only.
- `registry.py`: aggregate tool definitions from modular tool providers.
- `validator.py`: validate `robot-plan/v1`, allowed tools, args, risk, and race constraints.
- `executor.py`: execute plan steps by dispatching to registered tool handlers.
- `ros_adapter.py`: own ROS publishers/subscribers/TF helpers shared by tools.
- `tools/localization.py`: expose AMCL/map localization tools.
- `tools/poi.py`: persist named race points and tracks.
- `tools/lidar.py`: expose child-safe lidar summaries and robot safety checks.
- `tools/race.py`: expose high-level race tools, especially `race.runLap`.
- `race/controller.py`: continuous lookahead controller for A-B-C-D-A lap execution.

### 2.2 Pad and Server Side

Add tutor-specific orchestration without overloading the existing one-shot command planner:

```text
server/src/robotTutor/
  tutorOrchestrator.ts
  expertMailbox.ts
  llmRoleRunner.ts
  schemas.ts
  skillPrompts.ts

webview-ui/src/robot/education/
  tutorRuntime.ts
  raceSession.ts
  consolePresenter.ts

webview-ui/src/robot/race/
  raceClient.ts
  racePlanBuilder.ts
  types.ts
```

Responsibilities:

- `tutorOrchestrator.ts`: main AI tutor state machine and expert mention routing.
- `expertMailbox.ts`: asynchronous expert calls with `public_reply` and `expert_note`.
- `llmRoleRunner.ts`: reuse Codex/Claude role execution patterns from `roleTaskRunner.ts`.
- `skillPrompts.ts`: AI tutor and expert agent skill prompts.
- `tutorRuntime.ts`: browser runtime for child-facing Console sessions.
- `consolePresenter.ts`: filter internal events into child-facing Console entries.
- `raceClient.ts`: typed client helpers for localization, POI, lidar, and race tools.
- `racePlanBuilder.ts`: build high-level race `robot-plan/v1` steps from confirmed session state.

## 3. Robot API Tools

### 3.1 Localization Tools

Add tool definitions and handlers:

- `localization.health`
  - Returns whether map server, AMCL, TF, scan, and base frames appear usable.
- `localization.setInitialPose`
  - Publishes `PoseWithCovarianceStamped` to `/initialpose`.
  - Input: `{ pose: { frame: "map", x: number, y: number, thetaRad: number }, covariancePreset: "confident" | "normal" }`.
- `localization.state`
  - Returns current robot pose in `map` frame, plus confidence/status when available.
- `localization.recordCurrentPose`
  - Records current `map` pose under a semantic name such as `A`, `B`, `C`, or `D`.

Implementation notes:

- Use `navigation/launch/include/localization.launch.py` as reference for `map_server + amcl`.
- Add a new launch file under `robot_api/launch/`, for example `race_localization.launch.py`, instead of editing existing navigation/slam/controller launch files.
- Do not use `driver/controller/init_pose` for AMCL initial pose; that node initializes servo/action posture, not AMCL pose.

### 3.2 POI and Track Tools

Add persistent storage for race points and named tracks:

- `poi.upsert`
- `poi.get`
- `poi.list`
- `poi.delete`
- `race.track.save`
- `race.track.get`
- `race.track.list`
- `race.track.clear`

Storage requirements:

- Store in a JSON file owned by `robot_api`, for example `/home/ubuntu/ros2_ws/src/robot_api/data/race_tracks.json`.
- Store pose frame explicitly. MVP race points must use `frame: "map"`.
- Persist A/B/C/D points, track name, map id/name, created/updated timestamps, and last lap results.
- Reject `race.runLap` if required points are missing, not in `map` frame, or fewer than four unique race points.

### 3.3 Lidar Tools

Add lidar capabilities without reusing the full `app.lidar_controller` node as a tool:

- `lidar.snapshot`
  - Returns front/left/right sector minimum distances from `/scan` or `/scan_raw`.
- `lidar.checkSafety`
  - Returns `ok`, nearest obstacle, sector, and threshold decision.

Implementation notes:

- Extract the sector/min-distance approach from `src/app/app/lidar_controller.py`.
- Do not let a separate lidar app publish `/controller/cmd_vel` during race execution.
- In MVP, lidar safety stops the race. It does not perform autonomous obstacle avoidance or rerouting.

### 3.4 Race Tools

Add high-level race tools:

- `race.status`
  - Returns active race, current track, current lap, controller status, and last result.
- `race.previewLap`
  - Returns child-readable route summary and estimated segment geometry.
- `race.runLap`
  - Executes one A-B-C-D-A lap locally on the robot.
- `race.stop`
  - Stops the active race and publishes repeated zero velocity.

`race.runLap` input:

```json
{
  "trackId": "default-abcd",
  "order": ["A", "B", "C", "D", "A"],
  "strategy": {
    "name": "baseline",
    "maxSpeedMps": 0.25,
    "minTurnSpeedMps": 0.08,
    "lookaheadMeters": 0.35,
    "waypointRadiusMeters": 0.18,
    "finishRadiusMeters": 0.22
  },
  "safety": {
    "frontStopDistanceMeters": 0.35,
    "maxDurationMs": 120000
  }
}
```

`race.runLap` output:

```json
{
  "trackId": "default-abcd",
  "status": "done",
  "elapsedMs": 0,
  "segments": [
    { "from": "A", "to": "B", "elapsedMs": 0 }
  ],
  "stopReason": "finished",
  "safetyEvents": []
}
```

## 4. Continuous Race Controller

Implement a lightweight lookahead controller, not a full Nav2 replacement.

Controller behavior:

- Subscribe/read current robot pose in `map` frame.
- Treat A-B-C-D-A as a closed polyline.
- Pick a lookahead target ahead of the robot on the current segment or next segment.
- Switch attention before reaching the exact waypoint when within `waypointRadiusMeters`.
- Compute heading error to the lookahead target.
- Publish `/controller/cmd_vel` at a fixed control period.
- Reduce linear speed when heading error or local curvature increases.
- Stop immediately when lidar safety fails, localization is stale, timeout expires, or stop is requested.
- Mark the lap complete when the robot returns to A within `finishRadiusMeters` after visiting B/C/D in order.

Teaching alignment:

- The controller should support child-readable explanations: "小车会提前看向下一个点", "弯道会慢一点", "前方太近所以安全工程师叫停".

## 5. AI Tutor and Expert Agent Development

### 5.1 Provider Reuse

Reuse the existing role execution mechanism:

- `server/src/roleTaskRunner.ts` already supports Codex one-shot role tasks via `codex exec`.
- Use `taskOverride.markdown` style dynamic role instructions for MVP expert skills.
- Do not reuse `server/src/robotIntentPlanner.ts` as the tutor orchestrator. It is a one-shot command-to-intent planner.

### 5.2 Tutor Orchestrator

Add a new long-lived race tutor session:

- Tracks child goal, recorded points, confirmed strategy, expert notes, race status, and review state.
- Decides when to ask a diagnostic question.
- Decides when to call an expert agent.
- Maintains child-facing conversation history.
- Produces only child-facing Console messages by default.

Tutor turn output schema:

```ts
interface TutorTurnOutput {
  publicReply: string;
  mentions: Array<{
    expertId: RaceExpertId;
    question: string;
    context: Record<string, unknown>;
  }>;
  raceDraftPatch?: Record<string, unknown>;
  suggestedRobotAction?: 'none' | 'record_point' | 'preview_lap' | 'run_lap';
}
```

### 5.3 Expert Mailbox

Experts run asynchronously and return:

```ts
interface ExpertResponse {
  expertId: RaceExpertId;
  publicReply: string;
  expertNote: Record<string, unknown>;
}
```

MVP experts:

- `localization_engineer`
- `route_engineer`
- `motion_control_engineer`
- `radar_safety_engineer`
- `timing_judge`
- `optimization_coach`

Each expert prompt must define:

- Personality.
- Professional boundary.
- What it may explain to the child.
- What it may recommend structurally.
- What it must not decide without tutor/child confirmation.

## 6. Child-Facing Console Flow

The MVP Console flow:

1. Child says: `我今天想要完成 4 点竞速赛`.
2. Tutor asks a diagnostic question about how the robot can know A/B/C/D.
3. Tutor guides the child to use remote control to move the robot.
4. Child says `记录 A 点`, `记录 B 点`, `记录 C 点`, `记录 D 点`.
5. Localization expert may explain observed map pose changes.
6. Tutor asks for a baseline race strategy.
7. Route/motion/safety experts contribute short child-facing replies.
8. Pad builds a high-level `race.runLap` robot plan.
9. Robot validates and executes the race.
10. Console shows child-readable progress, timing, safety stops, and result.
11. Tutor asks the child to choose one improvement variable for the next attempt.

Default Console must show:

- Child message.
- Tutor reply.
- Mentioned expert `publicReply`.
- Race draft summary.
- Execution status summary.
- Race result summary.

Default Console must hide:

- Raw prompt.
- Raw Codex stderr.
- Raw API envelope.
- Full JSON plan unless a developer view is explicitly opened.

## 7. Phased Implementation

### P0: Plan and Safety Baseline

- [x] Confirm the robot can run current `robot_api` health/tools from Pad with `mode: real` and base URL `http://192.168.1.6:8088`.
- [ ] Add a developer-only connection checklist to the plan notes if real robot endpoint is unavailable.
- [x] Confirm emergency stop from Pad still calls `stopPlan` and `stopAll`.

Exit criteria:

- Existing "前进 2m" path still works before race changes begin.

### P1: Robot API Modularization

Files:

- Modify robot-side `/home/ubuntu/ros2_ws/src/robot_api/robot_api/server.py`.
- Create robot-side modules listed in section 2.1.

Steps:

- [x] Move envelope creation and failure helpers from `server.py` to `envelope.py`.
- [x] Move tool definitions to `registry.py` and make `GET /api/tools` read the registry.
- [x] Move plan validation to `validator.py`.
- [x] Move plan execution dispatch to `executor.py`.
- [x] Move ROS publishers/subscribers and current base methods to `ros_adapter.py` and `tools/base.py`.
- [x] Keep existing endpoint behavior unchanged.
- [ ] Verify `GET /api/health`, `GET /api/tools`, `base.driveDistance`, `base.rotateAngle`, and `base.velocityProfile` still work.

Progress note, 2026-07-18:

- Deployed P1 modularized `robot_api` to the real MentorPi container.
- Backed up the original monolithic `server.py` on the robot at `/home/ubuntu/ros2_ws/src/robot_api/robot_api.pre_p1_original_backup/server.py`.
- Verified on the real robot: `GET /api/health`, `GET /api/tools`, plan validation, plan submit, `base.state` execution, and `/api/watchdog/stop-all`.
- Physical motion regression for `base.driveDistance`, `base.rotateAngle`, and `base.velocityProfile` still needs an operator-confirmed safe test area.

Exit criteria:

- No race features yet.
- Current one-shot movement commands continue to validate and execute.

### P2: Localization and POI Tools

Files:

- Create robot-side `tools/localization.py`.
- Create robot-side `tools/poi.py`.
- Create robot-side `data/race_tracks.json`.
- Create robot-side `launch/race_localization.launch.py`.

Steps:

- [x] Add localization tool definitions and handlers.
- [x] Add `/initialpose` publisher support using `PoseWithCovarianceStamped`.
- [x] Add TF lookup for current `map -> base_footprint` pose.
- [x] Add persistent POI/track JSON store.
- [x] Add point recording for A/B/C/D from current `map` pose.
- [x] Add validation that race points must be in `map` frame.
- [ ] Add child-readable errors for AMCL unavailable, TF unavailable, and missing map.

Progress note, 2026-07-18:

- Implemented P2 locally in the modular robot API snapshot.
- Added `localization.health`, `localization.setInitialPose`, `localization.state`, and `localization.recordCurrentPose`.
- Added persistent `poi.*` and `race.track.*` tools backed by `/home/ubuntu/ros2_ws/src/robot_api/data/race_tracks.json`.
- Added `robot_api/launch/race_localization.launch.py` as a lightweight AMCL/map launch entry that references navigation localization include instead of full Nav2.
- Local ROS-free tests pass for tool registry, validator, POI persistence, and localization-to-POI dispatch.
- Deployed P2 to the real MentorPi container and rebuilt `robot_api` so the new launch file is installed in the ROS2 package share.
- Fixed `race_localization.launch.py` to start `nav2_container` and use the full default map path `/home/ubuntu/ros2_ws/src/slam/maps/map_01.yaml`.
- Verified on the real robot: `GET /api/health`, `GET /api/tools`, `poi.upsert`, `poi.get`, `race.track.clear`, `localization.health`, `localization.state`, and `localization.recordCurrentPose`.
- Started lightweight localization on the real robot. `/map`, `/amcl_pose`, and `/initialpose` are present, and `localization.health` reports `hasMapPose: true`.

Exit criteria:

- Child can remote-control the robot and record A/B/C/D through Console commands.
- Recorded points persist after `robot_api` restart.

### P3: Lidar Safety Tools

Files:

- Create robot-side `tools/lidar.py`.
- Create robot-side `race/safety.py`.

Steps:

- [x] Subscribe to `/scan` or `/scan_raw` with best-effort QoS.
- [x] Compute front/left/right sector minimum distances.
- [x] Expose `lidar.snapshot`.
- [x] Expose `lidar.checkSafety`.
- [x] Integrate a reusable race safety check that returns stop decisions without publishing velocity itself.

Progress note, 2026-07-18:

- Implemented `tools/lidar.py` and `race/safety.py`.
- `RobotRosAdapter` now stores the latest `/scan` frame with sensor-data QoS and computes child-safe front/left/right sector summaries.
- `lidar.checkSafety` uses a front stop threshold and returns `ok`, nearest obstacle, sector, threshold, and stop reason without publishing velocity.
- The existing `app.lidar_controller` was used only as a reference; it was not started or reused as a tool, so it does not compete for `/controller/cmd_vel`.
- Verified on the real robot: `lidar.snapshot` returned front/right/left sector minimums and `lidar.checkSafety` returned `ok: true` at `frontStopDistanceMeters: 0.35` with the current front distance around `0.631m`.

Exit criteria:

- Robot API can report child-readable front obstacle distance.
- Race safety can stop motion when front distance is below threshold.

### P4: Race Controller and Race Tools

Files:

- Create robot-side `race/geometry.py`.
- Create robot-side `race/controller.py`.
- Create robot-side `race/timing.py`.
- Create robot-side `tools/race.py`.

Steps:

- [x] Implement waypoint geometry helpers for distance, heading, projection, and lookahead target.
- [x] Implement continuous control loop for `race.runLap`.
- [x] Implement waypoint visit tracking B/C/D/A.
- [x] Implement speed reduction for turns.
- [x] Integrate lidar stop and emergency stop.
- [x] Return lap timing, segment timing, stop reason, and safety events.
- [x] Add `race.previewLap`, `race.status`, `race.runLap`, and `race.stop` to the registry.

Progress note, 2026-07-18:

- Implemented `race/geometry.py`, `race/controller.py`, `race/timing.py`, and `tools/race.py`.
- `race.previewLap` reads saved `map` frame A/B/C/D points and returns route segment distances/headings plus a child-facing summary.
- `race.runLap` is deployed and uses AMCL map pose, lookahead target selection, turn-speed reduction, lidar front-stop safety, timeout, and repeated zero-velocity stop on exit.
- Verified on the real robot without motion: `race.status`, `race.previewLap`, temporary track setup, and cleanup.
- `race.previewLap` returned an A-B-C-D-A closed route with total distance `4.0m` for the temporary square track.
- Physical `race.runLap` execution is intentionally not verified yet; it requires operator-confirmed A/B/C/D points and a safe race area.

Exit criteria:

- Robot can run one A-B-C-D-A lap from stored map points without stopping at each waypoint.
- Race result returns elapsed time and stop reason.

### P5: Pad Race Types and Client

Files:

- Create `webview-ui/src/robot/race/types.ts`.
- Create `webview-ui/src/robot/race/raceClient.ts`.
- Create `webview-ui/src/robot/race/racePlanBuilder.ts`.
- Modify existing robot runtime only at integration seams.

Steps:

- [x] Add TypeScript types for race points, track, strategy, preview, and result.
- [x] Add typed client methods for localization, POI, lidar, and race tools.
- [x] Add `buildRaceRunLapPlan` that emits high-level `race.runLap` steps.
- [x] Ensure high-risk `race.runLap` requires user confirmation.
- [x] Keep existing base movement intent path working.

Progress note, 2026-07-18:

- Added Pad-side race types, typed race client helpers, and high-level race plan builders under `webview-ui/src/robot/race/`.
- Extended the Pad mock tool registry with localization, POI, lidar/safety, and race tools so local plan validation can reflect the real robot API surface.
- Updated local plan validation to treat `race.stop` as an allowed stop tool, while preserving the existing base movement intent path.
- Verified `buildRaceRunLapPlan` emits a high-risk, user-confirmed `race.runLap` plan with `base` lease, obstacle stop safety, speed cap, and `race.stop` fallback.
- This phase does not physically execute `race.runLap`; real motion remains gated on operator-confirmed A/B/C/D points and a safe test area.

Exit criteria:

- Pad can build and validate a high-level race plan against robot tool registry.

### P6: Tutor Orchestrator and Expert Mailbox

Files:

- Create `server/src/robotTutor/schemas.ts`.
- Create `server/src/robotTutor/skillPrompts.ts`.
- Create `server/src/robotTutor/llmRoleRunner.ts`.
- Create `server/src/robotTutor/expertMailbox.ts`.
- Create `server/src/robotTutor/tutorOrchestrator.ts`.
- Modify `server/src/clientMessageHandler.ts` to route race tutor messages.

Steps:

- [x] Define race tutor session schema.
- [x] Define tutor output and expert output schemas.
- [x] Implement Codex-backed `llmRoleRunner` using the same command-building strategy as `roleTaskRunner.ts`.
- [x] Implement expert mailbox calls using dynamic skill prompts.
- [x] Implement tutor orchestration for goal, point recording, baseline strategy, run, and review states.
- [x] Add server websocket message types for tutor input and tutor output.

Progress note, 2026-07-18:

- Added `server/src/robotTutor/` with schemas, skill prompts, LLM role runner, expert mailbox, and race tutor orchestrator.
- CLI now wires the real provider-backed tutor runner through `createLlmRoleRunner`, reusing `buildRoleTaskCommand` from `roleTaskRunner.ts`.
- Added `raceTutorInput` / `raceTutorOutput` websocket message handling. Default output includes only child-facing tutor reply, expert public replies, suggested robot action, and draft patch.
- Expert `expertNote` is retained inside the tutor session result/state, but is not sent directly in the child-facing websocket output.
- Automated tests use a deterministic/fake runner; they do not call the real LLM in CI.

Exit criteria:

- Real LLM tutor can ask child-facing questions.
- Tutor can mention at least one expert and display expert `publicReply`.
- Internal `expertNote` is retained but not shown directly.

### P7: Console Integration

Files:

- Create `webview-ui/src/robot/education/tutorRuntime.ts`.
- Create `webview-ui/src/robot/education/raceSession.ts`.
- Create `webview-ui/src/robot/education/consolePresenter.ts`.
- Modify the existing Console integration to hand race tutor messages to the new runtime.

Steps:

- [x] Detect four-point race session intent in Console.
- [x] Send child messages to the tutor orchestrator instead of one-shot robot intent planner while race session is active.
- [x] Present tutor replies and expert public replies as child-facing Console entries.
- [x] Present race draft summaries after A/B/C/D are recorded.
- [x] Present child-readable execution and result summaries.
- [x] Keep developer/API logs out of default child Console.

Progress note, 2026-07-18:

- Added `webview-ui/src/robot/education/` with race session detection, tutor runtime, and child-facing console presenter.
- Console now detects four-point race/ABCD timed-race intent and routes the active race session to `raceTutorInput` instead of the one-shot robot intent planner.
- Tutor `publicReply` and expert `publicReply` are shown as normal Console entries; `expertNotes`, raw draft JSON, and debug/internal fields are not rendered.
- Race draft/result presenter can summarize next point, recorded points, elapsed time, and stop reason into child-readable Chinese.
- Browser dev mock now returns a deterministic tutor/expert response for local Console smoke testing without calling the model.

Exit criteria:

- Child can complete the MVP conversation path in Console without seeing raw JSON/debug logs.

### P8: End-to-End Robot Trial

Steps:

- [x] Start real robot API and lightweight localization.
- [x] Set initial AMCL pose through the localization tool.
- [x] Remote-control the robot to A/B/C/D and record points.
- [x] Preview the lap.
- [x] Confirm and run conservative baseline lap.
- [x] Verify race can be stopped from Pad.
- [x] Verify lidar stop behavior with a controlled obstacle.
- [ ] Run tutor review after lap result.

Airborne progress note, 2026-07-18:

- Robot was physically lifted, so wheel motion was safe but odom/AMCL could not validate real displacement.
- Verified `robot_api` health and tool registry on `http://192.168.1.6:8088`.
- Verified registered tools include base movement, localization, POI/track, lidar safety, and race tools.
- Executed `base.velocityProfile` at `0.08m/s` for `1000ms`; wheels turned, plan completed, and `base.stop` completed.
- Verified localization/lidar/race status read path:
  - `localization.health` reported scan, map, TF, odom pose, and map pose available.
  - `lidar.snapshot` returned fresh sector distances; front minimum was about `0.636m` during the check.
  - `race.status` reported controller inactive before race test.
- Created temporary track `p8-air-abcd`, previewed A-B-C-D-A successfully, and received child-readable route summary.
- Executed short airborne `race.runLap` with `maxSpeedMps: 0.08` and `maxDurationMs: 3000`; wheels ran and stopped with `stopReason: "timeout"` after about `3050ms`, as expected because pose did not move while lifted.
- Verified `race.stop` executed after the run and controller became inactive.
- Found and fixed a robot-side validator mismatch: `race.stop` is a safety stop tool and must validate without user confirmation, matching the Pad race plan builder.
- Added local snapshot coverage for `race.stop` validation; `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python3 -m pytest .robot_api_remote_snapshot/tests/test_modular_snapshot.py -q` passed with `17 passed`.
- Deployed the validator fix to the real robot container and verified `race.stop` validation returns `ok: true` without `requiresUserConfirmation`.
- Executed standalone `race.stop`; plan completed and reported controller `active: false`, `state: "idle"`.
- Verified `lidar.checkSafety` through real plan execution:
  - `frontStopDistanceMeters: 0.35` returned `ok: true`.
  - `frontStopDistanceMeters: 1.0` returned `ok: false`, sector `front`, stop reason `front_obstacle_too_close`.
- Cleared temporary track `p8-air-abcd` after the test.
- Remaining P8 validation requires ground contact: real map, AMCL initial pose, remote-control A/B/C/D recording, real preview, real timed lap, controlled lidar stop, and tutor review.

Ground progress note, 2026-07-18:

- Drew and loaded the real `map_01` map.
- Set AMCL initial pose from RViz, then verified `localization.health` reported fresh scan, odom pose, map pose, TF, `/map`, `/scan`, and `/scan_raw`.
- Recorded A/B/C/D through `localization.recordCurrentPose` into `default-abcd`:
  - A `(0.048, 0.004)`
  - B `(1.377, -0.046)`
  - C `(1.270, -0.251)`
  - D `(0.533, -0.574)`
- Saved `default-abcd` and previewed `A-B-C-D-A`; route length was about `3.1195m`.
- Ran a low-speed `race.runLap` at `0.08m/s` with an `8000ms` cap; it timed out and stopped as expected.
- Ran a conservative ground lap attempt at `0.12m/s`; the controller ran for about `25.454s` and stopped safely with `stopReason: "front_obstacle_too_close"` when the front distance reached about `0.344m` against a `0.35m` threshold.
- Verified `race.stop` completed after the run and `/controller/cmd_vel` had no residual velocity output.

Bringup progress note, 2026-07-19:

- Added `robot_api/launch/race_bringup.launch.py` as the MVP one-command startup path.
- The bringup starts controller, lidar, AMCL/map localization, init pose, and `robot_api`.
- The bringup deliberately does not start Nav2 planner/controller, joystick/teleop control, or depth camera.
- Verified on the real robot from a clean ROS graph:
  - `ros2 launch robot_api race_bringup.launch.py map:=/home/ubuntu/ros2_ws/src/slam/maps/map_01.yaml`
  - `GET /api/health` returned ok.
  - Node graph included `robot_api`, `map_server`, `amcl`, `LD19`, `scan_to_scan_filter_chain`, `odom_publisher`, `ekf_filter_node`, and controller nodes.
  - Node graph did not include `aurora`, `joystick_control`, `teleop_control`, `planner_server`, `controller_server`, or `bt_navigator`.
  - `/controller/cmd_vel` had only `robot_api` as publisher, and a 2-second idle sample produced no velocity messages.
  - API-level `localization.health`, `lidar.checkSafety`, and `race.status` all passed.
- Local snapshot verification: `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest .robot_api_remote_snapshot/tests/test_modular_snapshot.py -q` passed with `18 passed`.

Exit criteria:

- The real robot completes one safe timed lap or safely stops with a child-readable reason.
- Tutor asks the child to choose one improvement variable for the next attempt.

## 8. Test Plan

Robot-side tests:

- Unit test waypoint geometry helpers.
- Unit test lookahead target selection around corners.
- Unit test speed reduction when heading error increases.
- Unit test race track persistence read/write.
- Unit test lidar sector minimum calculation with invalid, zero, `NaN`, and finite ranges.
- Validator test: reject `race.runLap` when points are missing or not `map` frame.

Pad/server tests:

- Unit test tutor output schema parsing.
- Unit test expert mailbox response parsing.
- Unit test Console presenter hides raw prompts, raw JSON, and raw API errors.
- Unit test `buildRaceRunLapPlan` requires confirmation.
- Integration test race tutor flow with deterministic provider fixture for CI.

Manual real-robot tests:

- Health/tools endpoint.
- Set initial pose.
- Record A/B/C/D.
- Preview lap.
- Run baseline lap.
- Emergency stop.
- Lidar stop.
- Tutor review.

## 9. Rollout Order

Recommended order:

1. Robot `robot_api` modularization.
2. Localization and POI persistence.
3. Lidar safety snapshot.
4. Continuous race controller.
5. Pad race client and high-level plan builder.
6. Tutor orchestrator and expert mailbox.
7. Console integration.
8. Real robot trial and tuning.

Do not start large UI visualization work until the Console-first tutor/race loop is working on the real robot.

## 10. Defaults Chosen for MVP

Use these defaults unless real-robot validation proves one unsafe or unusable:

- Localization launch: add `robot_api/launch/race_localization.launch.py` that starts `map_server`, `amcl`, and lifecycle manager based on `navigation/launch/include/localization.launch.py`.
- Localization lifecycle: MVP may start `race_localization.launch.py` manually during bringup; `robot_api` tools must report clear errors if AMCL/map/TF are unavailable.
- Initial pose: `localization.setInitialPose` publishes `/initialpose` with `frame_id: "map"` and covariance preset `normal`.
- Default map: use `map_01` unless operator selects another map before launch.
- Persistent race data: store under `/home/ubuntu/ros2_ws/src/robot_api/data/race_tracks.json` for MVP.
- Default race strategy: `maxSpeedMps: 0.25`, `minTurnSpeedMps: 0.08`, `lookaheadMeters: 0.35`, `waypointRadiusMeters: 0.18`, `finishRadiusMeters: 0.22`, `frontStopDistanceMeters: 0.35`, `maxDurationMs: 120000`.
- Controller period: start with 10 Hz, matching the current `robot_api` command period style.
- Race stop behavior: publish repeated zero velocity and emit a child-readable stop reason.
