import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import type { Vector2 } from '@/utils/Vector2';
import { CURRENCY_CONFIG } from '../config/GameConfig';
import { ANIMATION_CONFIG } from '../config/RenderingConfig';
import type { InventoryItem } from '@/systems/Inventory';
import { createItem, COLLECTIBLE_TO_ITEM_MAP, getRandomItemTemplate, RARITY_DROP_WEIGHTS, TYPE_DROP_WEIGHTS, CollectibleType } from './items/ItemTypes';

interface CollectibleConfig {
  name: string;
  color: string;
  duration?: number; // milliseconds for power-ups
  value?: number; // heal amount for health or currency amount
  effect?: (player: Player) => void;
}

const COLLECTIBLE_CONFIGS: Record<CollectibleType, CollectibleConfig> = {
  [CollectibleType.HEALTH]: {
    name: 'Health Pickup',
    color: '#4CAF50',
    value: 25
  },
  [CollectibleType.EXTRA_DAMAGE]: {
    name: 'Extra Damage',
    color: '#FF4444',
    duration: 10000, // 10 seconds
    effect: (player: Player) => {
      player.addTemporaryDamageBoost(1.5, 10000); // 50% more damage for 10 seconds
    }
  },
  [CollectibleType.FASTER_SHOOTING]: {
    name: 'Faster Shooting',
    color: '#FFC107',
    duration: 8000, // 8 seconds
    effect: (player: Player) => {
      player.addTemporaryFireRateBoost(2.0, 8000); // 100% faster shooting for 8 seconds
    }
  },
  [CollectibleType.EXTRA_CURRENCY]: {
    name: 'Extra Currency',
    color: '#FFD700',
    value: CURRENCY_CONFIG.powerUpBonus
  },
  [CollectibleType.SHIELD]: {
    name: 'Shield',
    color: '#2196F3',
    duration: 15000, // 15 seconds
    effect: (player: Player) => {
      player.addShield(15000); // Shield for 15 seconds
    }
  },
  [CollectibleType.SPEED_BOOST]: {
    name: 'Speed Boost',
    color: '#9C27B0',
    duration: 12000, // 12 seconds
    effect: (player: Player) => {
      player.addTemporarySpeedBoost(1.5, 12000); // 50% speed increase for 12 seconds
    }
  }
};

export class Collectible extends Entity {
  public isActive: boolean = true;
  public readonly collectibleType: CollectibleType;
  public readonly config: CollectibleConfig;
  private animationTime: number = 0;
  
  constructor(position: Vector2, collectibleType: CollectibleType) {
    super(EntityType.COLLECTIBLE, position, 1, 10); // 1 health, 10 radius
    this.collectibleType = collectibleType;
    this.config = COLLECTIBLE_CONFIGS[collectibleType];
  }

  override update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Update animation time for visual effects
    this.animationTime += deltaTime;
    
    super.update(deltaTime);
  }

  checkCollisionWithPlayer(player: Player): boolean {
    if (!this.isActive || !player.isAlive) return false;
    
    // Check collision based on combined radii
    const distance = this.distanceTo(player);
    return distance <= (this.radius + player.radius);
  }

  tryCollectByPlayer(player: Player): boolean {
    if (!this.checkCollisionWithPlayer(player)) {
      return false;
    }

    // Handle different collectible types
    switch (this.collectibleType) {
      case CollectibleType.HEALTH:
        if (this.config.value) {
          player.heal(this.config.value);
        }
        break;
      
      case CollectibleType.EXTRA_CURRENCY:
        // Currency is handled by the Game class when this returns true
        break;
      
      default:
        // Power-ups
        if (this.config.effect) {
          this.config.effect(player);
        }
        break;
    }
    
    // Deactivate the collectible
    this.deactivate();
    
    return true;
  }

  // Aliases for backward compatibility
  tryHealPlayer(player: Player): boolean {
    return this.collectibleType === CollectibleType.HEALTH && this.tryCollectByPlayer(player);
  }

  applyToPlayer(player: Player): boolean {
    return this.collectibleType !== CollectibleType.HEALTH && this.tryCollectByPlayer(player);
  }

  // Visual effects - common animation patterns using centralized config
  getVisualY(): number {
    // Bobbing animation
    return this.position.y + Math.sin(this.animationTime * ANIMATION_CONFIG.bobSpeed) * ANIMATION_CONFIG.bobAmount;
  }

  getRotation(): number {
    // Slow rotation
    return this.animationTime * ANIMATION_CONFIG.rotationSpeed;
  }

  getPulseScale(): number {
    // Pulsing effect
    return 1 + Math.sin(this.animationTime * ANIMATION_CONFIG.pulseSpeed) * 0.2;
  }

  // Static spawn system helpers
  static getBaseSpawnChance(): number {
    return 0.25; // 25% base chance to spawn from defeated enemies
  }

  static shouldSpawnFromEnemy(spawnChance?: number): boolean {
    const chance = spawnChance || this.getBaseSpawnChance();
    return Math.random() < chance;
  }

  static getRandomType(): CollectibleType {
    const types = Object.values(CollectibleType);
    const weights = [0.4, 0.55, 0.7, 0.8, 0.9, 1.0]; // Health is most common, shield least common
    const random = Math.random();
    
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return types[i] ?? CollectibleType.HEALTH;
      }
    }
    
    return CollectibleType.HEALTH;
  }

  // New inventory-based item generation
  static shouldSpawnItem(spawnChance?: number): boolean {
    const chance = spawnChance || this.getBaseSpawnChance();
    return Math.random() < chance;
  }

  static generateRandomItem(): InventoryItem {
    // First, determine item rarity
    const rarityRoll = Math.random();
    let selectedRarity: keyof typeof RARITY_DROP_WEIGHTS = 'COMMON';
    
    let cumulativeWeight = 0;
    for (const [rarity, weight] of Object.entries(RARITY_DROP_WEIGHTS)) {
      cumulativeWeight += weight;
      if (rarityRoll <= cumulativeWeight) {
        selectedRarity = rarity as keyof typeof RARITY_DROP_WEIGHTS;
        break;
      }
    }

    // Then, determine item type
    const typeRoll = Math.random();
    let selectedType: keyof typeof TYPE_DROP_WEIGHTS = 'CONSUMABLE';
    
    cumulativeWeight = 0;
    for (const [type, weight] of Object.entries(TYPE_DROP_WEIGHTS)) {
      cumulativeWeight += weight;
      if (typeRoll <= cumulativeWeight) {
        selectedType = type as keyof typeof TYPE_DROP_WEIGHTS;
        break;
      }
    }

    // Generate random item template with the selected rarity and type
    const template = getRandomItemTemplate(selectedType, selectedRarity);
    return createItem(template.id, 1);
  }

  static generateItemFromCollectible(collectibleType: CollectibleType): InventoryItem {
    const itemId = COLLECTIBLE_TO_ITEM_MAP[collectibleType];
    return createItem(itemId, 1);
  }

  // Helper to check if this is a power-up type
  isPowerUp(): boolean {
    return this.collectibleType !== CollectibleType.HEALTH && this.collectibleType !== CollectibleType.EXTRA_CURRENCY;
  }

  // Helper to check if this is a health pickup
  isHealthPickup(): boolean {
    return this.collectibleType === CollectibleType.HEALTH;
  }

  private deactivate(): void {
    this.isActive = false;
    this.isAlive = false;
  }

  // Rendering method (moved from Renderer class)
  render(ctx: CanvasRenderingContext2D, screenPos: Vector2): void {
    if (!this.isActive) return;

    const visualY = screenPos.y + Math.sin(this.animationTime * ANIMATION_CONFIG.bobSpeed) * ANIMATION_CONFIG.bobAmount;
    const rotation = this.animationTime * ANIMATION_CONFIG.rotationSpeed;
    const scale = this.getPulseScale();

    ctx.save();
    ctx.translate(screenPos.x, visualY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Draw collectible based on type
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.config.color;
    ctx.fill();

    // Add a bright outline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add inner glow effect for power-ups
    if (this.isPowerUp()) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }

    ctx.restore();
  }
}