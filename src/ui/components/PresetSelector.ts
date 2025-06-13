/**
 * PresetSelector - Handles preset selection UI and custom configuration management
 * Extracted from ConfigurationMenu.ts to improve modularity
 */

import type { GameConfiguration, ConfigurationPreset } from '../../config/GameConfiguration';
import { CONFIGURATION_PRESETS, PRESET_METADATA } from '../../config/ConfigurationPresets';
import { configurationPersistence } from '../../config/ConfigurationPersistence';

export interface PresetSelectorEvents {
  onPresetSelected: (preset: ConfigurationPreset) => void;
  onConfigurationSaved: () => void;
  onConfigurationLoaded: (config: GameConfiguration) => void;
}

export class PresetSelector {
  private container: HTMLDivElement;
  private events: PresetSelectorEvents;
  private selectedPreset: ConfigurationPreset | null = null;

  constructor(container: HTMLDivElement, events: PresetSelectorEvents) {
    this.container = container;
    this.events = events;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    // Title and description
    this.createHeaderSection();
    
    // Preset grid
    this.createPresetGrid();
    
    // Custom configuration section
    this.createCustomConfigSection();
  }

  private createHeaderSection(): void {
    const title = document.createElement('h2');
    title.textContent = 'Quick Start Presets';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    this.container.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = 'Choose a preset configuration to get started quickly, or customize your own settings using the other tabs.';
    description.style.cssText = 'margin: 0 0 30px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    this.container.appendChild(description);
  }

  private createPresetGrid(): void {
    const presetsGrid = document.createElement('div');
    presetsGrid.className = 'presets-grid';
    presetsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    `;

    Object.entries(PRESET_METADATA).forEach(([key, meta]) => {
      const presetCard = this.createPresetCard(key as ConfigurationPreset, meta);
      presetsGrid.appendChild(presetCard);
    });

    this.container.appendChild(presetsGrid);
  }

  private createPresetCard(presetKey: ConfigurationPreset, meta: typeof PRESET_METADATA[ConfigurationPreset]): HTMLDivElement {
    const presetCard = document.createElement('div');
    presetCard.className = 'preset-card';
    presetCard.dataset.preset = presetKey;
    
    this.updatePresetCardStyle(presetCard, false);
    
    presetCard.addEventListener('mouseenter', () => {
      if (!this.isSelected(presetKey)) {
        presetCard.style.borderColor = meta.color;
        presetCard.style.background = '#222';
      }
    });
    
    presetCard.addEventListener('mouseleave', () => {
      if (!this.isSelected(presetKey)) {
        presetCard.style.borderColor = '#333';
        presetCard.style.background = '#1a1a1a';
      }
    });
    
    presetCard.addEventListener('click', () => {
      this.selectPreset(presetKey);
    });

    // Header with icon and name
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px;';
    
    const icon = document.createElement('span');
    icon.textContent = meta.icon;
    icon.style.cssText = 'font-size: 24px; margin-right: 10px;';
    
    const name = document.createElement('h3');
    name.textContent = meta.name;
    name.style.cssText = `margin: 0; color: ${meta.color}; font-size: 18px;`;

    // Difficulty badge
    const difficulty = document.createElement('div');
    difficulty.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: ${meta.color};
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
    `;
    difficulty.textContent = `Difficulty: ${meta.difficulty}/5`;

    // Description
    const description = document.createElement('p');
    description.textContent = meta.description;
    description.style.cssText = 'margin: 0; color: #ccc; font-size: 14px; line-height: 1.4;';

    header.appendChild(icon);
    header.appendChild(name);
    presetCard.appendChild(difficulty);
    presetCard.appendChild(header);
    presetCard.appendChild(description);

    return presetCard;
  }

  private updatePresetCardStyle(card: HTMLDivElement, isSelected: boolean): void {
    card.style.cssText = `
      background: ${isSelected ? '#0a2a0a' : '#1a1a1a'};
      border: 2px solid ${isSelected ? '#4CAF50' : '#333'};
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    `;
  }

  private createCustomConfigSection(): void {
    const customSection = document.createElement('div');
    customSection.style.cssText = `
      background: #1a1a1a;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    `;

    const customTitle = document.createElement('h3');
    customTitle.textContent = '🛠️ Custom Configuration';
    customTitle.style.cssText = 'margin: 0 0 10px 0; color: #FF9800;';

    const customDesc = document.createElement('p');
    customDesc.textContent = 'Create your own custom configuration by modifying settings in the other tabs. Your changes will be automatically saved.';
    customDesc.style.cssText = 'margin: 0 0 15px 0; color: #ccc; font-size: 14px;';

    const customButtons = document.createElement('div');
    customButtons.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const saveButton = this.createButton('Save Current Config', 'primary', () => {
      this.saveCurrentConfiguration();
    });

    const loadButton = this.createButton('Load Saved Config', 'secondary', () => {
      this.showLoadDialog();
    });

    customButtons.appendChild(saveButton);
    customButtons.appendChild(loadButton);

    customSection.appendChild(customTitle);
    customSection.appendChild(customDesc);
    customSection.appendChild(customButtons);

    this.container.appendChild(customSection);
  }

  private createButton(text: string, type: 'primary' | 'secondary' | 'warning', onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    
    const colors = {
      primary: { bg: '#4CAF50', hover: '#45a049' },
      secondary: { bg: '#666', hover: '#555' },
      warning: { bg: '#FF9800', hover: '#e68900' }
    };
    
    const color = colors[type];
    button.style.cssText = `
      padding: 10px 20px;
      background: ${color.bg};
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = color.hover;
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = color.bg;
    });

    return button;
  }

  private selectPreset(preset: ConfigurationPreset): void {
    // Update visual selection
    this.selectedPreset = preset;
    this.updatePresetSelection();
    
    // Notify parent
    this.events.onPresetSelected(preset);
  }

  private updatePresetSelection(): void {
    const presetCards = this.container.querySelectorAll('.preset-card');
    presetCards.forEach((card) => {
      const cardElement = card as HTMLDivElement;
      const cardPreset = cardElement.dataset.preset as ConfigurationPreset;
      const isSelected = cardPreset === this.selectedPreset;
      this.updatePresetCardStyle(cardElement, isSelected);
    });
  }

  private isSelected(preset: ConfigurationPreset): boolean {
    return this.selectedPreset === preset;
  }

  private saveCurrentConfiguration(): void {
    try {
      // Note: This requires access to current configuration from parent
      // For now, just notify parent to handle the save
      this.events.onConfigurationSaved();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  }

  private showLoadDialog(): void {
    try {
      const userConfigs = configurationPersistence.getUserConfigurations();
      if (userConfigs.length === 0) {
        alert('No saved configurations found.');
        return;
      }
      
      // Simple implementation - in a real app you'd create a proper dialog
      const configNames = userConfigs.map((c, i) => `${i + 1}. ${c.configuration.metadata.name}`).join('\n');
      const choice = prompt(`Select configuration:\n${configNames}\n\nEnter the number:`);
      
      if (choice) {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < userConfigs.length) {
          const selectedConfig = userConfigs[index].configuration;
          this.events.onConfigurationLoaded(selectedConfig);
        } else {
          alert('Invalid selection.');
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      alert('Failed to load configurations. Please try again.');
    }
  }

  /**
   * Highlights a specific preset as selected (for external updates)
   */
  setSelectedPreset(preset: ConfigurationPreset | null): void {
    this.selectedPreset = preset;
    this.updatePresetSelection();
  }

  /**
   * Gets the currently selected preset
   */
  getSelectedPreset(): ConfigurationPreset | null {
    return this.selectedPreset;
  }

  /**
   * Refreshes the preset display (useful when presets are updated)
   */
  refresh(): void {
    this.render();
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.container.innerHTML = '';
    this.selectedPreset = null;
  }
}