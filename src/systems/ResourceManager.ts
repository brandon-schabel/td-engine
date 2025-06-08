export enum ResourceType {
  CURRENCY = 'CURRENCY',
  LIVES = 'LIVES',
  SCORE = 'SCORE'
}

type ResourceChangeCallback = (type: ResourceType, oldValue: number, newValue: number) => void;

export class ResourceManager {
  private resources: Map<ResourceType, number> = new Map();
  private callbacks: Set<ResourceChangeCallback> = new Set();

  constructor(startingResources?: Partial<Record<ResourceType, number>>) {
    // Set default values
    this.resources.set(ResourceType.CURRENCY, 100);
    this.resources.set(ResourceType.LIVES, 10);
    this.resources.set(ResourceType.SCORE, 0);

    // Override with provided values
    if (startingResources) {
      for (const [type, value] of Object.entries(startingResources)) {
        this.resources.set(type as ResourceType, value);
      }
    }
  }

  getResource(type: ResourceType): number {
    return this.resources.get(type) || 0;
  }

  setResource(type: ResourceType, value: number): void {
    const oldValue = this.getResource(type);
    const newValue = Math.max(0, value); // Don't allow negative values
    
    this.resources.set(type, newValue);
    
    if (oldValue !== newValue) {
      this.notifyResourceChange(type, oldValue, newValue);
    }
  }

  addResource(type: ResourceType, amount: number): void {
    const currentValue = this.getResource(type);
    
    // Debug logging for currency gains
    if (type === ResourceType.CURRENCY) {
      console.log(`💰 GAINING ${amount} currency. ${currentValue} -> ${currentValue + amount}`);
      console.trace('Currency gain trace:');
    }
    
    this.setResource(type, currentValue + amount);
  }

  spendResource(type: ResourceType, amount: number): boolean {
    if (!this.canAfford(type, amount)) {
      return false;
    }

    const currentValue = this.getResource(type);
    
    // Debug logging for currency changes
    if (type === ResourceType.CURRENCY) {
      console.log(`💰 SPENDING ${amount} currency. ${currentValue} -> ${currentValue - amount}`);
      console.trace('Currency spending trace:');
    }
    
    this.setResource(type, currentValue - amount);
    return true;
  }

  canAfford(type: ResourceType, amount: number): boolean {
    return this.getResource(type) >= amount;
  }

  canAffordMultiple(costs: Partial<Record<ResourceType, number>>): boolean {
    for (const [type, cost] of Object.entries(costs)) {
      if (cost && !this.canAfford(type as ResourceType, cost)) {
        return false;
      }
    }
    return true;
  }

  spendMultiple(costs: Partial<Record<ResourceType, number>>): boolean {
    if (!this.canAffordMultiple(costs)) {
      return false;
    }

    for (const [type, cost] of Object.entries(costs)) {
      if (cost) {
        this.spendResource(type as ResourceType, cost);
      }
    }

    return true;
  }

  isGameOver(): boolean {
    return this.getResource(ResourceType.LIVES) <= 0;
  }

  enemyReachedEnd(livesLost: number = 1): void {
    const currentLives = this.getResource(ResourceType.LIVES);
    const actualLivesLost = Math.min(livesLost, currentLives);
    this.setResource(ResourceType.LIVES, currentLives - actualLivesLost);
  }

  enemyKilled(currencyReward: number, scoreReward: number): void {
    this.addResource(ResourceType.CURRENCY, currencyReward);
    this.addResource(ResourceType.SCORE, scoreReward);
  }

  onResourceChange(callback: ResourceChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyResourceChange(type: ResourceType, oldValue: number, newValue: number): void {
    this.callbacks.forEach(callback => {
      callback(type, oldValue, newValue);
    });
  }

  // Utility methods for common operations
  getCurrency(): number {
    return this.getResource(ResourceType.CURRENCY);
  }

  getLives(): number {
    return this.getResource(ResourceType.LIVES);
  }

  getScore(): number {
    return this.getResource(ResourceType.SCORE);
  }

  addCurrency(amount: number): void {
    this.addResource(ResourceType.CURRENCY, amount);
  }

  spendCurrency(amount: number): boolean {
    return this.spendResource(ResourceType.CURRENCY, amount);
  }

  addScore(amount: number): void {
    this.addResource(ResourceType.SCORE, amount);
  }
}