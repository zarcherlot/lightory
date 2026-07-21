import { describe, expect, it } from 'vitest';

import { AgentStateStore } from '../src/agentStateStore.js';
import { handleClientMessage } from '../src/clientMessageHandler.js';
import type { LlmRoleRunner } from '../src/llmRoleExecutor.js';
import {
  createTeachingStudentModel,
  parseTeachingTurnOutput,
} from '../src/teaching/schemas.js';
import { createTeachingRuntime } from '../src/teaching/teachingRuntime.js';
import { buildTeachingSkillPrompt } from '../src/teaching/teachingSkill.js';
import {
  buildRaceConversationRoutePrompt,
  createRaceConversationRouter,
} from '../src/teachingScenes/fourPointRace/conversationRouter.js';
import { createExpertMailbox } from '../src/teachingScenes/fourPointRace/expertMailbox.js';
import { createRaceSceneAdapter } from '../src/teachingScenes/fourPointRace/raceSceneAdapter.js';
import { createFourPointRaceTeachingOrchestrator } from '../src/teachingScenes/fourPointRace/sceneOrchestrator.js';
import { parseExpertOutput } from '../src/teachingScenes/fourPointRace/schemas.js';
import { buildExpertPrompt } from '../src/teachingScenes/fourPointRace/skillPrompts.js';

describe('generic teaching skill', () => {
  it('requires a teaching turn to include knowledge, diagnosis, move, reply, and a child question', () => {
    const output = parseTeachingTurnOutput({
      childFacingReply: '速度快不一定总时间短。你觉得如果转弯时多修正两次，总时间会变短还是变长？',
      knowledgePoint: {
        domain: 'physics',
        concept: '速度、路径和稳定性共同影响总时间',
      },
      learnerDiagnosis: {
        observedNeed: '把瞬时速度误认为总成绩',
        confidence: 0.7,
      },
      teachingMove: {
        kind: 'brief_explanation_then_question',
        purpose: 'connect speed with turning stability',
        hintLevel: 1,
      },
      childQuestion: '你觉得如果转弯时多修正两次，总时间会变短还是变长？',
      suggestedAction: { action: 'none', evidence: [] },
      studentModelPatch: {
        misconceptions: ['faster_always_better'],
        recentQuestionKeys: ['speed_vs_lap_time'],
      },
    });

    expect(output.knowledgePoint.concept).toContain('稳定性');
    expect(output.teachingMove.kind).toBe('brief_explanation_then_question');
    expect(output.childQuestion).toContain('总时间');
    expect(output.studentModelPatch?.misconceptions).toContain('faster_always_better');
  });

  it('builds a scene-neutral STEM teaching prompt with pacing rules', () => {
    const prompt = buildTeachingSkillPrompt({
      studentModel: createTeachingStudentModel(),
      availableTools: [{ name: 'race.runLap', risk: 'high' }],
      memory: { knownActivities: ['four_point_race'] },
      sceneContext: { sceneId: 'four_point_race', facts: { hasSavedRoute: true } },
      conversationHistory: [{ role: 'child', content: '为什么不是越快成绩越好？' }],
      childMessage: '为什么不是越快成绩越好？',
    });

    expect(prompt).toContain('先分析孩子问题背后的知识点');
    expect(prompt).toContain('不要一上来直接给完整答案');
    expect(prompt).toContain('不能一直反问或刁难孩子');
    expect(prompt).toContain('Available tools');
    expect(prompt).toContain('Memory');
    expect(prompt).toContain('Scene context');
  });

  it('allows experiment turns to explain and act without forcing another question', () => {
    const prompt = buildTeachingSkillPrompt({
      studentModel: createTeachingStudentModel(),
      availableTools: [{ name: 'race.runLap', risk: 'high' }],
      memory: { knownActivities: ['four_point_race'] },
      sceneContext: { sceneId: 'four_point_race', facts: { hasSavedRoute: true } },
      conversationHistory: [
        { role: 'child', content: '早转，我们看看是不是我猜的这样' },
        { role: 'child', content: '好的，那我们开始吧' },
      ],
      childMessage: '好的，那我们开始吧',
    });

    expect(prompt).toContain('experiment_turn');
    expect(prompt).toContain('孩子已经给出预测');
    expect(prompt).toContain('知识点 + 观察任务 + 自己决定是否调用工具');
    expect(prompt).not.toContain('childFacingReply 必须包含 childQuestion');
  });

  it('includes recent robot actions in the teaching prompt context', () => {
    const prompt = buildTeachingSkillPrompt({
      studentModel: createTeachingStudentModel(),
      availableTools: [{ name: 'race.runLap', risk: 'high' }],
      memory: {
        knownActivities: ['four_point_race'],
        recentRobotEvents: [
          { type: 'plan.step.done', tool: 'race.runLap', ok: true, message: 'race.runLap done' },
        ],
      },
      sceneContext: {
        sceneId: 'four_point_race',
        facts: {
          hasSavedRoute: true,
          latestRaceToolResult: {
            tool: 'race.runLap',
            ok: true,
            message: 'race.runLap done',
          },
          recentRobotEvents: [
            { type: 'plan.step.done', tool: 'race.runLap', ok: true, message: 'race.runLap done' },
          ],
        },
      },
      conversationHistory: [{ role: 'child', content: '好的，那我们开始吧' }],
      childMessage: '好的，那我们开始吧',
    });

    expect(prompt).toContain('latestRaceToolResult');
    expect(prompt).toContain('recentRobotEvents');
    expect(prompt).toContain('race.runLap done');
  });
});

describe('teaching runtime policy', () => {
  it('keeps structured child questions out of the public reply when the reply is already complete', async () => {
    const runtime = createTeachingRuntime({
      runner: async () =>
        JSON.stringify({
          childFacingReply: '速度太快会转弯不稳，所以不是越快越好。',
          knowledgePoint: { domain: 'physics', concept: '速度和稳定性共同影响时间' },
          learnerDiagnosis: { observedNeed: 'confuses speed with lap time', confidence: 0.8 },
          teachingMove: {
            kind: 'brief_explanation_then_question',
            purpose: 'pace explanation',
            hintLevel: 1,
          },
          childQuestion: '你觉得转弯不稳会让路线变短还是变长？',
          suggestedAction: { action: 'none', evidence: [] },
          studentModelPatch: {
            misconceptions: ['faster_always_better'],
            recentQuestionKeys: ['speed_stability'],
          },
        }),
    });

    const turn = await runtime.handleTurn({
      sessionId: 's1',
      childMessage: '为什么不是越快成绩越好？',
      availableTools: [{ name: 'race.runLap', risk: 'high' }],
      memory: {},
      sceneContext: { sceneId: 'four_point_race' },
      conversationHistory: [],
    });

    expect(turn.childFacingReply).toBe('速度太快会转弯不稳，所以不是越快越好。');
    expect(turn.childQuestion).toBe('你觉得转弯不稳会让路线变短还是变长？');
    expect(turn.studentModel.misconceptions).toContain('faster_always_better');
  });

  it('does not append a semantically repeated question after the teacher already asked it', async () => {
    const runtime = createTeachingRuntime({
      runner: async () =>
        JSON.stringify({
          childFacingReply:
            '新场地要先做一件事：把赛道的四个点 A、B、C、D 记录下来，小车才知道要绕哪里跑。你先想一想：这四个点应该摆成很挤的一团，还是尽量分开一点？为什么？',
          knowledgePoint: { domain: 'engineering', concept: '赛道点位设计' },
          learnerDiagnosis: { observedNeed: 'needs setup flow for a new field', confidence: 0.8 },
          teachingMove: { kind: 'socratic_question', purpose: 'choose_track_layout', hintLevel: 0 },
          childQuestion: '你觉得四个点应该摆成很挤的一团，还是尽量分开一点？为什么？',
          suggestedAction: { action: 'none', evidence: [] },
          studentModelPatch: { recentQuestionKeys: ['track_layout_spacing'] },
        }),
    });

    const turn = await runtime.handleTurn({
      sessionId: 's1',
      childMessage: '老师，我们到了一个新场地，我想玩一次四点竞速赛，要怎么开始呀？',
      availableTools: [{ name: 'localization.recordCurrentPose', risk: 'medium' }],
      memory: {},
      sceneContext: { sceneId: 'four_point_race' },
      conversationHistory: [],
    });

    expect(turn.childFacingReply).toContain('你先想一想');
    expect(turn.childFacingReply).not.toContain('你觉得四个点应该摆成很挤的一团');
  });

  it('does not keep asking when repeated-question frustration is present', async () => {
    const runtime = createTeachingRuntime({
      runner: async () =>
        JSON.stringify({
          childFacingReply: '我刚才重复问了。现在我先给一个类比：跑步过弯太快会绕远。你想先比较路线，还是先小幅加速？',
          knowledgePoint: { domain: 'physics', concept: '过弯稳定性' },
          learnerDiagnosis: {
            observedNeed: 'frustrated by repeated setup questions',
            confidence: 0.9,
          },
          teachingMove: { kind: 'analogy_then_question', purpose: 'repair pacing', hintLevel: 2 },
          childQuestion: '你想先比较路线，还是先小幅加速？',
          suggestedAction: { action: 'none', evidence: [] },
          studentModelPatch: {
            frustrationSignals: ['repeated_question:setup'],
            recentQuestionKeys: ['choose_variable'],
          },
        }),
    });

    await runtime.handleTurn({
      sessionId: 's2',
      childMessage: '已经说过了',
      availableTools: [],
      memory: {},
      sceneContext: {},
      conversationHistory: [],
      studentModelPatch: { recentQuestionKeys: ['setup'] },
    });
    const turn = await runtime.handleTurn({
      sessionId: 's2',
      childMessage: '别再问了',
      availableTools: [],
      memory: {},
      sceneContext: {},
      conversationHistory: [],
      studentModelPatch: { recentQuestionKeys: ['setup'] },
    });

    expect(turn.childFacingReply).toContain('类比');
    expect(turn.studentModel.frustrationSignals).toEqual(
      expect.arrayContaining(['repeated_question:setup']),
    );
  });

  it('does not append a child question to an experiment turn', async () => {
    const runtime = createTeachingRuntime({
      runner: async () =>
        JSON.stringify({
          turnKind: 'experiment_turn',
          childFacingReply:
            '你的预测是短赛段更容易早转。我们用跑圈验证：只观察 BC 和 DA 是否在到点前就开始朝下一个点转。',
          knowledgePoint: { domain: 'technology', concept: '提前量会影响短赛段转向' },
          learnerDiagnosis: { observedNeed: 'ready_to_test_prediction', confidence: 0.9 },
          teachingMove: { kind: 'experiment_prompt', purpose: 'run_short_segments', hintLevel: 1 },
          suggestedAction: { action: 'race.runLap', evidence: ['child made prediction'] },
        }),
    });

    const turn = await runtime.handleTurn({
      sessionId: 's3',
      childMessage: '好的，那我们开始吧',
      availableTools: [{ name: 'race.runLap', risk: 'high' }],
      memory: {},
      sceneContext: { sceneId: 'four_point_race', facts: { hasSavedRoute: true } },
      conversationHistory: [
        { role: 'child', content: 'BC DA容易偏，因为距离短，会提前往再下一个点跑' },
        { role: 'child', content: '早转，我们看看是不是我猜的这样' },
      ],
    });

    expect(turn.childFacingReply).toContain('跑圈验证');
    expect(turn.childFacingReply).not.toContain('childQuestion');
    expect(turn.childQuestion).toBeUndefined();
  });

  it('asks the model to repair an experiment turn that did not choose a tool or explain why', async () => {
    const calls: Array<{ roleId: string; prompt: string }> = [];
    const runtime = createTeachingRuntime({
      runner: async (request) => {
        calls.push(request);
        if (calls.length === 1) {
          return JSON.stringify({
            turnKind: 'experiment_turn',
            childFacingReply: '我们先跑一圈，看 BC 和 DA 会不会提前转。',
            knowledgePoint: { domain: 'technology', concept: '用跑圈验证提前量' },
            learnerDiagnosis: { observedNeed: 'ready_to_test_prediction', confidence: 0.9 },
            teachingMove: { kind: 'experiment_prompt', purpose: 'run_short_segments', hintLevel: 1 },
            suggestedAction: { action: 'none', evidence: [] },
          });
        }
        return JSON.stringify({
          turnKind: 'experiment_turn',
          childFacingReply: '我们先跑一圈，看 BC 和 DA 会不会提前转。',
          knowledgePoint: { domain: 'technology', concept: '用跑圈验证提前量' },
          learnerDiagnosis: { observedNeed: 'ready_to_test_prediction', confidence: 0.9 },
          teachingMove: { kind: 'experiment_prompt', purpose: 'run_short_segments', hintLevel: 1 },
          suggestedAction: { action: 'race.runLap', evidence: ['child asked to start validation'] },
          scenePatch: { runLap: { trackId: 'default-abcd' } },
        });
      },
    });

    const turn = await runtime.handleTurn({
      sessionId: 's4',
      childMessage: '好的，那我们开始吧',
      availableTools: [{ name: 'race.runLap', risk: 'high' }],
      memory: {},
      sceneContext: { sceneId: 'four_point_race', facts: { hasSavedRoute: true } },
      conversationHistory: [
        { role: 'child', content: '早转，我们看看是不是我猜的这样' },
      ],
    });

    expect(calls).toHaveLength(2);
    expect(calls[1]?.prompt).toContain('重新输出 JSON');
    expect(calls[1]?.prompt).toContain('不要由 runtime 替你选择工具');
    expect(turn.suggestedAction.action).toBe('race.runLap');
  });
});

describe('four-point race teaching schemas', () => {
  it('parses expert output with public reply and retained expert note', () => {
    const output = parseExpertOutput({
      publicReply: '我是定位工程师。你猜小车记录 A 点时，记录的是轮子转了多少，还是地图里的坐标？',
      expertNote: 'Child may know remote control but not AMCL/map frames yet.',
      raceDraftPatch: { nextPoint: 'A' },
    });

    expect(output.publicReply).toContain('定位工程师');
    expect(output.expertNote).toContain('AMCL');
  });
});

describe('four-point race scene adapter', () => {
  it('does not expose record-point as actionable when the point name is missing', () => {
    const adapter = createRaceSceneAdapter();
    const output = adapter.toRaceTutorOutput({
      turnKind: 'experiment_turn',
      childFacingReply: '我准备记录这个点。',
      knowledgePoint: { domain: 'technology', concept: '地图点位' },
      learnerDiagnosis: { observedNeed: 'record current waypoint', confidence: 0.8 },
      teachingMove: { kind: 'experiment_prompt', purpose: 'record_waypoint', hintLevel: 1 },
      suggestedAction: { action: 'race.recordPoint', evidence: ['child says robot is at B'] },
      scenePatch: {},
    });

    expect(output.suggestedRobotAction).toBe('none');
    expect(output.raceDraftPatch).toBeUndefined();
    expect(output.decision?.toolCandidate).toBeUndefined();
  });
});

describe('race conversation router', () => {
  it('routes a child race goal to the AI tutor instead of robot execution', async () => {
    const router = createRaceConversationRouter({
      runner: async () =>
        JSON.stringify({
          speakerRole: 'child',
          route: 'ai_tutor',
          confidence: 0.91,
          reason: '孩子是在提出学习挑战目标，不是要求立即控制真实小车。',
        }),
    });

    const decision = await router.route({
      content: '我想玩一次四点竞速赛',
      raceSessionActive: false,
    });

    expect(decision.route).toBe('ai_tutor');
    expect(decision.speakerRole).toBe('child');
  });

  it('routes an explicit developer lap request to robot execution', async () => {
    const router = createRaceConversationRouter({
      runner: async () =>
        JSON.stringify({
          speakerRole: 'developer',
          route: 'robot_execution',
          confidence: 0.95,
          reason: '说话人声明开发工程师身份，并明确要求使用已有赛道直接跑圈。',
        }),
    });

    const decision = await router.route({
      content: '我是开发工程师，使用已有 default-abcd 直接控制小车跑一圈',
      raceSessionActive: true,
    });

    expect(decision.route).toBe('robot_execution');
    expect(decision.speakerRole).toBe('developer');
  });

  it('keeps child race execution requests with the AI tutor instead of bypassing teaching', async () => {
    const router = createRaceConversationRouter({
      runner: async () =>
        JSON.stringify({
          speakerRole: 'child',
          route: 'robot_execution',
          confidence: 0.8,
          reason: '孩子说点位已录好并要求开始跑圈。',
        }),
    });

    const decision = await router.route({
      content: 'A/B/C/D 点位已经录好了，开始跑一圈',
      raceSessionActive: true,
    });

    expect(decision.route).toBe('ai_tutor');
    expect(decision.speakerRole).toBe('child');
    expect(decision.reason).toContain('AI tutor');
  });

  it('tells the router that active child race sessions should stay teacher-led', () => {
    const prompt = buildRaceConversationRoutePrompt({
      content: 'A/B/C/D 点位已经录好了，开始跑一圈',
      raceSessionActive: true,
    });

    expect(prompt).toContain('如果说话人是孩子');
    expect(prompt).toContain('仍然选择 ai_tutor');
    expect(prompt).not.toContain('preview');
  });

  it('falls back to the AI tutor when the route model output is invalid', async () => {
    const router = createRaceConversationRouter({
      runner: async () => 'not json',
    });

    const decision = await router.route({
      content: '我想玩一次四点竞速赛',
      raceSessionActive: false,
    });

    expect(decision.route).toBe('ai_tutor');
    expect(decision.reason).toContain('fallback');
  });
});

describe('expert mailbox', () => {
  it('calls expert skill prompts and returns public reply without dropping expert note', async () => {
    const calls: Array<{ roleId: string; prompt: string }> = [];
    const runner: LlmRoleRunner = async (request) => {
      calls.push({ roleId: request.roleId, prompt: request.prompt });
      return JSON.stringify({
        publicReply: '我是安全工程师。你觉得前方 35 厘米出现障碍物时，小车应该继续冲刺还是停下？',
        expertNote: 'Connect lidar.frontStopDistanceMeters to race safety.',
      });
    };
    const mailbox = createExpertMailbox({ runner });

    const reply = await mailbox.ask({
      expertId: 'safety',
      question: '解释雷达安全停止。',
      context: { frontStopDistanceMeters: 0.35 },
    });

    expect(calls[0]?.roleId).toBe('race-safety-expert');
    expect(calls[0]?.prompt).toContain('解释雷达安全停止');
    expect(reply.publicReply).toContain('安全工程师');
    expect(reply.expertNote).toContain('lidar');
  });
});

describe('race tutor prompts', () => {
  it('gives experts personality, tool boundary, variables, and guided-question rules', () => {
    const prompt = buildExpertPrompt({
      expertId: 'motion',
      question: '孩子想让小车跑得更像赛车，请引导他思考。',
      context: { stage: 'improve_lap' },
    });

    expect(prompt).toContain('人格');
    expect(prompt).toContain('你掌管的工具或变量');
    expect(prompt).toContain('不能替 AI 老师决定');
    expect(prompt).toContain('publicReply 控制在 1-2 句');
    expect(prompt).toContain('lookahead');
  });

  it('prompts experts to explain from persona and background without taking over the lesson', () => {
    const prompt = buildExpertPrompt({
      expertId: 'strategy',
      question: '孩子问为什么不是越快越好，请用策略专家身份解释。',
      context: { knowledgePoint: 'speed_stability_tradeoff' },
    });

    expect(prompt).toContain('人格');
    expect(prompt).toContain('专业背景');
    expect(prompt).toContain('孩子听得懂');
    expect(prompt).toContain('不能替 AI 老师决定下一步');
    expect(prompt).toContain('Return JSON only');
  });
});

describe('race scene adapter', () => {
  it('exposes run-lap strategy parameters to the AI teacher tool list', () => {
    const adapter = createRaceSceneAdapter();
    const tools = adapter.buildAvailableTools();
    const runLap = tools.find((tool) => tool.name === 'race.runLap');

    expect(runLap).toMatchObject({
      name: 'race.runLap',
      risk: 'high',
      inputSchema: {
        properties: {
          strategy: {
            properties: {
              maxSpeedMps: { minimum: 0.05, maximum: 0.5, default: 0.25 },
              minTurnSpeedMps: { minimum: 0.03, maximum: 0.5 },
              lookaheadMeters: { minimum: 0.05, maximum: 1 },
              waypointRadiusMeters: { minimum: 0.05, maximum: 1 },
              finishRadiusMeters: { minimum: 0.05, maximum: 1 },
            },
          },
        },
      },
    });
    expect(runLap).toHaveProperty('examples');
  });

  it('builds scene context from saved track and latest lap facts', () => {
    const adapter = createRaceSceneAdapter();
    const context = adapter.buildContext({
      race: {
        track: { trackId: 'default-abcd', recordedPoints: ['A', 'B', 'C', 'D'] },
        latestLap: {
          status: 'stopped',
          elapsedMs: 22370,
          stopReason: 'front_obstacle_too_close',
          nearestObstacleMeters: 0.147,
        },
      },
    });

    expect(context.sceneId).toBe('four_point_race');
    expect(context.facts).toMatchObject({
      hasSavedRoute: true,
      savedRouteId: 'default-abcd',
      latestLapStatus: 'stopped',
    });
  });

  it('builds scene context with recent race tool results', () => {
    const adapter = createRaceSceneAdapter();
    const context = adapter.buildContext({
      race: {
        track: { trackId: 'default-abcd', recordedPoints: ['A', 'B', 'C', 'D'] },
        latestRaceToolResult: {
          tool: 'race.runLap',
          ok: true,
          message: 'race.runLap done',
        },
        recentRobotEvents: [
          { type: 'plan.step.done', tool: 'race.runLap', ok: true, message: 'race.runLap done' },
        ],
      },
    });

    expect(context.facts).toMatchObject({
      latestRaceToolResult: {
        tool: 'race.runLap',
        ok: true,
      },
      recentRobotEvents: [
        { type: 'plan.step.done', tool: 'race.runLap', ok: true },
      ],
    });
  });

  it('maps generic run-lap suggested action to race tutor output', () => {
    const adapter = createRaceSceneAdapter();
    const result = adapter.toRaceTutorOutput({
      turnKind: 'experiment_turn',
      childFacingReply: '我们先跑一圈做基准。你预测哪一段会最慢？',
      childQuestion: '你预测哪一段会最慢？',
      knowledgePoint: { domain: 'engineering', concept: '基准实验' },
      learnerDiagnosis: { observedNeed: 'ready for baseline', confidence: 0.8 },
      teachingMove: { kind: 'experiment_prompt', purpose: 'baseline', hintLevel: 1 },
      suggestedAction: { action: 'run_lap', evidence: ['saved route complete'] },
      scenePatch: { runLap: { trackId: 'default-abcd' } },
    });

    expect(result.publicReply).toContain('预测');
    expect(result.suggestedRobotAction).toBe('run_lap');
    expect(result.raceDraftPatch?.runLap).toMatchObject({ trackId: 'default-abcd' });
  });

  it('translates model-selected race tool names to the existing websocket action contract', () => {
    const adapter = createRaceSceneAdapter();
    const result = adapter.toRaceTutorOutput({
      turnKind: 'experiment_turn',
      childFacingReply: '我们用跑圈验证你的早转猜想。',
      knowledgePoint: { domain: 'technology', concept: '跑圈可以先观察转向提前量' },
      learnerDiagnosis: { observedNeed: 'ready_to_test_prediction', confidence: 0.9 },
      teachingMove: { kind: 'experiment_prompt', purpose: 'run_short_segments', hintLevel: 1 },
      suggestedAction: { action: 'race.runLap', evidence: ['model selected run tool'] },
      scenePatch: { runLap: { trackId: 'default-abcd' } },
    });

    expect(result.suggestedRobotAction).toBe('run_lap');
  });
});

describe('four-point race teaching orchestrator', () => {
  it('uses a structured tutor decision to run an activity after the child confirms known preconditions', async () => {
    const calls: Array<{ roleId: string; prompt: string }> = [];
    const runner: LlmRoleRunner = async (request) => {
      calls.push(request);
      return JSON.stringify({
        childFacingReply:
          '好，就用已经保存好的这一条赛道。第一圈是基准实验，你预测哪一段最慢？',
        knowledgePoint: { domain: 'engineering', concept: '基准实验和变量对比' },
        learnerDiagnosis: { observedNeed: 'ready_to_run_saved_activity', confidence: 0.9 },
        teachingMove: { kind: 'experiment_prompt', purpose: 'run_baseline', hintLevel: 1 },
        childQuestion: '你预测哪一段最慢？',
        suggestedAction: {
          action: 'run_lap',
          evidence: ['trackStatus complete', 'child confirmed only saved track'],
        },
        studentModelPatch: {
          confirmedFacts: ['activity_has_saved_track', 'robot_at_start', 'ready_to_run'],
          masteredConcepts: ['start_direction'],
        },
        scenePatch: {
          runLap: {
            trackId: 'default-abcd',
            strategy: { maxSpeedMps: 0.25 },
            safety: { frontStopDistanceMeters: 0.15 },
          },
        },
      });
    };
    const tutor = createFourPointRaceTeachingOrchestrator({
      runner,
      mailbox: createExpertMailbox({ runner }),
    });

    const turn = await tutor.handleTurn({
      sessionId: 'race-session-ready',
      childMessage: '就只录制了一条赛道，就用这条，可以开始',
      knownFacts: {
        childCanUseRemoteControl: true,
        race: {
          track: { trackId: 'default-abcd', recordedPoints: ['A', 'B', 'C', 'D'] },
        },
      },
    });

    expect(turn.suggestedRobotAction).toBe('run_lap');
    expect(turn.publicReply).not.toMatch(/赛道列表|选中|重新录|再确认/u);
    expect(turn.raceDraftPatch?.runLap).toMatchObject({ trackId: 'default-abcd' });
    expect(tutor.getSession('race-session-ready')?.studentModel?.confirmedFacts).toEqual(
      expect.arrayContaining(['activity_has_saved_track', 'robot_at_start', 'ready_to_run']),
    );
    expect(calls[0]?.roleId).toBe('ai-teacher-agent');
    expect(calls[0]?.prompt).toContain('Available tools');
    expect(calls[0]?.prompt).toContain('Scene context');
  });

  it('normalizes generic route payloads into existing run-lap tool arguments', async () => {
    const tutor = createFourPointRaceTeachingOrchestrator({
      runner: async () =>
        JSON.stringify({
          childFacingReply: '现在就用保存好的路线跑一圈。你先猜哪段会最慢？',
          knowledgePoint: { domain: 'engineering', concept: '基准测试' },
          learnerDiagnosis: { observedNeed: 'start_saved_activity', confidence: 0.8 },
          teachingMove: { kind: 'experiment_prompt', purpose: 'run_baseline', hintLevel: 1 },
          childQuestion: '你先猜哪段会最慢？',
          suggestedAction: { action: 'run_lap', evidence: ['known saved route'] },
          scenePatch: {
            routeId: 'default-abcd',
            plannedRun: 'single_lap',
          },
        }),
      mailbox: createExpertMailbox({ runner: async () => '{}' }),
    });

    const turn = await tutor.handleTurn({
      sessionId: 'race-session-generic-route',
      childMessage: '就用这条保存好的路线跑一圈',
      knownFacts: {
        race: {
          track: { trackId: 'default-abcd', recordedPoints: ['A', 'B', 'C', 'D'] },
        },
      },
    });

    expect(turn.suggestedRobotAction).toBe('run_lap');
    expect(turn.raceDraftPatch?.runLap).toMatchObject({ trackId: 'default-abcd' });
  });

  it('records repeated question keys as a student frustration signal without parsing child text by regex', async () => {
    const tutor = createFourPointRaceTeachingOrchestrator({
      runner: async () =>
        JSON.stringify({
          childFacingReply: '我刚才又问了同一个确认点。下一步你想直接实验，还是先预测结果？',
          knowledgePoint: { domain: 'general', concept: '重复确认会降低学习节奏' },
          learnerDiagnosis: { observedNeed: 'continue_activity', confidence: 0.7 },
          teachingMove: { kind: 'diagnostic_question', purpose: 'stop_repeating_question', hintLevel: 1 },
          childQuestion: '下一步你想直接实验，还是先预测结果？',
          suggestedAction: { action: 'none', evidence: [] },
          studentModelPatch: {
            recentQuestionKeys: ['select_saved_track'],
          },
        }),
      mailbox: createExpertMailbox({ runner: async () => '{}' }),
    });

    await tutor.handleTurn({
      sessionId: 'race-session-repeat',
      childMessage: '就是昨天那条，只有一条',
    });
    await tutor.handleTurn({
      sessionId: 'race-session-repeat',
      childMessage: '已经说过了',
    });

    expect(tutor.getSession('race-session-repeat')?.studentModel?.frustrationSignals).toContain(
      'repeated_question:select_saved_track',
    );
  });

  it('keeps an opening race goal teacher-led without triggering a robot action', async () => {
    const tutor = createFourPointRaceTeachingOrchestrator({
      runner: async () =>
        JSON.stringify({
          childFacingReply: '可以。先想一个小问题：A 点更适合放在直道前，还是急弯前？',
          knowledgePoint: { domain: 'engineering', concept: '起点位置影响加速和转弯' },
          learnerDiagnosis: { observedNeed: 'define_race_goal', confidence: 0.8 },
          teachingMove: { kind: 'socratic_question', purpose: 'choose_start_point', hintLevel: 0 },
          childQuestion: 'A 点更适合放在直道前，还是急弯前？',
          suggestedAction: { action: 'none', evidence: [] },
          scenePatch: { goal: 'four_point_race' },
        }),
      mailbox: createExpertMailbox({ runner: async () => '{}' }),
    });

    const turn = await tutor.handleTurn({
      sessionId: 'race-session-1',
      childMessage: '我今天想要完成4点竞速赛',
      knownFacts: { childCanUseRemoteControl: true },
    });

    expect(turn.publicReply).toContain('A 点');
    expect(turn.publicReply).toContain('直道');
    expect(turn.mentions).toHaveLength(0);
    expect(turn.suggestedRobotAction).toBe('none');
  });

  it('turns a lidar stop result into review questions and safety/strategy expert support', async () => {
    const tutor = createFourPointRaceTeachingOrchestrator({
      runner: async () =>
        JSON.stringify({
          childFacingReply:
            '这次先别只看速度。小车在 0.344 米附近停下，说明安全距离也会影响圈速；你觉得先改路线，还是先小幅改速度？',
          knowledgePoint: { domain: 'physics', concept: '安全距离、路径和速度共同影响完成时间' },
          learnerDiagnosis: { observedNeed: 'connect_stop_reason_with_strategy', confidence: 0.8 },
          teachingMove: { kind: 'brief_explanation_then_question', purpose: 'choose_one_variable', hintLevel: 1 },
          childQuestion: '你觉得先改路线，还是先小幅改速度？',
          suggestedAction: { action: 'none', evidence: [] },
          expertMentions: [
            {
              expertId: 'safety',
              question: '孩子看到 race.runLap 因 front_obstacle_too_close 停止，请解释雷达阈值。',
              context: { stage: 'review_lidar_stop' },
            },
            {
              expertId: 'strategy',
              question: '孩子想改进成绩，请引导他选择一个变量做下一圈对比实验。',
              context: { stage: 'choose_one_variable' },
            },
          ],
        }),
      mailbox: createExpertMailbox({
        runner: async (request) =>
          JSON.stringify({
            publicReply: request.roleId.includes('safety')
              ? '我是安全工程师。0.344 米像一条刹车线，先观察它是不是总在同一段触发。'
              : '我是策略教练。先只改一个变量，才知道成绩变化是谁带来的。',
            expertNote: request.roleId,
          }),
      }),
    });

    const turn = await tutor.handleTurn({
      sessionId: 'race-session-review',
      childMessage: '刚才小车因为前方太近停下了，我们怎么改进成绩？',
      knownFacts: {
        lastRaceResult: {
          status: 'stopped',
          elapsedMs: 25454,
          stopReason: 'front_obstacle_too_close',
          nearestObstacleMeters: 0.344,
          thresholdMeters: 0.35,
        },
      },
    });

    expect(turn.publicReply).toContain('0.344');
    expect(turn.publicReply).toContain('你觉得');
    expect(turn.mentions.map((mention) => mention.expertId)).toEqual(['safety', 'strategy']);
    expect(turn.expertReplies.map((reply) => reply.expertId)).toEqual(['safety', 'strategy']);
  });

  it('keeps expert replies out of the stored tutor-child conversation history', async () => {
    const tutor = createFourPointRaceTeachingOrchestrator({
      runner: async () =>
        JSON.stringify({
          childFacingReply: '安全停车是一个观察结果。你想先找触发位置，还是先降低转弯速度？',
          knowledgePoint: { domain: 'science', concept: '观察结果用于提出下一轮假设' },
          learnerDiagnosis: { observedNeed: 'review_stop_result', confidence: 0.7 },
          teachingMove: { kind: 'review_prompt', purpose: 'choose_next_observation', hintLevel: 1 },
          childQuestion: '你想先找触发位置，还是先降低转弯速度？',
          suggestedAction: { action: 'none', evidence: [] },
          expertMentions: [
            {
              expertId: 'safety',
              question: '解释安全停车。',
              context: {},
            },
          ],
        }),
      mailbox: createExpertMailbox({
        runner: async () =>
          JSON.stringify({
            publicReply: '我是安全工程师。先把停车位置当成证据点。',
            expertNote: 'safety note',
          }),
      }),
    });

    await tutor.handleTurn({
      sessionId: 'race-session-history',
      childMessage: '刚才小车因为前方太近停下了，我们怎么改进成绩？',
      knownFacts: {
        lastRaceResult: {
          status: 'stopped',
          nearestObstacleMeters: 0.344,
          thresholdMeters: 0.35,
        },
      },
    });

    const session = tutor.getSession('race-session-history');

    expect(session?.childFacingHistory.map((item) => item.role)).toEqual(['child', 'tutor']);
    expect(session?.expertNotes.map((item) => item.expertId)).toEqual(['safety']);
  });
});

describe('race tutor websocket messages', () => {
  it('routes raceTutorInput to a child-facing raceTutorOutput message', async () => {
    const sent: Record<string, unknown>[] = [];
    const store = new AgentStateStore();

    handleClientMessage(
      {
        type: 'raceTutorInput',
        requestId: 'req-1',
        sessionId: 'race-session-1',
        content: '我今天想要完成4点竞速赛',
      },
      (message) => sent.push(message),
      {
        store,
        cache: null,
        onRaceTutorTurn: async () => ({
          publicReply: '先想一个问题：记录 A 点时，小车应该保存什么信息？',
          mentions: [],
          suggestedRobotAction: 'none',
          expertReplies: [],
        }),
      },
    );

    await waitFor(() => sent.some((message) => message.type === 'raceTutorOutput'));

    expect(sent).toContainEqual({
      type: 'raceTutorOutput',
      requestId: 'req-1',
      ok: true,
      sessionId: 'race-session-1',
      publicReply: '先想一个问题：记录 A 点时，小车应该保存什么信息？',
      expertReplies: [],
      suggestedRobotAction: 'none',
      raceDraftPatch: undefined,
    });
  });
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for predicate');
}
