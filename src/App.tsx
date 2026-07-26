import { useEffect, useState } from 'react';
import { AppShell } from './app/AppShell';
import { ContentErrorScreen } from './app/ContentErrorScreen';
import { ContentLoadingScreen } from './app/ContentLoadingScreen';
import { GlobalErrorBoundary } from './app/GlobalErrorBoundary';
import { ContentProvider } from './content/ContentContext';
import { type ContentLoadResult, loadContent } from './content/loadContent';
import { GameStateProvider } from './storage/GameStateProvider';

export function App() {
  const [contentResult, setContentResult] = useState<ContentLoadResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    void loadContent().then((result) => {
      if (isMounted) {
        setContentResult(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      {contentResult === null ? (
        <ContentLoadingScreen />
      ) : contentResult.ok ? (
        <ContentProvider content={contentResult.content}>
          <GameStateProvider
            missionIds={contentResult.content.missions.map((mission) => mission.id)}
            seasons={contentResult.content.seasonValues}
          >
            <AppShell />
          </GameStateProvider>
        </ContentProvider>
      ) : (
        <ContentErrorScreen
          errorMessage={contentResult.errorMessage}
          warningMessages={contentResult.warningMessages}
        />
      )}
    </GlobalErrorBoundary>
  );
}
