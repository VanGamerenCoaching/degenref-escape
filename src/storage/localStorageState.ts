import { createInitialScore } from './gameRules';
import type {
  AppSettings,
  GameProgress,
  PersistedAppState,
  SeasonValue,
} from './gameState';
import { REVIEW_NOTES_STORAGE_KEY } from './reviewNotesStorage';

export const STORAGE_KEY = 'degenref-escape-state';
export const USED_LOCAL_STORAGE_KEYS = [STORAGE_KEY, REVIEW_NOTES_STORAGE_KEY] as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createDefaultSettings(seasons: readonly string[]): AppSettings {
  return {
    selectedSeason: seasons[0] ?? '2025-2026',
    preferredMode: 'learning',
    experienceLevel: 'beginner',
    soundEnabled: true,
    reduceMotion: 'system',
    showRuleReferences: true,
    allowAllMissionsInLearning: false,
    excludeUnreviewedQuestions: false,
    resultsStorageEnabled: true,
  };
}

export function createInitialProgress(missionIds: readonly string[]): GameProgress {
  return {
    completedMissionIds: [],
    unlockedMissionIds: missionIds[0] === undefined ? [] : [missionIds[0]],
    missionStats: {},
    errorsByCategory: {},
  };
}

export function createDefaultAppState(
  missionIds: readonly string[],
  now: string,
  seasons: readonly string[],
): PersistedAppState {
  return {
    schemaVersion: 1,
    settings: createDefaultSettings(seasons),
    activeSession: null,
    progress: createInitialProgress(missionIds),
    startedAt: now,
    lastActivityAt: now,
  };
}

export function loadAppState(
  storage: StorageLike,
  missionIds: readonly string[],
  now: string,
  seasons: readonly string[],
): PersistedAppState {
  const rawValue = storage.getItem(STORAGE_KEY);

  if (rawValue === null) {
    return createDefaultAppState(missionIds, now, seasons);
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<PersistedAppState>;
    const defaults = createDefaultAppState(missionIds, now, seasons);

    return {
      ...defaults,
      ...parsedValue,
      schemaVersion: 1,
      settings: { ...defaults.settings, ...parsedValue.settings },
      progress: { ...defaults.progress, ...parsedValue.progress },
    };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return createDefaultAppState(missionIds, now, seasons);
  }
}

export function saveAppState(
  storage: StorageLike,
  state: PersistedAppState,
  missionIds: readonly string[],
): void {
  const snapshot = state.settings.resultsStorageEnabled
    ? state
    : {
        ...state,
        activeSession: null,
        progress: createInitialProgress(missionIds),
      };

  storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function deleteAllLocalData(storage: StorageLike): void {
  for (const key of USED_LOCAL_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

export function getSelectedSeason(settings: AppSettings): SeasonValue {
  return settings.selectedSeason;
}

export function emptyScore() {
  return createInitialScore();
}
