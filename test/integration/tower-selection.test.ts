/**
 * Integration test for tower selection and info dialog functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '@/core/Game';
import { TowerType, Tower } from '@/entities/Tower';
import { TOWER_UPGRADES } from '@/config/TowerConfig';
import { createMockCanvas } from '../helpers/CanvasTestHelper';

describe('Tower Selection and Info Dialog', () => {
  let game: Game;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create a mock canvas using test helper
    canvas = createMockCanvas();
    
    // Create game instance
    game = new Game(canvas, undefined, false);
  });

  describe('Tower Methods', () => {
    it('should have getMaxUpgradeLevel method', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      expect(tower.getMaxUpgradeLevel).toBeDefined();
      expect(tower.getMaxUpgradeLevel()).toBe(TOWER_UPGRADES.maxLevel);
    });
  });

  describe('Tower Selection', () => {
    it('should select tower when clicked', () => {
      // Place a tower
      const towerPos = { x: 100, y: 100 };
      game.placeTower(TowerType.BASIC, towerPos);
      
      const towers = game.getTowers();
      expect(towers.length).toBe(1);
      
      const tower = towers[0];
      
      // Select the tower
      game.selectTower(tower);
      expect(game.getSelectedTower()).toBe(tower);
      expect(game.isTowerSelected(tower)).toBe(true);
    });

    it('should deselect tower', () => {
      // Place and select a tower
      const towerPos = { x: 100, y: 100 };
      game.placeTower(TowerType.BASIC, towerPos);
      const tower = game.getTowers()[0];
      game.selectTower(tower);
      
      // Deselect
      game.deselectTower();
      expect(game.getSelectedTower()).toBeNull();
      expect(game.isTowerSelected(tower)).toBe(false);
    });

    it('should dispatch events on selection/deselection', () => {
      let selectedEvent = false;
      let deselectedEvent = false;
      
      const handleSelected = () => {
        selectedEvent = true;
      };
      
      const handleDeselected = () => {
        deselectedEvent = true;
      };
      
      // Mock document event listeners
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const dispatchEventSpy = vi.spyOn(document, 'dispatchEvent');
      
      document.addEventListener('towerSelected', handleSelected);
      document.addEventListener('towerDeselected', handleDeselected);
      
      // Place and select a tower
      const towerPos = { x: 100, y: 100 };
      game.placeTower(TowerType.BASIC, towerPos);
      const tower = game.getTowers()[0];
      
      game.selectTower(tower);
      
      // Check that event was dispatched
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'towerSelected',
          detail: expect.objectContaining({ tower })
        })
      );
      
      game.deselectTower();
      
      // Check that deselect event was dispatched
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'towerDeselected',
          detail: expect.objectContaining({ tower })
        })
      );
      
      // Clean up
      document.removeEventListener('towerSelected', handleSelected);
      document.removeEventListener('towerDeselected', handleDeselected);
      addEventListenerSpy.mockRestore();
      dispatchEventSpy.mockRestore();
    });
  });

  describe('Tower Selling', () => {
    it('should sell tower and refund currency', () => {
      // Set initial currency
      game.setCurrency(100);
      
      // Place a tower
      const towerPos = { x: 100, y: 100 };
      game.placeTower(TowerType.BASIC, towerPos);
      
      const tower = game.getTowers()[0];
      const sellValue = tower.getSellValue();
      const currencyBefore = game.getCurrency();
      
      // Sell the tower
      const result = game.sellTower(tower);
      
      expect(result).toBe(true);
      expect(game.getTowers().length).toBe(0);
      expect(game.getCurrency()).toBe(currencyBefore + sellValue);
    });

    it('should clear selection when selling selected tower', () => {
      // Set initial currency
      game.setCurrency(100);
      
      // Place and select a tower
      const towerPos = { x: 100, y: 100 };
      game.placeTower(TowerType.BASIC, towerPos);
      const tower = game.getTowers()[0];
      game.selectTower(tower);
      
      // Sell the tower
      game.sellTower(tower);
      
      expect(game.getSelectedTower()).toBeNull();
    });

    it('should return false when selling non-existent tower', () => {
      const fakeTower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
      const result = game.sellTower(fakeTower);
      expect(result).toBe(false);
    });

    it('should clear grid cell when selling tower', () => {
      // Set initial currency
      game.setCurrency(100);
      
      // Place a tower
      const towerPos = { x: 100, y: 100 };
      game.placeTower(TowerType.BASIC, towerPos);
      
      const grid = game.getGrid();
      const gridPos = grid.worldToGrid(towerPos);
      
      // Verify tower is placed
      expect(grid.getCellType(gridPos.x, gridPos.y)).not.toBe(0); // Not EMPTY
      
      // Sell the tower
      const tower = game.getTowers()[0];
      game.sellTower(tower);
      
      // Verify grid cell is cleared
      expect(grid.getCellType(gridPos.x, gridPos.y)).toBe(0); // EMPTY
    });
  });
});