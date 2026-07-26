import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppButton, ConfirmDialog, StatusMessage } from './ui';

describe('UI toegankelijkheid', () => {
  it('maakt statusmeldingen expliciete live-regions', () => {
    render(<StatusMessage variant="success">Opgeslagen</StatusMessage>);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });

  it('houdt focus in de modal en sluit met Escape', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="Alles verwijderen"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Alle voortgang verwijderen?"
      >
        Testmelding
      </ConfirmDialog>,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Alle voortgang verwijderen?',
    });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sluiten' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Alles verwijderen' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('herstelt focus naar de opener na het sluiten van een modal', async () => {
    const user = userEvent.setup();

    render(<DialogLauncher />);

    const opener = screen.getByRole('button', { name: 'Open bevestiging' });
    opener.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog', { name: 'Alle voortgang verwijderen?' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});

function DialogLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppButton onClick={() => setOpen(true)}>Open bevestiging</AppButton>
      <ConfirmDialog
        confirmLabel="Alles verwijderen"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        open={open}
        title="Alle voortgang verwijderen?"
      >
        Testmelding
      </ConfirmDialog>
    </>
  );
}
