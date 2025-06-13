import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '@/core/GameEngine';
import { GameState } from '@/core/GameState';
import { TimeController, mockGameEngineCallbacks } from '../helpers';

describe('GameEngine', () => {
  let engine: GameEngine;
  let timeController: TimeController;

  beforeEach(() => {
    timeController = new TimeController();
    engine = new GameEngine();
  });

  afterEach(() => {
    engine.stop();
    timeController.reset();
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
      expect(timeController.mocked.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop the game loop when stop is called', () => {
      engine.start();
      engine.stop();
      
      expect(engine.isRunning()).toBe(false);
      expect(engine.getState()).toBe(GameState.MENU);
      expect(timeController.mocked.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should update and render on each frame', () => {
      const { onUpdate, onRender } = mockGameEngineCallbacks(engine);

      engine.start();
      
      // Clear any calls from start() which might trigger an initial update
      onUpdate.mockClear();
      onRender.mockClear();
      
      // First frame
      timeController.nextFrame();
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onRender).toHaveBeenCalledTimes(1);
      
      // Second frame
      onUpdate.mockClear();
      onRender.mockClear();
      timeController.nextFrame(16);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onRender).toHaveBeenCalledTimes(1);
    });

    it('should calculate delta time correctly', () => {
      let capturedDeltaTime = 0;
      engine.onUpdate((deltaTime) => {
        capturedDeltaTime = deltaTime;
      });

      engine.start();
      
      // First frame
      timeController.nextFrame();
      expect(capturedDeltaTime).toBe(0); // First frame has no previous time
      
      // Second frame
      timeController.nextFrame(16);
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
      const { onUpdate } = mockGameEngineCallbacks(engine);
      
      engine.start();
      engine.pause();
      
      // Clear any calls from start
      onUpdate.mockClear();
      
      // First frame while paused
      timeController.nextFrame();
      
      // Update callback should not be called when paused
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call update callbacks', () => {
      const callback = vi.fn();
      engine.onUpdate(callback);
      
      engine.start();
      // First frame has deltaTime 0
      timeController.nextFrame();
      expect(callback).toHaveBeenCalledWith(0);
      
      // Second frame
      timeController.nextFrame(16);
      expect(callback).toHaveBeenCalledWith(16);
    });

    it('should call render callbacks', () => {
      const callback = vi.fn();
      engine.onRender(callback);
      
      engine.start();
      // First frame has deltaTime 0
      timeController.nextFrame();
      expect(callback).toHaveBeenCalledWith(0);
      
      // Second frame
      timeController.nextFrame(16);
      expect(callback).toHaveBeenCalledWith(16);
    });

    it('should remove callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = engine.onUpdate(callback);
      
      unsubscribe();
      
      engine.start();
      timeController.nextFrame();
      
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