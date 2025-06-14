import { Game } from "@/core/Game";
import { GameEngine,  } from "@/core/GameEngine";
import { Tower, TowerType, UpgradeType } from "@/entities/Tower";
import { Enemy } from "@/entities/Enemy";
import type { Vector2 } from "@/utils/Vector2";
import type { WaveConfig } from "@/systems/WaveManager";
import { EnemyType } from "@/entities/Enemy";
import type { MapData } from "@/types/map";
import { createMockCanvas } from "./canvas";
import { createTestPath } from "./entities";
import { vi } from "vitest";
import type { GameState } from "@/core/GameState";

export interface GameSetupOptions {
  canvas?: HTMLCanvasElement;
  initialCurrency?: number;
  initialLives?: number;
  initialScore?: number;
  mapData?: MapData;
  waveConfigs?: WaveConfig[];
  state?: GameState;
}

export interface GameWithWaveOptions extends GameSetupOptions {
  waveNumber: number;
  autoStart?: boolean;
}

export interface GameWithTowersOptions extends GameSetupOptions {
  towers: Array<{
    type: TowerType;
    position: Vector2;
    level?: number;
  }>;
}

export function createTestGame(options: GameSetupOptions = {}): Game {
  const canvas = options.canvas || createMockCanvas();
  const game = new Game(canvas);

  // Access private fields via any type casting for testing
  const gameAny = game as any;

  if (options.initialCurrency !== undefined) {
    gameAny.currency = options.initialCurrency;
  }

  if (options.initialLives !== undefined) {
    gameAny.lives = options.initialLives;
  }

  if (options.initialScore !== undefined) {
    gameAny.score = options.initialScore;
  }

  if (options.waveConfigs) {
    gameAny.waveManager.loadWaves(options.waveConfigs);
  }

  if (options.state !== undefined) {
    gameAny.engine.setState(options.state);
  }

  return game;
}

export function createTestGameWithWave(options: GameWithWaveOptions): Game {
  const game = createTestGame(options);
  const gameAny = game as any;

  const waveConfigs = options.waveConfigs || createDefaultWaveConfigs();
  gameAny.waveManager.loadWaves(waveConfigs);

  if (options.autoStart !== false) {
    game.startNextWave();
  }

  return game;
}

export function createTestGameWithTowers(options: GameWithTowersOptions): Game {
  const game = createTestGame(options);
  const gameAny = game as any;

  options.towers.forEach((towerConfig) => {
    const gridPos = gameAny.grid.worldToGrid(towerConfig.position);
    game.placeTower(towerConfig.type, towerConfig.position);

    // Find the tower we just placed
    const tower = gameAny.towers[gameAny.towers.length - 1];

    if (tower && towerConfig.level && towerConfig.level > 1) {
      // Tower levels need to be set via the level property, not upgrades
      const towerAny = tower as any;
      towerAny.level = towerConfig.level;
    }
  });

  return game;
}

export function createDefaultMapData(): MapData {
  const path = createTestPath([
    { x: 0, y: 9 },
    { x: 5, y: 9 },
    { x: 5, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 13 },
    { x: 15, y: 13 },
    { x: 15, y: 9 },
    { x: 24, y: 9 },
  ]);

  return {
    paths: [path],
    placeable: createPlaceableGrid(25, 19, [path]),
    spawns: [{ x: 0, y: 9 }],
    exits: [{ x: 24, y: 9 }],
    width: 25,
    height: 19,
  };
}

export function createDefaultWaveConfigs(): WaveConfig[] {
  return [
    {
      waveNumber: 1,
      enemies: [{ type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }],
      startDelay: 1000,
    },
    {
      waveNumber: 2,
      enemies: [
        { type: EnemyType.BASIC, count: 5, spawnDelay: 800 },
        { type: EnemyType.FAST, count: 3, spawnDelay: 600 },
      ],
      startDelay: 2000,
    },
    {
      waveNumber: 3,
      enemies: [
        { type: EnemyType.BASIC, count: 10, spawnDelay: 500 },
        { type: EnemyType.FAST, count: 5, spawnDelay: 400 },
        { type: EnemyType.TANK, count: 2, spawnDelay: 2000 },
      ],
      startDelay: 2000,
    },
  ];
}

export function createPlaceableGrid(
  width: number,
  height: number,
  paths: Array<{ points: Vector2[] }>
): boolean[][] {
  const grid: boolean[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(true));

  paths.forEach((path) => {
    for (let i = 0; i < path.points.length - 1; i++) {
      const start = path.points[i];
      const end = path.points[i + 1];

      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);

      let x = start.x;
      let y = start.y;

      while (x !== end.x || y !== end.y) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          grid[y][x] = false;
        }

        if (x !== end.x) x += dx;
        if (y !== end.y) y += dy;
      }
    }

    const lastPoint = path.points[path.points.length - 1];
    if (
      lastPoint.x >= 0 &&
      lastPoint.x < width &&
      lastPoint.y >= 0 &&
      lastPoint.y < height
    ) {
      grid[lastPoint.y][lastPoint.x] = false;
    }
  });

  return grid;
}

export function simulateGameFrames(
  game: Game,
  frameCount: number,
  deltaTime = 16
): void {
  for (let i = 0; i < frameCount; i++) {
    game.update(deltaTime);
  }
}

export function getGameEntities(game: Game): {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: any[];
} {
  const gameAny = game as any;
  return {
    towers: gameAny.towers,
    enemies: gameAny.enemies,
    projectiles: gameAny.projectiles,
  };
}

export function getTowerAt(
  game: Game,
  gridX: number,
  gridY: number
): Tower | undefined {
  const gameAny = game as any;
  return gameAny.towers.find((tower: Tower) => {
    const towerGrid = gameAny.grid.worldToGrid(tower.position);
    return towerGrid.x === gridX && towerGrid.y === gridY;
  });
}

export function getEnemiesInRange(
  game: Game,
  position: Vector2,
  range: number
): Enemy[] {
  const gameAny = game as any;
  return gameAny.enemies.filter((enemy: Enemy) => {
    const dx = enemy.position.x - position.x;
    const dy = enemy.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= range;
  });
}

export function simulateWaveCompletion(game: Game): void {
  const gameAny = game as any;
  gameAny.enemies.forEach((enemy: Enemy) => {
    enemy.health = 0;
  });
  gameAny.enemies = [];

  if (gameAny.waveManager.isWaveActive()) {
    // Clear enemies in wave - enemiesInWave is an array
    gameAny.waveManager.enemiesInWave = [];
  }
}

export function simulatePlayerDeath(game: Game): void {
  const gameAny = game as any;
  gameAny.lives = 0;
}

export function simulateVictory(game: Game): void {
  const gameAny = game as any;
  const totalWaves = gameAny.waveManager.waves.length;
  gameAny.waveManager.currentWave = totalWaves;
  simulateWaveCompletion(game);
}

export function mockGameEngineCallbacks(engine: GameEngine): {
  onUpdate: ReturnType<typeof vi.fn>;
  onRender: ReturnType<typeof vi.fn>;
  onStateChange: ReturnType<typeof vi.fn>;
} {
  const onUpdate = vi.fn();
  const onRender = vi.fn();
  const onStateChange = vi.fn();

  engine.onUpdate(onUpdate);
  engine.onRender(onRender);
  // Note: GameEngine doesn't have onStateChange, so we'll need to handle that differently

  return { onUpdate, onRender, onStateChange };
}
