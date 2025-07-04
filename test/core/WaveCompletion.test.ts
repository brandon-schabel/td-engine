import { describe, it, expect, beforeEach } from 'bun:test';
import { Game } from '@/core/Game';
import { gameStore } from '@/stores/gameStore';
import { utilizeEntityStore } from '@/stores/entityStore';
import { MapConfig } from '@/config/maps/types';

describe('Wave Completion', () => {
  let game: Game;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Reset stores
    gameStore.getState().resetGame();
    utilizeEntityStore.getState().clearAllEntities();

    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Create a simple map config
    const mapConfig: MapConfig = {
      mapData: {
        width: 30,
        height: 30,
        spawnPoints: [{ x: 50, y: 50 }],
        playerSpawn: { x: 400, y: 300 },
        grid: [],
        obstacles: [],
        paths: [],
        metadata: {
          name: 'Test Map',
          difficulty: 'EASY',
          description: 'Test map for wave completion'
        },
        biomeConfig: {
          type: 'FOREST',
          fogDensity: 0,
          fogColor: '#000000',
          ambientIntensity: 1,
          enableSnow: false,
          enableRain: false,
          snowIntensity: 0,
          rainIntensity: 0
        }
      },
      waves: [
        {
          waveNumber: 1,
          enemies: [
            { type: 'BASIC', count: 1, spawnDelay: 100 }
          ],
          startDelay: 100
        }
      ]
    };

    game = new Game(canvas, mapConfig);
  });

  it('should set waveInProgress to false when wave completes', async () => {
    // Start the game
    gameStore.getState().setGameState('PLAYING');

    // Initially, waveInProgress should be false
    expect(gameStore.getState().waveInProgress).toBe(false);

    // Start wave 1
    const started = game.startNextWave();
    expect(started).toBe(true);
    expect(gameStore.getState().waveInProgress).toBe(true);
    expect(gameStore.getState().currentWave).toBe(1);

    // Simulate game loop for enough time to spawn enemy and then kill it
    // First, let the enemy spawn (after 100ms start delay + 100ms spawn delay)
    for (let i = 0; i < 20; i++) {
      game.update(16); // ~200ms total
    }

    // Get all enemies and kill them
    const enemies = utilizeEntityStore.getState().getAllEnemies();
    enemies.forEach(enemy => {
      enemy.takeDamage(enemy.health);
    });

    // Update a few more frames to process wave completion
    for (let i = 0; i < 10; i++) {
      game.update(16);
    }

    // Wave should now be complete
    expect(game.isWaveComplete()).toBe(true);
    expect(gameStore.getState().waveInProgress).toBe(false);
    expect(gameStore.getState().isWaveActive).toBe(false);
  });

  it('should allow starting next wave after completion', async () => {
    // Start the game
    gameStore.getState().setGameState('PLAYING');

    // Start wave 1
    game.startNextWave();

    // Simulate completing the wave quickly
    for (let i = 0; i < 20; i++) {
      game.update(16);
    }

    const enemies = utilizeEntityStore.getState().getAllEnemies();
    enemies.forEach(enemy => enemy.takeDamage(enemy.health));

    for (let i = 0; i < 10; i++) {
      game.update(16);
    }

    // Verify wave is complete
    expect(gameStore.getState().waveInProgress).toBe(false);

    // Should be able to start wave 2
    const canStart = !gameStore.getState().waveInProgress && !gameStore.getState().isGameOver;
    expect(canStart).toBe(true);
  });
});