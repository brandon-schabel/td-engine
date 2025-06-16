import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  Inventory, 
  ItemType, 
  ItemRarity, 
  EquipmentSlot,
  type InventoryItem,
  type InventoryConfig 
} from '@/systems/Inventory';

describe('Inventory', () => {
  let inventory: Inventory;

  const createMockItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 'item-1',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    name: 'Health Potion',
    description: 'Restores health',
    iconType: 'potion',
    quantity: 1,
    maxStack: 10,
    metadata: {},
    acquiredAt: Date.now(),
    ...overrides
  });

  beforeEach(() => {
    inventory = new Inventory();
  });

  describe('constructor', () => {
    test('initializes with default config', () => {
      expect(inventory.getEmptySlots()).toBe(20);
      expect(inventory.getUsedSlots()).toBe(0);
    });

    test('accepts custom config', () => {
      const customInventory = new Inventory({
        maxSlots: 30,
        autoSort: true,
        allowStacking: false
      });
      
      expect(customInventory.getEmptySlots()).toBe(30);
    });
  });

  describe('addItem', () => {
    test('adds item to first available slot', () => {
      const item = createMockItem();
      const result = inventory.addItem(item);
      
      expect(result).toBe(true);
      expect(inventory.getUsedSlots()).toBe(1);
      expect(inventory.getItem(0)).toMatchObject(item);
    });

    test('adds item to preferred slot when available', () => {
      const item = createMockItem();
      const result = inventory.addItem(item, 5);
      
      expect(result).toBe(true);
      expect(inventory.getItem(5)).toMatchObject(item);
    });

    test('stacks items when possible', () => {
      const item1 = createMockItem({ quantity: 5 });
      const item2 = createMockItem({ quantity: 3 });
      
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      expect(inventory.getUsedSlots()).toBe(1);
      expect(inventory.getItem(0)?.quantity).toBe(8);
    });

    test('respects max stack size', () => {
      const item1 = createMockItem({ quantity: 8 });
      const item2 = createMockItem({ quantity: 5 });
      
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      expect(inventory.getUsedSlots()).toBe(2);
      expect(inventory.getItem(0)?.quantity).toBe(10); // Max stack
      expect(inventory.getItem(1)?.quantity).toBe(3); // Overflow
    });

    test('returns false when inventory is full', () => {
      // Fill inventory
      for (let i = 0; i < 20; i++) {
        inventory.addItem(createMockItem({ 
          id: `item-${i}`, 
          maxStack: 1 
        }));
      }
      
      const newItem = createMockItem({ id: 'item-21' });
      const result = inventory.addItem(newItem);
      
      expect(result).toBe(false);
      expect(inventory.isFull()).toBe(true);
    });

    test('does not stack different items', () => {
      const item1 = createMockItem({ id: 'item-1' });
      const item2 = createMockItem({ id: 'item-2' });
      
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      expect(inventory.getUsedSlots()).toBe(2);
    });

    test('respects stacking config', () => {
      const noStackInventory = new Inventory({ 
        maxSlots: 20, 
        autoSort: false, 
        allowStacking: false 
      });
      
      const item1 = createMockItem({ quantity: 1 });
      const item2 = createMockItem({ quantity: 1 });
      
      noStackInventory.addItem(item1);
      noStackInventory.addItem(item2);
      
      expect(noStackInventory.getUsedSlots()).toBe(2);
    });
  });

  describe('removeItem', () => {
    test('removes entire item stack', () => {
      const item = createMockItem({ quantity: 5 });
      inventory.addItem(item);
      
      const removed = inventory.removeItem(0, 5);
      
      expect(removed).toMatchObject(item);
      expect(inventory.getItem(0)).toBeNull();
    });

    test('removes partial quantity', () => {
      const item = createMockItem({ quantity: 5 });
      inventory.addItem(item);
      
      const removed = inventory.removeItem(0, 2);
      
      expect(removed?.quantity).toBe(2);
      expect(inventory.getItem(0)?.quantity).toBe(3);
    });

    test('returns null for empty slot', () => {
      const removed = inventory.removeItem(0);
      expect(removed).toBeNull();
    });

    test('returns null for invalid slot', () => {
      const removed = inventory.removeItem(-1);
      expect(removed).toBeNull();
      
      const removed2 = inventory.removeItem(100);
      expect(removed2).toBeNull();
    });
  });

  describe('useItem', () => {
    test('uses item and removes it', () => {
      const item = createMockItem();
      inventory.addItem(item);
      
      const used = inventory.useItem(0);
      
      expect(used).toMatchObject(item);
      expect(inventory.getItem(0)).toBeNull();
    });

    test('tracks items used', () => {
      inventory.addItem(createMockItem({ id: 'item-1' }));
      inventory.addItem(createMockItem({ id: 'item-2' }));
      
      inventory.useItem(0);
      inventory.useItem(1);
      
      const stats = inventory.getStatistics();
      expect(stats.itemsUsed).toBe(2);
    });
  });

  describe('moveItem', () => {
    test('moves item to empty slot', () => {
      const item = createMockItem();
      inventory.addItem(item);
      
      const result = inventory.moveItem(0, 5);
      
      expect(result).toBe(true);
      expect(inventory.getItem(0)).toBeNull();
      expect(inventory.getItem(5)).toMatchObject(item);
    });

    test('swaps items in occupied slots', () => {
      const item1 = createMockItem({ id: 'item-1', name: 'Item 1' });
      const item2 = createMockItem({ id: 'item-2', name: 'Item 2' });
      
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      inventory.moveItem(0, 1);
      
      expect(inventory.getItem(0)?.name).toBe('Item 2');
      expect(inventory.getItem(1)?.name).toBe('Item 1');
    });

    test('stacks items when moving to stackable slot', () => {
      const item1 = createMockItem({ quantity: 3 });
      const item2 = createMockItem({ quantity: 4 });
      
      inventory.addItem(item1, 0);
      inventory.addItem(item2, 5);
      
      inventory.moveItem(5, 0);
      
      expect(inventory.getItem(0)?.quantity).toBe(7);
      expect(inventory.getItem(5)).toBeNull();
    });

    test('handles partial stacking on move', () => {
      const item1 = createMockItem({ id: 'potion-1', quantity: 8 });
      const item2 = createMockItem({ id: 'potion-2', quantity: 5 });
      
      inventory.addItem(item1, 0);
      inventory.addItem(item2, 5);
      
      // Make items stackable by setting same ID
      const slot5Item = inventory.getItem(5);
      if (slot5Item) {
        slot5Item.id = 'potion-1';
      }
      
      inventory.moveItem(5, 0);
      
      expect(inventory.getItem(0)?.quantity).toBe(10); // Max stack
      expect(inventory.getItem(5)?.quantity).toBe(3); // Remainder
    });

    test('returns false for invalid moves', () => {
      expect(inventory.moveItem(0, 1)).toBe(false); // Empty source
      expect(inventory.moveItem(-1, 0)).toBe(false); // Invalid source
      expect(inventory.moveItem(0, -1)).toBe(false); // Invalid dest
      expect(inventory.moveItem(0, 0)).toBe(false); // Same slot
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      inventory.addItem(createMockItem({ 
        type: ItemType.CONSUMABLE, 
        rarity: ItemRarity.COMMON 
      }));
      inventory.addItem(createMockItem({ 
        type: ItemType.EQUIPMENT, 
        rarity: ItemRarity.RARE 
      }));
      inventory.addItem(createMockItem({ 
        type: ItemType.MATERIAL, 
        rarity: ItemRarity.EPIC 
      }));
    });

    test('findItemsByType', () => {
      const consumables = inventory.findItemsByType(ItemType.CONSUMABLE);
      expect(consumables).toHaveLength(1);
      expect(consumables[0].type).toBe(ItemType.CONSUMABLE);
    });

    test('findItemsByRarity', () => {
      const rareItems = inventory.findItemsByRarity(ItemRarity.RARE);
      expect(rareItems).toHaveLength(1);
      expect(rareItems[0].rarity).toBe(ItemRarity.RARE);
    });

    test('findItem with predicate', () => {
      const epicMaterial = inventory.findItem(
        item => item.type === ItemType.MATERIAL && item.rarity === ItemRarity.EPIC
      );
      
      expect(epicMaterial).not.toBeNull();
      expect(epicMaterial?.type).toBe(ItemType.MATERIAL);
      expect(epicMaterial?.rarity).toBe(ItemRarity.EPIC);
    });

    test('hasItem', () => {
      expect(inventory.hasItem('item-1')).toBe(true);
      expect(inventory.hasItem('non-existent')).toBe(false);
    });

    test('getItemCount', () => {
      inventory.addItem(createMockItem({ id: 'potion', quantity: 5 }));
      inventory.addItem(createMockItem({ id: 'potion', quantity: 3 }));
      
      expect(inventory.getItemCount('potion')).toBe(8);
      expect(inventory.getItemCount('non-existent')).toBe(0);
    });
  });

  describe('sortInventory', () => {
    test('sorts by type, rarity, then name', () => {
      // Add items in random order
      inventory.addItem(createMockItem({ 
        name: 'C Item',
        type: ItemType.MATERIAL, 
        rarity: ItemRarity.COMMON 
      }));
      inventory.addItem(createMockItem({ 
        name: 'A Item',
        type: ItemType.CONSUMABLE, 
        rarity: ItemRarity.LEGENDARY 
      }));
      inventory.addItem(createMockItem({ 
        name: 'B Item',
        type: ItemType.CONSUMABLE, 
        rarity: ItemRarity.EPIC 
      }));
      
      inventory.sortInventory();
      
      const slots = inventory.getSlots();
      expect(slots[0].item?.type).toBe(ItemType.CONSUMABLE);
      expect(slots[0].item?.rarity).toBe(ItemRarity.LEGENDARY);
      expect(slots[1].item?.type).toBe(ItemType.CONSUMABLE);
      expect(slots[1].item?.rarity).toBe(ItemRarity.EPIC);
      expect(slots[2].item?.type).toBe(ItemType.MATERIAL);
    });

    test('auto-sorts when configured', () => {
      const autoSortInventory = new Inventory({ 
        maxSlots: 20, 
        autoSort: true, 
        allowStacking: true 
      });
      
      autoSortInventory.addItem(createMockItem({ 
        type: ItemType.MATERIAL, 
        rarity: ItemRarity.COMMON 
      }));
      autoSortInventory.addItem(createMockItem({ 
        type: ItemType.CONSUMABLE, 
        rarity: ItemRarity.LEGENDARY 
      }));
      
      const slots = autoSortInventory.getSlots();
      expect(slots[0].item?.type).toBe(ItemType.CONSUMABLE);
      expect(slots[0].item?.rarity).toBe(ItemRarity.LEGENDARY);
    });
  });

  describe('statistics', () => {
    test('tracks collected items', () => {
      inventory.addItem(createMockItem());
      inventory.addItem(createMockItem());
      
      const stats = inventory.getStatistics();
      expect(stats.itemsCollected).toBe(2);
    });

    test('calculates total value', () => {
      inventory.addItem(createMockItem({ 
        rarity: ItemRarity.COMMON, 
        quantity: 2 
      })); // 10 * 2 = 20
      inventory.addItem(createMockItem({ 
        rarity: ItemRarity.RARE, 
        quantity: 1 
      })); // 25 * 1 = 25
      
      const stats = inventory.getStatistics();
      expect(stats.totalValue).toBe(45);
    });

    test('counts items by type and rarity', () => {
      inventory.addItem(createMockItem({ id: 'item-1', type: ItemType.CONSUMABLE }));
      inventory.addItem(createMockItem({ id: 'item-2', type: ItemType.CONSUMABLE }));
      inventory.addItem(createMockItem({ id: 'item-3', type: ItemType.EQUIPMENT }));
      
      inventory.addItem(createMockItem({ id: 'item-4', type: ItemType.MATERIAL, rarity: ItemRarity.COMMON }));
      inventory.addItem(createMockItem({ id: 'item-5', type: ItemType.SPECIAL, rarity: ItemRarity.RARE }));
      
      const stats = inventory.getStatistics();
      expect(stats.itemsByType[ItemType.CONSUMABLE]).toBe(2);
      expect(stats.itemsByType[ItemType.EQUIPMENT]).toBe(1);
      expect(stats.itemsByType[ItemType.MATERIAL]).toBe(1);
      expect(stats.itemsByType[ItemType.SPECIAL]).toBe(1);
      expect(stats.itemsByRarity[ItemRarity.COMMON]).toBe(4); // 3 default COMMON + 1 explicit
      expect(stats.itemsByRarity[ItemRarity.RARE]).toBe(1);
    });
  });

  describe('events', () => {
    test('emits itemAdded event', () => {
      const listener = vi.fn();
      inventory.on('itemAdded', listener);
      
      const item = createMockItem();
      inventory.addItem(item);
      
      expect(listener).toHaveBeenCalledWith(item, 0);
    });

    test('emits itemRemoved event', () => {
      const listener = vi.fn();
      inventory.on('itemRemoved', listener);
      
      const item = createMockItem();
      inventory.addItem(item);
      inventory.removeItem(0);
      
      expect(listener).toHaveBeenCalledWith(item, 0);
    });

    test('emits inventoryFull event', () => {
      const listener = vi.fn();
      inventory.on('inventoryFull', listener);
      
      // Fill inventory
      for (let i = 0; i < 20; i++) {
        inventory.addItem(createMockItem({ 
          id: `item-${i}`, 
          maxStack: 1 
        }));
      }
      
      inventory.addItem(createMockItem({ id: 'overflow' }));
      
      expect(listener).toHaveBeenCalled();
    });

    test('emits inventoryChanged event', () => {
      const listener = vi.fn();
      inventory.on('inventoryChanged', listener);
      
      inventory.addItem(createMockItem());
      expect(listener).toHaveBeenCalledTimes(1);
      
      inventory.removeItem(0);
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('persistence', () => {
    test('getState returns complete state', () => {
      const item = createMockItem();
      inventory.addItem(item);
      
      const state = inventory.getState();
      
      expect(state.slots).toHaveLength(20);
      expect(state.slots[0].item).toMatchObject(item);
      expect(state.config.maxSlots).toBe(20);
      expect(state.statistics.itemsCollected).toBe(1);
    });

    test('setState restores inventory', () => {
      const item = createMockItem();
      inventory.addItem(item);
      const originalState = inventory.getState();
      
      // Create new inventory and restore state
      const newInventory = new Inventory();
      newInventory.setState(originalState);
      
      expect(newInventory.getItem(0)).toMatchObject(item);
      expect(newInventory.getStatistics().itemsCollected).toBe(1);
    });

    test('setState handles different slot counts', () => {
      const smallInventory = new Inventory({ maxSlots: 10, autoSort: false, allowStacking: true });
      smallInventory.addItem(createMockItem());
      
      const state = inventory.getState(); // 20 slots
      smallInventory.setState(state);
      
      expect(smallInventory.getEmptySlots()).toBe(20); // Resized to match state
    });
  });

  describe('clear', () => {
    test('removes all items and resets stats', () => {
      inventory.addItem(createMockItem());
      inventory.addItem(createMockItem());
      inventory.useItem(0);
      
      inventory.clear();
      
      expect(inventory.getUsedSlots()).toBe(0);
      expect(inventory.getStatistics().itemsCollected).toBe(0);
      expect(inventory.getStatistics().itemsUsed).toBe(0);
      expect(inventory.getStatistics().totalValue).toBe(0);
    });
  });
});