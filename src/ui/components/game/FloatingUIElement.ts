import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface FloatingUIElementOptions {
  id?: string;
  position: {
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
  };
  borderColor?: string;
  icon?: IconType;
  iconSize?: number;
  updateInterval?: number;
  className?: string;
  additionalStyles?: string;
  onUpdate?: (element: FloatingUIElement) => void;
}

export class FloatingUIElement {
  protected container: HTMLElement;
  protected iconElement: HTMLElement | null = null;
  protected contentElement: HTMLElement;
  private updateInterval: number | null = null;
  private options: FloatingUIElementOptions;

  constructor(options: FloatingUIElementOptions) {
    this.options = options;
    this.container = this.createContainer();
    this.contentElement = this.createContentElement();
    
    if (options.icon) {
      this.iconElement = this.createIconElement(options.icon, options.iconSize || 20);
      this.container.appendChild(this.iconElement);
    }
    
    this.container.appendChild(this.contentElement);
    
    if (options.onUpdate && options.updateInterval !== 0) {
      this.startUpdating(options.updateInterval || 100);
    }
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    
    if (this.options.id) {
      container.id = this.options.id;
    }
    
    if (this.options.className) {
      container.className = this.options.className;
    }
    
    // Base styles that all floating UI elements share
    const baseStyles = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid ${this.options.borderColor || '#FFD700'};
      border-radius: 8px;
      padding: 8px 12px;
      color: ${this.options.borderColor || '#FFD700'};
      font-weight: bold;
      font-size: clamp(14px, 3vw, 18px);
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // Position styles
    const positionStyles = this.getPositionStyles();
    
    // Combine all styles
    container.style.cssText = baseStyles + positionStyles + (this.options.additionalStyles || '');
    
    return container;
  }

  private getPositionStyles(): string {
    const { position } = this.options;
    let styles = '';
    
    if (position.top !== undefined) {
      styles += `top: ${typeof position.top === 'number' ? position.top + 'px' : position.top};`;
    }
    if (position.bottom !== undefined) {
      styles += `bottom: ${typeof position.bottom === 'number' ? position.bottom + 'px' : position.bottom};`;
    }
    if (position.left !== undefined) {
      styles += `left: ${typeof position.left === 'number' ? position.left + 'px' : position.left};`;
    }
    if (position.right !== undefined) {
      styles += `right: ${typeof position.right === 'number' ? position.right + 'px' : position.right};`;
    }
    
    return styles;
  }

  private createIconElement(iconType: IconType, size: number): HTMLElement {
    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'display: flex; align-items: center;';
    iconSpan.innerHTML = createSvgIcon(iconType, { size });
    return iconSpan;
  }

  private createContentElement(): HTMLElement {
    const content = document.createElement('span');
    return content;
  }

  private startUpdating(interval: number): void {
    if (this.options.onUpdate) {
      this.updateInterval = window.setInterval(() => {
        if (this.options.onUpdate) {
          this.options.onUpdate(this);
        }
      }, interval);
    }
  }

  public setContent(html: string): void {
    this.contentElement.innerHTML = html;
  }

  public setBorderColor(color: string): void {
    this.container.style.borderColor = color;
    this.container.style.color = color;
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  public unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  public show(): void {
    this.container.style.display = 'flex';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public cleanup(): void {
    if (this.updateInterval !== null) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.unmount();
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}