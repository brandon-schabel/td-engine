import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export type FloatingUIPosition = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export type FloatingUIOptions = {
  position: FloatingUIPosition;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  zIndex?: number;
  updateInterval?: number;
  className?: string;
}

export abstract class FloatingUIBase {
  protected element: HTMLDivElement;
  protected updateInterval?: number;
  protected intervalId?: number;
  
  constructor(protected options: FloatingUIOptions) {
    this.element = this.createElement();
    this.applyStyles();
    
    if (this.options.updateInterval) {
      this.startUpdateInterval();
    }
  }
  
  protected createElement(): HTMLDivElement {
    const element = document.createElement('div');
    element.className = `floating-ui-element ${this.options.className || ''}`;
    return element;
  }
  
  protected applyStyles(): void {
    const {
      position,
      backgroundColor = COLOR_THEME.ui.background.overlay,
      borderColor = COLOR_THEME.ui.currency,
      borderWidth = UI_CONSTANTS.floatingUI.borderWidth,
      borderRadius = UI_CONSTANTS.floatingUI.borderRadius,
      padding = `${UI_CONSTANTS.floatingUI.padding}px`,
      textColor = COLOR_THEME.ui.currency,
      fontSize = 'clamp(14px, 3vw, 18px)',
      fontWeight = 'bold',
      zIndex = UI_CONSTANTS.zIndex.ui
    } = this.options;
    
    // Build position string
    const positionStyles: string[] = ['position: absolute'];
    if (position.top !== undefined) positionStyles.push(`top: ${position.top}px`);
    if (position.bottom !== undefined) positionStyles.push(`bottom: ${position.bottom}px`);
    if (position.left !== undefined) positionStyles.push(`left: ${position.left}px`);
    if (position.right !== undefined) positionStyles.push(`right: ${position.right}px`);
    
    this.element.style.cssText = `
      ${positionStyles.join('; ')};
      background: ${backgroundColor};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: ${borderRadius}px;
      padding: ${padding};
      color: ${textColor};
      font-weight: ${fontWeight};
      font-size: ${fontSize};
      z-index: ${zIndex};
      display: flex;
      align-items: center;
      gap: ${UI_CONSTANTS.spacing.sm}px;
    `;
  }
  
  protected startUpdateInterval(): void {
    if (this.options.updateInterval && this.update) {
      this.intervalId = window.setInterval(() => {
        this.update!();
      }, this.options.updateInterval);
      // Initial update
      this.update();
    }
  }
  
  protected createIcon(iconType: IconType, size: number = 20): string {
    return createSvgIcon(iconType, { size });
  }
  
  public mount(container: HTMLElement): void {
    console.log('[FloatingUIBase] Mounting element:', this.element.className, 'to container:', container.id);
    container.appendChild(this.element);
    console.log('[FloatingUIBase] Element mounted. Parent:', this.element.parentNode?.nodeName);
    console.log('[FloatingUIBase] Element styles:', this.element.style.cssText);
  }
  
  public unmount(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.unmount();
  }
  
  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'flex' : 'none';
  }
  
  public updateStyle(key: keyof CSSStyleDeclaration, value: string): void {
    (this.element.style as any)[key] = value;
  }
  
  public updateStyles(styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(this.element.style, styles);
  }
  
  // Override this method in subclasses to provide update logic
  protected update?(): void;
}