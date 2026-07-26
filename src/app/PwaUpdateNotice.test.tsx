import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaUpdateNotice } from './PwaUpdateNotice';

type RegisterOptions = {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onRegisteredSW?: (
    swScriptUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void;
};

const pwaMock = vi.hoisted(() => ({
  options: null as RegisterOptions | null,
  registerSW: vi.fn((options: RegisterOptions) => {
    pwaMock.options = options;
    return pwaMock.updateServiceWorker;
  }),
  updateServiceWorker: vi.fn(async () => undefined),
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: pwaMock.registerSW,
}));

describe('PwaUpdateNotice', () => {
  beforeEach(() => {
    pwaMock.options = null;
    pwaMock.registerSW.mockClear();
    pwaMock.updateServiceWorker.mockClear();
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    });
  });

  it('registreert de service worker en toont een niet-storende updatebanner', () => {
    render(<PwaUpdateNotice />);

    expect(pwaMock.registerSW).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: true }),
    );

    act(() => {
      pwaMock.options?.onNeedRefresh?.();
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Nieuwe offline versie beschikbaar.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Update laden' }));
    expect(pwaMock.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('registreert niets wanneer service workers niet ondersteund worden', () => {
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
    });

    render(<PwaUpdateNotice />);

    expect(pwaMock.registerSW).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
