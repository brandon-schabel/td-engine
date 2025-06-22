import type { FloatingUIManager } from './FloatingUIManager';
import type { Entity, FloatingUIOptions, Position, UIType, StoredPosition } from './types';

export class FloatingUIElement {
  public readonly id: string;
  public readonly type: UIType;
  private manager: FloatingUIManager;
  private target: Entity | null = null;
  private enabled = false;
  private element!: HTMLDivElement;

  private options: FloatingUIOptions & {
    offset: { x: number; y: number };
    anchor: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    smoothing: number;
    autoHide: boolean;
    className: string;
    persistent: boolean;
    mobileScale: number;
    zIndex: number;
    screenSpace: boolean;
    draggable: boolean;
    dragHandle?: HTMLElement | string;
    persistPosition: boolean;
    positionKey?: string;
    onDragStart?: (element: any) => void;
    onDrag?: (element: any, x: number, y: number) => void;
    onDragEnd?: (element: any, x: number, y: number) => void;
  };
  private currentPos: Position = { x: 0, y: 0 };
  private targetPos: Position = { x: 0, y: 0 };
  private resizeObserver: ResizeObserver | null = null;
  
  // Drag state
  private isDragging = false;
  private dragStartPos: Position = { x: 0, y: 0 };
  private dragOffset: Position = { x: 0, y: 0 };
  private dragHandle: HTMLElement | null = null;
  private storedPosition: Position | null = null;

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
      draggable: false,
      persistPosition: false,
      ...options
    };

    // Set up resize observer for anchor element if provided
    if (this.options.anchorElement) {
      this.setupAnchorElementObserver();
    }

    this.createElement();
    
    // Set up dragging if enabled
    if (this.options.draggable) {
      this.setupDragHandlers();
    }
    
    // Load persisted position if enabled
    if (this.options.persistPosition) {
      this.loadStoredPosition();
    }
  }

  private createElement(): void {
    this.element = document.createElement('div');
    const typeConfig = this.manager.getUITypeConfig(this.type);

    this.element.className = `floating-ui-element ${typeConfig.class} ${this.options.className}`;
    this.element.style.zIndex = (this.options.zIndex || typeConfig.zIndex).toString();
    this.element.dataset.floatingId = this.id;
    
    // Mark as draggable if enabled
    if (this.options.draggable) {
      this.element.dataset.draggable = 'true';
    }

    // Essential CSS for floating UI elements
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'auto'; // Allow interaction with UI elements
    this.element.style.width = 'auto'; // Don't stretch to full width
    this.element.style.height = 'auto'; // Don't stretch to full height
    this.element.style.display = 'block';
    this.element.style.whiteSpace = 'nowrap'; // Prevent text wrapping for compact elements
    
    // Prevent touch scrolling/zooming when dragging
    if (this.options.draggable) {
      this.element.style.touchAction = 'none';
    }

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
    if (!this.enabled) return;
    
    // Don't update position from target if dragging
    if (this.isDragging) return;
    
    // If we have a stored position and no target, use stored position
    if (this.storedPosition && !this.target) {
      this.currentPos = { ...this.storedPosition };
      this.element.style.left = `${this.currentPos.x}px`;
      this.element.style.top = `${this.currentPos.y}px`;
      return;
    }
    
    if (!this.target) return;
    this.updatePosition();
  }

  public updatePosition(immediate = false): void {
    // If anchored to DOM element, use element position
    if (this.options.anchorElement) {
      this.updatePositionFromAnchorElement(immediate);
      return;
    }

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
        this.applyPositionWithAnchor(screenPos, immediate);
      });
    } else {
      this.applyPositionWithAnchor(screenPos, immediate);
    }
  }

  private applyPositionWithAnchor(screenPos: Position, immediate: boolean): void {
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
      case 'top-left':
        offset.x = -rect.width;
        offset.y = -rect.height;
        break;
      case 'top-right':
        offset.x = 0;
        offset.y = -rect.height;
        break;
      case 'bottom-left':
        offset.x = -rect.width;
        offset.y = 0;
        break;
      case 'bottom-right':
        offset.x = 0;
        offset.y = 0;
        break;
    }

    return offset;
  }

  private setupAnchorElementObserver(): void {
    if (!this.options.anchorElement) return;

    // Observe size and position changes of anchor element
    this.resizeObserver = new ResizeObserver(() => {
      if (this.enabled) {
        this.updatePosition(true);
      }
    });
    this.resizeObserver.observe(this.options.anchorElement);
  }

  private updatePositionFromAnchorElement(immediate: boolean): void {
    if (!this.options.anchorElement) return;

    const anchorRect = this.options.anchorElement.getBoundingClientRect();
    const container = this.manager.getContainer();
    const containerRect = container.getBoundingClientRect();

    // Calculate position relative to anchor element
    let basePos: Position = {
      x: anchorRect.left + anchorRect.width / 2 - containerRect.left,
      y: anchorRect.top + anchorRect.height / 2 - containerRect.top
    };

    // Adjust base position based on anchor point
    switch (this.options.anchor) {
      case 'top':
        basePos.y = anchorRect.top - containerRect.top;
        break;
      case 'bottom':
        basePos.y = anchorRect.bottom - containerRect.top;
        break;
      case 'left':
        basePos.x = anchorRect.left - containerRect.left;
        break;
      case 'right':
        basePos.x = anchorRect.right - containerRect.left;
        break;
      case 'top-left':
        basePos.x = anchorRect.left - containerRect.left;
        basePos.y = anchorRect.top - containerRect.top;
        break;
      case 'top-right':
        basePos.x = anchorRect.right - containerRect.left;
        basePos.y = anchorRect.top - containerRect.top;
        break;
      case 'bottom-left':
        basePos.x = anchorRect.left - containerRect.left;
        basePos.y = anchorRect.bottom - containerRect.top;
        break;
      case 'bottom-right':
        basePos.x = anchorRect.right - containerRect.left;
        basePos.y = anchorRect.bottom - containerRect.top;
        break;
    }

    this.applyPositionWithAnchor(basePos, immediate);
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

    // Handle anchor element change
    if ('anchorElement' in options) {
      // Clean up old observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      // Set up new observer if element provided
      if (options.anchorElement) {
        this.setupAnchorElementObserver();
        // Force immediate position update
        this.updatePosition(true);
      }
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
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
  
  private setupDragHandlers(): void {
    // Determine drag handle
    if (this.options.dragHandle) {
      if (typeof this.options.dragHandle === 'string') {
        // Wait for content to be set before querying for handle
        const observer = new MutationObserver(() => {
          const handle = this.element.querySelector(this.options.dragHandle as string) as HTMLElement;
          if (handle) {
            this.dragHandle = handle;
            this.attachDragListeners();
            observer.disconnect();
          }
        });
        observer.observe(this.element, { childList: true, subtree: true });
      } else {
        this.dragHandle = this.options.dragHandle;
        this.attachDragListeners();
      }
    } else {
      // Use entire element as drag handle
      this.dragHandle = this.element;
      this.attachDragListeners();
    }
  }
  
  private attachDragListeners(): void {
    if (!this.dragHandle) return;
    
    // Add cursor style
    this.dragHandle.style.cursor = 'move';
    
    // Mouse events
    this.dragHandle.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    
    // Touch events
    this.dragHandle.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleDragEnd.bind(this));
  }
  
  private handleDragStart(e: MouseEvent | TouchEvent): void {
    if (!this.enabled) return;
    
    // Only prevent default for touch events to avoid breaking mouse interactions
    if (e instanceof TouchEvent) {
      e.preventDefault();
    }
    
    this.isDragging = true;
    
    // Get initial mouse/touch position
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    
    this.dragStartPos = { x: clientX, y: clientY };
    
    // Get current element position
    const rect = this.element.getBoundingClientRect();
    const containerRect = this.manager.getContainer().getBoundingClientRect();
    
    this.dragOffset = {
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top
    };
    
    // Add dragging class for visual feedback
    this.element.classList.add('dragging');
    this.element.style.opacity = '0.8';
    this.element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    
    // Add touch-specific visual feedback
    if (e instanceof TouchEvent) {
      this.element.style.transform = 'scale(1.05)';
    }
    
    // Call drag start callback
    if (this.options.onDragStart) {
      this.options.onDragStart(this);
    }
  }
  
  private handleDragMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.enabled) return;
    
    // Only prevent default for touch events
    if (e instanceof TouchEvent) {
      e.preventDefault();
      e.stopPropagation(); // Prevent touch events from bubbling to game canvas
    }
    
    // Get current mouse/touch position
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    
    // Calculate new position
    const deltaX = clientX - this.dragStartPos.x;
    const deltaY = clientY - this.dragStartPos.y;
    
    const newX = this.dragOffset.x + deltaX;
    const newY = this.dragOffset.y + deltaY;
    
    // Update position immediately (no smoothing during drag)
    this.currentPos.x = newX;
    this.currentPos.y = newY;
    this.element.style.left = `${newX}px`;
    this.element.style.top = `${newY}px`;
    
    // Call drag callback
    if (this.options.onDrag) {
      this.options.onDrag(this, newX, newY);
    }
  }
  
  private handleDragEnd(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    
    // Only prevent default for touch events
    if (e instanceof TouchEvent) {
      e.preventDefault();
    }
    
    this.isDragging = false;
    
    // Remove dragging class
    this.element.classList.remove('dragging');
    this.element.style.opacity = '';
    this.element.style.boxShadow = '';
    this.element.style.transform = ''; // Reset transform
    
    // Validate position is within bounds
    this.validateAndFixPosition();
    
    // Save position if persistence is enabled
    if (this.options.persistPosition) {
      this.savePosition();
    }
    
    // Update stored position
    this.storedPosition = { ...this.currentPos };
    
    // Call drag end callback
    if (this.options.onDragEnd) {
      this.options.onDragEnd(this, this.currentPos.x, this.currentPos.y);
    }
  }
  
  private validateAndFixPosition(): void {
    const container = this.manager.getContainer();
    const containerRect = container.getBoundingClientRect();
    const elementRect = this.element.getBoundingClientRect();
    
    // Calculate element bounds relative to container
    const elementLeft = this.currentPos.x;
    const elementTop = this.currentPos.y;
    const elementRight = elementLeft + elementRect.width;
    const elementBottom = elementTop + elementRect.height;
    
    // Check if any part is outside container
    let needsReset = false;
    let newX = this.currentPos.x;
    let newY = this.currentPos.y;
    
    // Check horizontal bounds
    if (elementLeft < 0) {
      newX = 10; // Small margin from edge
      needsReset = true;
    } else if (elementRight > containerRect.width) {
      newX = containerRect.width - elementRect.width - 10;
      needsReset = true;
    }
    
    // Check vertical bounds
    if (elementTop < 0) {
      newY = 10;
      needsReset = true;
    } else if (elementBottom > containerRect.height) {
      newY = containerRect.height - elementRect.height - 10;
      needsReset = true;
    }
    
    // Apply position if needs adjustment
    if (needsReset) {
      this.currentPos.x = newX;
      this.currentPos.y = newY;
      this.element.style.left = `${newX}px`;
      this.element.style.top = `${newY}px`;
    }
  }
  
  private savePosition(): void {
    if (!this.options.persistPosition) return;
    
    const key = this.options.positionKey || `floating-ui-position-${this.id}`;
    const position: StoredPosition = {
      x: this.currentPos.x,
      y: this.currentPos.y,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      version: '1.0.0'
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(position));
    } catch (e) {
      console.warn('Failed to save position:', e);
    }
  }
  
  private loadStoredPosition(): void {
    if (!this.options.persistPosition) return;
    
    const key = this.options.positionKey || `floating-ui-position-${this.id}`;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return;
      
      const position: StoredPosition = JSON.parse(stored);
      
      // Validate stored position is for current screen size (with some tolerance)
      const widthRatio = window.innerWidth / position.screenWidth;
      const heightRatio = window.innerHeight / position.screenHeight;
      
      // If screen size changed significantly, adjust position proportionally
      if (Math.abs(widthRatio - 1) > 0.1 || Math.abs(heightRatio - 1) > 0.1) {
        this.storedPosition = {
          x: position.x * widthRatio,
          y: position.y * heightRatio
        };
      } else {
        this.storedPosition = {
          x: position.x,
          y: position.y
        };
      }
      
      // Apply stored position
      this.currentPos = { ...this.storedPosition };
      this.targetPos = { ...this.storedPosition };
      this.element.style.left = `${this.currentPos.x}px`;
      this.element.style.top = `${this.currentPos.y}px`;
      
      // Validate position is still within bounds
      requestAnimationFrame(() => {
        this.validateAndFixPosition();
        if (this.options.persistPosition) {
          this.savePosition();
        }
      });
    } catch (e) {
      console.warn('Failed to load stored position:', e);
    }
  }
  
  public resetPosition(): void {
    // Clear stored position
    this.storedPosition = null;
    
    if (this.options.persistPosition) {
      const key = this.options.positionKey || `floating-ui-position-${this.id}`;
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Failed to clear stored position:', e);
      }
    }
    
    // Reset to default position behavior
    if (this.target) {
      this.updatePosition(true);
    }
  }
}