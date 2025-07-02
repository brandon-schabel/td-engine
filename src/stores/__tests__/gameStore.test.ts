import { describe, it, expect, beforeEach } from 'bun:test';
import { gameStore, GameState } from '../gameStore';
import { GAME_INIT } from '@/config/GameConfig';

describe('gameStore', () => {
  beforeEach(() => {
    gameStore.getState().resetGame();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = gameStore.getState();
      
      expect(state.gameState).toBe('MENU');
      expect(state.currency).toBe(GAME_INIT.startingCurrency);
      expect(state.lives).toBe(GAME_INIT.startingLives);
      expect(state.score).toBe(GAME_INIT.startingScore);
      expect(state.playerLevel).toBe(1);
      expect(state.playerExperience).toBe(0);
      expect(state.playerNextLevelExp).toBe(100);
    });
  });

  describe('game state management', () => {
    it('should update game state correctly', () => {
      const { setGameState } = gameStore.getState();
      
      setGameState('PLAYING');
      expect(gameStore.getState().gameState).toBe('PLAYING');
      expect(gameStore.getState().isPaused).toBe(false);
      
      setGameState('GAME_OVER');
      expect(gameStore.getState().gameState).toBe('GAME_OVER');
      expect(gameStore.getState().isGameOver).toBe(true);
      expect(gameStore.getState().isPaused).toBe(true);
    });
  });

  describe('resource management', () => {
    it('should handle currency correctly', () => {
      const { addCurrency, spendCurrency } = gameStore.getState();
      
      addCurrency(100);
      expect(gameStore.getState().currency).toBe(GAME_INIT.startingCurrency + 100);
      expect(gameStore.getState().stats.totalCurrencyEarned).toBe(100);
      
      const canSpend = spendCurrency(50);
      expect(canSpend).toBe(true);
      expect(gameStore.getState().currency).toBe(GAME_INIT.startingCurrency + 50);
      
      const cantSpend = spendCurrency(1000);
      expect(cantSpend).toBe(false);
      expect(gameStore.getState().currency).toBe(GAME_INIT.startingCurrency + 50);
    });

    it('should handle lives correctly', () => {
      const { loseLife } = gameStore.getState();
      
      loseLife(1);
      expect(gameStore.getState().lives).toBe(GAME_INIT.startingLives - 1);
      
      // Lose all lives
      loseLife(100);
      expect(gameStore.getState().lives).toBe(0);
      expect(gameStore.getState().gameState).toBe('GAME_OVER');
      expect(gameStore.getState().isGameOver).toBe(true);
    });
  });

  describe('player progression', () => {
    it('should handle experience and leveling', () => {
      const { addExperience } = gameStore.getState();
      
      addExperience(50);
      expect(gameStore.getState().playerExperience).toBe(50);
      expect(gameStore.getState().playerLevel).toBe(1);
      
      // Level up
      addExperience(60);
      expect(gameStore.getState().playerLevel).toBe(2);
      expect(gameStore.getState().playerExperience).toBe(10);
      expect(gameStore.getState().playerNextLevelExp).toBe(150);
      
      // Multiple level ups
      addExperience(300);
      expect(gameStore.getState().playerLevel).toBe(3);
    });
  });

  describe('statistics tracking', () => {
    it('should track enemy kills by type', () => {
      const { recordEnemyKill } = gameStore.getState();
      
      recordEnemyKill('goblin', 10);
      recordEnemyKill('goblin', 10);
      recordEnemyKill('orc', 20);
      
      const stats = gameStore.getState().stats;
      expect(stats.enemiesKilled).toBe(3);
      expect(stats.enemyTypeKills['goblin']).toBe(2);
      expect(stats.enemyTypeKills['orc']).toBe(1);
      expect(stats.totalCurrencyEarned).toBe(40);
    });

    it('should track towers built by type', () => {
      const { recordTowerBuilt } = gameStore.getState();
      
      recordTowerBuilt('cannon');
      recordTowerBuilt('cannon');
      recordTowerBuilt('laser');
      
      const stats = gameStore.getState().stats;
      expect(stats.towersBuilt).toBe(3);
      expect(stats.towerTypesBuilt['cannon']).toBe(2);
      expect(stats.towerTypesBuilt['laser']).toBe(1);
    });
  });

  describe('wave management', () => {
    it('should handle wave state correctly', () => {
      const { startWave, endWave, setEnemiesRemaining } = gameStore.getState();
      
      startWave(1);
      expect(gameStore.getState().currentWave).toBe(1);
      expect(gameStore.getState().isWaveActive).toBe(true);
      expect(gameStore.getState().waveInProgress).toBe(true);
      
      setEnemiesRemaining(10);
      expect(gameStore.getState().enemiesRemaining).toBe(10);
      
      endWave();
      expect(gameStore.getState().isWaveActive).toBe(false);
      expect(gameStore.getState().waveInProgress).toBe(false);
      expect(gameStore.getState().enemiesRemaining).toBe(0);
      expect(gameStore.getState().stats.wavesSurvived).toBe(1);
    });
  });

  describe('reset functionality', () => {
    it('should reset all state to initial values', () => {
      const { 
        addCurrency, 
        recordEnemyKill, 
        addExperience,
        startWave,
        resetGame 
      } = gameStore.getState();
      
      // Modify state
      addCurrency(1000);
      recordEnemyKill('goblin', 10);
      addExperience(200);
      startWave(5);
      
      // Reset
      resetGame();
      
      const state = gameStore.getState();
      expect(state.gameState).toBe('MENU');
      expect(state.currency).toBe(GAME_INIT.startingCurrency);
      expect(state.playerLevel).toBe(1);
      expect(state.playerExperience).toBe(0);
      expect(state.currentWave).toBe(0);
      expect(state.stats.enemiesKilled).toBe(0);
      expect(state.stats.enemyTypeKills).toEqual({});
    });
  });
});