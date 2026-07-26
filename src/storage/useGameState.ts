import { useContext } from 'react';
import { GameStateContext } from './GameStateContext';

export function useGameState() {
  const context = useContext(GameStateContext);

  if (context === null) {
    throw new Error('GameStateProvider ontbreekt.');
  }

  return context;
}
