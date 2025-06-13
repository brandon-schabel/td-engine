/**
 * DOM testing utilities for UI components
 * Provides consistent DOM mocking for component tests
 */

import { vi } from 'vitest';

export const createMockElement = (tagName: string): any => {
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
    
    // Event handling with proper click tracking
    _clickHandlers: [] as any[],
    _eventHandlers: {} as { [eventType: string]: any[] },
    addEventListener: vi.fn((eventType: string, handler: any) => {
      if (!element._eventHandlers[eventType]) {
        element._eventHandlers[eventType] = [];
      }
      element._eventHandlers[eventType].push(handler);
      
      // Track click handlers separately for easy access
      if (eventType === 'click') {
        element._clickHandlers.push(handler);
      }
    }),
    removeEventListener: vi.fn((eventType: string, handler: any) => {
      if (element._eventHandlers[eventType]) {
        const index = element._eventHandlers[eventType].indexOf(handler);
        if (index > -1) {
          element._eventHandlers[eventType].splice(index, 1);
        }
      }
      
      if (eventType === 'click') {
        const index = element._clickHandlers.indexOf(handler);
        if (index > -1) {
          element._clickHandlers.splice(index, 1);
        }
      }
    }),
    dispatchEvent: vi.fn((event: any) => {
      const eventType = event.type;
      if (element._eventHandlers[eventType]) {
        element._eventHandlers[eventType].forEach((handler: any) => handler(event));
      }
    }),
    
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
    
    // Query methods with improved matching (recursive)
    querySelector: (selector: string) => {
      const findInElement = (el: any, sel: string): any => {
        // Check direct children first
        for (const child of el.children || []) {
          if (sel.startsWith('.')) {
            const className = sel.slice(1);
            if (child.className && child.className.includes(className)) {
              return child;
            }
          } else if (sel.match(/^[a-z0-9]+$/i)) {
            if (child.tagName && child.tagName.toLowerCase() === sel.toLowerCase()) {
              return child;
            }
          } else if (sel.includes('[style*=')) {
            // Handle style attribute selectors like div[style*="margin-top: 20px"]
            const tagMatch = sel.match(/^([a-z0-9]+)\[style\*="([^"]+)"\]$/i);
            if (tagMatch) {
              const [, tagName, styleSubstring] = tagMatch;
              if (child.tagName && child.tagName.toLowerCase() === tagName.toLowerCase()) {
                if (child.style && child.style.cssText && child.style.cssText.includes(styleSubstring)) {
                  return child;
                }
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
    },
    
    querySelectorAll: (selector: string) => {
      const findAllInElement = (el: any, sel: string): any[] => {
        let matches: any[] = [];
        
        // Check direct children
        for (const child of el.children || []) {
          if (sel.startsWith('.')) {
            const className = sel.slice(1);
            if (child.className && child.className.includes(className)) {
              matches.push(child);
            }
          } else if (sel.match(/^[a-z0-9]+$/i)) {
            if (child.tagName && child.tagName.toLowerCase() === sel.toLowerCase()) {
              matches.push(child);
            }
          } else if (sel.includes('[style*=')) {
            // Handle style attribute selectors like div[style*="margin-top: 20px"]
            const tagMatch = sel.match(/^([a-z0-9]+)\[style\*="([^"]+)"\]$/i);
            if (tagMatch) {
              const [, tagName, styleSubstring] = tagMatch;
              if (child.tagName && child.tagName.toLowerCase() === tagName.toLowerCase()) {
                if (child.style && child.style.cssText && child.style.cssText.includes(styleSubstring)) {
                  matches.push(child);
                }
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
    },
    
    // Click handler
    click: vi.fn(() => {
      // Create a synthetic click event and trigger any registered click handlers
      const clickEvent = {
        type: 'click',
        target: element,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };
      
      // Manually trigger click event handlers if any are registered
      if (element._clickHandlers) {
        element._clickHandlers.forEach((handler: any) => handler(clickEvent));
      }
      
      element.dispatchEvent(clickEvent);
    }),
    
    // Canvas-specific methods (if canvas)
    ...(tagName === 'canvas' ? {
      width: 800,
      height: 600,
      getContext: vi.fn(() => ({
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
        set fillStyle(value: string) {},
        set strokeStyle(value: string) {},
        set lineWidth(value: number) {},
        set globalAlpha(value: number) {},
        set font(value: string) {},
        set textAlign(value: string) {},
        set textBaseline(value: string) {}
      })),
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
              const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
              target[kebabKey] = val;
              
              // Handle shorthand properties
              if (kebabKey === 'border') {
                // Parse border shorthand: "2px solid #4CAF50"
                const borderParts = val.split(' ');
                if (borderParts.length >= 3) {
                  target['border-width'] = borderParts[0];
                  target['border-style'] = borderParts[1];
                  target['border-color'] = borderParts[2];
                }
              }
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
        
        // Convert camelCase to kebab-case for property lookup
        const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return target[prop] || target[kebabProp] || '';
      }
    }),
    writable: true,
    configurable: true
  });
  
  return element;
};

export const createMockDocument = () => ({
  createElement: vi.fn(createMockElement),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  body: createMockElement('body'),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => [])
});

/**
 * Setup mock document for UI component tests
 * Call this in beforeEach or describe blocks for UI tests
 */
export const setupMockDOM = () => {
  const mockDoc = createMockDocument();
  
  // Make document available globally
  (global as any).document = mockDoc;
  (globalThis as any).document = mockDoc;
  
  return mockDoc;
};