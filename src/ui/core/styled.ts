/**
 * Styled components system for dynamic CSS-in-JS styling
 * Provides a simple template literal based styling system with theme support
 */

import type { Theme } from './types';
import { defaultTheme } from './themes/defaultTheme';

// Current theme instance
let currentTheme: Theme = defaultTheme;

// Type for styled component template function
type StyledTemplateFunction = (strings: TemplateStringsArray, ...values: any[]) => StyledComponent;

// Type for styled component with theme
type StyledComponentWithTheme = (props?: { theme?: Theme; [key: string]: any }) => HTMLElement;

// Base styled component class
class StyledComponent {
  public tagName: string;
  private styles: string;
  private baseComponent?: StyledComponent;

  constructor(tagName: string, styles: string, baseComponent?: StyledComponent) {
    this.tagName = tagName;
    this.styles = styles;
    this.baseComponent = baseComponent;
  }

  // Create element with styles applied
  create(props?: { theme?: Theme; [key: string]: any }): HTMLElement {
    const element = document.createElement(this.tagName);
    const theme = props?.theme || currentTheme;
    
    // Process template styles with theme and props
    const processedStyles = this.processStyles(this.styles, { theme, ...props });
    
    // Apply base component styles if extending
    if (this.baseComponent) {
      const baseStyles = this.processStyles(this.baseComponent.styles, { theme, ...props });
      this.applyStyles(element, baseStyles);
    }
    
    // Apply current styles
    this.applyStyles(element, processedStyles);
    
    return element;
  }

  // Process template literal styles
  private processStyles(styles: string, context: any): string {
    return styles.replace(/\${([^}]+)}/g, (match, expression) => {
      try {
        // Create function to evaluate expression with context
        const func = new Function(...Object.keys(context), `return ${expression}`);
        const result = func(...Object.values(context));
        return result || '';
      } catch (e) {
        console.warn(`Failed to process style expression: ${expression}`, e);
        return '';
      }
    });
  }

  // Apply CSS styles to element
  private applyStyles(element: HTMLElement, styles: string): void {
    // Create a style element to parse CSS
    const styleEl = document.createElement('style');
    const uniqueClass = `styled-${Math.random().toString(36).substr(2, 9)}`;
    
    // Wrap styles in a class selector
    styleEl.textContent = `.${uniqueClass} { ${styles} }`;
    
    // Add to document head temporarily to validate
    document.head.appendChild(styleEl);
    
    // Apply class to element
    element.classList.add(uniqueClass);
    
    // Clean up - the styles remain applied via the class
    setTimeout(() => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    }, 0);
  }

  // Template literal handler
  toString(): string {
    return this.styles;
  }
}

// Main styled object with element creators
export const styled = {
  // Common HTML elements
  div: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('div', styles);
  },
  
  span: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('span', styles);
  },
  
  p: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('p', styles);
  },
  
  h1: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('h1', styles);
  },
  
  h2: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('h2', styles);
  },
  
  h3: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('h3', styles);
  },
  
  button: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('button', styles);
  },
  
  input: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('input', styles);
  },
  
  select: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('select', styles);
  },
  
  textarea: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('textarea', styles);
  },
  
  label: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('label', styles);
  },
  
  ul: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('ul', styles);
  },
  
  li: (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent('li', styles);
  },
};

// Function to extend existing styled components
export function extendStyled(baseComponent: StyledComponent): StyledTemplateFunction {
  return (strings: TemplateStringsArray, ...values: any[]): StyledComponent => {
    const styles = String.raw(strings, ...values);
    return new StyledComponent(baseComponent.tagName, styles, baseComponent);
  };
}

// Helper function to set global theme
export function setTheme(theme: Theme): void {
  currentTheme = theme;
}

// Helper function to get current theme
export function getTheme(): Theme {
  return currentTheme;
}

// Helper function to create element from styled component
export function createElement(
  StyledComp: StyledComponent, 
  props?: { theme?: Theme; [key: string]: any }
): HTMLElement {
  return StyledComp.create(props);
}