/**
 * Item Type Definitions - Centralized item data and templates
 * Defines all available items in the game with their properties and effects
 */

import { ItemType, ItemRarity, EquipmentSlot, type InventoryItem, type ItemMetadata } from '@/systems/Inventory';
import { IconType } from '@/ui/icons/SvgIcons';

// Collectible types moved here to avoid circular dependency
export enum CollectibleType {
  HEALTH = 'HEALTH',
  EXTRA_DAMAGE = 'EXTRA_DAMAGE',
  FASTER_SHOOTING = 'FASTER_SHOOTING',
  EXTRA_CURRENCY = 'EXTRA_CURRENCY',
  SHIELD = 'SHIELD',
  SPEED_BOOST = 'SPEED_BOOST',
  POWER_UP = 'POWER_UP',
  COIN = 'COIN'
}

// Item template for creating new items
export interface ItemTemplate {
  id: string;
  type: ItemType;
  rarity: ItemRarity;
  name: string;
  description: string;
  iconType: IconType;
  maxStack: number;
  metadata: ItemMetadata;
}

// Comprehensive item database
export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  // CONSUMABLES
  'health_potion_small': {
    id: 'health_potion_small',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    name: 'Small Health Potion',
    description: 'Restores 25 health instantly',
    iconType: IconType.HEALTH,
    maxStack: 10,
    metadata: {
      healAmount: 25,
      effect: 'instant_heal'
    }
  },
  
  'health_potion_large': {
    id: 'health_potion_large',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    name: 'Large Health Potion',
    description: 'Restores 50 health instantly',
    iconType: IconType.HEALTH,
    maxStack: 5,
    metadata: {
      healAmount: 50,
      effect: 'instant_heal'
    }
  },

  'damage_elixir': {
    id: 'damage_elixir',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    name: 'Damage Elixir',
    description: 'Increases damage by 50% for 15 seconds',
    iconType: IconType.DAMAGE,
    maxStack: 5,
    metadata: {
      duration: 15000,
      effect: 'damage_boost',
      damageBonus: 0.5
    }
  },

  'speed_potion': {
    id: 'speed_potion',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    name: 'Speed Potion',
    description: 'Increases movement speed by 40% for 12 seconds',
    iconType: IconType.SPEED,
    maxStack: 8,
    metadata: {
      duration: 12000,
      effect: 'speed_boost',
      speedBonus: 0.4
    }
  },

  'shield_scroll': {
    id: 'shield_scroll',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.EPIC,
    name: 'Shield Scroll',
    description: 'Grants protective shield for 20 seconds',
    iconType: IconType.SHIELD,
    maxStack: 3,
    metadata: {
      duration: 20000,
      effect: 'shield'
    }
  },

  'rapid_fire_serum': {
    id: 'rapid_fire_serum',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.EPIC,
    name: 'Rapid Fire Serum',
    description: 'Doubles fire rate for 10 seconds',
    iconType: IconType.FIRE_RATE,
    maxStack: 3,
    metadata: {
      duration: 10000,
      effect: 'fire_rate_boost',
      fireRateBonus: 1.0
    }
  },

  // EQUIPMENT - WEAPONS
  'iron_sword': {
    id: 'iron_sword',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.COMMON,
    name: 'Iron Sword',
    description: 'A sturdy iron blade. +5 damage',
    iconType: IconType.BASIC_TOWER, // Reusing tower icon for now
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.WEAPON,
      damageBonus: 5
    }
  },

  'steel_blade': {
    id: 'steel_blade',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.RARE,
    name: 'Steel Blade',
    description: 'A finely crafted steel weapon. +12 damage',
    iconType: IconType.SNIPER_TOWER,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.WEAPON,
      damageBonus: 12
    }
  },

  'flame_sword': {
    id: 'flame_sword',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.EPIC,
    name: 'Flame Sword',
    description: 'A blazing weapon of power. +20 damage, +0.5 fire rate',
    iconType: IconType.RAPID_TOWER,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.WEAPON,
      damageBonus: 20,
      fireRateBonus: 0.5
    }
  },

  'legendary_excalibur': {
    id: 'legendary_excalibur',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.LEGENDARY,
    name: 'Excalibur',
    description: 'The legendary blade of heroes. +35 damage, +1.0 fire rate, +25 health',
    iconType: IconType.CROWN, // Using crown for legendary
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.WEAPON,
      damageBonus: 35,
      fireRateBonus: 1.0,
      healthBonus: 25
    }
  },

  // EQUIPMENT - ARMOR
  'leather_armor': {
    id: 'leather_armor',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.COMMON,
    name: 'Leather Armor',
    description: 'Basic protection for adventurers. +15 health',
    iconType: IconType.SHIELD,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.ARMOR,
      healthBonus: 15
    }
  },

  'chain_mail': {
    id: 'chain_mail',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.RARE,
    name: 'Chain Mail',
    description: 'Interlocking metal rings provide solid defense. +30 health',
    iconType: IconType.SHIELD,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.ARMOR,
      healthBonus: 30
    }
  },

  'plate_armor': {
    id: 'plate_armor',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.EPIC,
    name: 'Plate Armor',
    description: 'Heavy metal plates offer excellent protection. +50 health, -10 speed',
    iconType: IconType.SHIELD,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.ARMOR,
      healthBonus: 50,
      speedBonus: -10
    }
  },

  // EQUIPMENT - ACCESSORIES
  'speed_boots': {
    id: 'speed_boots',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.COMMON,
    name: 'Speed Boots',
    description: 'Lightweight boots for quick movement. +20 speed',
    iconType: IconType.SPEED,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.ACCESSORY,
      speedBonus: 20
    }
  },

  'power_ring': {
    id: 'power_ring',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.RARE,
    name: 'Power Ring',
    description: 'A ring imbued with magical force. +8 damage',
    iconType: IconType.DAMAGE,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.ACCESSORY,
      damageBonus: 8
    }
  },

  'vitality_amulet': {
    id: 'vitality_amulet',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.EPIC,
    name: 'Vitality Amulet',
    description: 'An ancient amulet of life force. +40 health, +15 speed',
    iconType: IconType.HEALTH,
    maxStack: 1,
    metadata: {
      equipmentSlot: EquipmentSlot.ACCESSORY,
      healthBonus: 40,
      speedBonus: 15
    }
  },

  // MATERIALS
  'iron_ore': {
    id: 'iron_ore',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    name: 'Iron Ore',
    description: 'Raw iron for crafting weapons and armor',
    iconType: IconType.BUILD,
    maxStack: 50,
    metadata: {
      craftingMaterial: true
    }
  },

  'magic_crystal': {
    id: 'magic_crystal',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.RARE,
    name: 'Magic Crystal',
    description: 'A glowing crystal infused with magical energy',
    iconType: IconType.EXPAND,
    maxStack: 20,
    metadata: {
      craftingMaterial: true
    }
  },

  'dragon_scale': {
    id: 'dragon_scale',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.LEGENDARY,
    name: 'Dragon Scale',
    description: 'An incredibly rare scale from an ancient dragon',
    iconType: IconType.CROWN,
    maxStack: 5,
    metadata: {
      craftingMaterial: true,
      unique: true
    }
  },

  // SPECIAL ITEMS
  'gold_coin': {
    id: 'gold_coin',
    type: ItemType.SPECIAL,
    rarity: ItemRarity.COMMON,
    name: 'Gold Coin',
    description: 'Currency that can be used to purchase upgrades',
    iconType: IconType.CURRENCY,
    maxStack: 100,
    metadata: {}
  },

  'wave_skip_token': {
    id: 'wave_skip_token',
    type: ItemType.SPECIAL,
    rarity: ItemRarity.EPIC,
    name: 'Wave Skip Token',
    description: 'Skip the current wave and gain its rewards',
    iconType: IconType.PLAY,
    maxStack: 3,
    metadata: {
      effect: 'skip_wave',
      unique: true
    }
  },

  'tower_upgrade_gem': {
    id: 'tower_upgrade_gem',
    type: ItemType.SPECIAL,
    rarity: ItemRarity.RARE,
    name: 'Tower Upgrade Gem',
    description: 'Instantly upgrade a random tower property',
    iconType: IconType.UPGRADE,
    maxStack: 10,
    metadata: {
      effect: 'tower_upgrade'
    }
  }
};

// Helper functions for creating items
export function createItem(templateId: string, quantity: number = 1): InventoryItem {
  const template = ITEM_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown item template: ${templateId}`);
  }

  return {
    id: template.id,
    type: template.type,
    category: template.type, // Add category property
    rarity: template.rarity,
    name: template.name,
    description: template.description,
    iconType: template.iconType,
    quantity: Math.min(quantity, template.maxStack),
    maxStack: template.maxStack,
    metadata: { ...template.metadata },
    acquiredAt: Date.now()
  };
}

export function getItemsByType(type: ItemType): ItemTemplate[] {
  return Object.values(ITEM_TEMPLATES).filter(template => template.type === type);
}

export function getItemsByRarity(rarity: ItemRarity): ItemTemplate[] {
  return Object.values(ITEM_TEMPLATES).filter(template => template.rarity === rarity);
}

export function getItemsByEquipmentSlot(slot: EquipmentSlot): ItemTemplate[] {
  return Object.values(ITEM_TEMPLATES).filter(
    template => template.type === ItemType.EQUIPMENT && 
                template.metadata.equipmentSlot === slot
  );
}

export function getRandomItemTemplate(type?: ItemType, rarity?: ItemRarity): ItemTemplate {
  let items = Object.values(ITEM_TEMPLATES);
  
  if (type) {
    items = items.filter(item => item.type === type);
  }
  
  if (rarity) {
    items = items.filter(item => item.rarity === rarity);
  }
  
  if (items.length === 0) {
    console.error(`No items found for type: ${type}, rarity: ${rarity}`);
    console.error('Available items:', Object.values(ITEM_TEMPLATES).map(t => ({ id: t.id, type: t.type, rarity: t.rarity })));
    
    // Fallback: try to find any item of the requested type, ignoring rarity
    if (type) {
      items = Object.values(ITEM_TEMPLATES).filter(item => item.type === type);
    }
    
    // If still no items, get any item
    if (items.length === 0) {
      items = Object.values(ITEM_TEMPLATES);
    }
    
    if (items.length === 0) {
      throw new Error('No items match the specified criteria');
    }
  }
  
  return items[Math.floor(Math.random() * items.length)];
}

// Mapping from old collectible types to new item IDs for backwards compatibility
export const COLLECTIBLE_TO_ITEM_MAP: Record<CollectibleType, string> = {
  [CollectibleType.HEALTH]: 'health_potion_small',
  [CollectibleType.EXTRA_DAMAGE]: 'damage_elixir',
  [CollectibleType.FASTER_SHOOTING]: 'rapid_fire_serum',
  [CollectibleType.EXTRA_CURRENCY]: 'gold_coin',
  [CollectibleType.SHIELD]: 'shield_scroll',
  [CollectibleType.SPEED_BOOST]: 'speed_potion',
  [CollectibleType.POWER_UP]: 'damage_elixir',
  [CollectibleType.COIN]: 'gold_coin'
};

// Rarity-based drop weights for random generation
export const RARITY_DROP_WEIGHTS: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 0.60,     // 60%
  [ItemRarity.RARE]: 0.25,       // 25%
  [ItemRarity.EPIC]: 0.12,       // 12%
  [ItemRarity.LEGENDARY]: 0.03   // 3%
};

// Type-based drop weights
export const TYPE_DROP_WEIGHTS: Record<ItemType, number> = {
  [ItemType.CONSUMABLE]: 0.50,   // 50%
  [ItemType.EQUIPMENT]: 0.20,    // 20%
  [ItemType.MATERIAL]: 0.25,     // 25%
  [ItemType.SPECIAL]: 0.05       // 5%
};

// Valid combinations of item types and rarities based on existing items
export const VALID_TYPE_RARITY_COMBINATIONS: Array<{ type: ItemType; rarity: ItemRarity }> = [
  // Consumables
  { type: ItemType.CONSUMABLE, rarity: ItemRarity.COMMON },
  { type: ItemType.CONSUMABLE, rarity: ItemRarity.RARE },
  { type: ItemType.CONSUMABLE, rarity: ItemRarity.EPIC },
  // Equipment  
  { type: ItemType.EQUIPMENT, rarity: ItemRarity.COMMON },
  { type: ItemType.EQUIPMENT, rarity: ItemRarity.RARE },
  { type: ItemType.EQUIPMENT, rarity: ItemRarity.EPIC },
  { type: ItemType.EQUIPMENT, rarity: ItemRarity.LEGENDARY },
  // Materials
  { type: ItemType.MATERIAL, rarity: ItemRarity.COMMON },
  { type: ItemType.MATERIAL, rarity: ItemRarity.RARE },
  { type: ItemType.MATERIAL, rarity: ItemRarity.LEGENDARY },
  // Special
  { type: ItemType.SPECIAL, rarity: ItemRarity.COMMON },
  { type: ItemType.SPECIAL, rarity: ItemRarity.RARE },
  { type: ItemType.SPECIAL, rarity: ItemRarity.EPIC }
];