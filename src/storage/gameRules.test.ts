import { describe, expect, it } from 'vitest';
import type { QuestionContent } from '../content/types';
import type { AnswerRecord } from './gameState';
import {
  DEFAULT_PRACTICE_LIVES,
  SCORE_POINTS_PER_CORRECT_ANSWER,
  calculateScore,
  createGameSession,
  getAllowedHints,
  getHintPenalty,
  isCorrectAnswer,
  revealHint,
  submitAnswer,
} from './gameRules';

describe('gameRules', () => {
  it('beoordeelt meerkeuze en meervoudige antwoorden op stabiele optie-ID’s', () => {
    expect(isCorrectAnswer(multipleChoiceQuestion(), 1)).toBe(true);
    expect(isCorrectAnswer(multipleChoiceQuestion(), 0)).toBe(false);
    expect(isCorrectAnswer(multipleChoiceQuestion({ correctAnswer: [0, 2] }), [2, 0])).toBe(
      true,
    );
    expect(isCorrectAnswer(multipleChoiceQuestion({ correctAnswer: [0, 2] }), [0])).toBe(
      false,
    );
    expect(isCorrectAnswer(multipleChoiceQuestion({ correctAnswer: [0, 2] }), [0, 1, 2])).toBe(
      false,
    );
    expect(isCorrectAnswer(multipleChoiceQuestion({ correctAnswer: [0, 2] }), ['0', '2'])).toBe(
      false,
    );
  });

  it('beoordeelt volgordevragen op stabiele item-ID’s', () => {
    const sequenceQuestion = sequenceQuestionFixture();

    expect(isCorrectAnswer(sequenceQuestion, [0, 1, 2])).toBe(true);
    expect(isCorrectAnswer(sequenceQuestion, [1, 0, 2])).toBe(false);
    expect(isCorrectAnswer(sequenceQuestion, [0, 1])).toBe(false);
    expect(isCorrectAnswer(sequenceQuestion, ['0', '1', '2'])).toBe(false);
  });

  it('beperkt hints per modus', () => {
    expect(getAllowedHints('learning', 4)).toBe(4);
    expect(getAllowedHints('practice', 4)).toBe(2);
    expect(getAllowedHints('exam', 4)).toBe(0);
    expect(getHintPenalty('learning', 3)).toBe(0);
    expect(getHintPenalty('exam', 3)).toBe(0);
    expect(getHintPenalty('practice', 3)).toBe(6);
  });

  it('verlaagt levens en punten in oefenmodus', () => {
    const question = multipleChoiceQuestion();
    const session = createGameSession({
      missionId: 'mission',
      mode: 'practice',
      selectedSeason: '2025-2026',
      questionIds: [question.id],
      now: '2026-07-25T10:00:00.000Z',
    });
    const withHint = revealHint(session, question, '2026-07-25T10:01:00.000Z');
    const answered = submitAnswer(
      withHint,
      question,
      0,
      '2026-07-25T10:02:00.000Z',
    );

    expect(withHint.usedHints[question.id]).toBe(1);
    expect(answered.remainingLives).toBe(DEFAULT_PRACTICE_LIVES - 1);
    expect(answered.score.points).toBe(0);
    expect(answered.completedAt).not.toBeNull();
  });

  it('berekent score uit beantwoorde vragen zonder onbeantwoorde vragen mee te nemen', () => {
    const score = calculateScore([
      answerRecord({ isCorrect: true, pointsAwarded: 10 }),
      answerRecord({ isCorrect: false, pointsAwarded: 0 }),
      answerRecord({ isCorrect: true, pointsAwarded: 8 }),
    ]);

    expect(score).toEqual({
      correct: 2,
      incorrect: 1,
      points: 18,
      accuracy: 67,
    });
  });

  it('laat leren onbeperkt binnen de beschikbare hints zonder puntenaftrek of levensverlies', () => {
    const question = multipleChoiceQuestion({
      hints: ['Hint 1', 'Hint 2', 'Hint 3'],
    });
    const session = createGameSession({
      missionId: 'mission',
      mode: 'learning',
      selectedSeason: '2025-2026',
      questionIds: [question.id],
      now: '2026-07-25T10:00:00.000Z',
    });

    const withHints = [
      '2026-07-25T10:01:00.000Z',
      '2026-07-25T10:02:00.000Z',
      '2026-07-25T10:03:00.000Z',
      '2026-07-25T10:04:00.000Z',
    ].reduce((currentSession, now) => revealHint(currentSession, question, now), session);
    const answered = submitAnswer(
      withHints,
      question,
      1,
      '2026-07-25T10:05:00.000Z',
    );

    expect(withHints.usedHints[question.id]).toBe(3);
    expect(answered.remainingLives).toBeNull();
    expect(answered.answers[0]?.hintPenalty).toBe(0);
    expect(answered.score.points).toBe(SCORE_POINTS_PER_CORRECT_ANSWER);
    expect(answered.answers[0]?.explanationVisible).toBe(true);
  });

  it('past oefenhints toe met maximaal twee hints en aftrek op correcte antwoorden', () => {
    const question = multipleChoiceQuestion({
      hints: ['Hint 1', 'Hint 2', 'Hint 3'],
    });
    const session = createGameSession({
      missionId: 'mission',
      mode: 'practice',
      selectedSeason: '2025-2026',
      questionIds: [question.id],
      now: '2026-07-25T10:00:00.000Z',
    });

    const withHints = [
      '2026-07-25T10:01:00.000Z',
      '2026-07-25T10:02:00.000Z',
      '2026-07-25T10:03:00.000Z',
    ].reduce((currentSession, now) => revealHint(currentSession, question, now), session);
    const answered = submitAnswer(
      withHints,
      question,
      1,
      '2026-07-25T10:04:00.000Z',
    );

    expect(withHints.usedHints[question.id]).toBe(2);
    expect(answered.answers[0]?.hintPenalty).toBe(4);
    expect(answered.score.points).toBe(6);
  });

  it('houdt examenmodus zonder hints, zonder levens en zonder tussentijdse uitleg', () => {
    const firstQuestion = multipleChoiceQuestion({ id: 'q-first' });
    const secondQuestion = multipleChoiceQuestion({ id: 'q-second', correctAnswer: 0 });
    const session = createGameSession({
      missionId: 'mission',
      mode: 'exam',
      selectedSeason: '2025-2026',
      questionIds: [firstQuestion.id, secondQuestion.id],
      now: '2026-07-25T10:00:00.000Z',
    });
    const attemptedHint = revealHint(session, firstQuestion, '2026-07-25T10:01:00.000Z');
    const afterFirst = submitAnswer(
      attemptedHint,
      firstQuestion,
      1,
      '2026-07-25T10:02:00.000Z',
    );
    const completed = submitAnswer(
      afterFirst,
      secondQuestion,
      0,
      '2026-07-25T10:03:00.000Z',
    );

    expect(attemptedHint).toBe(session);
    expect(session.remainingLives).toBeNull();
    expect(session.questionOrder).toEqual(['q-first', 'q-second']);
    expect(afterFirst.currentQuestionId).toBe('q-second');
    expect(afterFirst.answers[0]?.explanationVisible).toBe(false);
    expect(completed.completedAt).toBe('2026-07-25T10:03:00.000Z');
  });

  it('negeert antwoorden voor een andere vraag of een afgeronde sessie', () => {
    const firstQuestion = multipleChoiceQuestion({ id: 'q-first' });
    const secondQuestion = multipleChoiceQuestion({ id: 'q-second' });
    const session = createGameSession({
      missionId: 'mission',
      mode: 'practice',
      selectedSeason: '2025-2026',
      questionIds: [firstQuestion.id],
      now: '2026-07-25T10:00:00.000Z',
    });

    const wrongQuestion = submitAnswer(
      session,
      secondQuestion,
      1,
      '2026-07-25T10:01:00.000Z',
    );
    const completed = submitAnswer(
      session,
      firstQuestion,
      1,
      '2026-07-25T10:02:00.000Z',
    );
    const afterCompletion = submitAnswer(
      completed,
      firstQuestion,
      1,
      '2026-07-25T10:03:00.000Z',
    );

    expect(wrongQuestion).toBe(session);
    expect(afterCompletion).toBe(completed);
  });

  it('rondt een lege sessie direct af', () => {
    const session = createGameSession({
      missionId: 'mission',
      mode: 'learning',
      selectedSeason: '2025-2026',
      questionIds: [],
      now: '2026-07-25T10:00:00.000Z',
    });

    expect(session.currentQuestionId).toBeNull();
    expect(session.completedAt).toBe('2026-07-25T10:00:00.000Z');
  });
});

function multipleChoiceQuestion({
  correctAnswer = 1,
  ...overrides
}: Partial<Extract<QuestionContent, { type: 'multiple-choice' }>> & {
  correctAnswer?: number | number[];
} = {}): Extract<QuestionContent, { type: 'multiple-choice' }> {
  return {
    id: 'q-mc',
    roomId: 'room',
    type: 'multiple-choice',
    category: 'sanctie',
    difficulty: 1,
    article: 't.1',
    sourcePage: 1,
    question: 'Kies',
    options: ['A', 'B', 'C'],
    correctAnswer,
    hints: ['Denk aan de procedure'],
    explanation: 'Uitleg',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: false,
    reviewedBy: '',
    ...overrides,
  };
}

function sequenceQuestionFixture(
  overrides: Partial<Extract<QuestionContent, { type: 'sequence' }>> = {},
): Extract<QuestionContent, { type: 'sequence' }> {
  return {
    id: 'q-seq',
    roomId: 'room',
    type: 'sequence',
    category: 'procedure',
    difficulty: 1,
    article: 't.1',
    sourcePage: 1,
    question: 'Zet in volgorde',
    items: ['Eerst', 'Dan', 'Laatst'],
    correctAnswer: [0, 1, 2],
    hints: [],
    explanation: 'Uitleg',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: false,
    reviewedBy: '',
    ...overrides,
  };
}

function answerRecord({
  isCorrect,
  pointsAwarded,
}: {
  isCorrect: boolean;
  pointsAwarded: number;
}): AnswerRecord {
  return {
    questionId: `q-${pointsAwarded}-${isCorrect ? 'correct' : 'incorrect'}`,
    category: 'procedure',
    article: 't.1',
    difficulty: 1,
    value: 0,
    isCorrect,
    maxPoints: 10,
    hintPenalty: 10 - pointsAwarded,
    pointsAwarded,
    usedHintsAtAnswer: 0,
    answeredAt: '2026-07-25T10:00:00.000Z',
    explanationVisible: true,
  };
}
