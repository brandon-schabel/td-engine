import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { TowerType } from '../../src/entities/Tower';

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

describe('Tower Ghost System', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(mockCanvas);
  });

  describe('mouse position tracking', () => {
    it('should update mouse position on mouse move', () => {
      // Create mock mouse event object
      const mouseEvent = {
        type: 'mousemove',
        clientX: 100,
        clientY: 150,
        offsetX: 100,
        offsetY: 150
      } as MouseEvent;

      game.handleMouseMove(mouseEvent);
      
      // Verify mouse position is tracked (we can't directly access private mousePosition,
      // but we can verify the system doesn't throw errors)
      expect(() => game.handleMouseMove(mouseEvent)).not.toThrow();
    });
  });

  describe('tower selection for ghost preview', () => {
    it('should show ghost when tower type is selected', () => {
      game.setSelectedTowerType(TowerType.BASIC);
      
      expect(game.getSelectedTowerType()).toBe(TowerType.BASIC);
    });

    it('should clear ghost when tower type is deselected', () => {
      game.setSelectedTowerType(TowerType.BASIC);
      game.setSelectedTowerType(null);
      
      expect(game.getSelectedTowerType()).toBe(null);
    });

    it('should change ghost type when switching tower types', () => {
      game.setSelectedTowerType(TowerType.BASIC);
      expect(game.getSelectedTowerType()).toBe(TowerType.BASIC);
      
      game.setSelectedTowerType(TowerType.SNIPER);
      expect(game.getSelectedTowerType()).toBe(TowerType.SNIPER);
    });
  });

  describe('placement validation', () => {
    it('should allow placement on empty buildable tiles', () => {
      const validPosition = { x: 100, y: 100 }; // Should be buildable
      
      const canPlace = game.placeTower(TowerType.BASIC, validPosition);
      expect(canPlace).toBe(true);
    });

    it('should prevent placement on path tiles', () => {
      // The default path includes { x: 0, y: 9 } which maps to grid coordinates
      const pathWorldPos = { x: 16, y: 304 }; // Should be on the path
      
      const canPlace = game.placeTower(TowerType.BASIC, pathWorldPos);
      expect(canPlace).toBe(false);
    });

    it('should prevent placement when insufficient funds', () => {
      // Use all currency first
      const initialCurrency = game.getCurrency();
      const basicTowerCost = game.getTowerCost(TowerType.BASIC);
      
      // Place enough towers to drain currency
      const towersToPlace = Math.floor(initialCurrency / basicTowerCost);
      for (let i = 0; i < towersToPlace; i++) {
        game.placeTower(TowerType.BASIC, { x: 100 + i * 50, y: 100 });
      }
      
      // Should not be able to afford another tower
      expect(game.canAffordTower(TowerType.BASIC)).toBe(false);
    });
  });

  describe('ghost rendering integration', () => {
    it('should not crash when rendering with selected tower type', () => {
      game.setSelectedTowerType(TowerType.BASIC);
      
      // Simulate mouse movement
      const mouseEvent = {
        type: 'mousemove',
        clientX: 200,
        clientY: 200,
        offsetX: 200,
        offsetY: 200
      } as MouseEvent;
      
      game.handleMouseMove(mouseEvent);
      
      // Render should not throw errors
      expect(() => game.render(16)).not.toThrow();
    });

    it('should handle different tower types for ghost rendering', () => {
      const towerTypes = [TowerType.BASIC, TowerType.SNIPER, TowerType.RAPID];
      
      towerTypes.forEach(towerType => {
        game.setSelectedTowerType(towerType);
        expect(() => game.render(16)).not.toThrow();
      });
    });
  });

  describe('tower costs and affordability', () => {
    it('should correctly check tower affordability', () => {
      expect(game.canAffordTower(TowerType.BASIC)).toBe(true);
      expect(game.canAffordTower(TowerType.SNIPER)).toBe(true);
      expect(game.canAffordTower(TowerType.RAPID)).toBe(true);
    });

    it('should return correct tower costs', () => {
      expect(game.getTowerCost(TowerType.BASIC)).toBe(20);
      expect(game.getTowerCost(TowerType.SNIPER)).toBe(50);
      expect(game.getTowerCost(TowerType.RAPID)).toBe(30);
    });
  });
});