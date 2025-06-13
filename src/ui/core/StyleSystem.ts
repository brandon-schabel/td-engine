/**
 * CSS-in-JS style system with theme support
 * Provides runtime styling, theme management, and responsive utilities
 */

import type { Theme, ComponentStyle } from './types';
import { defaultTheme } from './themes/defaultTheme';

export class StyleSystem {
  private static instance: StyleSystem;
  private theme: Theme;
  private styleSheet: CSSStyleSheet | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private classCounter = 0;
  private cachedStyles = new Map<string, string>();
  private mediaQueryListeners = new Map<string, MediaQueryList>();

  private constructor() {
    this.theme = defaultTheme;
    this.initializeStyleSheet();
    this.setupMediaQueryListeners();
    this.injectGlobalStyles();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StyleSystem {
    if (!StyleSystem.instance) {
      StyleSystem.instance = new StyleSystem();
    }
    return StyleSystem.instance;
  }

  /**
   * Initialize style sheet
   */
  private initializeStyleSheet(): void {
    // Create style element
    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-ui-styles', 'true');
    document.head.appendChild(this.styleElement);

    // Get stylesheet
    if (this.styleElement.sheet) {
      this.styleSheet = this.styleElement.sheet;
    }
  }

  /**
   * Setup media query listeners for responsive design
   */
  private setupMediaQueryListeners(): void {
    Object.entries(this.theme.breakpoints).forEach(([key, value]) => {
      const mql = window.matchMedia(`(min-width: ${value}px)`);
      this.mediaQueryListeners.set(key, mql);
    });
  }

  /**
   * Inject global styles
   */
  private injectGlobalStyles(): void {
    const globalStyles = `
      /* CSS Reset and Base Styles */
      *, *::before, *::after {
        box-sizing: border-box;
      }

      /* UI Component Base */
      .ui-component {
        font-family: ${this.theme.typography.fontFamily};
        color: ${this.theme.colors.text};
      }

      /* Utility Classes */
      .ui-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Focus Styles */
      .ui-component:focus-visible {
        outline: 2px solid ${this.theme.colors.primary};
        outline-offset: 2px;
      }

      /* Transitions */
      .ui-transition-all {
        transition: all ${this.theme.transitions.normal};
      }

      .ui-transition-colors {
        transition: background-color ${this.theme.transitions.fast},
                    border-color ${this.theme.transitions.fast},
                    color ${this.theme.transitions.fast};
      }

      /* Animations */
      @keyframes ui-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes ui-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes ui-slide-in-up {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes ui-slide-in-down {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes ui-scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      @keyframes ui-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Touch-specific styles */
      @media (hover: none) and (pointer: coarse) {
        .ui-component {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        .ui-button {
          min-height: 44px;
          min-width: 44px;
        }
      }

      /* Dark theme base */
      :root {
        color-scheme: dark;
      }
    `;

    this.addRawCSS(globalStyles);
  }

  /**
   * Create styled component with CSS-in-JS
   */
  css(styles: ComponentStyle | ((theme: Theme) => ComponentStyle)): string {
    // Generate style object
    const styleObj = typeof styles === 'function' ? styles(this.theme) : styles;
    
    // Create cache key
    const cacheKey = JSON.stringify(styleObj);
    
    // Check cache
    if (this.cachedStyles.has(cacheKey)) {
      return this.cachedStyles.get(cacheKey)!;
    }

    // Generate class name
    const className = `ui-${++this.classCounter}`;
    
    // Convert style object to CSS
    const cssRules = this.styleObjectToCSS(styleObj);
    const cssText = `.${className} { ${cssRules} }`;
    
    // Add to stylesheet
    this.addRawCSS(cssText);
    
    // Cache the class name
    this.cachedStyles.set(cacheKey, className);
    
    return className;
  }

  /**
   * Create responsive styles
   */
  responsive(styles: {
    base?: ComponentStyle;
    xs?: ComponentStyle;
    sm?: ComponentStyle;
    md?: ComponentStyle;
    lg?: ComponentStyle;
    xl?: ComponentStyle;
  }): string {
    const className = `ui-responsive-${++this.classCounter}`;
    let cssText = '';

    // Base styles
    if (styles.base) {
      const baseRules = this.styleObjectToCSS(styles.base);
      cssText += `.${className} { ${baseRules} }\n`;
    }

    // Responsive styles
    const breakpoints: Array<keyof typeof styles> = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    breakpoints.forEach(breakpoint => {
      if (styles[breakpoint] && this.theme.breakpoints[breakpoint]) {
        const rules = this.styleObjectToCSS(styles[breakpoint]!);
        cssText += `@media (min-width: ${this.theme.breakpoints[breakpoint]}px) {
          .${className} { ${rules} }
        }\n`;
      }
    });

    this.addRawCSS(cssText);
    return className;
  }

  /**
   * Create keyframe animation
   */
  keyframes(keyframes: Record<string, ComponentStyle>): string {
    const animationName = `ui-animation-${++this.classCounter}`;
    
    let keyframeRules = `@keyframes ${animationName} {\n`;
    
    Object.entries(keyframes).forEach(([key, styles]) => {
      const rules = this.styleObjectToCSS(styles);
      keyframeRules += `  ${key} { ${rules} }\n`;
    });
    
    keyframeRules += '}';
    
    this.addRawCSS(keyframeRules);
    return animationName;
  }

  /**
   * Combine multiple class names
   */
  cx(...classNames: (string | undefined | null | false)[]): string {
    return classNames.filter(Boolean).join(' ');
  }

  /**
   * Convert style object to CSS string
   */
  private styleObjectToCSS(styles: ComponentStyle): string {
    return Object.entries(styles)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssProperty = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
        return `${cssProperty}: ${value};`;
      })
      .join(' ');
  }

  /**
   * Add raw CSS to stylesheet
   */
  private addRawCSS(css: string): void {
    if (this.styleSheet) {
      try {
        this.styleSheet.insertRule(css, this.styleSheet.cssRules.length);
      } catch (e) {
        console.warn('Failed to insert CSS rule:', e);
        // Fallback to text content
        if (this.styleElement) {
          this.styleElement.textContent += css;
        }
      }
    }
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.theme;
  }

  /**
   * Update theme
   */
  setTheme(theme: Theme): void {
    this.theme = theme;
    // Clear cache as styles may change with new theme
    this.cachedStyles.clear();
    // Re-inject global styles with new theme
    this.injectGlobalStyles();
  }

  /**
   * Get breakpoint media query
   */
  getBreakpoint(breakpoint: keyof Theme['breakpoints']): MediaQueryList | undefined {
    return this.mediaQueryListeners.get(breakpoint);
  }

  /**
   * Check if current viewport matches breakpoint
   */
  matchesBreakpoint(breakpoint: keyof Theme['breakpoints']): boolean {
    const mql = this.mediaQueryListeners.get(breakpoint);
    return mql ? mql.matches : false;
  }

  /**
   * Utility to create CSS variables from theme
   */
  createCSSVariables(): string {
    const vars: string[] = [];
    
    // Colors
    Object.entries(this.theme.colors).forEach(([key, value]) => {
      vars.push(`--ui-color-${key}: ${value};`);
    });
    
    // Spacing
    Object.entries(this.theme.spacing).forEach(([key, value]) => {
      vars.push(`--ui-spacing-${key}: ${value};`);
    });
    
    // Typography
    Object.entries(this.theme.typography.fontSize).forEach(([key, value]) => {
      vars.push(`--ui-font-size-${key}: ${value};`);
    });
    
    // Border radius
    Object.entries(this.theme.borderRadius).forEach(([key, value]) => {
      vars.push(`--ui-radius-${key}: ${value};`);
    });
    
    // Shadows
    Object.entries(this.theme.shadows).forEach(([key, value]) => {
      vars.push(`--ui-shadow-${key}: ${value};`);
    });
    
    return `:root { ${vars.join(' ')} }`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove();
    }
    this.cachedStyles.clear();
    this.mediaQueryListeners.clear();
  }
}

// Export singleton instance
export const styleSystem = StyleSystem.getInstance();