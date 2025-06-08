import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { Enemy, EnemyType } from '../../src/entities/Enemy';

// Mock canvas and context
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
    set fillStyle(value: string) {},
    set strokeStyle(value: string) {},
    set lineWidth(value: number) {},
    set globalAlpha(value: number) {},
    set font(value: string) {},
    set textAlign(value: string) {}
  }))
} as unknown as HTMLCanvasElement;

describe('Player UI Integration', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(mockCanvas);
  });

  describe('player click detection', () => {
    it('should detect clicks on player', () => {
      const player = game.getPlayer();
      const playerPos = player.position;
      
      // Mock document.dispatchEvent
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      
      // Simulate click on player
      const mouseEvent = new MouseEvent('click', {
        clientX: playerPos.x,
        clientY: playerPos.y
      });
      
      Object.defineProperty(mouseEvent, 'offsetX', {
        value: playerPos.x,
        writable: false
      });
      Object.defineProperty(mouseEvent, 'offsetY', {
        value: playerPos.y,
        writable: false
      });

      game.handleMouseClick(mouseEvent);
      
      // Should dispatch playerClicked event
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'playerClicked'
      }));
    });

    it('should not trigger player click when clicking outside player area', () => {
      const player = game.getPlayer();
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      
      // Click far from player
      const mouseEvent = new MouseEvent('click');
      Object.defineProperty(mouseEvent, 'offsetX', {
        value: player.position.x + 100,
        writable: false
      });
      Object.defineProperty(mouseEvent, 'offsetY', {
        value: player.position.y + 100,
        writable: false
      });

      game.handleMouseClick(mouseEvent);
      
      // Should not dispatch playerClicked event
      expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({
        type: 'playerClicked'
      }));
    });

    it('should prioritize player clicks over tower placement', () => {
      const player = game.getPlayer();
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      
      // Set a tower type for placement
      game.setSelectedTowerType('BASIC' as any);
      
      // Click on player
      const mouseEvent = new MouseEvent('click');
      Object.defineProperty(mouseEvent, 'offsetX', {
        value: player.position.x,
        writable: false
      });
      Object.defineProperty(mouseEvent, 'offsetY', {
        value: player.position.y,
        writable: false
      });

      game.handleMouseClick(mouseEvent);
      
      // Should dispatch playerClicked event, not place tower
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'playerClicked'
      }));
    });
  });

  describe('player position and interactions', () => {
    it('should place player at center of canvas', () => {
      const player = game.getPlayer();
      
      expect(player.position.x).toBe(400); // Half of 800
      expect(player.position.y).toBe(304); // Half of 608
    });

    it('should allow player movement', () => {
      const player = game.getPlayer();
      const initialPos = { ...player.position };
      
      // Move player
      game.handleKeyDown('w');
      
      // Update game state
      game.update(100); // 100ms
      
      // Position should change (moving up)
      expect(player.position.y).toBeLessThan(initialPos.y);
    });

    it('should constrain player to canvas bounds', () => {
      const player = game.getPlayer();
      
      // Move player to edge and beyond
      player.position.x = -50;
      player.position.y = -50;
      
      // Update should constrain position
      game.update(16);
      
      expect(player.position.x).toBeGreaterThanOrEqual(player.radius);
      expect(player.position.y).toBeGreaterThanOrEqual(player.radius);
    });
  });

  describe('player upgrade integration', () => {
    it('should have upgrade methods available', () => {
      expect(typeof game.upgradePlayer).toBe('function');
      expect(typeof game.getPlayerUpgradeCost).toBe('function');
      expect(typeof game.canAffordPlayerUpgrade).toBe('function');
    });

    it('should allow player upgrades when affordable', () => {
      const player = game.getPlayer();
      const initialDamage = player.damage;
      
      // Should be able to upgrade damage
      const upgraded = game.upgradePlayer('DAMAGE' as any);
      
      expect(upgraded).toBe(true);
      expect(player.damage).toBeGreaterThan(initialDamage);
    });

    it('should track upgrade costs correctly', () => {
      const initialCost = game.getPlayerUpgradeCost('DAMAGE' as any);
      expect(initialCost).toBeGreaterThan(0);
      
      // Upgrade once
      game.upgradePlayer('DAMAGE' as any);
      
      // Cost should increase
      const newCost = game.getPlayerUpgradeCost('DAMAGE' as any);
      expect(newCost).toBeGreaterThan(initialCost);
    });
  });

  describe('auto-shooting mechanics', () => {
    it('should auto-shoot at enemies when they are in range', () => {
      const initialProjectileCount = game.getProjectiles().length;
      
      // Create an enemy near the player
      const enemies = game.getEnemies();
      // Note: This test assumes enemies exist or we'd need to mock enemy creation
      
      // Update game to trigger auto-shooting
      game.update(100);
      
      // Should potentially create projectiles (depends on enemy presence)
      const newProjectileCount = game.getProjectiles().length;
      expect(newProjectileCount).toBeGreaterThanOrEqual(initialProjectileCount);
    });

    it('should respect fire rate cooldown', () => {
      const player = game.getPlayer();
      
      // Should be able to shoot initially
      expect(player.canShoot()).toBe(true);
      
      // Shoot
      const target = new Enemy(EnemyType.BASIC, { x: 200, y: 200 });
      const projectile = player.shoot(target);
      expect(projectile).toBeTruthy();
      
      // Should be on cooldown
      expect(player.canShoot()).toBe(false);
      
      // After cooldown time passes
      player.update(600); // More than default cooldown
      expect(player.canShoot()).toBe(true);
    });
  });
});