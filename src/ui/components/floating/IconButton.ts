import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export interface IconButtonOptions {
  iconType: IconType;
  iconSize?: number;
  title?: string;
  onClick: () => void;
  className?: string;
  styles?: Partial<CSSStyleDeclaration>;
}

export class IconButton {
  private button: HTMLButtonElement;
  
  constructor(private options: IconButtonOptions) {
    this.button = this.createElement();
    this.setupEventListeners();
  }
  
  private createElement(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `icon-button ${this.options.className || ''}`;
    
    // Default styles
    const defaultStyles: Partial<CSSStyleDeclaration> = {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: `${UI_CONSTANTS.floatingUI.borderRadius / 2}px`,
      transition: 'all 0.2s'
    };
    
    // Apply styles
    Object.assign(button.style, defaultStyles, this.options.styles);
    
    // Add icon
    const iconSize = this.options.iconSize || 18;
    button.innerHTML = createSvgIcon(this.options.iconType, { size: iconSize });
    
    // Add title if provided
    if (this.options.title) {
      button.title = this.options.title;
    }
    
    return button;
  }
  
  private setupEventListeners(): void {
    // Click handler
    this.button.addEventListener('click', this.options.onClick);
    
    // Hover effects
    this.button.addEventListener('mouseenter', () => {
      this.button.style.background = COLOR_THEME.ui.button.hover;
      this.button.style.transform = 'scale(1.1)';
    });
    
    this.button.addEventListener('mouseleave', () => {
      this.button.style.background = 'none';
      this.button.style.transform = 'scale(1)';
    });
  }
  
  public getElement(): HTMLButtonElement {
    return this.button;
  }
  
  public setEnabled(enabled: boolean): void {
    this.button.disabled = !enabled;
    this.button.style.opacity = enabled ? '1' : '0.5';
    this.button.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }
  
  public destroy(): void {
    this.button.removeEventListener('click', this.options.onClick);
  }
}