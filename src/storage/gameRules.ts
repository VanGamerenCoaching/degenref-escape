import type { QuestionContent } from '../content/types';
import type {
  AnswerRecord,
  AnswerValue,
  GameMode,
  GameSession,
  ScoreState,
} from './gameState';

export const SCORE_POINTS_PER_CORRECT_ANSWER = 10;
export const PRACTICE_HINT_PENALTY_POINTS = 2;
export const DEFAULT_PRACTICE_LIVES = 3;

export function createInitialScore(): ScoreState {
  return { correct: 0, incorrect: 0, points: 0, accuracy: 0 };
}

export function createGameSession({
  missionId,
  mode,
  now,
  questionIds,
  selectedSeason,
  previousBestScore = null,
}: {
  missionId: string;
  mode: GameMode;
  selectedSeason: string;
  questionIds: string[];
  now: string;
  previousBestScore?: ScoreState | null;
}): GameSession {
  return {
    id: `session-${missionId}-${now}`,
    mode,
    selectedSeason,
    missionId,
    previousBestScore,
    currentQuestionId: questionIds[0] ?? null,
    currentQuestionIndex: 0,
    questionOrder: [...questionIds],
    answers: [],
    score: createInitialScore(),
    usedHints: {},
    remainingLives: mode === 'practice' ? DEFAULT_PRACTICE_LIVES : null,
    startedAt: now,
    lastActivityAt: now,
    completedAt: questionIds.length === 0 ? now : null,
  };
}

export function calculateScore(answers: readonly AnswerRecord[]): ScoreState {
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const incorrect = answers.length - correct;
  const total = answers.length;

  return {
    correct,
    incorrect,
    points: answers.reduce((points, answer) => points + answer.pointsAwarded, 0),
    accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

export function getAllowedHints(mode: GameMode, availableHints: number): number {
  if (mode === 'exam') {
    return 0;
  }

  if (mode === 'practice') {
    return Math.min(2, availableHints);
  }

  return availableHints;
}

export function getHintPenalty(mode: GameMode, usedHints: number): number {
  return mode === 'practice' ? usedHints * PRACTICE_HINT_PENALTY_POINTS : 0;
}

export function revealHint(
  session: GameSession,
  question: QuestionContent,
  now: string,
): GameSession {
  const usedHints = session.usedHints[question.id] ?? 0;
  const allowedHints = getAllowedHints(session.mode, question.hints.length);

  if (usedHints >= allowedHints) {
    return session;
  }

  return {
    ...session,
    usedHints: { ...session.usedHints, [question.id]: usedHints + 1 },
    lastActivityAt: now,
  };
}

export function submitAnswer(
  session: GameSession,
  question: QuestionContent,
  value: AnswerValue,
  now: string,
): GameSession {
  if (session.completedAt !== null || session.currentQuestionId !== question.id) {
    return session;
  }

  const isCorrect = isCorrectAnswer(question, value);
  const usedHintsAtAnswer = session.usedHints[question.id] ?? 0;
  const hintPenalty = getHintPenalty(session.mode, usedHintsAtAnswer);
  const pointsAwarded = isCorrect
    ? Math.max(0, SCORE_POINTS_PER_CORRECT_ANSWER - hintPenalty)
    : 0;
  const answer: AnswerRecord = {
    questionId: question.id,
    category: question.category,
    article: question.article,
    difficulty: question.difficulty,
    value,
    isCorrect,
    maxPoints: SCORE_POINTS_PER_CORRECT_ANSWER,
    hintPenalty,
    pointsAwarded,
    usedHintsAtAnswer,
    answeredAt: now,
    explanationVisible: session.mode !== 'exam',
  };
  const answers = [...session.answers, answer];
  const nextIndex = session.currentQuestionIndex + 1;
  const remainingLives =
    !isCorrect && session.remainingLives !== null
      ? Math.max(0, session.remainingLives - 1)
      : session.remainingLives;
  const completedAt =
    nextIndex >= session.questionOrder.length || remainingLives === 0 ? now : null;

  return {
    ...session,
    answers,
    score: calculateScore(answers),
    remainingLives,
    currentQuestionIndex: nextIndex,
    currentQuestionId: completedAt === null ? session.questionOrder[nextIndex] ?? null : null,
    lastActivityAt: now,
    completedAt,
  };
}

export function isCorrectAnswer(question: QuestionContent, value: AnswerValue): boolean {
  if (question.type === 'sequence') {
    const numericValue = getNumberArray(value);

    return (
      numericValue.length === question.correctAnswer.length &&
      question.correctAnswer.every((item, index) => numericValue[index] === item)
    );
  }

  if (Array.isArray(question.correctAnswer)) {
    const numericValue = getNumberArray(value);

    return (
      numericValue.length === question.correctAnswer.length &&
      question.correctAnswer.every((item) => numericValue.includes(item))
    );
  }

  return value === question.correctAnswer;
}

function getNumberArray(value: AnswerValue): number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
    ? value
    : [];
}
