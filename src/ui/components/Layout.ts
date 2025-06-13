/**
 * Responsive Layout Components
 * Provides flexible, touch-friendly layout utilities for modern UI
 */

import { Component } from '../core/Component';
import type { ComponentProps, ComponentState } from '../core/types';
import { StyleSystem } from '../core/StyleSystem';

// Layout component types
export interface LayoutProps extends ComponentProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean;
  gap?: number | string;
  padding?: number | string;
  margin?: number | string;
  grow?: number;
  shrink?: number;
  basis?: number | string;
  responsive?: boolean;
}

export interface GridProps extends ComponentProps {
  columns?: number | string;
  rows?: number | string;
  gap?: number | string;
  columnGap?: number | string;
  rowGap?: number | string;
  areas?: string;
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  responsive?: boolean;
}

export interface GridItemProps extends ComponentProps {
  column?: string | number;
  row?: string | number;
  area?: string;
  colSpan?: number;
  rowSpan?: number;
  justifySelf?: 'start' | 'end' | 'center' | 'stretch';
  alignSelf?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
}

export interface ContainerProps extends ComponentProps {
  maxWidth?: number | string;
  center?: boolean;
  fluid?: boolean;
  responsive?: boolean;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface StackProps extends ComponentProps {
  spacing?: number | string;
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'end' | 'center' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around';
  wrap?: boolean;
  responsive?: boolean;
}

/**
 * Flex Layout Component
 * Modern flexbox container with responsive utilities
 */
export class Flex extends Component<LayoutProps> {
  protected getDefaultProps(): Partial<LayoutProps> {
    return {
      direction: 'row',
      justify: 'start',
      align: 'stretch',
      wrap: false,
      gap: 0,
      responsive: true
    };
  }

  protected render(): string {
    const {
      direction,
      justify,
      align,
      wrap,
      gap,
      padding,
      margin,
      grow,
      shrink,
      basis,
      responsive,
      children
    } = this.mergedProps;

    const styles = this.getFlexStyles();
    
    return `
      <div class="${styles.container}">
        ${typeof children === 'string' ? children : ''}
      </div>
    `;
  }

  private getFlexStyles() {
    const {
      direction,
      justify,
      align,
      wrap,
      gap,
      padding,
      margin,
      grow,
      shrink,
      basis,
      responsive
    } = this.mergedProps;

    const baseStyles = {
      display: 'flex',
      flexDirection: direction,
      justifyContent: justify,
      alignItems: align,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      padding: typeof padding === 'number' ? `${padding}px` : padding,
      margin: typeof margin === 'number' ? `${margin}px` : margin,
      flexGrow: grow,
      flexShrink: shrink,
      flexBasis: typeof basis === 'number' ? `${basis}px` : basis,
    };

    // Add responsive utilities
    const responsiveStyles = responsive ? {
      '@media (max-width: 768px)': {
        flexDirection: direction === 'row' ? 'column' : direction,
        gap: typeof gap === 'number' ? `${Math.max(gap / 2, 8)}px` : gap,
      },
      '@media (max-width: 480px)': {
        padding: typeof padding === 'number' ? `${Math.max(padding / 2, 8)}px` : padding,
      }
    } : {};

    return StyleSystem.getInstance().createStyles({
      container: {
        ...baseStyles,
        ...responsiveStyles
      }
    });
  }

  /**
   * Add a child component to the flex container
   */
  addChild(child: Component<any> | HTMLElement | string): void {
    if (typeof child === 'string') {
      if (this.element) {
        this.element.innerHTML += child;
      }
    } else if (child instanceof Component) {
      child.mount(this.element!);
    } else {
      this.element?.appendChild(child);
    }
  }

  /**
   * Set flex properties for a child element
   */
  setChildFlex(childIndex: number, flex: { grow?: number; shrink?: number; basis?: string | number }): void {
    const child = this.element?.children[childIndex] as HTMLElement;
    if (child) {
      if (flex.grow !== undefined) child.style.flexGrow = flex.grow.toString();
      if (flex.shrink !== undefined) child.style.flexShrink = flex.shrink.toString();
      if (flex.basis !== undefined) {
        child.style.flexBasis = typeof flex.basis === 'number' ? `${flex.basis}px` : flex.basis;
      }
    }
  }
}

/**
 * CSS Grid Layout Component
 * Advanced grid container with responsive capabilities
 */
export class Grid extends Component<GridProps> {
  protected getDefaultProps(): Partial<GridProps> {
    return {
      columns: 'auto',
      gap: '1rem',
      autoFlow: 'row',
      responsive: true
    };
  }

  protected render(): string {
    const { children } = this.mergedProps;
    const styles = this.getGridStyles();
    
    return `
      <div class="${styles.container}">
        ${typeof children === 'string' ? children : ''}
      </div>
    `;
  }

  private getGridStyles() {
    const {
      columns,
      rows,
      gap,
      columnGap,
      rowGap,
      areas,
      autoFlow,
      responsive
    } = this.mergedProps;

    const baseStyles = {
      display: 'grid',
      gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
      gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, auto)` : rows,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      columnGap: typeof columnGap === 'number' ? `${columnGap}px` : columnGap,
      rowGap: typeof rowGap === 'number' ? `${rowGap}px` : rowGap,
      gridTemplateAreas: areas,
      gridAutoFlow: autoFlow,
    };

    // Responsive grid adjustments
    const responsiveStyles = responsive ? {
      '@media (max-width: 768px)': {
        gridTemplateColumns: typeof columns === 'number' && columns > 2 ? 
          `repeat(${Math.min(columns, 2)}, 1fr)` : columns,
        gap: typeof gap === 'number' ? `${Math.max(gap / 2, 8)}px` : gap,
      },
      '@media (max-width: 480px)': {
        gridTemplateColumns: '1fr', // Single column on mobile
        gap: '8px',
      }
    } : {};

    return StyleSystem.getInstance().createStyles({
      container: {
        ...baseStyles,
        ...responsiveStyles
      }
    });
  }

  /**
   * Create a responsive grid with auto-sizing columns
   */
  static createResponsiveGrid(minColumnWidth: number = 250): Grid {
    return new Grid({
      columns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
      gap: '1rem',
      responsive: true
    });
  }

  /**
   * Add a grid item with specific positioning
   */
  addItem(child: Component<any> | HTMLElement | string, options?: GridItemProps): void {
    const item = this.createGridItem(child, options);
    this.element?.appendChild(item);
  }

  private createGridItem(child: Component<any> | HTMLElement | string, options?: GridItemProps): HTMLElement {
    const item = document.createElement('div');
    
    if (options) {
      const styles: any = {};
      if (options.column) styles.gridColumn = options.column;
      if (options.row) styles.gridRow = options.row;
      if (options.area) styles.gridArea = options.area;
      if (options.colSpan) styles.gridColumn = `span ${options.colSpan}`;
      if (options.rowSpan) styles.gridRow = `span ${options.rowSpan}`;
      if (options.justifySelf) styles.justifySelf = options.justifySelf;
      if (options.alignSelf) styles.alignSelf = options.alignSelf;
      
      Object.assign(item.style, styles);
    }
    
    if (typeof child === 'string') {
      item.innerHTML = child;
    } else if (child instanceof Component) {
      child.mount(item);
    } else {
      item.appendChild(child);
    }
    
    return item;
  }
}

/**
 * Container Component
 * Responsive container with max-width and centering
 */
export class Container extends Component<ContainerProps> {
  protected getDefaultProps(): Partial<ContainerProps> {
    return {
      center: true,
      fluid: false,
      responsive: true,
      breakpoint: 'lg'
    };
  }

  protected render(): string {
    const { children } = this.mergedProps;
    const styles = this.getContainerStyles();
    
    return `
      <div class="${styles.container}">
        ${typeof children === 'string' ? children : ''}
      </div>
    `;
  }

  private getContainerStyles() {
    const { maxWidth, center, fluid, responsive, breakpoint } = this.mergedProps;

    const breakpoints = {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px'
    };

    const baseStyles = {
      width: '100%',
      maxWidth: fluid ? 'none' : (maxWidth || breakpoints[breakpoint!]),
      margin: center ? '0 auto' : undefined,
      padding: '0 1rem',
    };

    const responsiveStyles = responsive ? {
      '@media (max-width: 768px)': {
        padding: '0 0.75rem',
      },
      '@media (max-width: 480px)': {
        padding: '0 0.5rem',
      }
    } : {};

    return StyleSystem.getInstance().createStyles({
      container: {
        ...baseStyles,
        ...responsiveStyles
      }
    });
  }
}

/**
 * Stack Component
 * Simple vertical or horizontal stack with consistent spacing
 */
export class Stack extends Component<StackProps> {
  protected getDefaultProps(): Partial<StackProps> {
    return {
      spacing: '1rem',
      direction: 'vertical',
      align: 'stretch',
      justify: 'start',
      wrap: false,
      responsive: true
    };
  }

  protected render(): string {
    const { children } = this.mergedProps;
    const styles = this.getStackStyles();
    
    return `
      <div class="${styles.container}">
        ${typeof children === 'string' ? children : ''}
      </div>
    `;
  }

  private getStackStyles() {
    const { spacing, direction, align, justify, wrap, responsive } = this.mergedProps;

    const isVertical = direction === 'vertical';
    
    const baseStyles = {
      display: 'flex',
      flexDirection: isVertical ? 'column' : 'row',
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      gap: typeof spacing === 'number' ? `${spacing}px` : spacing,
    };

    const responsiveStyles = responsive ? {
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        gap: typeof spacing === 'number' ? `${Math.max(spacing / 2, 8)}px` : spacing,
      }
    } : {};

    return StyleSystem.getInstance().createStyles({
      container: {
        ...baseStyles,
        ...responsiveStyles
      }
    });
  }

  /**
   * Add items to the stack with optional spacing override
   */
  addItems(items: Array<Component<any> | HTMLElement | string>, customSpacing?: string | number): void {
    items.forEach((item, index) => {
      if (typeof item === 'string') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = item;
        this.element?.appendChild(wrapper);
      } else if (item instanceof Component) {
        item.mount(this.element!);
      } else {
        this.element?.appendChild(item);
      }
      
      // Add custom spacing if provided
      if (customSpacing && index < items.length - 1) {
        const spacer = document.createElement('div');
        spacer.style.height = typeof customSpacing === 'number' ? `${customSpacing}px` : customSpacing;
        this.element?.appendChild(spacer);
      }
    });
  }
}

/**
 * Responsive Utilities
 * Helper functions for responsive behavior
 */
export class ResponsiveUtils {
  /**
   * Get current breakpoint
   */
  static getCurrentBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    const width = window.innerWidth;
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
  }

  /**
   * Check if device is mobile
   */
  static isMobile(): boolean {
    return window.innerWidth < 768 || ('ontouchstart' in window);
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get responsive value based on current breakpoint
   */
  static getResponsiveValue<T>(values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    default: T;
  }): T {
    const breakpoint = this.getCurrentBreakpoint();
    return values[breakpoint] ?? values.default;
  }

  /**
   * Create responsive CSS property
   */
  static createResponsiveStyle(property: string, values: {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    default: string | number;
  }): any {
    const style: any = {
      [property]: values.default
    };

    if (values.lg) {
      style['@media (max-width: 1199px)'] = { [property]: values.lg };
    }
    if (values.md) {
      style['@media (max-width: 991px)'] = { [property]: values.md };
    }
    if (values.sm) {
      style['@media (max-width: 767px)'] = { [property]: values.sm };
    }
    if (values.xs) {
      style['@media (max-width: 575px)'] = { [property]: values.xs };
    }

    return style;
  }

  /**
   * Add resize listener for responsive updates
   */
  static onBreakpointChange(callback: (breakpoint: string) => void): () => void {
    let currentBreakpoint = this.getCurrentBreakpoint();
    
    const handleResize = () => {
      const newBreakpoint = this.getCurrentBreakpoint();
      if (newBreakpoint !== currentBreakpoint) {
        currentBreakpoint = newBreakpoint;
        callback(newBreakpoint);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Return cleanup function
    return () => window.removeEventListener('resize', handleResize);
  }
}

/**
 * Layout Factory
 * Quick creation methods for common layouts
 */
export class LayoutFactory {
  /**
   * Create a card layout with header, body, and footer
   */
  static createCardLayout(): Grid {
    return new Grid({
      rows: 'auto 1fr auto',
      areas: '"header" "body" "footer"',
      gap: '1rem'
    });
  }

  /**
   * Create a sidebar layout
   */
  static createSidebarLayout(sidebarWidth: string = '250px'): Grid {
    return new Grid({
      columns: `${sidebarWidth} 1fr`,
      areas: '"sidebar main"',
      gap: '1rem',
      responsive: true
    });
  }

  /**
   * Create a hero section layout
   */
  static createHeroLayout(): Flex {
    return new Flex({
      direction: 'column',
      justify: 'center',
      align: 'center',
      padding: '4rem 2rem'
    });
  }

  /**
   * Create a form layout
   */
  static createFormLayout(): Stack {
    return new Stack({
      spacing: '1.5rem',
      direction: 'vertical'
    });
  }

  /**
   * Create a responsive image grid
   */
  static createImageGrid(minImageWidth: number = 200): Grid {
    return new Grid({
      columns: `repeat(auto-fit, minmax(${minImageWidth}px, 1fr))`,
      gap: '1rem',
      responsive: true
    });
  }
}