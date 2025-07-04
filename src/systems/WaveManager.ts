import { Enemy, EnemyType } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import type { SpawnZoneManager, GameStateSnapshot } from './SpawnZoneManager';
import { InfiniteWaveGenerator, type InfiniteWaveGeneratorConfig } from './InfiniteWaveGenerator';
import { ENEMY_STATS } from '@/config/EnemyConfig';
import type { Grid } from './Grid';

export type EnemySpawnConfig = {
  type: EnemyType;
  count: number;
  spawnDelay: number; // Delay between spawns in ms
  spawnPattern?: SpawnPattern; // Optional spawn pattern override
}

export type WaveConfig = {
  waveNumber: number;
  enemies: EnemySpawnConfig[];
  startDelay: number; // Delay before wave starts
  spawnPattern?: SpawnPattern; // Wave-wide spawn pattern
}

export enum SpawnPattern {
  SINGLE_POINT = 'SINGLE_POINT',      // All enemies from one spawn point
  RANDOM = 'RANDOM',                  // Random spawn point for each enemy
  ROUND_ROBIN = 'ROUND_ROBIN',        // Cycle through spawn points
  DISTRIBUTED = 'DISTRIBUTED',        // Evenly distribute across spawn points
  EDGE_FOCUSED = 'EDGE_FOCUSED',      // Prefer edge spawn points
  CORNER_FOCUSED = 'CORNER_FOCUSED',  // Prefer corner spawn points
  BURST_SPAWN = 'BURST_SPAWN',        // Multiple enemies spawn simultaneously from different edges
  PINCER_MOVEMENT = 'PINCER_MOVEMENT',// Enemies spawn from opposite edges
  ADAPTIVE_SPAWN = 'ADAPTIVE_SPAWN',  // Spawn locations based on game state
  CHAOS_MODE = 'CHAOS_MODE'           // Completely random spawning
}

interface SpawnQueueItem {
  type: EnemyType;
  spawnTime: number;
  spawnPointIndex?: number; // Predetermined spawn point index
}

export class WaveManager {
  private spawnPoints: Vector2[];
  private currentSpawnIndex: number = 0;
  private waves: WaveConfig[] = [];
  private enemiesInWave: Enemy[] = [];
  private spawnQueue: SpawnQueueItem[] = [];
  private currentTime: number = 0;
  private spawning: boolean = false;
  private waveActive: boolean = false;
  private defaultSpawnPattern: SpawnPattern = SpawnPattern.RANDOM;
  private spawnZoneManager?: SpawnZoneManager;
  private useDynamicSpawning: boolean = false;
  private infiniteWaveGenerator?: InfiniteWaveGenerator;
  private infiniteWavesEnabled: boolean = false;
  private infiniteWaveStartAt: number = 11;
  private gridWidth: number = 30;
  private gridHeight: number = 30;
  private cellSize: number = 32;
  private grid?: Grid;
  
  // Difficulty multipliers
  private enemyHealthMultiplier: number = 1.0;
  private enemySpeedMultiplier: number = 1.0;
  
  public currentWave: number = 0;

  constructor(spawnPoints: Vector2[] | Vector2) {
    // Support both single spawn point (backward compatibility) and multiple
    if (Array.isArray(spawnPoints)) {
      this.spawnPoints = spawnPoints
        .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number')
        .map(p => ({ ...p }));
    } else if (spawnPoints && typeof spawnPoints.x === 'number' && typeof spawnPoints.y === 'number') {
      this.spawnPoints = [{ ...spawnPoints }];
    } else {
      console.warn('WaveManager: No valid spawn points provided, using default');
      this.spawnPoints = [{ x: 100, y: 100 }]; // Default fallback position
    }

    if (this.spawnPoints.length === 0) {
      console.warn('WaveManager: No valid spawn points after filtering, using default');
      this.spawnPoints = [{ x: 100, y: 100 }]; // Default fallback position
    }
  }

  setSpawnZoneManager(manager: SpawnZoneManager): void {
    this.spawnZoneManager = manager;
    this.useDynamicSpawning = true;
  }

  setGridDimensions(width: number, height: number, cellSize: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.cellSize = cellSize;
  }
  
  setGrid(grid: Grid): void {
    this.grid = grid;
  }
  

  enableDynamicSpawning(enable: boolean): void {
    this.useDynamicSpawning = enable;
  }

  isInfiniteWavesEnabled(): boolean {
    return this.infiniteWavesEnabled;
  }

  getInfiniteWaveGenerator(): InfiniteWaveGenerator | undefined {
    return this.infiniteWaveGenerator;
  }

  setDifficultyMultipliers(healthMultiplier: number, speedMultiplier: number): void {
    this.enemyHealthMultiplier = healthMultiplier;
    this.enemySpeedMultiplier = speedMultiplier;
  }

  enableInfiniteWaves(enable: boolean, startAt: number = 11, config?: Partial<InfiniteWaveGeneratorConfig>): void {
    this.infiniteWavesEnabled = enable;
    this.infiniteWaveStartAt = startAt;
    if (enable && !this.infiniteWaveGenerator) {
      this.infiniteWaveGenerator = new InfiniteWaveGenerator(config);
    }
  }

  setDefaultSpawnPattern(pattern: SpawnPattern): void {
    this.defaultSpawnPattern = pattern;
  }

  loadWaves(waves: WaveConfig[]): void {
    this.waves = [...waves];
  }

  getTotalWaves(): number {
    if (this.infiniteWavesEnabled) {
      return Number.MAX_SAFE_INTEGER; // Infinite waves
    }
    return this.waves.length;
  }

  isInfiniteMode(): boolean {
    return this.infiniteWavesEnabled && this.currentWave >= this.infiniteWaveStartAt;
  }

  private getWaveConfig(waveNumber: number): WaveConfig | null {
    // Use predefined waves for waves before the infinite wave start
    if (waveNumber < this.infiniteWaveStartAt || !this.infiniteWavesEnabled) {
      return this.waves.find(w => w.waveNumber === waveNumber) || null;
    }
    
    // Use infinite generator for waves at or after the start point
    if (this.infiniteWaveGenerator) {
      return this.infiniteWaveGenerator.generateWave(waveNumber);
    }
    
    return null;
  }

  startWave(waveNumber: number): boolean {
    const wave = this.getWaveConfig(waveNumber);
    if (!wave) {
      return false;
    }

    this.currentWave = waveNumber;
    this.waveActive = true;
    this.spawning = true;
    this.currentTime = 0;
    this.enemiesInWave = [];
    this.spawnQueue = [];
    this.currentSpawnIndex = 0;

    // Determine spawn pattern for this wave
    const waveSpawnPattern = wave.spawnPattern || this.defaultSpawnPattern;

    // Build spawn queue
    for (const enemyConfig of wave.enemies) {
      let enemySpawnTime = wave.startDelay;
      const enemySpawnPattern = enemyConfig.spawnPattern || waveSpawnPattern;
      
      // Pre-calculate spawn points for distributed pattern
      const spawnPointIndices = this.calculateSpawnPointDistribution(
        enemyConfig.count, 
        enemySpawnPattern
      );
      
      for (let i = 0; i < enemyConfig.count; i++) {
        this.spawnQueue.push({
          type: enemyConfig.type,
          spawnTime: enemySpawnTime,
          spawnPointIndex: spawnPointIndices[i]
        });
        enemySpawnTime += enemyConfig.spawnDelay;
      }
    }
    
    // Sort spawn queue by spawn time
    this.spawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);

    return true;
  }

  private calculateSpawnPointDistribution(count: number, pattern: SpawnPattern): (number | undefined)[] {
    const indices: (number | undefined)[] = [];
    
    // If using dynamic spawning with SpawnZoneManager, delegate to it
    if (this.useDynamicSpawning && this.spawnZoneManager && 
        (pattern === SpawnPattern.BURST_SPAWN || 
         pattern === SpawnPattern.PINCER_MOVEMENT || 
         pattern === SpawnPattern.ADAPTIVE_SPAWN || 
         pattern === SpawnPattern.CHAOS_MODE)) {
      // These patterns are handled dynamically by SpawnZoneManager
      for (let i = 0; i < count; i++) {
        indices.push(undefined);
      }
      return indices;
    }
    
    switch (pattern) {
      case SpawnPattern.SINGLE_POINT:
        // All enemies from a random single spawn point
        const singleIndex = Math.floor(Math.random() * this.spawnPoints.length);
        for (let i = 0; i < count; i++) {
          indices.push(singleIndex);
        }
        break;
        
      case SpawnPattern.DISTRIBUTED:
        // Evenly distribute enemies across spawn points
        for (let i = 0; i < count; i++) {
          indices.push(i % this.spawnPoints.length);
        }
        break;
        
      case SpawnPattern.EDGE_FOCUSED:
        // Prefer spawn points that are on edges (simplified - assumes first few are edges)
        for (let i = 0; i < count; i++) {
          const edgePointCount = Math.min(2, this.spawnPoints.length);
          indices.push(Math.floor(Math.random() * edgePointCount));
        }
        break;
        
      case SpawnPattern.CORNER_FOCUSED:
        // Prefer corner spawn points (assumes corners are indexed appropriately)
        for (let i = 0; i < count; i++) {
          // Assuming corners might be at indices 0, 1, last-1, last
          const cornerIndices = [
            0, 
            Math.min(1, this.spawnPoints.length - 1),
            Math.max(0, this.spawnPoints.length - 2),
            this.spawnPoints.length - 1
          ].filter((v, i, a) => a.indexOf(v) === i && v < this.spawnPoints.length);
          
          indices.push(cornerIndices[Math.floor(Math.random() * cornerIndices.length)]);
        }
        break;
        
      case SpawnPattern.BURST_SPAWN:
        // For non-dynamic mode, simulate burst by using different points
        const burstPoints = Math.min(count, this.spawnPoints.length);
        for (let i = 0; i < count; i++) {
          indices.push(i % burstPoints);
        }
        break;
        
      case SpawnPattern.PINCER_MOVEMENT:
        // For non-dynamic mode, use first and last spawn points
        for (let i = 0; i < count; i++) {
          indices.push(i % 2 === 0 ? 0 : this.spawnPoints.length - 1);
        }
        break;
        
      case SpawnPattern.ADAPTIVE_SPAWN:
      case SpawnPattern.CHAOS_MODE:
      case SpawnPattern.ROUND_ROBIN:
        // These are handled dynamically
        for (let i = 0; i < count; i++) {
          indices.push(undefined);
        }
        break;
        
      case SpawnPattern.RANDOM:
      default:
        // Random spawn point for each enemy - handled dynamically
        for (let i = 0; i < count; i++) {
          indices.push(undefined);
        }
        break;
    }
    
    return indices;
  }

  private selectSpawnPoint(predeterminedIndex?: number, pattern?: SpawnPattern): Vector2 {
    // Ensure we have valid spawn points
    if (!this.spawnPoints || this.spawnPoints.length === 0) {
      console.warn('WaveManager: No spawn points available, using default');
      return { x: 100, y: 100 };
    }

    if (predeterminedIndex !== undefined && predeterminedIndex >= 0 && predeterminedIndex < this.spawnPoints.length) {
      const point = this.spawnPoints[predeterminedIndex];
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        return { ...point };
      }
    }
    
    // Use SpawnZoneManager for dynamic patterns if available
    if (this.useDynamicSpawning && this.spawnZoneManager) {
      const dynamicPos = this.spawnZoneManager.getNextSpawnPosition(pattern || this.defaultSpawnPattern);
      if (dynamicPos && typeof dynamicPos.x === 'number' && typeof dynamicPos.y === 'number') {
        return { ...dynamicPos };
      }
    }
    
    // Dynamic selection for patterns that weren't pre-calculated
    const activePattern = pattern || this.defaultSpawnPattern;
    let selectedPoint: Vector2 | undefined;

    switch (activePattern) {
      case SpawnPattern.ROUND_ROBIN:
        selectedPoint = this.spawnPoints[this.currentSpawnIndex];
        this.currentSpawnIndex = (this.currentSpawnIndex + 1) % this.spawnPoints.length;
        break;
        
      case SpawnPattern.ADAPTIVE_SPAWN:
      case SpawnPattern.CHAOS_MODE:
        // These patterns default to random when SpawnZoneManager is not available
        selectedPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        break;
        
      case SpawnPattern.RANDOM:
      default:
        selectedPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        break;
    }

    // Validate the selected point
    if (selectedPoint && typeof selectedPoint.x === 'number' && typeof selectedPoint.y === 'number') {
      return { ...selectedPoint };
    }

    // Fallback if no valid point found
    console.warn('WaveManager: Selected spawn point is invalid, using fallback');
    return { x: 100, y: 100 };
  }

  update(deltaTime: number): Enemy[] {
    if (!this.waveActive) {
      return [];
    }

    this.currentTime += deltaTime;
    
    // Remove dead enemies
    this.enemiesInWave = this.enemiesInWave.filter(enemy => enemy.isAlive);

    const spawnedEnemies: Enemy[] = [];

    // Check spawn queue
    while (this.spawnQueue.length > 0 && 
           this.currentTime >= this.spawnQueue[0].spawnTime) {
      const spawnItem = this.spawnQueue.shift()!;
      
      // Get the wave config to determine the pattern
      const wave = this.waves.find(w => w.waveNumber === this.currentWave);
      const wavePattern = wave?.spawnPattern || this.defaultSpawnPattern;
      
      const spawnPoint = this.selectSpawnPoint(spawnItem.spawnPointIndex, wavePattern);
      
      // Apply spawn offset to prevent enemies from getting stuck on edges
      const spawnOffset = this.cellSize * 1.5; // 1.5 cells offset from spawn point
      let adjustedSpawnPoint = { ...spawnPoint };
      
      // Calculate world dimensions
      const worldWidth = this.gridWidth * this.cellSize;
      const worldHeight = this.gridHeight * this.cellSize;
      
      
      // Determine offset direction based on which edge the spawn point is near
      // Move enemies toward the center of the map
      const centerX = worldWidth / 2;
      const centerY = worldHeight / 2;
      
      // Calculate direction vector toward center
      const dirX = centerX - spawnPoint.x;
      const dirY = centerY - spawnPoint.y;
      
      // Normalize and apply offset
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      if (length > 0) {
        adjustedSpawnPoint.x += (dirX / length) * spawnOffset;
        adjustedSpawnPoint.y += (dirY / length) * spawnOffset;
      }
      
      // Clamp to world bounds
      adjustedSpawnPoint.x = Math.max(this.cellSize, Math.min(worldWidth - this.cellSize, adjustedSpawnPoint.x));
      adjustedSpawnPoint.y = Math.max(this.cellSize, Math.min(worldHeight - this.cellSize, adjustedSpawnPoint.y));
      
      
      // Validate the adjusted spawn point is walkable
      if (this.grid) {
        const adjustedGridPos = this.grid.worldToGrid(adjustedSpawnPoint);
        
        // If adjusted position is not walkable, try to find a nearby walkable position
        if (!this.grid.isWalkable(adjustedGridPos.x, adjustedGridPos.y)) {
          // Search in a spiral pattern for a walkable position
          let foundWalkable = false;
          const maxSearchRadius = 3;
          
          for (let radius = 1; radius <= maxSearchRadius && !foundWalkable; radius++) {
            for (let dx = -radius; dx <= radius && !foundWalkable; dx++) {
              for (let dy = -radius; dy <= radius && !foundWalkable; dy++) {
                // Only check positions on the edge of the current radius
                if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                  const checkX = adjustedGridPos.x + dx;
                  const checkY = adjustedGridPos.y + dy;
                  
                  if (this.grid.isInBounds(checkX, checkY) && this.grid.isWalkable(checkX, checkY)) {
                    // Found a walkable position
                    adjustedSpawnPoint = this.grid.gridToWorld(checkX, checkY);
                    foundWalkable = true;
                  }
                }
              }
            }
          }
          
          // If still no walkable position found, use the original spawn point
          if (!foundWalkable) {
            adjustedSpawnPoint = { ...spawnPoint };
          }
        }
      }
      
      // Calculate health based on scaling
      const stats = this.getEnemyStats(spawnItem.type);
      let spawnHealth: number = stats.health;
      
      // Apply difficulty multiplier
      spawnHealth = Math.floor(spawnHealth * this.enemyHealthMultiplier);
      
      // Apply infinite wave multiplier if applicable
      if (this.infiniteWavesEnabled && this.currentWave >= this.infiniteWaveStartAt && this.infiniteWaveGenerator) {
        const infiniteHealthMultiplier = this.infiniteWaveGenerator.getEnemyHealthMultiplier(this.currentWave);
        spawnHealth = Math.floor(spawnHealth * infiniteHealthMultiplier);
      }
      
      // Ensure minimum health
      spawnHealth = Math.max(1, spawnHealth);
      const healthMultiplier = spawnHealth / ENEMY_STATS[spawnItem.type].health;
      
      const enemy = new Enemy(
        spawnItem.type,             // enemyType (first parameter)
        adjustedSpawnPoint,         // position (second parameter)
        this.enemySpeedMultiplier,  // speedMultiplier (third parameter)
        healthMultiplier            // healthMultiplier (fourth parameter)
      );
      
      
      this.enemiesInWave.push(enemy);
      spawnedEnemies.push(enemy);
    }

    // Check if spawning is complete
    if (this.spawnQueue.length === 0) {
      this.spawning = false;
    }

    // Check if wave is complete
    if (!this.spawning && this.enemiesInWave.length === 0) {
      this.waveActive = false;
    }

    return spawnedEnemies;
  }

  isWaveActive(): boolean {
    return this.waveActive;
  }

  isSpawning(): boolean {
    return this.spawning;
  }

  isWaveComplete(): boolean {
    return !this.spawning && this.enemiesInWave.length === 0;
  }

  getEnemiesInWave(): Enemy[] {
    return [...this.enemiesInWave];
  }

  hasNextWave(): boolean {
    if (this.infiniteWavesEnabled) {
      return true; // Always has next wave in infinite mode
    }
    return this.currentWave < this.waves.length;
  }

  getNextWaveNumber(): number {
    return this.currentWave + 1;
  }

  getWaveInfo(waveNumber: number): WaveConfig | null {
    return this.getWaveConfig(waveNumber);
  }
  
  getSpawnPoints(): Vector2[] {
    return [...this.spawnPoints];
  }
  
  setSpawnPoints(spawnPoints: Vector2[]): void {
    this.spawnPoints = spawnPoints.map(p => ({ ...p }));
  }
  
  
  updateWithGameState(_gameState: GameStateSnapshot): void {
    // Pass game state to SpawnZoneManager if available
    if (this.spawnZoneManager && this.useDynamicSpawning) {
      // SpawnZoneManager will use this in its own update method
      // This is called from Game class
    }
  }
  

  private getEnemyStats(type: EnemyType) {
    return ENEMY_STATS[type];
  }

  /**
   * Reset the wave manager to initial state
   */
  reset(): void {
    this.currentWave = 0;
    this.waveActive = false;
    this.spawning = false;
    this.currentTime = 0;
    this.currentSpawnIndex = 0;
    this.enemiesInWave = [];
    this.spawnQueue = [];
    
    // Reset infinite wave generator if enabled
    if (this.infiniteWaveGenerator) {
      this.infiniteWaveGenerator = new InfiniteWaveGenerator();
    }
  }
}