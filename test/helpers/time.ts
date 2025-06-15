import { vi } from 'vitest';

export interface AnimationFrameMock {
  callback: FrameRequestCallback | null;
  id: number;
}

export interface TimeHelpers {
  requestAnimationFrame: ReturnType<typeof vi.fn>;
  cancelAnimationFrame: ReturnType<typeof vi.fn>;
  performanceNow: ReturnType<typeof vi.fn>;
  dateNow: ReturnType<typeof vi.fn>;
  setTimeout: ReturnType<typeof vi.fn>;
  clearTimeout: ReturnType<typeof vi.fn>;
  setInterval: ReturnType<typeof vi.fn>;
  clearInterval: ReturnType<typeof vi.fn>;
}

let frameId = 0;
let currentTime = 0;
let registeredFrames = new Map<number, AnimationFrameMock>();
let timers = new Map<number, { callback: Function; delay: number; interval: boolean; nextRun: number }>();
let timerId = 0;

export function setupTimeMocks(): TimeHelpers {
  frameId = 0;
  currentTime = 0;
  registeredFrames.clear();
  timers.clear();
  timerId = 0;
  
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = ++frameId;
    registeredFrames.set(id, { callback, id });
    return id;
  });
  
  const cancelAnimationFrame = vi.fn((id: number) => {
    registeredFrames.delete(id);
  });
  
  const performanceNow = vi.fn(() => currentTime);
  const dateNow = vi.fn(() => currentTime);
  
  const setTimeout = vi.fn((callback: Function, delay: number) => {
    const id = ++timerId;
    timers.set(id, {
      callback,
      delay,
      interval: false,
      nextRun: currentTime + delay
    });
    return id;
  });
  
  const clearTimeout = vi.fn((id: number) => {
    timers.delete(id);
  });
  
  const setInterval = vi.fn((callback: Function, delay: number) => {
    const id = ++timerId;
    timers.set(id, {
      callback,
      delay,
      interval: true,
      nextRun: currentTime + delay
    });
    return id;
  });
  
  const clearInterval = vi.fn((id: number) => {
    timers.delete(id);
  });
  
  global.requestAnimationFrame = requestAnimationFrame as any;
  global.cancelAnimationFrame = cancelAnimationFrame as any;
  
  // Safely set performance.now
  if (global.performance) {
    global.performance.now = performanceNow;
  } else {
    Object.defineProperty(global, 'performance', {
      value: { now: performanceNow },
      writable: true,
      configurable: true
    });
  }
  
  Date.now = dateNow;
  global.setTimeout = setTimeout as any;
  global.clearTimeout = clearTimeout as any;
  global.setInterval = setInterval as any;
  global.clearInterval = clearInterval as any;
  
  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    performanceNow,
    dateNow,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
}

export function advanceTime(ms: number): void {
  currentTime += ms;
  
  // Process timers
  const timersToRun: Array<{ timer: any; id: number }> = [];
  timers.forEach((timer, id) => {
    if (timer.nextRun <= currentTime) {
      timersToRun.push({ timer, id });
    }
  });
  
  timersToRun.forEach(({ timer, id }) => {
    timer.callback();
    if (timer.interval) {
      timer.nextRun = currentTime + timer.delay;
    } else {
      timers.delete(id);
    }
  });
}

export function simulateFrame(deltaTime = 16): void {
  advanceTime(deltaTime);
  
  const framesToRun = Array.from(registeredFrames.values());
  registeredFrames.clear();
  
  framesToRun.forEach(frame => {
    if (frame.callback) {
      frame.callback(currentTime);
    }
  });
}

export function simulateFrames(count: number, deltaTime = 16): void {
  for (let i = 0; i < count; i++) {
    simulateFrame(deltaTime);
  }
}

export function getCurrentTime(): number {
  return currentTime;
}

export function resetTime(): void {
  currentTime = 0;
}

export function getPendingFrames(): AnimationFrameMock[] {
  return Array.from(registeredFrames.values());
}

export function getPendingTimers(): number {
  return timers.size;
}

export function runAllTimers(): void {
  const maxIterations = 1000;
  let iterations = 0;
  
  while (timers.size > 0 && iterations < maxIterations) {
    const nextTimer = Array.from(timers.entries())
      .sort(([, a], [, b]) => a.nextRun - b.nextRun)[0];
    
    if (!nextTimer) break;
    
    const [id, timer] = nextTimer;
    advanceTime(timer.nextRun - currentTime);
    
    iterations++;
  }
}

export function runNextTimer(): void {
  const nextTimer = Array.from(timers.entries())
    .sort(([, a], [, b]) => a.nextRun - b.nextRun)[0];
  
  if (nextTimer) {
    const [, timer] = nextTimer;
    advanceTime(timer.nextRun - currentTime);
  }
}

export class TimeController {
  private mocks: TimeHelpers;
  
  constructor() {
    this.mocks = setupTimeMocks();
  }
  
  advance(ms: number): void {
    advanceTime(ms);
  }
  
  nextFrame(deltaTime = 16): void {
    simulateFrame(deltaTime);
  }
  
  frames(count: number, deltaTime = 16): void {
    simulateFrames(count, deltaTime);
  }
  
  runTimers(): void {
    runAllTimers();
  }
  
  runNext(): void {
    runNextTimer();
  }
  
  reset(): void {
    resetTime();
    registeredFrames.clear();
    timers.clear();
    frameId = 0;
    timerId = 0;
  }
  
  get now(): number {
    return currentTime;
  }
  
  get mocked(): TimeHelpers {
    return this.mocks;
  }
}

export function measureExecutionTime<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now();
  const result = fn();
  const time = performance.now() - start;
  return { result, time };
}

export function assertExecutionTime(fn: () => void, maxMs: number, message?: string): void {
  const { time } = measureExecutionTime(fn);
  const errorMessage = message || `Execution took ${time}ms, expected less than ${maxMs}ms`;
  expect(time).toBeLessThan(maxMs);
}