import type { Vector2 } from '@/utils/Vector2';
import type { Tower } from '@/entities/Tower';
import type { Player } from '@/entities/Player';
import type { Grid } from './Grid';

export enum EdgeType {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT'
}

export interface SpawnZone {
  id: string;
  position: Vector2;
  gridPosition: Vector2;
  edgeType: EdgeType;
  priority: number;
  isActive: boolean;
  cooldownRemaining: number;
  temporaryDuration?: number;
  activationCondition?: (state: GameStateSnapshot) => boolean;
  spawnCount: number;
  lastSpawnTime: number;
}

export interface GameStateSnapshot {
  lives: number;
  score: number;
  waveNumber: number;
  enemyCount: number;
  towerCount: number;
  playerPosition: Vector2;
}

export interface SpawnZoneConfig {
  maxActiveZones: number;
  zoneCooldown: number;
  edgeWeights: Record<EdgeType, number>;
  adaptiveWeighting: boolean;
  chaosMode: boolean;
  dynamicZoneGeneration: boolean;
}

export class SpawnZoneManager {
  private spawnZones: Map<string, SpawnZone> = new Map();
  private activeZones: Set<string> = new Set();
  private grid: Grid;
  private config: SpawnZoneConfig;
  private spawnHistory: Array<{ zoneId: string; timestamp: number }> = [];
  private edgeSpawnCounts: Record<EdgeType, number>;
  
  constructor(grid: Grid, config: Partial<SpawnZoneConfig> = {}) {
    this.grid = grid;
    this.config = {
      maxActiveZones: 3,
      zoneCooldown: 5000,
      edgeWeights: {
        [EdgeType.TOP]: 1.0,
        [EdgeType.BOTTOM]: 1.0,
        [EdgeType.LEFT]: 1.0,
        [EdgeType.RIGHT]: 1.0,
        [EdgeType.TOP_LEFT]: 1.5,
        [EdgeType.TOP_RIGHT]: 1.5,
        [EdgeType.BOTTOM_LEFT]: 1.5,
        [EdgeType.BOTTOM_RIGHT]: 1.5
      },
      adaptiveWeighting: true,
      chaosMode: false,
      dynamicZoneGeneration: true,
      ...config
    };
    
    this.edgeSpawnCounts = {
      [EdgeType.TOP]: 0,
      [EdgeType.BOTTOM]: 0,
      [EdgeType.LEFT]: 0,
      [EdgeType.RIGHT]: 0,
      [EdgeType.TOP_LEFT]: 0,
      [EdgeType.TOP_RIGHT]: 0,
      [EdgeType.BOTTOM_LEFT]: 0,
      [EdgeType.BOTTOM_RIGHT]: 0
    };
    
    this.generateInitialSpawnZones();
  }
  
  private generateInitialSpawnZones(): void {
    const cellSize = this.grid.cellSize;
    
    // Top edge
    for (let x = 1; x < this.grid.width - 1; x += 2) {
      const zone = this.createSpawnZone(
        { x, y: 0 },
        x <= 2 || x >= this.grid.width - 3 ? 
          (x <= 2 ? EdgeType.TOP_LEFT : EdgeType.TOP_RIGHT) : EdgeType.TOP
      );
      this.spawnZones.set(zone.id, zone);
    }
    
    // Bottom edge
    for (let x = 1; x < this.grid.width - 1; x += 2) {
      const zone = this.createSpawnZone(
        { x, y: this.grid.height - 1 },
        x <= 2 || x >= this.grid.width - 3 ? 
          (x <= 2 ? EdgeType.BOTTOM_LEFT : EdgeType.BOTTOM_RIGHT) : EdgeType.BOTTOM
      );
      this.spawnZones.set(zone.id, zone);
    }
    
    // Left edge
    for (let y = 1; y < this.grid.height - 1; y += 2) {
      const zone = this.createSpawnZone(
        { x: 0, y },
        y <= 2 || y >= this.grid.height - 3 ? 
          (y <= 2 ? EdgeType.TOP_LEFT : EdgeType.BOTTOM_LEFT) : EdgeType.LEFT
      );
      this.spawnZones.set(zone.id, zone);
    }
    
    // Right edge
    for (let y = 1; y < this.grid.height - 1; y += 2) {
      const zone = this.createSpawnZone(
        { x: this.grid.width - 1, y },
        y <= 2 || y >= this.grid.height - 3 ? 
          (y <= 2 ? EdgeType.TOP_RIGHT : EdgeType.BOTTOM_RIGHT) : EdgeType.RIGHT
      );
      this.spawnZones.set(zone.id, zone);
    }
  }
  
  private createSpawnZone(gridPos: Vector2, edgeType: EdgeType): SpawnZone {
    const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
    return {
      id: `zone_${gridPos.x}_${gridPos.y}`,
      position: worldPos,
      gridPosition: gridPos,
      edgeType,
      priority: this.config.edgeWeights[edgeType] || 1.0,
      isActive: false,
      cooldownRemaining: 0,
      spawnCount: 0,
      lastSpawnTime: 0
    };
  }
  
  update(deltaTime: number, gameState: GameStateSnapshot, towers: Tower[], player: Player): void {
    // Update cooldowns
    this.spawnZones.forEach(zone => {
      if (zone.cooldownRemaining > 0) {
        zone.cooldownRemaining = Math.max(0, zone.cooldownRemaining - deltaTime);
      }
      
      // Handle temporary zones
      if (zone.temporaryDuration !== undefined) {
        zone.temporaryDuration -= deltaTime;
        if (zone.temporaryDuration <= 0) {
          this.deactivateZone(zone.id);
          this.spawnZones.delete(zone.id);
        }
      }
      
      // Check activation conditions
      if (zone.activationCondition && !zone.isActive) {
        if (zone.activationCondition(gameState)) {
          this.activateZone(zone.id);
        }
      }
    });
    
    // Update active zones based on adaptive weighting
    if (this.config.adaptiveWeighting) {
      this.updateZonePriorities(gameState, towers, player);
    }
    
    // Manage active zone count
    this.manageActiveZones(gameState);
    
    // Clean up old spawn history
    const historyLimit = Date.now() - 30000; // Keep last 30 seconds
    this.spawnHistory = this.spawnHistory.filter(h => h.timestamp > historyLimit);
  }
  
  private updateZonePriorities(gameState: GameStateSnapshot, towers: Tower[], player: Player): void {
    this.spawnZones.forEach(zone => {
      let priority = this.config.edgeWeights[zone.edgeType] || 1.0;
      
      // Reduce priority for zones near many towers
      const nearbyTowers = towers.filter(tower => {
        const distance = Math.sqrt(
          Math.pow(tower.position.x - zone.position.x, 2) +
          Math.pow(tower.position.y - zone.position.y, 2)
        );
        return distance < 200;
      });
      priority *= Math.max(0.3, 1 - nearbyTowers.length * 0.15);
      
      // Increase priority for zones far from player
      const playerDistance = Math.sqrt(
        Math.pow(player.position.x - zone.position.x, 2) +
        Math.pow(player.position.y - zone.position.y, 2)
      );
      priority *= 1 + (playerDistance / 500) * 0.5;
      
      // Reduce priority for recently used zones
      const recentUses = this.spawnHistory.filter(h => h.zoneId === zone.id).length;
      priority *= Math.max(0.5, 1 - recentUses * 0.1);
      
      // Balance edge usage
      const edgeUsageRatio = this.edgeSpawnCounts[zone.edgeType] / (gameState.waveNumber * 10 + 1);
      priority *= Math.max(0.7, 1 - edgeUsageRatio * 0.3);
      
      zone.priority = priority;
    });
  }
  
  private manageActiveZones(gameState: GameStateSnapshot): void {
    // Deactivate zones that have cooled down
    const zonesToDeactivate: string[] = [];
    this.activeZones.forEach(zoneId => {
      const zone = this.spawnZones.get(zoneId);
      if (!zone || zone.cooldownRemaining > 0) {
        zonesToDeactivate.push(zoneId);
      }
    });
    zonesToDeactivate.forEach(id => this.deactivateZone(id));
    
    // Activate new zones if needed
    const activeCount = this.activeZones.size;
    const maxZones = this.config.chaosMode ? 
      Math.min(this.spawnZones.size, this.config.maxActiveZones * 2) : 
      this.config.maxActiveZones;
    
    if (activeCount < maxZones) {
      const availableZones = Array.from(this.spawnZones.values())
        .filter(zone => !zone.isActive && zone.cooldownRemaining === 0)
        .sort((a, b) => b.priority - a.priority);
      
      const zonesToActivate = maxZones - activeCount;
      for (let i = 0; i < zonesToActivate && i < availableZones.length; i++) {
        this.activateZone(availableZones[i].id);
      }
    }
  }
  
  private activateZone(zoneId: string): void {
    const zone = this.spawnZones.get(zoneId);
    if (zone && !zone.isActive) {
      zone.isActive = true;
      this.activeZones.add(zoneId);
    }
  }
  
  private deactivateZone(zoneId: string): void {
    const zone = this.spawnZones.get(zoneId);
    if (zone) {
      zone.isActive = false;
      zone.cooldownRemaining = this.config.zoneCooldown;
      this.activeZones.delete(zoneId);
    }
  }
  
  getNextSpawnPosition(pattern?: string): Vector2 | null {
    const activeZoneArray = Array.from(this.activeZones)
      .map(id => this.spawnZones.get(id))
      .filter(zone => zone !== undefined) as SpawnZone[];
    
    if (activeZoneArray.length === 0) {
      // Fallback: activate a random zone
      const allZones = Array.from(this.spawnZones.values());
      if (allZones.length > 0) {
        const randomZone = allZones[Math.floor(Math.random() * allZones.length)];
        this.activateZone(randomZone.id);
        return randomZone.position;
      }
      return null;
    }
    
    // Select zone based on pattern
    let selectedZone: SpawnZone;
    
    if (this.config.chaosMode || pattern === 'CHAOS') {
      // Pure random selection
      selectedZone = activeZoneArray[Math.floor(Math.random() * activeZoneArray.length)];
    } else {
      // Weighted random selection based on priority
      const totalPriority = activeZoneArray.reduce((sum, zone) => sum + zone.priority, 0);
      let random = Math.random() * totalPriority;
      
      selectedZone = activeZoneArray[0];
      for (const zone of activeZoneArray) {
        random -= zone.priority;
        if (random <= 0) {
          selectedZone = zone;
          break;
        }
      }
    }
    
    // Record spawn
    selectedZone.spawnCount++;
    selectedZone.lastSpawnTime = Date.now();
    this.spawnHistory.push({ zoneId: selectedZone.id, timestamp: Date.now() });
    this.edgeSpawnCounts[selectedZone.edgeType]++;
    
    return { ...selectedZone.position };
  }
  
  getSpawnPositionsForPattern(pattern: string, count: number): Vector2[] {
    const positions: Vector2[] = [];
    
    switch (pattern) {
      case 'BURST_SPAWN':
        // Get positions from different edges
        const edges = [EdgeType.TOP, EdgeType.BOTTOM, EdgeType.LEFT, EdgeType.RIGHT];
        const zonesPerEdge = Math.ceil(count / edges.length);
        
        edges.forEach(edge => {
          const edgeZones = Array.from(this.spawnZones.values())
            .filter(zone => zone.edgeType === edge && zone.cooldownRemaining === 0)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, zonesPerEdge);
          
          edgeZones.forEach(zone => {
            if (positions.length < count) {
              positions.push({ ...zone.position });
              this.recordSpawn(zone);
            }
          });
        });
        break;
        
      case 'PINCER_MOVEMENT':
        // Get positions from opposite edges
        const oppositeEdges = [
          [EdgeType.TOP, EdgeType.BOTTOM],
          [EdgeType.LEFT, EdgeType.RIGHT],
          [EdgeType.TOP_LEFT, EdgeType.BOTTOM_RIGHT],
          [EdgeType.TOP_RIGHT, EdgeType.BOTTOM_LEFT]
        ];
        
        const selectedPair = oppositeEdges[Math.floor(Math.random() * oppositeEdges.length)];
        const halfCount = Math.ceil(count / 2);
        
        selectedPair.forEach((edge, index) => {
          const edgeZones = Array.from(this.spawnZones.values())
            .filter(zone => zone.edgeType === edge && zone.cooldownRemaining === 0)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, index === 0 ? halfCount : count - halfCount);
          
          edgeZones.forEach(zone => {
            if (positions.length < count) {
              positions.push({ ...zone.position });
              this.recordSpawn(zone);
            }
          });
        });
        break;
        
      default:
        // Default to sequential spawns
        for (let i = 0; i < count; i++) {
          const pos = this.getNextSpawnPosition(pattern);
          if (pos) positions.push(pos);
        }
    }
    
    return positions;
  }
  
  private recordSpawn(zone: SpawnZone): void {
    zone.spawnCount++;
    zone.lastSpawnTime = Date.now();
    this.spawnHistory.push({ zoneId: zone.id, timestamp: Date.now() });
    this.edgeSpawnCounts[zone.edgeType]++;
    
    if (!zone.isActive) {
      this.activateZone(zone.id);
    }
  }
  
  createTemporaryZone(gridPos: Vector2, duration: number, edgeType?: EdgeType): void {
    if (!this.config.dynamicZoneGeneration) return;
    
    // Check if zone already exists at this position
    const existingId = `zone_${gridPos.x}_${gridPos.y}`;
    if (this.spawnZones.has(existingId)) {
      return; // Don't create duplicate zones
    }
    
    const detectedEdge = edgeType || this.detectEdgeType(gridPos);
    const zone = this.createSpawnZone(gridPos, detectedEdge);
    zone.temporaryDuration = duration;
    zone.priority *= 1.5; // Temporary zones have higher priority
    
    this.spawnZones.set(zone.id, zone);
    this.activateZone(zone.id);
  }
  
  private detectEdgeType(pos: Vector2): EdgeType {
    const isTop = pos.y === 0;
    const isBottom = pos.y === this.grid.height - 1;
    const isLeft = pos.x === 0;
    const isRight = pos.x === this.grid.width - 1;
    
    if (isTop && isLeft) return EdgeType.TOP_LEFT;
    if (isTop && isRight) return EdgeType.TOP_RIGHT;
    if (isBottom && isLeft) return EdgeType.BOTTOM_LEFT;
    if (isBottom && isRight) return EdgeType.BOTTOM_RIGHT;
    if (isTop) return EdgeType.TOP;
    if (isBottom) return EdgeType.BOTTOM;
    if (isLeft) return EdgeType.LEFT;
    if (isRight) return EdgeType.RIGHT;
    
    // Default for non-edge positions
    return EdgeType.TOP;
  }
  
  getActiveZones(): SpawnZone[] {
    return Array.from(this.activeZones)
      .map(id => this.spawnZones.get(id))
      .filter(zone => zone !== undefined) as SpawnZone[];
  }
  
  getAllZones(): SpawnZone[] {
    return Array.from(this.spawnZones.values());
  }
  
  getSpawnStatistics(): {
    totalSpawns: number;
    spawnsByEdge: Record<EdgeType, number>;
    activeZoneCount: number;
    averageZonePriority: number;
  } {
    const totalSpawns = Object.values(this.edgeSpawnCounts).reduce((sum, count) => sum + count, 0);
    const zones = Array.from(this.spawnZones.values());
    const averageZonePriority = zones.length > 0 ?
      zones.reduce((sum, zone) => sum + zone.priority, 0) / zones.length : 0;
    
    return {
      totalSpawns,
      spawnsByEdge: { ...this.edgeSpawnCounts },
      activeZoneCount: this.activeZones.size,
      averageZonePriority
    };
  }
  
  reset(): void {
    this.spawnZones.clear();
    this.activeZones.clear();
    this.spawnHistory = [];
    Object.keys(this.edgeSpawnCounts).forEach(edge => {
      this.edgeSpawnCounts[edge as EdgeType] = 0;
    });
    this.generateInitialSpawnZones();
  }
}