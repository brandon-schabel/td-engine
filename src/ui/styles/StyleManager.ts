import { COLOR_THEME, UI_CONSTANTS, ANIMATION_CONFIG, RESPONSIVE_CONFIG } from '@/config';

export class StyleManager {
  private static instance: StyleManager;
  private styleElement: HTMLStyleElement | null = null;
  private styles: Map<string, string> = new Map();
  private injected = false;

  private constructor() {}

  static getInstance(): StyleManager {
    if (!StyleManager.instance) {
      StyleManager.instance = new StyleManager();
    }
    return StyleManager.instance;
  }

  addStyles(id: string, styles: string): void {
    this.styles.set(id, styles);
    if (this.injected) {
      this.reinject();
    }
  }

  removeStyles(id: string): void {
    this.styles.delete(id);
    if (this.injected) {
      this.reinject();
    }
  }

  inject(): void {
    if (this.injected) return;

    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-style-manager', 'true');
    this.updateStyleContent();
    document.head.appendChild(this.styleElement);
    this.injected = true;
  }

  private reinject(): void {
    if (!this.styleElement) return;
    this.updateStyleContent();
  }

  private updateStyleContent(): void {
    if (!this.styleElement) return;
    
    const cssVariables = this.generateCSSVariables();
    const allStyles = Array.from(this.styles.values()).join('\n');
    
    this.styleElement.textContent = `
      :root {
        ${cssVariables}
      }
      ${allStyles}
    `;
  }

  private generateCSSVariables(): string {
    const variables: string[] = [];
    
    // Colors
    Object.entries(COLOR_THEME.ui).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        variables.push(`--color-${category}-${key}: ${value};`);
      });
    });
    
    // Tower colors
    Object.entries(COLOR_THEME.towers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables.push(`--color-game-tower-${key}: ${value};`);
      }
    });
    
    // Game health colors
    Object.entries(COLOR_THEME.ui.health).forEach(([key, value]) => {
      variables.push(`--color-game-health-${key}: ${value};`);
    });
    
    // Damage colors
    variables.push(`--color-game-damage-physical: ${COLOR_THEME.effects.damage};`);
    variables.push(`--color-game-damage-magical: ${COLOR_THEME.effects.freeze};`);
    variables.push(`--color-game-damage-critical: ${COLOR_THEME.effects.explosion};`);
    
    // Spacing
    Object.entries(UI_CONSTANTS.spacing).forEach(([key, value]) => {
      variables.push(`--spacing-${key}: ${value}px;`);
    });
    
    // Define standard border radius values
    variables.push(`--radius-sm: 4px;`);
    variables.push(`--radius-md: 8px;`);
    variables.push(`--radius-lg: 12px;`);
    
    // Define standard font sizes
    variables.push(`--font-xs: 12px;`);
    variables.push(`--font-sm: 14px;`);
    variables.push(`--font-base: 16px;`);
    variables.push(`--font-lg: 18px;`);
    variables.push(`--font-xl: 24px;`);
    variables.push(`--font-xxl: 32px;`);
    
    // Animation durations
    Object.entries(ANIMATION_CONFIG.durations).forEach(([key, value]) => {
      variables.push(`--duration-${key}: ${value}ms;`);
    });
    // Add missing durations that UIStyles expects
    variables.push(`--duration-toggle: 200ms;`);
    variables.push(`--duration-cardHover: 200ms;`);
    variables.push(`--duration-healthChange: 300ms;`);
    variables.push(`--duration-sliderChange: 150ms;`);
    variables.push(`--duration-statChange: 300ms;`);
    
    // Animation easings  
    variables.push(`--easing-smooth: ease-in-out;`);
    variables.push(`--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);`);
    if (ANIMATION_CONFIG.easing) {
      Object.entries(ANIMATION_CONFIG.easing).forEach(([key, value]) => {
        variables.push(`--easing-${key}: ${value};`);
      });
    }
    
    // Responsive breakpoints
    Object.entries(RESPONSIVE_CONFIG.breakpoints).forEach(([key, value]) => {
      variables.push(`--breakpoint-${key}: ${value}px;`);
    });
    
    // Z-index layers
    Object.entries(UI_CONSTANTS.zIndex).forEach(([key, value]) => {
      variables.push(`--z-${key}: ${value};`);
    });
    
    // Additional UI colors
    variables.push(`--color-surface-primary: ${COLOR_THEME.ui.background.primary};`);
    variables.push(`--color-surface-secondary: ${COLOR_THEME.ui.background.secondary};`);
    variables.push(`--color-surface-hover: rgba(255, 255, 255, 0.05);`);
    variables.push(`--color-surface-tooltip: rgba(0, 0, 0, 0.9);`);
    variables.push(`--color-border-primary: ${COLOR_THEME.ui.border.default};`);
    variables.push(`--color-border-subtle: rgba(255, 255, 255, 0.1);`);
    variables.push(`--color-text-primary: ${COLOR_THEME.ui.text.primary};`);
    variables.push(`--color-text-secondary: ${COLOR_THEME.ui.text.secondary};`);
    variables.push(`--color-text-success: ${COLOR_THEME.ui.text.success};`);
    variables.push(`--color-text-warning: ${COLOR_THEME.ui.text.warning};`);
    variables.push(`--color-status-success: ${COLOR_THEME.ui.text.success};`);
    variables.push(`--color-status-warning: ${COLOR_THEME.ui.text.warning};`);
    variables.push(`--color-status-error: ${COLOR_THEME.ui.text.danger};`);
    
    // Mobile control colors
    variables.push(`--color-controls-joystick-base: rgba(255, 255, 255, 0.2);`);
    variables.push(`--color-controls-joystick-baseBorder: rgba(255, 255, 255, 0.5);`);
    variables.push(`--color-controls-joystick-knob: rgba(255, 255, 255, 0.5);`);
    variables.push(`--color-controls-joystick-knobBorder: rgba(255, 255, 255, 0.7);`);
    
    // Additional animation durations
    variables.push(`--duration-fast: 150ms;`);
    variables.push(`--duration-uiTransition: 200ms;`);
    
    // Additional z-index values  
    variables.push(`--z-controls: 9999;`);
    variables.push(`--z-tooltip: 10000;`);
    variables.push(`--z-floatingText: 1000;`);
    variables.push(`--z-hud: 100;`);
    
    return variables.join('\n        ');
  }

  cleanup(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.injected = false;
    this.styles.clear();
  }

  getStyles(): string {
    return Array.from(this.styles.values()).join('\n');
  }

  hasStyles(id: string): boolean {
    return this.styles.has(id);
  }
}

export const styleManager = StyleManager.getInstance();