import { Enemy, EnemyType } from '../entities/Enemy';
import type { Vector2 } from '../utils/Vector2';

export type EnemySpawnConfig = {
  type: EnemyType;
  count: number;
  spawnDelay: number; // Delay between spawns in ms
}

export type WaveConfig = {
  waveNumber: number;
  enemies: EnemySpawnConfig[];
  startDelay: number; // Delay before wave starts
}

interface SpawnQueueItem {
  type: EnemyType;
  spawnTime: number;
}

export class WaveManager {
  private spawnPoint: Vector2;
  private waves: WaveConfig[] = [];
  private enemiesInWave: Enemy[] = [];
  private spawnQueue: SpawnQueueItem[] = [];
  private waveStartTime: number = 0;
  private currentTime: number = 0;
  private spawning: boolean = false;
  private waveActive: boolean = false;
  
  public currentWave: number = 0;

  constructor(spawnPoint: Vector2) {
    this.spawnPoint = { ...spawnPoint };
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

    // Build spawn queue
    for (const enemyConfig of wave.enemies) {
      let enemySpawnTime = wave.startDelay;
      for (let i = 0; i < enemyConfig.count; i++) {
        this.spawnQueue.push({
          type: enemyConfig.type,
          spawnTime: enemySpawnTime
        });
        enemySpawnTime += enemyConfig.spawnDelay;
      }
    }
    
    // Sort spawn queue by spawn time
    this.spawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);

    return true;
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
      const enemy = new Enemy(
        { ...this.spawnPoint },
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
}