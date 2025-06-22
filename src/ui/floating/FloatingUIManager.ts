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
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none'; // Allow click-through to canvas

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
    
    // Calculate damage tier based on value
    let tierClass = '';
    let fontSize = 'text-base';
    let animation = 'animate-damage-float';
    let filterClass = '';
    
    if (damageType === 'heal') {
      tierClass = 'text-damage-heal';
    } else if (damageType === 'critical') {
      tierClass = 'text-damage-critical';
      fontSize = 'text-lg';
      animation = 'animate-damage-float-critical';
    } else {
      // Normal damage tiers
      if (damage <= 10) {
        tierClass = 'text-damage-tier-1';
      } else if (damage <= 30) {
        tierClass = 'text-damage-tier-2';
      } else if (damage <= 50) {
        tierClass = 'text-damage-tier-3';
      } else if (damage <= 90) {
        tierClass = 'text-damage-tier-4';
      } else if (damage <= 150) {
        tierClass = 'text-damage-tier-5';
        fontSize = 'text-lg';
      } else if (damage <= 250) {
        tierClass = 'text-damage-tier-6';
        fontSize = 'text-lg';
        filterClass = 'filter-drop-shadow-tier-6';
      } else {
        tierClass = 'text-damage-tier-7';
        fontSize = 'text-xl';
        filterClass = 'filter-drop-shadow-tier-7';
        animation = 'animate-damage-float-epic';
      }
    }
    
    // Build the class string
    const className = [
      'absolute',
      fontSize,
      'font-bold',
      'pointer-events-none',
      'z-50',
      'text-shadow-damage',
      tierClass,
      animation,
      filterClass
    ].filter(Boolean).join(' ');
    
    // Create the damage number element
    const element = this.create(id, 'custom', {
      offset: { x: 0, y: -20 },
      anchor: 'center',
      smoothing: 0, // No smoothing for damage numbers
      autoHide: false,
      className,
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
   * Add click-outside-to-close behavior to an element
   * @param element The floating UI element
   * @param onClose Callback when clicking outside
   * @param excludeSelectors Optional CSS selectors to exclude from click detection
   */
  public addClickOutsideHandler(
    element: FloatingUIElement, 
    onClose: () => void,
    excludeSelectors: string[] = []
  ): () => void {
    let isClosing = false;
    
    const clickHandler = (event: MouseEvent | TouchEvent) => {
      // Prevent double-closing
      if (isClosing) return;
      
      const target = event.target as HTMLElement;
      const elementDom = element.getElement();
      
      if (!elementDom || !element.isEnabled()) return;
      
      // Check if click is inside the element
      if (elementDom.contains(target)) return;
      
      // Check if click is on an excluded element
      for (const selector of excludeSelectors) {
        const excludedElement = target.closest(selector);
        if (excludedElement) {
          return;
        }
      }
      
      // Check if clicking on UI elements (not game canvas)
      if (target.closest('.floating-ui-container') || 
          target.closest('.ui-control-bar') ||
          target.closest('.static-hud') ||
          target.closest('.mobile-controls')) {
        // If clicking another floating element, don't close
        const clickedFloatingElement = target.closest('.floating-ui-element');
        if (clickedFloatingElement && clickedFloatingElement !== elementDom) {
          return;
        }
      }
      
      // Only close if clicking on the game canvas or empty space
      const isGameCanvas = target.tagName === 'CANVAS' || target.closest('#game-canvas');
      const isEmptySpace = target === document.body || target.closest('#app-container');
      
      if (!isGameCanvas && !isEmptySpace) {
        return;
      }
      
      // Mark as closing to prevent multiple calls
      isClosing = true;
      
      // Close the element
      setTimeout(() => {
        onClose();
      }, 0);
    };
    
    // Add listener after a small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      // Use capture phase to catch events before they're stopped
      document.addEventListener('mousedown', clickHandler, true);
      document.addEventListener('touchstart', clickHandler, { capture: true, passive: true });
    }, 300); // Increased delay to ensure menu is fully open
    
    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', clickHandler, true);
      document.removeEventListener('touchstart', clickHandler, true);
    };
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
      // Remove any existing overlay with the same ID to prevent duplicates
      const existingOverlay = document.getElementById(`${id}_overlay`);
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      overlayElement = document.createElement('div');
      overlayElement.className = 'ui-dialog-overlay ui-fade-in';
      overlayElement.id = `${id}_overlay`;
      this.container.appendChild(overlayElement);
    }

    // Create the dialog element with screen space positioning
    const element = this.create(id, 'dialog', {
      offset: { x: 0, y: 0 },
      anchor: 'center',
      smoothing: 0,
      autoHide: false,
      className: `ui-dialog ui-scale-in ${options.className || ''}`,
      persistent: true,
      screenSpace: true, // Use screen space for dialogs
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

    // Position in center of viewport (not canvas)
    const centerEntity = {
      position: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      },
      getPosition: () => ({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
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

  /**
   * Creates a health bar for an entity that follows it
   * @param entity The entity to track
   * @param options Health bar configuration
   * @returns The created FloatingUIElement
   */
  public createHealthBar(
    entity: Entity & { health: number; maxHealth?: number; getMaxHealth?: () => number },
    options: {
      width?: number;
      height?: number;
      offset?: { x: number; y: number };
      showValue?: boolean;
      color?: string;
      backgroundColor?: string;
    } = {}
  ): FloatingUIElement {
    const id = `healthbar_${entity.id || Math.random().toString(36).substr(2, 9)}`;
    
    
    // Default options
    const config = {
      width: 60,
      height: 6,
      offset: { x: 0, y: -30 },
      showValue: false,
      color: '#4CAF50',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      ...options
    };
    
    // Create the health bar element
    const element = this.create(id, 'healthbar', {
      offset: config.offset,
      anchor: 'bottom',
      smoothing: 0.1,
      autoHide: false, // Don't auto-hide health bars
      className: 'entity-healthbar',
      persistent: false,
      screenSpace: false // Health bars follow world entities
    });
    
    // Update health bar content
    const updateHealthBar = () => {
      const maxHealth = entity.maxHealth || (entity.getMaxHealth ? entity.getMaxHealth() : 100);
      const healthPercent = Math.max(0, Math.min(100, (entity.health / maxHealth) * 100));
      
      let html = `
        <div class="healthbar-container" style="
          width: ${config.width}px;
          height: ${config.height}px;
          background: ${config.backgroundColor};
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        ">
          <div class="healthbar-fill" style="
            width: ${healthPercent}%;
            height: 100%;
            background: ${healthPercent > 50 ? config.color : healthPercent > 25 ? '#FF9800' : '#F44336'};
            transition: width 0.3s ease;
          "></div>
      `;
      
      if (config.showValue) {
        html += `
          <div class="healthbar-text" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: ${Math.min(10, config.height - 2)}px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 2px rgba(0,0,0,0.8);
          ">${entity.health}/${maxHealth}</div>
        `;
      }
      
      html += '</div>';
      
      element.setContent(html);
    };
    
    // Initial update
    updateHealthBar();
    
    // Set up periodic updates
    const intervalId = setInterval(updateHealthBar, 100);
    (element as any)._updateIntervalId = intervalId;
    
    // Set the target and enable
    element.setTarget(entity);
    element.enable();
    
    return element;
  }

  /**
   * Creates a floating UI element at a specific screen position
   * @param id Unique identifier
   * @param screenPos Screen position
   * @param content Content to display
   * @param options Additional options
   */
  public createScreenSpaceElement(
    id: string,
    screenPos: { x: number; y: number },
    content: string | HTMLElement,
    options: FloatingUIOptions = {}
  ): FloatingUIElement {
    const element = this.create(id, 'custom', {
      ...options,
      screenSpace: true
    });
    
    // Create screen position entity
    const positionEntity = {
      position: screenPos,
      getPosition: () => screenPos
    };
    
    element.setTarget(positionEntity as Entity);
    element.setContent(content);
    element.enable();
    
    return element;
  }
  
  /**
   * Constrains a position to ensure an element stays within screen bounds
   * @param position The desired position
   * @param size The size of the element (width and height)
   * @param padding Minimum padding from screen edges
   * @returns Constrained position
   */
  public constrainToScreen(
    position: { x: number; y: number },
    size: { width: number; height: number },
    padding: number = 10
  ): { x: number; y: number } {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate bounds
    const minX = size.width / 2 + padding;
    const maxX = screenWidth - size.width / 2 - padding;
    const minY = size.height / 2 + padding;
    const maxY = screenHeight - size.height / 2 - padding;
    
    // Constrain position
    return {
      x: Math.max(minX, Math.min(position.x, maxX)),
      y: Math.max(minY, Math.min(position.y, maxY))
    };
  }
  
  /**
   * Calculates the best position for a menu anchored to a button
   * @param buttonRect The button's bounding rectangle
   * @param menuSize The menu's size
   * @param preferredAnchor Preferred anchor direction
   * @returns Calculated position and anchor
   */
  public calculateMenuPosition(
    buttonRect: DOMRect,
    menuSize: { width: number; height: number },
    preferredAnchor: 'top' | 'bottom' | 'left' | 'right' = 'top'
  ): { position: { x: number; y: number }; anchor: string } {
    const padding = 10;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate center of button
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Try preferred anchor first
    let position = { x: buttonCenterX, y: buttonCenterY };
    let finalAnchor = preferredAnchor;
    
    switch (preferredAnchor) {
      case 'top':
        position.y = buttonRect.top - menuSize.height / 2 - padding;
        break;
      case 'bottom':
        position.y = buttonRect.bottom + menuSize.height / 2 + padding;
        break;
      case 'left':
        position.x = buttonRect.left - menuSize.width / 2 - padding;
        break;
      case 'right':
        position.x = buttonRect.right + menuSize.width / 2 + padding;
        break;
    }
    
    // Check if menu fits with preferred anchor
    const fits = (
      position.x - menuSize.width / 2 >= padding &&
      position.x + menuSize.width / 2 <= screenWidth - padding &&
      position.y - menuSize.height / 2 >= padding &&
      position.y + menuSize.height / 2 <= screenHeight - padding
    );
    
    // If it doesn't fit, try opposite anchor
    if (!fits) {
      switch (preferredAnchor) {
        case 'top':
          if (buttonRect.bottom + menuSize.height + padding * 2 <= screenHeight) {
            position.y = buttonRect.bottom + menuSize.height / 2 + padding;
            finalAnchor = 'bottom';
          }
          break;
        case 'bottom':
          if (buttonRect.top - menuSize.height - padding * 2 >= 0) {
            position.y = buttonRect.top - menuSize.height / 2 - padding;
            finalAnchor = 'top';
          }
          break;
      }
    }
    
    // Constrain to screen bounds
    position = this.constrainToScreen(position, menuSize, padding);
    
    return { position, anchor: finalAnchor };
  }
}