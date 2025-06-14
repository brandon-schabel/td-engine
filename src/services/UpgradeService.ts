/**
 * Upgrade Service
 * High-level service layer for managing all upgrade operations in the game
 * Consolidates upgrade logic and provides a unified interface
 */

import { TowerUpgradeManager, PlayerUpgradeManager } from '@/systems/UnifiedUpgradeSystem';
import { Tower } from '@/entities/Tower';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { UpgradeType as TowerUpgradeType } from '@/systems/TowerUpgradeManager';
import { ResourceManager, ResourceType } from '@/systems/ResourceManager';

export interface UpgradeResult {
  success: boolean;
  cost: number;
  newLevel: number;
  message: string;
}

export interface BatchUpgradeResult {
  totalCost: number;
  successCount: number;
  failCount: number;
  results: Array<{ type: string; success: boolean; cost: number }>;
}

export interface UpgradeRecommendation {
  entityType: 'tower' | 'player';
  entityId?: string;
  upgradeType: string;
  priority: number;
  cost: number;
  efficiency: number;
  reason: string;
}

export class UpgradeService {
  private towerUpgradeManager: TowerUpgradeManager;
  private playerUpgradeManager: PlayerUpgradeManager;
  private resourceManager: ResourceManager;

  constructor(resourceManager: ResourceManager) {
    this.towerUpgradeManager = new TowerUpgradeManager();
    this.playerUpgradeManager = new PlayerUpgradeManager();
    this.resourceManager = resourceManager;
  }

  // Tower upgrade operations
  upgradeTower(tower: Tower, upgradeType: TowerUpgradeType): UpgradeResult {
    const cost = this.towerUpgradeManager.getUpgradeCost(tower, upgradeType);
    
    if (cost === 0) {
      return {
        success: false,
        cost: 0,
        newLevel: tower.getUpgradeLevel(upgradeType),
        message: 'Tower is already at maximum level for this upgrade'
      };
    }

    if (!this.resourceManager.canAfford(ResourceType.CURRENCY, cost)) {
      return {
        success: false,
        cost,
        newLevel: tower.getUpgradeLevel(upgradeType),
        message: `Not enough currency. Required: ${cost}, Available: ${this.resourceManager.getCurrency()}`
      };
    }

    if (!tower.canUpgrade(upgradeType)) {
      return {
        success: false,
        cost,
        newLevel: tower.getUpgradeLevel(upgradeType),
        message: 'Tower cannot be upgraded further'
      };
    }

    const actualCost = this.towerUpgradeManager.applyUpgrade(tower, upgradeType);
    if (actualCost > 0) {
      this.resourceManager.spendResource(ResourceType.CURRENCY, actualCost);
      return {
        success: true,
        cost: actualCost,
        newLevel: tower.getUpgradeLevel(upgradeType),
        message: `Tower ${upgradeType.toLowerCase()} upgraded successfully`
      };
    }

    return {
      success: false,
      cost,
      newLevel: tower.getUpgradeLevel(upgradeType),
      message: 'Upgrade failed due to unknown error'
    };
  }

  // Player upgrade operations
  upgradePlayer(player: Player, upgradeType: PlayerUpgradeType): UpgradeResult {
    const cost = this.playerUpgradeManager.getUpgradeCost(player, upgradeType);
    
    if (cost === 0) {
      return {
        success: false,
        cost: 0,
        newLevel: player.getUpgradeLevel(upgradeType),
        message: 'Player is already at maximum level for this upgrade'
      };
    }

    if (!this.resourceManager.canAfford(ResourceType.CURRENCY, cost)) {
      return {
        success: false,
        cost,
        newLevel: player.getUpgradeLevel(upgradeType),
        message: `Not enough currency. Required: ${cost}, Available: ${this.resourceManager.getCurrency()}`
      };
    }

    if (!player.canUpgrade(upgradeType)) {
      return {
        success: false,
        cost,
        newLevel: player.getUpgradeLevel(upgradeType),
        message: 'Player cannot be upgraded further'
      };
    }

    const actualCost = this.playerUpgradeManager.applyUpgrade(player, upgradeType);
    if (actualCost > 0) {
      this.resourceManager.spendResource(ResourceType.CURRENCY, actualCost);
      return {
        success: true,
        cost: actualCost,
        newLevel: player.getUpgradeLevel(upgradeType),
        message: `Player ${upgradeType.toLowerCase()} upgraded successfully`
      };
    }

    return {
      success: false,
      cost,
      newLevel: player.getUpgradeLevel(upgradeType),
      message: 'Upgrade failed due to unknown error'
    };
  }

  // Batch upgrade operations
  upgradeTowerMultiple(
    tower: Tower, 
    upgrades: Array<{ type: TowerUpgradeType; levels: number }>
  ): BatchUpgradeResult {
    const availableCurrency = this.resourceManager.getCurrency();
    const result = this.towerUpgradeManager.applyMultipleUpgrades(tower, upgrades, availableCurrency);
    
    if (result.totalCost > 0) {
      this.resourceManager.spendResource(ResourceType.CURRENCY, result.totalCost);
    }

    return {
      totalCost: result.totalCost,
      successCount: result.successfulUpgrades.length,
      failCount: result.failedUpgrades.length,
      results: [
        ...result.successfulUpgrades.map(type => ({ type: type as string, success: true, cost: this.towerUpgradeManager.getUpgradeCost(tower, type) })),
        ...result.failedUpgrades.map(type => ({ type: type as string, success: false, cost: 0 }))
      ]
    };
  }

  // Get upgrade recommendations
  getUpgradeRecommendations(
    towers: Tower[], 
    player: Player, 
    maxRecommendations: number = 5
  ): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];
    const availableCurrency = this.resourceManager.getCurrency();

    // Player upgrade recommendations
    const playerOptimalPath = this.playerUpgradeManager.getOptimalUpgradePath(player, availableCurrency);
    playerOptimalPath.slice(0, 3).forEach((upgrade, index) => {
      recommendations.push({
        entityType: 'player',
        upgradeType: upgrade.type as string,
        priority: 10 - index, // Higher priority for more efficient upgrades
        cost: upgrade.cost,
        efficiency: upgrade.efficiency,
        reason: `High efficiency player upgrade (${upgrade.efficiency.toFixed(2)} per currency)`
      });
    });

    // Tower upgrade recommendations
    towers.forEach((tower, towerIndex) => {
      const towerOptimalPath = this.towerUpgradeManager.getOptimalUpgradePath(tower, availableCurrency);
      towerOptimalPath.slice(0, 2).forEach((upgrade, index) => {
        recommendations.push({
          entityType: 'tower',
          entityId: `tower_${towerIndex}`,
          upgradeType: upgrade.type as string,
          priority: 8 - index, // Slightly lower priority than player upgrades
          cost: upgrade.cost,
          efficiency: upgrade.efficiency,
          reason: `Efficient tower upgrade for ${tower.towerType} tower`
        });
      });
    });

    // Sort by priority and efficiency, then limit results
    return recommendations
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.efficiency - a.efficiency;
      })
      .slice(0, maxRecommendations);
  }

  // Check if any upgrades are affordable
  hasAffordableUpgrades(towers: Tower[], player: Player): boolean {
    const availableCurrency = this.resourceManager.getCurrency();

    // Check player upgrades
    const playerUpgrades = this.playerUpgradeManager.getAllUpgradeInfo(player);
    if (playerUpgrades.some(upgrade => upgrade.canUpgrade && upgrade.cost <= availableCurrency)) {
      return true;
    }

    // Check tower upgrades
    for (const tower of towers) {
      const towerUpgrades = this.towerUpgradeManager.getAllUpgradeInfo(tower);
      if (towerUpgrades.some(upgrade => upgrade.canUpgrade && upgrade.cost <= availableCurrency)) {
        return true;
      }
    }

    return false;
  }

  // Get comprehensive upgrade status
  getUpgradeStatus(towers: Tower[], player: Player): {
    player: ReturnType<PlayerUpgradeManager['getAllUpgradeInfo']>;
    towers: Array<{ 
      tower: Tower; 
      upgrades: ReturnType<TowerUpgradeManager['getAllUpgradeInfo']>; 
      efficiency: number;
    }>;
    recommendations: UpgradeRecommendation[];
    totalPossibleUpgrades: number;
    totalAffordableUpgrades: number;
  } {
    const availableCurrency = this.resourceManager.getCurrency();
    const playerUpgrades = this.playerUpgradeManager.getAllUpgradeInfo(player);
    
    const towerData = towers.map(tower => {
      const upgrades = this.towerUpgradeManager.getAllUpgradeInfo(tower);
      const efficiencySum = upgrades.reduce((sum, upgrade) => {
        if (upgrade.canUpgrade && upgrade.cost <= availableCurrency) {
          return sum + (upgrade.cost > 0 ? 1 / upgrade.cost : 0);
        }
        return sum;
      }, 0);
      
      return { tower, upgrades, efficiency: efficiencySum };
    });

    const recommendations = this.getUpgradeRecommendations(towers, player);
    
    const totalPossibleUpgrades = playerUpgrades.filter(u => u.canUpgrade).length +
      towerData.reduce((sum, t) => sum + t.upgrades.filter(u => u.canUpgrade).length, 0);
    
    const totalAffordableUpgrades = playerUpgrades.filter(u => u.canUpgrade && u.cost <= availableCurrency).length +
      towerData.reduce((sum, t) => sum + t.upgrades.filter(u => u.canUpgrade && u.cost <= availableCurrency).length, 0);

    return {
      player: playerUpgrades,
      towers: towerData,
      recommendations,
      totalPossibleUpgrades,
      totalAffordableUpgrades
    };
  }

  // Auto-upgrade functionality
  autoUpgradePlayer(player: Player, budget: number): BatchUpgradeResult {
    const optimalPath = this.playerUpgradeManager.getOptimalUpgradePath(player, budget);
    const upgrades: Array<{ type: PlayerUpgradeType; levels: number }> = 
      optimalPath.map(upgrade => ({ type: upgrade.type, levels: 1 }));

    const result = this.playerUpgradeManager.applyMultipleUpgrades(player, upgrades, budget);
    
    if (result.totalCost > 0) {
      this.resourceManager.spendResource(ResourceType.CURRENCY, result.totalCost);
    }

    return {
      totalCost: result.totalCost,
      successCount: result.successfulUpgrades.length,
      failCount: result.failedUpgrades.length,
      results: [
        ...result.successfulUpgrades.map(type => ({ type: type as string, success: true, cost: this.playerUpgradeManager.getUpgradeCost(player, type) })),
        ...result.failedUpgrades.map(type => ({ type: type as string, success: false, cost: 0 }))
      ]
    };
  }

  // Get managers for direct access if needed
  getTowerUpgradeManager(): TowerUpgradeManager {
    return this.towerUpgradeManager;
  }

  getPlayerUpgradeManager(): PlayerUpgradeManager {
    return this.playerUpgradeManager;
  }
}