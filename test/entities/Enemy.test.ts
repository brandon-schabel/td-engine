import { describe, it, expect } from 'vitest';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Player } from '@/entities/Player';
import { EntityType } from '@/entities/Entity';
import { describeEntity, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';
import { assertEntityHealth, assertEntityPosition, assertEntityCounts } from '../helpers/assertions';
import { EnemyBuilder, PlayerBuilder } from '../helpers/builders';
import { TestEnemies } from '../fixtures/testData';

describe.skip('Enemy',
  () => new EnemyBuilder().ofType(EnemyType.BASIC).at(100, 100).withHealth(50).build(),
  (getEnemy, context) => {
    const createPlayer = () => new Player({ x: 200, y: 200 });

    describe('initialization', () => {
      it('creates basic enemy with defaults', () => {
        const enemy = getEnemy();
        expect(enemy.type).toBe(EntityType.ENEMY);
        expect(enemy.enemyType).toBe(EnemyType.BASIC);
        expect(enemy.health).toBe(50);
        expect(enemy.speed).toBe(50);
        expect(enemy.radius).toBe(8);
        expect(enemy.reward).toBe(10);
        expect(enemy.damage).toBe(10);
      });

      it('creates fast enemy with speed boost', () => {
        const fastEnemy = new EnemyBuilder().ofType(EnemyType.FAST).withHealth(30).build();
        expect(fastEnemy.health).toBe(30);
        expect(fastEnemy.speed).toBe(100);
        expect(fastEnemy.radius).toBe(6);
        expect(fastEnemy.reward).toBe(15);
        expect(fastEnemy.damage).toBe(5);
      });

      it('creates tank enemy with high health', () => {
        const tankEnemy = new EnemyBuilder().ofType(EnemyType.TANK).withHealth(200).build();
        expect(tankEnemy.health).toBe(200);
        expect(tankEnemy.speed).toBe(25);
        expect(tankEnemy.radius).toBe(12);
        expect(tankEnemy.reward).toBe(50);
        expect(tankEnemy.damage).toBe(20);
      });
    });

    describe('player targeting', () => {
      it(when('setting target to player'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.update(16);
        expect(enemy.getTarget()).toBe(player);
      });

      it(when('target is set'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        const initialDistance = enemy.distanceTo(player);
        enemy.setTarget(player);
        enemy.update(100);
        
        const newDistance = enemy.distanceTo(player);
        expect(newDistance).toBeLessThan(initialDistance);
      });

      it(then('stops moving if player is dead'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        player.takeDamage(player.health);
        
        const positionBefore = { ...enemy.position };
        enemy.update(100);
        
        assertEntityPosition(enemy, positionBefore, 10);
      });

      it(then('clears target when player dies'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        player.takeDamage(player.health);
        enemy.update(100);
        
        expect(enemy.getTarget()).toBe(null);
      });

      it('calculates angle to player correctly', () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.update(16);
        const angle = enemy.getAngleToTarget();
        
        // Enemy at (100,100), player at (200,200)
        // Expected angle should be 45 degrees (π/4 radians)
        expect(angle).toBeCloseTo(Math.PI / 4, 2);
      });
    });

    describe('attacking behavior', () => {
      it(when('in attack range'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.position.x = player.position.x - 10;
        enemy.position.y = player.position.y;
        enemy.update(16);
        
        expect(enemy.isInAttackRange()).toBe(true);
      });

      it(when('far from player'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        expect(enemy.isInAttackRange()).toBe(false);
      });

      it(then('attacks player when cooldown ready'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.position.x = player.position.x;
        enemy.position.y = player.position.y;
        enemy.update(16);
        
        // Move away during cooldown
        enemy.position.x = player.position.x + 100;
        enemy.update(1100);
        
        // Move back into range
        enemy.position.x = player.position.x;
        
        const playerHealthBefore = player.health;
        const attacked = enemy.tryAttack();
        
        expect(attacked).toBe(true);
        assertEntityHealth(player, playerHealthBefore - enemy.damage);
      });

      it('enforces attack cooldown', () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.position.x = player.position.x - 15;
        enemy.position.y = player.position.y;
        
        enemy.tryAttack();
        const secondAttack = enemy.tryAttack();
        
        expect(secondAttack).toBe(false);
      });

      it(when('cooldown expires'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.position.x = player.position.x - 15;
        enemy.position.y = player.position.y;
        
        enemy.tryAttack();
        
        // Move out of range during cooldown
        enemy.position.x = player.position.x - 100;
        enemy.update(1001);
        
        // Move back and attack
        enemy.position.x = player.position.x - 15;
        const canAttackAgain = enemy.tryAttack();
        expect(canAttackAgain).toBe(true);
      });

      it(then('stops moving to attack'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.position.x = player.position.x - 15;
        enemy.position.y = player.position.y;
        
        const positionBefore = { ...enemy.position };
        enemy.update(100);
        
        assertEntityPosition(enemy, positionBefore, 1);
      });

      it('has type-specific attack rates', () => {
        const basic = getEnemy();
        const fast = new EnemyBuilder().ofType(EnemyType.FAST).build();
        const tank = new EnemyBuilder().ofType(EnemyType.TANK).build();
        
        expect(fast.getAttackCooldown()).toBeLessThan(basic.getAttackCooldown());
        expect(tank.getAttackCooldown()).toBeGreaterThan(basic.getAttackCooldown());
      });
    });

    describe('movement behavior', () => {
      it(when('moving towards player'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        
        const positions = [];
        for (let i = 0; i < 5; i++) {
          positions.push({ ...enemy.position });
          enemy.update(100);
        }
        
        // Each position should be closer
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

      it(then('tracks moving player'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.update(16);
        
        const angleBeforeMove = enemy.getAngleToTarget();
        
        // Move player
        player.position.x = 100;
        player.position.y = 300;
        
        enemy.update(16);
        const angleAfterMove = enemy.getAngleToTarget();
        expect(angleAfterMove).not.toBe(angleBeforeMove);
        expect(angleAfterMove).toBeCloseTo(Math.PI / 2, 2);
      });

      it('maintains consistent speed', () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        
        const distanceBefore = enemy.distanceTo(player);
        enemy.update(1000);
        const distanceAfter = enemy.distanceTo(player);
        
        const distanceMoved = distanceBefore - distanceAfter;
        expect(Math.abs(distanceMoved - enemy.speed)).toBeLessThan(5);
      });
    });

    describe('state management', () => {
      it(when('enemy is dead'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.takeDamage(enemy.health);
        
        const positionBefore = { ...enemy.position };
        enemy.update(100);
        
        expect(enemy.position).toEqual(positionBefore);
        expect(enemy.isAlive).toBe(false);
      });

      it(then('cannot attack when dead'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
        enemy.setTarget(player);
        enemy.position.x = player.position.x - 15;
        enemy.position.y = player.position.y;
        enemy.takeDamage(enemy.health);
        
        const playerHealthBefore = player.health;
        enemy.tryAttack();
        
        assertEntityHealth(player, playerHealthBefore);
      });
    });

    describe('path system fallback', () => {
      it('has path methods available', () => {
        const enemy = getEnemy();
        expect(enemy.setPath).toBeDefined();
        expect(enemy.hasReachedEnd).toBeDefined();
        expect(enemy.getProgress).toBeDefined();
      });
    
      it(then('prioritizes player over path'), () => {
        const enemy = getEnemy();
        const player = createPlayer();
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
  }
);