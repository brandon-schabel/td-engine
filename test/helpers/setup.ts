import { vi, beforeEach, afterEach, expect } from 'vitest';
import { TimeController } from './time';
import { createMockCanvas } from './canvas';
import type { MockedCanvas } from './canvas';

interface TestContext {
  timeController: TimeController;
  canvas: MockedCanvas;
  cleanup: () => void;
}

let globalSetupDone = false;

/**
 * One-time global test environment setup
 * Call this once at the beginning of test files
 */
export function setupTestEnvironment(): void {
  if (globalSetupDone) return;
  
  // Mock global objects
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));
  
  // Mock AudioContext
  global.AudioContext = vi.fn(() => ({
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 1, setValueAtTime: vi.fn() }
    })),
    createBufferSource: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      buffer: null,
      playbackRate: { value: 1 }
    })),
    createBuffer: vi.fn(),
    decodeAudioData: vi.fn(),
    destination: {},
    currentTime: 0
  })) as any;
  
  // Mock fetch for assets
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    } as Response)
  );
  
  // Mock Image for texture loading
  global.Image = vi.fn(() => ({
    src: '',
    onload: null,
    onerror: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })) as any;
  
  globalSetupDone = true;
}

/**
 * Creates a test context with automatic setup/teardown
 * Use this in describe blocks for consistent test environment
 */
export function withTestContext(): TestContext {
  const context: TestContext = {
    timeController: new TimeController(),
    canvas: createMockCanvas(),
    cleanup: () => {}
  };
  
  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();
    context.timeController.reset();
    context.canvas = createMockCanvas();
  });
  
  afterEach(() => {
    context.timeController.reset();
    vi.clearAllMocks();
    if (context.cleanup) {
      context.cleanup();
    }
  });
  
  return context;
}

/**
 * Quick game state presets for common test scenarios
 */
export const GameStatePresets = {
  EMPTY: {
    currency: 100,
    lives: 20,
    score: 0,
    wave: 0
  },
  MID_GAME: {
    currency: 500,
    lives: 15,
    score: 1000,
    wave: 5
  },
  LATE_GAME: {
    currency: 2000,
    lives: 5,
    score: 10000,
    wave: 15
  },
  NEAR_DEFEAT: {
    currency: 50,
    lives: 1,
    score: 500,
    wave: 3
  },
  RICH: {
    currency: 10000,
    lives: 20,
    score: 50000,
    wave: 0
  }
} as const;

/**
 * Creates a game with a specific preset state
 */
export function createGameWithState(preset: keyof typeof GameStatePresets) {
  const { GameScenarioBuilder } = require('./builders');
  const state = GameStatePresets[preset];
  
  return new GameScenarioBuilder()
    .withCurrency(state.currency)
    .withLives(state.lives)
    .withScore(state.score)
    .withWave(state.wave)
    .build();
}

/**
 * Composite assertion helper for game state
 */
export function assertGameState(game: any, expected: Partial<typeof GameStatePresets.EMPTY>) {
  if (expected.currency !== undefined) {
    expect(game.getCurrency()).toBe(expected.currency);
  }
  if (expected.lives !== undefined) {
    expect(game.getLives()).toBe(expected.lives);
  }
  if (expected.score !== undefined) {
    expect(game.getScore()).toBe(expected.score);
  }
  if (expected.wave !== undefined) {
    expect(game.getCurrentWave()).toBe(expected.wave);
  }
}

/**
 * Quick scenario creators for common test patterns
 */
export const TestScenarios = {
  /**
   * Create a game with enemies in combat
   */
  withCombat: (enemyCount = 5) => {
    const { GameScenarioBuilder } = require('./builders');
    const { EnemyBuilder } = require('./builders');
    
    const game = new GameScenarioBuilder()
      .withCurrency(500)
      .build();
    
    // Add enemies using the proper API
    const gameAny = game as any;
    for (let i = 0; i < enemyCount; i++) {
      const enemy = new EnemyBuilder()
        .at(100 + i * 50, 100)
        .withHealth(50)
        .build();
      gameAny.enemies.push(enemy);
    }
    
    return game;
  },
  
  /**
   * Create a game with towers placed
   */
  withTowers: (towerPositions: Array<{x: number, y: number, type?: string}>) => {
    const { GameScenarioBuilder } = require('./builders');
    
    const game = new GameScenarioBuilder()
      .withCurrency(1000)
      .build();
    
    towerPositions.forEach(pos => {
      game.placeTower(pos.type || 'BASIC', { x: pos.x, y: pos.y });
    });
    
    return game;
  },
  
  /**
   * Create a game ready for boss wave
   */
  bossWave: () => {
    const { GameScenarioBuilder } = require('./builders');
    
    return new GameScenarioBuilder()
      .withCurrency(3000)
      .withLives(10)
      .withScore(20000)
      .withWave(9) // Wave 10 is typically boss
      .build();
  }
};

/**
 * Async helper for waiting specific game ticks
 */
export async function waitGameTicks(game: any, ticks: number): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    game.update(16); // ~60fps
    // Yield to event loop to prevent hanging
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Helper to run a test with specific Math.random values
 */
export function withRandomValues(values: number[], testFn: () => void): void {
  const originalRandom = Math.random;
  let index = 0;
  
  Math.random = vi.fn(() => {
    const value = values[index % values.length];
    index++;
    return value;
  });
  
  try {
    testFn();
  } finally {
    Math.random = originalRandom;
  }
}