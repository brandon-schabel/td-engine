import { vi } from "vitest";
import { Game } from "@/core/Game";
import { Entity } from "@/entities/Entity";
import { TimeController } from "./time";
import type { GameState } from "@/core/GameState";

export interface AsyncTestOptions {
  timeout?: number;
  pollInterval?: number;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  options: AsyncTestOptions = {}
): Promise<void> {
  const { timeout = 5000, pollInterval = 10 } = options;
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

/**
 * Wait for a specific game state
 */
export async function waitForGameState(
  game: Game,
  state: GameState,
  options: AsyncTestOptions = {}
): Promise<void> {
  const gameAny = game as any;
  await waitFor(() => gameAny.engine.getState() === state, options);
}

/**
 * Wait for entities to spawn
 */
export async function waitForEntities<T extends Entity>(
  getEntities: () => T[],
  count: number,
  options: AsyncTestOptions = {}
): Promise<T[]> {
  await waitFor(() => getEntities().length >= count, options);
  return getEntities();
}

/**
 * Wait for an entity to reach a position
 */
export async function waitForPosition(
  entity: Entity,
  targetX: number,
  targetY: number,
  tolerance = 5,
  options: AsyncTestOptions = {}
): Promise<void> {
  await waitFor(() => {
    const dx = Math.abs(entity.position.x - targetX);
    const dy = Math.abs(entity.position.y - targetY);
    return dx <= tolerance && dy <= tolerance;
  }, options);
}

/**
 * Wait for an entity to die
 */
export async function waitForDeath(
  entity: Entity,
  options: AsyncTestOptions = {}
): Promise<void> {
  await waitFor(() => !entity.isAlive, options);
}

/**
 * Wait for a callback to be called
 */
export async function waitForCallback(
  callback: ReturnType<typeof vi.fn>,
  options: AsyncTestOptions = {}
): Promise<void> {
  await waitFor(() => callback.mock.calls.length > 0, options);
}

/**
 * Wait for a callback to be called N times
 */
export async function waitForCallCount(
  callback: ReturnType<typeof vi.fn>,
  count: number,
  options: AsyncTestOptions = {}
): Promise<void> {
  await waitFor(() => callback.mock.calls.length >= count, options);
}

/**
 * Simulate game updates until a condition is met
 */
export async function simulateUntil(
  game: Game,
  condition: () => boolean,
  options: { maxFrames?: number; deltaTime?: number } = {}
): Promise<number> {
  const { maxFrames = 1000, deltaTime = 16 } = options;
  let frames = 0;

  while (!condition() && frames < maxFrames) {
    game.update(deltaTime);
    frames++;

    // Yield to event loop periodically
    if (frames % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (!condition()) {
    throw new Error(`Condition not met after ${frames} frames`);
  }

  return frames;
}

/**
 * Run game simulation with time control
 */
export class AsyncGameSimulator {
  private timeController: TimeController;

  constructor(private game: Game) {
    this.timeController = new TimeController();
  }

  /**
   * Simulate game for a specific duration
   */
  async simulateTime(milliseconds: number, frameTime = 16): Promise<void> {
    const frames = Math.ceil(milliseconds / frameTime);

    for (let i = 0; i < frames; i++) {
      this.timeController.advance(frameTime);
      this.game.update(frameTime);

      // Yield to event loop every 10 frames
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Simulate until wave completes
   */
  async simulateWave(waveNumber: number): Promise<void> {
    const gameAny = this.game as any;

    // Start the wave if needed
    if (gameAny.waveManager.currentWave < waveNumber) {
      this.game.startNextWave();
    }

    // Wait for wave to complete
    await this.simulateUntil(
      () => !gameAny.waveManager.isWaveActive() && gameAny.enemies.length === 0
    );
  }

  /**
   * Simulate until a certain score is reached
   */
  async simulateToScore(targetScore: number): Promise<void> {
    const gameAny = this.game as any;
    await this.simulateUntil(() => gameAny.score >= targetScore);
  }

  /**
   * Simulate with condition
   */
  async simulateUntil(
    condition: () => boolean,
    options: { timeout?: number; frameTime?: number } = {}
  ): Promise<void> {
    const { timeout = 10000, frameTime = 16 } = options;
    const startTime = Date.now();

    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Simulation timeout after ${timeout}ms`);
      }

      this.timeController.advance(frameTime);
      this.game.update(frameTime);

      // Yield to event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  /**
   * Reset time controller
   */
  reset(): void {
    this.timeController.reset();
  }
}

/**
 * Create a promise that resolves after game events
 */
export class GameEventPromise {
  private promises: Map<string, Promise<any>> = new Map();
  private resolvers: Map<string, (value: any) => void> = new Map();

  constructor(private game: Game) {
    this.setupListeners();
  }

  private setupListeners(): void {
    const gameAny = this.game as any;

    // Listen for enemy deaths
    this.createPromise("enemyKilled");

    // Listen for wave completion
    this.createPromise("waveComplete");

    // Listen for game over
    this.createPromise("gameOver");

    // Listen for victory
    this.createPromise("victory");
  }

  private createPromise(eventName: string): void {
    const promise = new Promise((resolve) => {
      this.resolvers.set(eventName, resolve);
    });
    this.promises.set(eventName, promise);
  }

  /**
   * Wait for next enemy kill
   */
  async nextEnemyKill(): Promise<{ enemy: Entity; reward: number }> {
    return this.promises.get("enemyKilled")!;
  }

  /**
   * Wait for wave completion
   */
  async waveComplete(): Promise<number> {
    return this.promises.get("waveComplete")!;
  }

  /**
   * Wait for game over
   */
  async gameOver(): Promise<void> {
    return this.promises.get("gameOver")!;
  }

  /**
   * Wait for victory
   */
  async victory(): Promise<void> {
    return this.promises.get("victory")!;
  }

  /**
   * Trigger an event (for testing)
   */
  trigger(eventName: string, data?: any): void {
    const resolver = this.resolvers.get(eventName);
    if (resolver) {
      resolver(data);
      // Create new promise for next event
      this.createPromise(eventName);
    }
  }
}

/**
 * Retry an async operation with backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Create a timeout promise
 */
export function timeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Race a promise against a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  return Promise.race([promise, timeout(ms, message)]);
}
