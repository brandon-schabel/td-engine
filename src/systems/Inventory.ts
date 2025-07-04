/**
 * Inventory System - Core inventory management for the tower defense game
 * Handles item storage, organization, and persistence
 */

export enum ItemType {
  CONSUMABLE = 'CONSUMABLE',
  EQUIPMENT = 'EQUIPMENT', 
  MATERIAL = 'MATERIAL',
  SPECIAL = 'SPECIAL'
}

export enum ItemRarity {
  COMMON = 'COMMON',
  RARE = 'RARE', 
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export enum EquipmentSlot {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  ACCESSORY = 'ACCESSORY'
}

export interface ItemMetadata {
  // Consumable metadata
  duration?: number;
  effect?: string;
  healAmount?: number;
  
  // Equipment metadata
  equipmentSlot?: EquipmentSlot;
  damageBonus?: number;
  healthBonus?: number;
  speedBonus?: number;
  fireRateBonus?: number;
  
  // Material metadata
  craftingMaterial?: boolean;
  upgradeLevel?: number;
  
  // Special metadata
  questItem?: boolean;
  unique?: boolean;
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  category: string; // Add category property
  rarity: ItemRarity;
  name: string;
  description: string;
  iconType: string; // References SvgIcons IconType
  quantity: number;
  maxStack: number;
  metadata: ItemMetadata;
  acquiredAt: number; // timestamp
}

export interface InventorySlot {
  item: InventoryItem | null;
  slotIndex: number;
}

export interface InventoryConfig {
  maxSlots: number;
  autoSort: boolean;
  allowStacking: boolean;
}

export interface InventoryEvents {
  itemAdded: (item: InventoryItem, slotIndex: number) => void;
  itemRemoved: (item: InventoryItem, slotIndex: number) => void;
  itemUsed: (item: InventoryItem, slotIndex: number) => void;
  itemMoved: (fromSlot: number, toSlot: number) => void;
  inventoryFull: () => void;
  inventoryChanged: () => void;
}

export class Inventory {
  private slots: InventorySlot[];
  private config: InventoryConfig;
  private eventListeners: Partial<InventoryEvents> = {};
  
  // Statistics
  private itemsCollected: number = 0;
  private itemsUsed: number = 0;
  private totalValue: number = 0;
  
  constructor(config: InventoryConfig = { maxSlots: 20, autoSort: false, allowStacking: true }) {
    this.config = config;
    this.slots = Array.from({ length: config.maxSlots }, (_, index) => ({
      item: null,
      slotIndex: index
    }));
  }

  // Event management
  on<K extends keyof InventoryEvents>(event: K, listener: InventoryEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  private emit<K extends keyof InventoryEvents>(event: K, ...args: Parameters<InventoryEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  // Core inventory operations
  addItem(item: InventoryItem, preferredSlot?: number): boolean {
    // Try to stack with existing items first
    if (this.config.allowStacking && item.maxStack > 1) {
      const stackSlot = this.findStackableSlot(item);
      if (stackSlot !== -1) {
        const existingItem = this.slots[stackSlot].item!;
        const canStack = Math.min(item.quantity, existingItem.maxStack - existingItem.quantity);
        
        if (canStack > 0) {
          existingItem.quantity += canStack;
          item.quantity -= canStack;
          
          this.emit('itemAdded', existingItem, stackSlot);
          this.emit('inventoryChanged');
          
          // If we stacked all items, we're done
          if (item.quantity === 0) {
            this.itemsCollected++;
            return true;
          }
        }
      }
    }

    // Find empty slot for remaining items
    const emptySlot = preferredSlot !== undefined && this.isSlotEmpty(preferredSlot) 
      ? preferredSlot 
      : this.findEmptySlot();

    if (emptySlot === -1) {
      this.emit('inventoryFull');
      return false;
    }

    // Add item to empty slot
    this.slots[emptySlot].item = { ...item };
    this.itemsCollected++;
    this.totalValue += this.calculateItemValue(item);

    this.emit('itemAdded', item, emptySlot);
    this.emit('inventoryChanged');

    if (this.config.autoSort) {
      this.sortInventory();
    }

    return true;
  }

  removeItem(slotIndex: number, quantity: number = 1): InventoryItem | null {
    if (!this.isValidSlot(slotIndex) || this.isSlotEmpty(slotIndex)) {
      return null;
    }

    const slot = this.slots[slotIndex];
    const item = slot.item!;

    if (quantity >= item.quantity) {
      // Remove entire stack
      slot.item = null;
      this.emit('itemRemoved', item, slotIndex);
      this.emit('inventoryChanged');
      return item;
    } else {
      // Remove partial quantity
      const removedItem: InventoryItem = {
        ...item,
        quantity: quantity
      };
      
      item.quantity -= quantity;
      this.emit('itemRemoved', removedItem, slotIndex);
      this.emit('inventoryChanged');
      return removedItem;
    }
  }

  useItem(slotIndex: number, quantity: number = 1): InventoryItem | null {
    const item = this.removeItem(slotIndex, quantity);
    if (item) {
      this.itemsUsed++;
      this.emit('itemUsed', item, slotIndex);
    }
    return item;
  }

  moveItem(fromSlot: number, toSlot: number): boolean {
    if (!this.isValidSlot(fromSlot) || !this.isValidSlot(toSlot) || 
        this.isSlotEmpty(fromSlot) || fromSlot === toSlot) {
      return false;
    }

    const fromItem = this.slots[fromSlot].item!;
    const toItem = this.slots[toSlot].item;

    if (toItem === null) {
      // Simple move to empty slot
      this.slots[toSlot].item = fromItem;
      this.slots[fromSlot].item = null;
    } else if (this.canStackItems(fromItem, toItem)) {
      // Try to stack items
      const canStack = Math.min(fromItem.quantity, toItem.maxStack - toItem.quantity);
      
      if (canStack === fromItem.quantity) {
        // All items fit in destination stack
        toItem.quantity += fromItem.quantity;
        this.slots[fromSlot].item = null;
      } else if (canStack > 0) {
        // Partial stack
        toItem.quantity += canStack;
        fromItem.quantity -= canStack;
      } else {
        // Can't stack, swap items
        this.slots[fromSlot].item = toItem;
        this.slots[toSlot].item = fromItem;
      }
    } else {
      // Swap items
      this.slots[fromSlot].item = toItem;
      this.slots[toSlot].item = fromItem;
    }

    this.emit('itemMoved', fromSlot, toSlot);
    this.emit('inventoryChanged');
    return true;
  }

  // Query methods
  getItem(slotIndex: number): InventoryItem | null {
    return this.isValidSlot(slotIndex) ? this.slots[slotIndex].item : null;
  }

  getSlots(): InventorySlot[] {
    return [...this.slots];
  }

  findItemsByType(type: ItemType): InventoryItem[] {
    return this.slots
      .filter(slot => slot.item && slot.item.type === type)
      .map(slot => slot.item!);
  }

  findItemsByRarity(rarity: ItemRarity): InventoryItem[] {
    return this.slots
      .filter(slot => slot.item && slot.item.rarity === rarity)
      .map(slot => slot.item!);
  }

  findItem(predicate: (item: InventoryItem) => boolean): InventoryItem | null {
    const slot = this.slots.find(slot => slot.item && predicate(slot.item));
    return slot ? slot.item : null;
  }

  hasItem(itemId: string): boolean {
    return this.slots.some(slot => slot.item && slot.item.id === itemId);
  }

  getItemCount(itemId: string): number {
    return this.slots
      .filter(slot => slot.item && slot.item.id === itemId)
      .reduce((count, slot) => count + slot.item!.quantity, 0);
  }

  // Utility methods
  private findEmptySlot(): number {
    const emptySlot = this.slots.find(slot => slot.item === null);
    return emptySlot ? emptySlot.slotIndex : -1;
  }

  private findStackableSlot(item: InventoryItem): number {
    const slot = this.slots.find(slot => 
      slot.item && this.canStackItems(item, slot.item) && 
      slot.item.quantity < slot.item.maxStack
    );
    return slot ? slot.slotIndex : -1;
  }

  private canStackItems(item1: InventoryItem, item2: InventoryItem): boolean {
    return item1.id === item2.id && 
           item1.type === item2.type && 
           item1.rarity === item2.rarity &&
           item2.quantity < item2.maxStack;
  }

  private isValidSlot(slotIndex: number): boolean {
    return slotIndex >= 0 && slotIndex < this.slots.length;
  }

  private isSlotEmpty(slotIndex: number): boolean {
    return this.isValidSlot(slotIndex) && this.slots[slotIndex].item === null;
  }

  private calculateItemValue(item: InventoryItem): number {
    const baseValue = {
      [ItemRarity.COMMON]: 10,
      [ItemRarity.RARE]: 25,
      [ItemRarity.EPIC]: 50,
      [ItemRarity.LEGENDARY]: 100
    }[item.rarity];

    return baseValue * item.quantity;
  }

  // Inventory management
  sortInventory(): void {
    const items = this.slots
      .map(slot => slot.item)
      .filter(item => item !== null) as InventoryItem[];

    // Sort by type, then rarity, then name
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      if (a.rarity !== b.rarity) {
        const rarityOrder = [ItemRarity.LEGENDARY, ItemRarity.EPIC, ItemRarity.RARE, ItemRarity.COMMON];
        return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
      }
      return a.name.localeCompare(b.name);
    });

    // Clear all slots
    this.slots.forEach(slot => slot.item = null);

    // Reassign sorted items
    items.forEach((item, index) => {
      if (index < this.slots.length) {
        this.slots[index].item = item;
      }
    });

    this.emit('inventoryChanged');
  }

  clear(): void {
    this.slots.forEach(slot => slot.item = null);
    this.itemsCollected = 0;
    this.itemsUsed = 0;
    this.totalValue = 0;
    this.emit('inventoryChanged');
  }

  // Statistics
  getUsedSlots(): number {
    return this.slots.filter(slot => slot.item !== null).length;
  }

  getEmptySlots(): number {
    return this.slots.filter(slot => slot.item === null).length;
  }

  isFull(): boolean {
    return this.getEmptySlots() === 0;
  }

  getStatistics(): {
    totalSlots: number;
    usedSlots: number;
    emptySlots: number;
    itemsCollected: number;
    itemsUsed: number;
    totalValue: number;
    itemsByType: Record<ItemType, number>;
    itemsByRarity: Record<ItemRarity, number>;
  } {
    const itemsByType: Record<ItemType, number> = {
      [ItemType.CONSUMABLE]: 0,
      [ItemType.EQUIPMENT]: 0,
      [ItemType.MATERIAL]: 0,
      [ItemType.SPECIAL]: 0
    };

    const itemsByRarity: Record<ItemRarity, number> = {
      [ItemRarity.COMMON]: 0,
      [ItemRarity.RARE]: 0,
      [ItemRarity.EPIC]: 0,
      [ItemRarity.LEGENDARY]: 0
    };

    this.slots.forEach(slot => {
      if (slot.item) {
        itemsByType[slot.item.type]++;
        itemsByRarity[slot.item.rarity]++;
      }
    });

    return {
      totalSlots: this.slots.length,
      usedSlots: this.getUsedSlots(),
      emptySlots: this.getEmptySlots(),
      itemsCollected: this.itemsCollected,
      itemsUsed: this.itemsUsed,
      totalValue: this.totalValue,
      itemsByType,
      itemsByRarity
    };
  }

  // Persistence
  getState(): {
    slots: Array<{ item: InventoryItem | null; slotIndex: number }>;
    config: InventoryConfig;
    statistics: {
      itemsCollected: number;
      itemsUsed: number;
      totalValue: number;
    };
  } {
    return {
      slots: this.slots.map(slot => ({
        item: slot.item ? { ...slot.item } : null,
        slotIndex: slot.slotIndex
      })),
      config: { ...this.config },
      statistics: {
        itemsCollected: this.itemsCollected,
        itemsUsed: this.itemsUsed,
        totalValue: this.totalValue
      }
    };
  }

  setState(state: {
    slots: Array<{ item: InventoryItem | null; slotIndex: number }>;
    config: InventoryConfig;
    statistics: {
      itemsCollected: number;
      itemsUsed: number;
      totalValue: number;
    };
  }): void {
    this.config = { ...state.config };
    this.itemsCollected = state.statistics.itemsCollected;
    this.itemsUsed = state.statistics.itemsUsed;
    this.totalValue = state.statistics.totalValue;

    // Resize slots array if needed
    if (this.config.maxSlots !== this.slots.length) {
      this.slots = Array.from({ length: this.config.maxSlots }, (_, index) => ({
        item: null,
        slotIndex: index
      }));
    }

    // Restore items
    state.slots.forEach((slotData, index) => {
      if (index < this.slots.length) {
        this.slots[index] = {
          item: slotData.item ? { ...slotData.item } : null,
          slotIndex: index
        };
      }
    });

    this.emit('inventoryChanged');
  }

  // Debug methods
  getDebugInfo(): {
    slots: Array<{ index: number; item: string | null; quantity: number }>;
    statistics: ReturnType<Inventory['getStatistics']>;
    config: InventoryConfig;
  } {
    return {
      slots: this.slots.map(slot => ({
        index: slot.slotIndex,
        item: slot.item ? `${slot.item.name} (${slot.item.rarity})` : null,
        quantity: slot.item ? slot.item.quantity : 0
      })),
      statistics: this.getStatistics(),
      config: this.config
    };
  }
}