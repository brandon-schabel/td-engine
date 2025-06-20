import { FloatingUIElement } from './FloatingUIElement';
import type { FloatingUIOptions, UIType, UITypeConfig } from './types';
import type { Camera } from '@/systems/Camera';

export class FloatingUIManager {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private container: HTMLDivElement;
  private elements = new Map<string, FloatingUIElement>();
  private activeElements = new Set<FloatingUIElement>();
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;
  private styleElement: HTMLStyleElement | null = null;

  private readonly uiTypes: Record<UIType, UITypeConfig> = {
    healthbar: { zIndex: 100, class: 'floating-healthbar' },
    tooltip: { zIndex: 200, class: 'floating-tooltip' },
    popup: { zIndex: 300, class: 'floating-popup' },
    dialog: { zIndex: 400, class: 'floating-dialog' },
    custom: { zIndex: 150, class: 'floating-custom' }
  };

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.container = this.createContainer();
    this.setupStyles();
    this.setupEventListeners();
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'floating-ui-container';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `;

    // Position container relative to canvas
    const canvasParent = this.canvas.parentElement;
    if (canvasParent) {
      canvasParent.style.position = 'relative';
      canvasParent.appendChild(container);
    } else {
      document.body.appendChild(container);
    }

    return container;
  }

  private setupStyles(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .floating-ui-element {
        position: absolute;
        transform-origin: center;
        transition: opacity 0.2s ease;
        pointer-events: auto;
      }

      .floating-ui-element.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .floating-ui-element.off-screen {
        display: none;
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .floating-popup {
          max-width: 80vw !important;
          font-size: 14px;
        }

        .floating-dialog {
          width: 90vw !important;
          max-height: 80vh !important;
          overflow-y: auto;
        }
      }

      /* Default styles for different UI types */
      .floating-healthbar {
        background: #333;
        border: 2px solid #000;
        border-radius: 4px;
        padding: 2px;
        min-width: 60px;
        height: 12px;
      }

      .floating-healthbar .health-fill {
        height: 100%;
        background: linear-gradient(to bottom, #4CAF50, #388E3C);
        transition: width 0.3s ease;
        border-radius: 2px;
      }

      .floating-healthbar .health-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 2px rgba(0,0,0,0.8);
        pointer-events: none;
      }

      .floating-healthbar.damaged {
        animation: healthbar-flash 0.3s ease;
      }

      @keyframes healthbar-flash {
        0%, 100% { border-color: #000; }
        50% { border-color: #ff0000; box-shadow: 0 0 8px rgba(255,0,0,0.6); }
      }

      .floating-tooltip {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
      }

      .floating-popup {
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        max-width: 300px;
      }

      .floating-dialog {
        background: white;
        border: 2px solid #333;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        min-width: 400px;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  private setupEventListeners(): void {
    // Handle window resize for responsive behavior
    window.addEventListener('resize', () => {
      this.updateAllPositions();
    });

    // Handle canvas resize
    const resizeObserver = new ResizeObserver(() => {
      this.updateAllPositions();
    });
    resizeObserver.observe(this.canvas);
  }

  public create(id: string, type: UIType = 'custom', options: FloatingUIOptions = {}): FloatingUIElement {
    if (this.elements.has(id)) {
      console.warn(`Floating UI element with id "${id}" already exists`);
      return this.elements.get(id)!;
    }

    const element = new FloatingUIElement(id, type, this, options);
    this.elements.set(id, element);
    return element;
  }

  public get(id: string): FloatingUIElement | undefined {
    return this.elements.get(id);
  }

  public remove(id: string): void {
    const element = this.elements.get(id);
    if (element) {
      element.destroy();
      this.elements.delete(id);
      this.activeElements.delete(element);
    }
  }

  public enableAll(): void {
    this.elements.forEach(element => element.enable());
  }

  public disableAll(): void {
    this.elements.forEach(element => element.disable());
  }

  public disableAllExcept(ids: string | string[]): void {
    const exceptSet = new Set(Array.isArray(ids) ? ids : [ids]);
    this.elements.forEach((element, id) => {
      if (!exceptSet.has(id)) {
        element.disable();
      }
    });
  }

  private startUpdateLoop(): void {
    if (this.animationFrame) return;

    const update = (timestamp: number) => {
      const deltaTime = timestamp - this.lastUpdateTime;
      this.lastUpdateTime = timestamp;

      this.activeElements.forEach(element => {
        element.update(deltaTime);
      });

      this.animationFrame = requestAnimationFrame(update);
    };

    this.animationFrame = requestAnimationFrame(update);
  }

  private stopUpdateLoop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public updateAllPositions(): void {
    this.activeElements.forEach(element => {
      element.updatePosition(true);
    });
  }

  public addActiveElement(element: FloatingUIElement): void {
    this.activeElements.add(element);
    if (this.activeElements.size === 1) {
      this.startUpdateLoop();
    }
  }

  public removeActiveElement(element: FloatingUIElement): void {
    this.activeElements.delete(element);
    if (this.activeElements.size === 0) {
      this.stopUpdateLoop();
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContainer(): HTMLDivElement {
    return this.container;
  }

  public getUITypeConfig(type: UIType): UITypeConfig {
    return this.uiTypes[type];
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public destroy(): void {
    // Stop update loop
    this.stopUpdateLoop();

    // Destroy all elements
    this.elements.forEach(element => element.destroy());
    this.elements.clear();
    this.activeElements.clear();

    // Remove container and styles
    this.container.remove();
    this.styleElement?.remove();
  }

  public pause(): void {
    this.stopUpdateLoop();
  }

  public resume(): void {
    if (this.activeElements.size > 0) {
      this.startUpdateLoop();
    }
  }
}