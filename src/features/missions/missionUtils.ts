import type { GeneratedContent, MissionContent, QuestionContent } from '../../content/types';
import type { AppSettings, GameProgress } from '../../storage/gameState';

export type MissionStatus = 'locked' | 'available' | 'completed';

export function getMissionQuestionIds(
  content: GeneratedContent,
  missionId: string,
): string[] {
  return (
    content.missionQuestionLinks.find((link) => link.missionId === missionId)
      ?.questionIds ?? []
  );
}

export function getMissionQuestions(
  content: GeneratedContent,
  missionId: string,
): QuestionContent[] {
  const questionsById = new Map(content.questions.map((question) => [question.id, question]));

  return getMissionQuestionIds(content, missionId).flatMap((questionId) => {
    const question = questionsById.get(questionId);
    return question === undefined ? [] : [question];
  });
}

export function selectSessionQuestions(
  content: GeneratedContent,
  missionId: string,
  settings: AppSettings,
): QuestionContent[] {
  const missionQuestions = getMissionQuestions(content, missionId);
  const seasonQuestions = missionQuestions.filter((question) =>
    matchesSelectedSeason(question, settings.selectedSeason),
  );
  const reviewQuestions = seasonQuestions.filter(
    (question) => question.reviewed || !settings.excludeUnreviewedQuestions,
  );
  const levelQuestions = reviewQuestions.filter((question) =>
    matchesExperienceLevel(question, settings.experienceLevel),
  );

  return levelQuestions.length > 0 ? levelQuestions : reviewQuestions;
}

export function matchesSelectedSeason(
  question: QuestionContent,
  selectedSeason: string,
): boolean {
  if (question.article !== 't.124') {
    return true;
  }

  const searchableText = `${question.question} ${question.explanation}`.toLowerCase();
  const mentions2025 = searchableText.includes('2025-2026');
  const mentions2026 = searchableText.includes('2026-2027');

  if (mentions2025 && !mentions2026) {
    return selectedSeason === '2025-2026';
  }

  if (mentions2026 && !mentions2025) {
    return selectedSeason === '2026-2027';
  }

  return true;
}

export function matchesExperienceLevel(
  question: QuestionContent,
  experienceLevel: AppSettings['experienceLevel'],
): boolean {
  if (experienceLevel === 'beginner') {
    return question.difficulty <= 2;
  }

  if (experienceLevel === 'exam-training') {
    return question.difficulty >= 2;
  }

  return true;
}

export function getMissionStatus(
  mission: MissionContent,
  progress: GameProgress,
): MissionStatus {
  if (progress.completedMissionIds.includes(mission.id)) {
    return 'completed';
  }

  return 'available';
}

export function getMissionCategories(questions: readonly QuestionContent[]): string[] {
  return [...new Set(questions.map((question) => question.category))].sort();
}

export function getMissionDifficulty(questions: readonly QuestionContent[]): number {
  if (questions.length === 0) {
    return 1;
  }

  return Math.max(...questions.map((question) => question.difficulty));
}

export function getNextMissionId(
  missions: readonly MissionContent[],
  missionId: string,
): string | null {
  const nextMission = missions[missions.findIndex((mission) => mission.id === missionId) + 1];
  return nextMission?.id ?? null;
}
