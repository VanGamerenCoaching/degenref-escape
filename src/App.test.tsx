import { act, render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App routes', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setHash('#/');
  });

  it('toont een laadstatus en rendert daarna het Nederlandstalige startscherm', async () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(screen.getByRole('status', { name: 'Content laden...' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'DegenRef Escape' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Train je beslissingen als degenscheidsrechter')).toBeInTheDocument();
  });

  it('rendert het missieoverzicht via HashRouter', async () => {
    setHash('#/missions');

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /Open de schermzaal/ }),
    ).toBeInTheDocument();
  });

  it('rendert instellingen met privacy en lokale opslaginformatie', async () => {
    setHash('#/settings');

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Regels, privacy en lokale gegevens',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('degenref-escape-state').length).toBeGreaterThan(0);
    expect(screen.getByText('Geen account')).toBeInTheDocument();
    expect(screen.getByText('Geen gegevens naar een server')).toBeInTheDocument();
  });

  it('rendert Over deze app met contentpakket- en repositoryinformatie', async () => {
    setHash('#/about');

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'DegenRef Escape' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Versie van het contentpakket')).toBeInTheDocument();
    expect(screen.getByText('Canonieke appbron')).toBeInTheDocument();
    expect(screen.getByText(/VITE_REPOSITORY_URL/)).toBeInTheDocument();
  });

  it('rendert de lokale contentreviewmodus via HashRouter', async () => {
    setHash('#/review');

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Review vragen en brongegevens',
      }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reviewrapport JSON exporteren' }))
      .toBeInTheDocument();
  });
});

function setHash(hash: string) {
  act(() => {
    window.location.hash = hash;
  });
}
