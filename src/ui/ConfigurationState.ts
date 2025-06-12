import type { GameConfiguration } from '../config/GameConfiguration';
import { configurationValidator } from '../config/ConfigurationValidator';

export type ConfigurationChangeListener = (config: GameConfiguration) => void;
export type ValidationChangeListener = (isValid: boolean, errors: string[], warnings: string[]) => void;

export class ConfigurationState {
  private configuration: GameConfiguration;
  private changeListeners: ConfigurationChangeListener[] = [];
  private validationListeners: ValidationChangeListener[] = [];
  private validationCache: { isValid: boolean; errors: string[]; warnings: string[] } | null = null;
  
  constructor(initialConfig: GameConfiguration) {
    this.configuration = { ...initialConfig };
  }
  
  // Get current configuration
  getConfiguration(): GameConfiguration {
    return { ...this.configuration };
  }
  
  // Update entire configuration
  setConfiguration(config: GameConfiguration): void {
    this.configuration = { ...config };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  // Update specific section of configuration
  updateMapSettings(updates: Partial<GameConfiguration['mapSettings']>): void {
    this.configuration.mapSettings = { ...this.configuration.mapSettings, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  updateGameplaySettings(updates: Partial<GameConfiguration['gameplaySettings']>): void {
    this.configuration.gameplaySettings = { ...this.configuration.gameplaySettings, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  updateEnemySettings(updates: Partial<GameConfiguration['enemySettings']>): void {
    this.configuration.enemySettings = { ...this.configuration.enemySettings, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  updatePlayerSettings(updates: Partial<GameConfiguration['playerSettings']>): void {
    this.configuration.playerSettings = { ...this.configuration.playerSettings, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  updateAudioVisualSettings(updates: Partial<GameConfiguration['audioVisualSettings']>): void {
    this.configuration.audioVisualSettings = { ...this.configuration.audioVisualSettings, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  updateAdvancedSettings(updates: Partial<GameConfiguration['advancedSettings']>): void {
    this.configuration.advancedSettings = { ...this.configuration.advancedSettings, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  updateMetadata(updates: Partial<GameConfiguration['metadata']>): void {
    this.configuration.metadata = { ...this.configuration.metadata, ...updates };
    this.invalidateValidation();
    this.notifyChange();
  }
  
  // Validation
  validateConfiguration(): { isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] } {
    if (this.validationCache === null) {
      const validation = configurationValidator.validate(this.configuration);
      this.validationCache = {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      };
      
      // Notify validation listeners
      this.validationListeners.forEach(listener => 
        listener(validation.isValid, validation.errors, validation.warnings)
      );
    }
    
    const fullValidation = configurationValidator.validate(this.configuration);
    return fullValidation;
  }
  
  // Check if a specific setting is valid
  validateSetting(value: any, validator: (val: any) => string[]): string[] {
    return validator(value);
  }
  
  // Event listeners
  addChangeListener(listener: ConfigurationChangeListener): void {
    this.changeListeners.push(listener);
  }
  
  removeChangeListener(listener: ConfigurationChangeListener): void {
    const index = this.changeListeners.indexOf(listener);
    if (index !== -1) {
      this.changeListeners.splice(index, 1);
    }
  }
  
  addValidationListener(listener: ValidationChangeListener): void {
    this.validationListeners.push(listener);
  }
  
  removeValidationListener(listener: ValidationChangeListener): void {
    const index = this.validationListeners.indexOf(listener);
    if (index !== -1) {
      this.validationListeners.splice(index, 1);
    }
  }
  
  // Private methods
  private invalidateValidation(): void {
    this.validationCache = null;
  }
  
  private notifyChange(): void {
    this.changeListeners.forEach(listener => listener(this.configuration));
  }
  
  // Utility methods for form controls
  createNumberInput(
    value: number, 
    min: number, 
    max: number, 
    step: number, 
    onChange: (value: number) => void
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();
    
    input.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      color: white;
      padding: 8px;
      border-radius: 4px;
      width: 80px;
    `;
    
    input.addEventListener('change', () => {
      const newValue = parseFloat(input.value);
      if (!isNaN(newValue) && newValue >= min && newValue <= max) {
        onChange(newValue);
      } else {
        input.value = value.toString(); // Reset to previous value
      }
    });
    
    return input;
  }
  
  createRangeSlider(
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
    formatDisplay?: (value: number) => string
  ): { container: HTMLDivElement; slider: HTMLInputElement; display: HTMLSpanElement } {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; gap: 10px;';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #333;
      outline: none;
      cursor: pointer;
    `;
    
    const display = document.createElement('span');
    display.style.cssText = `
      color: #4CAF50;
      font-weight: bold;
      min-width: 60px;
      text-align: right;
    `;
    
    const updateDisplay = (val: number) => {
      display.textContent = formatDisplay ? formatDisplay(val) : val.toString();
    };
    
    updateDisplay(value);
    
    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      updateDisplay(newValue);
      onChange(newValue);
    });
    
    container.appendChild(slider);
    container.appendChild(display);
    
    return { container, slider, display };
  }
  
  createSelectDropdown<T extends string>(
    value: T,
    options: { value: T; label: string; description?: string }[],
    onChange: (value: T) => void
  ): HTMLSelectElement {
    const select = document.createElement('select');
    select.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      color: white;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.selected = option.value === value;
      select.appendChild(optionElement);
    });
    
    select.addEventListener('change', () => {
      onChange(select.value as T);
    });
    
    return select;
  }
  
  createCheckbox(
    checked: boolean,
    label: string,
    onChange: (checked: boolean) => void
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer;';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.style.cssText = 'cursor: pointer;';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = 'color: white; cursor: pointer; user-select: none;';
    
    const handleChange = () => {
      onChange(checkbox.checked);
    };
    
    checkbox.addEventListener('change', handleChange);
    container.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        handleChange();
      }
    });
    
    container.appendChild(checkbox);
    container.appendChild(labelElement);
    
    return container;
  }
  
  createFormSection(title: string, description?: string): HTMLDivElement {
    const section = document.createElement('div');
    section.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    `;
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = 'margin: 0 0 10px 0; color: #4CAF50; font-size: 16px;';
    section.appendChild(titleElement);
    
    if (description) {
      const descElement = document.createElement('p');
      descElement.textContent = description;
      descElement.style.cssText = 'margin: 0 0 15px 0; color: #ccc; font-size: 13px; line-height: 1.4;';
      section.appendChild(descElement);
    }
    
    return section;
  }
  
  createFormRow(label: string, control: HTMLElement, tooltip?: string): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      gap: 15px;
    `;
    
    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = 'flex: 1; display: flex; align-items: center; gap: 5px;';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = 'color: white; font-size: 14px;';
    labelContainer.appendChild(labelElement);
    
    if (tooltip) {
      const tooltipIcon = document.createElement('span');
      tooltipIcon.textContent = '?';
      tooltipIcon.title = tooltip;
      tooltipIcon.style.cssText = `
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #666;
        color: white;
        text-align: center;
        font-size: 10px;
        line-height: 16px;
        cursor: help;
      `;
      labelContainer.appendChild(tooltipIcon);
    }
    
    const controlContainer = document.createElement('div');
    controlContainer.style.cssText = 'flex-shrink: 0;';
    controlContainer.appendChild(control);
    
    row.appendChild(labelContainer);
    row.appendChild(controlContainer);
    
    return row;
  }
}