import { type ReactNode, useEffect, useMemo, useReducer, useState } from 'react';
import { appStateReducer } from './appStateReducer';
import { GameStateContext } from './GameStateContext';
import { createDefaultAppState, loadAppState, saveAppState } from './localStorageState';

interface GameStateProviderProps {
  children: ReactNode;
  missionIds: string[];
  seasons: string[];
}

export function GameStateProvider({
  children,
  missionIds,
  seasons,
}: GameStateProviderProps) {
  const [initialState] = useState(() => {
    const now = new Date().toISOString();
    return typeof window === 'undefined'
      ? createDefaultAppState(missionIds, now, seasons)
      : loadAppState(window.localStorage, missionIds, now, seasons);
  });
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveAppState(window.localStorage, state, missionIds);
    }
  }, [missionIds, state]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'reduce-motion',
      state.settings.reduceMotion === 'always',
    );
  }, [state.settings.reduceMotion]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}
