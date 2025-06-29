import { BaseFloatingUI } from './BaseFloatingUI';
import { Game } from '@/core/Game';
import { calculateMenuPosition } from './floatingUIUtils';
import { cn } from '@/ui/styles/UtilityStyles';

export interface PopupOptions {
  className?: string;
  width?: number;
  height?: number;
  offset?: { x: number; y: number };
  excludeSelectors?: string[];
}

/**
 * Abstract base class for popup-style floating UI components.
 * Provides positioning at specific coordinates with automatic screen bounds checking.
 */
export abstract class BasePopupUI extends BaseFloatingUI {
  protected position: { x: number; y: number } = { x: 0, y: 0 };
  protected anchorElement?: HTMLElement;
  protected options: PopupOptions;
  
  constructor(game: Game, options: PopupOptions = {}) {
    super(game);
    this.options = {
      offset: { x: 0, y: 0 },
      excludeSelectors: ['.ui-control-bar button'],
      ...options
    };
  }
  
  /**
   * Show the popup at specified coordinates or anchored to an element.
   * Parameters are optional to match parent class signature.
   */
  show(x?: number, y?: number, anchorElement?: HTMLElement): void {
    if (x !== undefined && y !== undefined) {
      this.position = { x, y };
    }
    if (anchorElement !== undefined) {
      this.anchorElement = anchorElement;
    }
    super.show();
  }
  
  /**
   * Create the popup UI element with proper positioning.
   */
  create(): void {
    const elementId = this.getPopupId();
    const content = this.createPopupContent();
    
    // Calculate dimensions if not provided
    const width = this.options.width || 300;
    const height = this.options.height || 400;
    
    if (this.anchorElement) {
      // Anchor to element
      this.element = this.floatingUI.create(elementId, 'popup', {
        anchorElement: this.anchorElement,
        anchor: 'top',
        offset: this.options.offset || { x: 0, y: -10 },
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 1000,
        className: cn('popup-ui', this.options.className),
        screenSpace: true
      });
    } else {
      // Position at coordinates
      const position = calculateMenuPosition(
        this.position.x,
        this.position.y,
        width,
        height
      );
      
      this.element = this.floatingUI.create(elementId, 'popup', {
        offset: this.options.offset || { x: 0, y: 0 },
        anchor: 'center',
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 1000,
        className: cn('popup-ui', this.options.className),
        screenSpace: true
      });
      
      // Set position using a pseudo-entity
      const positionEntity = {
        position: position,
        getPosition: () => position
      };
      this.element.setTarget(positionEntity as any);
    }
    
    this.element.setContent(content);
    this.element.enable();
    
    // Set up click-outside handling by default
    this.setupClickOutside(this.options.excludeSelectors);
    
    // Call post-create hook
    this.onPopupCreated();
  }
  
  /**
   * Get the unique ID for this popup. Must be implemented by subclasses.
   */
  protected abstract getPopupId(): string;
  
  /**
   * Create the content for the popup. Must be implemented by subclasses.
   */
  protected abstract createPopupContent(): HTMLElement;
  
  /**
   * Optional hook called after popup is created.
   * Can be overridden by subclasses for additional setup.
   */
  protected onPopupCreated(): void {
    // Default implementation does nothing
  }
  
  /**
   * Hide the popup. Alias for close() for semantic clarity.
   */
  hide(): void {
    this.close();
  }
}