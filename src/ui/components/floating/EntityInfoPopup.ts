/**
 * EntityInfoPopup.ts - Generic info popup that follows entities
 * Changes:
 * 1. Initial implementation with customizable content
 * 2. Support for HTML content and styling
 * 3. Dynamic content updates
 * 4. Multiple info sections support
 * 5. Icon integration support
 */

import { EntityPopup, type EntityPopupOptions } from './EntityPopup';
import type { Entity } from '@/entities/Entity';
import type { Camera } from '@/systems/Camera';
import { COLOR_THEME } from '@/config/ColorTheme';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface InfoSection {
  label?: string;
  value: string | number;
  icon?: IconType;
  color?: string;
  format?: (value: string | number) => string;
}

export interface EntityInfoOptions extends EntityPopupOptions {
  title?: string;
  sections?: InfoSection[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  minWidth?: string;
  maxWidth?: string;
  updateInterval?: number;
  showHealthBar?: boolean;
}

export class EntityInfoPopup extends EntityPopup {
  private title?: string;
  private sections: InfoSection[];
  private backgroundColor: string;
  private borderColor: string;
  private borderWidth: number;
  private borderRadius: number;
  private padding: string;
  private minWidth: string;
  private maxWidth: string;
  private updateInterval?: number;
  private updateTimer?: number;
  private showHealthBar: boolean;
  private contentElement?: HTMLElement;
  private healthBarElement?: HTMLElement;

  constructor(
    entity: Entity,
    camera: Camera,
    options: EntityInfoOptions = {}
  ) {
    const defaults = {
      backgroundColor: COLOR_THEME.ui.background.secondary + 'ee',
      borderColor: COLOR_THEME.ui.border.default,
      borderWidth: 2,
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: '120px',
      maxWidth: '250px',
      anchor: 'top' as const,
      offset: { x: 0, y: -10 },
      className: 'entity-info-popup',
      sections: [],
      showHealthBar: false
    };

    super(entity, camera, { ...defaults, ...options });

    this.title = options.title;
    this.sections = options.sections || [];
    this.backgroundColor = options.backgroundColor || defaults.backgroundColor;
    this.borderColor = options.borderColor || defaults.borderColor;
    this.borderWidth = options.borderWidth || defaults.borderWidth;
    this.borderRadius = options.borderRadius || defaults.borderRadius;
    this.padding = options.padding || defaults.padding;
    this.minWidth = options.minWidth || defaults.minWidth;
    this.maxWidth = options.maxWidth || defaults.maxWidth;
    this.updateInterval = options.updateInterval;
    this.showHealthBar = options.showHealthBar || defaults.showHealthBar;

    if (this.updateInterval) {
      this.startUpdateTimer();
    }
  }

  protected buildContent(): void {
    // Apply popup styles
    this.element.style.cssText += `
      background: ${this.backgroundColor};
      border: ${this.borderWidth}px solid ${this.borderColor};
      border-radius: ${this.borderRadius}px;
      padding: ${this.padding};
      min-width: ${this.minWidth};
      max-width: ${this.maxWidth};
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: ${COLOR_THEME.ui.text.primary};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
    `;

    // Create content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'entity-info-content';
    this.element.appendChild(this.contentElement);

    // Build initial content
    this.updateContent();
  }

  private updateContent(): void {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = '';

    // Add title
    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'info-title';
      titleEl.style.cssText = `
        font-weight: bold;
        font-size: 14px;
        color: ${COLOR_THEME.ui.text.success};
        margin-bottom: 6px;
        border-bottom: 1px solid ${COLOR_THEME.ui.border.default}33;
        padding-bottom: 4px;
      `;
      titleEl.textContent = this.title;
      this.contentElement.appendChild(titleEl);
    }

    // Add health bar if enabled
    if (this.showHealthBar) {
      this.createHealthBar();
    }

    // Add sections
    this.sections.forEach(section => {
      this.createSection(section);
    });
  }

  private createHealthBar(): void {
    const container = document.createElement('div');
    container.className = 'health-bar-container';
    container.style.cssText = `
      width: 100%;
      height: 6px;
      background: ${COLOR_THEME.ui.background.primary};
      border-radius: 3px;
      margin: 6px 0;
      overflow: hidden;
      border: 1px solid ${COLOR_THEME.ui.border.default}66;
    `;

    this.healthBarElement = document.createElement('div');
    this.healthBarElement.className = 'health-bar-fill';

    const healthPercent = (this.entity.health / this.entity.maxHealth) * 100;
    const healthColor = this.getHealthColor(healthPercent);

    this.healthBarElement.style.cssText = `
      width: ${healthPercent}%;
      height: 100%;
      background: ${healthColor};
      transition: width 0.3s ease, background-color 0.3s ease;
    `;

    container.appendChild(this.healthBarElement);
    if (this.contentElement) {
      this.contentElement.appendChild(container);
    }
  }

  private getHealthColor(percent: number): string {
    if (percent > 60) return COLOR_THEME.ui.text.success;
    if (percent > 30) return COLOR_THEME.ui.currency; // Use currency yellow as warning color
    return COLOR_THEME.ui.text.danger;
  }

  private createSection(section: InfoSection): void {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'info-section';
    sectionEl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 4px 0;
    `;

    // Add icon if specified
    if (section.icon) {
      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = `
        width: 16px;
        height: 16px;
        color: ${section.color || COLOR_THEME.ui.text.primary};
      `;
      iconContainer.innerHTML = createSvgIcon(section.icon, { size: 16 });
      sectionEl.appendChild(iconContainer);
    }

    // Add label if specified
    if (section.label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'info-label';
      labelEl.style.cssText = `
        color: ${COLOR_THEME.ui.text.secondary};
        font-size: 11px;
        margin-right: 4px;
      `;
      labelEl.textContent = section.label + ':';
      sectionEl.appendChild(labelEl);
    }

    // Add value
    const valueEl = document.createElement('span');
    valueEl.className = 'info-value';
    valueEl.style.cssText = `
      color: ${section.color || COLOR_THEME.ui.text.primary};
      font-weight: bold;
      flex: 1;
    `;

    const formattedValue = section.format
      ? section.format(section.value)
      : section.value.toString();

    valueEl.textContent = formattedValue;
    sectionEl.appendChild(valueEl);

    if (this.contentElement) {
      this.contentElement.appendChild(sectionEl);
    }
  }

  private startUpdateTimer(): void {
    if (this.updateInterval) {
      this.updateTimer = window.setInterval(() => {
        this.updateDynamicContent();
      }, this.updateInterval);
    }
  }

  private updateDynamicContent(): void {
    // Update health bar
    if (this.healthBarElement) {
      const healthPercent = (this.entity.health / this.entity.maxHealth) * 100;
      this.healthBarElement.style.width = `${healthPercent}%`;
      this.healthBarElement.style.backgroundColor = this.getHealthColor(healthPercent);
    }

    // Subclasses can override this to update sections
    this.onUpdate();
  }

  /**
   * Hook for subclasses to update content
   */
  protected onUpdate(): void {
    // Override in subclasses
  }

  public setSections(sections: InfoSection[]): void {
    this.sections = sections;
    this.updateContent();
  }

  public updateSection(index: number, value: string | number): void {
    if (index >= 0 && index < this.sections.length) {
      this.sections[index].value = value;
      this.updateContent();
    }
  }

  public setTitle(title: string): void {
    this.title = title;
    this.updateContent();
  }

  protected override onDestroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  /**
   * Static factory for common entity info
   */
  public static createBasicInfo(
    entity: Entity,
    camera: Camera,
    title?: string
  ): EntityInfoPopup {
    return new EntityInfoPopup(entity, camera, {
      title: title || entity.type,
      sections: [
        {
          label: 'Health',
          value: entity.health,
          icon: IconType.HEALTH,
          color: COLOR_THEME.ui.text.success,
          format: (v) => `${v}/${entity.maxHealth}`
        },
        {
          label: 'ID',
          value: entity.id,
          color: COLOR_THEME.ui.text.secondary
        }
      ],
      showHealthBar: true,
      updateInterval: 100
    });
  }
}