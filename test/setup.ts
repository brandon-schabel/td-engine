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
  
  constructor() {
    // Set up a setter for src that triggers onload
    let _src = '';
    Object.defineProperty(this, 'src', {
      get: () => _src,
      set: (value: string) => {
        _src = value;
        // Trigger onload synchronously for tests to avoid hanging
        if (this.onload) {
          this.onload();
        }
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

// Mock requestAnimationFrame and cancelAnimationFrame
// Note: These provide basic mocks that don't execute automatically
// Tests that need controlled timing should use TimeController from test helpers
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  // Return a mock ID but don't actually schedule the callback
  // This prevents real timers from being created in tests
  return 1;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  // Mock implementation that does nothing
  // Real cleanup is handled by individual test utilities
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

// Mock window.AudioContext
Object.defineProperty(global, 'AudioContext', {
  value: MockAudioContext
});

Object.defineProperty(global, 'webkitAudioContext', {
  value: MockAudioContext
});

// Setup global mocks
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: MockHTMLCanvasElement,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'HTMLImageElement', {
  value: MockHTMLImageElement,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'Image', {
  value: MockHTMLImageElement,
  writable: true,
  configurable: true
});

// Also ensure Image is available as a global constructor
(globalThis as any).Image = MockHTMLImageElement;

Object.defineProperty(global, 'Audio', {
  value: MockAudio,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'MouseEvent', {
  value: MockMouseEvent,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'KeyboardEvent', {
  value: MockKeyboardEvent,
  writable: true,
  configurable: true
});

// Ensure KeyboardEvent is also available on globalThis
(globalThis as any).KeyboardEvent = MockKeyboardEvent;

// Mock DOM methods that might be used in tests
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
  })
});

// Mock document with all necessary methods
Object.defineProperty(global, 'document', {
  value: {
    ...document,
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

// Mock localStorage
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

// Cleanup function for tests
afterEach(() => {
  // Clear all Vitest mocks
  vi.clearAllMocks();
  
  // Clear any real timers that might have been created
  // This helps prevent tests from interfering with each other
  vi.clearAllTimers();
  
  // Restore timers to ensure clean state
  vi.useRealTimers();
});