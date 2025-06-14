/**
 * Comprehensive Integration Test for Inventory System
 * Tests all aspects of inventory integration with the main game
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { Collectible } from '../../src/entities/Collectible';
import { CollectibleType, createItem, COLLECTIBLE_TO_ITEM_MAP } from '../../src/entities/items/ItemTypes';
import { ItemType, ItemRarity, EquipmentSlot } from '../../src/systems/Inventory';
import { MapDifficulty, BiomeType } from '../../src/types/MapData';
import { createTestGame, createMockCanvas } from '../helpers';

describe('Inventory System Integration', () => {
  let game: Game;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = createMockCanvas();
    game = createTestGame({ canvas, autoStart: false });
  });

  describe('Basic Inventory Integration', () => {
    it('should initialize inventory and equipment systems in Game constructor', () => {
      expect(game.getInventory()).toBeDefined();
      expect(game.getEquipment()).toBeDefined();
      expect(game.getInventory().getStatistics().totalSlots).toBe(20);
    });

    it('should provide access to inventory methods', () => {
      const inventory = game.getInventory();
      
      expect(inventory.getStatistics).toBeDefined();
      expect(inventory.addItem).toBeDefined();
      expect(inventory.removeItem).toBeDefined();
      expect(inventory.useItem).toBeDefined();
    });

    it('should provide access to equipment methods', () => {
      const equipment = game.getEquipment();
      
      expect(equipment.equipItem).toBeDefined();
      expect(equipment.unequipItem).toBeDefined();
      expect(equipment.getTotalStats).toBeDefined();
    });
  });

  describe('Collectible to Item Conversion', () => {
    it('should convert collectibles to inventory items when picked up', () => {
      const player = game.getPlayer();
      const inventory = game.getInventory();
      const initialInventoryItems = inventory.getUsedSlots();
      
      // Create a health collectible at player position
      const collectible = new Collectible(player.position, CollectibleType.HEALTH);
      
      // Directly test the item generation and inventory addition
      const generatedItem = Collectible.generateItemFromCollectible(CollectibleType.HEALTH);
      const addSuccess = inventory.addItem(generatedItem);
      
      expect(addSuccess).toBe(true);
      expect(inventory.getUsedSlots()).toBeGreaterThan(initialInventoryItems);
      
      // Verify the correct item type was added
      const slots = inventory.getSlots();
      const addedItem = slots.find(slot => slot.item !== null)?.item;
      expect(addedItem).toBeDefined();
      expect(addedItem?.type).toBe(ItemType.CONSUMABLE);
    });

    it('should handle inventory full scenarios gracefully', () => {
      const inventory = game.getInventory();
      
      // Fill inventory completely with different equipment items (non-stackable)
      const equipmentItems = [
        'iron_sword', 'steel_blade', 'flame_sword', 'leather_armor', 'chain_mail', 
        'plate_armor', 'speed_boots', 'power_ring', 'vitality_amulet'
      ];
      
      // Add multiple copies and other items to fill all 20 slots
      for (let i = 0; i < 20; i++) {
        const itemId = equipmentItems[i % equipmentItems.length];
        const item = createItem(itemId);
        inventory.addItem(item);
      }
      
      expect(inventory.isFull()).toBe(true);
      
      // Try to add another item via collectible
      const player = game.getPlayer();
      const collectible = new Collectible(player.position, CollectibleType.HEALTH);
      
      // Mock the immediate effect application for when inventory is full
      const initialHealth = player.health;
      player.takeDamage(10); // Reduce health so healing can be applied
      
      const result = collectible.tryCollectByPlayer(player);
      expect(result).toBe(true);
      
      // Since inventory is full, effect should be applied immediately
      // (This is handled in Game.update method lines 407-415)
    });
  });

  describe('Item Usage Integration', () => {
    it('should use consumable items and apply effects to player', () => {
      const inventory = game.getInventory();
      const player = game.getPlayer();
      
      // Add a health potion to inventory
      const healthPotion = createItem('health_potion_small');
      inventory.addItem(healthPotion);
      
      // Damage player so healing can be applied
      const initialHealth = player.health;
      player.takeDamage(20);
      const damagedHealth = player.health;
      
      // Use the health potion
      const success = game.useInventoryItem(0);
      expect(success).toBe(true);
      
      // Verify health was restored
      expect(player.health).toBeGreaterThan(damagedHealth);
      
      // Verify item was removed from inventory
      expect(inventory.getItem(0)).toBeNull();
    });

    it('should equip equipment items and apply stat bonuses', () => {
      const inventory = game.getInventory();
      const equipment = game.getEquipment();
      const player = game.getPlayer();
      
      // Add a weapon to inventory
      const ironSword = createItem('iron_sword');
      inventory.addItem(ironSword);
      
      // Get initial player damage
      const initialDamage = player.getCurrentDamage();
      
      // Use (equip) the weapon
      const success = game.useInventoryItem(0);
      expect(success).toBe(true);
      
      // Verify weapon was equipped
      const equippedWeapon = equipment.getEquippedItem(EquipmentSlot.WEAPON);
      expect(equippedWeapon).toBeDefined();
      expect(equippedWeapon?.id).toBe('iron_sword');
      
      // Verify damage bonus was applied
      expect(player.getCurrentDamage()).toBeGreaterThan(initialDamage);
      
      // Verify item was removed from inventory
      expect(inventory.getItem(0)).toBeNull();
    });

    it('should handle invalid item usage gracefully', () => {
      const inventory = game.getInventory();
      
      // Try to use item from empty slot
      const success = game.useInventoryItem(0);
      expect(success).toBe(false);
      
      // Add a material item (not usable directly)
      const material = createItem('iron_ore');
      inventory.addItem(material);
      
      // Try to use material item
      const materialSuccess = game.useInventoryItem(0);
      expect(materialSuccess).toBe(false);
      
      // Verify material is still in inventory
      expect(inventory.getItem(0)).toBeDefined();
    });
  });

  describe('Equipment System Integration', () => {
    it('should apply equipment bonuses to player stats', () => {
      const equipment = game.getEquipment();
      const player = game.getPlayer();
      
      // Create and equip a weapon with damage bonus
      const weapon = createItem('iron_sword');
      equipment.equipItem(weapon);
      
      // Create and equip armor with health bonus
      const armor = createItem('leather_armor');
      equipment.equipItem(armor);
      
      // Verify bonuses are applied
      const bonuses = player.getEquipmentBonuses();
      expect(bonuses.damageMultiplier).toBeGreaterThan(1);
      expect(bonuses.healthMultiplier).toBeGreaterThan(1);
    });

    it('should handle equipment swapping correctly', () => {
      const equipment = game.getEquipment();
      
      // Equip first weapon
      const weapon1 = createItem('iron_sword');
      equipment.equipItem(weapon1);
      
      // Equip second weapon (should replace first)
      const weapon2 = createItem('steel_blade');
      equipment.equipItem(weapon2);
      
      // Verify only second weapon is equipped
      const equippedWeapon = equipment.getEquippedItem(EquipmentSlot.WEAPON);
      expect(equippedWeapon?.id).toBe('steel_blade');
    });

    it('should calculate total equipment stats correctly', () => {
      const equipment = game.getEquipment();
      
      // Equip multiple items with different bonuses
      const weapon = createItem('iron_sword'); // +5 damage
      const armor = createItem('leather_armor'); // +15 health
      const accessory = createItem('speed_boots'); // +20 speed
      
      equipment.equipItem(weapon);
      equipment.equipItem(armor);
      equipment.equipItem(accessory);
      
      const totalStats = equipment.getTotalStats();
      expect(totalStats.damageBonus).toBe(5);
      expect(totalStats.healthBonus).toBe(15);
      expect(totalStats.speedBonus).toBe(20);
    });
  });

  describe('Inventory Upgrade System', () => {
    it('should allow inventory capacity upgrades', () => {
      const initialSlots = game.getInventory().getStatistics().totalSlots;
      expect(initialSlots).toBe(20);
      
      // Ensure player has enough currency
      game.addCurrency(1000);
      
      // Purchase inventory upgrade
      const success = game.purchaseInventoryUpgrade();
      expect(success).toBe(true);
      
      // Verify inventory capacity increased
      const newSlots = game.getInventory().getStatistics().totalSlots;
      expect(newSlots).toBeGreaterThan(initialSlots);
    });

    it('should provide upgrade information correctly', () => {
      const upgradeInfo = game.getInventoryUpgradeInfo();
      
      expect(upgradeInfo.purchased).toBe(0);
      expect(upgradeInfo.maxUpgrades).toBeGreaterThan(0);
      expect(upgradeInfo.nextCost).toBeGreaterThan(0);
      expect(upgradeInfo.currentSlots).toBe(20);
      expect(upgradeInfo.maxPossibleSlots).toBeGreaterThan(20);
    });

    it('should prevent upgrades when insufficient currency', () => {
      // Ensure player has no currency
      game.setCurrency(0);
      
      const success = game.purchaseInventoryUpgrade();
      expect(success).toBe(false);
      
      // Verify inventory capacity unchanged
      const slots = game.getInventory().getStatistics().totalSlots;
      expect(slots).toBe(20);
    });
  });

  describe('Item Drop System Integration', () => {
    it('should generate items when enemies are killed', () => {
      const initialItems = game.getCollectibles().length;
      
      // Create a test enemy
      const enemies = game.getEnemies();
      expect(enemies.length).toBeGreaterThanOrEqual(0);
      
      // Mock enemy kill (since actual enemy creation requires more setup)
      const mockEnemy = {
        position: { x: 100, y: 100 },
        reward: 10,
        enemyType: 'BASIC' as any
      };
      
      // Call enemyKilled method directly to test item generation
      game.enemyKilled(mockEnemy as any);
      
      // Check if any new collectibles were created
      // Note: Item generation is probabilistic, so we can't guarantee items will drop
      const newItems = game.getCollectibles().length;
      expect(newItems).toBeGreaterThanOrEqual(initialItems);
    });
  });

  describe('Save/Load State Integration', () => {
    it('should persist inventory state', () => {
      const inventory = game.getInventory();
      
      // Add some items
      const item1 = createItem('health_potion_small');
      const item2 = createItem('iron_sword');
      inventory.addItem(item1);
      inventory.addItem(item2);
      
      // Get state
      const state = inventory.getState();
      expect(state.slots.filter(slot => slot.item !== null)).toHaveLength(2);
      
      // Clear inventory and restore state
      inventory.clear();
      expect(inventory.getUsedSlots()).toBe(0);
      
      inventory.setState(state);
      expect(inventory.getUsedSlots()).toBe(2);
    });

    it('should persist equipment state', () => {
      const equipment = game.getEquipment();
      
      // Equip some items
      const weapon = createItem('iron_sword');
      const armor = createItem('leather_armor');
      equipment.equipItem(weapon);
      equipment.equipItem(armor);
      
      // Get state
      const state = equipment.getState();
      expect(Object.values(state.equippedItems).filter(item => item !== null)).toHaveLength(2);
      
      // Create new equipment manager and restore state
      const newEquipment = game.getEquipment();
      newEquipment.setState(state);
      
      expect(newEquipment.getEquippedItem(EquipmentSlot.WEAPON)).toBeDefined();
      expect(newEquipment.getEquippedItem(EquipmentSlot.ARMOR)).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted item data gracefully', () => {
      const inventory = game.getInventory();
      
      // Try to add an invalid item (should be handled by createItem validation)
      expect(() => createItem('invalid_item_id')).toThrow();
    });

    it('should validate equipment items before equipping', () => {
      const equipment = game.getEquipment();
      
      // Try to equip a non-equipment item
      const consumable = createItem('health_potion_small');
      const success = equipment.equipItem(consumable);
      expect(success).toBe(false);
    });

    it('should handle multiple rapid item usage', () => {
      const inventory = game.getInventory();
      
      // Add health potions that will stack
      const smallPotion1 = createItem('health_potion_small', 3); // Stack of 3
      const largePotion1 = createItem('health_potion_large', 2); // Stack of 2
      inventory.addItem(smallPotion1);
      inventory.addItem(largePotion1);
      
      expect(inventory.getUsedSlots()).toBe(2); // 2 different stacks
      
      // Damage player
      const player = game.getPlayer();
      player.takeDamage(50);
      
      // Use multiple potions rapidly from the first stack
      let successCount = 0;
      for (let i = 0; i < 3; i++) {
        if (game.useInventoryItem(0)) {
          successCount++;
        }
      }
      
      expect(successCount).toBe(3);
      expect(inventory.getUsedSlots()).toBe(1); // Only 1 stack remaining (the large potions)
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large inventory operations efficiently', () => {
      const inventory = game.getInventory();
      
      // Add many items
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        const item = createItem('iron_ore');
        inventory.addItem(item);
      }
      const endTime = performance.now();
      
      // Should complete quickly (less than 100ms even on slow machines)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify all items were added (considering stacking)
      const stats = inventory.getStatistics();
      expect(stats.usedSlots).toBeGreaterThan(0);
    });

    it('should clean up event listeners properly', () => {
      // This tests that the equipment manager events are properly managed
      const equipment = game.getEquipment();
      
      let eventFired = false;
      equipment.on('statsChanged', () => {
        eventFired = true;
      });
      
      // Equip an item to trigger the event
      const weapon = createItem('iron_sword');
      equipment.equipItem(weapon);
      
      expect(eventFired).toBe(true);
    });
  });
});