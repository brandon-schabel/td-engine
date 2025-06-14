import { Game } from '@/core/Game';
import { Tower, TowerType, UpgradeType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Player } from '@/entities/Player';
import { Vector2 } from '@/utils/Vector2';
import { MapData, Path } from '@/types/map';
import { WaveConfig } from '@/systems/WaveManager';
import { createMockCanvas } from './canvas';
import { Grid } from '@/systems/Grid';

/**
 * Builder pattern for creating complex test scenarios
 */
export class GameScenarioBuilder {
  private canvas: HTMLCanvasElement;
  private initialCurrency = 100;
  private initialLives = 20;
  private initialScore = 0;
  private towers: Array<{ type: TowerType; position: Vector2; upgrades?: UpgradeType[] }> = [];
  private enemies: Array<{ type: EnemyType; position: Vector2; health?: number }> = [];
  private waveConfigs: WaveConfig[] = [];
  private mapData?: MapData;
  
  constructor() {
    this.canvas = createMockCanvas();
  }
  
  withCurrency(amount: number): this {
    this.initialCurrency = amount;
    return this;
  }
  
  withLives(lives: number): this {
    this.initialLives = lives;
    return this;
  }
  
  withScore(score: number): this {
    this.initialScore = score;
    return this;
  }
  
  withTower(type: TowerType, gridX: number, gridY: number, upgrades?: UpgradeType[]): this {
    const cellSize = 32;
    this.towers.push({
      type,
      position: {
        x: gridX * cellSize + cellSize / 2,
        y: gridY * cellSize + cellSize / 2
      },
      upgrades
    });
    return this;
  }
  
  withEnemy(type: EnemyType, x: number, y: number, health?: number): this {
    this.enemies.push({ type, position: { x, y }, health });
    return this;
  }
  
  withWave(config: WaveConfig): this {
    this.waveConfigs.push(config);
    return this;
  }
  
  withMap(mapData: MapData): this {
    this.mapData = mapData;
    return this;
  }
  
  withSimplePath(): this {
    const path: Path = {
      id: 'test-path',
      points: [
        { x: 0, y: 9 },
        { x: 12, y: 9 },
        { x: 12, y: 5 },
        { x: 24, y: 5 }
      ],
      length: 32
    };
    
    this.mapData = {
      paths: [path],
      placeable: this.generatePlaceableGrid(25, 19, [path]),
      spawns: [{ x: 0, y: 9 }],
      exits: [{ x: 24, y: 5 }],
      width: 25,
      height: 19
    };
    
    return this;
  }
  
  build(): Game {
    const game = new Game(this.canvas);
    const gameAny = game as any;
    
    // Set initial resources
    gameAny.currency = this.initialCurrency;
    gameAny.lives = this.initialLives;
    gameAny.score = this.initialScore;
    
    // Set map data if provided
    if (this.mapData) {
      gameAny.mapData = this.mapData;
      gameAny.grid.placeable = this.mapData.placeable;
    }
    
    // Place towers without deducting currency
    this.towers.forEach(towerConfig => {
      const tower = new Tower(towerConfig.type, towerConfig.position);
      
      // Apply upgrades if specified
      if (towerConfig.upgrades && towerConfig.upgrades.length > 0) {
        towerConfig.upgrades.forEach(upgrade => {
          tower.upgrade(upgrade);
        });
      }
      
      gameAny.towers.push(tower);
    });
    
    // Add enemies
    this.enemies.forEach(enemyConfig => {
      const enemy = new Enemy(
        enemyConfig.position,
        enemyConfig.health ?? 100,
        enemyConfig.type
      );
      
      // Set path if map data exists
      if (this.mapData && this.mapData.paths.length > 0) {
        enemy.setPath(this.mapData.paths[0].points);
      }
      
      gameAny.enemies.push(enemy);
    });
    
    // Load wave configs
    if (this.waveConfigs.length > 0) {
      gameAny.waveManager.loadWaves(this.waveConfigs);
    }
    
    return game;
  }
  
  private generatePlaceableGrid(width: number, height: number, paths: Path[]): boolean[][] {
    const grid: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(true));
    
    paths.forEach(path => {
      for (let i = 0; i < path.points.length - 1; i++) {
        const start = path.points[i];
        const end = path.points[i + 1];
        
        // Mark cells along the path as not placeable
        const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        for (let step = 0; step <= steps; step++) {
          const t = steps === 0 ? 0 : step / steps;
          const x = Math.round(start.x + (end.x - start.x) * t);
          const y = Math.round(start.y + (end.y - start.y) * t);
          
          if (x >= 0 && x < width && y >= 0 && y < height) {
            grid[y][x] = false;
          }
        }
      }
    });
    
    return grid;
  }
}

/**
 * Builder for complex tower configurations
 */
export class TowerBuilder {
  private type: TowerType = TowerType.BASIC;
  private position: Vector2 = { x: 100, y: 100 };
  private level = 1;
  private upgrades: UpgradeType[] = [];
  private health?: number;
  private target?: Enemy;
  
  ofType(type: TowerType): this {
    this.type = type;
    return this;
  }
  
  at(x: number, y: number): this {
    this.position = { x, y };
    return this;
  }
  
  atGrid(gridX: number, gridY: number, cellSize = 32): this {
    this.position = {
      x: gridX * cellSize + cellSize / 2,
      y: gridY * cellSize + cellSize / 2
    };
    return this;
  }
  
  withLevel(level: number): this {
    this.level = level;
    return this;
  }
  
  withUpgrades(...upgrades: UpgradeType[]): this {
    this.upgrades = upgrades;
    return this;
  }
  
  withHealth(health: number): this {
    this.health = health;
    return this;
  }
  
  targeting(enemy: Enemy): this {
    this.target = enemy;
    return this;
  }
  
  build(): Tower {
    const tower = new Tower(this.type, this.position);
    
    // If specific upgrades were provided, apply those
    if (this.upgrades.length > 0) {
      this.upgrades.forEach(upgrade => {
        tower.upgrade(upgrade);
      });
    } else {
      // Otherwise, apply upgrades to reach desired level
      // Formula: level = 1 + Math.floor(totalUpgrades / 3)
      // So for level L, we need totalUpgrades = (L-1) * 3
      const upgradesNeeded = (this.level - 1) * 3;
      
      // Spread upgrades across different types to avoid hitting individual limits
      const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
      for (let i = 0; i < upgradesNeeded; i++) {
        const upgradeType = upgradeTypes[i % upgradeTypes.length];
        tower.upgrade(upgradeType);
      }
    }
    
    // Set health if specified
    if (this.health !== undefined) {
      tower.health = this.health;
    }
    
    // Set target if specified
    if (this.target) {
      (tower as any).target = this.target;
    }
    
    return tower;
  }
}

/**
 * Builder for enemy configurations
 */
export class EnemyBuilder {
  private type: EnemyType = EnemyType.BASIC;
  private position: Vector2 = { x: 0, y: 0 };
  private health = 100;
  private path?: Vector2[];
  private pathProgress = 0;
  private speed?: number;
  
  ofType(type: EnemyType): this {
    this.type = type;
    return this;
  }
  
  at(x: number, y: number): this {
    this.position = { x, y };
    return this;
  }
  
  withHealth(health: number): this {
    this.health = health;
    return this;
  }
  
  withPath(points: Vector2[]): this {
    this.path = points;
    return this;
  }
  
  withPathProgress(progress: number): this {
    this.pathProgress = progress;
    return this;
  }
  
  withSpeed(speed: number): this {
    this.speed = speed;
    return this;
  }
  
  build(): Enemy {
    const enemy = new Enemy(this.position, this.health, this.type);
    
    if (this.path) {
      enemy.setPath(this.path);
      if (this.pathProgress > 0) {
        (enemy as any).pathProgress = this.pathProgress;
      }
    }
    
    if (this.speed !== undefined) {
      enemy.speed = this.speed;
    }
    
    return enemy;
  }
}

/**
 * Builder for wave configurations
 */
export class WaveBuilder {
  private waveNumber = 1;
  private enemyGroups: Array<{ type: EnemyType; count: number; spawnDelay: number }> = [];
  private startDelay = 1000;
  
  number(n: number): this {
    this.waveNumber = n;
    return this;
  }
  
  withEnemies(type: EnemyType, count: number, spawnDelay = 1000): this {
    this.enemyGroups.push({ type, count, spawnDelay });
    return this;
  }
  
  withStartDelay(delay: number): this {
    this.startDelay = delay;
    return this;
  }
  
  build(): WaveConfig {
    return {
      waveNumber: this.waveNumber,
      enemies: this.enemyGroups,
      startDelay: this.startDelay
    };
  }
}

/**
 * Builder for map configurations
 */
export class MapBuilder {
  private width = 25;
  private height = 19;
  private paths: Path[] = [];
  private spawns: Vector2[] = [];
  private exits: Vector2[] = [];
  private obstacles: Vector2[] = [];
  
  withSize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }
  
  withPath(points: Vector2[], id?: string): this {
    const path: Path = {
      id: id || `path-${this.paths.length}`,
      points,
      length: this.calculatePathLength(points)
    };
    this.paths.push(path);
    
    // Auto-detect spawns and exits if not set
    if (this.spawns.length === 0) {
      this.spawns.push(points[0]);
    }
    if (this.exits.length === 0) {
      this.exits.push(points[points.length - 1]);
    }
    
    return this;
  }
  
  withSpawn(x: number, y: number): this {
    this.spawns.push({ x, y });
    return this;
  }
  
  withExit(x: number, y: number): this {
    this.exits.push({ x, y });
    return this;
  }
  
  withObstacle(x: number, y: number): this {
    this.obstacles.push({ x, y });
    return this;
  }
  
  build(): MapData {
    const placeable = this.generatePlaceableGrid();
    
    return {
      width: this.width,
      height: this.height,
      paths: this.paths,
      spawns: this.spawns,
      exits: this.exits,
      placeable
    };
  }
  
  private calculatePathLength(points: Vector2[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }
  
  private generatePlaceableGrid(): boolean[][] {
    const grid: boolean[][] = Array(this.height).fill(null).map(() => Array(this.width).fill(true));
    
    // Mark path cells as not placeable
    this.paths.forEach(path => {
      for (let i = 0; i < path.points.length - 1; i++) {
        const start = path.points[i];
        const end = path.points[i + 1];
        
        const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        for (let step = 0; step <= steps; step++) {
          const t = steps === 0 ? 0 : step / steps;
          const x = Math.round(start.x + (end.x - start.x) * t);
          const y = Math.round(start.y + (end.y - start.y) * t);
          
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            grid[y][x] = false;
          }
        }
      }
    });
    
    // Mark obstacles as not placeable
    this.obstacles.forEach(obstacle => {
      if (obstacle.x >= 0 && obstacle.x < this.width && 
          obstacle.y >= 0 && obstacle.y < this.height) {
        grid[obstacle.y][obstacle.x] = false;
      }
    });
    
    return grid;
  }
}