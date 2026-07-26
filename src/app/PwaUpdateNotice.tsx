import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { AppButton } from '../components/ui';

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

export function PwaUpdateNotice() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] =
    useState<UpdateServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || navigator.serviceWorker === undefined) {
      return undefined;
    }

    const updateSw = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swScriptUrl, registration) {
        void registration?.update();
      },
    });

    setUpdateServiceWorker(() => updateSw);

    return undefined;
  }, []);

  if (!needRefresh) {
    return null;
  }

  return (
    <aside aria-live="polite" className="pwa-update" role="status">
      <span>Nieuwe offline versie beschikbaar.</span>
      <div className="button-row">
        <AppButton
          onClick={() => {
            if (updateServiceWorker !== null) {
              void updateServiceWorker(true);
            }
          }}
          variant="secondary"
        >
          Update laden
        </AppButton>
        <AppButton onClick={() => setNeedRefresh(false)} variant="ghost">
          Later
        </AppButton>
      </div>
    </aside>
  );
}
