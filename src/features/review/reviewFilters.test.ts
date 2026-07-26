import { describe, expect, it } from 'vitest';
import type {
  GeneratedContent,
  MissionContent,
  MultipleChoiceQuestionContent,
} from '../../content/types';
import { createReviewNote } from '../../storage/reviewNotesStorage';
import { buildReviewReport } from './reviewReport';
import {
  buildReviewItems,
  createDefaultReviewFilters,
  filterReviewItems,
  getReviewFilterOptions,
} from './reviewFilters';

describe('reviewFilters', () => {
  it('koppelt vragen aan missies en filtert op vraag-ID', () => {
    const content = createContent();
    const items = buildReviewItems(content);
    const results = filterReviewItems(items, {
      ...createDefaultReviewFilters(content.seasonValues),
      query: ' Q-T8 ',
    });

    expect(results.map((item) => item.question.id)).toEqual(['q-t8-01']);
    expect(results[0]?.missionTitles).toEqual(['Ontvangsthal']);
  });

  it('filtert op missie, artikel, categorie en contentreviewstatus', () => {
    const content = createContent();
    const items = buildReviewItems(content);
    const results = filterReviewItems(items, {
      article: 't.124',
      category: 'non-combativity',
      missionId: 'mission-2',
      query: '',
      reviewStatus: 'unreviewed',
      season: '2025-2026',
    });

    expect(results.map((item) => item.question.id)).toEqual(['q-t124-2025']);
  });

  it('houdt t.124-seizoensvragen gescheiden', () => {
    const content = createContent();
    const items = buildReviewItems(content);
    const results2025 = filterReviewItems(items, {
      ...createDefaultReviewFilters(content.seasonValues),
      article: 't.124',
      season: '2025-2026',
    });
    const results2026 = filterReviewItems(items, {
      ...createDefaultReviewFilters(content.seasonValues),
      article: 't.124',
      season: '2026-2027',
    });

    expect(results2025.map((item) => item.question.id)).toEqual(['q-t124-2025']);
    expect(results2026.map((item) => item.question.id)).toEqual(['q-t124-2026']);
  });

  it('bouwt filteropties deterministisch uit de content', () => {
    const options = getReviewFilterOptions(createContent());

    expect(options.articles).toEqual(['t.1', 't.124', 't.8']);
    expect(options.categories).toEqual(['basis', 'non-combativity', 'procedure']);
    expect(options.missions.map((mission) => mission.title)).toEqual([
      'Non-combativity',
      'Ontvangsthal',
    ]);
    expect(options.seasons).toEqual(['2025-2026', '2026-2027']);
  });

  it('bouwt een lokaal reviewrapport zonder content te wijzigen', () => {
    const content = createContent();
    const note = createReviewNote({
      questionId: 'q-t8-01',
      status: 'aanpassen',
      text: 'Controleer bronpagina.',
      date: '2026-07-25T10:00:00.000Z',
      reviewerName: 'Reviewer',
    });
    const report = buildReviewReport({
      content,
      generatedAt: '2026-07-25T11:00:00.000Z',
      notes: [note],
    });

    expect(report.source.canonicalFile).toBe('content-source/degenref_content_pack.json');
    expect(report.noteCount).toBe(1);
    expect(report.notes).toEqual([note]);
    expect(report.instruction).toContain('bron-JSON');
  });
});

function createContent(): GeneratedContent {
  return {
    schemaVersion: 1,
    source: {
      canonicalFile: 'content-source/degenref_content_pack.json',
      supportingFiles: [],
      relationStrategy: 'mission-room-article-match',
    },
    metadata: {
      title: 'DegenRef Escape',
      sourceFile: 'test',
      sourceEdition: 'FIE Technical Rules - December 2025',
      generatedDate: '2026-07-25',
      scope: { included: ['t.1'], excluded: [], emptyInSource: [] },
      disclaimer: 'Niet officieel',
      nonCombativityNote: 't.124 verschilt per seizoen',
    },
    rooms: [],
    lessons: [],
    missions: [
      createMission({ id: 'mission-1', title: 'Ontvangsthal' }),
      createMission({ id: 'mission-2', title: 'Non-combativity' }),
    ],
    questions: [
      createQuestion({ id: 'q-t1-01', article: 't.1', category: 'basis', reviewed: true }),
      createQuestion({ id: 'q-t8-01', article: 't.8', category: 'procedure' }),
      createQuestion({
        id: 'q-t124-2025',
        article: 't.124',
        category: 'non-combativity',
        question: 'Welke sanctie geldt in seizoen 2025-2026?',
        explanation: 'Deze vraag hoort bij seizoen 2025-2026.',
      }),
      createQuestion({
        id: 'q-t124-2026',
        article: 't.124',
        category: 'non-combativity',
        question: 'Welke sanctie geldt vanaf seizoen 2026-2027?',
        explanation: 'Deze vraag hoort bij seizoen 2026-2027.',
      }),
    ],
    missionQuestionLinks: [
      { missionId: 'mission-1', questionIds: ['q-t1-01', 'q-t8-01'] },
      { missionId: 'mission-2', questionIds: ['q-t124-2025', 'q-t124-2026'] },
    ],
    seasonValues: ['2025-2026', '2026-2027'],
  };
}

function createMission({
  id,
  title,
}: {
  id: string;
  title: string;
}): MissionContent {
  return {
    id,
    roomId: 'room',
    title,
    story: 'Verhaal',
    articles: ['t.1'],
    tasks: [{ type: 'question', instruction: 'Controleer de vraag.' }],
    passCondition: 'Rond af',
    reward: 'Beloning',
    reviewed: true,
  };
}

function createQuestion(
  overrides: Partial<MultipleChoiceQuestionContent>,
): MultipleChoiceQuestionContent {
  return {
    id: 'q-1',
    roomId: 'room',
    type: 'multiple-choice',
    category: 'procedure',
    difficulty: 1,
    article: 't.8',
    sourcePage: 1,
    question: 'Vraag?',
    options: ['A', 'B'],
    correctAnswer: 0,
    hints: ['Hint'],
    explanation: 'Uitleg.',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: false,
    reviewedBy: '',
    ...overrides,
  };
}
