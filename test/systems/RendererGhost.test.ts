import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '@/systems/Renderer';
import { Grid } from '@/systems/Grid';
import { Camera } from '@/systems/Camera';
import { TowerType } from '@/entities/Tower';
import { createMockCanvas, assertCanvasMethodCalled, resetCanvasMocks } from '../helpers';

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
  let mockCanvas: ReturnType<typeof createMockCanvas>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas = createMockCanvas(800, 608);
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
      assertCanvasMethodCalled(mockCanvas, 'save');
      assertCanvasMethodCalled(mockCanvas, 'restore');
      assertCanvasMethodCalled(mockCanvas, 'beginPath');
      assertCanvasMethodCalled(mockCanvas, 'arc');
      assertCanvasMethodCalled(mockCanvas, 'fill');
      assertCanvasMethodCalled(mockCanvas, 'stroke');
    });

    it('should render ghost tower with invalid placement styling', () => {
      const position = { x: 100, y: 100 };
      const canPlace = false;

      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Verify rendering calls for invalid placement
      assertCanvasMethodCalled(mockCanvas, 'save');
      assertCanvasMethodCalled(mockCanvas, 'restore');
      assertCanvasMethodCalled(mockCanvas, 'beginPath');
      assertCanvasMethodCalled(mockCanvas, 'arc');
      assertCanvasMethodCalled(mockCanvas, 'fill');
      assertCanvasMethodCalled(mockCanvas, 'stroke');
    });

    it('should render different tower types correctly', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;

      // Test all tower types
      const towerTypes = [TowerType.BASIC, TowerType.SNIPER, TowerType.RAPID];

      towerTypes.forEach(towerType => {
        resetCanvasMocks(mockCanvas);
        
        renderer.renderTowerGhost(towerType, position, canPlace);

        // Each tower type should render
        assertCanvasMethodCalled(mockCanvas, 'save');
        assertCanvasMethodCalled(mockCanvas, 'restore');
        assertCanvasMethodCalled(mockCanvas, 'arc');
        assertCanvasMethodCalled(mockCanvas, 'fill');
        assertCanvasMethodCalled(mockCanvas, 'stroke');
      });
    });

    it('should set transparency for ghost effect', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;
      
      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Should set alpha for transparency
      const ctx = mockCanvas.getContext('2d');
      expect(ctx.globalAlpha).toBe(0.6);
    });

    it('should render range preview with dashed line', () => {
      const position = { x: 100, y: 100 };
      const canPlace = true;

      renderer.renderTowerGhost(TowerType.BASIC, position, canPlace);

      // Should set line dash for range preview
      const ctx = mockCanvas.getContext('2d');
      expect(ctx.setLineDash).toHaveBeenCalledWith([3, 3]);
      expect(ctx.setLineDash).toHaveBeenCalledWith([]); // Reset
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
      assertCanvasMethodCalled(mockCanvas, 'save');
      assertCanvasMethodCalled(mockCanvas, 'restore');
      
      // Verify save was called before restore
      const ctx = mockCanvas.getContext('2d');
      const saveCall = ctx.save.mock.invocationCallOrder?.[0];
      const restoreCall = ctx.restore.mock.invocationCallOrder?.[0];
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
      assertCanvasMethodCalled(mockCanvas, 'save');
      assertCanvasMethodCalled(mockCanvas, 'restore');
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
      assertCanvasMethodCalled(mockCanvas, 'save', 3);
      assertCanvasMethodCalled(mockCanvas, 'restore', 3);
    });
  });
});