import type { Entity } from '@/entities/Entity';
import type { Vector2 } from '@/utils/Vector2';
import type { Grid } from '@/systems/Grid';
import { CellType } from '@/systems/Grid';

export interface TerrainProperties {
  walkable: boolean;
  flyable: boolean;
  swimmable: boolean;
  speedMultiplier: number;
  damagePerSecond?: number;
  statusEffect?: StatusEffect;
}

export interface StatusEffect {
  type: 'burn' | 'slow' | 'freeze' | 'poison';
  duration: number;
  strength: number;
}

export enum MovementType {
  WALKING = 'WALKING',
  FLYING = 'FLYING',
  SWIMMING = 'SWIMMING',
  AMPHIBIOUS = 'AMPHIBIOUS', // Can walk and swim
  ALL_TERRAIN = 'ALL_TERRAIN' // Can traverse all terrain
}

export const TERRAIN_DEFINITIONS: Record<CellType | string, TerrainProperties> = {
  [CellType.EMPTY]: {
    walkable: true,
    flyable: true,
    swimmable: false,
    speedMultiplier: 1.0
  },
  [CellType.PATH]: {
    walkable: true,
    flyable: true,
    swimmable: false,
    speedMultiplier: 1.2
  },
  [CellType.ROUGH_TERRAIN]: {
    walkable: true,
    flyable: true,
    swimmable: false,
    speedMultiplier: 0.5
  },
  [CellType.WATER]: {
    walkable: false,
    flyable: true,
    swimmable: true,
    speedMultiplier: 0.8  // For swimming; flying uses normal speed
  },
  [CellType.BRIDGE]: {
    walkable: true,
    flyable: true,
    swimmable: false,
    speedMultiplier: 1.0
  },
  [CellType.OBSTACLE]: {
    walkable: false,
    flyable: false,
    swimmable: false,
    speedMultiplier: 0.0
  },
  [CellType.BLOCKED]: {
    walkable: false,
    flyable: false,
    swimmable: false,
    speedMultiplier: 0.0
  },
  [CellType.TOWER]: {
    walkable: false,
    flyable: false,
    swimmable: false,
    speedMultiplier: 0.0
  },
  [CellType.DECORATIVE]: {
    walkable: true,
    flyable: true,
    swimmable: false,
    speedMultiplier: 1.0
  },
  [CellType.SPAWN_ZONE]: {
    walkable: true,
    flyable: true,
    swimmable: false,
    speedMultiplier: 1.0
  },
  [CellType.BORDER]: {
    walkable: false,
    flyable: false,
    swimmable: false,
    speedMultiplier: 0.0
  }
};

export class MovementSystem {
  private static terrainSpeedCache: Map<string, number> = new Map();
  private static readonly CACHE_SIZE = 100;

  static getEntityMovementType(entity: Entity): MovementType {
    // Check if entity has custom movement type
    const customType = (entity as any).movementType;
    if (customType) return customType;
    
    // Default movement types by entity type
    const entityName = entity.constructor.name.toLowerCase();
    if (entityName.includes('flying') || entityName.includes('air')) {
      return MovementType.FLYING;
    }
    if (entityName.includes('aquatic') || entityName.includes('water')) {
      return MovementType.SWIMMING;
    }
    
    return MovementType.WALKING;
  }

  static canEntityMoveTo(entity: Entity, position: Vector2, grid: Grid): boolean {
    const gridPos = grid.worldToGrid(position);
    if (!grid.isInBounds(gridPos.x, gridPos.y)) return false;
    
    const cellType = grid.getCellType(gridPos.x, gridPos.y);
    const movementType = this.getEntityMovementType(entity);
    
    return this.canMoveOnTerrain(movementType, cellType);
  }

  static canMoveOnTerrain(movementType: MovementType, cellType: string): boolean {
    const terrainProps = TERRAIN_DEFINITIONS[cellType];
    if (!terrainProps) return false;
    
    switch (movementType) {
      case MovementType.WALKING:
        return terrainProps.walkable;
      case MovementType.FLYING:
        return terrainProps.flyable;
      case MovementType.SWIMMING:
        return terrainProps.swimmable;
      case MovementType.AMPHIBIOUS:
        return terrainProps.walkable || terrainProps.swimmable;
      case MovementType.ALL_TERRAIN:
        return terrainProps.walkable || terrainProps.flyable || terrainProps.swimmable;
      default:
        return terrainProps.walkable;
    }
  }

  static getAdjustedSpeed(entity: Entity, baseSpeed: number, grid: Grid): number {
    const gridPos = grid.worldToGrid(entity.position);
    
    // Check cache first
    const cacheKey = `${gridPos.x},${gridPos.y}`;
    if (this.terrainSpeedCache.has(cacheKey)) {
      return baseSpeed * (this.terrainSpeedCache.get(cacheKey) || 1.0);
    }
    
    // Calculate speed multiplier
    const speedMultiplier = grid.getMovementSpeed(gridPos.x, gridPos.y);
    
    // Cache the result
    if (this.terrainSpeedCache.size >= this.CACHE_SIZE) {
      const firstKey = this.terrainSpeedCache.keys().next().value;
      if (firstKey) {
        this.terrainSpeedCache.delete(firstKey);
      }
    }
    this.terrainSpeedCache.set(cacheKey, speedMultiplier);
    
    return baseSpeed * speedMultiplier;
  }

  static getTerrainProperties(cellType: CellType | string): TerrainProperties {
    return TERRAIN_DEFINITIONS[cellType] || TERRAIN_DEFINITIONS[CellType.EMPTY];
  }

  static getMovementCost(
    _fromPos: Vector2,
    toPos: Vector2,
    grid: Grid,
    movementType: MovementType
  ): number {
    const toGrid = grid.worldToGrid(toPos);
    const cellType = grid.getCellType(toGrid.x, toGrid.y);
    const terrainProps = this.getTerrainProperties(cellType);

    if (!this.canMoveOnTerrain(movementType, cellType)) {
      return Infinity;
    }

    let speedMultiplier = terrainProps.speedMultiplier;
    if (movementType === MovementType.FLYING && terrainProps.flyable) {
      speedMultiplier = 1.0;
    }

    // Cost should be high for slow terrain, so we invert the multiplier.
    // A speed multiplier of 0.5 (slow) should result in a cost multiplier of 2.
    const costMultiplier = speedMultiplier > 0 ? 1 / speedMultiplier : Infinity;

    // Simple distance calculation, assuming grid cells are uniform.
    // This is a basic heuristic and could be replaced with actual distance if needed.
    const distance = 1; // Cost per grid cell

    return distance * costMultiplier;
  }

  static applyTerrainEffects(entity: Entity, deltaTime: number, grid: Grid): void {
    const gridPos = grid.worldToGrid(entity.position);
    const cellData = grid.getCellData(gridPos.x, gridPos.y);
    if (!cellData) return;
    
    const terrainProps = TERRAIN_DEFINITIONS[cellData.type];
    if (!terrainProps) return;
    
    // Apply damage over time
    if (terrainProps.damagePerSecond && entity.takeDamage) {
      const damage = terrainProps.damagePerSecond * (deltaTime / 1000);
      entity.takeDamage(damage);
    }
    
    // Apply status effects
    if (terrainProps.statusEffect && (entity as any).applyStatusEffect) {
      (entity as any).applyStatusEffect(terrainProps.statusEffect);
    }
  }

  static getSmoothTransitionSpeed(
    _entity: Entity, 
    currentSpeed: number, 
    targetSpeed: number, 
    deltaTime: number,
    transitionRate: number = 2.0
  ): number {
    // Smooth transition between speed values
    const speedDiff = targetSpeed - currentSpeed;
    const maxChange = transitionRate * (deltaTime / 1000);
    
    if (Math.abs(speedDiff) <= maxChange) {
      return targetSpeed;
    }
    
    return currentSpeed + Math.sign(speedDiff) * maxChange;
  }

  static clearCache(): void {
    this.terrainSpeedCache.clear();
  }
}