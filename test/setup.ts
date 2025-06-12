import { vi } from 'vitest';

// Mock global Image constructor
global.Image = class MockImage {
  src: string = '';
  width: number = 100;
  height: number = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    // Simulate successful image loading after a tick
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;

// Mock AudioContext
class MockAudioContext {
  destination = {};
  currentTime = 0;
  sampleRate = 44100;

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn() },
      connect: vi.fn()
    };
  }

  close() {
    return Promise.resolve();
  }
}

// Mock window object
global.window = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn(),
  Image: global.Image
} as any;

// Also add to global scope
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Ensure they're also available without global prefix
(globalThis as any).requestAnimationFrame = global.requestAnimationFrame;
(globalThis as any).cancelAnimationFrame = global.cancelAnimationFrame;

// Performance: Cache frequently created mock objects
const createCachedCanvasContext = () => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  setLineDash: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  closePath: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(64 * 64 * 4) })),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(64 * 64 * 4) })),
  set fillStyle(value: string) {},
  set strokeStyle(value: string) {},
  set lineWidth(value: number) {},
  set globalAlpha(value: number) {},
  set font(value: string) {},
  set textAlign(value: string) {},
  set textBaseline(value: string) {},
  set shadowColor(value: string) {},
  set shadowBlur(value: number) {},
  set lineCap(value: string) {}
});

// Cache commonly used canvas mock
const mockCanvasInstance = {
  width: 800,
  height: 600,
  style: {},
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  getContext: vi.fn(() => createCachedCanvasContext())
};

// Mock document.createElement for canvas (optimized)
global.document = {
  createElement: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      // Return a fresh context but reuse canvas structure
      return {
        ...mockCanvasInstance,
        getContext: vi.fn(() => createCachedCanvasContext())
      };
    }
    return {};
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as any;

// Mock HTMLCanvasElement prototype methods (optimized)
HTMLCanvasElement = class MockHTMLCanvasElement {
  width = 800;
  height = 600;
  style = {};

  getContext() {
    return createCachedCanvasContext();
  }

  toDataURL() {
    return 'data:image/png;base64,mock';
  }
} as any;

// Mock MouseEvent
global.MouseEvent = class MockMouseEvent {
  type: string;
  offsetX: number = 0;
  offsetY: number = 0;
  clientX: number = 0;
  clientY: number = 0;
  button: number = 0;
  buttons: number = 0;
  
  constructor(type: string, options: any = {}) {
    this.type = type;
    this.offsetX = options.offsetX || 0;
    this.offsetY = options.offsetY || 0;
    this.clientX = options.clientX || 0;
    this.clientY = options.clientY || 0;
    this.button = options.button || 0;
    this.buttons = options.buttons || 0;
  }
} as any;

// Mock CustomEvent
global.CustomEvent = class MockCustomEvent {
  type: string;
  detail: any;
  
  constructor(type: string, options: any = {}) {
    this.type = type;
    this.detail = options.detail;
  }
} as any;

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress texture loading warnings in tests
  if (args[0]?.includes?.('Some textures failed to load')) {
    return;
  }
  originalWarn.apply(console, args);
};