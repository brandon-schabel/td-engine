/**
 * Custom React hooks for accessing game store with proper typing and performance optimizations
 */

import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { gameStore, type GameStore } from '../gameStore';

// Export the main hook with proper typing - Zustand v5 pattern
export const useGameStore = <T>(selector: (state: GameStore) => T): T => {
  return useStore(gameStore, selector) as T;
};

// Helper hook for shallow equality with proper typing
export const useGameStoreShallow = <T>(selector: (state: GameStore) => T): T => {
  return useStore(gameStore, useShallow(selector)) as T;
};

// Specific hooks for common use cases with explicit return types
export const useGameState = (): GameStore['gameState'] => useGameStore(state => state.gameState);
export const useIsPaused = (): boolean => useGameStore(state => state.isPaused);
export const useIsGameOver = (): boolean => useGameStore(state => state.isGameOver);
export const useGameSpeed = (): number => useGameStore(state => state.gameSpeed);

// Resource hooks with explicit types
export const useCurrency = (): number => useGameStore(state => state.currency);
export const useLives = (): number => useGameStore(state => state.lives);
export const useScore = (): number => useGameStore(state => state.score);
export const useResources = (): { currency: number; lives: number; score: number } =>
  useGameStoreShallow(state => ({
    currency: state.currency,
    lives: state.lives,
    score: state.score
  }));

// Player progression hooks with explicit types
export const usePlayerLevel = (): number => useGameStore(state => state.playerLevel);
export const usePlayerExperience = (): number => useGameStore(state => state.playerExperience);
export const usePlayerHealth = (): number => useGameStore(state => state.playerHealth);
export const usePlayerStats = (): {
  level: number;
  experience: number;
  nextLevelExp: number;
  health: number;
  maxHealth: number;
} => useGameStoreShallow(state => ({
  level: state.playerLevel,
  experience: state.playerExperience,
  nextLevelExp: state.playerNextLevelExp,
  health: state.playerHealth,
  maxHealth: state.playerMaxHealth
}));

// Wave state hooks with explicit types
export const useCurrentWave = (): number => useGameStore(state => state.currentWave);
export const useIsWaveActive = (): boolean => useGameStore(state => state.isWaveActive);
export const useWaveInProgress = (): boolean => useGameStore(state => state.waveInProgress);
export const useEnemiesRemaining = (): number => useGameStore(state => state.enemiesRemaining);
export const useWaveInfo = (): {
  currentWave: number;
  isWaveActive: boolean;
  waveInProgress: boolean;
  enemiesRemaining: number;
  nextWaveTime: number;
} => useGameStoreShallow(state => ({
  currentWave: state.currentWave,
  isWaveActive: state.isWaveActive,
  waveInProgress: state.waveInProgress,
  enemiesRemaining: state.enemiesRemaining,
  nextWaveTime: state.nextWaveTime
}));

// Statistics hooks with explicit types
export const useGameStats = (): GameStore['stats'] => useGameStore(state => state.stats);

// Action hooks with explicit types
export const useGameActions = (): {
  setGameState: GameStore['setGameState'];
  pauseGame: GameStore['pauseGame'];
  resumeGame: GameStore['resumeGame'];
  setGameSpeed: GameStore['setGameSpeed'];
  gameOver: GameStore['gameOver'];
  resetGame: GameStore['resetGame'];
  startWave: GameStore['startWave'];
  endWave: GameStore['endWave'];
  setNextWaveTime: GameStore['setNextWaveTime'];
  setEnemiesRemaining: GameStore['setEnemiesRemaining'];
} => useGameStoreShallow(state => ({
  setGameState: state.setGameState,
  pauseGame: state.pauseGame,
  resumeGame: state.resumeGame,
  setGameSpeed: state.setGameSpeed,
  gameOver: state.gameOver,
  resetGame: state.resetGame,
  startWave: state.startWave,
  endWave: state.endWave,
  setNextWaveTime: state.setNextWaveTime,
  setEnemiesRemaining: state.setEnemiesRemaining
}));

export const useResourceActions = (): {
  addCurrency: GameStore['addCurrency'];
  spendCurrency: GameStore['spendCurrency'];
  addScore: GameStore['addScore'];
  loseLife: GameStore['loseLife'];
} => useGameStoreShallow(state => ({
  addCurrency: state.addCurrency,
  spendCurrency: state.spendCurrency,
  addScore: state.addScore,
  loseLife: state.loseLife
}));

export const usePlayerActions = (): {
  addExperience: GameStore['addExperience'];
  levelUp: GameStore['levelUp'];
  setPlayerHealth: GameStore['setPlayerHealth'];
} => useGameStoreShallow(state => ({
  addExperience: state.addExperience,
  levelUp: state.levelUp,
  setPlayerHealth: state.setPlayerHealth
}));

export const useStatisticActions = (): {
  recordEnemyKill: GameStore['recordEnemyKill'];
  recordTowerBuilt: GameStore['recordTowerBuilt'];
  recordDamageDealt: GameStore['recordDamageDealt'];
  updateGameTime: GameStore['updateGameTime'];
} => useGameStoreShallow(state => ({
  recordEnemyKill: state.recordEnemyKill,
  recordTowerBuilt: state.recordTowerBuilt,
  recordDamageDealt: state.recordDamageDealt,
  updateGameTime: state.updateGameTime
}));

// Selector hooks with explicit types
export const useCanAfford = (cost: number): boolean => useGameStore(state => state.canAfford(cost));
export const useIsAlive = (): boolean => useGameStore(state => state.isAlive());
export const useFormattedGameTime = (): string => useGameStore(state => state.getFormattedTime());

// Combined hooks for components with explicit types
export const useGameUI = (): {
  gameState: GameStore['gameState'];
  isPaused: boolean;
  isGameOver: boolean;
  isWaveActive: boolean;
  waveInProgress: boolean;
  canStartWave: boolean;
  currentWave: number;
  pauseGame: GameStore['pauseGame'];
  resumeGame: GameStore['resumeGame'];
  startWave: GameStore['startWave'];
} => useGameStoreShallow(state => ({
  gameState: state.gameState,
  isPaused: state.isPaused,
  isGameOver: state.isGameOver,
  isWaveActive: state.isWaveActive,
  waveInProgress: state.waveInProgress,
  canStartWave: !state.waveInProgress && !state.isGameOver,
  currentWave: state.currentWave,
  pauseGame: state.pauseGame,
  resumeGame: state.resumeGame,
  startWave: state.startWave
}));