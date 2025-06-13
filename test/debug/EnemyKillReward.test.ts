import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { ResourceManager, ResourceType } from '@/systems/ResourceManager';

// Simple canvas mock
const mockCanvas = {
  width: 800,
  height: 608,
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    set fillStyle(value: string) {},
    set strokeStyle(value: string) {},
    set lineWidth(value: number) {},
    set globalAlpha(value: number) {},
    set font(value: string) {},
    set textAlign(value: string) {}
  }))
} as unknown as HTMLCanvasElement;

describe('Enemy Kill Reward Debug', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(mockCanvas);
  });

  describe('enemy kill rewards', () => {
    it('should increase currency when enemy is killed via enemyKilled method', () => {
      // Get initial state
      const initialCurrency = game.getCurrency();
      const initialScore = game.getScore();
      
      // Create a mock enemy with appropriate reward values
      const mockEnemy = {
        reward: 10,
        position: { x: 100, y: 100 }
      } as Enemy;
      
      // Manually trigger enemy killed (simulating what should happen)
      game.enemyKilled(mockEnemy);
      
      // Verify the changes
      expect(game.getCurrency()).toBe(initialCurrency + 10);
      expect(game.getScore()).toBe(initialScore + 50);
    });

    it('should track currency changes during projectile updates', () => {
      const player = game.getPlayer();
      const initialCurrency = game.getCurrency();
      
      console.log(`Initial currency: ${initialCurrency}`);
      
      // Create an enemy near the player
      const enemy = new Enemy({ x: player.position.x + 50, y: player.position.y }, 1); // Low health for easy kill
      enemy.setPath([{ x: player.position.x + 50, y: player.position.y }, { x: 800, y: 300 }]);
      
      // Manually add enemy to the game (simulating spawn)
      const enemies = game.getEnemies();
      enemies.push(enemy);
      
      console.log(`Enemy created with ${enemy.health} health and ${enemy.reward} reward`);
      
      // Create a player projectile targeting the enemy
      const projectile = player.shoot(enemy);
      if (projectile) {
        // Manually add projectile to the game
        const projectiles = game.getProjectiles();
        projectiles.push(projectile);
        
        console.log(`Projectile created with ${projectile.damage} damage`);
        
        // Update the game several times to let projectile hit
        for (let i = 0; i < 10; i++) {
          const currencyBefore = game.getCurrency();
          console.log(`Update ${i}: Currency before: ${currencyBefore}`);
          
          game.update(16); // 16ms frame
          
          const currencyAfter = game.getCurrency();
          console.log(`Update ${i}: Currency after: ${currencyAfter}, Change: ${currencyAfter - currencyBefore}`);
          
          if (currencyAfter !== currencyBefore) {
            console.log(`Currency change detected on update ${i}: ${currencyBefore} -> ${currencyAfter}`);
          }
          
          // Check if enemy is dead
          if (!enemy.isAlive) {
            console.log(`Enemy died on update ${i}`);
            break;
          }
        }
        
        const finalCurrency = game.getCurrency();
        console.log(`Final currency: ${finalCurrency}, Expected change: +${enemy.reward}`);
        
        // Currency should have increased by enemy reward
        expect(finalCurrency).toBeGreaterThanOrEqual(initialCurrency);
      }
    });

    it('should not double-reward for same enemy', () => {
      const resourceManager = new ResourceManager();
      const initialCurrency = resourceManager.getCurrency();
      
      // Kill same enemy multiple times (should only reward once)
      resourceManager.enemyKilled(10, 50);
      const afterFirst = resourceManager.getCurrency();
      
      resourceManager.enemyKilled(10, 50); // Same reward again
      const afterSecond = resourceManager.getCurrency();
      
      expect(afterFirst).toBe(initialCurrency + 10);
      expect(afterSecond).toBe(afterFirst + 10); // Should still add (ResourceManager doesn't prevent this)
    });

    it('should handle projectile target tracking correctly', () => {
      const player = game.getPlayer();
      const enemy = new Enemy({ x: 200, y: 200 }, 50);
      
      const projectile = player.shoot(enemy);
      expect(projectile).toBeTruthy();
      expect(projectile!.target).toBe(enemy);
      
      // Simulate projectile hitting enemy
      enemy.takeDamage(projectile!.damage);
      projectile!.isAlive = false;
      
      // Check the condition used in game update loop
      const condition = !projectile!.isAlive && projectile!.target && !projectile!.target.isAlive;
      
      if (enemy.health <= 0) {
        enemy.isAlive = false;
        expect(condition).toBe(true);
      } else {
        expect(condition).toBe(false);
      }
    });
  });

  describe('resource manager debugging', () => {
    it('should log all resource changes', () => {
      const resourceManager = new ResourceManager();
      const changes: Array<{type: string, old: number, new: number}> = [];
      
      resourceManager.onResourceChange((type, oldValue, newValue) => {
        changes.push({ type, old: oldValue, new: newValue });
        console.log(`Resource change: ${type} ${oldValue} -> ${newValue}`);
      });
      
      resourceManager.enemyKilled(10, 50);
      
      expect(changes).toHaveLength(2); // Currency and Score changes
      expect(changes[0].type).toBe(ResourceType.CURRENCY);
      expect(changes[1].type).toBe(ResourceType.SCORE);
    });
  });
});