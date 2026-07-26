import { describe, expect, it } from 'vitest';
import type { GeneratedContent, MissionContent, MultipleChoiceQuestionContent } from './types';
import { formatContentIssues, validateContent } from './validation';

describe('validateContent', () => {
  it('accepteert geldige content en markeert niet-gecontroleerde vragen als waarschuwing', () => {
    const result = validateContent(createContent());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map((warning) => warning.code)).toContain('question-unreviewed');
  });

  it('rapporteert dubbele vraag-ID’s en ongeldige correcte antwoorden', () => {
    const question = createQuestion({ id: 'q-duplicate', correctAnswer: 4 });
    const result = validateContent(
      createContent({
        questions: [question, { ...question }],
        missionQuestionLinks: [{ missionId: 'mission-1', questionIds: ['q-duplicate'] }],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['question-id-duplicate', 'question-correct-answer']),
    );
  });

  it('controleert verplichte vraagvelden, vraagtype en reviewstatus', () => {
    const invalidContent = {
      ...createContent(),
      questions: [
        {
          ...createQuestion({ id: 'q-bad' }),
          article: '',
          category: '',
          explanation: '',
          question: '',
          reviewed: 'nee',
          rulesVersion: '',
          type: 'unsupported',
        },
      ],
      missionQuestionLinks: [{ missionId: 'mission-1', questionIds: ['q-bad'] }],
    };

    const result = validateContent(invalidContent);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        'question-type',
        'question-text',
        'question-explanation',
        'question-category',
        'question-article',
        'question-version',
        'question-review',
      ]),
    );
  });

  it('controleert missiekoppelingen, onbekende missies en onbekende vragen', () => {
    const result = validateContent(
      createContent({
        missions: [createMission({ id: 'mission-1' }), createMission({ id: 'mission-2' })],
        missionQuestionLinks: [
          { missionId: 'mission-1', questionIds: [] },
          { missionId: 'unknown-mission', questionIds: ['unknown-question'] },
        ],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        'mission-no-questions',
        'unknown-mission',
        'unknown-question',
        'mission-no-link',
      ]),
    );
  });

  it('weigert dubbele vraagkoppelingen tussen fases', () => {
    const question = createQuestion({ id: 'q-shared' });
    const result = validateContent(
      createContent({
        missions: [createMission({ id: 'mission-1' }), createMission({ id: 'mission-2' })],
        questions: [question],
        missionQuestionLinks: [
          { missionId: 'mission-1', questionIds: ['q-shared'] },
          { missionId: 'mission-2', questionIds: ['q-shared'] },
        ],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain(
      'duplicate-mission-question-link',
    );
  });

  it('formatteert fouten en waarschuwingen leesbaar voor scripts en laadschermen', () => {
    const result = validateContent(
      createContent({
        missionQuestionLinks: [{ missionId: 'unknown-mission', questionIds: [] }],
      }),
    );

    const formatted = formatContentIssues(result);

    expect(formatted).toContain('unknown-mission:');
    expect(formatted).toContain('question-unreviewed:');
  });

  it('weigert content die geen object is', () => {
    const result = validateContent(null);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { code: 'content-format', message: 'Content is geen object.' },
    ]);
  });
});

function createContent(overrides: Partial<GeneratedContent> = {}): GeneratedContent {
  const question = createQuestion();

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
    rooms: [
      {
        id: 'room-1',
        title: 'Wedstrijdzaal',
        subtitle: 'Basis',
        articles: 't.1',
      },
    ],
    lessons: [],
    missions: [createMission({ id: 'mission-1' })],
    questions: [question],
    missionQuestionLinks: [{ missionId: 'mission-1', questionIds: [question.id] }],
    seasonValues: ['2025-2026'],
    ...overrides,
  };
}

function createMission({ id }: { id: string }): MissionContent {
  return {
    id,
    roomId: 'room-1',
    title: `Missie ${id}`,
    story: 'Leercontext',
    articles: ['t.1'],
    tasks: [{ type: 'question', instruction: 'Beantwoord de vraag.' }],
    passCondition: 'Rond de vraag af.',
    reward: 'Nieuwe ruimte open.',
    reviewed: false,
  };
}

function createQuestion(
  overrides: Partial<MultipleChoiceQuestionContent> = {},
): MultipleChoiceQuestionContent {
  return {
    id: 'q-1',
    roomId: 'room-1',
    type: 'multiple-choice',
    category: 'procedure',
    difficulty: 1,
    article: 't.1',
    sourcePage: 1,
    question: 'Wat doet de scheidsrechter?',
    options: ['Starten', 'Stoppen'],
    correctAnswer: 0,
    hints: ['Lees de procedure.'],
    explanation: 'De procedure volgt uit het artikel.',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: false,
    reviewedBy: '',
    ...overrides,
  };
}
