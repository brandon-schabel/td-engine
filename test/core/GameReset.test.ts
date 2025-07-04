import { describe, it, expect, beforeEach } from 'vitest';
import { gameStore } from '@/stores/gameStore';
import { utilizeEntityStore } from '@/stores/entityStore';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { resetGame } from '@/core/gameManagement';

describe('Game Reset Functionality', () => {
  beforeEach(() => {
    // Reset stores to initial state
    gameStore.getState().resetGame();
    utilizeEntityStore.getState().clearAllEntities();
    uiStore.getState().closeAllPanels(true);
  });

  it('should reset game store to initial values', () => {
    // Modify some values
    gameStore.getState().addCurrency(500);
    gameStore.getState().addScore(1000);
    gameStore.getState().loseLife(2);
    gameStore.getState().startWave(5);
    gameStore.getState().recordEnemyKill('basic', 10);
    
    // Verify values changed
    const stateBeforeReset = gameStore.getState();
    expect(stateBeforeReset.currency).toBeGreaterThan(100);
    expect(stateBeforeReset.score).toBe(1000);
    expect(stateBeforeReset.lives).toBeLessThan(10);
    expect(stateBeforeReset.currentWave).toBe(5);
    expect(stateBeforeReset.stats.enemiesKilled).toBe(1);
    
    // Reset the game
    gameStore.getState().resetGame();
    
    // Verify all values are reset
    const stateAfterReset = gameStore.getState();
    expect(stateAfterReset.currency).toBe(100); // GAME_INIT.startingCurrency
    expect(stateAfterReset.score).toBe(0);
    expect(stateAfterReset.lives).toBe(10); // GAME_INIT.startingLives
    expect(stateAfterReset.currentWave).toBe(0);
    expect(stateAfterReset.gameState).toBe('MENU');
    expect(stateAfterReset.isPaused).toBe(false);
    expect(stateAfterReset.isGameOver).toBe(false);
    expect(stateAfterReset.stats.enemiesKilled).toBe(0);
    expect(stateAfterReset.stats.enemyTypeKills).toEqual({});
  });

  it('should clear all entities when resetting', () => {
    // Add some mock entities
    const mockTower = { id: 'tower1', position: { x: 0, y: 0 }, isAlive: true } as any;
    const mockEnemy = { id: 'enemy1', position: { x: 10, y: 10 }, isAlive: true } as any;
    
    utilizeEntityStore.getState().addTower(mockTower);
    utilizeEntityStore.getState().addEnemy(mockEnemy);
    utilizeEntityStore.getState().selectTower(mockTower);
    
    // Verify entities were added
    expect(utilizeEntityStore.getState().getAllTowers().length).toBe(1);
    expect(utilizeEntityStore.getState().getAllEnemies().length).toBe(1);
    expect(utilizeEntityStore.getState().selectedTower).toBeTruthy();
    
    // Reset game (which should clear entities)
    gameStore.getState().resetGame();
    
    // Verify all entities are cleared
    expect(utilizeEntityStore.getState().getAllTowers().length).toBe(0);
    expect(utilizeEntityStore.getState().getAllEnemies().length).toBe(0);
    expect(utilizeEntityStore.getState().getAllProjectiles().length).toBe(0);
    expect(utilizeEntityStore.getState().getAllCollectibles().length).toBe(0);
    expect(utilizeEntityStore.getState().selectedTower).toBe(null);
  });

  it('should close all UI panels when resetting', () => {
    // Open a non-exclusive panel that should definitely open
    uiStore.getState().openPanel(UIPanelType.BUILD_MENU);
    
    // Verify panel is open
    expect(uiStore.getState().isPanelOpen(UIPanelType.BUILD_MENU)).toBe(true);
    
    // Reset game
    gameStore.getState().resetGame();
    
    // Verify panel is closed
    expect(uiStore.getState().isPanelOpen(UIPanelType.BUILD_MENU)).toBe(false);
    
    // Test with a modal panel
    uiStore.getState().openPanel(UIPanelType.GAME_OVER);
    expect(uiStore.getState().isPanelOpen(UIPanelType.GAME_OVER)).toBe(true);
    
    // Reset again
    gameStore.getState().resetGame();
    expect(uiStore.getState().isPanelOpen(UIPanelType.GAME_OVER)).toBe(false);
  });

  it('should use centralized reset function correctly', () => {
    // Modify state
    gameStore.getState().addCurrency(500);
    gameStore.getState().startWave(3);
    const mockTower = { id: 'tower1', position: { x: 0, y: 0 }, isAlive: true } as any;
    utilizeEntityStore.getState().addTower(mockTower);
    
    // Use centralized reset
    resetGame(null);
    
    // Verify everything is reset
    expect(gameStore.getState().currency).toBe(100);
    expect(gameStore.getState().currentWave).toBe(0);
    expect(utilizeEntityStore.getState().getAllTowers().length).toBe(0);
  });
});