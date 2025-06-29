/**
 * Type definition for update functions mapped to keys.
 */
export type UpdateFunctions<T> = Partial<{
  [K in keyof T]: (value: T[K], element?: HTMLElement) => void;
}>;

/**
 * SmartUpdater class for efficient DOM updates.
 * Only updates DOM elements when their associated values have changed.
 * 
 * @example
 * const updater = new SmartUpdater<PlayerStats>({
 *   health: (value, el) => el.textContent = `Health: ${value}`,
 *   mana: (value, el) => el.textContent = `Mana: ${value}`
 * });
 * 
 * // Call periodically with current values
 * updater.update({ health: 100, mana: 50 });
 */
export class SmartUpdater<T extends Record<string, any>> {
  private lastValues: Partial<T> = {};
  private updateFns: UpdateFunctions<T>;
  private elements: Partial<Record<keyof T, HTMLElement>> = {};
  
  constructor(updateFns: UpdateFunctions<T>, elements?: Partial<Record<keyof T, HTMLElement>>) {
    this.updateFns = updateFns;
    if (elements) {
      this.elements = elements;
    }
  }
  
  /**
   * Update values, only calling update functions for changed values.
   * @param currentValues - The current values to check and update
   * @param forceUpdate - Force update all values regardless of changes
   */
  update(currentValues: T, forceUpdate: boolean = false): void {
    Object.entries(currentValues).forEach(([key, value]) => {
      const typedKey = key as keyof T;
      
      if (forceUpdate || this.hasChanged(typedKey, value)) {
        const updateFn = this.updateFns[typedKey];
        if (updateFn) {
          const element = this.elements[typedKey];
          updateFn(value, element);
          this.lastValues[typedKey] = this.cloneValue(value);
        }
      }
    });
  }
  
  /**
   * Set or update an element reference for a specific key.
   */
  setElement(key: keyof T, element: HTMLElement): void {
    this.elements[key] = element;
  }
  
  /**
   * Set multiple element references at once.
   */
  setElements(elements: Partial<Record<keyof T, HTMLElement>>): void {
    Object.assign(this.elements, elements);
  }
  
  /**
   * Check if a value has changed since last update.
   */
  private hasChanged(key: keyof T, newValue: any): boolean {
    const oldValue = this.lastValues[key];
    
    // First update for this key
    if (oldValue === undefined) {
      return true;
    }
    
    // Handle primitives
    if (typeof newValue !== 'object' || newValue === null) {
      return oldValue !== newValue;
    }
    
    // Handle arrays
    if (Array.isArray(newValue)) {
      if (!Array.isArray(oldValue) || oldValue.length !== newValue.length) {
        return true;
      }
      return newValue.some((val, idx) => val !== oldValue[idx]);
    }
    
    // Handle objects (shallow comparison)
    if (typeof oldValue !== 'object' || oldValue === null) {
      return true;
    }
    
    const oldKeys = Object.keys(oldValue);
    const newKeys = Object.keys(newValue);
    
    if (oldKeys.length !== newKeys.length) {
      return true;
    }
    
    return newKeys.some(k => (oldValue as any)[k] !== newValue[k]);
  }
  
  /**
   * Clone a value for storage in lastValues.
   */
  private cloneValue(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    if (Array.isArray(value)) {
      return [...value];
    }
    
    return { ...value };
  }
  
  /**
   * Reset tracked values, forcing next update to apply all changes.
   */
  reset(): void {
    this.lastValues = {};
  }
  
  /**
   * Force update a specific key on next update call.
   */
  invalidate(key: keyof T): void {
    delete this.lastValues[key];
  }
  
  /**
   * Force update multiple keys on next update call.
   */
  invalidateKeys(keys: (keyof T)[]): void {
    keys.forEach(key => delete this.lastValues[key]);
  }
  
  /**
   * Get the last recorded value for a key.
   */
  getLastValue(key: keyof T): T[keyof T] | undefined {
    return this.lastValues[key];
  }
  
  /**
   * Create a bound update function that captures current values from a getter.
   * Useful for interval-based updates.
   */
  createBoundUpdater(getValue: () => T): () => void {
    return () => this.update(getValue());
  }
}

/**
 * Create a simple updater for a single value.
 */
export function createSimpleUpdater<T>(
  updateFn: (value: T) => void
): {
  update: (value: T) => void;
  forceUpdate: (value: T) => void;
} {
  let lastValue: T | undefined;
  
  return {
    update: (value: T) => {
      if (lastValue === undefined || lastValue !== value) {
        updateFn(value);
        lastValue = value;
      }
    },
    forceUpdate: (value: T) => {
      updateFn(value);
      lastValue = value;
    }
  };
}