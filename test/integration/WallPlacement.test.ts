import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game } from '../../src/core/Game';
import { TowerType } from '../../src/entities/Tower';
import { CellType } from '../../src/systems/Grid';
import { createMockCanvas } from '../helpers/canvas';
import { BiomeType, MapDifficulty } from '../../src/types/MapData';
import type { MapGenerationConfig } from '../../src/types/MapData';

describe('Wall Placement Integration', () => {
  let game: Game;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = createMockCanvas();
    
    const mapConfig: MapGenerationConfig = {
      width: 25,
      height: 19,
      cellSize: 32,
      biome: BiomeType.GRASSLAND,
      difficulty: MapDifficulty.EASY,
      seed: 'test'
    };
    
    game = new Game(canvas, mapConfig, false); // Don't auto-start
    game['currency'] = 100; // Give enough currency for testing
  });

  afterEach(() => {
    if (game) {
      game.stop();
    }
  });

  it('should place wall and mark cell as obstacle', () => {
    const worldPos = { x: 160, y: 160 };
    const gridPos = game['grid'].worldToGrid(worldPos);
    
    // Initially should be empty
    expect(game['grid'].getCellType(gridPos.x, gridPos.y)).toBe(CellType.EMPTY);
    
    // Place wall
    const placed = game.placeTower(TowerType.WALL, worldPos);
    expect(placed).toBe(true);
    
    // Verify grid is now obstacle
    expect(game['grid'].getCellType(gridPos.x, gridPos.y)).toBe(CellType.OBSTACLE);
    
    // Verify wall tower was created
    const walls = game['towers'].filter(t => t.towerType === TowerType.WALL);
    expect(walls.length).toBe(1);
    expect(walls[0].damage).toBe(0);
    expect(walls[0].range).toBe(0);
  });

  it('should prevent placing other towers on wall cells', () => {
    const worldPos = { x: 160, y: 160 };
    
    // Place wall
    game.placeTower(TowerType.WALL, worldPos);
    
    // Try to place basic tower at same position
    const placed = game.placeTower(TowerType.BASIC, worldPos);
    expect(placed).toBe(false);
  });

  it('should spend correct currency for walls', () => {
    const initialCurrency = game.getCurrency();
    const worldPos = { x: 160, y: 160 };
    
    game.placeTower(TowerType.WALL, worldPos);
    
    // Wall costs 10
    expect(game.getCurrency()).toBe(initialCurrency - 10);
  });

  it('should block enemy movement when wall is placed', () => {
    const worldPos = { x: 160, y: 160 };
    const gridPos = game['grid'].worldToGrid(worldPos);
    
    game.placeTower(TowerType.WALL, worldPos);
    
    // Verify cell is not walkable
    expect(game['grid'].isWalkable(gridPos.x, gridPos.y)).toBe(false);
    expect(game['grid'].isPassableForEnemies(gridPos.x, gridPos.y)).toBe(false);
  });

  it('should handle wall selection via keyboard', () => {
    // Set selected tower type to wall
    game.setSelectedTowerType(TowerType.WALL);
    
    expect(game['selectedTowerType']).toBe(TowerType.WALL);
  });

  it('should not allow placing walls on path cells', () => {
    // Find a path cell
    const pathCells = game['grid'].getCellsOfType(CellType.PATH);
    if (pathCells.length > 0) {
      const pathCell = pathCells[0];
      const worldPos = game['grid'].gridToWorld(pathCell.x, pathCell.y);
      
      const placed = game.placeTower(TowerType.WALL, worldPos);
      expect(placed).toBe(false);
    }
  });
});