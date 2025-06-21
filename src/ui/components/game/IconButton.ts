import { IconType } from '@/ui/icons/SvgIcons';
import { createIconButton as createIconButtonElement } from '@/ui/elements';
import type { CreateButtonOptions } from '@/ui/elements';

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
    // Map old options to new createIconButton options
    const buttonOptions: Partial<CreateButtonOptions> = {
      ariaLabel: this.options.title,
      onClick: this.options.onClick,
      variant: 'ghost', // Default to ghost variant for icon buttons
      iconSize: this.options.iconSize,
      customClasses: []
    };

    // Add custom classes
    if (this.options.className) {
      buttonOptions.customClasses!.push(...this.options.className.split(' '));
    }

    // Create button using the new abstraction
    const button = createIconButtonElement(this.options.iconType, buttonOptions);

    // Handle custom colors if provided (via CSS custom properties)
    if (this.options.baseColor || this.options.hoverColor) {
      if (this.options.baseColor) {
        button.style.setProperty('--button-color', this.options.baseColor);
      }
      if (this.options.hoverColor) {
        button.style.setProperty('--button-hover-color', this.options.hoverColor);
      }
    }
    
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