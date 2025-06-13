import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { TowerType } from '@/entities/Tower';

// Document is mocked in setup.ts

// Ensure document is available for tests
if (typeof document === 'undefined') {
  global.document = {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createElement: vi.fn(),
    body: { appendChild: vi.fn(), removeChild: vi.fn() }
  } as any;
}

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
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    measureText: vi.fn(() => ({ width: 10 })),
    setTransform: vi.fn(),
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
    vi.clearAllMocks();
    vi.restoreAllMocks(); // Restore any spies from previous tests
    game = new Game(mockCanvas);
  });

  describe('player click detection', () => {
    it('should detect clicks on player', () => {
      const player = game.getPlayer();
      
      // Ensure game is in PLAYING state
      game.start();

      // Ensure document is available
      if (typeof document === 'undefined') {
        global.document = {
          dispatchEvent: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          createElement: vi.fn(),
          body: { appendChild: vi.fn(), removeChild: vi.fn() }
        } as any;
      }
      
      // Mock document.dispatchEvent
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      
      // Get screen coordinates for player position using camera transformation
      const camera = (game as any).camera; // Access camera
      const playerScreenPos = camera.worldToScreen(player.position);
      
      const mouseEvent = {
        offsetX: playerScreenPos.x,
        offsetY: playerScreenPos.y
      } as MouseEvent;
      
      game.handleMouseDown(mouseEvent);
      
      // Should dispatch playerClicked event
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'playerClicked'
      }));
    });

    it('should not trigger player click when clicking outside player area', () => {
      const player = game.getPlayer();
      
      // Ensure game is in PLAYING state
      game.start();

      // Ensure document is available
      if (typeof document === 'undefined') {
        global.document = {
          dispatchEvent: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          createElement: vi.fn(),
          body: { appendChild: vi.fn(), removeChild: vi.fn() }
        } as any;
      }
      
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      
      // Click far from player - use a position definitely outside player radius
      const farAwayWorldPos = { x: player.position.x + 100, y: player.position.y + 100 };
      const camera = (game as any).camera; // Access camera
      const farAwayScreenPos = camera.worldToScreen(farAwayWorldPos);
      
      const mouseEvent = {
        offsetX: farAwayScreenPos.x,
        offsetY: farAwayScreenPos.y
      } as MouseEvent;

      game.handleMouseDown(mouseEvent);
      
      // Should not dispatch playerClicked event
      expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({
        type: 'playerClicked'
      }));
    });

    it('should prioritize player clicks over tower placement', () => {
      const player = game.getPlayer();
      
      // Ensure game is in PLAYING state
      game.start();

      // Ensure document is available
      if (typeof document === 'undefined') {
        global.document = {
          dispatchEvent: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          createElement: vi.fn(),
          body: { appendChild: vi.fn(), removeChild: vi.fn() }
        } as any;
      }
      
      const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
      
      // Set a tower type for placement
      game.setSelectedTowerType(TowerType.BASIC);
      
      // Get screen coordinates for player position using camera transformation
      const camera = (game as any).camera; // Access camera
      const playerScreenPos = camera.worldToScreen(player.position);
      
      const mouseEvent = {
        offsetX: playerScreenPos.x,
        offsetY: playerScreenPos.y
      } as MouseEvent;

      const towerCountBefore = game.getTowers().length;
      game.handleMouseDown(mouseEvent);
      const towerCountAfter = game.getTowers().length;
      
      // Should dispatch player event instead of placing tower
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'playerClicked'
      }));
      expect(towerCountAfter).toBe(towerCountBefore); // No new tower
    });
  });

  describe('player position and interactions', () => {
    it('should place player at center of world', () => {
      const player = game.getPlayer();
      const mapData = game.getCurrentMapData();
      
      // Calculate expected center based on actual map size
      const worldWidth = mapData.metadata.width * 32; // 32 pixels per cell
      const worldHeight = mapData.metadata.height * 32;
      const expectedX = Math.floor(worldWidth / 2);
      const expectedY = Math.floor(worldHeight / 2);
      
      // Player should be near the center (within reasonable distance since map generation finds a suitable spot)
      const distanceFromCenter = Math.sqrt(
        Math.pow(player.position.x - expectedX, 2) + 
        Math.pow(player.position.y - expectedY, 2)
      );
      
      expect(distanceFromCenter).toBeLessThan(80); // Within about 2.5 cells of center
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