/**
 * Simple EventEmitter for game events
 * Lightweight implementation without complex UI dependencies
 */

export class EventEmitter<T extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof T, Set<(data: any) => void>> = new Map();

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: keyof T): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}