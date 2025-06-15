import { describe, it, expect } from 'vitest';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { describeEntity, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';
import { assertPlayerState, assertEntityHealth, assertEntityPosition } from '../helpers/assertions';
import { PlayerBuilder, EnemyBuilder } from '../helpers/builders';
import { TestEnemies } from '../fixtures/testData';

describe.skip('Player',
  () => new PlayerBuilder().at(100, 100).build(),
  (getPlayer, context) => {

    describe('initialization', () => {
      it('creates player with default stats', () => {
        const player = getPlayer();
        assertPlayerState(player, {
          health: 100,
          maxHealth: 100,
          damage: 15,
          speed: 150,
          level: 1
        });
        expect(player.radius).toBe(12);
        expect(player.fireRate).toBe(2);
      });

      it('starts with no upgrades', () => {
        const player = getPlayer();
        expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(0);
        expect(player.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(0);
        expect(player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE)).toBe(0);
        expect(player.getUpgradeLevel(PlayerUpgradeType.HEALTH)).toBe(0);
      });
    });

    describe('movement', () => {
      it(when('idle'), () => {
        const player = getPlayer();
        expect(player.isMoving()).toBe(false);
        const velocity = player.getVelocity();
        expect(velocity.x).toBe(0);
        expect(velocity.y).toBe(0);
      });

      it(when('pressing movement key'), () => {
        const player = getPlayer();
        player.handleKeyDown('w');
        player.update(16);
        
        expect(player.isMoving()).toBe(true);
        const velocity = player.getVelocity();
        expect(velocity.y).toBeLessThan(0);
      });

      it(when('pressing multiple keys'), () => {
        const player = getPlayer();
        player.handleKeyDown('w');
        player.handleKeyDown('d');
        player.update(16);
        
        const velocity = player.getVelocity();
        expect(velocity.x).toBeGreaterThan(0);
        expect(velocity.y).toBeLessThan(0);
        
        // Diagonal movement should be normalized
        const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        expect(Math.abs(magnitude - player.speed)).toBeLessThan(1);
      });

      it(then('stops when key released'), () => {
        const player = getPlayer();
        player.handleKeyDown('w');
        player.update(16);
        expect(player.isMoving()).toBe(true);
        
        player.handleKeyUp('w');
        player.update(16);
        expect(player.isMoving()).toBe(false);
      });

      it('handles arrow keys', () => {
        const player = getPlayer();
        player.handleKeyDown('ArrowUp');
        player.update(16);
        
        const velocity = player.getVelocity();
        expect(velocity.y).toBeLessThan(0);
        expect(player.isMoving()).toBe(true);
      });

      it(then('constrained to boundaries'), () => {
        const player = getPlayer();
        player.position.x = 5;
        player.position.y = 5;
        
        player.constrainToBounds(800, 600);
        
        expect(player.position.x).toBeGreaterThanOrEqual(player.radius);
        expect(player.position.y).toBeGreaterThanOrEqual(player.radius);
      });
    });

    describe('shooting', () => {
      it('can shoot initially', () => {
        const player = getPlayer();
        expect(player.canShoot()).toBe(true);
      });

      it(when('shooting at enemy'), () => {
        const player = getPlayer();
        const target = new EnemyBuilder().at(200, 200).withHealth(50).build();
        const projectile = player.shoot(target);
        
        expect(projectile).toBeTruthy();
        expect(projectile!.damage).toBe(player.damage);
        expect(projectile!.target).toBe(target);
      });

      it(then('has cooldown after shooting'), () => {
        const player = getPlayer();
        const target = new EnemyBuilder().at(200, 200).build();
        player.shoot(target);
        
        expect(player.canShoot()).toBe(false);
      });

      it(when('cooldown expires'), () => {
        const player = getPlayer();
        const target = new EnemyBuilder().at(200, 200).build();
        player.shoot(target);
        
        player.update(600);
        
        expect(player.canShoot()).toBe(true);
      });

      it('targets specific enemy', () => {
        const player = getPlayer();
        const enemy1 = new EnemyBuilder().at(150, 100).build();
        const enemy2 = new EnemyBuilder().at(300, 100).build();
        
        const projectile = player.shoot(enemy1);
        expect(projectile).toBeTruthy();
        expect(projectile!.target).toBe(enemy1);
      });

      it(when('no enemies present'), () => {
        const player = getPlayer();
        const projectile = player.autoShoot([]);
        expect(projectile).toBe(null);
      });

      it(then('ignores dead enemies'), () => {
        const player = getPlayer();
        const enemy = new EnemyBuilder().at(150, 100).build();
        enemy.isAlive = false;
        
        const projectile = player.autoShoot([enemy]);
        expect(projectile).toBe(null);
      });
    });

    describe('upgrades', () => {
      it('allows all upgrades initially', () => {
        const player = getPlayer();
        expect(player.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(true);
        expect(player.canUpgrade(PlayerUpgradeType.SPEED)).toBe(true);
        expect(player.canUpgrade(PlayerUpgradeType.FIRE_RATE)).toBe(true);
        expect(player.canUpgrade(PlayerUpgradeType.HEALTH)).toBe(true);
      });

      it(when('upgrading damage'), () => {
        const player = getPlayer();
        const initialDamage = player.damage;
        
        player.upgrade(PlayerUpgradeType.DAMAGE);
        
        expect(player.damage).toBeGreaterThan(initialDamage);
        expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(1);
      });

      it(when('upgrading speed'), () => {
        const player = getPlayer();
        const initialSpeed = player.speed;
        
        player.upgrade(PlayerUpgradeType.SPEED);
        
        expect(player.speed).toBeGreaterThan(initialSpeed);
        expect(player.getUpgradeLevel(PlayerUpgradeType.SPEED)).toBe(1);
      });

      it(when('upgrading fire rate'), () => {
        const player = getPlayer();
        const initialFireRate = player.fireRate;
        const initialCooldown = player.getCooldownTime();
        
        player.upgrade(PlayerUpgradeType.FIRE_RATE);
        
        expect(player.fireRate).toBeGreaterThan(initialFireRate);
        expect(player.getCooldownTime()).toBeLessThan(initialCooldown);
        expect(player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE)).toBe(1);
      });

      it(when('upgrading health'), () => {
        const player = getPlayer();
        const initialMaxHealth = player.maxHealth;
        const initialHealth = player.health;
        
        player.upgrade(PlayerUpgradeType.HEALTH);
        
        expect(player.maxHealth).toBeGreaterThan(initialMaxHealth);
        expect(player.health).toBeGreaterThan(initialHealth);
        expect(player.getUpgradeLevel(PlayerUpgradeType.HEALTH)).toBe(1);
      });

      it(then('prevents upgrades at max level'), () => {
        const player = getPlayer();
        // Max out damage upgrades
        for (let i = 0; i < 5; i++) {
          player.upgrade(PlayerUpgradeType.DAMAGE);
        }
        
        expect(player.canUpgrade(PlayerUpgradeType.DAMAGE)).toBe(false);
        expect(player.getUpgradeLevel(PlayerUpgradeType.DAMAGE)).toBe(5);
      });

      it('increases level with total upgrades', () => {
        const player = getPlayer();
        expect(player.getLevel()).toBe(1);
        
        player.upgrade(PlayerUpgradeType.DAMAGE);
        player.upgrade(PlayerUpgradeType.SPEED);
        player.upgrade(PlayerUpgradeType.FIRE_RATE);
        player.upgrade(PlayerUpgradeType.HEALTH);
        
        expect(player.getLevel()).toBe(2);
      });

      it('tracks total upgrades', () => {
        const player = getPlayer();
        player.upgrade(PlayerUpgradeType.DAMAGE);
        player.upgrade(PlayerUpgradeType.DAMAGE);
        player.upgrade(PlayerUpgradeType.SPEED);
        
        expect(player.getTotalUpgrades()).toBe(3);
      });
    });

    describe('enemy targeting', () => {
      it(when('finding nearest enemy'), () => {
        const player = getPlayer();
        const enemy1 = new EnemyBuilder().at(150, 100).build();
        const enemy2 = new EnemyBuilder().at(200, 200).build();
        const enemies = [enemy1, enemy2];
        
        const nearest = player.findNearestEnemy(enemies);
        expect(nearest).toBe(enemy1);
      });

      it(then('returns null for dead enemies'), () => {
        const player = getPlayer();
        const enemy = new EnemyBuilder().at(150, 100).build();
        enemy.isAlive = false;
        
        const nearest = player.findNearestEnemy([enemy]);
        expect(nearest).toBe(null);
      });
    });

    describe('health and damage', () => {
      it(when('taking damage'), () => {
        const player = getPlayer();
        player.takeDamage(20);
        assertEntityHealth(player, 80);
        expect(player.isAlive).toBe(true);
      });

      it(then('dies at zero health'), () => {
        const player = getPlayer();
        player.takeDamage(100);
        assertEntityHealth(player, 0);
        expect(player.isAlive).toBe(false);
      });

      it(when('healing'), () => {
        const player = getPlayer();
        player.takeDamage(30);
        player.heal(10);
        assertEntityHealth(player, 80);
      });

      it(then('cannot heal above max'), () => {
        const player = getPlayer();
        player.heal(50);
        assertEntityHealth(player, 100);
      });

      it('maintains health percentage', () => {
        const player = getPlayer();
        player.takeDamage(25);
        expect(player.health / player.maxHealth).toBe(0.75);
      });
    });

    describe('complex movement scenarios', () => {
      it(when('holding movement key'), () => {
        const player = getPlayer();
        const startPos = { ...player.position };
        
        player.handleKeyDown('w');
        
        // Simulate multiple frames
        for (let i = 0; i < 10; i++) {
          player.update(20);
        }
        
        player.handleKeyUp('w');
        
        expect(player.position.y).toBeLessThan(startPos.y);
        expect(player.position.x).toBe(startPos.x);
      });

      it(when('changing directions quickly'), () => {
        const player = getPlayer();
        // Move right
        player.handleKeyDown('d');
        player.update(16);
        player.handleKeyUp('d');
        
        // Immediately move left
        player.handleKeyDown('a');
        player.update(16);
        
        const velocity = player.getVelocity();
        expect(velocity.x).toBeLessThan(0);
      });

      it('handles all four directions', () => {
        const player = getPlayer();
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
  }
);