/**
 * Base Component class for all UI components
 * Provides lifecycle methods, event handling, and DOM management
 */

import { EventEmitter } from './EventEmitter';
import type { ComponentProps, ComponentState, ComponentStyle } from './types';

export abstract class Component<
  TProps extends ComponentProps = ComponentProps,
  TState extends ComponentState = ComponentState
> extends EventEmitter {
  protected element: HTMLElement | null = null;
  protected props: TProps;
  protected state: TState;
  protected children: Component[] = [];
  protected parent: Component | null = null;
  protected mounted: boolean = false;
  protected id: string;

  constructor(props: TProps) {
    super();
    this.props = { ...props };
    this.state = this.getInitialState();
    this.id = props.id || this.generateId();
  }

  /**
   * Get initial component state
   */
  protected abstract getInitialState(): TState;

  /**
   * Render component and return DOM element
   */
  protected abstract render(): HTMLElement;

  /**
   * Component lifecycle: called after mounting to DOM
   */
  protected onMount(): void {
    // Override in subclasses
  }

  /**
   * Component lifecycle: called before unmounting from DOM
   */
  protected onUnmount(): void {
    // Override in subclasses
  }

  /**
   * Component lifecycle: called after props update
   */
  protected onPropsUpdate(prevProps: TProps): void {
    // Override in subclasses
  }

  /**
   * Component lifecycle: called after state update
   */
  protected onStateUpdate(prevState: TState): void {
    // Override in subclasses
  }

  /**
   * Mount component to DOM
   */
  public mount(container: HTMLElement): void {
    if (this.mounted) {
      console.warn(`Component ${this.id} is already mounted`);
      return;
    }

    this.element = this.render();
    this.element.setAttribute('data-component-id', this.id);
    
    // Apply styles
    this.applyStyles();
    
    // Mount children
    this.mountChildren();
    
    // Add to DOM
    container.appendChild(this.element);
    
    this.mounted = true;
    this.onMount();
    this.emit('mount');
  }

  /**
   * Unmount component from DOM
   */
  public unmount(): void {
    if (!this.mounted || !this.element) {
      return;
    }

    this.onUnmount();
    
    // Unmount children
    this.unmountChildren();
    
    // Remove from DOM
    this.element.remove();
    
    this.mounted = false;
    this.element = null;
    this.emit('unmount');
  }

  /**
   * Update component props
   */
  public setProps(newProps: Partial<TProps>): void {
    const prevProps = { ...this.props };
    this.props = { ...this.props, ...newProps };
    
    if (this.mounted) {
      this.onPropsUpdate(prevProps);
      this.update();
    }
  }

  /**
   * Update component state
   */
  protected setState(newState: Partial<TState>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    if (this.mounted) {
      this.onStateUpdate(prevState);
      this.update();
    }
  }

  /**
   * Force component update
   */
  public update(): void {
    if (!this.mounted || !this.element) {
      return;
    }

    const parent = this.element.parentElement;
    if (!parent) {
      return;
    }

    // Store current scroll position
    const scrollTop = parent.scrollTop;
    const scrollLeft = parent.scrollLeft;

    // Re-render
    const newElement = this.render();
    newElement.setAttribute('data-component-id', this.id);
    
    // Replace in DOM
    parent.replaceChild(newElement, this.element);
    this.element = newElement;
    
    // Apply styles
    this.applyStyles();
    
    // Re-mount children
    this.unmountChildren();
    this.mountChildren();
    
    // Restore scroll position
    parent.scrollTop = scrollTop;
    parent.scrollLeft = scrollLeft;
    
    this.emit('update');
  }

  /**
   * Add child component
   */
  protected addChild(child: Component): void {
    child.parent = this;
    this.children.push(child);
  }

  /**
   * Remove child component
   */
  protected removeChild(child: Component): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
  }

  /**
   * Mount all children
   */
  private mountChildren(): void {
    if (!this.element) return;
    
    this.children.forEach(child => {
      const container = this.element!.querySelector(`[data-component-container="${child.id}"]`) as HTMLElement;
      if (container) {
        child.mount(container);
      }
    });
  }

  /**
   * Unmount all children
   */
  private unmountChildren(): void {
    this.children.forEach(child => child.unmount());
  }

  /**
   * Apply component styles
   */
  protected applyStyles(): void {
    if (!this.element) return;
    
    const styles = this.getStyles();
    if (styles) {
      Object.assign(this.element.style, styles);
    }
    
    // Apply class names
    const classNames = this.getClassNames();
    if (classNames.length > 0) {
      this.element.className = classNames.join(' ');
    }
  }

  /**
   * Get component styles
   */
  protected getStyles(): ComponentStyle | null {
    return null;
  }

  /**
   * Get component class names
   */
  protected getClassNames(): string[] {
    const classes: string[] = ['ui-component', `ui-${this.constructor.name.toLowerCase()}`];
    
    if (this.props.className) {
      classes.push(this.props.className);
    }
    
    return classes;
  }

  /**
   * Generate unique component ID
   */
  private generateId(): string {
    return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Query selector within component
   */
  protected $(selector: string): HTMLElement | null {
    return this.element?.querySelector(selector) || null;
  }

  /**
   * Query selector all within component
   */
  protected $$(selector: string): NodeListOf<HTMLElement> {
    return this.element?.querySelectorAll(selector) || ([] as unknown as NodeListOf<HTMLElement>);
  }

  /**
   * Add event listener to element
   */
  protected addEventListener(
    selector: string,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const element = selector === 'root' ? this.element : this.$(selector);
    if (element) {
      element.addEventListener(event, handler, options);
    }
  }

  /**
   * Remove event listener from element
   */
  protected removeEventListener(
    selector: string,
    event: string,
    handler: EventListener,
    options?: EventListenerOptions
  ): void {
    const element = selector === 'root' ? this.element : this.$(selector);
    if (element) {
      element.removeEventListener(event, handler, options);
    }
  }

  /**
   * Check if component is mounted
   */
  public isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Get component DOM element
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Get component ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Destroy component and cleanup
   */
  public destroy(): void {
    this.unmount();
    this.removeAllListeners();
    this.children = [];
    this.parent = null;
  }
}