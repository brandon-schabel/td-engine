import { FloatingUIBase } from './FloatingUIBase';
import type { FloatingUIOptions } from './FloatingUIBase';
import { IconType } from '../../icons/SvgIcons';

export interface FloatingDisplayOptions extends FloatingUIOptions {
  iconType?: IconType;
  iconSize?: number;
  getValue: () => string | { value: string; color?: string };
  formatValue?: (value: string) => string;
}

export class FloatingDisplay extends FloatingUIBase {
  private iconType?: IconType;
  private iconSize: number;
  private getValue: () => string | { value: string; color?: string };
  private formatValue?: (value: string) => string;
  private iconElement?: HTMLSpanElement;
  private valueElement?: HTMLSpanElement;
  
  constructor(options: FloatingDisplayOptions) {
    // Don't pass updateInterval to parent to prevent premature update
    const { getValue, formatValue, iconType, iconSize, ...baseOptions } = options;
    super({
      ...baseOptions,
      updateInterval: 0 // Disable auto-update in parent
    });
    
    // Set properties before any update can occur
    this.iconType = iconType;
    this.iconSize = iconSize || 20;
    this.getValue = getValue;
    this.formatValue = formatValue;
    
    this.setupContent();
    
    // Now start updates after everything is initialized
    if (options.updateInterval !== 0) {
      this.options.updateInterval = options.updateInterval || 100;
      this.startUpdateInterval();
    }
  }
  
  private setupContent(): void {
    // Add icon if specified
    if (this.iconType) {
      this.iconElement = document.createElement('span');
      this.iconElement.innerHTML = this.createIcon(this.iconType, this.iconSize);
      this.element.appendChild(this.iconElement);
    }
    
    // Add value element
    this.valueElement = document.createElement('span');
    this.element.appendChild(this.valueElement);
  }
  
  protected update(): void {
    const result = this.getValue();
    const isObject = typeof result === 'object' && result !== null;
    const value = isObject ? (result as { value: string; color?: string }).value : result;
    const color = isObject ? (result as { value: string; color?: string }).color : undefined;
    
    // Update value
    const displayValue = this.formatValue ? this.formatValue(value) : value;
    if (this.valueElement) {
      this.valueElement.textContent = displayValue;
    }
    
    // Update color if provided
    if (color) {
      this.updateStyles({
        borderColor: color,
        color: color
      });
    }
  }
  
  protected startUpdateInterval(): void {
    const interval = this.options.updateInterval || 100;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = window.setInterval(() => {
      this.update();
    }, interval);
    // Initial update
    this.update();
  }
  
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    super.destroy();
  }
}