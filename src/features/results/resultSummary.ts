import type { QuestionContent } from '../../content/types';
import { SCORE_POINTS_PER_CORRECT_ANSWER } from '../../storage/gameRules';
import type { AnswerRecord, GameMode, GameSession, ScoreState } from '../../storage/gameState';

export interface ResultGroupStat {
  id: string;
  label: string;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  usedHints: number;
  accuracy: number;
}

export interface AdviceItem {
  id: string;
  tone: 'focus' | 'strong' | 'notice';
  text: string;
}

export interface ResultSummary {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  usedHints: number;
  remainingLives: number | null;
  scorePoints: number;
  maxPoints: number;
  accuracy: number;
  categoryResults: ResultGroupStat[];
  difficultyResults: ResultGroupStat[];
  articles: string[];
  missionCompleted: boolean;
  previousBestScore: ScoreState | null;
  scoreDifference: number | null;
  weakestCategory: ResultGroupStat | null;
  strongCategories: ResultGroupStat[];
  advice: AdviceItem[];
}

interface MutableGroupStat {
  id: string;
  label: string;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  usedHints: number;
}

export function buildResultSummary(
  session: GameSession,
  questions: readonly QuestionContent[],
): ResultSummary {
  const answerByQuestionId = new Map(
    session.answers.map((answer) => [answer.questionId, answer]),
  );
  const orderedQuestions = session.questionOrder.flatMap((questionId) => {
    const question = questions.find((candidate) => candidate.id === questionId);
    return question === undefined ? [] : [question];
  });
  const totalQuestions = orderedQuestions.length;
  const correctAnswers = countAnswers(session.answers, true);
  const incorrectAnswers = countAnswers(session.answers, false);
  const skippedQuestions = Math.max(0, totalQuestions - session.answers.length);
  const usedHints = Object.values(session.usedHints).reduce(
    (total, hintCount) => total + hintCount,
    0,
  );
  const maxPoints = totalQuestions * SCORE_POINTS_PER_CORRECT_ANSWER;
  const accuracy =
    totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);
  const categoryResults = collectGroups(
    orderedQuestions,
    answerByQuestionId,
    (question) => question.category,
    (question) => question.category,
  );
  const difficultyResults = collectGroups(
    orderedQuestions,
    answerByQuestionId,
    (question) => String(question.difficulty),
    (question) => `Niveau ${question.difficulty}`,
  );
  const weakestCategory = findWeakestCategory(categoryResults);
  const strongCategories = categoryResults.filter(
    (group) => group.total >= 3 && group.accuracy >= 80,
  );
  const previousBestScore = session.previousBestScore;
  const scoreDifference =
    previousBestScore === null ? null : session.score.points - previousBestScore.points;

  return {
    totalQuestions,
    answeredQuestions: session.answers.length,
    correctAnswers,
    incorrectAnswers,
    skippedQuestions,
    usedHints,
    remainingLives: session.remainingLives,
    scorePoints: session.score.points,
    maxPoints,
    accuracy,
    categoryResults,
    difficultyResults,
    articles: [...new Set(orderedQuestions.map((question) => question.article))].sort(),
    missionCompleted: session.completedAt !== null && skippedQuestions === 0,
    previousBestScore,
    scoreDifference,
    weakestCategory,
    strongCategories,
    advice: buildPracticeAdvice({
      mode: session.mode,
      totalQuestions,
      skippedQuestions,
      usedHints,
      weakestCategory,
      strongCategories,
    }),
  };
}

export function buildPracticeAdvice({
  mode,
  totalQuestions,
  skippedQuestions,
  usedHints,
  weakestCategory,
  strongCategories,
}: {
  mode: GameMode;
  totalQuestions: number;
  skippedQuestions: number;
  usedHints: number;
  weakestCategory: ResultGroupStat | null;
  strongCategories: readonly ResultGroupStat[];
}): AdviceItem[] {
  const advice: AdviceItem[] = [];

  if (totalQuestions === 0) {
    return [
      {
        id: 'empty-result',
        tone: 'notice',
        text: 'Er zijn geen vragen in deze sessie gevonden.',
      },
    ];
  }

  if (weakestCategory !== null) {
    advice.push({
      id: 'weakest-category',
      tone: 'focus',
      text: `Beste verbeterpunt: ${weakestCategory.label} met ${weakestCategory.accuracy}% correct.`,
    });

    if (weakestCategory.total < 3) {
      advice.push({
        id: 'small-sample',
        tone: 'notice',
        text: `Let op: ${weakestCategory.label} is gebaseerd op minder dan drie vragen.`,
      });
    }
  }

  if (strongCategories.length > 0) {
    advice.push({
      id: 'strong-categories',
      tone: 'strong',
      text: `Sterk onderdeel: ${strongCategories
        .map((category) => category.label)
        .join(', ')}.`,
    });
  }

  if (usedHints >= Math.max(2, Math.ceil(totalQuestions * 0.25))) {
    advice.push({
      id: 'many-hints',
      tone: 'focus',
      text: 'Je gebruikte relatief veel hints. Speel deze missie nog eens zonder hints om besluitvorming te automatiseren.',
    });
  }

  if (skippedQuestions > 0) {
    advice.push({
      id: 'skipped-questions',
      tone: 'focus',
      text: 'Er zijn vragen overgeslagen of onbeantwoord gebleven. Oefen die eerst opnieuw.',
    });
  }

  if (mode === 'exam') {
    advice.push({
      id: 'exam-disclaimer',
      tone: 'notice',
      text: 'Examenmodus geeft geen officiele slagingsclaim. Gebruik het resultaat alleen als oefensignaal.',
    });
  }

  return advice;
}

function collectGroups(
  questions: readonly QuestionContent[],
  answerByQuestionId: ReadonlyMap<string, AnswerRecord>,
  getId: (question: QuestionContent) => string,
  getLabel: (question: QuestionContent) => string,
): ResultGroupStat[] {
  const groups = new Map<string, MutableGroupStat>();

  for (const question of questions) {
    const id = getId(question);
    const group =
      groups.get(id) ??
      {
        id,
        label: getLabel(question),
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        usedHints: 0,
      };
    const answer = answerByQuestionId.get(question.id);

    group.total += 1;
    if (answer === undefined) {
      group.skipped += 1;
    } else if (answer.isCorrect) {
      group.correct += 1;
    } else {
      group.incorrect += 1;
    }
    group.usedHints += answer?.usedHintsAtAnswer ?? 0;
    groups.set(id, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      accuracy: group.total === 0 ? 0 : Math.round((group.correct / group.total) * 100),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'nl'));
}

function countAnswers(answers: readonly AnswerRecord[], correct: boolean): number {
  return answers.filter((answer) => answer.isCorrect === correct).length;
}

function findWeakestCategory(
  categoryResults: readonly ResultGroupStat[],
): ResultGroupStat | null {
  if (categoryResults.length === 0) {
    return null;
  }

  return [...categoryResults].sort(
    (left, right) =>
      left.accuracy - right.accuracy ||
      right.total - left.total ||
      left.label.localeCompare(right.label, 'nl'),
  )[0] ?? null;
}
