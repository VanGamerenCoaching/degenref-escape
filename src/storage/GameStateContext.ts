import { createContext, type Dispatch } from 'react';
import type { AppStateAction } from './appStateReducer';
import type { PersistedAppState } from './gameState';

export interface GameStateContextValue {
  state: PersistedAppState;
  dispatch: Dispatch<AppStateAction>;
}

export const GameStateContext = createContext<GameStateContextValue | null>(null);
