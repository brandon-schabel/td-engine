import { vi, afterEach } from 'vitest';

// Mock HTMLCanvasElement and CanvasRenderingContext2D for testing
class MockCanvasRenderingContext2D {
  canvas = {} as HTMLCanvasElement;
  
  // Drawing methods
  clearRect = vi.fn();
  fillRect = vi.fn();
  strokeRect = vi.fn();
  beginPath = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  stroke = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  setLineDash = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  fillText = vi.fn();
  drawImage = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  transform = vi.fn();
  setTransform = vi.fn();
  resetTransform = vi.fn();
  closePath = vi.fn();
  clip = vi.fn();
  measureText = vi.fn(() => ({ width: 100 }));
  createLinearGradient = vi.fn(() => ({
    addColorStop: vi.fn()
  }));
  createRadialGradient = vi.fn(() => ({
    addColorStop: vi.fn()
  }));
  
  // Properties with setters
  _fillStyle = '#000000';
  get fillStyle() { return this._fillStyle; }
  set fillStyle(value: string | CanvasGradient | CanvasPattern) { this._fillStyle = value as string; }
  
  _strokeStyle = '#000000';
  get strokeStyle() { return this._strokeStyle; }
  set strokeStyle(value: string | CanvasGradient | CanvasPattern) { this._strokeStyle = value as string; }
  
  _lineWidth = 1;
  get lineWidth() { return this._lineWidth; }
  set lineWidth(value: number) { this._lineWidth = value; }
  
  _globalAlpha = 1;
  get globalAlpha() { return this._globalAlpha; }
  set globalAlpha(value: number) { this._globalAlpha = value; }
  
  _font = '10px sans-serif';
  get font() { return this._font; }
  set font(value: string) { this._font = value; }
  
  _textAlign = 'start';
  get textAlign() { return this._textAlign; }
  set textAlign(value: CanvasTextAlign) { this._textAlign = value; }
  
  _lineCap = 'butt';
  get lineCap() { return this._lineCap; }
  set lineCap(value: CanvasLineCap) { this._lineCap = value; }
  
  _lineJoin = 'miter';
  get lineJoin() { return this._lineJoin; }
  set lineJoin(value: CanvasLineJoin) { this._lineJoin = value; }
}

class MockHTMLCanvasElement {
  width = 800;
  height = 608;
  
  getContext = vi.fn((type: string) => {
    if (type === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  });
  
  toDataURL = vi.fn(() => 'data:image/png;base64,');
  toBlob = vi.fn();
  
  // Event handling
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}

// Mock HTMLImageElement
class MockHTMLImageElement {
  src = '';
  alt = '';
  width = 64; // Default test dimensions
  height = 64;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  complete = true; // Mark as complete for tests
  
  constructor() {
    // Set up a setter for src that triggers onload
    let _src = '';
    Object.defineProperty(this, 'src', {
      get: () => _src,
      set: (value: string) => {
        _src = value;
        // Trigger onload on next tick to allow promise setup
        // Use Promise.resolve().then to ensure it runs after the current task
        Promise.resolve().then(() => {
          if (this.onload) {
            this.onload();
          }
        });
      }
    });
  }
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

// Mock Audio
class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  duration = 0;
  paused = true;
  ended = false;
  
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

// Mock WebAudio API
class MockAudioContext {
  destination = {};
  sampleRate = 44100;
  currentTime = 0;
  state = 'running';
  
  createOscillator = vi.fn(() => ({
    frequency: { value: 440 },
    type: 'sine',
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }));
  
  createGain = vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn()
  }));
  
  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn()
  }));
  
  decodeAudioData = vi.fn().mockResolvedValue({});
  
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

// Mock MouseEvent
class MockMouseEvent extends Event {
  offsetX: number;
  offsetY: number;
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  
  constructor(type: string, options: any = {}) {
    super(type);
    this.offsetX = options.offsetX || 0;
    this.offsetY = options.offsetY || 0;
    this.clientX = options.clientX || 0;
    this.clientY = options.clientY || 0;
    this.button = options.button || 0;
    this.buttons = options.buttons || 0;
  }
  
  preventDefault = vi.fn();
  stopPropagation = vi.fn();
}

// Mock KeyboardEvent
class MockKeyboardEvent extends Event {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  
  constructor(type: string, options: any = {}) {
    super(type);
    this.key = options.key || '';
    this.code = options.code || '';
    this.ctrlKey = options.ctrlKey || false;
    this.shiftKey = options.shiftKey || false;
    this.altKey = options.altKey || false;
    this.metaKey = options.metaKey || false;
  }
  
  preventDefault = vi.fn();
  stopPropagation = vi.fn();
}

// Add setImmediate polyfill for environments that don't have it
if (typeof setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: Function) => setTimeout(fn, 0);
}

// Track all created games for cleanup
const activeGames = new Set<any>();
const originalGameStart = (global as any).Game?.prototype?.start;
const originalGameStop = (global as any).Game?.prototype?.stop;

// Hook into game lifecycle if Game class exists
if (typeof (global as any).Game !== 'undefined') {
  (global as any).Game.prototype.start = function() {
    activeGames.add(this);
    if (originalGameStart) {
      return originalGameStart.call(this);
    }
  };
  
  (global as any).Game.prototype.stop = function() {
    activeGames.delete(this);
    if (originalGameStop) {
      return originalGameStop.call(this);
    }
  };
}

// Mock requestAnimationFrame and cancelAnimationFrame
// Note: These provide basic mocks that don't execute automatically
// Tests that need controlled timing should use TimeController from test helpers
let rafId = 0;
const rafCallbacks = new Map<number, FrameRequestCallback>();

global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  const id = ++rafId;
  rafCallbacks.set(id, callback);
  // Don't execute the callback automatically
  return id;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  rafCallbacks.delete(id);
});

// Mock performance.now - allow TimeController to override it
if (!global.performance) {
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now())
    },
    writable: true,
    configurable: true
  });
}

// Mock window.AudioContext - only define if not already defined
if (!global.AudioContext) {
  Object.defineProperty(global, 'AudioContext', {
    value: MockAudioContext,
    writable: true,
    configurable: true
  });
}

if (!global.webkitAudioContext) {
  Object.defineProperty(global, 'webkitAudioContext', {
    value: MockAudioContext,
    writable: true,
    configurable: true
  });
}

// Setup global mocks
if (!global.HTMLCanvasElement || global.HTMLCanvasElement !== MockHTMLCanvasElement) {
  Object.defineProperty(global, 'HTMLCanvasElement', {
    value: MockHTMLCanvasElement,
    writable: true,
    configurable: true
  });
}

if (!global.HTMLImageElement || global.HTMLImageElement !== MockHTMLImageElement) {
  Object.defineProperty(global, 'HTMLImageElement', {
    value: MockHTMLImageElement,
    writable: true,
    configurable: true
  });
}

if (!global.Image || global.Image !== MockHTMLImageElement) {
  Object.defineProperty(global, 'Image', {
    value: MockHTMLImageElement,
    writable: true,
    configurable: true
  });
}

// Also ensure Image is available as a global constructor
(globalThis as any).Image = MockHTMLImageElement;

if (!global.Audio || global.Audio !== MockAudio) {
  Object.defineProperty(global, 'Audio', {
    value: MockAudio,
    writable: true,
    configurable: true
  });
}

if (!global.MouseEvent || global.MouseEvent !== MockMouseEvent) {
  Object.defineProperty(global, 'MouseEvent', {
    value: MockMouseEvent,
    writable: true,
    configurable: true
  });
}

if (!global.KeyboardEvent || global.KeyboardEvent !== MockKeyboardEvent) {
  Object.defineProperty(global, 'KeyboardEvent', {
    value: MockKeyboardEvent,
    writable: true,
    configurable: true
  });
}

// Ensure KeyboardEvent is also available on globalThis
(globalThis as any).KeyboardEvent = MockKeyboardEvent;

// Mock DOM methods that might be used in tests
if (typeof document !== 'undefined' && document.createElement) {
  Object.defineProperty(document, 'createElement', {
    value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return new MockHTMLCanvasElement();
    }
    if (tagName === 'img') {
      return new MockHTMLImageElement();
    }
    // Return a basic mock element for other types
    return {
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      innerHTML: '',
      textContent: '',
      className: '',
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn()
      }
    };
  }),
  writable: true,
  configurable: true
  });
}

// Mock document with all necessary methods
if (!global.document || !global.document._mocked) {
  Object.defineProperty(global, 'document', {
    value: {
      ...document,
      _mocked: true,
      dispatchEvent: vi.fn(),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        style: {}
      },
      head: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      }
    },
    writable: true,
    configurable: true
  });
}

// Mock localStorage
if (!global.localStorage) {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null)
    },
    writable: true,
    configurable: true
  });
}

// Console setup for cleaner test output
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Suppress known harmless errors in tests
  const message = args[0];
  if (typeof message === 'string') {
    if (message.includes('AudioContext') || 
        message.includes('WebAudio') ||
        message.includes('Canvas') ||
        message.includes('requestAnimationFrame')) {
      return;
    }
  }
  originalConsoleError(...args);
};

// Store original global objects
const originalRAF = global.requestAnimationFrame;
const originalCAF = global.cancelAnimationFrame;
const originalPerformance = global.performance;

// Cleanup function for tests
afterEach(async () => {
  // Stop all active games
  activeGames.forEach(game => {
    if (game && typeof game.stop === 'function') {
      try {
        game.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  });
  activeGames.clear();
  
  // Clear all RAF callbacks
  rafCallbacks.clear();
  
  // Clear all Vitest mocks
  vi.clearAllMocks();
  
  // Clear any real timers that might have been created
  // This helps prevent tests from interfering with each other
  vi.clearAllTimers();
  
  // Restore timers to ensure clean state
  vi.useRealTimers();
  
  // Restore global functions to prevent corruption
  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
  if (originalPerformance) {
    global.performance = originalPerformance;
  }
  
  // Clear any pending microtasks and timers
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
});