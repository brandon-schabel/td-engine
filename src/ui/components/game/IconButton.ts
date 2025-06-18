import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface IconButtonOptions {
  iconType: IconType;
  iconSize?: number;
  title?: string;
  onClick: () => void;
  className?: string;
  baseColor?: string;
  hoverColor?: string;
  style?: Partial<CSSStyleDeclaration>;
}

export class IconButton {
  private button: HTMLButtonElement;
  private options: IconButtonOptions;

  constructor(options: IconButtonOptions) {
    this.options = options;
    this.button = this.createButton();
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    
    if (this.options.className) {
      button.className = this.options.className;
    }
    
    const baseColor = this.options.baseColor || '#00BCD4';
    const hoverColor = this.options.hoverColor || 'rgba(0, 188, 212, 0.2)';
    
    // Default button styles
    button.style.cssText = `
      background: none;
      border: none;
      color: ${baseColor};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 4px;
      border-radius: 4px;
    `;
    
    // Apply custom styles if provided
    if (this.options.style) {
      Object.assign(button.style, this.options.style);
    }
    
    if (this.options.title) {
      button.title = this.options.title;
    }
    
    // Add icon
    const iconSize = this.options.iconSize || 18;
    button.innerHTML = createSvgIcon(this.options.iconType, { size: iconSize });
    
    // Add click handler
    button.addEventListener('click', this.options.onClick);
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'none';
      button.style.transform = 'scale(1)';
    });
    
    return button;
  }

  public getElement(): HTMLButtonElement {
    return this.button;
  }

  public setEnabled(enabled: boolean): void {
    this.button.disabled = !enabled;
    this.button.style.opacity = enabled ? '1' : '0.5';
    this.button.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.button);
  }

  public unmount(): void {
    if (this.button.parentElement) {
      this.button.parentElement.removeChild(this.button);
    }
  }
}