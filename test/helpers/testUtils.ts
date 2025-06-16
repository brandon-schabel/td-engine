/**
 * Common test utilities and assertion helpers
 */

import type { Vector2 } from '@/utils/Vector2';
import { expect } from 'vitest';

/**
 * Assert that two Vector2 objects are equal
 */
export function assertVector2Equal(actual: Vector2, expected: Vector2, precision: number = 0.0001) {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
}

/**
 * Assert that two numbers are approximately equal
 */
export function assertApproximatelyEqual(actual: number, expected: number, tolerance: number = 0.0001) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

/**
 * Create a delay promise for async tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a function multiple times and collect results
 */
export function runMultipleTimes<T>(fn: () => T, times: number): T[] {
  const results: T[] = [];
  for (let i = 0; i < times; i++) {
    results.push(fn());
  }
  return results;
}

/**
 * Assert that a function throws with a specific error message
 */
export async function assertThrowsWithMessage(
  fn: () => void | Promise<void>,
  expectedMessage: string | RegExp
) {
  try {
    await fn();
    expect.fail('Expected function to throw');
  } catch (error) {
    if (error instanceof Error) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toBe(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    } else {
      throw error;
    }
  }
}

/**
 * Create a mock function that tracks calls
 */
export function createTrackedFunction<T extends (...args: any[]) => any>(
  implementation?: T
): T & { calls: Array<Parameters<T>>; resetCalls: () => void } {
  const calls: Array<Parameters<T>> = [];
  
  const fn = ((...args: Parameters<T>) => {
    calls.push(args);
    return implementation?.(...args);
  }) as T & { calls: Array<Parameters<T>>; resetCalls: () => void };
  
  fn.calls = calls;
  fn.resetCalls = () => calls.length = 0;
  
  return fn;
}

/**
 * Assert that an array contains items matching a predicate
 */
export function assertArrayContains<T>(
  array: T[],
  predicate: (item: T) => boolean,
  expectedCount?: number
) {
  const matches = array.filter(predicate);
  
  if (expectedCount !== undefined) {
    expect(matches).toHaveLength(expectedCount);
  } else {
    expect(matches.length).toBeGreaterThan(0);
  }
}

/**
 * Create a test grid pattern for pathfinding tests
 */
export function createGridPattern(width: number, height: number, pattern: string[]): boolean[][] {
  const grid: boolean[][] = [];
  
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      const char = pattern[y]?.[x] || ' ';
      grid[y][x] = char === '#'; // # represents obstacles
    }
  }
  
  return grid;
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  
  return { result, time };
}

/**
 * Assert that a value is within a range
 */
export function assertInRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}