/**
 * Modernized Game Class
 * Refactored version of Game.ts using the new unified systems
 * Demonstrates how the consolidation improves the codebase
 */

import { Game } from './Game';
import { UpgradeService } from '../services/UpgradeService';
import { TowerUpgradeManager, PlayerUpgradeManager } from '@/systems/UnifiedUpgradeSystem';
import { Tower } from '@/entities/Tower';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { UpgradeType as TowerUpgradeType } from '@/systems/TowerUpgradeManager';
import { ResourceManager } from '@/systems/ResourceManager';

/**
 * This class shows how the Game class would look after refactoring
 * It uses the new UpgradeService instead of managing upgrades directly
 */
export class ModernizedGame extends Game {
  private upgradeService: UpgradeService;

  constructor(canvas: HTMLCanvasElement, mapConfig?: any, autoStart: boolean = true) {
    super(canvas, mapConfig, autoStart);
    
    // Initialize the unified upgrade service
    this.upgradeService = new UpgradeService(this.getResourceManager());
  }

  // Simplified tower upgrade method using the service
  override upgradeTower(tower: Tower, upgradeType: TowerUpgradeType): boolean {
    const result = this.upgradeService.upgradeTower(tower, upgradeType);
    
    if (result.success) {
      this.getAudioHandler().playTowerUpgrade();
      console.log(result.message);
      return true;
    } else {
      console.warn(result.message);
      return false;
    }
  }

  // Simplified player upgrade method using the service
  override upgradePlayer(upgradeType: PlayerUpgradeType): boolean {
    const result = this.upgradeService.upgradePlayer(this.getPlayer(), upgradeType);
    
    if (result.success) {
      this.getAudioHandler().playPlayerLevelUp();
      console.log(result.message);
      return true;
    } else {
      console.warn(result.message);
      return false;
    }
  }

  // New convenience methods enabled by the unified system
  
  /**
   * Get upgrade recommendations for the current game state
   */
  getUpgradeRecommendations(maxCount: number = 5) {
    return this.upgradeService.getUpgradeRecommendations(
      this.getTowers(), 
      this.getPlayer(), 
      maxCount
    );
  }

  /**
   * Get comprehensive upgrade status for UI display
   */
  getUpgradeStatus() {
    return this.upgradeService.getUpgradeStatus(this.getTowers(), this.getPlayer());
  }

  /**
   * Auto-upgrade player within a budget
   */
  autoUpgradePlayer(budget?: number) {
    const availableBudget = budget || this.getCurrency();
    const result = this.upgradeService.autoUpgradePlayer(this.getPlayer(), availableBudget);
    
    if (result.successCount > 0) {
      this.getAudioHandler().playPlayerLevelUp();
      console.log(`Auto-upgraded ${result.successCount} player attributes for ${result.totalCost} currency`);
    }
    
    return result;
  }

  /**
   * Batch upgrade multiple towers
   */
  batchUpgradeTowers(
    towers: Tower[], 
    upgradeType: TowerUpgradeType, 
    levels: number = 1
  ) {
    const results = towers.map(tower => {
      const upgrades = [{ type: upgradeType, levels }];
      return this.upgradeService.upgradeTowerMultiple(tower, upgrades);
    });

    const totalCost = results.reduce((sum, result) => sum + result.totalCost, 0);
    const totalSuccesses = results.reduce((sum, result) => sum + result.successCount, 0);

    if (totalSuccesses > 0) {
      this.getAudioHandler().playTowerUpgrade();
      console.log(`Batch upgraded ${totalSuccesses} towers for ${totalCost} currency`);
    }

    return results;
  }

  /**
   * Check if the player should be notified about available upgrades
   */
  shouldNotifyAboutUpgrades(): boolean {
    return this.upgradeService.hasAffordableUpgrades(this.getTowers(), this.getPlayer());
  }

  /**
   * Get upgrade efficiency analysis for strategy assistance
   */
  getUpgradeEfficiencyAnalysis() {
    const status = this.getUpgradeStatus();
    
    return {
      playerUpgrades: status.player.map(upgrade => ({
        type: upgrade.type,
        efficiency: upgrade.canUpgrade ? upgrade.description.length / Math.max(upgrade.cost, 1) : 0,
        priority: this.getPlayerUpgradePriority(upgrade.type)
      })),
      towerUpgrades: status.towers.flatMap(towerData => 
        towerData.upgrades.map(upgrade => ({
          towerId: towerData.tower.toString(),
          type: upgrade.type,
          efficiency: upgrade.canUpgrade ? upgrade.description.length / Math.max(upgrade.cost, 1) : 0,
          priority: this.getTowerUpgradePriority(upgrade.type as TowerUpgradeType)
        }))
      )
    };
  }

  /**
   * Intelligent upgrade suggestions based on game state
   */
  getIntelligentUpgradeSuggestions() {
    const currentWave = this.getCurrentWave();
    const playerHealth = this.getPlayer().health / this.getPlayer().maxHealth;
    const enemyCount = this.getEnemies().length;
    
    const suggestions = this.getUpgradeRecommendations();
    
    // Modify recommendations based on game state
    return suggestions.map(suggestion => {
      let adjustedPriority = suggestion.priority;
      
      // Increase health/regeneration priority if player is low on health
      if (playerHealth < 0.5 && (suggestion.upgradeType === 'HEALTH' || suggestion.upgradeType === 'REGENERATION')) {
        adjustedPriority += 3;
        suggestion.reason += ' (Player health is low)';
      }
      
      // Increase damage priority if many enemies present
      if (enemyCount > 5 && suggestion.upgradeType === 'DAMAGE') {
        adjustedPriority += 2;
        suggestion.reason += ' (Many enemies present)';
      }
      
      // Increase tower upgrades priority in later waves
      if (currentWave > 3 && suggestion.entityType === 'tower') {
        adjustedPriority += 1;
        suggestion.reason += ' (Advanced wave)';
      }
      
      return { ...suggestion, priority: adjustedPriority };
    }).sort((a, b) => b.priority - a.priority);
  }

  private getPlayerUpgradePriority(upgradeType: PlayerUpgradeType): number {
    // Priority scoring based on general gameplay value
    switch (upgradeType) {
      case PlayerUpgradeType.DAMAGE: return 5;
      case PlayerUpgradeType.HEALTH: return 4;
      case PlayerUpgradeType.FIRE_RATE: return 3;
      case PlayerUpgradeType.SPEED: return 2;
      case PlayerUpgradeType.REGENERATION: return 1;
      default: return 0;
    }
  }

  private getTowerUpgradePriority(upgradeType: TowerUpgradeType): number {
    // Priority scoring based on general gameplay value
    switch (upgradeType) {
      case TowerUpgradeType.DAMAGE: return 5;
      case TowerUpgradeType.RANGE: return 3;
      case TowerUpgradeType.FIRE_RATE: return 4;
      default: return 0;
    }
  }

  // Access to the upgrade service for external use
  getUpgradeService(): UpgradeService {
    return this.upgradeService;
  }

  // Helper methods to access private members from parent class
  private getResourceManager(): ResourceManager {
    return (this as any).resourceManager;
  }

  private getAudioHandler() {
    return (this as any).audioHandler;
  }
}