import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '../../src/systems/Renderer';
import { Grid } from '../../src/systems/Grid';
import { Tower, TowerType } from '../../src/entities/Tower';
import { Player } from '../../src/entities/Player';
import { UpgradeType } from '../../src/systems/TowerUpgradeManager';

// Mock canvas context with upgrade dot specific methods
const mockContext = {
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
};

// Mock canvas
const mockCanvas = {
  width: 800,
  height: 608,
  getContext: vi.fn(() => mockContext)
} as unknown as HTMLCanvasElement;

describe('Renderer Upgrade Dots System', () => {
  let renderer: Renderer;
  let grid: Grid;

  beforeEach(() => {
    vi.clearAllMocks();
    grid = new Grid(25, 19, 32);
    renderer = new Renderer(mockCanvas, grid);
  });

  describe('tower upgrade dots rendering', () => {
    it('should render upgrade dots for upgraded towers', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      // Add some upgrades
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.RANGE);
      
      renderer.renderTowerUpgradeDots(tower);

      // Should draw circles for upgrade dots
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should not render dots for towers with no upgrades', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      // No upgrades
      renderer.renderTowerUpgradeDots(tower);

      // Should not draw any circles since no upgrades
      expect(mockContext.arc).not.toHaveBeenCalled();
    });

    it('should render multiple dots for multiple upgrade levels', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      // Add multiple levels of damage upgrades
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.DAMAGE);
      
      renderer.renderTowerUpgradeDots(tower);

      // Should draw 3 dots for 3 damage upgrades
      expect(mockContext.arc).toHaveBeenCalledTimes(3);
    });

    it('should render dots for all upgrade types', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      // Add one of each upgrade type
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.RANGE);
      tower.upgrade(UpgradeType.FIRE_RATE);
      
      renderer.renderTowerUpgradeDots(tower);

      // Should draw 3 dots total (1 for each type)
      expect(mockContext.arc).toHaveBeenCalledTimes(3);
    });

    it('should position dots around the tower', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const arcSpy = vi.spyOn(mockContext, 'arc');
      
      tower.upgrade(UpgradeType.DAMAGE);
      
      renderer.renderTowerUpgradeDots(tower);

      // Check that arc was called with positions around the tower
      expect(arcSpy).toHaveBeenCalled();
      const arcCall = arcSpy.mock.calls[0];
      const [x, y] = arcCall;
      
      // Dot should be positioned away from tower center
      // With damage upgrade at angle 0, x should be greater than 100
      expect(x).toBeGreaterThan(100);
      // Y should be approximately 100 (since cos(0) = 1, sin(0) = 0)
      expect(Math.abs(y - 100)).toBeLessThan(1);
    });

    it('should use different colors for different upgrade types', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const fillStyleSetter = vi.fn();
      Object.defineProperty(mockContext, 'fillStyle', {
        set: fillStyleSetter,
        configurable: true
      });
      
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.RANGE);
      tower.upgrade(UpgradeType.FIRE_RATE);
      
      renderer.renderTowerUpgradeDots(tower);

      // Should set different colors for different upgrade types
      expect(fillStyleSetter).toHaveBeenCalledWith('#FF4444'); // Red for damage
      expect(fillStyleSetter).toHaveBeenCalledWith('#44FF44'); // Green for range
      expect(fillStyleSetter).toHaveBeenCalledWith('#4444FF'); // Blue for fire rate
    });

    it('should render dots with black outlines', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const strokeStyleSetter = vi.fn();
      Object.defineProperty(mockContext, 'strokeStyle', {
        set: strokeStyleSetter,
        configurable: true
      });
      
      tower.upgrade(UpgradeType.DAMAGE);
      
      renderer.renderTowerUpgradeDots(tower);

      expect(strokeStyleSetter).toHaveBeenCalledWith('#000000');
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });

  describe('tower rendering integration', () => {
    it('should call upgrade dots rendering when rendering towers', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const dotsSpy = vi.spyOn(renderer, 'renderTowerUpgradeDots');
      
      renderer.renderTower(tower);

      expect(dotsSpy).toHaveBeenCalledWith(tower);
    });

    it('should render tower body before upgrade dots', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      tower.upgrade(UpgradeType.DAMAGE);
      
      renderer.renderTower(tower);

      // Should draw tower circle first, then upgrade dots
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });
  });

  describe('player rendering', () => {
    it('should render player with correct visual elements', () => {
      const player = new Player({ x: 200, y: 200 });
      
      renderer.renderPlayer(player);

      // Should draw player circle
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should render movement indicator when player is moving', () => {
      const player = new Player({ x: 200, y: 200 });
      
      // Simulate movement
      player.handleKeyDown('w');
      player.update(16);
      
      renderer.renderPlayer(player);

      // Should draw extra circle for movement indicator
      expect(mockContext.arc).toHaveBeenCalledTimes(2); // Main circle + movement indicator
    });

    it('should render level indicator for upgraded players', () => {
      const player = new Player({ x: 200, y: 200 });
      
      // Upgrade player to increase level
      player.upgrade('DAMAGE' as any);
      player.upgrade('SPEED' as any);
      player.upgrade('FIRE_RATE' as any);
      player.upgrade('HEALTH' as any);
      
      renderer.renderPlayer(player);

      // Should render level text
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should use different colors based on player level', () => {
      const player = new Player({ x: 200, y: 200 });
      const fillStyleSetter = vi.fn();
      Object.defineProperty(mockContext, 'fillStyle', {
        set: fillStyleSetter,
        configurable: true
      });
      
      renderer.renderPlayer(player);

      // Should set a color based on player level
      expect(fillStyleSetter).toHaveBeenCalled();
    });
  });

  describe('scene rendering with player', () => {
    it('should render player in scene when provided', () => {
      const towers: Tower[] = [];
      const enemies: any[] = [];
      const projectiles: any[] = [];
      const player = new Player({ x: 200, y: 200 });
      
      const playerSpy = vi.spyOn(renderer, 'renderPlayer');
      
      renderer.renderScene(towers, enemies, projectiles, player);

      expect(playerSpy).toHaveBeenCalledWith(player);
    });

    it('should not crash when no player is provided', () => {
      const towers: Tower[] = [];
      const enemies: any[] = [];
      const projectiles: any[] = [];
      
      expect(() => {
        renderer.renderScene(towers, enemies, projectiles);
      }).not.toThrow();
    });

    it('should render entities in correct order', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const player = new Player({ x: 200, y: 200 });
      
      const towerSpy = vi.spyOn(renderer, 'renderTower');
      const playerSpy = vi.spyOn(renderer, 'renderPlayer');
      
      renderer.renderScene([tower], [], [], player);

      // Both should be called
      expect(towerSpy).toHaveBeenCalled();
      expect(playerSpy).toHaveBeenCalled();
    });
  });

  describe('visual consistency', () => {
    it('should maintain consistent dot sizes', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      tower.upgrade(UpgradeType.DAMAGE);
      
      const arcSpy = vi.spyOn(mockContext, 'arc');
      
      renderer.renderTowerUpgradeDots(tower);

      // Check that all dots have the same radius (3)
      const arcCalls = arcSpy.mock.calls;
      arcCalls.forEach(call => {
        const radius = call[2];
        expect(radius).toBe(3);
      });
    });

    it('should position dots at increasing distances for multiple levels', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      // Add multiple damage upgrades
      tower.upgrade(UpgradeType.DAMAGE);
      tower.upgrade(UpgradeType.DAMAGE);
      
      const arcSpy = vi.spyOn(mockContext, 'arc');
      
      renderer.renderTowerUpgradeDots(tower);

      // Should have two damage dots at different distances
      expect(arcSpy).toHaveBeenCalledTimes(2);
      
      const firstDotCall = arcSpy.mock.calls[0];
      const secondDotCall = arcSpy.mock.calls[1];
      
      // Calculate distances from tower center
      const dist1 = Math.sqrt((firstDotCall[0] - 100) ** 2 + (firstDotCall[1] - 100) ** 2);
      const dist2 = Math.sqrt((secondDotCall[0] - 100) ** 2 + (secondDotCall[1] - 100) ** 2);
      
      expect(dist2).toBeGreaterThan(dist1);
    });
  });
});