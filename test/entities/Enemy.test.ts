import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy, EnemyType } from '../../src/entities/Enemy';
import { Player } from '../../src/entities/Player';
import { EntityType } from '../../src/entities/Entity';

describe('Enemy Entity', () => {
  let enemy: Enemy;
  let player: Player;

  beforeEach(() => {
    enemy = new Enemy({ x: 100, y: 100 }, 50, EnemyType.BASIC);
    player = new Player({ x: 200, y: 200 });
  });

  describe('initialization', () => {
    it('should initialize with correct stats for BASIC enemy', () => {
      expect(enemy.health).toBe(50);
      expect(enemy.speed).toBe(50);
      expect(enemy.radius).toBe(8);
      expect(enemy.reward).toBe(10);
      expect(enemy.damage).toBe(10); // New property for damage
    });

    it('should initialize with correct stats for FAST enemy', () => {
      const fastEnemy = new Enemy({ x: 0, y: 0 }, 30, EnemyType.FAST);
      expect(fastEnemy.health).toBe(30);
      expect(fastEnemy.speed).toBe(100);
      expect(fastEnemy.radius).toBe(6);
      expect(fastEnemy.reward).toBe(15);
      expect(fastEnemy.damage).toBe(5); // Less damage but faster
    });

    it('should initialize with correct stats for TANK enemy', () => {
      const tankEnemy = new Enemy({ x: 0, y: 0 }, 200, EnemyType.TANK);
      expect(tankEnemy.health).toBe(200);
      expect(tankEnemy.speed).toBe(25);
      expect(tankEnemy.radius).toBe(12);
      expect(tankEnemy.reward).toBe(50);
      expect(tankEnemy.damage).toBe(20); // High damage
    });
  });

  describe('player targeting', () => {
    it('should set target to player', () => {
      enemy.setTarget(player);
      enemy.update(16); // Update to trigger target selection
      expect(enemy.getTarget()).toBe(player);
    });

    it('should move towards player when target is set', () => {
      const initialDistance = enemy.distanceTo(player);
      enemy.setTarget(player);
      enemy.update(100); // 100ms update
      
      const newDistance = enemy.distanceTo(player);
      expect(newDistance).toBeLessThan(initialDistance);
    });

    it('should stop moving if player is dead', () => {
      enemy.setTarget(player);
      player.takeDamage(player.health); // Kill player
      
      const positionBefore = { ...enemy.position };
      enemy.update(100);
      
      expect(enemy.position.x).toBe(positionBefore.x);
      expect(enemy.position.y).toBe(positionBefore.y);
    });

    it('should clear target when player dies', () => {
      enemy.setTarget(player);
      player.takeDamage(player.health);
      enemy.update(100);
      
      expect(enemy.getTarget()).toBe(null);
    });

    it('should calculate angle to player correctly', () => {
      enemy.setTarget(player);
      enemy.update(16); // Update to trigger target selection
      const angle = enemy.getAngleToTarget();
      
      // Enemy at (100,100), player at (200,200)
      // Expected angle should be 45 degrees (π/4 radians)
      expect(angle).toBeCloseTo(Math.PI / 4, 2);
    });
  });

  describe('attacking behavior', () => {
    it('should detect when in attack range', () => {
      enemy.setTarget(player);
      // Move enemy close to player
      enemy.position.x = player.position.x - 10; // Well within attack range
      enemy.position.y = player.position.y;
      enemy.update(16); // Update to trigger target selection
      
      expect(enemy.isInAttackRange()).toBe(true);
    });

    it('should not be in attack range when far from player', () => {
      enemy.setTarget(player);
      expect(enemy.isInAttackRange()).toBe(false);
    });

    it('should attack player when in range and cooldown is ready', () => {
      enemy.setTarget(player);
      enemy.position.x = player.position.x; // Same position as player
      enemy.position.y = player.position.y;
      enemy.update(16); // Update to trigger target selection and first attack
      
      // Move enemy away to avoid attacking during cooldown wait
      enemy.position.x = player.position.x + 100;
      enemy.update(1100); // Wait for cooldown to reset
      
      // Move enemy back into range
      enemy.position.x = player.position.x;
      
      const playerHealthBefore = player.health;
      const attacked = enemy.tryAttack();
      
      expect(attacked).toBe(true);
      expect(player.health).toBe(playerHealthBefore - enemy.damage);
    });

    it('should have attack cooldown', () => {
      enemy.setTarget(player);
      enemy.position.x = player.position.x - 15;
      enemy.position.y = player.position.y;
      
      enemy.tryAttack();
      const secondAttack = enemy.tryAttack();
      
      expect(secondAttack).toBe(false);
    });

    it('should reset attack cooldown over time', () => {
      enemy.setTarget(player);
      enemy.position.x = player.position.x - 15;
      enemy.position.y = player.position.y;
      
      enemy.tryAttack();
      
      // Move enemy out of attack range first to prevent auto-attacking
      enemy.position.x = player.position.x - 100;
      enemy.update(1001); // Update for slightly more than 1 second (BASIC enemy has 1000ms cooldown)
      
      // Move back into range and try to attack
      enemy.position.x = player.position.x - 15;
      const canAttackAgain = enemy.tryAttack();
      expect(canAttackAgain).toBe(true);
    });

    it('should stop moving when in attack range', () => {
      enemy.setTarget(player);
      enemy.position.x = player.position.x - 15;
      enemy.position.y = player.position.y;
      
      const positionBefore = { ...enemy.position };
      enemy.update(100);
      
      // Should stay in place to attack
      expect(enemy.position.x).toBe(positionBefore.x);
      expect(enemy.position.y).toBe(positionBefore.y);
    });

    it('should have different attack rates for different enemy types', () => {
      const fastEnemy = new Enemy({ x: 0, y: 0 }, 30, EnemyType.FAST);
      const tankEnemy = new Enemy({ x: 0, y: 0 }, 200, EnemyType.TANK);
      
      expect(fastEnemy.getAttackCooldown()).toBeLessThan(enemy.getAttackCooldown());
      expect(tankEnemy.getAttackCooldown()).toBeGreaterThan(enemy.getAttackCooldown());
    });
  });

  describe('movement behavior', () => {
    it('should move towards player continuously', () => {
      enemy.setTarget(player);
      
      // Track movement over multiple updates
      const positions = [];
      for (let i = 0; i < 5; i++) {
        positions.push({ ...enemy.position });
        enemy.update(100);
      }
      
      // Each position should be closer to player
      for (let i = 1; i < positions.length; i++) {
        const prevDist = Math.hypot(
          positions[i-1].x - player.position.x,
          positions[i-1].y - player.position.y
        );
        const currDist = Math.hypot(
          positions[i].x - player.position.x,
          positions[i].y - player.position.y
        );
        expect(currDist).toBeLessThan(prevDist);
      }
    });

    it('should track moving player', () => {
      enemy.setTarget(player);
      enemy.update(16); // Update to trigger target selection
      
      const angleBeforeMove = enemy.getAngleToTarget();
      
      // Move player to a different position that changes the angle
      player.position.x = 100; // Same x as enemy
      player.position.y = 300; // Different y
      
      // Update enemy again to recalculate angle to new player position
      enemy.update(16);
      const angleAfterMove = enemy.getAngleToTarget();
      expect(angleAfterMove).not.toBe(angleBeforeMove);
      expect(angleAfterMove).toBeCloseTo(Math.PI / 2, 2); // 90 degrees
    });

    it('should maintain consistent speed', () => {
      enemy.setTarget(player);
      
      const distanceBefore = enemy.distanceTo(player);
      enemy.update(1000); // 1 second
      const distanceAfter = enemy.distanceTo(player);
      
      const distanceMoved = distanceBefore - distanceAfter;
      // Should move approximately speed pixels per second
      expect(Math.abs(distanceMoved - enemy.speed)).toBeLessThan(5);
    });
  });

  describe('state management', () => {
    it('should not update when dead', () => {
      enemy.setTarget(player);
      enemy.takeDamage(enemy.health);
      
      const positionBefore = { ...enemy.position };
      enemy.update(100);
      
      expect(enemy.position).toEqual(positionBefore);
    });

    it('should not attack when dead', () => {
      enemy.setTarget(player);
      enemy.position.x = player.position.x - 15;
      enemy.position.y = player.position.y;
      enemy.takeDamage(enemy.health);
      
      const playerHealthBefore = player.health;
      enemy.tryAttack();
      
      expect(player.health).toBe(playerHealthBefore);
    });
  });

  describe('path system fallback', () => {
    it('should have path-based movement as fallback', () => {
      // Path methods still exist as fallback when no target is set
      expect(enemy.setPath).toBeDefined();
      expect(enemy.hasReachedEnd).toBeDefined();
      expect(enemy.getProgress).toBeDefined();
    });
    
    it('should prioritize player targeting over path movement', () => {
      // Set both path and target
      enemy.setPath([{ x: 400, y: 400 }]);
      enemy.setTarget(player);
      
      const initialPos = { ...enemy.position };
      enemy.update(100);
      
      // Should move towards player, not path
      const angleToPlayer = Math.atan2(
        player.position.y - initialPos.y,
        player.position.x - initialPos.x
      );
      const actualAngle = Math.atan2(
        enemy.position.y - initialPos.y,
        enemy.position.x - initialPos.x
      );
      
      expect(Math.abs(angleToPlayer - actualAngle)).toBeLessThan(0.1);
    });
  });
});