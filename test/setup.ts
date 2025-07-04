import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: localStorageMock }); // Also mock sessionStorage for consistency

// Ensure document is defined first
if (!global.document) {
  global.document = {} as any;
}

// Mock window object and its properties
Object.defineProperty(global, 'window', {
  value: {
    ...global,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    navigator: { userAgent: '' },
    document: global.document,
    location: { href: '' },
    history: { pushState: vi.fn(), replaceState: vi.fn() },
    innerWidth: 1024,
    innerHeight: 768,
  },
  writable: true,
  configurable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame for UI tests
Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn(callback => setTimeout(callback, 1000 / 60)), // Simulate 60fps
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn(id => clearTimeout(id)),
});

// Mock Vitest's global APIs for fake timers
vi.useFakeTimers = vi.fn();
vi.advanceTimersByTime = vi.fn(ms => {
  // Simulate advancing timers by calling setTimeout callbacks
  const now = Date.now();
  const targetTime = now + ms;
  // This is a simplified mock. A full implementation would manage a queue of timers.
  // For now, we just advance the internal clock.
  vi.setSystemTime(targetTime);
});
vi.useRealTimers = vi.fn();
vi.setSystemTime = vi.fn();

// Mock HTMLCanvasElement for rendering tests
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(),
    clip: vi.fn(),
    ellipse: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    scale: vi.fn(),
    strokeText: vi.fn(),
    get lineDashOffset() { return 0; },
    set lineDashOffset(value) {},
    get fillStyle() { return ''; },
    set fillStyle(value) {},
    get strokeStyle() { return ''; },
    set strokeStyle(value) {},
    get globalAlpha() { return 1; },
    set globalAlpha(value) {},
    get font() { return ''; },
    set font(value) {},
    get textAlign() { return 'start'; },
    set textAlign(value) {},
    get textBaseline() { return 'alphabetic'; },
    set textBaseline(value) {},
    get lineWidth() { return 1; },
    set lineWidth(value) {},
    get lineCap() { return 'butt'; },
    set lineCap(value) {},
    get lineJoin() { return 'miter'; },
    set lineJoin(value) {},
    get miterLimit() { return 10; },
    set miterLimit(value) {},
    get shadowBlur() { return 0; },
    set shadowBlur(value) {},
    get shadowColor() { return 'rgba(0, 0, 0, 0)'; },
    set shadowColor(value) {},
    get shadowOffsetX() { return 0; },
    set shadowOffsetX(value) {},
    get shadowOffsetY() { return 0; },
    set shadowOffsetY(value) {},
    get filter() { return 'none'; },
    set filter(value) {},
    get globalCompositeOperation() { return 'source-over'; },
    set globalCompositeOperation(value) {},
    get imageSmoothingEnabled() { return true; },
    set imageSmoothingEnabled(value) {},
    get imageSmoothingQuality() { return 'low'; },
    set imageSmoothingQuality(value) {},
    get direction() { return 'ltr'; },
    set direction(value) {},
    get letterSpacing() { return '0px'; },
    set letterSpacing(value) {},
    get wordSpacing() { return '0px'; },
    set wordSpacing(value) {},
    get currentTransform() { return new DOMMatrix(); },
    set currentTransform(value) {},
    get canvas() { return mockCanvas as any; },
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,'),
  width: 800,
  height: 600,
};

Object.defineProperty(global, 'HTMLCanvasElement', {
  value: vi.fn(() => mockCanvas),
});

// Mock document for UI tests
const mockDocument = {
  createElement: vi.fn((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      className: '',
      id: '',
      textContent: '',
      innerHTML: '',
      value: '',
      checked: false,
      disabled: false,
      style: {},
      children: [] as any[],
      dataset: {},
      setAttribute: vi.fn((name: string, value: string) => {
        if (name === 'class') element.className = value;
        else if (name === 'id') element.id = value;
        else (element as any)[name] = value;
      }),
      getAttribute: vi.fn((name: string) => {
        if (name === 'class') return element.className;
        else if (name === 'id') return element.id;
        else return (element as any)[name];
      }),
      appendChild: vi.fn((child: any) => {
        element.children.push(child);
      }),
      removeChild: vi.fn((child: any) => {
        element.children = element.children.filter(c => c !== child);
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      click: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({
        x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0,
      })),
      cloneNode: vi.fn(() => ({ ...element, children: element.children.map(c => c.cloneNode(true)) })),
      querySelector: vi.fn((selector: string) => {
        // Basic querySelector implementation for testing purposes
        if (selector === '.progress-bar-fill') {
          return element.children.find(child => child.className.includes('progress-bar-fill'));
        } else if (selector === '.progress-bar-label') {
          return element.children.find(child => child.className.includes('progress-bar-label'));
        }
        return null;
      }),
      querySelectorAll: vi.fn(() => []),
      matches: vi.fn(() => false),
      contains: vi.fn(() => false),
      get textContent() { return this._textContent; },
      set textContent(value) { this._textContent = value; },
      get innerHTML() { return this._innerHTML; },
      set innerHTML(value) { this._innerHTML = value; },
    };
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return element;
  }),
  getElementById: vi.fn((id: string) => {
    // This is a very basic mock. In a real scenario, you might want to
    // maintain a map of created elements by ID if your tests rely on it.
    if (id === 'td-engine-ui-styles') {
      return {
        textContent: '',
        parentNode: {
          removeChild: vi.fn(),
        },
      };
    }
    return null;
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    style: {},
  },
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  querySelector: vi.fn((selector: string) => {
    if (selector === 'style[data-style-manager="true"]') {
      // This is a simplified mock. In a real scenario, you might want to
      // maintain a map of created elements by ID if your tests rely on it.
      // For StyleManager, we know it creates a style element with this attribute.
      return {
        textContent: '',
        setAttribute: vi.fn(),
        parentNode: {
          removeChild: vi.fn(),
        },
        // Add style property for ProgressBar tests
        style: {
          width: '',
        },
      };
    }
    return null;
  }),
};

Object.defineProperty(global, 'document', { value: mockDocument });

// Mock HTMLElement
Object.defineProperty(global, 'HTMLElement', {
  writable: true,
  value: class HTMLElement {},
});

// Mock Image for rendering tests
Object.defineProperty(global, 'Image', {
  writable: true,
  value: vi.fn(() => ({
    src: '',
    onload: null,
    onerror: null,
    width: 0,
    height: 0,
    decode: vi.fn(() => Promise.resolve()),
  })),
});

// Mock OffscreenCanvas
Object.defineProperty(global, 'OffscreenCanvas', {
  writable: true,
  value: vi.fn(() => ({
    getContext: vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100) })),
      putImageData: vi.fn(),
    })),
    convertToBlob: vi.fn(() => Promise.resolve(new Blob())),
    width: 100,
    height: 100,
  })),
});

// Mock DOMMatrix
Object.defineProperty(global, 'DOMMatrix', {
  writable: true,
  value: vi.fn(() => ({
    a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
    multiply: vi.fn(() => new DOMMatrix()),
    invertSelf: vi.fn(() => new DOMMatrix()),
    translate: vi.fn(() => new DOMMatrix()),
    scale: vi.fn(() => new DOMMatrix()),
    rotate: vi.fn(() => new DOMMatrix()),
  })),
});

// Mock Blob
Object.defineProperty(global, 'Blob', {
  writable: true,
  value: vi.fn(() => ({})),
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  writable: true,
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock console.warn for tests that expect warnings
Object.defineProperty(global.console, 'warn', {
  writable: true,
  value: vi.fn(),
});

// Mock console.error for tests that expect errors
Object.defineProperty(global.console, 'error', {
  writable: true,
  value: vi.fn(),
});