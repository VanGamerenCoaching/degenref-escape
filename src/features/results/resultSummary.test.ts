import { describe, expect, it } from 'vitest';
import type { QuestionContent } from '../../content/types';
import type { AnswerRecord, GameSession, ScoreState } from '../../storage/gameState';
import { buildPracticeAdvice, buildResultSummary } from './resultSummary';

const score: ScoreState = { correct: 0, incorrect: 0, points: 0, accuracy: 0 };

describe('resultSummary', () => {
  it('berekent totalen en kiest de zwakste categorie deterministisch', () => {
    const session = createSession({
      answers: [
        answer({ questionId: 'q1', category: 'piste', isCorrect: true }),
        answer({ questionId: 'q2', category: 'sanctie', isCorrect: false }),
        answer({ questionId: 'q3', category: 'sanctie', isCorrect: true }),
      ],
      questionOrder: ['q1', 'q2', 'q3', 'q4'],
      score: { correct: 2, incorrect: 1, points: 20, accuracy: 67 },
    });
    const summary = buildResultSummary(session, [
      question({ id: 'q1', category: 'piste' }),
      question({ id: 'q2', category: 'sanctie' }),
      question({ id: 'q3', category: 'sanctie' }),
      question({ id: 'q4', category: 'tijd' }),
    ]);

    expect(summary.correctAnswers).toBe(2);
    expect(summary.incorrectAnswers).toBe(1);
    expect(summary.skippedQuestions).toBe(1);
    expect(summary.accuracy).toBe(50);
    expect(summary.weakestCategory?.id).toBe('tijd');
    expect(summary.advice.some((item) => item.id === 'small-sample')).toBe(true);
  });

  it('markeert sterke categorieen pas bij minstens drie vragen en 80 procent', () => {
    const advice = buildPracticeAdvice({
      mode: 'practice',
      totalQuestions: 5,
      skippedQuestions: 0,
      usedHints: 0,
      weakestCategory: {
        id: 'tijd',
        label: 'tijd',
        total: 2,
        correct: 1,
        incorrect: 1,
        skipped: 0,
        usedHints: 0,
        accuracy: 50,
      },
      strongCategories: [
        {
          id: 'piste',
          label: 'piste',
          total: 3,
          correct: 3,
          incorrect: 0,
          skipped: 0,
          usedHints: 0,
          accuracy: 100,
        },
      ],
    });

    expect(advice.find((item) => item.id === 'strong-categories')?.text).toContain(
      'piste',
    );
  });

  it('geeft geen officiele slagingsclaim in examenmodus', () => {
    const advice = buildPracticeAdvice({
      mode: 'exam',
      totalQuestions: 8,
      skippedQuestions: 0,
      usedHints: 0,
      weakestCategory: null,
      strongCategories: [],
    });

    expect(advice.find((item) => item.id === 'exam-disclaimer')?.text).toContain(
      'geen officiele slagingsclaim',
    );
  });

  it('adviseert opnieuw spelen zonder hints bij veel hintgebruik', () => {
    const advice = buildPracticeAdvice({
      mode: 'practice',
      totalQuestions: 4,
      skippedQuestions: 0,
      usedHints: 2,
      weakestCategory: null,
      strongCategories: [],
    });

    expect(advice.some((item) => item.id === 'many-hints')).toBe(true);
  });

  it('berekent categorieen, niveaus, regelartikelen en verschil met beste score', () => {
    const session = createSession({
      answers: [
        answer({
          questionId: 'q1',
          category: 'piste',
          difficulty: 1,
          article: 't.90',
          isCorrect: true,
          pointsAwarded: 8,
          usedHintsAtAnswer: 1,
        }),
        answer({
          questionId: 'q2',
          category: 'piste',
          difficulty: 1,
          article: 't.91',
          isCorrect: false,
        }),
        answer({
          questionId: 'q3',
          category: 'sanctie',
          difficulty: 3,
          article: 't.124',
          isCorrect: true,
        }),
      ],
      previousBestScore: { correct: 2, incorrect: 0, points: 25, accuracy: 100 },
      questionOrder: ['q1', 'q2', 'q3'],
      score: { correct: 2, incorrect: 1, points: 18, accuracy: 67 },
    });
    const summary = buildResultSummary(session, [
      question({ id: 'q1', category: 'piste', difficulty: 1, article: 't.90' }),
      question({ id: 'q2', category: 'piste', difficulty: 1, article: 't.91' }),
      question({ id: 'q3', category: 'sanctie', difficulty: 3, article: 't.124' }),
    ]);

    expect(summary.categoryResults.find((group) => group.id === 'piste')).toMatchObject({
      total: 2,
      correct: 1,
      incorrect: 1,
      usedHints: 1,
      accuracy: 50,
    });
    expect(summary.difficultyResults.map((group) => group.label)).toEqual([
      'Niveau 1',
      'Niveau 3',
    ]);
    expect(summary.articles).toEqual(['t.124', 't.90', 't.91']);
    expect(summary.scoreDifference).toBe(-7);
    expect(summary.missionCompleted).toBe(true);
  });

  it('geeft een neutraal advies wanneer er geen sessievragen zijn gevonden', () => {
    const advice = buildPracticeAdvice({
      mode: 'learning',
      totalQuestions: 0,
      skippedQuestions: 0,
      usedHints: 0,
      weakestCategory: null,
      strongCategories: [],
    });

    expect(advice).toEqual([
      {
        id: 'empty-result',
        tone: 'notice',
        text: 'Er zijn geen vragen in deze sessie gevonden.',
      },
    ]);
  });
});

function question({
  article = 't.1',
  category,
  difficulty = 1,
  id,
}: {
  article?: string;
  category: string;
  difficulty?: number;
  id: string;
}): QuestionContent {
  return {
    id,
    roomId: 'room',
    type: 'multiple-choice',
    category,
    difficulty,
    article,
    sourcePage: 1,
    question: 'Vraag?',
    options: ['A', 'B'],
    correctAnswer: 0,
    hints: [],
    explanation: 'Uitleg',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: false,
    reviewedBy: '',
  };
}

function answer({
  article = 't.1',
  category,
  difficulty = 1,
  isCorrect,
  pointsAwarded,
  questionId,
  usedHintsAtAnswer = 0,
}: {
  article?: string;
  category: string;
  difficulty?: number;
  isCorrect: boolean;
  pointsAwarded?: number;
  questionId: string;
  usedHintsAtAnswer?: number;
}): AnswerRecord {
  const awardedPoints = pointsAwarded ?? (isCorrect ? 10 : 0);

  return {
    questionId,
    category,
    article,
    difficulty,
    value: 0,
    isCorrect,
    maxPoints: 10,
    hintPenalty: 10 - awardedPoints,
    pointsAwarded: awardedPoints,
    usedHintsAtAnswer,
    answeredAt: '2026-07-25T10:00:00.000Z',
    explanationVisible: true,
  };
}

function createSession({
  answers,
  mode = 'practice',
  previousBestScore = score,
  questionOrder,
  score: sessionScore,
}: {
  answers: AnswerRecord[];
  mode?: GameSession['mode'];
  previousBestScore?: ScoreState | null;
  questionOrder: string[];
  score: ScoreState;
}): GameSession {
  return {
    id: 'session',
    mode,
    selectedSeason: '2025-2026',
    missionId: 'mission',
    previousBestScore,
    currentQuestionId: null,
    currentQuestionIndex: questionOrder.length,
    questionOrder,
    answers,
    score: sessionScore,
    usedHints: {},
    remainingLives: 2,
    startedAt: '2026-07-25T09:00:00.000Z',
    lastActivityAt: '2026-07-25T10:00:00.000Z',
    completedAt: '2026-07-25T10:00:00.000Z',
  };
}
