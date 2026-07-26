import { describe, expect, it } from 'vitest';
import type { MultipleChoiceQuestionContent } from '../content/types';
import type { ScoreState } from './gameState';
import { appStateReducer } from './appStateReducer';
import { createDefaultAppState } from './localStorageState';

describe('appStateReducer', () => {
  it('start een sessie met vorige beste score en verhoogt het aantal pogingen', () => {
    const bestScore: ScoreState = { correct: 2, incorrect: 0, points: 20, accuracy: 100 };
    const state = {
      ...createDefaultAppState(
        ['mission-1', 'mission-2'],
        '2026-07-25T09:00:00.000Z',
        ['2025-2026', '2026-2027'],
      ),
      progress: {
        ...createDefaultAppState(
          ['mission-1', 'mission-2'],
          '2026-07-25T09:00:00.000Z',
          ['2025-2026', '2026-2027'],
        ).progress,
        missionStats: {
          'mission-1': {
            attempts: 2,
            bestScore,
            lastCompletedAt: '2026-07-24T10:00:00.000Z',
          },
        },
      },
    };

    const next = appStateReducer(state, {
      type: 'start-session',
      missionId: 'mission-1',
      mode: 'exam',
      selectedSeason: '2026-2027',
      questionIds: ['q-1', 'q-2'],
      now: '2026-07-25T10:00:00.000Z',
    });

    expect(next.activeSession?.previousBestScore).toEqual(bestScore);
    expect(next.progress.missionStats['mission-1']?.attempts).toBe(3);
    expect(next.settings.preferredMode).toBe('exam');
    expect(next.settings.selectedSeason).toBe('2026-2027');
  });

  it('rondt een missie af, bewaart de beste score en ontgrendelt de volgende missie', () => {
    const missionIds = ['mission-1', 'mission-2'];
    const question = questionFixture({ id: 'q-1' });
    const started = appStateReducer(
      createDefaultAppState(missionIds, '2026-07-25T09:00:00.000Z', ['2025-2026']),
      {
        type: 'start-session',
        missionId: 'mission-1',
        mode: 'learning',
        selectedSeason: '2025-2026',
        questionIds: [question.id],
        now: '2026-07-25T10:00:00.000Z',
      },
    );

    const completed = appStateReducer(started, {
      type: 'submit-answer',
      question,
      value: 1,
      missionIds,
      now: '2026-07-25T10:05:00.000Z',
    });

    expect(completed.progress.completedMissionIds).toEqual(['mission-1']);
    expect(completed.progress.unlockedMissionIds).toEqual(['mission-1', 'mission-2']);
    expect(completed.progress.missionStats['mission-1']?.bestScore?.points).toBe(10);
    expect(completed.progress.missionStats['mission-1']?.lastCompletedAt).toBe(
      '2026-07-25T10:05:00.000Z',
    );
  });

  it('registreert fouten per categorie en levensverlies tijdens een actieve oefensessie', () => {
    const missionIds = ['mission-1', 'mission-2'];
    const firstQuestion = questionFixture({ id: 'q-1', category: 'sanctie' });
    const secondQuestion = questionFixture({ id: 'q-2', category: 'piste' });
    const started = appStateReducer(
      createDefaultAppState(missionIds, '2026-07-25T09:00:00.000Z', ['2025-2026']),
      {
        type: 'start-session',
        missionId: 'mission-1',
        mode: 'practice',
        selectedSeason: '2025-2026',
        questionIds: [firstQuestion.id, secondQuestion.id],
        now: '2026-07-25T10:00:00.000Z',
      },
    );

    const afterWrongAnswer = appStateReducer(started, {
      type: 'submit-answer',
      question: firstQuestion,
      value: 0,
      missionIds,
      now: '2026-07-25T10:01:00.000Z',
    });

    expect(afterWrongAnswer.progress.errorsByCategory).toEqual({ sanctie: 1 });
    expect(afterWrongAnswer.activeSession?.remainingLives).toBe(2);
    expect(afterWrongAnswer.activeSession?.currentQuestionId).toBe('q-2');
    expect(afterWrongAnswer.progress.completedMissionIds).toEqual([]);
  });

  it('verwerkt hints via de reducer en werkt laatste activiteit bij', () => {
    const missionIds = ['mission-1'];
    const question = questionFixture({ hints: ['Hint 1', 'Hint 2'] });
    const started = appStateReducer(
      createDefaultAppState(missionIds, '2026-07-25T09:00:00.000Z', ['2025-2026']),
      {
        type: 'start-session',
        missionId: 'mission-1',
        mode: 'practice',
        selectedSeason: '2025-2026',
        questionIds: [question.id],
        now: '2026-07-25T10:00:00.000Z',
      },
    );

    const withHint = appStateReducer(started, {
      type: 'use-hint',
      question,
      now: '2026-07-25T10:02:00.000Z',
    });

    expect(withHint.activeSession?.usedHints[question.id]).toBe(1);
    expect(withHint.lastActivityAt).toBe('2026-07-25T10:02:00.000Z');
  });

  it('wist actieve sessie en voortgang wanneer resultaatopslag wordt uitgezet', () => {
    const missionIds = ['mission-1', 'mission-2'];
    const state = appStateReducer(
      createDefaultAppState(missionIds, '2026-07-25T09:00:00.000Z', ['2025-2026']),
      {
        type: 'start-session',
        missionId: 'mission-1',
        mode: 'learning',
        selectedSeason: '2025-2026',
        questionIds: ['q-1'],
        now: '2026-07-25T10:00:00.000Z',
      },
    );

    const next = appStateReducer(
      {
        ...state,
        progress: {
          ...state.progress,
          completedMissionIds: ['mission-1'],
          unlockedMissionIds: ['mission-1', 'mission-2'],
        },
      },
      {
        type: 'update-settings',
        settings: { resultsStorageEnabled: false },
        missionIds,
        now: '2026-07-25T10:10:00.000Z',
      },
    );

    expect(next.activeSession).toBeNull();
    expect(next.progress.completedMissionIds).toEqual([]);
    expect(next.progress.unlockedMissionIds).toEqual(['mission-1']);
  });

  it('kan alleen de actieve sessie wissen of volledig terug naar defaults', () => {
    const missionIds = ['mission-1'];
    const state = appStateReducer(
      createDefaultAppState(missionIds, '2026-07-25T09:00:00.000Z', ['2025-2026']),
      {
        type: 'start-session',
        missionId: 'mission-1',
        mode: 'learning',
        selectedSeason: '2025-2026',
        questionIds: ['q-1'],
        now: '2026-07-25T10:00:00.000Z',
      },
    );

    const withoutSession = appStateReducer(state, {
      type: 'clear-active-session',
      now: '2026-07-25T10:05:00.000Z',
    });
    const reset = appStateReducer(withoutSession, {
      type: 'reset-all',
      missionIds,
      seasons: ['2026-2027'],
      now: '2026-07-25T10:10:00.000Z',
    });

    expect(withoutSession.activeSession).toBeNull();
    expect(withoutSession.progress.missionStats['mission-1']?.attempts).toBe(1);
    expect(reset.settings.selectedSeason).toBe('2026-2027');
    expect(reset.progress.missionStats).toEqual({});
  });
});

function questionFixture(
  overrides: Partial<MultipleChoiceQuestionContent> = {},
): MultipleChoiceQuestionContent {
  return {
    id: 'q-1',
    roomId: 'room',
    type: 'multiple-choice',
    category: 'procedure',
    difficulty: 1,
    article: 't.1',
    sourcePage: 1,
    question: 'Vraag?',
    options: ['Fout', 'Goed'],
    correctAnswer: 1,
    hints: [],
    explanation: 'Uitleg.',
    rulesVersion: 'FIE Technical Rules - December 2025',
    reviewed: true,
    reviewedBy: 'tester',
    ...overrides,
  };
}
