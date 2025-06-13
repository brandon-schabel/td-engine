import { vi } from 'vitest';
import { Vector2 } from '@/utils/Vector2';

export interface MouseEventOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  clientX?: number;
  clientY?: number;
  screenX?: number;
  screenY?: number;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

export interface KeyboardEventOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  key?: string;
  code?: string;
  keyCode?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
}

export interface TouchEventOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  touches?: Touch[];
  targetTouches?: Touch[];
  changedTouches?: Touch[];
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

export function createMouseEvent(
  type: string,
  x: number,
  y: number,
  options: MouseEventOptions = {}
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    clientX: options.clientX ?? x,
    clientY: options.clientY ?? y,
    screenX: options.screenX ?? x,
    screenY: options.screenY ?? y,
    button: options.button ?? 0,
    buttons: options.buttons ?? 1,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false
  });
}

export function createKeyboardEvent(
  type: string,
  key: string,
  options: KeyboardEventOptions = {}
): KeyboardEvent {
  const keyCode = options.keyCode ?? key.charCodeAt(0);
  
  return new KeyboardEvent(type, {
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    key: options.key ?? key,
    code: options.code ?? `Key${key.toUpperCase()}`,
    keyCode,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
    repeat: options.repeat ?? false
  });
}

export function createTouchEvent(
  type: string,
  touches: Array<{ x: number; y: number; id?: number }>,
  options: TouchEventOptions = {}
): TouchEvent {
  const touchList = touches.map((touch, index) => ({
    identifier: touch.id ?? index,
    clientX: touch.x,
    clientY: touch.y,
    screenX: touch.x,
    screenY: touch.y,
    pageX: touch.x,
    pageY: touch.y,
    target: options.touches?.[0]?.target || document.body,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1
  })) as unknown as Touch[];
  
  return new TouchEvent(type, {
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    touches: touchList,
    targetTouches: touchList,
    changedTouches: touchList,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false
  });
}

export interface UserAction {
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'keydown' | 'keyup' | 'keypress' | 'touch';
  position?: Vector2;
  key?: string;
  delay?: number;
  options?: MouseEventOptions | KeyboardEventOptions | TouchEventOptions;
}

export function simulateUserInput(
  element: HTMLElement,
  sequence: UserAction[]
): Promise<void> {
  return new Promise(async (resolve) => {
    for (const action of sequence) {
      if (action.delay) {
        await new Promise(r => setTimeout(r, action.delay));
      }
      
      switch (action.type) {
        case 'click':
        case 'mousedown':
        case 'mouseup':
        case 'mousemove':
          if (action.position) {
            const event = createMouseEvent(
              action.type,
              action.position.x,
              action.position.y,
              action.options as MouseEventOptions
            );
            element.dispatchEvent(event);
          }
          break;
          
        case 'keydown':
        case 'keyup':
        case 'keypress':
          if (action.key) {
            const event = createKeyboardEvent(
              action.type,
              action.key,
              action.options as KeyboardEventOptions
            );
            element.dispatchEvent(event);
          }
          break;
          
        case 'touch':
          if (action.position) {
            const event = createTouchEvent(
              'touchstart',
              [{ x: action.position.x, y: action.position.y }],
              action.options as TouchEventOptions
            );
            element.dispatchEvent(event);
          }
          break;
      }
    }
    resolve();
  });
}

export function simulateClick(element: HTMLElement, x: number, y: number): void {
  const mousedown = createMouseEvent('mousedown', x, y);
  const mouseup = createMouseEvent('mouseup', x, y);
  const click = createMouseEvent('click', x, y);
  
  element.dispatchEvent(mousedown);
  element.dispatchEvent(mouseup);
  element.dispatchEvent(click);
}

export function simulateDrag(
  element: HTMLElement,
  start: Vector2,
  end: Vector2,
  steps = 10
): void {
  const mousedown = createMouseEvent('mousedown', start.x, start.y);
  element.dispatchEvent(mousedown);
  
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const mousemove = createMouseEvent('mousemove', x, y);
    element.dispatchEvent(mousemove);
  }
  
  const mouseup = createMouseEvent('mouseup', end.x, end.y);
  element.dispatchEvent(mouseup);
}

export function simulateKeyPress(element: HTMLElement, key: string): void {
  const keydown = createKeyboardEvent('keydown', key);
  const keypress = createKeyboardEvent('keypress', key);
  const keyup = createKeyboardEvent('keyup', key);
  
  element.dispatchEvent(keydown);
  element.dispatchEvent(keypress);
  element.dispatchEvent(keyup);
}

export function simulateKeyHold(
  element: HTMLElement,
  key: string,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    const keydown = createKeyboardEvent('keydown', key);
    element.dispatchEvent(keydown);
    
    const interval = setInterval(() => {
      const repeat = createKeyboardEvent('keydown', key, { repeat: true });
      element.dispatchEvent(repeat);
    }, 50);
    
    setTimeout(() => {
      clearInterval(interval);
      const keyup = createKeyboardEvent('keyup', key);
      element.dispatchEvent(keyup);
      resolve();
    }, duration);
  });
}

export class EventRecorder {
  private events: Event[] = [];
  private listeners: Map<string, EventListener> = new Map();
  
  constructor(private element: HTMLElement) {}
  
  startRecording(eventTypes: string[]): void {
    eventTypes.forEach(type => {
      const listener = (event: Event) => {
        this.events.push(event);
      };
      this.listeners.set(type, listener);
      this.element.addEventListener(type, listener);
    });
  }
  
  stopRecording(): void {
    this.listeners.forEach((listener, type) => {
      this.element.removeEventListener(type, listener);
    });
    this.listeners.clear();
  }
  
  getEvents(): Event[] {
    return [...this.events];
  }
  
  getEventsByType(type: string): Event[] {
    return this.events.filter(e => e.type === type);
  }
  
  clear(): void {
    this.events = [];
  }
  
  expectEventCount(type: string, count: number): void {
    const actualCount = this.getEventsByType(type).length;
    expect(actualCount).toBe(count);
  }
  
  expectEventSequence(expectedTypes: string[]): void {
    const actualTypes = this.events.map(e => e.type);
    expect(actualTypes).toEqual(expectedTypes);
  }
}

export function mockCanvasPointerEvents(canvas: HTMLCanvasElement): {
  simulateCanvasClick: (x: number, y: number) => void;
  simulateCanvasDrag: (start: Vector2, end: Vector2) => void;
  simulateCanvasHover: (x: number, y: number) => void;
} {
  const rect = canvas.getBoundingClientRect();
  
  return {
    simulateCanvasClick: (x: number, y: number) => {
      simulateClick(canvas, x + rect.left, y + rect.top);
    },
    
    simulateCanvasDrag: (start: Vector2, end: Vector2) => {
      simulateDrag(
        canvas,
        { x: start.x + rect.left, y: start.y + rect.top },
        { x: end.x + rect.left, y: end.y + rect.top }
      );
    },
    
    simulateCanvasHover: (x: number, y: number) => {
      const event = createMouseEvent('mousemove', x + rect.left, y + rect.top);
      canvas.dispatchEvent(event);
    }
  };
}