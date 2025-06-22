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
    
    // Colors - flatten nested structure
    Object.entries(COLOR_THEME.ui).forEach(([category, values]) => {
      if (typeof values === 'object' && values !== null) {
        Object.entries(values).forEach(([key, value]) => {
          variables.push(`--color-${category}-${key}: ${value};`);
        });
      }
    });
    
    // Add specific text colors that components expect
    variables.push(`--color-text-primary: ${COLOR_THEME.ui.text.primary};`);
    variables.push(`--color-text-secondary: ${COLOR_THEME.ui.text.secondary};`);
    variables.push(`--color-text-muted: ${COLOR_THEME.ui.text.secondary};`);
    variables.push(`--color-text-foreground: ${COLOR_THEME.ui.text.primary};`);
    variables.push(`--color-text-success: ${COLOR_THEME.ui.text.success};`);
    variables.push(`--color-text-warning: ${COLOR_THEME.ui.text.warning};`);
    variables.push(`--color-text-on-primary: #FFFFFF;`);
    variables.push(`--color-text-on-secondary: #FFFFFF;`);
    variables.push(`--color-text-on-danger: #FFFFFF;`);
    variables.push(`--color-text-on-success: #FFFFFF;`);
    variables.push(`--color-text-on-warning: #000000;`);
    
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
    
    // Spacing - Numeric scale for utilities
    variables.push(`--spacing-0: 0px;`);
    variables.push(`--spacing-1: 4px;`);
    variables.push(`--spacing-2: 8px;`);
    variables.push(`--spacing-3: 12px;`);
    variables.push(`--spacing-4: 16px;`);
    variables.push(`--spacing-5: 20px;`);
    variables.push(`--spacing-6: 24px;`);
    variables.push(`--spacing-8: 32px;`);
    variables.push(`--spacing-10: 40px;`);
    variables.push(`--spacing-12: 48px;`);
    variables.push(`--spacing-16: 64px;`);
    variables.push(`--spacing-20: 80px;`);
    variables.push(`--spacing-24: 96px;`);
    
    // Named spacing (mapped to numeric scale)
    Object.entries(UI_CONSTANTS.spacing).forEach(([key, value]) => {
      variables.push(`--spacing-${key}: ${value}px;`);
    });
    
    // Define standard border radius values
    variables.push(`--radius-xs: 2px;`);
    variables.push(`--radius-sm: 4px;`);
    variables.push(`--radius-md: 8px;`);
    variables.push(`--radius-lg: 12px;`);
    variables.push(`--radius-full: 9999px;`);
    
    // Define standard font sizes
    variables.push(`--font-xs: 12px;`);
    variables.push(`--font-sm: 14px;`);
    variables.push(`--font-base: 16px;`);
    variables.push(`--font-lg: 18px;`);
    variables.push(`--font-xl: 24px;`);
    variables.push(`--font-xxl: 32px;`);
    
    // Font weights
    variables.push(`--font-weight-light: 300;`);
    variables.push(`--font-weight-normal: 400;`);
    variables.push(`--font-weight-medium: 500;`);
    variables.push(`--font-weight-semibold: 600;`);
    variables.push(`--font-weight-bold: 700;`);
    
    // Line heights
    variables.push(`--line-height-tight: 1.25;`);
    variables.push(`--line-height-normal: 1.5;`);
    variables.push(`--line-height-relaxed: 1.75;`);
    
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
    variables.push(`--color-surface-tertiary: rgba(255, 255, 255, 0.1);`);
    variables.push(`--color-surface-hover: rgba(255, 255, 255, 0.05);`);
    variables.push(`--color-surface-tooltip: rgba(0, 0, 0, 0.9);`);
    variables.push(`--color-surface-border: rgba(255, 255, 255, 0.2);`);
    variables.push(`--color-border-primary: ${COLOR_THEME.ui.border.default};`);
    variables.push(`--color-border-subtle: rgba(255, 255, 255, 0.1);`);
    variables.push(`--color-status-success: ${COLOR_THEME.ui.text.success};`);
    variables.push(`--color-status-warning: ${COLOR_THEME.ui.text.warning};`);
    variables.push(`--color-status-error: ${COLOR_THEME.ui.text.danger};`);
    
    // Color variations
    variables.push(`--color-primary: ${COLOR_THEME.ui.button.primary};`);
    variables.push(`--color-primary-dark: #3456c4;`); // Darker shade of primary
    variables.push(`--color-primary-light: #5a82e3;`); // Lighter shade of primary
    variables.push(`--color-secondary: ${COLOR_THEME.ui.button.secondary};`);
    variables.push(`--color-secondary-dark: #606060;`); // Darker shade of secondary
    variables.push(`--color-secondary-light: #a0a0a0;`); // Lighter shade of secondary
    variables.push(`--color-danger: ${COLOR_THEME.ui.button.danger};`);
    variables.push(`--color-danger-dark: #cc0000;`); // Darker shade of danger
    variables.push(`--color-success: ${COLOR_THEME.ui.button.success};`);
    variables.push(`--color-success-dark: #00cc00;`); // Darker shade of success
    variables.push(`--color-warning: ${COLOR_THEME.ui.text.warning};`);
    variables.push(`--color-warning-dark: #cccc00;`); // Darker shade of warning
    
    // Text on colored backgrounds
    variables.push(`--color-text-on-primary: #ffffff;`);
    variables.push(`--color-text-on-secondary: #ffffff;`);
    variables.push(`--color-text-on-danger: #ffffff;`);
    variables.push(`--color-text-on-success: #000000;`);
    variables.push(`--color-text-on-warning: #000000;`);
    
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
    
    // Border widths
    variables.push(`--border-width-default: 1px;`);
    variables.push(`--border-width-thick: 2px;`);
    variables.push(`--border-width-heavy: 4px;`);
    
    // Shadows
    variables.push(`--shadow-none: none;`);
    variables.push(`--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);`);
    variables.push(`--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);`);
    variables.push(`--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);`);
    variables.push(`--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);`);
    variables.push(`--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);`);
    
    // Opacity
    variables.push(`--opacity-0: 0;`);
    variables.push(`--opacity-5: 0.05;`);
    variables.push(`--opacity-10: 0.1;`);
    variables.push(`--opacity-20: 0.2;`);
    variables.push(`--opacity-25: 0.25;`);
    variables.push(`--opacity-30: 0.3;`);
    variables.push(`--opacity-40: 0.4;`);
    variables.push(`--opacity-50: 0.5;`);
    variables.push(`--opacity-60: 0.6;`);
    variables.push(`--opacity-70: 0.7;`);
    variables.push(`--opacity-75: 0.75;`);
    variables.push(`--opacity-80: 0.8;`);
    variables.push(`--opacity-90: 0.9;`);
    variables.push(`--opacity-95: 0.95;`);
    variables.push(`--opacity-100: 1;`);
    
    // Common gradients
    variables.push(`--gradient-card-default: linear-gradient(135deg, rgba(33, 37, 41, 0.95) 0%, rgba(40, 44, 48, 0.95) 100%);`);
    variables.push(`--gradient-card-hover: linear-gradient(135deg, rgba(40, 44, 48, 0.98) 0%, rgba(48, 52, 56, 0.98) 100%);`);
    variables.push(`--gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);`);
    variables.push(`--gradient-success: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%);`);
    variables.push(`--gradient-danger: linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-dark) 100%);`);
    variables.push(`--gradient-overlay: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);`);
    
    // Common transition properties
    variables.push(`--transition-base: all var(--duration-uiTransition) var(--easing-smooth);`);
    variables.push(`--transition-hover: all var(--duration-cardHover) var(--easing-smooth);`);
    variables.push(`--transition-fast: all var(--duration-fast) var(--easing-smooth);`);
    
    // Button specific colors
    variables.push(`--color-button-primary: ${COLOR_THEME.ui.button.primary};`);
    variables.push(`--color-button-secondary: ${COLOR_THEME.ui.button.secondary};`);
    variables.push(`--color-button-danger: ${COLOR_THEME.ui.button.danger};`);
    variables.push(`--color-button-success: ${COLOR_THEME.ui.button.success};`);
    
    // Background overlay
    variables.push(`--color-background-overlay: rgba(0, 0, 0, 0.7);`);
    
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