import type { Vector2 } from '@/utils/Vector2';
import type { Enemy, EnemyType } from '@/entities/Enemy';
import type { Tower, TowerType } from '@/entities/Tower';
import type { Player } from '@/entities/Player';
import type { Projectile, ProjectileType } from '@/entities/Projectile';

// Game actions that can be triggered by entity updates
export type GameAction = 
  | { type: 'SPAWN_PROJECTILE'; projectile: ProjectileCreateData }
  | { type: 'DAMAGE_ENTITY'; targetId: string; damage: number; sourceId?: string }
  | { type: 'DESTROY_ENTITY'; entityId: string }
  | { type: 'ADD_CURRENCY'; amount: number }
  | { type: 'SPAWN_COLLECTIBLE'; position: Vector2; collectibleType: string }
  | { type: 'PLAY_SOUND'; soundType: string; position?: Vector2 }
  | { type: 'CREATE_EFFECT'; effectType: string; position: Vector2; data?: any }
  | { type: 'HEAL_ENTITY'; targetId: string; amount: number }
  | { type: 'ADD_EXPERIENCE'; amount: number };

// Update results for different entity types
export interface EnemyUpdate {
  position?: Vector2;
  velocity?: Vector2;
  health?: number;
  state?: 'MOVING' | 'ATTACKING' | 'STUCK' | 'RECOVERING';
  targetId?: string | null;
  currentPath?: Vector2[];
  actions: GameAction[];
}

export interface TowerUpdate {
  cooldown?: number;
  targetId?: string | null;
  actions: GameAction[];
}

export interface PlayerUpdate {
  position?: Vector2;
  velocity?: Vector2;
  health?: number;
  cooldown?: number;
  actions: GameAction[];
}

export interface ProjectileUpdate {
  position?: Vector2;
  velocity?: Vector2;
  isAlive?: boolean;
  actions: GameAction[];
}

export interface ProjectileCreateData {
  position: Vector2;
  targetId?: string | null;
  velocity?: Vector2;
  damage: number;
  speed: number;
  projectileType: ProjectileType;
}

// Input state for player
export interface InputState {
  keys: Set<string>;
  mousePosition: Vector2;
  isMouseDown: boolean;
  mobileInput?: Vector2;
}

// Game context needed by logic systems
export interface GameContext {
  deltaTime: number;
  enemies: Enemy[];
  towers: Tower[];
  player: Player | null;
  projectiles: Projectile[];
  grid?: any; // Grid type
  gameTime: number;
  isPaused: boolean;
}

// Damage sources for combat calculations
export interface DamageSource {
  type: 'tower' | 'player' | 'projectile';
  damage: number;
  damageType?: 'physical' | 'magical' | 'true';
  sourceId: string;
  critChance?: number;
  critMultiplier?: number;
}

// Damageable entities
export interface Damageable {
  id: string;
  health: number;
  maxHealth: number;
  armor?: number;
  magicResist?: number;
  damageReduction?: number;
}

// Combat result
export interface CombatResult {
  finalDamage: number;
  isCrit: boolean;
  damageType: 'physical' | 'magical' | 'true';
  blocked: boolean;
  overkill: number;
}