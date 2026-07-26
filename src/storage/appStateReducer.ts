import { createGameSession, revealHint, submitAnswer } from './gameRules';
import type {
  AnswerValue,
  AppSettings,
  GameSession,
  PersistedAppState,
} from './gameState';
import type { QuestionContent } from '../content/types';
import { createDefaultAppState, createInitialProgress } from './localStorageState';

export type AppStateAction =
  | {
      type: 'update-settings';
      settings: Partial<AppSettings>;
      missionIds: string[];
      now: string;
    }
  | {
      type: 'start-session';
      missionId: string;
      mode: AppSettings['preferredMode'];
      selectedSeason: string;
      questionIds: string[];
      now: string;
    }
  | { type: 'replace-session'; session: GameSession; now: string }
  | {
      type: 'submit-answer';
      question: QuestionContent;
      value: AnswerValue;
      missionIds: string[];
      now: string;
    }
  | { type: 'use-hint'; question: QuestionContent; now: string }
  | { type: 'clear-active-session'; now: string }
  | { type: 'reset-all'; missionIds: string[]; seasons: string[]; now: string };

export function appStateReducer(
  state: PersistedAppState,
  action: AppStateAction,
): PersistedAppState {
  switch (action.type) {
    case 'update-settings': {
      const settings = { ...state.settings, ...action.settings };

      return {
        ...state,
        settings,
        activeSession: settings.resultsStorageEnabled ? state.activeSession : null,
        progress: settings.resultsStorageEnabled
          ? state.progress
          : createInitialProgress(action.missionIds),
        lastActivityAt: action.now,
      };
    }
    case 'start-session': {
      const previousBestScore =
        state.progress.missionStats[action.missionId]?.bestScore ?? null;
      const activeSession = createGameSession({ ...action, previousBestScore });
      return {
        ...state,
        settings: {
          ...state.settings,
          preferredMode: action.mode,
          selectedSeason: action.selectedSeason,
        },
        activeSession,
        progress: {
          ...state.progress,
          missionStats: {
            ...state.progress.missionStats,
            [action.missionId]: {
              attempts: (state.progress.missionStats[action.missionId]?.attempts ?? 0) + 1,
              bestScore: state.progress.missionStats[action.missionId]?.bestScore ?? null,
              lastCompletedAt:
                state.progress.missionStats[action.missionId]?.lastCompletedAt ?? null,
            },
          },
        },
        lastActivityAt: action.now,
      };
    }
    case 'replace-session':
      return { ...state, activeSession: action.session, lastActivityAt: action.now };
    case 'submit-answer': {
      if (state.activeSession === null) {
        return state;
      }
      const activeSession = submitAnswer(
        state.activeSession,
        action.question,
        action.value,
        action.now,
      );
      const latestAnswer = activeSession.answers.at(-1);
      const completed =
        activeSession.completedAt !== null &&
        state.activeSession.completedAt === null;
      const progress = {
        ...state.progress,
        completedMissionIds: completed
          ? [...new Set([...state.progress.completedMissionIds, activeSession.missionId])]
          : state.progress.completedMissionIds,
        unlockedMissionIds: unlockNextMission(
          state.progress.unlockedMissionIds,
          action.missionIds,
          activeSession.missionId,
          completed,
        ),
        errorsByCategory:
          latestAnswer !== undefined && !latestAnswer.isCorrect
            ? {
                ...state.progress.errorsByCategory,
                [latestAnswer.category]:
                  (state.progress.errorsByCategory[latestAnswer.category] ?? 0) + 1,
              }
            : state.progress.errorsByCategory,
        missionStats: completed
          ? {
              ...state.progress.missionStats,
              [activeSession.missionId]: {
                attempts:
                  state.progress.missionStats[activeSession.missionId]?.attempts ?? 1,
                bestScore: chooseBestScore(
                  state.progress.missionStats[activeSession.missionId]?.bestScore ?? null,
                  activeSession.score,
                ),
                lastCompletedAt: action.now,
              },
            }
          : state.progress.missionStats,
      };

      return { ...state, activeSession, progress, lastActivityAt: action.now };
    }
    case 'use-hint':
      return state.activeSession === null
        ? state
        : {
            ...state,
            activeSession: revealHint(state.activeSession, action.question, action.now),
            lastActivityAt: action.now,
          };
    case 'clear-active-session':
      return { ...state, activeSession: null, lastActivityAt: action.now };
    case 'reset-all':
      return createDefaultAppState(action.missionIds, action.now, action.seasons);
  }
}

function unlockNextMission(
  unlockedMissionIds: string[],
  missionIds: string[],
  missionId: string,
  completed: boolean,
): string[] {
  if (!completed) {
    return unlockedMissionIds;
  }
  const nextMissionId = missionIds[missionIds.indexOf(missionId) + 1];
  return nextMissionId === undefined
    ? unlockedMissionIds
    : [...new Set([...unlockedMissionIds, nextMissionId])];
}

function chooseBestScore(
  currentScore: PersistedAppState['progress']['missionStats'][string]['bestScore'],
  candidateScore: GameSession['score'],
): GameSession['score'] {
  if (currentScore === null) {
    return candidateScore;
  }
  return candidateScore.points > currentScore.points ? candidateScore : currentScore;
}
