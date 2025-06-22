/**
 * Base class for all scenes in the game
 * Scenes represent full-screen UI states like menus, game, etc.
 */

import type { SceneManager } from './SceneManager';
import { cn } from '@/ui/styles/UtilityStyles';

export abstract class Scene {
  protected manager: SceneManager;
  protected container: HTMLDivElement;
  protected isActive: boolean = false;

  constructor(manager: SceneManager) {
    this.manager = manager;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full',
      'flex',
      'flex-col',
      'bg-surface-primary'
    );
    container.style.display = 'none';
    return container;
  }

  /**
   * Called when the scene is about to become active
   * Override to set up scene-specific content
   */
  public async enter(): Promise<void> {
    this.isActive = true;
    this.container.style.display = 'flex';
    await this.onEnter();
  }

  /**
   * Called when the scene is about to become inactive
   * Override to clean up scene-specific resources
   */
  public async exit(): Promise<void> {
    await this.onExit();
    this.isActive = false;
    this.container.style.display = 'none';
  }

  /**
   * Update the scene (called every frame when active)
   * Override for scenes that need continuous updates
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;
    this.onUpdate(deltaTime);
  }

  /**
   * Handle input events
   * Override to handle scene-specific input
   */
  public handleInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (!this.isActive) return;
    this.onInput(event);
  }

  /**
   * Get the scene's container element
   */
  public getContainer(): HTMLDivElement {
    return this.container;
  }

  /**
   * Destroy the scene and clean up resources
   */
  public destroy(): void {
    this.onDestroy();
    this.container.remove();
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onEnter(): Promise<void>;
  protected abstract onExit(): Promise<void>;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void;
  protected abstract onDestroy(): void;
}