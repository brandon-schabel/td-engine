/**
 * Manages scenes and transitions between them
 */

import { Scene } from './Scene';
import { SceneTransition, TransitionType, type TransitionOptions } from './SceneTransition';
import type { AudioManager } from '@/audio/AudioManager';

export class SceneManager {
  private container: HTMLDivElement;
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private currentSceneName: string | null = null;
  private transition: SceneTransition;
  private audioManager: AudioManager | null = null;
  private updateLoop: number | null = null;
  private lastUpdateTime: number = 0;
  private inputHandlers: {
    keyboard?: (e: KeyboardEvent) => void;
    mouse?: (e: MouseEvent) => void;
    touch?: (e: TouchEvent) => void;
  } = {};

  constructor(container: HTMLDivElement, audioManager?: AudioManager) {
    this.container = container;
    this.audioManager = audioManager || null;
    this.transition = new SceneTransition();
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    // Keyboard handler
    this.inputHandlers.keyboard = (e: KeyboardEvent) => {
      if (this.currentScene) {
        this.currentScene.handleInput(e);
      }
    };

    // Mouse handler
    this.inputHandlers.mouse = (e: MouseEvent) => {
      if (this.currentScene) {
        this.currentScene.handleInput(e);
      }
    };

    // Touch handler
    this.inputHandlers.touch = (e: TouchEvent) => {
      if (this.currentScene) {
        this.currentScene.handleInput(e);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', this.inputHandlers.keyboard);
    window.addEventListener('keyup', this.inputHandlers.keyboard); // Add keyup for proper key release handling
    window.addEventListener('click', this.inputHandlers.mouse);
    window.addEventListener('touchstart', this.inputHandlers.touch);
  }

  /**
   * Register a scene with the manager
   */
  public registerScene(name: string, scene: Scene): void {
    if (this.scenes.has(name)) {
      console.warn(`SceneManager: Scene "${name}" already registered`);
      return;
    }

    this.scenes.set(name, scene);
    this.container.appendChild(scene.getContainer());
  }

  /**
   * Switch to a different scene
   */
  public async switchTo(
    sceneName: string,
    options: TransitionOptions = { type: TransitionType.FADE }
  ): Promise<void> {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`SceneManager: Scene "${sceneName}" not found`);
      return;
    }

    // Don't switch if already on this scene
    if (this.currentSceneName === sceneName) {
      return;
    }

    const oldScene = this.currentScene;
    const oldContainer = oldScene?.getContainer() || null;
    const newContainer = newScene.getContainer();

    // Exit old scene
    if (oldScene) {
      await oldScene.exit();
    }

    // Perform transition
    await this.transition.transition(oldContainer, newContainer, options);

    // Enter new scene
    await newScene.enter();

    // Update current scene
    this.currentScene = newScene;
    this.currentSceneName = sceneName;

    // Start update loop if not already running
    if (!this.updateLoop) {
      this.startUpdateLoop();
    }
  }

  /**
   * Get the current scene name
   */
  public getCurrentSceneName(): string | null {
    return this.currentSceneName;
  }

  /**
   * Get a scene by name
   */
  public getScene(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  /**
   * Get the audio manager
   */
  public getAudioManager(): AudioManager | null {
    return this.audioManager;
  }

  private startUpdateLoop(): void {
    const update = (timestamp: number) => {
      const deltaTime = timestamp - this.lastUpdateTime;
      this.lastUpdateTime = timestamp;

      if (this.currentScene) {
        this.currentScene.update(deltaTime);
      }

      this.updateLoop = requestAnimationFrame(update);
    };

    this.updateLoop = requestAnimationFrame(update);
  }

  private stopUpdateLoop(): void {
    if (this.updateLoop) {
      cancelAnimationFrame(this.updateLoop);
      this.updateLoop = null;
    }
  }

  /**
   * Destroy the scene manager and all scenes
   */
  public destroy(): void {
    // Stop update loop
    this.stopUpdateLoop();

    // Remove event listeners
    if (this.inputHandlers.keyboard) {
      window.removeEventListener('keydown', this.inputHandlers.keyboard);
      window.removeEventListener('keyup', this.inputHandlers.keyboard);
    }
    if (this.inputHandlers.mouse) {
      window.removeEventListener('click', this.inputHandlers.mouse);
    }
    if (this.inputHandlers.touch) {
      window.removeEventListener('touchstart', this.inputHandlers.touch);
    }

    // Destroy all scenes
    this.scenes.forEach(scene => scene.destroy());
    this.scenes.clear();

    // Destroy transition
    this.transition.destroy();

    // Clear references
    this.currentScene = null;
    this.currentSceneName = null;
  }
}