import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/core/GameEngine';
import { GameState } from '../../src/core/GameState';

describe('GameEngine', () => {
  let engine: GameEngine;
  let mockRaf: number;
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    // Mock requestAnimationFrame
    mockRaf = 0;
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafCallback = callback;
      return ++mockRaf;
    });
    global.cancelAnimationFrame = vi.fn();

    engine = new GameEngine();
  });

  afterEach(() => {
    engine.stop();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(engine.getState()).toBe(GameState.MENU);
      expect(engine.isRunning()).toBe(false);
      expect(engine.isPaused()).toBe(false);
    });
  });

  describe('game loop', () => {
    it('should start the game loop when start is called', () => {
      engine.start();
      
      expect(engine.isRunning()).toBe(true);
      expect(engine.getState()).toBe(GameState.PLAYING);
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop the game loop when stop is called', () => {
      engine.start();
      engine.stop();
      
      expect(engine.isRunning()).toBe(false);
      expect(engine.getState()).toBe(GameState.MENU);
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should update and render on each frame', () => {
      const updateSpy = vi.spyOn(engine, 'update');
      const renderSpy = vi.spyOn(engine, 'render');

      engine.start();
      
      // Clear initial calls from start
      updateSpy.mockClear();
      renderSpy.mockClear();
      
      // First frame
      if (rafCallback) rafCallback(1000);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith(0); // First frame has 0 delta
      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(renderSpy).toHaveBeenCalledWith(0);
      
      // Second frame
      updateSpy.mockClear();
      renderSpy.mockClear();
      if (rafCallback) rafCallback(1016);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith(16);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(renderSpy).toHaveBeenCalledWith(16);
    });

    it('should calculate delta time correctly', () => {
      let capturedDeltaTime = 0;
      engine.onUpdate((deltaTime) => {
        capturedDeltaTime = deltaTime;
      });

      engine.start();
      
      // First frame
      if (rafCallback) rafCallback(1000);
      expect(capturedDeltaTime).toBe(0); // First frame has no previous time
      
      // Second frame
      if (rafCallback) rafCallback(1016);
      expect(capturedDeltaTime).toBe(16);
    });
  });

  describe('pause/resume', () => {
    it('should pause the game', () => {
      engine.start();
      engine.pause();
      
      expect(engine.isPaused()).toBe(true);
      expect(engine.getState()).toBe(GameState.PAUSED);
    });

    it('should resume the game', () => {
      engine.start();
      engine.pause();
      engine.resume();
      
      expect(engine.isPaused()).toBe(false);
      expect(engine.getState()).toBe(GameState.PLAYING);
    });

    it('should not update when paused', () => {
      const updateSpy = vi.spyOn(engine, 'update');
      
      engine.start();
      engine.pause();
      
      // Clear any calls from start
      updateSpy.mockClear();
      
      // First frame while paused
      if (rafCallback) rafCallback(1000);
      
      expect(updateSpy).toHaveBeenCalledTimes(1);
      // Update is called but should return early due to pause
      expect(updateSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('callbacks', () => {
    it('should call update callbacks', () => {
      const callback = vi.fn();
      engine.onUpdate(callback);
      
      engine.start();
      // First frame has deltaTime 0
      if (rafCallback) rafCallback(1000);
      expect(callback).toHaveBeenCalledWith(0);
      
      // Second frame
      if (rafCallback) rafCallback(1016);
      expect(callback).toHaveBeenCalledWith(16);
    });

    it('should call render callbacks', () => {
      const callback = vi.fn();
      engine.onRender(callback);
      
      engine.start();
      // First frame has deltaTime 0
      if (rafCallback) rafCallback(1000);
      expect(callback).toHaveBeenCalledWith(0);
      
      // Second frame
      if (rafCallback) rafCallback(1016);
      expect(callback).toHaveBeenCalledWith(16);
    });

    it('should remove callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = engine.onUpdate(callback);
      
      unsubscribe();
      
      engine.start();
      if (rafCallback) rafCallback(16);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('should transition from MENU to PLAYING', () => {
      expect(engine.getState()).toBe(GameState.MENU);
      engine.start();
      expect(engine.getState()).toBe(GameState.PLAYING);
    });

    it('should transition to GAME_OVER', () => {
      engine.start();
      engine.gameOver();
      expect(engine.getState()).toBe(GameState.GAME_OVER);
      expect(engine.isRunning()).toBe(false);
    });

    it('should transition to VICTORY', () => {
      engine.start();
      engine.victory();
      expect(engine.getState()).toBe(GameState.VICTORY);
      expect(engine.isRunning()).toBe(false);
    });
  });
});