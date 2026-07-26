import { describe, expect, it } from 'vitest';
import type {
  GeneratedContent,
  MissionContent,
  MultipleChoiceQuestionContent,
} from '../../content/types';
import { createDefaultSettings, createInitialProgress } from '../../storage/localStorageState';
import {
  getMissionCategories,
  getMissionDifficulty,
  getMissionStatus,
  getNextMissionId,
  matchesSelectedSeason,
  selectSessionQuestions,
} from './missionUtils';

describe('missionUtils', () => {
  it('selecteert de juiste t.124-seizoensvragen zonder algemene vragen te verliezen', () => {
    const q2025 = createQuestion({
      id: 'q-t124-2025',
      article: 't.124',
      question: 'Wat geldt in seizoen 2025-2026?',
      explanation: 'Alleen seizoen 2025-2026.',
    });
    const q2026 = createQuestion({
      id: 'q-t124-2026',
      article: 't.124',
      question: 'Wat geldt vanaf seizoen 2026-2027?',
      explanation: 'Alleen seizoen 2026-2027.',
    });
    const qGeneral = createQuestion({
      id: 'q-general',
      article: 't.124',
      question: 'Wanneer ontstaat onwil tot schermen?',
      explanation: 'Deze uitleg noemt geen seizoenswaarde.',
    });

    expect(matchesSelectedSeason(q2025, '2025-2026')).toBe(true);
    expect(matchesSelectedSeason(q2025, '2026-2027')).toBe(false);
    expect(matchesSelectedSeason(q2026, '2025-2026')).toBe(false);
    expect(matchesSelectedSeason(q2026, '2026-2027')).toBe(true);
    expect(matchesSelectedSeason(qGeneral, '2026-2027')).toBe(true);
    expect(matchesSelectedSeason(createQuestion({ article: 't.90' }), '2026-2027')).toBe(
      true,
    );
  });

  it('filtert sessievragen op seizoen, reviewstatus en ervaringsniveau', () => {
    const content = createContent({
      questions: [
        createQuestion({ id: 'q-easy-reviewed', difficulty: 1, reviewed: true }),
        createQuestion({ id: 'q-hard-reviewed', difficulty: 3, reviewed: true }),
        createQuestion({ id: 'q-unreviewed', difficulty: 1, reviewed: false }),
        createQuestion({
          id: 'q-t124-2026',
          article: 't.124',
          difficulty: 1,
          reviewed: true,
          question: 'Vanaf seizoen 2026-2027?',
          explanation: 'Seizoen 2026-2027.',
        }),
      ],
      missionQuestionLinks: [
        {
          missionId: 'mission-1',
          questionIds: ['q-easy-reviewed', 'q-hard-reviewed', 'q-unreviewed', 'q-t124-2026'],
        },
      ],
    });
    const beginnerSettings = {
      ...createDefaultSettings(['2025-2026', '2026-2027']),
      experienceLevel: 'beginner' as const,
      selectedSeason: '2025-2026',
    };
    const reviewedOnlySettings = {
      ...beginnerSettings,
      excludeUnreviewedQuestions: true,
    };

    expect(
      selectSessionQuestions(content, 'mission-1', beginnerSettings).map(
        (question) => question.id,
      ),
    ).toEqual(['q-easy-reviewed', 'q-unreviewed']);
    expect(
      selectSessionQuestions(content, 'mission-1', reviewedOnlySettings).map(
        (question) => question.id,
      ),
    ).toEqual(['q-easy-reviewed']);
  });

  it('valt terug op gereviewde vragen wanneer het gekozen niveau niets oplevert', () => {
    const content = createContent({
      questions: [
        createQuestion({ id: 'q-easy-1', difficulty: 1, reviewed: true }),
        createQuestion({ id: 'q-easy-2', difficulty: 1, reviewed: true }),
      ],
      missionQuestionLinks: [
        { missionId: 'mission-1', questionIds: ['q-easy-1', 'q-easy-2'] },
      ],
    });
    const settings = {
      ...createDefaultSettings(['2025-2026']),
      experienceLevel: 'exam-training' as const,
    };

    expect(selectSessionQuestions(content, 'mission-1', settings).map((question) => question.id))
      .toEqual(['q-easy-1', 'q-easy-2']);
  });

  it('bepaalt missiestatus op basis van voortgang en leermodus-instelling', () => {
    const missions = [createMission({ id: 'mission-1' }), createMission({ id: 'mission-2' })];
    const firstMission = missions[0];
    const secondMission = missions[1];
    const settings = createDefaultSettings(['2025-2026']);
    const progress = createInitialProgress(missions.map((mission) => mission.id));

    if (firstMission === undefined || secondMission === undefined) {
      throw new Error('Testmissies ontbreken.');
    }

    expect(getMissionStatus(firstMission, missions, progress, settings)).toBe('available');
    expect(getMissionStatus(secondMission, missions, progress, settings)).toBe('locked');
    expect(
      getMissionStatus(secondMission, missions, progress, {
        ...settings,
        allowAllMissionsInLearning: true,
        preferredMode: 'learning',
      }),
    ).toBe('available');
    expect(
      getMissionStatus(
        secondMission,
        missions,
        { ...progress, completedMissionIds: ['mission-2'] },
        settings,
      ),
    ).toBe('completed');
  });

  it('berekent categorieen, hoogste moeilijkheid en volgende missie deterministisch', () => {
    const missions = [createMission({ id: 'mission-1' }), createMission({ id: 'mission-2' })];
    const questions = [
      createQuestion({ id: 'q-1', category: 'sanctie', difficulty: 2 }),
      createQuestion({ id: 'q-2', category: 'piste', difficulty: 4 }),
      createQuestion({ id: 'q-3', category: 'sanctie', difficulty: 1 }),
    ];

    expect(getMissionCategories(questions)).toEqual(['piste', 'sanctie']);
    expect(getMissionDifficulty(questions)).toBe(4);
    expect(getMissionDifficulty([])).toBe(1);
    expect(getNextMissionId(missions, 'mission-1')).toBe('mission-2');
    expect(getNextMissionId(missions, 'mission-2')).toBeNull();
  });
});

function createContent(overrides: Partial<GeneratedContent> = {}): GeneratedContent {
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
    missions: [createMission({ id: 'mission-1' })],
    questions: [createQuestion({ id: 'q-1' })],
    missionQuestionLinks: [{ missionId: 'mission-1', questionIds: ['q-1'] }],
    seasonValues: ['2025-2026', '2026-2027'],
    ...overrides,
  };
}

function createMission({ id }: { id: string }): MissionContent {
  return {
    id,
    roomId: 'room',
    title: id,
    story: 'Verhaal',
    articles: ['t.1'],
    tasks: [{ type: 'question', instruction: 'Vraag beantwoorden' }],
    passCondition: 'Rond af',
    reward: 'Beloning',
    reviewed: true,
  };
}

function createQuestion(
  overrides: Partial<MultipleChoiceQuestionContent> = {},
): MultipleChoiceQuestionContent {
  return {
    id: 'q-1',
    roomId: 'room',
    type: 'multiple-choice',
    category: 'piste',
    difficulty: 1,
    article: 't.90',
    sourcePage: 1,
    question: 'Vraag?',
    options: ['A', 'B'],
    correctAnswer: 0,
    hints: [],
    explanation: 'Uitleg.',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: true,
    reviewedBy: 'tester',
    ...overrides,
  };
}
