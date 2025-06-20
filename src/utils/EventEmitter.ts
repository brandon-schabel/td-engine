/**
 * Simple EventEmitter for game events
 * Lightweight implementation without complex UI dependencies
 */

export class EventEmitter<T extends Record<string, any> = Record<string, any>> {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const eventKey = String(event);
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }
    this.listeners.get(eventKey)!.add(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const eventKey = String(event);
    const set = this.listeners.get(eventKey);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(eventKey);
      }
    }
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventKey = String(event);
    const set = this.listeners.get(eventKey);
    if (set) {
      set.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventKey}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: keyof T): void {
    if (event) {
      this.listeners.delete(String(event));
    } else {
      this.listeners.clear();
    }
  }
}