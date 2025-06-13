import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '@/systems/Renderer';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Grid, CellType } from '@/systems/Grid';
import { Camera } from '@/systems/Camera';
import { createMockCanvas, assertCanvasMethodCalled, assertCanvasMethodNotCalled, resetCanvasMocks, createTestTower, createTestEnemy, createTestProjectile } from '../helpers';

// Mock camera
const mockCamera = {
  worldToScreen: vi.fn((pos) => pos), // Identity transform by default
  screenToWorld: vi.fn((pos) => pos), // Identity transform by default
  isVisible: vi.fn(() => true), // Everything visible by default
  getVisibleBounds: vi.fn(() => ({
    min: { x: 0, y: 0 },
    max: { x: 800, y: 600 }
  })),
  update: vi.fn(),
  getPosition: vi.fn(() => ({ x: 0, y: 0 })),
  setPosition: vi.fn()
} as any;

describe('Renderer', () => {
  let renderer: Renderer;
  let grid: Grid;
  let camera: Camera;
  let mockCanvas: ReturnType<typeof createMockCanvas>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas = createMockCanvas(800, 600);
    
    grid = new Grid(25, 19, 32); // 800x608 at 32px per cell
    camera = new Camera(800, 600, 800, 608);
    renderer = new Renderer(mockCanvas, grid, camera);
  });

  describe('initialization', () => {
    it('should initialize with canvas and grid', () => {
      expect(renderer).toBeDefined();
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should throw error if context is not available', () => {
      const badCanvas = createMockCanvas();
      badCanvas.getContext = vi.fn().mockReturnValue(null);
      
      expect(() => new Renderer(badCanvas, grid, camera)).toThrow('Could not get 2D context');
    });
  });

  describe('clearing and setup', () => {
    it('should clear the canvas', () => {
      renderer.clear();
      
      const ctx = mockCanvas.getContext('2d');
      assertCanvasMethodCalled(mockCanvas, 'clearRect');
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should set background color and clear', () => {
      renderer.clear('#1a1a1a');
      
      const ctx = mockCanvas.getContext('2d');
      expect(ctx.fillStyle).toBe('#1a1a1a');
      assertCanvasMethodCalled(mockCanvas, 'fillRect');
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  describe('grid rendering', () => {
    it('should render empty grid', () => {
      renderer.renderGrid();
      
      // Should draw grid lines
      assertCanvasMethodCalled(mockCanvas, 'beginPath');
      assertCanvasMethodCalled(mockCanvas, 'moveTo');
      assertCanvasMethodCalled(mockCanvas, 'lineTo');
      assertCanvasMethodCalled(mockCanvas, 'stroke');
    });

    it('should render path cells differently', () => {
      grid.setPath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      
      renderer.renderGrid();
      
      // Should fill path cells
      assertCanvasMethodCalled(mockCanvas, 'fillRect');
    });

    it('should render blocked cells', () => {
      grid.setCellType(5, 5, CellType.BLOCKED);
      
      renderer.renderGrid();
      
      assertCanvasMethodCalled(mockCanvas, 'fillRect');
    });
  });

  describe('entity rendering', () => {
    it('should render tower', () => {
      const tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      
      renderer.renderTower(tower);
      
      const ctx = mockCanvas.getContext('2d');
      
      // Tower should render either with texture (drawImage) or fallback (arc + fill)
      // Both are valid rendering approaches
      const hasTexture = ctx.drawImage.mock.calls.length > 0;
      const hasFallback = ctx.arc.mock.calls.length > 0;
      
      expect(hasTexture || hasFallback).toBe(true);
      
      if (hasFallback) {
        // If using fallback rendering, should draw circle
        assertCanvasMethodCalled(mockCanvas, 'beginPath');
        assertCanvasMethodCalled(mockCanvas, 'arc');
        assertCanvasMethodCalled(mockCanvas, 'fill');
        expect(ctx.arc).toHaveBeenCalledWith(100, 100, 15, 0, Math.PI * 2);
      }
      
      if (hasTexture) {
        // If using texture rendering, should call drawImage
        assertCanvasMethodCalled(mockCanvas, 'drawImage');
      }
    });

    it('should render enemy', () => {
      const enemy = createTestEnemy({ position: { x: 200, y: 200 }, health: 50 });
      
      renderer.renderEnemy(enemy);
      
      const ctx = mockCanvas.getContext('2d');
      
      // Enemy should render either with texture (drawImage) or fallback (arc + fill)
      const hasTexture = ctx.drawImage.mock.calls.length > 0;
      const hasFallback = ctx.arc.mock.calls.length > 0;
      
      expect(hasTexture || hasFallback).toBe(true);
      
      if (hasFallback) {
        // If using fallback rendering, should draw circle
        assertCanvasMethodCalled(mockCanvas, 'beginPath');
        assertCanvasMethodCalled(mockCanvas, 'arc');
        assertCanvasMethodCalled(mockCanvas, 'fill');
        expect(ctx.arc).toHaveBeenCalledWith(200, 200, 8, 0, Math.PI * 2);
      }
      
      if (hasTexture) {
        // If using texture rendering, should call drawImage
        assertCanvasMethodCalled(mockCanvas, 'drawImage');
      }
    });

    it('should render projectile', () => {
      const enemy = createTestEnemy({ position: { x: 300, y: 300 }, health: 50 });
      const projectile = createTestProjectile({ position: { x: 100, y: 100 }, target: enemy, damage: 10 });
      
      renderer.renderProjectile(projectile);
      
      const ctx = mockCanvas.getContext('2d');
      
      // Projectile should render either with texture or fallback (arc + fill)
      const hasTexture = ctx.drawImage.mock.calls.length > 0;
      const hasFallback = ctx.arc.mock.calls.length > 0;
      
      expect(hasTexture || hasFallback).toBe(true);
      
      if (hasFallback) {
        // If using fallback rendering, should draw circle
        assertCanvasMethodCalled(mockCanvas, 'beginPath');
        assertCanvasMethodCalled(mockCanvas, 'arc');
        assertCanvasMethodCalled(mockCanvas, 'fill');
        expect(ctx.arc).toHaveBeenCalledWith(100, 100, 3, 0, Math.PI * 2);
      }
      
      if (hasTexture) {
        // If using texture rendering, should call drawImage via renderTextureAt
        assertCanvasMethodCalled(mockCanvas, 'drawImage');
      }
    });

    it('should render multiple entities', () => {
      const tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      const enemy = createTestEnemy({ position: { x: 200, y: 200 }, health: 50 });
      const projectile = createTestProjectile({ position: { x: 150, y: 150 }, target: enemy, damage: 10 });
      
      renderer.renderEntities([tower], [enemy], [projectile], [], [], null);
      
      // Should render all entity types
      assertCanvasMethodCalled(mockCanvas, 'arc', 3);
      assertCanvasMethodCalled(mockCanvas, 'fill', 3);
    });
  });

  describe('health bars', () => {
    it('should render health bar for damaged entity', () => {
      const enemy = createTestEnemy({ position: { x: 200, y: 200 }, health: 100 });
      enemy.takeDamage(30); // 70/100 health
      
      renderer.renderHealthBar(enemy);
      
      // Should draw background and foreground bars
      assertCanvasMethodCalled(mockCanvas, 'fillRect', 2);
    });

    it('should not render health bar for full health entity', () => {
      const enemy = createTestEnemy({ position: { x: 200, y: 200 }, health: 100 });
      
      // Reset mocks to ensure clean state
      resetCanvasMocks(mockCanvas);
      
      renderer.renderHealthBar(enemy);
      
      // Should not draw health bar for full health
      assertCanvasMethodNotCalled(mockCanvas, 'fillRect');
    });
  });

  describe('range indicators', () => {
    it('should render tower range', () => {
      const tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      
      renderer.renderTowerRange(tower);
      
      const ctx = mockCanvas.getContext('2d');
      assertCanvasMethodCalled(mockCanvas, 'beginPath');
      assertCanvasMethodCalled(mockCanvas, 'arc');
      assertCanvasMethodCalled(mockCanvas, 'stroke');
      expect(ctx.arc).toHaveBeenCalledWith(100, 100, 100, 0, Math.PI * 2);
    });

    it('should use different styles for range indicator', () => {
      const tower = createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } });
      
      renderer.renderTowerRange(tower);
      
      assertCanvasMethodCalled(mockCanvas, 'setLineDash');
    });
  });

  describe('UI elements', () => {
    it('should render text', () => {
      renderer.renderText('Test Text', 100, 50, '#ffffff', '16px Arial');
      
      const ctx = mockCanvas.getContext('2d');
      expect(ctx.fillStyle).toBe('#ffffff');
      expect(ctx.font).toBe('16px Arial');
      assertCanvasMethodCalled(mockCanvas, 'fillText');
      expect(ctx.fillText).toHaveBeenCalledWith('Test Text', 100, 50);
    });

    it('should render centered text', () => {
      renderer.renderText('Centered', 400, 300, '#ffffff', '24px Arial', 'center');
      
      const ctx = mockCanvas.getContext('2d');
      expect(ctx.textAlign).toBe('center');
      assertCanvasMethodCalled(mockCanvas, 'fillText');
      expect(ctx.fillText).toHaveBeenCalledWith('Centered', 400, 300);
    });
  });

  describe('complete scene rendering', () => {
    it('should render complete game scene', () => {
      const towers = [createTestTower({ type: TowerType.BASIC, position: { x: 100, y: 100 } })];
      const enemies = [createTestEnemy({ position: { x: 200, y: 200 }, health: 50 })];
      const projectiles = [createTestProjectile({ position: { x: 150, y: 150 }, target: enemies[0], damage: 10 })];
      
      renderer.renderScene(towers, enemies, projectiles, [], [], null);
      
      // Should clear and render everything (uses fillRect for background)
      assertCanvasMethodCalled(mockCanvas, 'fillRect');
      assertCanvasMethodCalled(mockCanvas, 'beginPath');
      assertCanvasMethodCalled(mockCanvas, 'arc');
      assertCanvasMethodCalled(mockCanvas, 'fill');
    });

    it('should handle empty entity arrays', () => {
      renderer.renderScene([], [], [], [], [], null);
      
      // Should still clear and render grid (uses fillRect for background)
      assertCanvasMethodCalled(mockCanvas, 'fillRect');
    });
  });
});