import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ContentProvider } from './content/ContentContext';
import { loadValidContent } from './content/loadContent';
import { ReviewPage } from './pages/ReviewPage';
import { REVIEW_NOTES_STORAGE_KEY } from './storage/reviewNotesStorage';

describe('ReviewPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it(
    'toont de reviewroute, filtert op vraag-ID en slaat een lokale notitie op',
    async () => {
      await renderReviewPage();

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Review vragen en brongegevens',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(/ingebouwde content wordt niet vanuit de browser aangepast/i))
        .toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Vraag-ID'), {
        target: { value: 'q-t8-01' },
      });

      expect(await screen.findByText(/1 vragen gevonden/i)).toBeInTheDocument();
      expect(screen.getByText('Vraag q-t8-01')).toBeInTheDocument();
      expect(screen.getAllByText('Correct antwoord').length).toBeGreaterThan(0);

      fireEvent.change(screen.getByLabelText('Reviewer naam (optioneel, lokaal)'), {
        target: { value: 'Reviewer' },
      });
      fireEvent.change(screen.getByLabelText('Status'), {
        target: { value: 'akkoord' },
      });
      fireEvent.change(screen.getByLabelText('Vrij tekstveld'), {
        target: { value: 'Controle akkoord.' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Reviewnotitie opslaan' }));

      expect(
        await screen.findByText('Reviewnotitie voor q-t8-01 lokaal opgeslagen.'),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(window.localStorage.getItem(REVIEW_NOTES_STORAGE_KEY)).toContain('q-t8-01');
        expect(window.localStorage.getItem(REVIEW_NOTES_STORAGE_KEY)).toContain('Reviewer');
        expect(window.localStorage.getItem(REVIEW_NOTES_STORAGE_KEY)).toContain(
          'Controle akkoord.',
        );
      });
    },
    10000,
  );

  it('biedt JSON-export en printweergave aan zonder login of backend', async () => {
    await renderReviewPage();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Review vragen en brongegevens',
    });

    expect(
      screen.getByRole('button', { name: 'Reviewrapport JSON exporteren' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Printweergave openen' })).toBeInTheDocument();
    expect(screen.queryByText(/wachtwoord/i)).not.toBeInTheDocument();
  });
});

async function renderReviewPage() {
  const content = await loadValidContent();

  return render(
    <MemoryRouter initialEntries={['/review']}>
      <ContentProvider content={content}>
        <ReviewPage />
      </ContentProvider>
    </MemoryRouter>,
  );
}
