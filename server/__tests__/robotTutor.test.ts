import { describe, expect, it } from 'vitest';

import { AgentStateStore } from '../src/agentStateStore.js';
import { handleClientMessage } from '../src/clientMessageHandler.js';
import { createExpertMailbox } from '../src/robotTutor/expertMailbox.js';
import type { LlmRoleRunner } from '../src/robotTutor/llmRoleRunner.js';
import { parseExpertOutput, parseTutorOutput } from '../src/robotTutor/schemas.js';
import { createDeterministicRaceTutorOrchestrator } from '../src/robotTutor/tutorOrchestrator.js';

describe('robotTutor schemas', () => {
  it('parses tutor output and keeps only child-facing public reply for display', () => {
    const output = parseTutorOutput({
      publicReply: '你想先用遥控器把小车放到 A 点，还是先说说定位靠什么知道自己在哪里？',
      mentions: [
        {
          expertId: 'localization',
          question: '孩子准备记录 A 点，请用苏格拉底式问题解释 map 坐标。',
          context: { point: 'A' },
        },
      ],
      raceDraftPatch: { goal: 'four_point_race' },
      suggestedRobotAction: 'record_point',
      internalNote: 'must not leak',
    });

    expect(output.publicReply).toContain('定位');
    expect(output.mentions).toHaveLength(1);
    expect(output).not.toHaveProperty('internalNote');
  });

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

describe('race tutor orchestrator', () => {
  it('asks a Socratic first question and mentions the localization expert for a race goal', async () => {
    const tutor = createDeterministicRaceTutorOrchestrator();

    const turn = await tutor.handleTurn({
      sessionId: 'race-session-1',
      childMessage: '我今天想要完成4点竞速赛',
      knownFacts: { childCanUseRemoteControl: true },
    });

    expect(turn.publicReply).toContain('定位');
    expect(turn.publicReply).toContain('A 点');
    expect(turn.mentions.map((mention) => mention.expertId)).toContain('localization');
    expect(turn.suggestedRobotAction).toBe('none');
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
