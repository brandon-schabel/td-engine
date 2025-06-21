import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export interface IconButtonOptions {
  iconType: IconType;
  iconSize?: number;
  title?: string;
  onClick: () => void;
  className?: string;
  baseColor?: string;
  hoverColor?: string;
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
    
    // Set base class
    button.className = 'icon-button';
    
    // Add custom class if provided
    if (this.options.className) {
      button.className += ' ' + this.options.className;
    }
    
    // Set data attributes for styling
    if (this.options.baseColor) {
      button.dataset.baseColor = this.options.baseColor;
    }
    if (this.options.hoverColor) {
      button.dataset.hoverColor = this.options.hoverColor;
    }
    
    if (this.options.title) {
      button.title = this.options.title;
    }
    
    // Add icon
    const iconSize = this.options.iconSize || 18;
    button.innerHTML = createSvgIcon(this.options.iconType, { size: iconSize });
    
    // Add click handler
    button.addEventListener('click', this.options.onClick);
    
    return button;
  }

  public getElement(): HTMLButtonElement {
    return this.button;
  }

  public setEnabled(enabled: boolean): void {
    this.button.disabled = !enabled;
    if (!enabled) {
      this.button.classList.add('disabled');
    } else {
      this.button.classList.remove('disabled');
    }
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