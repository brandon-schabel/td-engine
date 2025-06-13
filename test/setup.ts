import { vi } from 'vitest';

// Store original Image if it exists (from jsdom)
const OriginalImage = global.Image;

// Mock global Image constructor
class MockImage {
  width: number = 64;
  height: number = 64;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src: string = '';

  constructor() {
    // Don't trigger load immediately - wait for src to be set
  }

  set src(value: string) {
    this._src = value;
    // Use setTimeout(0) for reliable async execution across environments
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }

  get src(): string {
    return this._src;
  }
}

// Override global Image
global.Image = MockImage as any;
(globalThis as any).Image = MockImage;

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
  Image: MockImage
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

// Create a comprehensive DOM element mock
const createMockElement = (tagName: string) => {
  const element = {
    tagName: tagName.toUpperCase(),
    className: '',
    id: '',
    innerHTML: '',
    textContent: '',
    style: {} as CSSStyleDeclaration,
    dataset: {} as DOMStringMap,
    disabled: false,
    children: [] as any[],
    parentNode: null,
    childNodes: [] as any[],
    
    // Event handling
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    
    // DOM manipulation
    appendChild: vi.fn((child: any) => {
      element.children.push(child);
      element.childNodes.push(child);
      child.parentNode = element;
      return child;
    }),
    removeChild: vi.fn((child: any) => {
      const index = element.children.indexOf(child);
      if (index > -1) {
        element.children.splice(index, 1);
        element.childNodes.splice(index, 1);
      }
      child.parentNode = null;
      return child;
    }),
    insertBefore: vi.fn(),
    replaceChild: vi.fn(),
    
    // Query methods with recursive search and style attribute support
    querySelector: vi.fn((selector: string) => {
      const findInElement = (el: any, sel: string): any => {
        // Check direct children first
        for (const child of el.children || []) {
          if (sel.startsWith('.')) {
            const className = sel.slice(1);
            if (child.className && child.className.includes(className)) {
              return child;
            }
          } else if (sel.match(/^[a-z]+$/i)) {
            if (child.tagName && child.tagName.toLowerCase() === sel.toLowerCase()) {
              return child;
            }
          } else if (sel.includes('[style*=')) {
            // Handle style attribute selectors like div[style*="margin-top: 20px"]
            const match = sel.match(/\[style\*="([^"]+)"\]/);
            if (match && child.style && child.style.cssText) {
              if (child.style.cssText.includes(match[1])) {
                return child;
              }
            }
          }
          
          // Recursively search in child elements
          const found = findInElement(child, sel);
          if (found) return found;
        }
        return null;
      };
      
      return findInElement(element, selector);
    }),
    querySelectorAll: vi.fn((selector: string) => {
      const findAllInElement = (el: any, sel: string): any[] => {
        let matches: any[] = [];
        
        // Check direct children
        for (const child of el.children || []) {
          if (sel.startsWith('.')) {
            const className = sel.slice(1);
            if (child.className && child.className.includes(className)) {
              matches.push(child);
            }
          } else if (sel.match(/^[a-z]+$/i)) {
            if (child.tagName && child.tagName.toLowerCase() === sel.toLowerCase()) {
              matches.push(child);
            }
          } else if (sel.includes('[style*=')) {
            // Handle style attribute selectors
            const match = sel.match(/\[style\*="([^"]+)"\]/);
            if (match && child.style && child.style.cssText) {
              if (child.style.cssText.includes(match[1])) {
                matches.push(child);
              }
            }
          }
          
          // Recursively search in child elements
          matches = matches.concat(findAllInElement(child, sel));
        }
        
        return matches;
      };
      
      const matches = findAllInElement(element, selector);
      
      // Return array-like object with NodeList methods
      const nodeList = {
        length: matches.length,
        forEach: vi.fn((callback: any) => matches.forEach(callback)),
        [Symbol.iterator]: function* () {
          for (const match of matches) yield match;
        }
      };
      
      // Add indexed access
      for (let i = 0; i < matches.length; i++) {
        (nodeList as any)[i] = matches[i];
      }
      
      return nodeList;
    }),
    
    // Methods specific to certain elements
    click: vi.fn(() => {
      // Simulate click event
      element.dispatchEvent({ type: 'click', target: element });
    }),
    
    // Canvas-specific methods (if canvas)
    ...(tagName === 'canvas' ? {
      width: 800,
      height: 600,
      getContext: vi.fn(() => createCachedCanvasContext()),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock')
    } : {})
  };
  
  // Make style properties properly mockable with storage
  const styleStorage: { [key: string]: string } = {};
  Object.defineProperty(element, 'style', {
    value: new Proxy(styleStorage, {
      set: (target: any, prop: string, value: string) => {
        if (prop === 'cssText') {
          // Parse cssText and set individual properties
          const styles = value.split(';').filter(s => s.trim());
          styles.forEach(style => {
            const [key, val] = style.split(':').map(s => s.trim());
            if (key && val) {
              target[key.replace(/([A-Z])/g, '-$1').toLowerCase()] = val;
            }
          });
        } else {
          target[prop] = value;
        }
        return true;
      },
      get: (target: any, prop: string) => {
        if (prop === 'cssText') {
          // Build cssText from stored properties
          return Object.entries(target)
            .map(([key, val]) => `${key}: ${val}`)
            .join('; ');
        }
        return target[prop] || '';
      }
    }),
    writable: true,
    configurable: true
  });
  
  return element;
};

// Mock document.createElement with comprehensive DOM element support
const mockDocument = {
  createElement: vi.fn((tagName: string) => createMockElement(tagName)),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  body: createMockElement('body'),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => [])
} as any;

global.document = mockDocument;

// Also set it on globalThis to ensure it's available everywhere
(globalThis as any).document = mockDocument;

// For UI component tests, ensure document is available in the global scope
if (typeof document === 'undefined') {
  (global as any).document = mockDocument;
}

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

// Mock localStorage for configuration persistence
const localStorageData = new Map<string, string>();

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageData.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    localStorageData.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageData.clear();
  }),
  length: 0,
  key: vi.fn((index: number) => {
    const keys = Array.from(localStorageData.keys());
    return keys[index] || null;
  })
} as any;

global.localStorage = localStorageMock;
(globalThis as any).localStorage = localStorageMock;

// Also ensure it's available as a regular global variable
if (typeof localStorage === 'undefined') {
  (global as any).localStorage = localStorageMock;
}

// Update length property when storage changes
Object.defineProperty(global.localStorage, 'length', {
  get: () => localStorageData.size
});
Object.defineProperty((globalThis as any).localStorage, 'length', {
  get: () => localStorageData.size
});

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress texture loading warnings in tests
  if (args[0]?.includes?.('Some textures failed to load')) {
    return;
  }
  originalWarn.apply(console, args);
};