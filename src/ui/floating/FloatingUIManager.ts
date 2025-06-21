import { FloatingUIElement } from './FloatingUIElement';
import type { FloatingUIOptions, UIType, UITypeConfig } from './types';
import type { Camera } from '@/systems/Camera';
import type { Entity } from '@/entities/Entity';
import { initializeAllStyles } from '@/ui/styles';

export class FloatingUIManager {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private container: HTMLDivElement;
  private elements = new Map<string, FloatingUIElement>();
  private activeElements = new Set<FloatingUIElement>();
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;

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
    this.initializeStyles();
    this.setupEventListeners();
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'floating-ui-container';
    // Remove inline styles - use CSS classes instead
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'hidden';

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

  private initializeStyles(): void {
    // Initialize all styles through the centralized style system
    initializeAllStyles();
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

    // Remove container
    this.container.remove();
  }

  public pause(): void {
    this.stopUpdateLoop();
  }

  public resume(): void {
    if (this.activeElements.size > 0) {
      this.startUpdateLoop();
    }
  }

  /**
   * Creates a floating damage number that animates upward and fades out
   * @param entity The entity to show damage for
   * @param damage The damage amount to display
   * @param damageType The type of damage (affects color and size)
   * @returns The created FloatingUIElement
   */
  public createDamageNumber(
    entity: Entity,
    damage: number,
    damageType: 'normal' | 'critical' | 'heal' = 'normal'
  ): FloatingUIElement {
    const id = `damage_${entity.id}_${Date.now()}`;
    
    // Create the damage number element
    const element = this.create(id, 'custom', {
      offset: { x: 0, y: -20 },
      anchor: 'center',
      smoothing: 0, // No smoothing for damage numbers
      autoHide: false,
      className: `damage-number ${damageType}`,
      persistent: false
    });

    // Set the damage text
    const displayDamage = damageType === 'heal' ? `+${damage}` : `-${damage}`;
    element.setContent(displayDamage);
    
    // Set the target and enable
    element.setTarget(entity);
    element.enable();

    // Auto-remove after animation completes (1 second)
    setTimeout(() => {
      this.remove(id);
    }, 1000);

    return element;
  }

  /**
   * Creates a persistent HUD element at a fixed screen position
   * @param id Unique identifier for the HUD element
   * @param options Configuration for the HUD element
   * @returns The created FloatingUIElement
   */
  public createStaticHUD(
    id: string,
    options: {
      position: { x: number; y: number };
      icon?: string;
      getValue: () => string | { value: string; color?: string };
      updateInterval?: number;
    }
  ): FloatingUIElement {
    // Create the HUD element
    const element = this.create(id, 'custom', {
      offset: { x: 0, y: 0 },
      anchor: 'top',
      smoothing: 0,
      autoHide: false,
      className: 'static-hud',
      persistent: true
    });

    // Create a dummy entity for positioning
    const dummyEntity = {
      position: options.position,
      getPosition: () => options.position
    };

    // Build the HUD content
    const updateContent = () => {
      const result = options.getValue();
      const value = typeof result === 'string' ? result : result.value;
      const color = typeof result === 'object' && result.color ? result.color : 'white';

      let content = '';
      if (options.icon) {
        content += `<img src="${options.icon}" alt="" class="hud-icon">`;
      }
      content += `<span class="hud-value" style="color: ${color}">${value}</span>`;
      
      element.setContent(content);
    };

    // Set initial content
    updateContent();

    // Set up auto-update if interval is specified
    if (options.updateInterval && options.updateInterval > 0) {
      const intervalId = setInterval(updateContent, options.updateInterval);
      
      // Store interval ID for cleanup
      (element as any)._updateIntervalId = intervalId;
    }

    // Set the dummy entity as target and enable
    element.setTarget(dummyEntity as Entity);
    element.enable();

    return element;
  }

  /**
   * Creates a centered dialog box
   * @param id Unique identifier for the dialog
   * @param content The dialog content (string or HTMLElement)
   * @param options Configuration for the dialog
   * @returns The created FloatingUIElement
   */
  public createDialog(
    id: string,
    content: string | HTMLElement,
    options: {
      title?: string;
      modal?: boolean;
      closeable?: boolean;
      onClose?: () => void;
      className?: string;
    } = {}
  ): FloatingUIElement {
    // Create modal overlay if requested
    let overlayElement: HTMLDivElement | null = null;
    if (options.modal) {
      overlayElement = document.createElement('div');
      overlayElement.className = 'ui-dialog-overlay ui-fade-in';
      overlayElement.id = `${id}_overlay`;
      this.container.appendChild(overlayElement);
    }

    // Create the dialog element
    const element = this.create(id, 'dialog', {
      offset: { x: 0, y: 0 },
      anchor: 'center',
      smoothing: 0,
      autoHide: false,
      className: `ui-dialog ui-scale-in ${options.className || ''}`,
      persistent: true,
      zIndex: 1000
    });

    // Build dialog content
    let dialogHTML = '';
    
    // Add header if title or closeable
    if (options.title || options.closeable) {
      dialogHTML += '<div class="ui-dialog-header">';
      if (options.title) {
        dialogHTML += `<h2 class="ui-dialog-title">${options.title}</h2>`;
      }
      if (options.closeable) {
        dialogHTML += '<button class="ui-button small" data-dialog-close>×</button>';
      }
      dialogHTML += '</div>';
    }

    // Add content
    dialogHTML += '<div class="ui-dialog-content ui-scrollable"></div>';

    element.setContent(dialogHTML);

    // Set the actual content
    const contentElement = element.getElement().querySelector('.ui-dialog-content');
    if (contentElement) {
      if (typeof content === 'string') {
        contentElement.innerHTML = content;
      } else {
        contentElement.appendChild(content);
      }
    }

    // Add close functionality
    if (options.closeable) {
      const closeButton = element.getElement().querySelector('[data-dialog-close]');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          if (options.onClose) {
            options.onClose();
          }
          this.remove(id);
          if (overlayElement) {
            overlayElement.remove();
          }
        });
      }

      // Close on overlay click if modal
      if (overlayElement) {
        overlayElement.addEventListener('click', (e) => {
          if (e.target === overlayElement) {
            if (options.onClose) {
              options.onClose();
            }
            this.remove(id);
            overlayElement.remove();
          }
        });
      }
    }

    // Position in center of screen
    const centerEntity = {
      position: {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2
      },
      getPosition: () => ({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2
      })
    };

    element.setTarget(centerEntity as Entity);
    element.enable();

    // Store overlay reference for cleanup
    (element as any)._overlayElement = overlayElement;

    return element;
  }

  // Override remove to handle cleanup of intervals and overlays
  public remove(id: string): void {
    const element = this.elements.get(id);
    if (element) {
      // Clear any update interval
      const intervalId = (element as any)._updateIntervalId;
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Remove any overlay
      const overlayElement = (element as any)._overlayElement;
      if (overlayElement) {
        overlayElement.remove();
      }

      // Call parent remove
      element.destroy();
      this.elements.delete(id);
      this.activeElements.delete(element);
    }
  }
}