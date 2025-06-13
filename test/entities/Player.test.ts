import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { 
  createTestPlayer, 
  createTestEnemy, 
  createTestGrid,
  TimeController,
  simulateKeyPress,
  simulateKeyHold,
  expectEntityAlive,
  expectEntityDead,
  expectHealthPercentage
} from '../helpers';

describe('Player Entity', () => {
  let player: Player;
  let timeController: TimeController;

  beforeEach(() => {
    timeController = new TimeController();
    player = createTestPlayer({ position: { x: 100, y: 100 } });
  });

  afterEach(() => {
    timeController.reset();
  });

  describe('initialization', () => {
    it('should initialize with correct default stats', () => {
      expect(player.health).toBe(100);
      expect(player.maxHealth).toBe(100);
      expect(player.radius).toBe(12);
      expect(player.damage).toBe(15);
      expect(player.speed).toBe(150);
      expect(player.fireRate).toBe(2);
      expect(player.getLevel()).toBe(1);
    });

    it('should initialize upgrade levels at 0', () => {
      expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(0);
      expect(player.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(0);
      expect(player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE)).toBe(0);
      expect(player.getUpgradeLevel(PlayerUpgradeType.HEALTH)).toBe(0);
    });
  });

  describe('movement', () => {
    it('should not move initially', () => {
      expect(player.isMoving()).toBe(false);
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should move when keys are pressed', () => {
      player.handleKeyDown('w');
      player.update(16); // Simulate 16ms frame
      
      expect(player.isMoving()).toBe(true);
      const velocity = player.getVelocity();
      expect(velocity.y).toBeLessThan(0); // Moving up
    });

    it('should handle multiple keys for diagonal movement', () => {
      player.handleKeyDown('w');
      player.handleKeyDown('d');
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBeGreaterThan(0); // Moving right
      expect(velocity.y).toBeLessThan(0); // Moving up
      
      // Diagonal movement should be normalized
      const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      expect(Math.abs(magnitude - player.speed)).toBeLessThan(1); // Allow for floating point precision
    });

    it('should stop moving when keys are released', () => {
      player.handleKeyDown('w');
      player.update(16);
      expect(player.isMoving()).toBe(true);
      
      player.handleKeyUp('w');
      player.update(16);
      expect(player.isMoving()).toBe(false);
    });

    it('should handle arrow keys', () => {
      player.handleKeyDown('ArrowUp');
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.y).toBeLessThan(0); // Moving up
      expect(player.isMoving()).toBe(true);
    });

    it('should be constrained to boundaries', () => {
      // Move player to edge
      player.position.x = 5;
      player.position.y = 5;
      
      player.constrainToBounds(800, 600);
      
      expect(player.position.x).toBeGreaterThanOrEqual(player.radius);
      expect(player.position.y).toBeGreaterThanOrEqual(player.radius);
    });
  });

  describe('shooting', () => {
    it('should be able to shoot initially', () => {
      expect(player.canShoot()).toBe(true);
    });

    it('should create projectile when shooting', () => {
      const target = createTestEnemy({ position: { x: 200, y: 200 }, health: 50, type: EnemyType.BASIC });
      const projectile = player.shoot(target);
      
      expect(projectile).toBeTruthy();
      expect(projectile!.damage).toBe(player.damage);
      expect(projectile!.target).toBe(target);
    });

    it('should have cooldown after shooting', () => {
      const target = createTestEnemy({ position: { x: 200, y: 200 }, health: 50, type: EnemyType.BASIC });
      player.shoot(target);
      
      expect(player.canShoot()).toBe(false);
    });

    it('should recover from cooldown', () => {
      const target = createTestEnemy({ position: { x: 200, y: 200 }, health: 50, type: EnemyType.BASIC });
      player.shoot(target);
      
      // Simulate time passing
      player.update(600); // More than cooldown time
      
      expect(player.canShoot()).toBe(true);
    });

    it('should shoot at specific enemy target', () => {
      const enemy1 = createTestEnemy({ position: { x: 150, y: 100 }, health: 50, type: EnemyType.BASIC }); // Closer
      const enemy2 = createTestEnemy({ position: { x: 300, y: 100 }, health: 50, type: EnemyType.BASIC }); // Farther
      
      const projectile = player.shoot(enemy1);
      expect(projectile).toBeTruthy();
      expect(projectile!.target).toBe(enemy1);
    });

    it('should not auto-shoot if no enemies', () => {
      const projectile = player.autoShoot([]);
      expect(projectile).toBe(null);
    });

    it('should not auto-shoot dead enemies', () => {
      const enemy = createTestEnemy({ position: { x: 150, y: 100 }, health: 50, type: EnemyType.BASIC });
      enemy.isAlive = false;
      
      const projectile = player.autoShoot([enemy]);
      expect(projectile).toBe(null);
    });
  });

  describe('upgrades', () => {
    it('should allow upgrades when not at max level', () => {
      expect(player.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(true);
      expect(player.canUpgrade(PlayerUpgradeType.SPEED)).toBe(true);
      expect(player.canUpgrade(PlayerUpgradeType.FIRE_RATE)).toBe(true);
      expect(player.canUpgrade(PlayerUpgradeType.HEALTH)).toBe(true);
    });

    it('should increase damage when upgraded', () => {
      const initialDamage = player.damage;
      
      player.upgrade(PlayerUpgradeType.DAMAGE);
      
      expect(player.damage).toBeGreaterThan(initialDamage);
      expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(1);
    });

    it('should increase speed when upgraded', () => {
      const initialSpeed = player.speed;
      
      player.upgrade(PlayerUpgradeType.SPEED);
      
      expect(player.speed).toBeGreaterThan(initialSpeed);
      expect(player.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(1);
    });

    it('should increase fire rate when upgraded', () => {
      const initialFireRate = player.fireRate;
      const initialCooldown = player.getCooldownTime();
      
      player.upgrade(PlayerUpgradeType.FIRE_RATE);
      
      expect(player.fireRate).toBeGreaterThan(initialFireRate);
      expect(player.getCooldownTime()).toBeLessThan(initialCooldown);
      expect(player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE)).toBe(1);
    });

    it('should increase max health when upgraded', () => {
      const initialMaxHealth = player.maxHealth;
      const initialHealth = player.health;
      
      player.upgrade(PlayerUpgradeType.HEALTH);
      
      expect(player.maxHealth).toBeGreaterThan(initialMaxHealth);
      expect(player.health).toBeGreaterThan(initialHealth); // Should heal too
      expect(player.getUpgradeLevel(PlayerUpgradeType.HEALTH)).toBe(1);
    });

    it('should prevent upgrades at max level', () => {
      // Max out damage upgrades
      for (let i = 0; i < 5; i++) {
        player.upgrade(PlayerUpgradeType.DAMAGE);
      }
      
      expect(player.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(false);
      expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(5);
    });

    it('should increase player level based on total upgrades', () => {
      expect(player.getLevel()).toBe(1);
      
      // Add 4 upgrades (should still be level 1)
      player.upgrade(PlayerUpgradeType.DAMAGE);
      player.upgrade(PlayerUpgradeType.SPEED);
      player.upgrade(PlayerUpgradeType.FIRE_RATE);
      player.upgrade(PlayerUpgradeType.HEALTH);
      
      expect(player.getLevel()).toBe(2); // 1 + floor(4/4)
    });

    it('should track total upgrades correctly', () => {
      player.upgrade(PlayerUpgradeType.DAMAGE);
      player.upgrade(PlayerUpgradeType.DAMAGE);
      player.upgrade(PlayerUpgradeType.SPEED);
      
      expect(player.getTotalUpgrades()).toBe(3);
    });
  });

  describe('enemy targeting', () => {
    it('should find nearest enemy', () => {
      const enemy1 = createTestEnemy({ position: { x: 150, y: 100 }, type: EnemyType.BASIC }); // Distance: 50
      const enemy2 = createTestEnemy({ position: { x: 200, y: 200 }, type: EnemyType.BASIC }); // Distance: ~141
      const enemies = [enemy1, enemy2];
      
      const nearest = player.findNearestEnemy(enemies);
      expect(nearest).toBe(enemy1);
    });

    it('should return null if no alive enemies', () => {
      const enemy = createTestEnemy({ position: { x: 150, y: 100 }, health: 50, type: EnemyType.BASIC });
      enemy.isAlive = false;
      
      const nearest = player.findNearestEnemy([enemy]);
      expect(nearest).toBe(null);
    });
  });

  describe('health and damage', () => {
    it('should take damage correctly', () => {
      player.takeDamage(20);
      expect(player.health).toBe(80);
      expectEntityAlive(player);
    });

    it('should die when health reaches 0', () => {
      player.takeDamage(100);
      expect(player.health).toBe(0);
      expectEntityDead(player);
    });

    it('should heal correctly', () => {
      player.takeDamage(30);
      player.heal(10);
      expect(player.health).toBe(80);
    });

    it('should not heal above max health', () => {
      player.heal(50);
      expect(player.health).toBe(100); // Should stay at max
    });

    it('should maintain health percentage', () => {
      player.takeDamage(25); // 75% health
      expectHealthPercentage(player, 0.75);
    });
  });

  describe('complex movement scenarios', () => {
    it('should handle continuous key presses smoothly', async () => {
      const startPos = { ...player.position };
      
      // Simulate holding W key for 200ms
      player.handleKeyDown('w');
      
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        player.update(20);
      }
      
      player.handleKeyUp('w');
      
      // Should have moved up (negative y)
      expect(player.position.y).toBeLessThan(startPos.y);
      expect(player.position.x).toBe(startPos.x);
    });

    it('should handle quick direction changes', () => {
      // Move right
      player.handleKeyDown('d');
      player.update(16);
      player.handleKeyUp('d');
      
      // Immediately move left
      player.handleKeyDown('a');
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBeLessThan(0); // Moving left
    });

    it('should handle all four directions', () => {
      const directions = [
        { key: 'w', expectedVel: { x: 0, y: -1 } },
        { key: 's', expectedVel: { x: 0, y: 1 } },
        { key: 'a', expectedVel: { x: -1, y: 0 } },
        { key: 'd', expectedVel: { x: 1, y: 0 } }
      ];

      directions.forEach(({ key, expectedVel }) => {
        player.handleKeyDown(key);
        player.update(16);
        
        const velocity = player.getVelocity();
        const normalized = {
          x: Math.sign(velocity.x),
          y: Math.sign(velocity.y)
        };
        
        expect(normalized).toEqual(expectedVel);
        
        player.handleKeyUp(key);
        player.update(16);
      });
    });
  });
});