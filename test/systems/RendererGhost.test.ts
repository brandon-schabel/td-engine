import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '../../src/systems/Renderer';
import { Grid } from '../../src/systems/Grid';
import { Camera } from '../../src/systems/Camera';
import { TowerType } from '../../src/entities/Tower';

// Mock canvas context
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

// Mock camera
const mockCamera = {
  worldToScreen: vi.fn((pos) => pos), // Identity transform by default
  screenToWorld: vi.fn((pos) => pos), // Identity transform by default
  isVisible: vi.fn(() => true), // Everything visible by default
  getVisibleBounds: vi.fn(() => ({
    min: { x: 0, y: 0 },
    max: { x: 800, y: 608 }
  })),
  update: vi.fn(),
  getPosition: vi.fn(() => ({ x: 0, y: 0 })),
  setPosition: vi.fn()
} as any;

describe('Renderer Ghost System', () => {
  let renderer: Renderer;
  let grid: Grid;
  let camera: Camera;

  beforeEach(() => {
    vi.clearAllMocks();
    grid = new Grid(25, 19, 32);
    camera = new Camera(800, 608, 800, 608);
    renderer = new Renderer(mockCanvas, grid, camera);
  });

  describe('renderTowerGhost', () => {
    it('should render ghost tower with valid placement styling', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;

      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Verify basic rendering calls
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should render ghost tower with invalid placement styling', () => {
      const position = { x: 100, y: 100 };
      const canPlace = false;

      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Verify rendering calls for invalid placement
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should render different tower types correctly', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;

      // Test all tower types
      const towerTypes = [TowerType.BASIC, TowerType.SNIPER, TowerType.RAPID];

      towerTypes.forEach(towerType => {
        vi.clearAllMocks();
        
        renderer.renderTowerGhost(towerType, position, canPlace);

        // Each tower type should render
        expect(mockContext.save).toHaveBeenCalled();
        expect(mockContext.restore).toHaveBeenCalled();
        expect(mockContext.arc).toHaveBeenCalled();
        expect(mockContext.fill).toHaveBeenCalled();
        expect(mockContext.stroke).toHaveBeenCalled();
      });
    });

    it('should set transparency for ghost effect', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;
      
      // Mock the globalAlpha setter
      const mockAlphaSetter = vi.fn();
      Object.defineProperty(mockContext, 'globalAlpha', {
        set: mockAlphaSetter,
        configurable: true
      });

      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Should set alpha for transparency
      expect(mockAlphaSetter).toHaveBeenCalledWith(0.6);
    });

    it('should render range preview with dashed line', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;

      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Should set line dash for range preview
      expect(mockContext.setLineDash).toHaveBeenCalledWith([3, 3]);
      expect(mockContext.setLineDash).toHaveBeenCalledWith([]); // Reset
    });

    it('should handle edge positions without crashing', () => {
      const edgePositions = [
        { x: 0, y: 0 },
        { x: 800, y: 608 },
        { x: -10, y: -10 },
        { x: 850, y: 650 }
      ];

      edgePositions.forEach(position => {
        expect(() => {
          renderer.renderTowerGhost(TowerType.BASIC, position, true);
        }).not.toThrow();
      });
    });

    it('should restore context state properly', () => {
      const position = { x: 100, y: 100 };

      renderer.renderTowerGhost(TowerType.BASIC, position, true);

      // Should save at start and restore at end
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      
      // Verify save was called before restore
      const saveCall = mockContext.save.mock.invocationCallOrder?.[0];
      const restoreCall = mockContext.restore.mock.invocationCallOrder?.[0];
      if (saveCall !== undefined && restoreCall !== undefined) {
        expect(saveCall).toBeLessThan(restoreCall);
      }
    });
  });

  describe('ghost integration with existing rendering', () => {
    it('should not interfere with normal tower rendering', () => {
      const position = { x: 100, y: 100 };

      // Render ghost
      renderer.renderTowerGhost(TowerType.BASIC, position, true);

      // Context should be properly restored
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should handle multiple ghost renders in sequence', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 }
      ];

      positions.forEach(position => {
        expect(() => {
          renderer.renderTowerGhost(TowerType.BASIC, position, true);
        }).not.toThrow();
      });

      // Should have called save/restore for each render
      expect(mockContext.save).toHaveBeenCalledTimes(3);
      expect(mockContext.restore).toHaveBeenCalledTimes(3);
    });
  });
});