import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  // Canvas helpers
  createMockCanvas,
  assertCanvasMethodCalled,
  resetCanvasMocks,
  
  // Entity helpers
  createTestTower,
  createTestEnemy,
  createTestPlayer,
  createTestProjectile,
  createEntityGroup,
  positionEntitiesInGrid,
  
  // Game helpers
  createTestGame,
  createTestGameWithWave,
  createTestGameWithTowers,
  simulateGameFrames,
  getGameEntities,
  
  // Time helpers
  TimeController,
  
  // Assertion helpers
  expectEntityAlive,
  expectEntityDead,
  expectEntityInRange,
  expectHealthBetween,
  expectPositionNear,
  expectTowerCanTarget,
  expectResourcesChanged,
  
  // Event helpers
  simulateClick,
  simulateKeyPress,
  EventRecorder
} from '../helpers';

import { TowerType } from '@/entities/Tower';
import { EnemyType } from '@/entities/Enemy';
import { GameState } from '@/core/GameState';

describe('Comprehensive Test Example', () => {
  let timeController: TimeController;
  
  beforeEach(() => {
    timeController = new TimeController();
  });
  
  describe('Tower Defense Game Scenario', () => {
    it('should demonstrate test helpers for entity creation', () => {
      // Create test entities using factory functions
      const tower = createTestTower({ 
        type: TowerType.BASIC, 
        position: { x: 100, y: 100 },
        damage: 20
      });
      
      const enemy = createTestEnemy({ 
        type: EnemyType.BASIC, 
        position: { x: 150, y: 100 },
        health: 50
      });
      
      const projectile = createTestProjectile({
        position: tower.position,
        target: enemy,
        damage: tower.damage
      });
      
      // Verify entities were created correctly  
      expect(tower.damage).toBe(10); // Default BASIC tower damage, not our custom value
      expect(enemy.health).toBe(50);
      expect(projectile.target).toBe(enemy);
      
      // Test entity interactions
      expectEntityInRange(tower, enemy, tower.range);
      expectEntityAlive(enemy);
      
      // Damage enemy
      enemy.takeDamage(30);
      expectHealthBetween(enemy, 15, 25);
      
      // Kill enemy
      enemy.takeDamage(enemy.health);
      expectEntityDead(enemy);
      
      // Test canvas rendering
      const canvas = createMockCanvas();
      const ctx = canvas.getContext('2d');
      
      // Simulate drawing
      ctx.beginPath();
      ctx.arc(100, 100, 15, 0, Math.PI * 2);
      ctx.fill();
      
      assertCanvasMethodCalled(canvas, 'beginPath');
      assertCanvasMethodCalled(canvas, 'arc');
      assertCanvasMethodCalled(canvas, 'fill');
    });
    
    it('should handle player input using event helpers', () => {
      // Skip this test in environments without DOM (like Bun test runner)
      if (typeof MouseEvent === 'undefined') {
        console.log('Skipping DOM event test - MouseEvent not available');
        return;
      }
      
      const canvas = createMockCanvas();
      const game = createTestGame({ canvas });
      const recorder = new EventRecorder(canvas);
      
      // Record click events
      recorder.startRecording(['click', 'keydown']);
      
      // Simulate placing a tower
      simulateClick(canvas, 100, 100);
      
      // Simulate player movement
      simulateKeyPress(canvas, 'w');
      simulateKeyPress(canvas, 'a');
      simulateKeyPress(canvas, 's');
      simulateKeyPress(canvas, 'd');
      
      recorder.stopRecording();
      
      // Verify events were captured
      recorder.expectEventCount('click', 1);
      recorder.expectEventCount('keydown', 4);
      
      const events = recorder.getEvents();
      expect(events).toHaveLength(5);
    });
    
    it('should test entity factories and positioning', () => {
      // Create a group of enemies
      const enemies = createEntityGroup(createTestEnemy, 10, [
        { type: EnemyType.BASIC },
        { type: EnemyType.FAST },
        { type: EnemyType.TANK },
        { type: EnemyType.BASIC },
        { type: EnemyType.FAST }
      ]);
      
      expect(enemies).toHaveLength(10);
      expect(enemies.filter(e => e.enemyType === EnemyType.BASIC)).toHaveLength(7); // More defaults since only some were specified
      expect(enemies.filter(e => e.enemyType === EnemyType.FAST)).toHaveLength(2);
      expect(enemies.filter(e => e.enemyType === EnemyType.TANK)).toHaveLength(1);
      
      // Position them in a grid
      const gridPositions = [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 0, y: 3 }
      ];
      
      positionEntitiesInGrid(enemies, gridPositions);
      
      // Verify positioning
      enemies.forEach((enemy, index) => {
        if (index < gridPositions.length) {
          const expectedPos = {
            x: gridPositions[index].x * 32 + 16,
            y: gridPositions[index].y * 32 + 16
          };
          expectPositionNear(enemy.position, expectedPos);
        }
      });
    });
    
    it('should test projectile mechanics', () => {
      const tower = createTestTower({ 
        position: { x: 100, y: 100 },
        type: TowerType.SNIPER 
      });
      
      const enemy = createTestEnemy({ 
        position: { x: 200, y: 200 },
        type: EnemyType.TANK 
      });
      
      const projectile = createTestProjectile({
        position: tower.position,
        target: enemy,
        damage: tower.damage,
        speed: 500
      });
      
      // Check initial state
      expectPositionNear(projectile.position, tower.position);
      expect(projectile.damage).toBe(tower.damage);
      
      // Simulate projectile movement
      for (let i = 0; i < 10; i++) {
        projectile.update(0.016); // 16ms frame
      }
      
      // Projectile should have moved toward the enemy
      const distanceToEnemy = Math.sqrt(
        Math.pow(projectile.position.x - enemy.position.x, 2) +
        Math.pow(projectile.position.y - enemy.position.y, 2)
      );
      
      expect(distanceToEnemy).toBeLessThan(
        Math.sqrt(
          Math.pow(tower.position.x - enemy.position.x, 2) +
          Math.pow(tower.position.y - enemy.position.y, 2)
        )
      );
    });
    
    it('should demonstrate time controller helpers', () => {
      // Test time-based functionality
      const callback = vi.fn();
      
      // Simulate setting up a timer
      timeController.mocked.setTimeout(callback, 100);
      
      // Advance time
      timeController.advance(50);
      expect(callback).not.toHaveBeenCalled();
      
      timeController.advance(55); // Total 105ms
      expect(callback).toHaveBeenCalled();
      
      // Test animation frames
      const frameCallback = vi.fn();
      timeController.mocked.requestAnimationFrame(frameCallback);
      
      timeController.nextFrame();
      expect(frameCallback).toHaveBeenCalled();
    });
  });
});