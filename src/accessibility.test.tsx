import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { loadValidContent } from './content/loadContent';
import type { MultipleChoiceQuestionContent } from './content/types';
import { createGameSession } from './storage/gameRules';
import { createDefaultAppState, STORAGE_KEY } from './storage/localStorageState';

type SingleChoiceQuestionContent = MultipleChoiceQuestionContent & {
  correctAnswer: number;
};

describe('toegankelijkheid', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each(['#/', '#/start', '#/missions', '#/rules', '#/review', '#/settings', '#/about'])(
    'heeft geen axe-violations op %s',
    async (hash) => {
      const path = hashToPath(hash);
      const { container } = renderApp(hashToPath(hash));

      await waitForRoute(path);
      expect((await axe(container)).violations).toEqual([]);
    },
    15000,
  );

  it('heeft landmarks, skiplink en focus na routewisseling', async () => {
    renderApp();

    await waitForRoute('/');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Naar hoofdinhoud' })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('ondersteunt nieuwe training, modus kiezen en missie openen zonder muis', async () => {
    const user = userEvent.setup();
    renderApp();

    await waitForRoute('/');
    screen.getByRole('link', { name: 'Nieuwe training' }).focus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Stel je sessie samen' }),
    ).toBeInTheDocument();

    const modeGroup = screen.getByRole('group', { name: 'Spelmodus' });
    const examMode = within(modeGroup).getByLabelText('Examen', { exact: false });
    examMode.focus();
    await user.keyboard(' ');
    expect(examMode).toBeChecked();

    screen.getByRole('button', { name: 'Naar missieoverzicht' }).focus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Open de schermzaal stap voor stap',
      }),
    ).toBeInTheDocument();

    const missionLinks = await screen.findAllByRole('link', { name: 'Missie openen' });
    missionLinks[0]?.focus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'De vergrendelde ontvangsthal',
      }),
    ).toBeInTheDocument();
  });

  it('ondersteunt hint openen, volgordevraag beantwoorden en feedback lezen zonder muis', async () => {
    const user = userEvent.setup();
    renderApp('/mission/mission-01-salute-start');

    const startButton = await screen.findByRole('button', { name: 'Start missie' });
    startButton.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Zet de schermgroet in de juiste volgorde.')).toBeInTheDocument();

    const hintButton = await screen.findByRole('button', { name: 'Hint tonen' });
    hintButton.focus();
    await user.keyboard(' ');
    expect(await screen.findByText('De kom gaat omhoog vóór de kling omlaag gaat.')).toBeInTheDocument();

    screen.getByRole('button', { name: 'Volgorde bevestigen' }).focus();
    await user.keyboard('{Enter}');

    const feedbackRegion = await screen.findByRole('region', { name: 'Goed beoordeeld' });
    expect(feedbackRegion).toHaveFocus();
    expect(screen.getByText('Jouw antwoord')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Regel t.1' })).toBeInTheDocument();
  });

  it('ondersteunt meerkeuze beantwoorden, missie afronden en resultaat bekijken zonder muis', async () => {
    const user = userEvent.setup();
    const question = await seedOneQuestionSession();
    renderApp('/play/mission-01-salute-start');

    const correctOption = question.options[question.correctAnswer];
    if (correctOption === undefined) {
      throw new Error('Correcte antwoordoptie ontbreekt in de testcontent.');
    }

    const correctRadio = await screen.findByRole('radio', { name: correctOption });
    correctRadio.focus();
    await user.keyboard(' ');
    expect(correctRadio).toBeChecked();

    const submitButton = screen.getByRole('button', { name: 'Antwoord bevestigen' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    submitButton.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('region', { name: 'Goed beoordeeld' })).toBeInTheDocument();

    screen.getByRole('button', { name: 'Naar resultaat' }).focus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Persoonlijk oefenadvies' }),
    ).toBeInTheDocument();
  });

  it('ondersteunt een actieve lokale sessie verwijderen zonder muis', async () => {
    const user = userEvent.setup();
    await seedOneQuestionSession();
    renderApp('/settings');

    const removeSessionButton = await screen.findByRole('button', {
      name: 'Actieve sessie verwijderen',
    });
    expect(removeSessionButton).toBeEnabled();

    removeSessionButton.focus();
    await user.keyboard('{Enter}');

    const confirmButton = await screen.findByRole('button', {
      name: 'Sessie verwijderen',
    });
    confirmButton.focus();
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Actieve sessie verwijderen?' }),
      ).not.toBeInTheDocument(),
    );
    expect(removeSessionButton).toBeDisabled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"activeSession":null');
  });
});

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

function hashToPath(hash: string) {
  return hash.startsWith('#') ? hash.slice(1) || '/' : hash;
}

async function waitForRoute(path: string) {
  const expectedHeadings: Record<string, string> = {
    '/': 'DegenRef Escape',
    '/start': 'Stel je sessie samen',
    '/missions': 'Open de schermzaal stap voor stap',
    '/rules': 'Zoek in de Nederlandse leervertaling',
    '/review': 'Review vragen en brongegevens',
    '/settings': 'Regels, privacy en lokale gegevens',
    '/about': 'DegenRef Escape',
  };
  const expectedHeading = expectedHeadings[path] ?? 'DegenRef Escape';

  await screen.findByRole(
    'heading',
    { level: 1, name: expectedHeading },
    { timeout: 5000 },
  );
}

async function seedOneQuestionSession(): Promise<SingleChoiceQuestionContent> {
  const content = await loadValidContent();
  const missionId = 'mission-01-salute-start';
  const question = content.questions.find(
    (candidate): candidate is MultipleChoiceQuestionContent =>
      candidate.id === 'q-t8-01' && candidate.type === 'multiple-choice',
  );

  if (question === undefined || Array.isArray(question.correctAnswer)) {
    throw new Error('Testvraag q-t8-01 ontbreekt of is geen enkelvoudige meerkeuzevraag.');
  }

  const missionIds = content.missions.map((mission) => mission.id);
  const state = createDefaultAppState(
    missionIds,
    '2026-07-25T10:00:00.000Z',
    content.seasonValues,
  );
  const activeSession = createGameSession({
    missionId,
    mode: 'learning',
    selectedSeason: '2025-2026',
    questionIds: [question.id],
    now: '2026-07-25T10:01:00.000Z',
  });

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...state, activeSession }),
  );

  return { ...question, correctAnswer: question.correctAnswer };
}
