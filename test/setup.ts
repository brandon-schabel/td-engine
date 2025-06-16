import { vi } from 'vitest';

/**
 * Global test setup
 * Provides minimal mocks for browser APIs that might be referenced
 * but are not needed for unit testing game logic
 */

// Mock requestAnimationFrame/cancelAnimationFrame for GameEngine tests
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(Date.now()), 16) as any;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock performance.now() for timing tests
global.performance = {
  now: vi.fn(() => Date.now())
} as any;

// Mock localStorage for ScoreManager tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    // Helper to reset store for tests
    __resetStore: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock as any;

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock Audio API for any audio-related tests
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    gain: { 
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  })),
  destination: {},
  currentTime: 0
})) as any;

// Mock Canvas API (minimal - we're not testing rendering)
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  measureText: vi.fn(() => ({ width: 100 })),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  font: '10px sans-serif',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over'
})) as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  (localStorageMock as any).__resetStore();
});