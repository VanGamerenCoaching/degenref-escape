import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  createDefaultAppState,
  createDefaultSettings,
  deleteAllLocalData,
  loadAppState,
  saveAppState,
} from './localStorageState';
import { createGameSession } from './gameRules';
import { REVIEW_NOTES_STORAGE_KEY } from './reviewNotesStorage';

describe('localStorageState', () => {
  it('herstelt beschadigde opslag naar een schone toestand', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{geen-json');

    const state = loadAppState(
      storage,
      ['mission-1'],
      '2026-07-25T10:00:00.000Z',
      ['2025-2026'],
    );

    expect(state.progress.unlockedMissionIds).toEqual(['mission-1']);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('slaat lokale voortgang op en laadt die opnieuw met huidige defaults', () => {
    const storage = new MemoryStorage();
    const activeSession = createGameSession({
      missionId: 'mission-1',
      mode: 'practice',
      selectedSeason: '2026-2027',
      questionIds: ['q-1', 'q-2'],
      now: '2026-07-25T10:00:00.000Z',
    });
    const state = {
      ...createDefaultAppState(
        ['mission-1', 'mission-2'],
        '2026-07-25T09:00:00.000Z',
        ['2025-2026', '2026-2027'],
      ),
      activeSession,
      settings: {
        ...createDefaultSettings(['2025-2026', '2026-2027']),
        selectedSeason: '2026-2027',
        preferredMode: 'practice' as const,
      },
      progress: {
        completedMissionIds: ['mission-1'],
        unlockedMissionIds: ['mission-1', 'mission-2'],
        missionStats: {
          'mission-1': {
            attempts: 2,
            bestScore: { correct: 2, incorrect: 0, points: 20, accuracy: 100 },
            lastCompletedAt: '2026-07-25T10:30:00.000Z',
          },
        },
        errorsByCategory: { sanctie: 1 },
      },
    };

    saveAppState(storage, state, ['mission-1', 'mission-2']);
    const loaded = loadAppState(
      storage,
      ['mission-1', 'mission-2'],
      '2026-07-25T11:00:00.000Z',
      ['2025-2026', '2026-2027'],
    );

    expect(loaded.activeSession?.missionId).toBe('mission-1');
    expect(loaded.settings.selectedSeason).toBe('2026-2027');
    expect(loaded.progress.completedMissionIds).toEqual(['mission-1']);
    expect(loaded.progress.missionStats['mission-1']?.bestScore?.points).toBe(20);
    expect(loaded.progress.errorsByCategory).toEqual({ sanctie: 1 });
  });

  it('migreert ontbrekende velden met defaults', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings: { preferredMode: 'exam' } }),
    );

    const state = loadAppState(
      storage,
      ['mission-1'],
      '2026-07-25T10:00:00.000Z',
      ['2025-2026'],
    );

    expect(state.settings.preferredMode).toBe('exam');
    expect(state.settings.selectedSeason).toBe('2025-2026');
    expect(state.schemaVersion).toBe(1);
  });

  it('gebruikt veilige defaults wanneer er nog geen missies of seizoenen zijn', () => {
    const state = createDefaultAppState([], '2026-07-25T10:00:00.000Z', []);

    expect(state.settings.selectedSeason).toBe('2025-2026');
    expect(state.progress.unlockedMissionIds).toEqual([]);
  });

  it('wist voortgang wanneer resultaatopslag uit staat', () => {
    const storage = new MemoryStorage();
    const state = createDefaultAppState(
      ['mission-1'],
      '2026-07-25T10:00:00.000Z',
      ['2025-2026'],
    );

    saveAppState(storage, {
      ...state,
      settings: { ...state.settings, resultsStorageEnabled: false },
      progress: {
        ...state.progress,
        completedMissionIds: ['mission-1'],
      },
    }, ['mission-1']);

    expect(storage.getItem(STORAGE_KEY)).not.toContain('completedMissionIds":["mission-1"]');
  });

  it('verwijdert alle gebruikte sleutels', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{}');
    storage.setItem(REVIEW_NOTES_STORAGE_KEY, '[]');
    storage.setItem('andere-app', 'blijft staan');

    deleteAllLocalData(storage);

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem(REVIEW_NOTES_STORAGE_KEY)).toBeNull();
    expect(storage.getItem('andere-app')).toBe('blijft staan');
  });
});

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
