import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { GameState } from '../../src/core/GameState';

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

describe('Game Pause/Resume', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(mockCanvas);
  });

  describe('pause functionality', () => {
    it('should start in playing state', () => {
      expect(game.isPaused()).toBe(false);
    });

    it('should pause when pause is called', () => {
      game.pause();
      expect(game.isPaused()).toBe(true);
    });

    it('should resume when resume is called', () => {
      game.pause();
      expect(game.isPaused()).toBe(true);
      
      game.resume();
      expect(game.isPaused()).toBe(false);
    });

    it('should toggle pause state correctly', () => {
      // Initially not paused
      expect(game.isPaused()).toBe(false);
      
      // Pause
      game.pause();
      expect(game.isPaused()).toBe(true);
      
      // Resume
      game.resume();
      expect(game.isPaused()).toBe(false);
      
      // Pause again
      game.pause();
      expect(game.isPaused()).toBe(true);
    });

    it('should not double-pause', () => {
      game.pause();
      expect(game.isPaused()).toBe(true);
      
      // Try to pause again
      game.pause();
      expect(game.isPaused()).toBe(true);
    });

    it('should not resume when not paused', () => {
      expect(game.isPaused()).toBe(false);
      
      // Try to resume when not paused
      game.resume();
      expect(game.isPaused()).toBe(false);
    });

    it('should render different states correctly', () => {
      const renderSpy = vi.spyOn(game, 'render' as any);
      
      // Mock the engine to return different states
      const mockEngine = game['engine'];
      vi.spyOn(mockEngine, 'getState');
      
      // Test PLAYING state
      mockEngine.getState = vi.fn().mockReturnValue(GameState.PLAYING);
      game.render(16);
      
      // Test PAUSED state  
      mockEngine.getState = vi.fn().mockReturnValue(GameState.PAUSED);
      game.render(16);
      
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('game engine integration', () => {
    it('should expose pause state from engine', () => {
      const engine = game['engine'];
      
      expect(game.isPaused()).toBe(engine.isPaused());
      
      game.pause();
      expect(game.isPaused()).toBe(engine.isPaused());
      
      game.resume();
      expect(game.isPaused()).toBe(engine.isPaused());
    });
  });
});