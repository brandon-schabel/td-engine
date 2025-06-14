/**
 * Equipment System - Manages player equipment and stat bonuses
 * Handles equipping, unequipping, and calculating stat modifications
 */

import { EquipmentSlot, type InventoryItem, ItemType, type ItemMetadata } from '../../systems/Inventory';

export interface EquipmentStats {
  damageBonus: number;
  healthBonus: number;
  speedBonus: number;
  fireRateBonus: number;
}

export interface EquippedItem {
  item: InventoryItem;
  equippedAt: number;
}

export interface EquipmentSlots {
  [EquipmentSlot.WEAPON]: EquippedItem | null;
  [EquipmentSlot.ARMOR]: EquippedItem | null;
  [EquipmentSlot.ACCESSORY]: EquippedItem | null;
}

export interface EquipmentEvents {
  itemEquipped: (slot: EquipmentSlot, item: InventoryItem) => void;
  itemUnequipped: (slot: EquipmentSlot, item: InventoryItem) => void;
  statsChanged: (stats: EquipmentStats) => void;
}

export class EquipmentManager {
  private equippedItems: EquipmentSlots;
  private eventListeners: Partial<EquipmentEvents> = {};
  
  // Cached stats for performance
  private cachedStats: EquipmentStats;
  private statsDirty: boolean = true;

  constructor() {
    this.equippedItems = {
      [EquipmentSlot.WEAPON]: null,
      [EquipmentSlot.ARMOR]: null,
      [EquipmentSlot.ACCESSORY]: null
    };
    
    this.cachedStats = this.calculateBaseStats();
  }

  // Event management
  on<K extends keyof EquipmentEvents>(event: K, listener: EquipmentEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  private emit<K extends keyof EquipmentEvents>(event: K, ...args: Parameters<EquipmentEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      // @ts-ignore - TypeScript struggles with this pattern but it's safe
      listener(...args);
    }
  }

  // Equipment operations
  equipItem(item: InventoryItem): boolean {
    if (item.type !== ItemType.EQUIPMENT || !item.metadata.equipmentSlot) {
      return false;
    }

    const slot = item.metadata.equipmentSlot;
    const previousItem = this.equippedItems[slot];

    // Unequip previous item if any
    if (previousItem) {
      this.emit('itemUnequipped', slot, previousItem.item);
    }

    // Equip new item
    this.equippedItems[slot] = {
      item: { ...item },
      equippedAt: Date.now()
    };

    this.statsDirty = true;
    this.emit('itemEquipped', slot, item);
    this.emit('statsChanged', this.getTotalStats());

    return true;
  }

  unequipItem(slot: EquipmentSlot): InventoryItem | null {
    const equippedItem = this.equippedItems[slot];
    if (!equippedItem) {
      return null;
    }

    this.equippedItems[slot] = null;
    this.statsDirty = true;
    
    this.emit('itemUnequipped', slot, equippedItem.item);
    this.emit('statsChanged', this.getTotalStats());

    return equippedItem.item;
  }

  // Query methods
  getEquippedItem(slot: EquipmentSlot): InventoryItem | null {
    const equipped = this.equippedItems[slot];
    return equipped ? equipped.item : null;
  }

  getAllEquippedItems(): EquipmentSlots {
    return {
      [EquipmentSlot.WEAPON]: this.equippedItems[EquipmentSlot.WEAPON] ? { ...this.equippedItems[EquipmentSlot.WEAPON] } : null,
      [EquipmentSlot.ARMOR]: this.equippedItems[EquipmentSlot.ARMOR] ? { ...this.equippedItems[EquipmentSlot.ARMOR] } : null,
      [EquipmentSlot.ACCESSORY]: this.equippedItems[EquipmentSlot.ACCESSORY] ? { ...this.equippedItems[EquipmentSlot.ACCESSORY] } : null
    };
  }

  isSlotEmpty(slot: EquipmentSlot): boolean {
    return this.equippedItems[slot] === null;
  }

  hasItemEquipped(itemId: string): boolean {
    return Object.values(this.equippedItems).some(
      equipped => equipped && equipped.item.id === itemId
    );
  }

  // Stat calculation
  getTotalStats(): EquipmentStats {
    if (this.statsDirty) {
      this.cachedStats = this.calculateTotalStats();
      this.statsDirty = false;
    }
    return { ...this.cachedStats };
  }

  private calculateTotalStats(): EquipmentStats {
    const stats = this.calculateBaseStats();

    Object.values(this.equippedItems).forEach(equipped => {
      if (equipped) {
        const itemStats = this.getItemStats(equipped.item.metadata);
        stats.damageBonus += itemStats.damageBonus;
        stats.healthBonus += itemStats.healthBonus;
        stats.speedBonus += itemStats.speedBonus;
        stats.fireRateBonus += itemStats.fireRateBonus;
      }
    });

    return stats;
  }

  private calculateBaseStats(): EquipmentStats {
    return {
      damageBonus: 0,
      healthBonus: 0,
      speedBonus: 0,
      fireRateBonus: 0
    };
  }

  private getItemStats(metadata: ItemMetadata): EquipmentStats {
    return {
      damageBonus: metadata.damageBonus || 0,
      healthBonus: metadata.healthBonus || 0,
      speedBonus: metadata.speedBonus || 0,
      fireRateBonus: metadata.fireRateBonus || 0
    };
  }

  // Set bonuses (for future expansion)
  getSetBonuses(): Record<string, any> {
    // TODO: Implement set bonuses when we have item sets
    // For now, return empty object
    return {};
  }

  // Utility methods
  getEquipmentValue(): number {
    let totalValue = 0;
    
    Object.values(this.equippedItems).forEach(equipped => {
      if (equipped) {
        totalValue += this.calculateItemValue(equipped.item);
      }
    });

    return totalValue;
  }

  private calculateItemValue(item: InventoryItem): number {
    // Simple value calculation based on stat bonuses
    const metadata = item.metadata;
    let value = 0;

    value += (metadata.damageBonus || 0) * 5;
    value += (metadata.healthBonus || 0) * 2;
    value += (metadata.speedBonus || 0) * 1;
    value += (metadata.fireRateBonus || 0) * 10;

    // Rarity multiplier
    const rarityMultipliers = {
      'COMMON': 1,
      'RARE': 2,
      'EPIC': 4,
      'LEGENDARY': 8
    };

    return value * (rarityMultipliers[item.rarity] || 1);
  }

  getEquipmentSummary(): {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
    totalStats: EquipmentStats;
    totalValue: number;
    slotsUsed: number;
    totalSlots: number;
  } {
    const weapon = this.getEquippedItem(EquipmentSlot.WEAPON);
    const armor = this.getEquippedItem(EquipmentSlot.ARMOR);
    const accessory = this.getEquippedItem(EquipmentSlot.ACCESSORY);

    const slotsUsed = [weapon, armor, accessory].filter(item => item !== null).length;

    return {
      weapon: weapon ? weapon.name : null,
      armor: armor ? armor.name : null,
      accessory: accessory ? accessory.name : null,
      totalStats: this.getTotalStats(),
      totalValue: this.getEquipmentValue(),
      slotsUsed,
      totalSlots: 3
    };
  }

  // Validation
  canEquipItem(item: InventoryItem): boolean {
    return item.type === ItemType.EQUIPMENT && 
           item.metadata.equipmentSlot !== undefined &&
           Object.values(EquipmentSlot).includes(item.metadata.equipmentSlot);
  }

  validateEquipment(): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    Object.entries(this.equippedItems).forEach(([slot, equipped]) => {
      if (equipped) {
        const item = equipped.item;
        
        if (item.type !== ItemType.EQUIPMENT) {
          errors.push(`Item in ${slot} slot is not equipment type`);
        }
        
        if (item.metadata.equipmentSlot !== slot) {
          errors.push(`Item in ${slot} slot has wrong equipment slot type`);
        }
        
        if (item.quantity !== 1) {
          errors.push(`Equipment item in ${slot} slot should have quantity of 1`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Persistence
  getState(): {
    equippedItems: Record<string, InventoryItem | null>;
  } {
    const state: Record<string, InventoryItem | null> = {};
    
    Object.entries(this.equippedItems).forEach(([slot, equipped]) => {
      state[slot] = equipped ? { ...equipped.item } : null;
    });

    return { equippedItems: state };
  }

  setState(state: {
    equippedItems: Record<string, InventoryItem | null>;
  }): void {
    // Clear current equipment
    Object.keys(this.equippedItems).forEach(slot => {
      this.equippedItems[slot as EquipmentSlot] = null;
    });

    // Restore equipped items
    Object.entries(state.equippedItems).forEach(([slot, item]) => {
      if (item && Object.values(EquipmentSlot).includes(slot as EquipmentSlot)) {
        this.equippedItems[slot as EquipmentSlot] = {
          item: { ...item },
          equippedAt: Date.now()
        };
      }
    });

    this.statsDirty = true;
    this.emit('statsChanged', this.getTotalStats());
  }

  // Debug methods
  getDebugInfo(): {
    equippedItems: Record<string, string | null>;
    totalStats: EquipmentStats;
    validation: ReturnType<typeof this.validateEquipment>;
    summary: ReturnType<typeof this.getEquipmentSummary>;
  } {
    const equippedItems: Record<string, string | null> = {};
    
    Object.entries(this.equippedItems).forEach(([slot, equipped]) => {
      equippedItems[slot] = equipped ? `${equipped.item.name} (${equipped.item.rarity})` : null;
    });

    return {
      equippedItems,
      totalStats: this.getTotalStats(),
      validation: this.validateEquipment(),
      summary: this.getEquipmentSummary()
    };
  }
}