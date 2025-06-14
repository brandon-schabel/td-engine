import { Enemy, EnemyType } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import type { SpawnZoneManager, GameStateSnapshot } from './SpawnZoneManager';

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
  private waveStartTime: number = 0;
  private currentTime: number = 0;
  private spawning: boolean = false;
  private waveActive: boolean = false;
  private defaultSpawnPattern: SpawnPattern = SpawnPattern.RANDOM;
  private spawnZoneManager?: SpawnZoneManager;
  private useDynamicSpawning: boolean = false;
  
  public currentWave: number = 0;

  constructor(spawnPoints: Vector2[] | Vector2) {
    // Support both single spawn point (backward compatibility) and multiple
    if (Array.isArray(spawnPoints)) {
      this.spawnPoints = spawnPoints.map(p => ({ ...p }));
    } else {
      this.spawnPoints = [{ ...spawnPoints }];
    }
  }

  setSpawnZoneManager(manager: SpawnZoneManager): void {
    this.spawnZoneManager = manager;
    this.useDynamicSpawning = true;
  }

  enableDynamicSpawning(enable: boolean): void {
    this.useDynamicSpawning = enable;
  }

  setDefaultSpawnPattern(pattern: SpawnPattern): void {
    this.defaultSpawnPattern = pattern;
  }

  loadWaves(waves: WaveConfig[]): void {
    this.waves = [...waves];
  }

  getTotalWaves(): number {
    return this.waves.length;
  }

  startWave(waveNumber: number): boolean {
    const wave = this.waves.find(w => w.waveNumber === waveNumber);
    if (!wave) {
      return false;
    }

    this.currentWave = waveNumber;
    this.waveActive = true;
    this.spawning = true;
    this.waveStartTime = 0;
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
    if (predeterminedIndex !== undefined && predeterminedIndex < this.spawnPoints.length) {
      return this.spawnPoints[predeterminedIndex];
    }
    
    // Use SpawnZoneManager for dynamic patterns if available
    if (this.useDynamicSpawning && this.spawnZoneManager) {
      const dynamicPos = this.spawnZoneManager.getNextSpawnPosition(pattern || this.defaultSpawnPattern);
      if (dynamicPos) {
        return dynamicPos;
      }
    }
    
    // Dynamic selection for patterns that weren't pre-calculated
    const activePattern = pattern || this.defaultSpawnPattern;
    switch (activePattern) {
      case SpawnPattern.ROUND_ROBIN:
        const point = this.spawnPoints[this.currentSpawnIndex];
        this.currentSpawnIndex = (this.currentSpawnIndex + 1) % this.spawnPoints.length;
        return point;
        
      case SpawnPattern.ADAPTIVE_SPAWN:
      case SpawnPattern.CHAOS_MODE:
        // These patterns default to random when SpawnZoneManager is not available
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        
      case SpawnPattern.RANDOM:
      default:
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }
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
      
      const enemy = new Enemy(
        { ...spawnPoint },
        0, // Will use default health from EnemyType
        spawnItem.type
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
    return this.currentWave < this.waves.length;
  }

  getNextWaveNumber(): number {
    return this.currentWave + 1;
  }

  getWaveInfo(waveNumber: number): WaveConfig | null {
    return this.waves.find(w => w.waveNumber === waveNumber) || null;
  }
  
  getSpawnPoints(): Vector2[] {
    return [...this.spawnPoints];
  }
  
  setSpawnPoints(spawnPoints: Vector2[]): void {
    this.spawnPoints = spawnPoints.map(p => ({ ...p }));
  }
  
  updateWithGameState(gameState: GameStateSnapshot): void {
    // Pass game state to SpawnZoneManager if available
    if (this.spawnZoneManager && this.useDynamicSpawning) {
      // SpawnZoneManager will use this in its own update method
      // This is called from Game class
    }
  }
  
  // Special handling for burst patterns that spawn multiple enemies at once
  private handleBurstSpawn(enemyType: EnemyType, count: number, pattern: SpawnPattern): Enemy[] {
    if (!this.spawnZoneManager || !this.useDynamicSpawning) {
      return [];
    }
    
    const enemies: Enemy[] = [];
    const spawnPositions = this.spawnZoneManager.getSpawnPositionsForPattern(pattern, count);
    
    spawnPositions.forEach(pos => {
      const enemy = new Enemy(
        { ...pos },
        0, // Will use default health from EnemyType
        enemyType
      );
      enemies.push(enemy);
    });
    
    return enemies;
  }
}