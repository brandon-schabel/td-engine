/**
 * Base interface and abstract class for configuration tab renderers
 * Extracted from monolithic ConfigurationMenu.ts to promote modular tab management
 */

import type { GameConfiguration } from '../../config/GameConfiguration';
import { ConfigurationState } from '../ConfigurationState';

export interface TabRenderer {
  readonly tabId: string;
  readonly tabTitle: string;
  readonly tabDescription?: string;
  
  render(container: HTMLDivElement): void;
  onActivate?(): void;
  onDeactivate?(): void;
  validate?(): boolean;
  getErrors?(): string[];
}

export abstract class BaseTabRenderer implements TabRenderer {
  public abstract readonly tabId: string;
  public abstract readonly tabTitle: string;
  public readonly tabDescription?: string;

  protected configState: ConfigurationState;
  protected currentConfig: GameConfiguration;

  constructor(configState: ConfigurationState) {
    this.configState = configState;
    this.currentConfig = configState.getConfiguration();
    
    // Listen for configuration changes
    configState.addChangeListener((config) => {
      this.currentConfig = config;
      this.onConfigurationChanged(config);
    });
  }

  public abstract render(container: HTMLDivElement): void;

  protected onConfigurationChanged(config: GameConfiguration): void {
    // Override in subclasses if needed
  }

  public onActivate(): void {
    // Override in subclasses if needed
  }

  public onDeactivate(): void {
    // Override in subclasses if needed
  }

  public validate(): boolean {
    return true; // Override in subclasses for validation
  }

  public getErrors(): string[] {
    return []; // Override in subclasses for error reporting
  }

  protected createTitle(text: string): HTMLHeadingElement {
    const title = document.createElement('h2');
    title.textContent = text;
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    return title;
  }

  protected createDescription(text: string): HTMLParagraphElement {
    const description = document.createElement('p');
    description.textContent = text;
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    return description;
  }

  protected clearContainer(container: HTMLDivElement): void {
    container.innerHTML = '';
  }
}

export interface TabRendererEvents {
  onConfigurationChanged: (config: GameConfiguration) => void;
  onValidationChanged: (isValid: boolean, errors: string[]) => void;
}

export class TabRendererManager {
  private renderers: Map<string, TabRenderer> = new Map();
  private activeRenderer: TabRenderer | null = null;
  private events: TabRendererEvents;

  constructor(events: TabRendererEvents) {
    this.events = events;
  }

  registerRenderer(renderer: TabRenderer): void {
    this.renderers.set(renderer.tabId, renderer);
  }

  unregisterRenderer(tabId: string): void {
    if (this.activeRenderer?.tabId === tabId) {
      this.deactivateTab();
    }
    this.renderers.delete(tabId);
  }

  activateTab(tabId: string, container: HTMLDivElement): boolean {
    const renderer = this.renderers.get(tabId);
    if (!renderer) {
      console.warn(`Tab renderer not found: ${tabId}`);
      return false;
    }

    // Deactivate current renderer
    this.deactivateTab();

    // Activate new renderer
    this.activeRenderer = renderer;
    renderer.onActivate?.();
    renderer.render(container);

    // Validate the tab
    this.validateActiveTab();

    return true;
  }

  deactivateTab(): void {
    if (this.activeRenderer) {
      this.activeRenderer.onDeactivate?.();
      this.activeRenderer = null;
    }
  }

  validateActiveTab(): void {
    if (!this.activeRenderer) {
      this.events.onValidationChanged(true, []);
      return;
    }

    const isValid = this.activeRenderer.validate?.() ?? true;
    const errors = this.activeRenderer.getErrors?.() ?? [];
    this.events.onValidationChanged(isValid, errors);
  }

  getRegisteredTabs(): Array<{ id: string; title: string; description?: string }> {
    return Array.from(this.renderers.values()).map(renderer => ({
      id: renderer.tabId,
      title: renderer.tabTitle,
      description: renderer.tabDescription
    }));
  }

  getActiveTab(): string | null {
    return this.activeRenderer?.tabId ?? null;
  }
}