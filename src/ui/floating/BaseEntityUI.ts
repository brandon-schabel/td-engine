import { BaseFloatingUI } from './BaseFloatingUI';
import { Game } from '@/core/Game';
import { Entity } from '@/entities/Entity';
import { cn } from '@/ui/styles/UtilityStyles';

export interface EntityUIOptions {
  className?: string;
  offset?: { x: number; y: number };
  excludeSelectors?: string[];
  smoothing?: number;
  zIndex?: number;
}

/**
 * Abstract base class for UI components that follow entities.
 * Provides entity tracking and positioning functionality.
 */
export abstract class BaseEntityUI extends BaseFloatingUI {
  protected targetEntity: Entity | null = null;
  protected options: EntityUIOptions;
  
  constructor(game: Game, options: EntityUIOptions = {}) {
    super(game);
    this.options = {
      offset: { x: 0, y: 0 },
      excludeSelectors: [],
      smoothing: 0,
      zIndex: 1100,
      ...options
    };
  }
  
  /**
   * Show the UI for a specific entity.
   */
  showForEntity(entity: Entity): void {
    // Set the target entity
    this.targetEntity = entity;
    
    // Use the parent show() method which handles the lifecycle properly
    this.show();
  }
  
  /**
   * Override show to handle entity preservation during lifecycle.
   */
  show(): void {
    // Set a flag to indicate we're in the middle of showing
    this._isShowing = true;
    
    // Call parent show which will destroy then create
    super.show();
    
    // Clear the flag
    this._isShowing = false;
  }
  
  private _isShowing = false;
  
  /**
   * Create the UI element following the target entity.
   */
  create(): void {
    if (!this.targetEntity) {
      console.log('[BaseEntityUI] create() called but no target entity');
      return;
    }
    console.log('[BaseEntityUI] create() called with target entity:', this.targetEntity);
    
    const elementId = this.getEntityUIId();
    const content = this.createEntityUIContent();
    
    this.element = this.floatingUI.create(elementId, 'custom', {
      offset: this.options.offset,
      anchor: 'top',
      smoothing: this.options.smoothing,
      autoHide: false,
      persistent: true,
      zIndex: this.options.zIndex,
      className: cn('entity-ui', this.options.className)
    });
    
    this.element.setTarget(this.targetEntity);
    this.element.setContent(content);
    this.element.enable();
    
    console.log('[BaseEntityUI] Element created and enabled:', this.element);
    
    // Set up click-outside handling if excludeSelectors provided
    if (this.options.excludeSelectors && this.options.excludeSelectors.length > 0) {
      this.setupClickOutside(this.options.excludeSelectors);
    }
    
    // Call post-create hook
    this.onEntityUICreated();
  }
  
  /**
   * Update the target entity.
   */
  protected updateTargetEntity(entity: Entity | null): void {
    this.targetEntity = entity;
    if (this.element && entity) {
      this.element.setTarget(entity);
    }
  }
  
  /**
   * Get the current target entity.
   */
  protected getTargetEntity(): Entity | null {
    return this.targetEntity;
  }
  
  /**
   * Clear the target entity.
   */
  protected clearTargetEntity(): void {
    this.targetEntity = null;
  }
  
  /**
   * Get the unique ID for this entity UI. Must be implemented by subclasses.
   */
  protected abstract getEntityUIId(): string;
  
  /**
   * Create the content for the entity UI. Must be implemented by subclasses.
   */
  protected abstract createEntityUIContent(): HTMLElement;
  
  /**
   * Optional hook called after entity UI is created.
   * Can be overridden by subclasses for additional setup.
   */
  protected onEntityUICreated(): void {
    // Default implementation does nothing
  }
  
  /**
   * Hide the UI (keeps entity reference).
   */
  hide(): void {
    if (this.element) {
      this.element.disable();
    }
  }
  
  /**
   * Check if UI is shown for a specific entity.
   */
  isShowingForEntity(entity: Entity): boolean {
    return this.targetEntity === entity && this.isVisible();
  }
  
  destroy(): void {
    // Don't clear target entity if we're in the middle of showing
    if (!this._isShowing) {
      this.clearTargetEntity();
    }
    super.destroy();
  }
}