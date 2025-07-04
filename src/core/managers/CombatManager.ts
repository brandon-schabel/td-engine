import type { Enemy } from "@/entities/Enemy";
import type { Player } from "@/entities/Player";
import type { Vector2 } from "@/utils/Vector2";
import { Collectible } from "@/entities/Collectible";
import { COLLECTIBLE_DROP_CHANCES } from "@/config/ItemConfig";
import { CURRENCY_CONFIG } from "@/config/GameConfig";
import { utilizeEntityStore } from "@/stores/entityStore";
import { gameStore } from "@/stores/gameStore";
import type { InventoryItem } from "@/systems/Inventory";
import { CollectibleType } from "@/entities/items/ItemTypes";

/**
 * Interface for managing game life and score
 */
export interface GameLifeManager {
  loseLife(): void;
  addCurrency(amount: number): void;
  addScore(amount: number): void;
}

/**
 * Interface for player level display
 */
export interface PlayerLevelDisplay {
  showLevelUpNotification?: (level: number, pointsEarned: number) => void;
}

/**
 * Configuration for CombatManager
 */
export interface CombatManagerConfig {
  gameLifeManager: GameLifeManager;
  player: Player;
  playerLevelDisplay?: PlayerLevelDisplay;
}

/**
 * Manages combat-related operations including enemy deaths, rewards, and damage numbers
 */
export class CombatManager {
  // Combat statistics
  private enemiesKilled: number = 0;

  // Dependencies
  private gameLifeManager: GameLifeManager;
  private player: Player;
  private playerLevelDisplay?: PlayerLevelDisplay;

  constructor(config: CombatManagerConfig) {
    this.gameLifeManager = config.gameLifeManager;
    this.player = config.player;
    this.playerLevelDisplay = config.playerLevelDisplay;
  }

  /**
   * Handle when an enemy reaches the end of the path
   */
  enemyReachedEnd(): void {
    this.gameLifeManager.loseLife();
  }

  /**
   * Handle when an enemy is killed
   * @param enemy The enemy that was killed
   */
  enemyKilled(enemy: Enemy): void {
    this.gameLifeManager.addCurrency(enemy.reward);
    this.gameLifeManager.addScore(enemy.reward * CURRENCY_CONFIG.baseRewardMultiplier);

    // Track enemies killed
    this.enemiesKilled++;

    // Award experience to player if they have the addExperience method
    if (
      this.player &&
      "addExperience" in this.player &&
      typeof this.player.addExperience === "function"
    ) {
      // Award experience based on enemy reward
      // Enemies give 2x their reward value as XP
      const experienceGain = enemy.reward * 2;
      const leveledUp = (this.player as any).addExperience(experienceGain);

      // Show level up notification if player leveled up
      if (leveledUp && this.playerLevelDisplay && this.playerLevelDisplay.showLevelUpNotification) {
        const levelSystem = this.player.getPlayerLevelSystem();
        const newLevel = levelSystem.getLevel();
        const pointsEarned = newLevel === 10 || newLevel === 20 || newLevel === 30 || newLevel === 40 || newLevel === 50 ? 2 : 1;
        this.playerLevelDisplay.showLevelUpNotification(newLevel, pointsEarned);
      }
    }

    // Enhanced item drop system
    const dropRate = this.getEnemyDropRate(enemy);
    const numDrops = this.getNumDropsForEnemy(enemy);

    for (let i = 0; i < numDrops; i++) {
      if (Collectible.shouldSpawnItem(dropRate)) {
        // 40% chance for new inventory items, 60% chance for traditional collectibles
        if (Math.random() < 0.4) {
          // Spawn new item types as collectibles
          const randomItem = Collectible.generateRandomItem();
          // Create a special collectible that represents the item
          const position = {
            x: enemy.position.x + (Math.random() - 0.5) * 40, // Spread out multiple drops
            y: enemy.position.y + (Math.random() - 0.5) * 40,
          };
          const collectible = new Collectible(
            position,
            this.getCollectibleTypeForItem(randomItem)
          );
          const entityStore = utilizeEntityStore.getState();
          entityStore.addCollectible(collectible);
        } else {
          // Traditional collectible system
          const collectibleType = Collectible.getRandomType();
          const position = {
            x: enemy.position.x + (Math.random() - 0.5) * 40,
            y: enemy.position.y + (Math.random() - 0.5) * 40,
          };
          const collectible = new Collectible(position, collectibleType);
          const entityStore = utilizeEntityStore.getState();
          entityStore.addCollectible(collectible);
        }
      }
    }

    // Extra currency drop chance
    if (Math.random() < COLLECTIBLE_DROP_CHANCES.extraCurrencyDrop) {
      this.gameLifeManager.addCurrency(enemy.reward * CURRENCY_CONFIG.extraDropMultiplier);
    }
  }

  /**
   * Dispatch a damage number event to be displayed
   * @param entity The entity that was damaged
   * @param value The damage/heal value
   * @param type The type of damage (normal, critical, or heal)
   */
  dispatchDamageNumber(entity: any, value: number, type: 'normal' | 'critical' | 'heal' = 'normal'): void {
    const worldPosition = { x: entity.x, y: entity.y };
    const damageType = type === 'heal' ? 'heal' : type === 'critical' ? 'critical' : 'physical';

    document.dispatchEvent(new CustomEvent('damageNumber', {
      detail: { worldPosition, value, type: damageType }
    }));
  }

  /**
   * Get the drop rate for an enemy
   * @param enemy The enemy to check
   * @returns The drop rate multiplier
   */
  private getEnemyDropRate(enemy: Enemy): number {
    // Boss enemies have 3x drop rate
    if (enemy.isBoss) {
      return 3.0;
    }
    // Elite enemies have 2x drop rate
    if (enemy.maxHealth > 100) {
      return 2.0;
    }
    // Normal enemies have base drop rate
    return 1.0;
  }

  /**
   * Get the number of drops for an enemy
   * @param enemy The enemy to check
   * @returns The number of potential drops
   */
  private getNumDropsForEnemy(enemy: Enemy): number {
    // Boss enemies can drop 2-3 items
    if (enemy.isBoss) {
      return Math.floor(Math.random() * 2) + 2;
    }
    // Elite enemies can drop 1-2 items
    if (enemy.maxHealth > 100) {
      return Math.floor(Math.random() * 2) + 1;
    }
    // Normal enemies drop 1 item
    return 1;
  }

  /**
   * Map inventory items to collectible types
   * @param item The inventory item
   * @returns The corresponding collectible type
   */
  private getCollectibleTypeForItem(item: InventoryItem): CollectibleType {
    // This is a simplified mapping - in a real implementation,
    // you might want to create special collectible types for inventory items
    // or handle this differently
    switch (item.category) {
      case 'consumable':
        return CollectibleType.HEALTH;
      case 'equipment':
        return CollectibleType.POWER_UP;
      case 'material':
        return CollectibleType.COIN;
      default:
        return CollectibleType.COIN;
    }
  }

  /**
   * Get the number of enemies killed
   */
  getEnemiesKilled(): number {
    return this.enemiesKilled;
  }

  /**
   * Reset the combat manager state
   */
  reset(): void {
    this.enemiesKilled = 0;
  }

  /**
   * Set the player reference (useful after player reset)
   * @param player The new player reference
   */
  setPlayer(player: Player): void {
    this.player = player;
  }

  /**
   * Set the player level display reference
   * @param display The player level display
   */
  setPlayerLevelDisplay(display: PlayerLevelDisplay): void {
    this.playerLevelDisplay = display;
  }
}