import { expect, test } from 'vitest';

import {
  extractGeneratedCopyworkTitle,
  formatCopyworkSummary,
  parseCopyworkCandidates,
  type RoleTaskConsoleEntryLike,
} from '../src/components/roleTaskConsoleUtils.js';

test('parses around-30-character news information without treating the label as content', () => {
  const entries: RoleTaskConsoleEntryLike[] = [
    {
      id: 1,
      runId: 'copyworkPicker-1',
      roleId: 'copyworkPicker',
      status: 'done',
      stream: 'stdout',
      content: [
        '已完成，整理出2条新闻信息。',
        '',
        '新闻信息：',
        '1. 世界杯四分之一决赛即将开始，球迷关注半决赛席位。（适合原因：体育主题积极）',
        '2. 嫦娥七号计划探索月球南极，中国航天任务值得关注。（适合原因：科技主题适合摘抄）',
      ].join('\n'),
    },
  ];

  const candidates = parseCopyworkCandidates(entries);

  expect(candidates).toHaveLength(2);
  expect(candidates[0]?.title).toBe('世界杯四分之一决赛即将开始，球迷关注半决赛席位。');
  expect(candidates[0]?.summary).toBe('');
  expect(formatCopyworkSummary(candidates[0]!)).not.toContain('主题：');
  expect(formatCopyworkSummary(candidates[0]!)).toContain(
    '新闻信息：世界杯四分之一决赛即将开始，球迷关注半决赛席位。',
  );
});

test('ignores completion progress lines when parsing fallback candidate lines', () => {
  const entries: RoleTaskConsoleEntryLike[] = [
    {
      id: 1,
      runId: 'copyworkPicker-1',
      roleId: 'copyworkPicker',
      status: 'done',
      stream: 'stdout',
      content: [
        '候选新闻卡：',
        '已完成，整理出2条新闻信息。',
        '1. 体育活动进校园：学生在运动中培养健康习惯。',
        '2. 博物馆暑期开放儿童讲解：孩子们近距离了解传统文化。',
      ].join('\n'),
    },
  ];

  const candidates = parseCopyworkCandidates(entries);

  expect(candidates).toHaveLength(2);
  expect(candidates[0]?.title).toBe('体育活动进校园，学生在运动中培养健康习惯。');
});

test('extracts generated around-10-character news title from summarizer output', () => {
  const entries: RoleTaskConsoleEntryLike[] = [
    {
      id: 1,
      runId: 'copyworkPicker-1',
      roleId: 'copyworkPicker',
      status: 'done',
      stream: 'stdout',
      content: '候选新闻卡：\n1. 体育活动进校园：学生在运动中培养健康习惯。',
    },
    {
      id: 2,
      runId: 'summarizer-1',
      roleId: 'summarizer',
      status: 'done',
      stream: 'stdout',
      content: '新闻标题：校园体育助成长',
    },
  ];

  expect(extractGeneratedCopyworkTitle(entries, 1)).toBe('校园体育助成长');
});
