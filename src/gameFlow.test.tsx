import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { loadValidContent } from './content/loadContent';
import type { GeneratedContent, MultipleChoiceQuestionContent } from './content/types';
import { createGameSession, submitAnswer } from './storage/gameRules';
import type { GameMode, GameSession, PersistedAppState } from './storage/gameState';
import { createDefaultAppState, STORAGE_KEY } from './storage/localStorageState';

type SingleChoiceQuestionContent = MultipleChoiceQuestionContent & {
  correctAnswer: number;
};

describe('spelstromen', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('doorloopt een volledige leermissie en ontgrendelt daarna de volgende missie', async () => {
    const user = userEvent.setup();
    const content = await loadValidContent();
    const missionId = 'mission-01-salute-start';
    const nextMissionId = content.missions[1]?.id;
    const question = findSingleChoiceQuestion(content, missionId);

    if (nextMissionId === undefined) {
      throw new Error('Geen tweede missie gevonden voor de ontgrendelingstest.');
    }

    seedActiveSession(content, {
      missionId,
      mode: 'learning',
      questionIds: [question.id],
    });

    renderApp(`/play/${missionId}`);

    await submitSingleChoiceAnswer(user, question, 'correct');
    expect(await screen.findByRole('region', { name: 'Goed beoordeeld' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Naar resultaat' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Persoonlijk oefenadvies' }))
      .toBeInTheDocument();
    await waitFor(() => {
      const savedState = readSavedState();
      expect(savedState.progress.completedMissionIds).toContain(missionId);
      expect(savedState.progress.unlockedMissionIds).toContain(nextMissionId);
    });
  });

  it('doorloopt een volledige oefenmissie met fout antwoord, levensverlies en feedback', async () => {
    const user = userEvent.setup();
    const content = await loadValidContent();
    const missionId = 'mission-01-salute-start';
    const question = findSingleChoiceQuestion(content, missionId);
    seedActiveSession(content, {
      missionId,
      mode: 'practice',
      questionIds: [question.id],
    });

    renderApp(`/play/${missionId}`);

    await submitSingleChoiceAnswer(user, question, 'wrong');

    expect(await screen.findByRole('region', { name: 'Nog niet goed' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Naar resultaat' }));

    expect(await screen.findByText('Foutieve antwoorden')).toBeInTheDocument();
    expect(screen.getByText('Overgebleven levens')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('doorloopt een examensessie zonder tussentijdse inhoudelijke feedback', async () => {
    const user = userEvent.setup();
    const content = await loadValidContent();
    const missionId = 'mission-01-salute-start';
    const question = findSingleChoiceQuestion(content, missionId);
    seedActiveSession(content, {
      missionId,
      mode: 'exam',
      questionIds: [question.id],
    });

    renderApp(`/play/${missionId}`);

    expect(await screen.findByText(/Examenmodus is geen officieel examen/i)).toBeInTheDocument();
    await submitSingleChoiceAnswer(user, question, 'correct');

    expect(screen.queryByRole('region', { name: 'Goed beoordeeld' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Persoonlijk oefenadvies' }))
      .toBeInTheDocument();
    expect(screen.getByText(/geen officiële slagingsclaim/i)).toBeInTheDocument();
  });

  it('hervat een actieve sessie na opnieuw laden vanuit localStorage', async () => {
    const content = await loadValidContent();
    const missionId = 'mission-01-salute-start';
    const question = findSingleChoiceQuestion(content, missionId);
    seedActiveSession(content, {
      missionId,
      mode: 'practice',
      questionIds: [question.id],
    });

    renderApp(`/play/${missionId}`);

    expect(await screen.findByText(question.question)).toBeInTheDocument();
    expect(screen.getByText('Spelmodus: Oefenen')).toBeInTheDocument();
  });

  it('start opnieuw oefenen met alleen fout beantwoorde vragen vanuit het resultaat', async () => {
    const user = userEvent.setup();
    const content = await loadValidContent();
    const missionId = 'mission-01-salute-start';
    const questions = findTwoSingleChoiceQuestions(content, missionId);
    const completedSession = createCompletedSession(missionId, questions);
    seedState(content, { activeSession: completedSession });

    renderApp('/results');

    await user.click(await screen.findByRole('button', { name: 'Alleen fouten oefenen' }));

    expect(await screen.findByText(questions.wrong.question)).toBeInTheDocument();
    await waitFor(() => {
      expect(readSavedState().activeSession?.questionOrder).toEqual([questions.wrong.id]);
    });
  });

  it('slaat een seizoenswissel in instellingen lokaal op', async () => {
    const user = userEvent.setup();
    const content = await loadValidContent();
    const targetSeason = '2026-2027';
    seedState(content);

    renderApp('/settings');

    const seasonSelect = await screen.findByLabelText('Regelseizoen');
    await user.selectOptions(seasonSelect, targetSeason);

    await waitFor(() => {
      expect(readSavedState().settings.selectedSeason).toBe(targetSeason);
    });
  });

  it('blokkeert starten wanneer niet-gecontroleerde vragen worden uitgesloten', async () => {
    const content = await loadValidContent();
    const missionId = 'mission-01-salute-start';
    seedState(content, {
      settings: { excludeUnreviewedQuestions: true },
    });

    renderApp(`/mission/${missionId}`);

    expect(
      await screen.findByText('0 opdrachten beschikbaar voor je instellingen.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Er zijn geen vragen beschikbaar met de huidige filters.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start missie' })).toBeDisabled();
  });
});

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

async function submitSingleChoiceAnswer(
  user: ReturnType<typeof userEvent.setup>,
  question: SingleChoiceQuestionContent,
  answerType: 'correct' | 'wrong',
) {
  const optionText =
    answerType === 'correct'
      ? question.options[question.correctAnswer]
      : question.options.find((_, index) => index !== question.correctAnswer);

  if (optionText === undefined) {
    throw new Error(`Geen ${answerType}-antwoordoptie gevonden voor ${question.id}.`);
  }

  await user.click(await screen.findByRole('radio', { name: optionText }));
  const submitButton = screen.getByRole('button', { name: 'Antwoord bevestigen' });
  await waitFor(() => expect(submitButton).toBeEnabled());
  await user.click(submitButton);
}

function findSingleChoiceQuestion(
  content: GeneratedContent,
  missionId: string,
): SingleChoiceQuestionContent {
  const questionIds = getMissionQuestionIds(content, missionId);
  const question = content.questions.find(
    (candidate): candidate is SingleChoiceQuestionContent =>
      questionIds.includes(candidate.id) &&
      candidate.type === 'multiple-choice' &&
      typeof candidate.correctAnswer === 'number',
  );

  if (question === undefined) {
    throw new Error(`Geen enkelvoudige meerkeuzevraag gevonden voor ${missionId}.`);
  }

  return question;
}

function findTwoSingleChoiceQuestions(
  content: GeneratedContent,
  missionId: string,
): { wrong: SingleChoiceQuestionContent; correct: SingleChoiceQuestionContent } {
  const questionIds = getMissionQuestionIds(content, missionId);
  const questions = content.questions.filter(
    (candidate): candidate is SingleChoiceQuestionContent =>
      questionIds.includes(candidate.id) &&
      candidate.type === 'multiple-choice' &&
      typeof candidate.correctAnswer === 'number',
  );
  const wrong = questions[0];
  const correct = questions[1];

  if (wrong === undefined || correct === undefined) {
    throw new Error(`Te weinig enkelvoudige meerkeuzevragen gevonden voor ${missionId}.`);
  }

  return { wrong, correct };
}

function getMissionQuestionIds(content: GeneratedContent, missionId: string): string[] {
  return (
    content.missionQuestionLinks.find((link) => link.missionId === missionId)
      ?.questionIds ?? []
  );
}

function seedActiveSession(
  content: GeneratedContent,
  {
    missionId,
    mode,
    questionIds,
  }: { missionId: string; mode: GameMode; questionIds: string[] },
) {
  const activeSession = createGameSession({
    missionId,
    mode,
    selectedSeason: '2025-2026',
    questionIds,
    now: '2026-07-25T10:00:00.000Z',
  });

  seedState(content, {
    activeSession,
    settings: {
      preferredMode: mode,
      selectedSeason: '2025-2026',
    },
  });
}

function createCompletedSession(
  missionId: string,
  questions: { wrong: SingleChoiceQuestionContent; correct: SingleChoiceQuestionContent },
): GameSession {
  const started = createGameSession({
    missionId,
    mode: 'practice',
    selectedSeason: '2025-2026',
    questionIds: [questions.wrong.id, questions.correct.id],
    now: '2026-07-25T10:00:00.000Z',
  });
  const wrongOption = questions.wrong.options.findIndex(
    (_, index) => index !== questions.wrong.correctAnswer,
  );

  if (wrongOption < 0) {
    throw new Error(`Geen fout antwoord gevonden voor ${questions.wrong.id}.`);
  }

  const afterWrongAnswer = submitAnswer(
    started,
    questions.wrong,
    wrongOption,
    '2026-07-25T10:01:00.000Z',
  );

  return submitAnswer(
    afterWrongAnswer,
    questions.correct,
    questions.correct.correctAnswer,
    '2026-07-25T10:02:00.000Z',
  );
}

function seedState(
  content: GeneratedContent,
  overrides: {
    activeSession?: GameSession | null;
    settings?: Partial<PersistedAppState['settings']>;
  } = {},
) {
  const missionIds = content.missions.map((mission) => mission.id);
  const state = createDefaultAppState(
    missionIds,
    '2026-07-25T09:00:00.000Z',
    content.seasonValues,
  );

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      activeSession: overrides.activeSession ?? state.activeSession,
      settings: { ...state.settings, ...overrides.settings },
    }),
  );
}

function readSavedState(): PersistedAppState {
  const rawState = window.localStorage.getItem(STORAGE_KEY);

  if (rawState === null) {
    throw new Error('Geen opgeslagen appstatus gevonden.');
  }

  const parsedState: unknown = JSON.parse(rawState);

  if (!isPersistedAppState(parsedState)) {
    throw new Error('Opgeslagen appstatus heeft niet de verwachte vorm.');
  }

  return parsedState;
}

function isPersistedAppState(value: unknown): value is PersistedAppState {
  return (
    isRecord(value) &&
    isRecord(value.settings) &&
    typeof value.settings.selectedSeason === 'string' &&
    isRecord(value.progress) &&
    Array.isArray(value.progress.completedMissionIds) &&
    Array.isArray(value.progress.unlockedMissionIds)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
