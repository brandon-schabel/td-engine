import type { FloatingUIManager } from './FloatingUIManager';
import type { Entity, FloatingUIOptions, Position, UIType } from './types';

export class FloatingUIElement {
  public readonly id: string;
  public readonly type: UIType;
  private manager: FloatingUIManager;
  private target: Entity | null = null;
  private enabled = false;
  private element!: HTMLDivElement;

  private options: Required<FloatingUIOptions>;
  private currentPos: Position = { x: 0, y: 0 };
  private targetPos: Position = { x: 0, y: 0 };

  constructor(id: string, type: UIType, manager: FloatingUIManager, options: FloatingUIOptions = {}) {
    this.id = id;
    this.type = type;
    this.manager = manager;

    // Set default options
    this.options = {
      offset: { x: 0, y: -20 },
      anchor: 'bottom',
      smoothing: 0.15,
      autoHide: true,
      className: '',
      persistent: false,
      mobileScale: 0.8,
      zIndex: 0,
      screenSpace: false,
      ...options
    };

    this.createElement();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    const typeConfig = this.manager.getUITypeConfig(this.type);

    this.element.className = `floating-ui-element ${typeConfig.class} ${this.options.className}`;
    this.element.style.zIndex = (this.options.zIndex || typeConfig.zIndex).toString();
    this.element.dataset.floatingId = this.id;

    // Essential CSS for floating UI elements
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'auto'; // Allow interaction with UI elements
    this.element.style.width = 'auto'; // Don't stretch to full width
    this.element.style.height = 'auto'; // Don't stretch to full height
    this.element.style.display = 'block';
    this.element.style.whiteSpace = 'nowrap'; // Prevent text wrapping for compact elements

    // Apply mobile scaling if on mobile device
    if (this.isMobile()) {
      this.element.style.transform = `scale(${this.options.mobileScale})`;
    }

    this.manager.getContainer().appendChild(this.element);
  }

  public setContent(content: string | HTMLElement): this {
    if (typeof content === 'string') {
      this.element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.element.innerHTML = '';
      this.element.appendChild(content);
    }
    return this;
  }

  public setTarget(entity: Entity | null, offset?: Partial<Position>): this {
    this.target = entity;
    if (offset) {
      this.options.offset = { ...this.options.offset, ...offset };
    }
    return this;
  }

  public enable(): this {
    if (this.enabled) return this;

    this.enabled = true;
    this.element.classList.remove('hidden');
    this.manager.addActiveElement(this);
    this.updatePosition(true); // Force immediate position update

    return this;
  }

  public disable(): this {
    if (!this.enabled) return this;

    this.enabled = false;
    this.element.classList.add('hidden');
    this.manager.removeActiveElement(this);

    return this;
  }

  public toggle(): this {
    return this.enabled ? this.disable() : this.enable();
  }

  public update(_deltaTime: number): void {
    if (!this.enabled || !this.target) return;
    this.updatePosition();
  }

  public updatePosition(immediate = false): void {
    if (!this.target) return;

    // Get canvas bounds
    const canvas = this.manager.getCanvas();
    const canvasRect = canvas.getBoundingClientRect();

    // Get container bounds for coordinate adjustment
    const container = this.manager.getContainer();
    const containerRect = container.getBoundingClientRect();

    let screenPos: Position;

    if (this.options.screenSpace) {
      // For screen-space positioning, use the target position directly
      if ('x' in this.target && 'y' in this.target && typeof this.target.x === 'number' && typeof this.target.y === 'number') {
        screenPos = { x: this.target.x, y: this.target.y };
      } else if (this.target.position) {
        screenPos = { x: this.target.position.x, y: this.target.position.y };
      } else if (typeof this.target.getPosition === 'function') {
        screenPos = this.target.getPosition();
      } else {
        screenPos = { x: 0, y: 0 };
      }
    } else {
      // Calculate world to screen position
      screenPos = this.worldToScreen(this.target);

      // Account for canvas position within its parent
      // The floating UI container is positioned relative to the canvas parent,
      // but screen coordinates are relative to the canvas itself

      // Adjust screen position to account for any offset between container and canvas
      screenPos.x += canvasRect.left - containerRect.left;
      screenPos.y += canvasRect.top - containerRect.top;
    }

    // Check if entity is off-screen (only for world-space entities)
    if (!this.options.screenSpace && this.isOffScreen(screenPos, canvasRect)) {
      this.element.classList.add('off-screen');
      return;
    } else {
      this.element.classList.remove('off-screen');
    }

    // For immediate positioning or when element has no content yet, defer anchor calculation
    if (immediate && this.element.innerHTML.length > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        this.applyPositionWithAnchor(screenPos, immediate, canvasRect, containerRect);
      });
    } else {
      this.applyPositionWithAnchor(screenPos, immediate, canvasRect, containerRect);
    }
  }

  private applyPositionWithAnchor(screenPos: Position, immediate: boolean, canvasRect: DOMRect, containerRect: DOMRect): void {
    // Calculate anchor offset
    const anchorOffset = this.calculateAnchorOffset();

    // Set target position
    this.targetPos.x = screenPos.x + this.options.offset.x + anchorOffset.x;
    this.targetPos.y = screenPos.y + this.options.offset.y + anchorOffset.y;

    // Smooth interpolation or immediate positioning
    if (immediate || this.options.smoothing === 0) {
      this.currentPos.x = this.targetPos.x;
      this.currentPos.y = this.targetPos.y;
    } else {
      this.currentPos.x += (this.targetPos.x - this.currentPos.x) * this.options.smoothing;
      this.currentPos.y += (this.targetPos.y - this.currentPos.y) * this.options.smoothing;
    }

    // Apply position
    this.element.style.left = `${this.currentPos.x}px`;
    this.element.style.top = `${this.currentPos.y}px`;
  }

  private worldToScreen(entity: Entity): Position {
    let worldPos: Position;

    // If entity has x, y properties (common pattern)
    if ('x' in entity && 'y' in entity && typeof entity.x === 'number' && typeof entity.y === 'number') {
      worldPos = { x: entity.x, y: entity.y };
    }
    // If entity has position property
    else if (entity.position) {
      worldPos = { x: entity.position.x, y: entity.position.y };
    }
    // If entity has getPosition method
    else if (typeof entity.getPosition === 'function') {
      worldPos = entity.getPosition();
    }
    else {
      console.warn('Entity does not have recognizable position properties');
      worldPos = { x: 0, y: 0 };
    }

    // Transform world position to screen position using camera
    const camera = this.manager.getCamera();
    const screenPos = camera.worldToScreen(worldPos);

    return screenPos;
  }

  private isOffScreen(screenPos: Position, canvasRect: DOMRect): boolean {
    if (!this.options.autoHide) return false;

    const margin = 50; // Allow some margin before hiding
    return (
      screenPos.x < -margin ||
      screenPos.x > canvasRect.width + margin ||
      screenPos.y < -margin ||
      screenPos.y > canvasRect.height + margin
    );
  }

  private calculateAnchorOffset(): Position {
    const rect = this.element.getBoundingClientRect();
    const offset: Position = { x: 0, y: 0 };

    // If element has no dimensions, don't apply anchor offset
    if (rect.width === 0 || rect.height === 0) {
      return offset;
    }

    switch (this.options.anchor) {
      case 'top':
        offset.x = -rect.width / 2;
        offset.y = -rect.height;
        break;
      case 'bottom':
        offset.x = -rect.width / 2;
        offset.y = 0;
        break;
      case 'left':
        offset.x = -rect.width;
        offset.y = -rect.height / 2;
        break;
      case 'right':
        offset.x = 0;
        offset.y = -rect.height / 2;
        break;
      case 'center':
        offset.x = -rect.width / 2;
        offset.y = -rect.height / 2;
        break;
    }

    return offset;
  }

  private isMobile(): boolean {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  public setOptions(options: Partial<FloatingUIOptions>): this {
    this.options = { ...this.options, ...options } as Required<FloatingUIOptions>;

    // Update mobile scaling if changed
    if (this.isMobile() && 'mobileScale' in options) {
      this.element.style.transform = `scale(${this.options.mobileScale})`;
    }

    // Update z-index if changed
    if ('zIndex' in options) {
      this.element.style.zIndex = this.options.zIndex.toString();
    }

    return this;
  }

  public addClass(className: string): this {
    this.element.classList.add(className);
    return this;
  }

  public removeClass(className: string): this {
    this.element.classList.remove(className);
    return this;
  }

  public on(event: string, handler: EventListener): this {
    this.element.addEventListener(event, handler);
    return this;
  }

  public off(event: string, handler: EventListener): this {
    this.element.removeEventListener(event, handler);
    return this;
  }

  public destroy(): void {
    this.disable();
    this.element.remove();
  }

  public getElement(): HTMLDivElement {
    return this.element;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getTarget(): Entity | null {
    return this.target;
  }
}