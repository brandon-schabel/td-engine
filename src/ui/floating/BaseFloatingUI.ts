import { Game } from '@/core/Game';
import { FloatingUIManager, FloatingUIElement } from '@/ui/floating/index';
import { SmartUpdater, type UpdateFunctions } from './SmartUpdater';

/**
 * Abstract base class for all floating UI components.
 * Provides common lifecycle methods and utilities for managing floating UI elements.
 */
export abstract class BaseFloatingUI {
  protected game: Game;
  protected floatingUI: FloatingUIManager;
  protected element: FloatingUIElement | null = null;
  protected updateInterval: number | null = null;
  protected clickOutsideCleanup: (() => void) | null = null;
  protected smartUpdaters: Map<string, SmartUpdater<any>> = new Map();
  protected isDestroyed: boolean = false;
  protected clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  
  constructor(game: Game) {
    this.game = game;
    this.floatingUI = game.getFloatingUIManager();
  }
  
  /**
   * Create the UI element. Must be implemented by subclasses.
   */
  abstract create(): void;
  
  /**
   * Update the content of the UI. Must be implemented by subclasses.
   */
  abstract updateContent(): void;
  
  /**
   * Show the UI element. Destroys any existing instance first.
   */
  show(): void {
    this.destroy(); // Clean up any existing instance
    this.isDestroyed = false; // Reset the flag since we're showing again
    this.create();
    this.updateContent();
  }
  
  /**
   * Close the UI element and clean up resources.
   */
  close(): void {
    try {
      this.cleanupInterval();
      this.cleanupClickOutside();
      
      if (this.element) {
        const elementId = this.element.id;
        this.element = null; // Clear reference first
        this.floatingUI.remove(elementId);
      }
    } catch (error) {
      console.error('[BaseFloatingUI] Error during close:', error);
    }
    
    // Don't set isDestroyed here - only destroy() should do that
  }
  
  /**
   * Destroy the UI element. Alias for close() for backward compatibility.
   */
  destroy(): void {
    // Always attempt cleanup, even if already destroyed
    // This ensures we handle cases where the first destroy attempt failed
    this.isDestroyed = true;
    this.cleanupSmartUpdaters();
    this.close();
  }
  
  /**
   * Set up click-outside handler to close the UI when clicking outside of it.
   * @param excludeSelectors - Array of CSS selectors to exclude from click-outside detection
   */
  protected setupClickOutside(excludeSelectors: string[] = []): void {
    if (!this.element) return;
    
    this.clickOutsideCleanup = this.floatingUI.addClickOutsideHandler(
      this.element,
      () => this.close(),
      excludeSelectors
    );
  }
  
  /**
   * Set up periodic content updates.
   * @param interval - Update interval in milliseconds
   */
  protected setupPeriodicUpdate(interval: number): void {
    this.cleanupInterval();
    
    this.updateInterval = window.setInterval(() => {
      if (this.element) {
        this.updateContent();
      }
    }, interval);
  }
  
  /**
   * Clean up the update interval.
   */
  protected cleanupInterval(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Clean up click-outside handler.
   */
  protected cleanupClickOutside(): void {
    if (this.clickOutsideCleanup) {
      this.clickOutsideCleanup();
      this.clickOutsideCleanup = null;
    }
  }
  
  /**
   * Check if the UI is currently visible.
   */
  isVisible(): boolean {
    return this.element !== null;
  }
  
  /**
   * Set up a SmartUpdater for efficient DOM updates.
   * @param key - Unique key for this updater
   * @param updateFunctions - Update functions for each property
   * @returns The created SmartUpdater instance
   */
  protected setupSmartUpdater<T extends Record<string, any>>(
    key: string,
    updateFunctions: UpdateFunctions<T>
  ): SmartUpdater<T> {
    const updater = new SmartUpdater<T>(updateFunctions);
    this.smartUpdaters.set(key, updater);
    return updater;
  }
  
  /**
   * Get a SmartUpdater by key.
   */
  protected getSmartUpdater<T extends Record<string, any>>(key: string): SmartUpdater<T> | undefined {
    return this.smartUpdaters.get(key);
  }
  
  /**
   * Clean up all SmartUpdaters.
   */
  protected cleanupSmartUpdaters(): void {
    this.smartUpdaters.forEach(updater => updater.reset());
    this.smartUpdaters.clear();
  }
}