/**
 * Refactored Configuration Menu
 * Replaces the monolithic ConfigurationMenu.ts with a modular, maintainable architecture
 */

import type { GameConfiguration, ConfigurationPreset } from '../config/GameConfiguration';
import { CONFIGURATION_PRESETS } from '../config/ConfigurationPresets';
import { configurationValidator } from '../config/ConfigurationValidator';
import { configurationPersistence } from '../config/ConfigurationPersistence';
import { ConfigurationState } from './ConfigurationState';
import { TabManager, type TabManagerEvents } from './components/TabManager';
import { TabRendererManager, type TabRendererEvents } from './components/TabRenderer';
import { FormComponents } from './components/FormComponents';

// Import tab renderers
import { MapConfigurationTab } from './tabs/MapConfigurationTab';
import { GameplayConfigurationTab } from './tabs/GameplayConfigurationTab';
// Note: Additional tabs would be imported here as they are created

export class RefactoredConfigurationMenu {
  private container: HTMLDivElement;
  private currentConfig: GameConfiguration;
  private onConfigurationComplete: (config: GameConfiguration) => void;
  private configState: ConfigurationState;
  private tabManager: TabManager | null = null;
  private tabRendererManager: TabRendererManager;
  private activeTab: string = 'presets';
  private validationErrors: string[] = [];
  private isValid: boolean = true;

  constructor(onComplete: (config: GameConfiguration) => void) {
    this.onConfigurationComplete = onComplete;
    this.currentConfig = CONFIGURATION_PRESETS.STANDARD();
    
    // Load previous configuration if available
    const saved = configurationPersistence.loadCurrentConfiguration();
    if (saved) {
      this.currentConfig = saved;
    }
    
    this.configState = new ConfigurationState(this.currentConfig);
    this.configState.addChangeListener((config) => {
      this.currentConfig = config;
      this.validateConfiguration();
    });
    
    this.tabRendererManager = this.createTabRendererManager();
    this.container = this.createMenuContainer();
    this.setupInterface();
  }

  private createTabRendererManager(): TabRendererManager {
    const events: TabRendererEvents = {
      onConfigurationChanged: (config) => {
        this.currentConfig = config;
        this.validateConfiguration();
      },
      onValidationChanged: (isValid, errors) => {
        this.isValid = isValid;
        this.validationErrors = errors;
        this.updateValidationStatus();
      }
    };

    const manager = new TabRendererManager(events);
    
    // Register tab renderers
    manager.registerRenderer(new MapConfigurationTab(this.configState));
    manager.registerRenderer(new GameplayConfigurationTab(this.configState));
    
    // TODO: Add remaining tab renderers as they are created:
    // manager.registerRenderer(new EnemyConfigurationTab(this.configState));
    // manager.registerRenderer(new PlayerConfigurationTab(this.configState));
    // manager.registerRenderer(new AudioVisualTab(this.configState));
    // manager.registerRenderer(new AdvancedConfigurationTab(this.configState));

    return manager;
  }

  private createMenuContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'configuration-menu';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      color: white;
      overflow: hidden;
    `;
    
    return container;
  }

  private setupInterface(): void {
    this.setupTabManager();
    this.setupContent();
    this.renderCurrentTab();
    this.validateConfiguration();
  }

  private setupTabManager(): void {
    const events: TabManagerEvents = {
      onTabChange: (tabId: string) => this.switchTab(tabId)
    };
    
    // Get available tabs from the renderer manager
    const availableTabs = this.tabRendererManager.getRegisteredTabs();
    
    // Add the presets tab (handled specially)
    const allTabs = [
      { id: 'presets', title: 'Presets', description: 'Choose from predefined configurations' },
      ...availableTabs
    ];
    
    this.tabManager = new TabManager(this.container, events, this.activeTab, allTabs);
  }

  private setupContent(): void {
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    contentContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    contentArea.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #0f0f0f;
    `;
    
    // Create action bar
    const actionBar = this.createActionBar();
    
    contentContainer.appendChild(contentArea);
    contentContainer.appendChild(actionBar);
    this.container.appendChild(contentContainer);
  }

  private createActionBar(): HTMLDivElement {
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #1a1a1a;
      border-top: 2px solid #333;
      flex-shrink: 0;
    `;
    
    // Validation status
    const statusContainer = document.createElement('div');
    statusContainer.className = 'validation-status';
    statusContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    `;
    
    // Action buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
    `;
    
    const cancelButton = FormComponents.createButton({
      text: 'Cancel',
      type: 'secondary',
      onClick: () => this.close()
    });
    
    const resetButton = FormComponents.createButton({
      text: 'Reset to Default',
      type: 'warning',
      onClick: () => this.resetToDefault()
    });
    
    const startButton = FormComponents.createButton({
      text: 'Start Game',
      type: 'primary',
      onClick: () => this.startGame()
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(resetButton);
    buttonContainer.appendChild(startButton);
    
    actionBar.appendChild(statusContainer);
    actionBar.appendChild(buttonContainer);
    
    return actionBar;
  }

  private switchTab(tabId: string): void {
    if (this.activeTab === tabId) return;
    
    this.activeTab = tabId;
    this.renderCurrentTab();
  }

  private renderCurrentTab(): void {
    const contentArea = this.container.querySelector('.content-area') as HTMLDivElement;
    if (!contentArea) return;

    contentArea.innerHTML = '';
    
    if (this.activeTab === 'presets') {
      this.renderPresetsTab(contentArea);
    } else {
      // Use the tab renderer manager for other tabs
      this.tabRendererManager.activateTab(this.activeTab, contentArea);
    }
  }

  private renderPresetsTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Configuration Presets';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    
    const description = document.createElement('p');
    description.textContent = 'Choose from predefined configurations or load a saved configuration.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    
    container.appendChild(title);
    container.appendChild(description);

    // Create preset selection section
    this.renderPresetSelection(container);
    
    // Create save/load section
    this.renderSaveLoadSection(container);
  }

  private renderPresetSelection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Preset Configurations',
      'Select a predefined configuration to get started quickly.'
    );

    const presetOptions = [
      { value: 'BEGINNER', label: 'Beginner', description: 'Easy settings for new players' },
      { value: 'STANDARD', label: 'Standard', description: 'Balanced default experience' },
      { value: 'CHALLENGING', label: 'Challenging', description: 'Harder difficulty for experienced players' },
      { value: 'EXPERT', label: 'Expert', description: 'Maximum challenge for experts' },
      { value: 'SPEEDRUN', label: 'Speedrun', description: 'Optimized for fast completion' },
      { value: 'SANDBOX', label: 'Sandbox', description: 'Experimental and testing' }
    ];

    const presetSelect = FormComponents.createSelectDropdown(
      'STANDARD', // Default selection
      presetOptions,
      (value) => this.loadPreset(value as ConfigurationPreset)
    );

    const presetRow = FormComponents.createFormRow(
      'Configuration Preset',
      presetSelect,
      'Choose a preset to automatically configure all game settings'
    );
    section.appendChild(presetRow);

    container.appendChild(section);
  }

  private renderSaveLoadSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Save & Load',
      'Save your current configuration or load a previously saved one.'
    );

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;

    const saveButton = FormComponents.createButton({
      text: 'Save Current Configuration',
      type: 'primary',
      onClick: () => this.saveCurrentConfiguration()
    });

    const loadButton = FormComponents.createButton({
      text: 'Load Configuration',
      type: 'secondary',
      onClick: () => this.showLoadDialog()
    });

    const exportButton = FormComponents.createButton({
      text: 'Export to File',
      type: 'secondary',
      onClick: () => this.exportConfiguration()
    });

    const importButton = FormComponents.createButton({
      text: 'Import from File',
      type: 'secondary',
      onClick: () => this.showImportDialog()
    });

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(loadButton);
    buttonContainer.appendChild(exportButton);
    buttonContainer.appendChild(importButton);

    section.appendChild(buttonContainer);
    container.appendChild(section);
  }

  private loadPreset(preset: ConfigurationPreset): void {
    this.currentConfig = CONFIGURATION_PRESETS[preset]();
    this.configState.setConfiguration(this.currentConfig);
    this.validateConfiguration();
  }

  private saveCurrentConfiguration(): void {
    configurationPersistence.saveConfiguration('current', this.currentConfig);
    console.log('Configuration saved successfully');
    // TODO: Show success message to user
  }

  private showLoadDialog(): void {
    // TODO: Implement load dialog
    console.log('Load dialog not yet implemented');
  }

  private exportConfiguration(): void {
    const dataStr = JSON.stringify(this.currentConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tower-defense-config.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private showImportDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.importConfiguration(file);
      }
    });
    
    input.click();
  }

  private importConfiguration(file: File): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        const validationResult = configurationValidator.validate(config);
        
        if (validationResult.isValid) {
          this.currentConfig = config;
          this.configState.setConfiguration(config);
          this.validateConfiguration();
          console.log('Configuration imported successfully');
        } else {
          console.error('Invalid configuration file:', validationResult.errors);
          // TODO: Show error message to user
        }
      } catch (error) {
        console.error('Failed to parse configuration file:', error);
        // TODO: Show error message to user
      }
    };
    reader.readAsText(file);
  }

  private validateConfiguration(): void {
    const validationResult = configurationValidator.validate(this.currentConfig);
    this.isValid = validationResult.isValid;
    this.validationErrors = validationResult.errors || [];
    this.updateValidationStatus();
  }

  private updateValidationStatus(): void {
    const statusContainer = this.container.querySelector('.validation-status') as HTMLDivElement;
    if (!statusContainer) return;

    statusContainer.innerHTML = '';

    const statusIcon = document.createElement('span');
    statusIcon.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    `;

    const statusText = document.createElement('span');

    if (this.isValid) {
      statusIcon.style.background = '#4CAF50';
      statusText.textContent = 'Configuration is valid';
      statusText.style.color = '#4CAF50';
    } else {
      statusIcon.style.background = '#F44336';
      statusText.textContent = `${this.validationErrors.length} validation error(s)`;
      statusText.style.color = '#F44336';
    }

    statusContainer.appendChild(statusIcon);
    statusContainer.appendChild(statusText);

    // Show errors if any
    if (!this.isValid && this.validationErrors.length > 0) {
      const errorList = document.createElement('div');
      errorList.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 0;
        background: #2a2a2a;
        border: 1px solid #F44336;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 5px;
        font-size: 11px;
        max-width: 300px;
        z-index: 1000;
      `;

      this.validationErrors.forEach(error => {
        const errorItem = document.createElement('div');
        errorItem.textContent = `• ${error}`;
        errorItem.style.cssText = 'color: #F44336; margin-bottom: 5px;';
        errorList.appendChild(errorItem);
      });

      statusContainer.style.position = 'relative';
      statusContainer.appendChild(errorList);
    }
  }

  private resetToDefault(): void {
    this.currentConfig = CONFIGURATION_PRESETS.STANDARD();
    this.configState.setConfiguration(this.currentConfig);
    this.renderCurrentTab(); // Re-render to update UI
    this.validateConfiguration();
  }

  private startGame(): void {
    if (!this.isValid) {
      console.warn('Cannot start game with invalid configuration');
      // TODO: Show error message to user
      return;
    }

    // Save current configuration before starting
    configurationPersistence.saveConfiguration('current', this.currentConfig);
    
    this.close();
    this.onConfigurationComplete(this.currentConfig);
  }

  private close(): void {
    // Deactivate current tab
    this.tabRendererManager.deactivateTab();
    
    // Remove from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  public show(): void {
    document.body.appendChild(this.container);
  }

  public getConfiguration(): GameConfiguration {
    return this.currentConfig;
  }

  public isConfigurationValid(): boolean {
    return this.isValid;
  }
}