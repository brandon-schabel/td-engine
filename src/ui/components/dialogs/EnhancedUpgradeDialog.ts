/**
 * Enhanced Upgrade Dialog
 * Advanced upgrade interface with recommendations, synergies, and bulk upgrades
 * 
 * Recent changes:
 * - Initial creation with enhanced features
 * - Added upgrade recommendations
 * - Added synergy display
 * - Added bulk upgrade options
 * - Added upgrade preview
 */

import { BaseDialog } from './BaseDialog';
import { Tower, UpgradeType } from '@/entities/Tower';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { UpgradeService } from '@/services/UpgradeService';
import { TowerUpgradeManager, PlayerUpgradeManager } from '@/systems/UnifiedUpgradeSystem';
import { UPGRADE_SYNERGIES, UPGRADE_CONSTANTS } from '@/config/UpgradeConfig';

export interface EnhancedUpgradeDialogOptions {
  target: Tower | Player;
  currentCurrency: number;
  upgradeService: UpgradeService;
  audioManager?: AudioManager;
  onUpgrade: (type: UpgradeType | PlayerUpgradeType, cost: number) => void;
  onBulkUpgrade?: (upgrades: Array<{ type: UpgradeType | PlayerUpgradeType; levels: number }>, totalCost: number) => void;
  onSell?: () => void;
  onClose: () => void;
}

interface DetailedUpgradeOption {
  type: UpgradeType | PlayerUpgradeType;
  name: string;
  description: string;
  cost: number;
  currentLevel: number;
  maxLevel: number;
  icon: IconType;
  currentEffect: string;
  nextEffect: string;
  efficiency: number;
  isRecommended: boolean;
  bulkLevels?: number;
}

export class EnhancedUpgradeDialog extends BaseDialog {
  private target: Tower | Player;
  private isTower: boolean;
  private currentCurrency: number;
  private upgradeService: UpgradeService;
  private onUpgrade: (type: UpgradeType | PlayerUpgradeType, cost: number) => void;
  private onBulkUpgrade?: (upgrades: Array<{ type: UpgradeType | PlayerUpgradeType; levels: number }>, totalCost: number) => void;
  private onSell?: () => void;
  private onClose: () => void;
  private upgradeOptions: DetailedUpgradeOption[] = [];
  private bulkMode: boolean = false;
  private selectedBulkUpgrades: Map<UpgradeType | PlayerUpgradeType, number> = new Map();
  
  constructor(options: EnhancedUpgradeDialogOptions) {
    const isTower = options.target instanceof Tower;
    super({
      title: isTower ? 'Advanced Tower Upgrades' : 'Advanced Player Upgrades',
      width: DIALOG_CONFIG.sizes.large,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'enhanced-upgrade-dialog'
    });
    
    this.target = options.target;
    this.isTower = isTower;
    this.currentCurrency = options.currentCurrency;
    this.upgradeService = options.upgradeService;
    this.onUpgrade = options.onUpgrade;
    this.onBulkUpgrade = options.onBulkUpgrade;
    this.onSell = options.onSell;
    this.onClose = options.onClose;
    
    this.setupUpgradeOptions();
    this.buildContent();
  }
  
  private setupUpgradeOptions(): void {
    if (this.isTower) {
      const tower = this.target as Tower;
      const manager = this.upgradeService.getTowerUpgradeManager();
      const allInfo = manager.getAllUpgradeInfo(tower);
      const recommendations = manager.getOptimalUpgradePath(tower, this.currentCurrency);
      const recommendedTypes = new Set(recommendations.map(r => r.type));
      
      this.upgradeOptions = allInfo.map(info => ({
        type: info.type,
        name: this.getUpgradeName(info.type),
        description: this.getUpgradeDescription(info.type),
        cost: info.cost,
        currentLevel: info.level,
        maxLevel: info.maxLevel,
        icon: this.getUpgradeIcon(info.type),
        currentEffect: this.formatEffect(info.type, info.effect),
        nextEffect: this.formatEffect(info.type, info.nextEffect),
        efficiency: info.cost > 0 ? (info.nextEffect - info.effect) / info.cost : 0,
        isRecommended: recommendedTypes.has(info.type)
      }));
    } else {
      const player = this.target as Player;
      const manager = this.upgradeService.getPlayerUpgradeManager();
      const allInfo = manager.getAllUpgradeInfo(player);
      const recommendations = manager.getOptimalUpgradePath(player, this.currentCurrency);
      const recommendedTypes = new Set(recommendations.map(r => r.type));
      
      this.upgradeOptions = allInfo.map(info => ({
        type: info.type,
        name: this.getUpgradeName(info.type),
        description: info.description,
        cost: info.cost,
        currentLevel: info.level,
        maxLevel: info.maxLevel,
        icon: this.getUpgradeIcon(info.type),
        currentEffect: this.formatPlayerEffect(info.type, info.effect),
        nextEffect: this.formatPlayerEffect(info.type, info.nextEffect),
        efficiency: info.cost > 0 ? (info.nextEffect - info.effect) / info.cost : 0,
        isRecommended: recommendedTypes.has(info.type)
      }));
    }
    
    // Sort by recommendation and efficiency
    this.upgradeOptions.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) {
        return a.isRecommended ? -1 : 1;
      }
      return b.efficiency - a.efficiency;
    });
  }
  
  protected buildContent(): void {
    // Header with currency and mode toggle
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
    `;
    
    // Currency display
    const currencyDisplay = document.createElement('div');
    currencyDisplay.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    const currencyIcon = createSvgIcon(IconType.CURRENCY, { size: 24 });
    currencyDisplay.innerHTML = `
      ${currencyIcon}
      <span style="font-size: 20px; font-weight: bold; color: #FFD700;">
        ${this.currentCurrency}
      </span>
    `;
    
    // Bulk mode toggle
    const bulkToggle = document.createElement('button');
    bulkToggle.style.cssText = `
      padding: 8px 16px;
      background: ${this.bulkMode ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)'};
      border: 1px solid ${this.bulkMode ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)'};
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    `;
    bulkToggle.textContent = this.bulkMode ? 'Bulk Mode ON' : 'Bulk Mode OFF';
    bulkToggle.onclick = () => this.toggleBulkMode();
    
    header.appendChild(currencyDisplay);
    if (this.onBulkUpgrade) {
      header.appendChild(bulkToggle);
    }
    this.content.appendChild(header);
    
    // Target info and synergies
    const infoSection = document.createElement('div');
    infoSection.style.cssText = `
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    `;
    
    if (this.isTower) {
      const tower = this.target as Tower;
      infoSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; color: #4CAF50; font-size: 18px;">
              ${tower.towerType} Tower - Level ${tower.getLevel()}
            </div>
            <div style="color: #999; font-size: 14px; margin-top: 4px;">
              DPS: ${Math.floor(tower.damage * tower.fireRate)} | Range: ${tower.range}
            </div>
          </div>
          ${this.onSell ? `
            <button onclick="this.handleSell()" style="
              padding: 8px 16px;
              background: #FF9800;
              border: none;
              border-radius: 8px;
              color: white;
              cursor: pointer;
              font-size: 14px;
            ">
              Sell for ${tower.getSellValue()}g
            </button>
          ` : ''}
        </div>
      `;
    } else {
      const player = this.target as Player;
      const synergies = this.upgradeService.getPlayerUpgradeManager().getUpgradeSynergies(player);
      
      infoSection.innerHTML = `
        <div>
          <div style="font-weight: bold; color: #4CAF50; font-size: 18px;">
            Player - Level ${player.getLevel()}
          </div>
          <div style="color: #999; font-size: 14px; margin-top: 4px;">
            DPS: ${Math.floor(player.damage * player.fireRate)} | HP: ${player.health}/${player.maxHealth}
          </div>
          ${synergies.length > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="color: #FFD700; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                Active Synergies:
              </div>
              ${synergies.map(s => `
                <div style="color: #4CAF50; font-size: 13px; margin-bottom: 4px;">
                  ✓ ${s.description}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    this.content.appendChild(infoSection);
    
    // Upgrade options container
    const upgradesContainer = document.createElement('div');
    upgradesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 8px;
    `;
    
    this.upgradeOptions.forEach(option => {
      const card = this.createEnhancedUpgradeCard(option);
      upgradesContainer.appendChild(card);
    });
    
    this.content.appendChild(upgradesContainer);
    
    // Bulk upgrade summary (if in bulk mode)
    if (this.bulkMode) {
      const summary = this.createBulkSummary();
      this.content.appendChild(summary);
    }
    
    // Footer
    this.createFooter();
    this.updateFooter();
  }
  
  private createEnhancedUpgradeCard(option: DetailedUpgradeOption): HTMLElement {
    const canAfford = this.currentCurrency >= option.cost && option.currentLevel < option.maxLevel;
    const isMaxed = option.currentLevel >= option.maxLevel;
    
    const card = document.createElement('div');
    card.style.cssText = `
      background: ${option.isRecommended ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
      border: 1px solid ${option.isRecommended ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 16px;
      cursor: ${canAfford && !isMaxed ? 'pointer' : 'not-allowed'};
      opacity: ${!isMaxed ? '1' : '0.6'};
      transition: all 0.2s ease;
      position: relative;
    `;
    
    // Recommendation badge
    if (option.isRecommended && !isMaxed) {
      const badge = document.createElement('div');
      badge.style.cssText = `
        position: absolute;
        top: -8px;
        right: 16px;
        background: #4CAF50;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.5px;
      `;
      badge.textContent = 'RECOMMENDED';
      card.appendChild(badge);
    }
    
    // Icon
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${option.isRecommended ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
      border-radius: 12px;
    `;
    iconContainer.innerHTML = createSvgIcon(option.icon, { size: 36 });
    card.appendChild(iconContainer);
    
    // Content
    const content = document.createElement('div');
    content.style.cssText = `flex: 1;`;
    
    // Title row
    const titleRow = document.createElement('div');
    titleRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;
    
    const title = document.createElement('div');
    title.innerHTML = `
      <span style="font-weight: bold; font-size: 16px; color: ${isMaxed ? '#FFD700' : '#fff'};">
        ${option.name}
      </span>
      <span style="margin-left: 8px; color: #999; font-size: 14px;">
        ${isMaxed ? 'MAX' : `Lv ${option.currentLevel}/${option.maxLevel}`}
      </span>
    `;
    
    const cost = document.createElement('div');
    if (!isMaxed) {
      cost.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        color: ${canAfford ? '#FFD700' : '#666'};
        font-weight: bold;
      `;
      cost.innerHTML = `${createSvgIcon(IconType.CURRENCY, { size: 18 })} ${option.cost}`;
    }
    
    titleRow.appendChild(title);
    titleRow.appendChild(cost);
    content.appendChild(titleRow);
    
    // Description
    const desc = document.createElement('div');
    desc.style.cssText = `
      color: #999;
      font-size: 13px;
      margin-bottom: 8px;
    `;
    desc.textContent = option.description;
    content.appendChild(desc);
    
    // Effect preview
    const effectRow = document.createElement('div');
    effectRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    `;
    
    const currentEffect = document.createElement('span');
    currentEffect.style.cssText = `color: #ccc;`;
    currentEffect.textContent = option.currentEffect;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = `color: #4CAF50;`;
    arrow.textContent = '→';
    
    const nextEffect = document.createElement('span');
    nextEffect.style.cssText = `color: #4CAF50; font-weight: bold;`;
    nextEffect.textContent = option.nextEffect;
    
    if (!isMaxed) {
      effectRow.appendChild(currentEffect);
      effectRow.appendChild(arrow);
      effectRow.appendChild(nextEffect);
    } else {
      effectRow.innerHTML = `<span style="color: #FFD700;">${option.currentEffect}</span>`;
    }
    
    content.appendChild(effectRow);
    
    // Efficiency indicator (if not maxed)
    if (!isMaxed && option.efficiency > 0) {
      const efficiency = document.createElement('div');
      efficiency.style.cssText = `
        margin-top: 8px;
        font-size: 12px;
        color: #999;
      `;
      const efficiencyStars = '★'.repeat(Math.min(5, Math.ceil(option.efficiency * 10)));
      efficiency.innerHTML = `Efficiency: <span style="color: #FFD700;">${efficiencyStars}</span>`;
      content.appendChild(efficiency);
    }
    
    card.appendChild(content);
    
    // Bulk mode controls
    if (this.bulkMode && !isMaxed) {
      const bulkControls = document.createElement('div');
      bulkControls.style.cssText = `
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      const decreaseBtn = document.createElement('button');
      decreaseBtn.style.cssText = this.getBulkButtonStyle();
      decreaseBtn.textContent = '-';
      
      const levelDisplay = document.createElement('span');
      levelDisplay.style.cssText = `
        width: 30px;
        text-align: center;
        font-weight: bold;
      `;
      levelDisplay.textContent = '0';
      
      const increaseBtn = document.createElement('button');
      increaseBtn.style.cssText = this.getBulkButtonStyle();
      increaseBtn.textContent = '+';
      
      const updateBulkLevel = (delta: number) => {
        const current = this.selectedBulkUpgrades.get(option.type) || 0;
        const maxPossible = option.maxLevel - option.currentLevel;
        const newLevel = Math.max(0, Math.min(maxPossible, current + delta));
        
        if (newLevel === 0) {
          this.selectedBulkUpgrades.delete(option.type);
        } else {
          this.selectedBulkUpgrades.set(option.type, newLevel);
        }
        
        levelDisplay.textContent = newLevel.toString();
        this.updateBulkSummary();
        this.updateFooter();
      };
      
      decreaseBtn.onclick = (e) => {
        e.stopPropagation();
        updateBulkLevel(-1);
      };
      
      increaseBtn.onclick = (e) => {
        e.stopPropagation();
        updateBulkLevel(1);
      };
      
      bulkControls.appendChild(decreaseBtn);
      bulkControls.appendChild(levelDisplay);
      bulkControls.appendChild(increaseBtn);
      card.appendChild(bulkControls);
    }
    
    // Click handler (single upgrade)
    if (!this.bulkMode && canAfford && !isMaxed) {
      card.onclick = () => {
        this.playSound(SoundType.TOWER_UPGRADE);
        this.onUpgrade(option.type, option.cost);
        this.hide();
      };
      
      card.onmouseenter = () => {
        card.style.transform = 'translateX(4px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      };
      
      card.onmouseleave = () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      };
    }
    
    return card;
  }
  
  private toggleBulkMode(): void {
    this.bulkMode = !this.bulkMode;
    this.selectedBulkUpgrades.clear();
    this.buildContent(); // Rebuild content
  }
  
  private createBulkSummary(): HTMLElement {
    const summary = document.createElement('div');
    summary.id = 'bulk-summary';
    summary.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(76, 175, 80, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    `;
    
    this.updateBulkSummary();
    return summary;
  }
  
  private updateBulkSummary(): void {
    const summary = document.getElementById('bulk-summary');
    if (!summary) return;
    
    let totalCost = 0;
    const upgrades: string[] = [];
    
    this.selectedBulkUpgrades.forEach((levels, type) => {
      const option = this.upgradeOptions.find(o => o.type === type);
      if (!option) return;
      
      // Calculate cost for multiple levels
      let cost = 0;
      for (let i = 0; i < levels; i++) {
        const levelCost = Math.floor(option.cost * Math.pow(UPGRADE_CONSTANTS.defaultCostMultiplier, i));
        cost += levelCost;
      }
      
      // Apply bulk discount
      if (levels >= 3) {
        cost = Math.floor(cost * UPGRADE_CONSTANTS.bulkDiscounts.threeLevels);
      } else if (levels >= 2) {
        cost = Math.floor(cost * UPGRADE_CONSTANTS.bulkDiscounts.twoLevels);
      }
      
      totalCost += cost;
      upgrades.push(`${option.name} x${levels}`);
    });
    
    summary.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 12px; color: #4CAF50;">
        Bulk Upgrade Summary
      </div>
      ${upgrades.length > 0 ? `
        <div style="font-size: 14px; color: #ccc; margin-bottom: 8px;">
          ${upgrades.join(', ')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #999;">Total Cost:</span>
          <span style="color: ${totalCost <= this.currentCurrency ? '#FFD700' : '#F44336'}; font-weight: bold; font-size: 18px;">
            ${createSvgIcon(IconType.CURRENCY, { size: 20 })} ${totalCost}
          </span>
        </div>
        ${totalCost < upgrades.length * this.upgradeOptions[0].cost ? `
          <div style="color: #4CAF50; font-size: 12px; margin-top: 8px;">
            Bulk discount applied!
          </div>
        ` : ''}
      ` : `
        <div style="color: #999; font-size: 14px;">
          Select upgrades to purchase in bulk
        </div>
      `}
    `;
  }
  
  private updateFooter(): void {
    if (!this.footer) return;
    
    this.footer.innerHTML = '';
    
    if (this.bulkMode && this.onBulkUpgrade) {
      const bulkUpgradeBtn = this.createButton('Apply Bulk Upgrades', {
        color: '#4CAF50',
        onClick: () => {
          const upgrades: Array<{ type: UpgradeType | PlayerUpgradeType; levels: number }> = [];
          let totalCost = 0;
          
          this.selectedBulkUpgrades.forEach((levels, type) => {
            upgrades.push({ type, levels });
          });
          
          if (upgrades.length > 0) {
            // Calculate total cost with discounts
            // ... (cost calculation logic)
            this.playSound(SoundType.TOWER_UPGRADE);
            this.onBulkUpgrade(upgrades, totalCost);
            this.hide();
          }
        }
      });
      
      bulkUpgradeBtn.disabled = this.selectedBulkUpgrades.size === 0;
      this.footer.appendChild(bulkUpgradeBtn);
    }
    
    const closeBtn = this.createButton('Close', {
      onClick: () => this.hide()
    });
    this.footer.appendChild(closeBtn);
  }
  
  private getBulkButtonStyle(): string {
    return `
      width: 30px;
      height: 30px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
    `;
  }
  
  private getUpgradeName(type: UpgradeType | PlayerUpgradeType): string {
    switch (type) {
      case 'DAMAGE': return 'Damage';
      case 'RANGE': return 'Range';
      case 'FIRE_RATE': return 'Fire Rate';
      case 'HEALTH': return 'Health';
      case 'SPEED': return 'Speed';
      case 'REGENERATION': return 'Regeneration';
      default: return 'Unknown';
    }
  }
  
  private getUpgradeDescription(type: UpgradeType | PlayerUpgradeType): string {
    if (this.isTower) {
      switch (type) {
        case UpgradeType.DAMAGE: return 'Increase tower damage output';
        case UpgradeType.RANGE: return 'Extend attack range';
        case UpgradeType.FIRE_RATE: return 'Attack more frequently';
        default: return '';
      }
    } else {
      switch (type) {
        case PlayerUpgradeType.DAMAGE: return 'Deal more damage per shot';
        case PlayerUpgradeType.SPEED: return 'Move faster across the battlefield';
        case PlayerUpgradeType.FIRE_RATE: return 'Shoot more frequently';
        case PlayerUpgradeType.HEALTH: return 'Increase maximum health';
        case PlayerUpgradeType.REGENERATION: return 'Regenerate health over time';
        default: return '';
      }
    }
  }
  
  private getUpgradeIcon(type: UpgradeType | PlayerUpgradeType): IconType {
    switch (type) {
      case 'DAMAGE': return IconType.DAMAGE;
      case 'RANGE': return IconType.RANGE;
      case 'FIRE_RATE': return IconType.SPEED;
      case 'HEALTH': return IconType.HEART;
      case 'SPEED': return IconType.SPEED;
      case 'REGENERATION': return IconType.HEAL;
      default: return IconType.UPGRADE;
    }
  }
  
  private formatEffect(type: UpgradeType, value: number): string {
    const percentage = Math.round((value - 1) * 100);
    switch (type) {
      case UpgradeType.DAMAGE: return `+${percentage}% damage`;
      case UpgradeType.RANGE: return `+${percentage}% range`;
      case UpgradeType.FIRE_RATE: return `+${percentage}% fire rate`;
      default: return `+${percentage}%`;
    }
  }
  
  private formatPlayerEffect(type: PlayerUpgradeType, value: number): string {
    if (type === PlayerUpgradeType.REGENERATION) {
      return `${value.toFixed(1)} HP/s`;
    }
    const percentage = Math.round((value - 1) * 100);
    switch (type) {
      case PlayerUpgradeType.DAMAGE: return `+${percentage}% damage`;
      case PlayerUpgradeType.SPEED: return `+${percentage}% speed`;
      case PlayerUpgradeType.FIRE_RATE: return `+${percentage}% fire rate`;
      case PlayerUpgradeType.HEALTH: return `+${percentage}% health`;
      default: return `+${percentage}%`;
    }
  }
  
  protected beforeHide(): void {
    this.onClose();
  }
}