import { vi } from 'vitest';

export interface MockCanvasRenderingContext2D {
  clearRect: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  strokeText: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
  createLinearGradient: ReturnType<typeof vi.fn>;
  createRadialGradient: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface MockHTMLCanvasElement extends HTMLCanvasElement {
  getContext(contextId: '2d'): MockCanvasRenderingContext2D;
  getContext(contextId: string): RenderingContext | null;
}

export function createMockContext2D(): MockCanvasRenderingContext2D {
  const mockGradient = {
    addColorStop: vi.fn()
  };

  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue(mockGradient),
    createRadialGradient: vi.fn().mockReturnValue(mockGradient),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '12px Arial',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0
  };
}

export function createMockCanvas(width = 800, height = 600): MockHTMLCanvasElement {
  const context = createMockContext2D();
  
  // Store event listeners
  const eventListeners = new Map<string, Set<EventListener>>();
  
  const canvas = {
    width,
    height,
    getContext: vi.fn((contextId: string) => {
      if (contextId === '2d') {
        return context;
      }
      return null;
    }),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, new Set());
      }
      eventListeners.get(type)!.add(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      const listeners = eventListeners.get(type);
      if (listeners) {
        listeners.delete(listener);
      }
    }),
    dispatchEvent: vi.fn((event: Event) => {
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        listeners.forEach(listener => {
          if (typeof listener === 'function') {
            listener(event);
          } else {
            listener.handleEvent(event);
          }
        });
      }
      return true;
    }),
    getBoundingClientRect: vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0
    }),
    style: {} as CSSStyleDeclaration
  } as unknown as MockHTMLCanvasElement;

  return canvas;
}

export function resetCanvasMocks(canvas: MockHTMLCanvasElement): void {
  const ctx = canvas.getContext('2d') as MockCanvasRenderingContext2D;
  
  Object.values(ctx).forEach(value => {
    if (typeof value === 'function' && 'mockClear' in value) {
      value.mockClear();
    }
  });
  
  ctx.fillStyle = '';
  ctx.strokeStyle = '';
  ctx.lineWidth = 1;
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function assertCanvasMethodCalled(
  canvas: MockHTMLCanvasElement,
  methodName: keyof MockCanvasRenderingContext2D,
  times?: number
): void {
  const ctx = canvas.getContext('2d') as MockCanvasRenderingContext2D;
  const method = ctx[methodName];
  
  if (typeof method === 'function' && 'toHaveBeenCalled' in method) {
    if (times !== undefined) {
      expect(method).toHaveBeenCalledTimes(times);
    } else {
      expect(method).toHaveBeenCalled();
    }
  }
}

export function assertCanvasMethodNotCalled(
  canvas: MockHTMLCanvasElement,
  methodName: keyof MockCanvasRenderingContext2D
): void {
  const ctx = canvas.getContext('2d') as MockCanvasRenderingContext2D;
  const method = ctx[methodName];
  
  if (typeof method === 'function' && 'not' in method) {
    expect(method).not.toHaveBeenCalled();
  }
}

export function getCanvasCallHistory(
  canvas: MockHTMLCanvasElement,
  methodName: keyof MockCanvasRenderingContext2D
): any[][] {
  const ctx = canvas.getContext('2d') as MockCanvasRenderingContext2D;
  const method = ctx[methodName];
  
  if (typeof method === 'function' && 'mock' in method) {
    return (method as any).mock.calls;
  }
  
  return [];
}