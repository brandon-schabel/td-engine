/**
 * Player Combat System
 * Extracted from Player.ts to handle shooting and combat-specific logic
 */

import { Projectile } from '../Projectile';
import { Enemy } from '../Enemy';
import { CooldownManager } from '@/utils/CooldownManager';
import { ShootingUtils } from '../../interfaces/ShootingCapable';
import { GAME_MECHANICS } from '../../config/GameConfig';
import type { Vector2 } from '@/utils/Vector2';

export enum ShootingMode {
  MANUAL = 'manual',
  AUTO = 'auto'
}

export class PlayerCombat {
  private baseDamage: number;
  private baseFireRate: number;
  private cooldownTime: number;
  private currentCooldown: number = 0;
  
  // Manual shooting mechanics
  private aimPosition: Vector2 = { x: 0, y: 0 };
  private isHolding: boolean = false;
  private shootingMode: ShootingMode = ShootingMode.MANUAL;
  
  // Temporary combat boosts
  private temporaryDamageBoost: number = 1.0;
  private temporaryFireRateBoost: number = 1.0;

  constructor(baseDamage: number, baseFireRate: number) {
    this.baseDamage = baseDamage;
    this.baseFireRate = baseFireRate;
    this.cooldownTime = 1000 / baseFireRate;
  }

  update(deltaTime: number): void {
    this.currentCooldown = CooldownManager.updateCooldown(this.currentCooldown, deltaTime);
  }

  // Manual shooting
  setAimPosition(position: Vector2): void {
    this.aimPosition = { ...position };
  }

  getAimPosition(): Vector2 {
    return { ...this.aimPosition };
  }

  getAimAngle(): number {
    const dx = this.aimPosition.x - this.playerPosition.x;
    const dy = this.aimPosition.y - this.playerPosition.y;
    return Math.atan2(dy, dx);
  }

  handleMouseDown(playerPosition: Vector2, aimPosition: Vector2): Projectile | null {
    this.setAimPosition(aimPosition);
    this.isHolding = true;
    return this.shootManual(playerPosition);
  }

  handleMouseUp(): void {
    this.isHolding = false;
  }

  handleMouseMove(position: Vector2): void {
    this.setAimPosition(position);
  }

  updateShooting(playerPosition: Vector2): Projectile | null {
    if (this.isHolding && this.canShoot()) {
      return this.shootManual(playerPosition);
    }
    return null;
  }

  private shootManual(playerPosition: Vector2): Projectile | null {
    if (!this.canShoot()) {
      return null;
    }

    this.currentCooldown = CooldownManager.startCooldown(this.cooldownTime);

    const angle = this.getAimAngle();
    const speed = GAME_MECHANICS.projectileSpeed;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    return new Projectile(
      { ...playerPosition },
      null, // No specific target, just direction
      this.damage,
      speed,
      velocity
    );
  }

  // Auto shooting
  autoShoot(playerPosition: Vector2, enemies: Enemy[]): Projectile | null {
    if (this.shootingMode !== ShootingMode.AUTO || !this.canShoot()) {
      return null;
    }

    const target = this.findNearestEnemy(enemies, playerPosition);
    if (!target) {
      return null;
    }

    return this.shoot(playerPosition, target);
  }

  private shoot(playerPosition: Vector2, target: Enemy): Projectile | null {
    if (!this.canShoot()) {
      return null;
    }

    this.currentCooldown = CooldownManager.startCooldown(this.cooldownTime);
    // Create projectile directly since we can't match ShootingCapable interface
    const projectile = new Projectile(
      { ...playerPosition },
      target,
      this.damage,
      GAME_MECHANICS.projectileSpeed
    );
    return projectile;
  }

  private findNearestEnemy(enemies: Enemy[], playerPosition: Vector2): Enemy | null {
    return ShootingUtils.findNearestEnemy(playerPosition, enemies);
  }

  canShoot(): boolean {
    return ShootingUtils.canShoot(this.currentCooldown);
  }

  // Aiming visualization
  shouldShowAimer(): boolean {
    return this.shootingMode === ShootingMode.MANUAL;
  }

  getAimerLine(playerPosition: Vector2): { start: Vector2; end: Vector2 } {
    const angle = this.getAimAngle();
    const aimerLength = 100;
    
    const end = {
      x: playerPosition.x + Math.cos(angle) * aimerLength,
      y: playerPosition.y + Math.sin(angle) * aimerLength
    };

    return {
      start: { ...playerPosition },
      end
    };
  }

  // Combat properties
  get damage(): number {
    return Math.floor(this.baseDamage * this.temporaryDamageBoost);
  }

  get fireRate(): number {
    return this.baseFireRate * this.temporaryFireRateBoost;
  }

  getCooldownTime(): number {
    return this.cooldownTime;
  }

  // Shooting mode management
  getShootingMode(): ShootingMode {
    return this.shootingMode;
  }

  setShootingMode(mode: ShootingMode): void {
    this.shootingMode = mode;
  }

  isAutoShootEnabled(): boolean {
    return this.shootingMode === ShootingMode.AUTO;
  }

  isHoldingToShoot(): boolean {
    return this.isHolding;
  }

  // Temporary combat boosts
  addTemporaryDamageBoost(multiplier: number, duration: number): void {
    this.temporaryDamageBoost = multiplier;
    setTimeout(() => {
      this.temporaryDamageBoost = 1.0;
    }, duration);
  }

  addTemporaryFireRateBoost(multiplier: number, duration: number): void {
    this.temporaryFireRateBoost = multiplier;
    this.cooldownTime = 1000 / this.fireRate;
    setTimeout(() => {
      this.temporaryFireRateBoost = 1.0;
      this.cooldownTime = 1000 / this.fireRate;
    }, duration);
  }

  removeTemporaryDamageBoost(): void {
    this.temporaryDamageBoost = 1.0;
  }

  removeTemporaryFireRateBoost(): void {
    this.temporaryFireRateBoost = 1.0;
    this.cooldownTime = 1000 / this.fireRate;
  }

  // Update fire rate when base stats change
  updateFireRate(newBaseFireRate: number): void {
    this.baseFireRate = newBaseFireRate;
    this.cooldownTime = 1000 / this.fireRate;
  }

  updateDamage(newBaseDamage: number): void {
    this.baseDamage = newBaseDamage;
  }

  // Debug and state information
  getCombatInfo(): {
    damage: number;
    fireRate: number;
    cooldownRemaining: number;
    shootingMode: ShootingMode;
    isHolding: boolean;
    canShoot: boolean;
    temporaryBoosts: {
      damage: number;
      fireRate: number;
    };
  } {
    return {
      damage: this.damage,
      fireRate: this.fireRate,
      cooldownRemaining: this.currentCooldown,
      shootingMode: this.shootingMode,
      isHolding: this.isHolding,
      canShoot: this.canShoot(),
      temporaryBoosts: {
        damage: this.temporaryDamageBoost,
        fireRate: this.temporaryFireRateBoost
      }
    };
  }

  // This is a hack to get player position - in a real implementation,
  // the combat system would receive the position as a parameter
  private playerPosition: Vector2 = { x: 0, y: 0 };
  
  setPlayerPosition(position: Vector2): void {
    this.playerPosition = position;
  }
}