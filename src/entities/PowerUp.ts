import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import type { Vector2 } from '../utils/Vector2';

export enum PowerUpType {
  EXTRA_DAMAGE = 'EXTRA_DAMAGE',
  FASTER_SHOOTING = 'FASTER_SHOOTING',
  EXTRA_CURRENCY = 'EXTRA_CURRENCY',
  SHIELD = 'SHIELD',
  SPEED_BOOST = 'SPEED_BOOST'
}

interface PowerUpConfig {
  name: string;
  color: string;
  duration: number; // milliseconds
  effect: (player: Player) => void;
  cleanup?: (player: Player) => void;
}

const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.EXTRA_DAMAGE]: {
    name: 'Extra Damage',
    color: '#FF4444',
    duration: 10000, // 10 seconds
    effect: (player: Player) => {
      player.addTemporaryDamageBoost(1.5); // 50% more damage
    },
    cleanup: (player: Player) => {
      player.removeTemporaryDamageBoost();
    }
  },
  [PowerUpType.FASTER_SHOOTING]: {
    name: 'Rapid Fire',
    color: '#44FF44',
    duration: 8000, // 8 seconds
    effect: (player: Player) => {
      player.addTemporaryFireRateBoost(2.0); // Double fire rate
    },
    cleanup: (player: Player) => {
      player.removeTemporaryFireRateBoost();
    }
  },
  [PowerUpType.EXTRA_CURRENCY]: {
    name: 'Gold Rush',
    color: '#FFD700',
    duration: 0, // Instant effect
    effect: (player: Player) => {
      // This will be handled in the game class
    }
  },
  [PowerUpType.SHIELD]: {
    name: 'Shield',
    color: '#4444FF',
    duration: 15000, // 15 seconds
    effect: (player: Player) => {
      player.addShield();
    },
    cleanup: (player: Player) => {
      player.removeShield();
    }
  },
  [PowerUpType.SPEED_BOOST]: {
    name: 'Speed Boost',
    color: '#FF44FF',
    duration: 12000, // 12 seconds
    effect: (player: Player) => {
      player.addTemporarySpeedBoost(1.5); // 50% more speed
    },
    cleanup: (player: Player) => {
      player.removeTemporarySpeedBoost();
    }
  }
};

export class PowerUp extends Entity {
  public readonly powerUpType: PowerUpType;
  public isActive: boolean = true;
  private animationTime: number = 0;
  private config: PowerUpConfig;
  
  constructor(position: Vector2, powerUpType: PowerUpType) {
    super(EntityType.POWER_UP, position, 1, 12); // 12 radius
    this.powerUpType = powerUpType;
    this.config = POWER_UP_CONFIGS[powerUpType];
  }

  override update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Update animation time for visual effects
    this.animationTime += deltaTime;
    
    super.update(deltaTime);
  }

  checkCollisionWithPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;
    
    // Check collision based on combined radii
    const distance = this.distanceTo(player);
    return distance <= (this.radius + player.radius);
  }

  applyToPlayer(player: Player): boolean {
    if (!this.isActive || !this.checkCollisionWithPlayer(player)) {
      return false;
    }

    // Apply the power-up effect
    this.config.effect(player);
    
    // Deactivate the pickup
    this.isActive = false;
    this.isAlive = false;
    
    return true;
  }

  // Visual effects
  getVisualY(): number {
    // Bobbing animation
    const bobAmount = 8;
    const bobSpeed = 0.003; // radians per millisecond
    return this.position.y + Math.sin(this.animationTime * bobSpeed) * bobAmount;
  }

  getRotation(): number {
    // Rotation
    const rotationSpeed = 0.002; // radians per millisecond
    return this.animationTime * rotationSpeed;
  }

  getPulseScale(): number {
    // Pulsing effect
    const pulseSpeed = 0.004;
    return 1 + Math.sin(this.animationTime * pulseSpeed) * 0.2;
  }

  getConfig(): PowerUpConfig {
    return this.config;
  }

  // Spawn system helpers
  static getSpawnChance(): number {
    return 0.3; // 30% chance to spawn from defeated enemies
  }

  static getRandomType(): PowerUpType {
    const types = Object.values(PowerUpType);
    return types[Math.floor(Math.random() * types.length)] ?? PowerUpType.EXTRA_DAMAGE;
  }

  static shouldSpawnFromEnemy(): boolean {
    const chance = PowerUp.getSpawnChance();
    return Math.random() < chance;
  }
}