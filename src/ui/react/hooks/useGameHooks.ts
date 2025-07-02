/**
 * Custom hooks for commonly used game state combinations
 * These hooks provide optimized subscriptions to game store slices
 */

import { useGameStore, useResources, useWaveInfo, usePlayerStats } from '@/stores/hooks/useGameStore';
import { usePlayer, useSelectedTower, useTowers, useEnemies } from '@/stores/entityStore';
import { shallow } from 'zustand/shallow';

/**
 * Hook for game header displays - combines resources and wave info
 */
export const useGameHeader = () => {
  const resources = useResources();
  const waveInfo = useWaveInfo();
  const playerStats = usePlayerStats();
  
  return {
    ...resources,
    ...waveInfo,
    ...playerStats
  };
};

/**
 * Hook for tower placement logic
 */
export const useTowerPlacement = () => {
  const currency = useGameStore(state => state.currency);
  const canAfford = useGameStore(state => state.canAfford);
  const spendCurrency = useGameStore(state => state.spendCurrency);
  const recordTowerBuilt = useGameStore(state => state.recordTowerBuilt);
  
  return {
    currency,
    canAfford,
    spendCurrency,
    recordTowerBuilt
  };
};

/**
 * Hook for enemy management
 */
export const useEnemyManagement = () => {
  const enemies = useEnemies();
  const enemiesRemaining = useGameStore(state => state.enemiesRemaining);
  const setEnemiesRemaining = useGameStore(state => state.setEnemiesRemaining);
  const recordEnemyKill = useGameStore(state => state.recordEnemyKill);
  
  return {
    enemies,
    enemiesRemaining,
    setEnemiesRemaining,
    recordEnemyKill,
    enemyCount: enemies.length
  };
};

/**
 * Hook for wave management UI
 */
export const useWaveManagement = () => {
  const waveInfo = useWaveInfo();
  const { startWave, endWave } = useGameStore(
    state => ({ startWave: state.startWave, endWave: state.endWave }),
    shallow
  );
  
  return {
    ...waveInfo,
    startNextWave: () => startWave(waveInfo.currentWave + 1),
    endCurrentWave: endWave,
    canStartWave: !waveInfo.waveInProgress && !waveInfo.isWaveActive
  };
};

/**
 * Hook for player upgrades UI
 */
export const usePlayerUpgrades = () => {
  const player = usePlayer();
  const playerStats = usePlayerStats();
  const { addExperience, levelUp, setPlayerHealth } = useGameStore(
    state => ({
      addExperience: state.addExperience,
      levelUp: state.levelUp,
      setPlayerHealth: state.setPlayerHealth
    }),
    shallow
  );
  
  return {
    player,
    ...playerStats,
    addExperience,
    levelUp,
    setPlayerHealth,
    isMaxLevel: playerStats.level >= 50
  };
};

/**
 * Hook for game over state
 */
export const useGameOver = () => {
  const { isGameOver, lives, gameOver, resetGame } = useGameStore(
    state => ({
      isGameOver: state.isGameOver,
      lives: state.lives,
      gameOver: state.gameOver,
      resetGame: state.resetGame
    }),
    shallow
  );
  
  return {
    isGameOver,
    lives,
    isAlive: lives > 0,
    triggerGameOver: gameOver,
    restartGame: resetGame
  };
};

/**
 * Hook for statistics display
 */
export const useGameStatistics = () => {
  const stats = useGameStore(state => state.stats);
  const formattedTime = useGameStore(state => state.getFormattedTime());
  
  return {
    ...stats,
    formattedTime,
    averageKillsPerWave: stats.wavesSurvived > 0 
      ? Math.round(stats.enemiesKilled / stats.wavesSurvived) 
      : 0
  };
};