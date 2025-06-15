import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '@/core/GameEngine';
import { GameState } from '@/core/GameState';
import { describeSystem, when, then } from '../helpers/templates';
import { withTestContext } from '../helpers/setup';

describe('GameEngine', () => {
  const context = withTestContext();
  let engine: GameEngine;
  
  beforeEach(() => {
    engine = new GameEngine();
  });
  
  afterEach(() => {
    engine.stop();
  });
  
  describe('initialization', () => {
    it('initializes with default state', () => {
      expect(engine.getState()).toBe(GameState.MENU);
      expect(engine.isRunning()).toBe(false);
      expect(engine.isPaused()).toBe(false);
    });
  });
  
  describe('game loop', () => {
    it(when('starting the game'), () => {
      engine.start();
      
      expect(engine.isRunning()).toBe(true);
      expect(engine.getState()).toBe(GameState.PLAYING);
    });
    
    it(when('stopping the game'), () => {
      engine.start();
      engine.stop();
      
      expect(engine.isRunning()).toBe(false);
      expect(engine.getState()).toBe(GameState.MENU);
    });
    
    it('updates and renders each frame', () => {
      const onUpdate = vi.fn();
      const onRender = vi.fn();
      
      engine.onUpdate(onUpdate);
      engine.onRender(onRender);
      engine.start();
      
      // Get initial call count
      const initialUpdateCalls = onUpdate.mock.calls.length;
      const initialRenderCalls = onRender.mock.calls.length;
      
      // Manually call the game loop
      const engineAny = engine as any;
      engineAny.gameLoop(performance.now() + 16);
      
      expect(onUpdate).toHaveBeenCalledTimes(initialUpdateCalls + 1);
      expect(onRender).toHaveBeenCalledTimes(initialRenderCalls + 1);
    });
    
    it('calculates delta time correctly', () => {
      let capturedDeltaTime = 0;
      engine.onUpdate((deltaTime) => {
        capturedDeltaTime = deltaTime;
      });
      
      engine.start();
      
      // Set a known lastTime and call with a future time
      const engineAny = engine as any;
      engineAny.lastTime = 1000;
      engineAny.gameLoop(1016);
      
      expect(capturedDeltaTime).toBe(16);
    });
  });
  
  describe('pause/resume', () => {
    it(when('pausing the game'), () => {
      engine.start();
      engine.pause();
      
      expect(engine.isPaused()).toBe(true);
      expect(engine.getState()).toBe(GameState.PAUSED);
    });
    
    it(when('resuming the game'), () => {
      engine.start();
      engine.pause();
      engine.resume();
      
      expect(engine.isPaused()).toBe(false);
      expect(engine.getState()).toBe(GameState.PLAYING);
    });
    
    it(then('updates are skipped when paused'), () => {
      const onUpdate = vi.fn();
      engine.onUpdate(onUpdate);
      
      engine.start();
      engine.pause();
      
      onUpdate.mockClear();
      
      // Manually trigger game loop while paused
      const engineAny = engine as any;
      engineAny.gameLoop(16);
      
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });
  
  describe('callbacks', () => {
    it('calls update callbacks with delta time', () => {
      const callback = vi.fn();
      engine.onUpdate(callback);
      
      engine.start();
      callback.mockClear(); // Clear any startup calls
      
      const engineAny = engine as any;
      engineAny.lastTime = 1000;
      engineAny.gameLoop(1016);
      
      expect(callback).toHaveBeenCalledWith(16);
    });
    
    it('calls render callbacks', () => {
      const callback = vi.fn();
      engine.onRender(callback);
      
      engine.start();
      
      const engineAny = engine as any;
      engineAny.gameLoop(16);
      
      expect(callback).toHaveBeenCalled();
    });
    
    it('removes callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = engine.onUpdate(callback);
      
      unsubscribe();
      
      engine.start();
      const engineAny = engine as any;
      engineAny.gameLoop(16);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('state transitions', () => {
    it('transitions MENU → PLAYING', () => {
      expect(engine.getState()).toBe(GameState.MENU);
      engine.start();
      expect(engine.getState()).toBe(GameState.PLAYING);
    });
    
    it('transitions to GAME_OVER', () => {
      engine.start();
      engine.gameOver();
      expect(engine.getState()).toBe(GameState.GAME_OVER);
      expect(engine.isRunning()).toBe(false);
    });
    
    it('transitions to VICTORY', () => {
      engine.start();
      engine.victory();
      expect(engine.getState()).toBe(GameState.VICTORY);
      expect(engine.isRunning()).toBe(false);
    });
  });
});