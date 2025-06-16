/**
 * Unit tests for Inventory system
 * Tests item management, stacking, sorting, and events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Inventory, ItemType, ItemRarity, EquipmentSlot } from '@/systems/Inventory';
import { 
  createMockInventoryItem, 
  createMockConsumableItem,
  createMockEquipmentItem 
} from '../helpers/mockData';

describe('Inventory', () => {
  let inventory: Inventory;

  beforeEach(() => {
    inventory = new Inventory({ maxSlots: 20, autoSort: false, allowStacking: true });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultInventory = new Inventory();
      expect(defaultInventory.getSlots()).toHaveLength(20);
      expect(defaultInventory.getEmptySlots()).toBe(20);
    });

    it('should initialize with custom config', () => {
      const customInventory = new Inventory({ 
        maxSlots: 30, 
        autoSort: true, 
        allowStacking: false 
      });
      expect(customInventory.getSlots()).toHaveLength(30);
    });

    it('should create empty slots', () => {
      const slots = inventory.getSlots();
      slots.forEach((slot, index) => {
        expect(slot.item).toBeNull();
        expect(slot.slotIndex).toBe(index);
      });
    });
  });

  describe('addItem', () => {
    it('should add item to first empty slot', () => {
      const item = createMockInventoryItem();
      const success = inventory.addItem(item);

      expect(success).toBe(true);
      expect(inventory.getItem(0)).toMatchObject(item);
    });

    it('should add to preferred slot if empty', () => {
      const item = createMockInventoryItem();
      const success = inventory.addItem(item, 5);

      expect(success).toBe(true);
      expect(inventory.getItem(5)).toMatchObject(item);
      expect(inventory.getItem(0)).toBeNull();
    });

    it('should stack items when possible', () => {
      const item1 = createMockInventoryItem({ quantity: 10 });
      const item2 = createMockInventoryItem({ 
        id: item1.id, 
        quantity: 5 
      });

      inventory.addItem(item1);
      const success = inventory.addItem(item2);

      expect(success).toBe(true);
      expect(inventory.getItem(0)?.quantity).toBe(15);
      expect(inventory.getUsedSlots()).toBe(1);
    });

    it('should respect max stack size', () => {
      const item1 = createMockInventoryItem({ quantity: 95, maxStack: 99 });
      const item2 = createMockInventoryItem({ 
        id: item1.id, 
        quantity: 10,
        maxStack: 99
      });

      inventory.addItem(item1);
      inventory.addItem(item2);

      expect(inventory.getItem(0)?.quantity).toBe(99);
      expect(inventory.getItem(1)?.quantity).toBe(6);
    });

    it('should not stack when stacking disabled', () => {
      const noStackInventory = new Inventory({ 
        maxSlots: 20, 
        autoSort: false, 
        allowStacking: false 
      });

      const item1 = createMockInventoryItem({ quantity: 1 });
      const item2 = createMockInventoryItem({ id: item1.id, quantity: 1 });

      noStackInventory.addItem(item1);
      noStackInventory.addItem(item2);

      expect(noStackInventory.getUsedSlots()).toBe(2);
    });

    it('should return false when inventory full', () => {
      const smallInventory = new Inventory({ maxSlots: 2, autoSort: false, allowStacking: false });
      
      smallInventory.addItem(createMockInventoryItem());
      smallInventory.addItem(createMockInventoryItem());
      
      const success = smallInventory.addItem(createMockInventoryItem());
      expect(success).toBe(false);
    });

    it('should copy item to avoid mutation', () => {
      const originalItem = createMockInventoryItem({ quantity: 5 });
      inventory.addItem(originalItem);
      
      originalItem.quantity = 10;
      expect(inventory.getItem(0)?.quantity).toBe(5);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      inventory.addItem(createMockInventoryItem({ quantity: 10 }));
    });

    it('should remove entire stack', () => {
      const removed = inventory.removeItem(0, 10);

      expect(removed).not.toBeNull();
      expect(removed?.quantity).toBe(10);
      expect(inventory.getItem(0)).toBeNull();
    });

    it('should remove partial quantity', () => {
      const removed = inventory.removeItem(0, 3);

      expect(removed).not.toBeNull();
      expect(removed?.quantity).toBe(3);
      expect(inventory.getItem(0)?.quantity).toBe(7);
    });

    it('should remove all if quantity exceeds stack', () => {
      const removed = inventory.removeItem(0, 20);

      expect(removed).not.toBeNull();
      expect(removed?.quantity).toBe(10);
      expect(inventory.getItem(0)).toBeNull();
    });

    it('should return null for empty slot', () => {
      const removed = inventory.removeItem(5);
      expect(removed).toBeNull();
    });

    it('should return null for invalid slot', () => {
      const removed = inventory.removeItem(-1);
      expect(removed).toBeNull();
      
      const removed2 = inventory.removeItem(100);
      expect(removed2).toBeNull();
    });
  });

  describe('useItem', () => {
    it('should remove item and trigger event', () => {
      const usedCallback = vi.fn();
      inventory.on('itemUsed', usedCallback);
      
      inventory.addItem(createMockConsumableItem({ quantity: 3 }));
      const used = inventory.useItem(0, 1);

      expect(used).not.toBeNull();
      expect(used?.quantity).toBe(1);
      expect(inventory.getItem(0)?.quantity).toBe(2);
      expect(usedCallback).toHaveBeenCalledWith(expect.any(Object), 0);
    });

    it('should track items used statistic', () => {
      inventory.addItem(createMockConsumableItem({ quantity: 5 }));
      inventory.useItem(0, 2);
      inventory.useItem(0, 1);

      const stats = inventory.getStatistics();
      expect(stats.itemsUsed).toBe(2); // Counts number of use operations, not quantity
    });
  });

  describe('moveItem', () => {
    it('should move item to empty slot', () => {
      const item = createMockInventoryItem();
      inventory.addItem(item);

      const success = inventory.moveItem(0, 5);

      expect(success).toBe(true);
      expect(inventory.getItem(0)).toBeNull();
      expect(inventory.getItem(5)).toMatchObject(item);
    });

    it('should swap items', () => {
      const item1 = createMockInventoryItem({ name: 'Item 1' });
      const item2 = createMockInventoryItem({ name: 'Item 2' });
      
      inventory.addItem(item1, 0);
      inventory.addItem(item2, 5);

      const success = inventory.moveItem(0, 5);

      expect(success).toBe(true);
      expect(inventory.getItem(0)?.name).toBe('Item 2');
      expect(inventory.getItem(5)?.name).toBe('Item 1');
    });

    it('should stack when moving to stackable item', () => {
      // Create items with different IDs so they won't auto-stack on add
      const item1 = createMockInventoryItem({ id: 'item-1', quantity: 5 });
      const item2 = createMockInventoryItem({ id: 'item-2', quantity: 3 });
      
      inventory.addItem(item1, 0);
      inventory.addItem(item2, 5);

      // Now manually set item2 to have the same ID as item1 to make them stackable
      const slot5Item = inventory.getItem(5);
      if (slot5Item) {
        slot5Item.id = item1.id;
      }

      const success = inventory.moveItem(5, 0);

      expect(success).toBe(true);
      expect(inventory.getItem(0)?.quantity).toBe(8);
      expect(inventory.getItem(5)).toBeNull();
    });

    it('should partial stack and swap remainder', () => {
      // Create items with different IDs initially
      const item1 = createMockInventoryItem({ id: 'item-1', quantity: 95, maxStack: 99 });
      const item2 = createMockInventoryItem({ id: 'item-2', quantity: 10, maxStack: 99 });
      
      inventory.addItem(item1, 0);
      inventory.addItem(item2, 5);

      // Make them stackable by giving them the same ID
      const slot5Item = inventory.getItem(5);
      if (slot5Item) {
        slot5Item.id = item1.id;
      }

      inventory.moveItem(5, 0);

      expect(inventory.getItem(0)?.quantity).toBe(99);
      expect(inventory.getItem(5)?.quantity).toBe(6);
    });

    it('should return false for invalid moves', () => {
      expect(inventory.moveItem(-1, 0)).toBe(false);
      expect(inventory.moveItem(0, -1)).toBe(false);
      expect(inventory.moveItem(5, 5)).toBe(false); // Same slot
      expect(inventory.moveItem(5, 0)).toBe(false); // Empty source
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      inventory.addItem(createMockConsumableItem({ name: 'Potion' }));
      inventory.addItem(createMockEquipmentItem({ name: 'Sword' }));
      inventory.addItem(createMockInventoryItem({ 
        name: 'Gem',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.EPIC
      }));
    });

    it('should find items by type', () => {
      const consumables = inventory.findItemsByType(ItemType.CONSUMABLE);
      expect(consumables).toHaveLength(1);
      expect(consumables[0].name).toBe('Potion');

      const equipment = inventory.findItemsByType(ItemType.EQUIPMENT);
      expect(equipment).toHaveLength(1);
      expect(equipment[0].name).toBe('Sword');
    });

    it('should find items by rarity', () => {
      const rareItems = inventory.findItemsByRarity(ItemRarity.RARE);
      expect(rareItems).toHaveLength(1);
      expect(rareItems[0].name).toBe('Sword');

      const epicItems = inventory.findItemsByRarity(ItemRarity.EPIC);
      expect(epicItems).toHaveLength(1);
      expect(epicItems[0].name).toBe('Gem');
    });

    it('should find item by predicate', () => {
      const sword = inventory.findItem(item => item.name === 'Sword');
      expect(sword).not.toBeNull();
      expect(sword?.type).toBe(ItemType.EQUIPMENT);

      const nonExistent = inventory.findItem(item => item.name === 'Shield');
      expect(nonExistent).toBeNull();
    });

    it('should check if has item', () => {
      const potion = inventory.getItem(0)!;
      expect(inventory.hasItem(potion.id)).toBe(true);
      expect(inventory.hasItem('non-existent-id')).toBe(false);
    });

    it('should count item quantity', () => {
      const stackableItem = createMockInventoryItem({ quantity: 5 });
      inventory.addItem({ ...stackableItem });
      inventory.addItem({ ...stackableItem, quantity: 3 });

      expect(inventory.getItemCount(stackableItem.id)).toBe(8);
      expect(inventory.getItemCount('non-existent')).toBe(0);
    });
  });

  describe('sorting', () => {
    it('should sort by type, rarity, then name', () => {
      // Add items in random order
      inventory.addItem(createMockInventoryItem({ 
        name: 'B Material',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.COMMON
      }));
      inventory.addItem(createMockEquipmentItem({ 
        name: 'Z Equipment',
        rarity: ItemRarity.LEGENDARY 
      }));
      inventory.addItem(createMockConsumableItem({ 
        name: 'A Consumable',
        rarity: ItemRarity.COMMON
      }));
      inventory.addItem(createMockInventoryItem({ 
        name: 'A Material',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.COMMON
      }));

      inventory.sortInventory();
      const items = inventory.getSlots()
        .filter(slot => slot.item !== null)
        .map(slot => slot.item!);

      // Check order: CONSUMABLE < EQUIPMENT < MATERIAL
      expect(items[0].type).toBe(ItemType.CONSUMABLE);
      expect(items[1].type).toBe(ItemType.EQUIPMENT);
      expect(items[2].type).toBe(ItemType.MATERIAL);
      expect(items[3].type).toBe(ItemType.MATERIAL);

      // Check materials are sorted by name
      expect(items[2].name).toBe('A Material');
      expect(items[3].name).toBe('B Material');
    });

    it('should auto-sort when enabled', () => {
      const autoSortInventory = new Inventory({ 
        maxSlots: 20, 
        autoSort: true, 
        allowStacking: true 
      });

      autoSortInventory.addItem(createMockInventoryItem({ 
        name: 'Z Item',
        type: ItemType.MATERIAL
      }));
      autoSortInventory.addItem(createMockInventoryItem({ 
        name: 'A Item',
        type: ItemType.MATERIAL
      }));

      const items = autoSortInventory.getSlots()
        .filter(slot => slot.item !== null)
        .map(slot => slot.item!);

      expect(items[0].name).toBe('A Item');
      expect(items[1].name).toBe('Z Item');
    });
  });

  describe('events', () => {
    it('should emit itemAdded event', () => {
      const callback = vi.fn();
      inventory.on('itemAdded', callback);

      const item = createMockInventoryItem();
      inventory.addItem(item);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining(item), 0);
    });

    it('should emit itemRemoved event', () => {
      const callback = vi.fn();
      inventory.on('itemRemoved', callback);

      inventory.addItem(createMockInventoryItem());
      inventory.removeItem(0);

      expect(callback).toHaveBeenCalled();
    });

    it('should emit itemMoved event', () => {
      const callback = vi.fn();
      inventory.on('itemMoved', callback);

      inventory.addItem(createMockInventoryItem());
      inventory.moveItem(0, 5);

      expect(callback).toHaveBeenCalledWith(0, 5);
    });

    it('should emit inventoryFull event', () => {
      const callback = vi.fn();
      const smallInventory = new Inventory({ maxSlots: 1, autoSort: false, allowStacking: false });
      smallInventory.on('inventoryFull', callback);

      smallInventory.addItem(createMockInventoryItem());
      smallInventory.addItem(createMockInventoryItem());

      expect(callback).toHaveBeenCalled();
    });

    it('should emit inventoryChanged event', () => {
      const callback = vi.fn();
      inventory.on('inventoryChanged', callback);

      inventory.addItem(createMockInventoryItem());
      expect(callback).toHaveBeenCalledTimes(1);

      inventory.removeItem(0);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('statistics', () => {
    it('should track inventory statistics', () => {
      inventory.addItem(createMockConsumableItem());
      inventory.addItem(createMockEquipmentItem());
      inventory.addItem(createMockInventoryItem({ 
        type: ItemType.MATERIAL,
        rarity: ItemRarity.EPIC
      }));
      inventory.useItem(0);

      const stats = inventory.getStatistics();

      expect(stats.totalSlots).toBe(20);
      expect(stats.usedSlots).toBe(2);
      expect(stats.emptySlots).toBe(18);
      expect(stats.itemsCollected).toBe(3);
      expect(stats.itemsUsed).toBe(1);
      expect(stats.itemsByType[ItemType.EQUIPMENT]).toBe(1);
      expect(stats.itemsByType[ItemType.MATERIAL]).toBe(1);
      expect(stats.itemsByRarity[ItemRarity.EPIC]).toBe(1);
    });

    it('should calculate total value', () => {
      inventory.addItem(createMockInventoryItem({ 
        rarity: ItemRarity.COMMON,
        quantity: 2
      })); // 10 * 2 = 20
      inventory.addItem(createMockInventoryItem({ 
        rarity: ItemRarity.RARE,
        quantity: 1
      })); // 25 * 1 = 25
      inventory.addItem(createMockInventoryItem({ 
        rarity: ItemRarity.LEGENDARY,
        quantity: 1
      })); // 100 * 1 = 100

      const stats = inventory.getStatistics();
      expect(stats.totalValue).toBe(145);
    });
  });

  describe('state persistence', () => {
    it('should get and restore state', () => {
      // Add some items
      inventory.addItem(createMockConsumableItem({ quantity: 5 }));
      inventory.addItem(createMockEquipmentItem());
      inventory.useItem(0, 2);

      // Get state
      const state = inventory.getState();

      // Create new inventory and restore state
      const newInventory = new Inventory();
      newInventory.setState(state);

      // Verify restoration
      expect(newInventory.getItem(0)?.quantity).toBe(3);
      expect(newInventory.getItem(1)?.type).toBe(ItemType.EQUIPMENT);
      expect(newInventory.getStatistics().itemsUsed).toBe(1);
    });

    it('should handle config changes in state', () => {
      const state = inventory.getState();
      state.config.maxSlots = 30;

      const newInventory = new Inventory();
      newInventory.setState(state);

      expect(newInventory.getSlots()).toHaveLength(30);
    });
  });

  describe('utility methods', () => {
    it('should check if inventory is full', () => {
      const tinyInventory = new Inventory({ maxSlots: 2, autoSort: false, allowStacking: false });
      
      expect(tinyInventory.isFull()).toBe(false);
      
      tinyInventory.addItem(createMockInventoryItem());
      expect(tinyInventory.isFull()).toBe(false);
      
      tinyInventory.addItem(createMockInventoryItem());
      expect(tinyInventory.isFull()).toBe(true);
    });

    it('should clear inventory', () => {
      inventory.addItem(createMockInventoryItem());
      inventory.addItem(createMockInventoryItem());
      
      inventory.clear();
      
      expect(inventory.getUsedSlots()).toBe(0);
      expect(inventory.getStatistics().itemsCollected).toBe(0);
    });

    it('should provide debug info', () => {
      inventory.addItem(createMockInventoryItem({ 
        name: 'Debug Item',
        rarity: ItemRarity.RARE,
        quantity: 5
      }));

      const debug = inventory.getDebugInfo();

      expect(debug.slots[0]).toEqual({
        index: 0,
        item: 'Debug Item (RARE)',
        quantity: 5
      });
      expect(debug.statistics.usedSlots).toBe(1);
      expect(debug.config.maxSlots).toBe(20);
    });
  });
});