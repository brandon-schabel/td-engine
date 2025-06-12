import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '../../src/systems/Renderer';
import { Tower, TowerType } from '../../src/entities/Tower';
import { Enemy, EnemyType } from '../../src/entities/Enemy';
import { Projectile } from '../../src/entities/Projectile';
import { Grid, CellType } from '../../src/systems/Grid';
import { Camera } from '../../src/systems/Camera';

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn()
} as any;

const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  arc: vi.fn(),
  beginPath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fillText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: ''
} as any;

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

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas.getContext.mockReturnValue(mockContext);
    
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
      mockCanvas.getContext.mockReturnValue(null);
      
      expect(() => new Renderer(mockCanvas, grid, camera)).toThrow('Could not get 2D context');
    });
  });

  describe('clearing and setup', () => {
    it('should clear the canvas', () => {
      renderer.clear();
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should set background color and clear', () => {
      renderer.clear('#1a1a1a');
      
      expect(mockContext.fillStyle).toBe('#1a1a1a');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  describe('grid rendering', () => {
    it('should render empty grid', () => {
      renderer.renderGrid();
      
      // Should draw grid lines
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should render path cells differently', () => {
      grid.setPath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      
      renderer.renderGrid();
      
      // Should fill path cells
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should render blocked cells', () => {
      grid.setCellType(5, 5, CellType.BLOCKED);
      
      renderer.renderGrid();
      
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('entity rendering', () => {
    it('should render tower', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      renderer.renderTower(tower);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(100, 100, 15, 0, Math.PI * 2);
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should render enemy', () => {
      const enemy = new Enemy({ x: 200, y: 200 }, 50);
      
      renderer.renderEnemy(enemy);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(200, 200, 8, 0, Math.PI * 2);
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should render projectile', () => {
      const enemy = new Enemy({ x: 300, y: 300 }, 50);
      const projectile = new Projectile({ x: 100, y: 100 }, enemy, 10);
      
      renderer.renderProjectile(projectile);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(100, 100, 3, 0, Math.PI * 2);
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should render multiple entities', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const enemy = new Enemy({ x: 200, y: 200 }, 50);
      const projectile = new Projectile({ x: 150, y: 150 }, enemy, 10);
      
      renderer.renderEntities([tower], [enemy], [projectile], [], [], null);
      
      // Should render all entity types
      expect(mockContext.arc).toHaveBeenCalledTimes(3);
      expect(mockContext.fill).toHaveBeenCalledTimes(3);
    });
  });

  describe('health bars', () => {
    it('should render health bar for damaged entity', () => {
      const enemy = new Enemy({ x: 200, y: 200 }, 100);
      enemy.takeDamage(30); // 70/100 health
      
      renderer.renderHealthBar(enemy);
      
      // Should draw background and foreground bars
      expect(mockContext.fillRect).toHaveBeenCalledTimes(2);
    });

    it('should not render health bar for full health entity', () => {
      const enemy = new Enemy({ x: 200, y: 200 }, 100);
      
      renderer.renderHealthBar(enemy);
      
      // Should not draw health bar for full health
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('range indicators', () => {
    it('should render tower range', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      renderer.renderTowerRange(tower);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(100, 100, 100, 0, Math.PI * 2);
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should use different styles for range indicator', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      
      renderer.renderTowerRange(tower);
      
      expect(mockContext.setLineDash).toHaveBeenCalled();
    });
  });

  describe('UI elements', () => {
    it('should render text', () => {
      renderer.renderText('Test Text', 100, 50, '#ffffff', '16px Arial');
      
      expect(mockContext.fillStyle).toBe('#ffffff');
      expect(mockContext.font).toBe('16px Arial');
      expect(mockContext.fillText).toHaveBeenCalledWith('Test Text', 100, 50);
    });

    it('should render centered text', () => {
      renderer.renderText('Centered', 400, 300, '#ffffff', '24px Arial', 'center');
      
      expect(mockContext.textAlign).toBe('center');
      expect(mockContext.fillText).toHaveBeenCalledWith('Centered', 400, 300);
    });
  });

  describe('complete scene rendering', () => {
    it('should render complete game scene', () => {
      const towers = [new Tower(TowerType.BASIC, { x: 100, y: 100 })];
      const enemies = [new Enemy({ x: 200, y: 200 }, 50)];
      const projectiles = [new Projectile({ x: 150, y: 150 }, enemies[0], 10)];
      
      renderer.renderScene(towers, enemies, projectiles, [], [], null);
      
      // Should clear and render everything (uses fillRect for background)
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should handle empty entity arrays', () => {
      renderer.renderScene([], [], [], [], [], null);
      
      // Should still clear and render grid (uses fillRect for background)
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
});