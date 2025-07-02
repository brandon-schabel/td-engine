/**
 * Custom React hooks for accessing game store with proper typing and performance optimizations
 */

import { useStore } from 'zustand';
import { gameStore, type GameStore } from '../gameStore';
import { shallow } from 'zustand/shallow';

// Export the main hook
export const useGameStore = <T>(selector: (state: GameStore) => T): T => {
  return useStore(gameStore, selector);
};

// Specific hooks for common use cases with shallow equality checks
export const useGameState = () => useGameStore(state => state.gameState);
export const useIsPaused = () => useGameStore(state => state.isPaused);
export const useIsGameOver = () => useGameStore(state => state.isGameOver);
export const useGameSpeed = () => useGameStore(state => state.gameSpeed);

// Resource hooks
export const useCurrency = () => useGameStore(state => state.currency);
export const useLives = () => useGameStore(state => state.lives);
export const useScore = () => useGameStore(state => state.score);
export const useResources = () => useGameStore(
  state => ({
    currency: state.currency,
    lives: state.lives,
    score: state.score
  }),
  shallow
);

// Player progression hooks
export const usePlayerLevel = () => useGameStore(state => state.playerLevel);
export const usePlayerExperience = () => useGameStore(state => state.playerExperience);
export const usePlayerHealth = () => useGameStore(state => state.playerHealth);
export const usePlayerStats = () => useGameStore(
  state => ({
    level: state.playerLevel,
    experience: state.playerExperience,
    nextLevelExp: state.playerNextLevelExp,
    health: state.playerHealth,
    maxHealth: state.playerMaxHealth
  }),
  shallow
);

// Wave state hooks
export const useCurrentWave = () => useGameStore(state => state.currentWave);
export const useIsWaveActive = () => useGameStore(state => state.isWaveActive);
export const useWaveInProgress = () => useGameStore(state => state.waveInProgress);
export const useEnemiesRemaining = () => useGameStore(state => state.enemiesRemaining);
export const useWaveInfo = () => useGameStore(
  state => ({
    currentWave: state.currentWave,
    isWaveActive: state.isWaveActive,
    waveInProgress: state.waveInProgress,
    enemiesRemaining: state.enemiesRemaining,
    nextWaveTime: state.nextWaveTime
  }),
  shallow
);

// Statistics hooks
export const useGameStats = () => useGameStore(state => state.stats);

// Action hooks
export const useGameActions = () => useGameStore(
  state => ({
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
  }),
  shallow
);

export const useResourceActions = () => useGameStore(
  state => ({
    addCurrency: state.addCurrency,
    spendCurrency: state.spendCurrency,
    addScore: state.addScore,
    loseLife: state.loseLife
  }),
  shallow
);

export const usePlayerActions = () => useGameStore(
  state => ({
    addExperience: state.addExperience,
    levelUp: state.levelUp,
    setPlayerHealth: state.setPlayerHealth
  }),
  shallow
);

export const useStatisticActions = () => useGameStore(
  state => ({
    recordEnemyKill: state.recordEnemyKill,
    recordTowerBuilt: state.recordTowerBuilt,
    recordDamageDealt: state.recordDamageDealt,
    updateGameTime: state.updateGameTime
  }),
  shallow
);

// Selector hooks
export const useCanAfford = (cost: number) => useGameStore(state => state.canAfford(cost));
export const useIsAlive = () => useGameStore(state => state.isAlive());
export const useFormattedGameTime = () => useGameStore(state => state.getFormattedTime());

// Combined hooks for components
export const useGameUI = () => useGameStore(
  state => ({
    gameState: state.gameState,
    isPaused: state.isPaused,
    isGameOver: state.isGameOver,
    isWaveActive: state.isWaveActive,
    waveInProgress: state.waveInProgress,
    canStartWave: !state.waveInProgress && !state.isGameOver,
    pauseGame: state.pauseGame,
    resumeGame: state.resumeGame,
    startNextWave: () => state.startWave(state.currentWave + 1)
  }),
  shallow
);