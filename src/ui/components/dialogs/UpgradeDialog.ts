import { BaseDialog } from './BaseDialog';
import { Tower, UpgradeType } from '@/entities/Tower';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';

export interface UpgradeDialogOptions {
  target: Tower | Player;
  currentCurrency: number;
  audioManager?: AudioManager;
  onUpgrade: (type: UpgradeType | PlayerUpgradeType, cost: number) => void;
  onSell?: () => void;
  onClose: () => void;
}

interface UpgradeOption {
  type: UpgradeType | PlayerUpgradeType;
  name: string;
  description: string;
  cost: number;
  currentLevel: number;
  maxLevel: number;
  icon: IconType;
  effect: string;
}

export class UpgradeDialog extends BaseDialog {
  private target: Tower | Player;
  private isTower: boolean;
  private currentCurrency: number;
  private onUpgrade: (type: UpgradeType | PlayerUpgradeType, cost: number) => void;
  private onSell?: () => void;
  private onClose: () => void;
  private upgradeOptions: UpgradeOption[] = [];
  
  constructor(options: UpgradeDialogOptions) {
    const isTower = options.target instanceof Tower;
    super({
      title: isTower ? 'Upgrade Tower' : 'Upgrade Player',
      width: DIALOG_CONFIG.sizes.medium,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'upgrade-dialog'
    });
    
    this.target = options.target;
    this.isTower = isTower;
    this.currentCurrency = options.currentCurrency;
    this.onUpgrade = options.onUpgrade;
    this.onSell = options.onSell;
    this.onClose = options.onClose;
    
    this.setupUpgradeOptions();
    this.buildContent();
  }
  
  private setupUpgradeOptions(): void {
    if (this.isTower) {
      const tower = this.target as Tower;
      this.upgradeOptions = [
        {
          type: UpgradeType.DAMAGE,
          name: 'Damage',
          description: 'Increase tower damage',
          cost: tower.getUpgradeCost(UpgradeType.DAMAGE),
          currentLevel: tower.getUpgradeLevel(UpgradeType.DAMAGE),
          maxLevel: tower.getMaxUpgradeLevel(),
          icon: IconType.DAMAGE,
          effect: `+25% damage`
        },
        {
          type: UpgradeType.RANGE,
          name: 'Range',
          description: 'Increase attack range',
          cost: tower.getUpgradeCost(UpgradeType.RANGE),
          currentLevel: tower.getUpgradeLevel(UpgradeType.RANGE),
          maxLevel: tower.getMaxUpgradeLevel(),
          icon: IconType.RANGE,
          effect: `+20% range`
        },
        {
          type: UpgradeType.FIRE_RATE,
          name: 'Fire Rate',
          description: 'Attack more frequently',
          cost: tower.getUpgradeCost(UpgradeType.FIRE_RATE),
          currentLevel: tower.getUpgradeLevel(UpgradeType.FIRE_RATE),
          maxLevel: tower.getMaxUpgradeLevel(),
          icon: IconType.SPEED,
          effect: `+30% speed`
        }
      ];
    } else {
      const player = this.target as Player;
      this.upgradeOptions = [
        {
          type: PlayerUpgradeType.DAMAGE,
          name: 'Damage',
          description: 'Increase weapon damage',
          cost: player.getUpgradeCost(PlayerUpgradeType.DAMAGE),
          currentLevel: player.getUpgradeLevel(PlayerUpgradeType.DAMAGE),
          maxLevel: player.getMaxUpgradeLevel(),
          icon: IconType.DAMAGE,
          effect: `+20% damage`
        },
        {
          type: PlayerUpgradeType.SPEED,
          name: 'Speed',
          description: 'Move faster',
          cost: player.getUpgradeCost(PlayerUpgradeType.SPEED),
          currentLevel: player.getUpgradeLevel(PlayerUpgradeType.SPEED),
          maxLevel: player.getMaxUpgradeLevel(),
          icon: IconType.SPEED,
          effect: `+15% speed`
        },
        {
          type: PlayerUpgradeType.FIRE_RATE,
          name: 'Fire Rate',
          description: 'Shoot more frequently',
          cost: player.getUpgradeCost(PlayerUpgradeType.FIRE_RATE),
          currentLevel: player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE),
          maxLevel: player.getMaxUpgradeLevel(),
          icon: IconType.RAPID_FIRE,
          effect: `+25% fire rate`
        },
        {
          type: PlayerUpgradeType.HEALTH,
          name: 'Health',
          description: 'Increase max health',
          cost: player.getUpgradeCost(PlayerUpgradeType.HEALTH),
          currentLevel: player.getUpgradeLevel(PlayerUpgradeType.HEALTH),
          maxLevel: player.getMaxUpgradeLevel(),
          icon: IconType.HEART,
          effect: `+30 HP`
        }
      ];
    }
  }
  
  protected buildContent(): void {
    // Currency display
    const currencyDisplay = document.createElement('div');
    currencyDisplay.style.cssText = `
      text-align: center;
      margin-bottom: 20px;
      padding: 12px;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 215, 0, 0.3);
    `;
    
    const currencyIcon = createSvgIcon(IconType.CURRENCY, { size: 24 });
    currencyDisplay.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        ${currencyIcon}
        <span style="font-size: clamp(18px, 4.5vw, 22px); font-weight: bold; color: #FFD700;">
          ${this.currentCurrency}
        </span>
        <span style="color: #ccc; font-size: clamp(14px, 3.5vw, 16px);">
          Available
        </span>
      </div>
    `;
    
    this.content.appendChild(currencyDisplay);
    
    // Current stats
    if (this.isTower) {
      const tower = this.target as Tower;
      const statsDisplay = document.createElement('div');
      statsDisplay.style.cssText = `
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 20px;
        text-align: center;
      `;
      
      const towerIcon = createSvgIcon(this.getTowerIcon(tower.type), { size: 32 });
      statsDisplay.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          ${towerIcon}
          <div>
            <div style="font-weight: bold; color: #4CAF50; font-size: clamp(16px, 4vw, 18px);">
              ${tower.type} Tower
            </div>
            <div style="color: #ccc; font-size: clamp(12px, 3vw, 14px);">
              Level ${tower.getLevel()}
            </div>
          </div>
        </div>
      `;
      
      this.content.appendChild(statsDisplay);
    }
    
    // Upgrade options
    const upgradesContainer = document.createElement('div');
    upgradesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
      max-height: clamp(200px, 40vh, 300px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;
    
    this.upgradeOptions.forEach(option => {
      const upgradeCard = this.createUpgradeCard(option);
      upgradesContainer.appendChild(upgradeCard);
    });
    
    this.content.appendChild(upgradesContainer);
    
    // Footer buttons
    this.createFooter();
    const footer = this.footer!;
    
    if (this.isTower && this.onSell) {
      const sellButton = this.createButton('Sell', {
        icon: IconType.CURRENCY,
        color: '#FF9800',
        onClick: () => {
          this.hide();
          this.onSell!();
        }
      });
      
      const tower = this.target as Tower;
      const sellValue = tower.getSellValue();
      sellButton.innerHTML = `${createSvgIcon(IconType.CURRENCY, { size: 20 })}<span>Sell (${sellValue}g)</span>`;
      
      footer.appendChild(sellButton);
    }
    
    const closeButton = this.createButton('Close', {
      icon: IconType.CLOSE,
      onClick: () => {
        this.hide();
        this.onClose();
      }
    });
    
    footer.appendChild(closeButton);
  }
  
  private createUpgradeCard(option: UpgradeOption): HTMLElement {
    const canAfford = this.currentCurrency >= option.cost && option.currentLevel < option.maxLevel;
    const isMaxed = option.currentLevel >= option.maxLevel;
    
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid ${isMaxed ? 'rgba(255, 215, 0, 0.5)' : 'rgba(76, 175, 80, 0.5)'};
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: ${canAfford && !isMaxed ? 'pointer' : 'not-allowed'};
      opacity: ${!isMaxed ? '1' : '0.7'};
      transition: all 0.2s ease;
    `;
    
    // Icon
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 8px;
    `;
    iconContainer.innerHTML = createSvgIcon(option.icon, { size: 32 });
    card.appendChild(iconContainer);
    
    // Info
    const infoContainer = document.createElement('div');
    infoContainer.style.cssText = `
      flex: 1;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    `;
    
    const name = document.createElement('span');
    name.style.cssText = `
      font-weight: bold;
      color: ${isMaxed ? '#FFD700' : '#4CAF50'};
      font-size: clamp(14px, 3.5vw, 16px);
    `;
    name.textContent = option.name;
    
    const level = document.createElement('span');
    level.style.cssText = `
      color: #ccc;
      font-size: clamp(12px, 3vw, 14px);
    `;
    level.textContent = isMaxed ? 'MAX' : `${option.currentLevel}/${option.maxLevel}`;
    
    header.appendChild(name);
    header.appendChild(level);
    infoContainer.appendChild(header);
    
    const description = document.createElement('div');
    description.style.cssText = `
      color: #999;
      font-size: clamp(11px, 2.8vw, 13px);
      margin-bottom: 8px;
    `;
    description.textContent = option.description;
    infoContainer.appendChild(description);
    
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const effect = document.createElement('span');
    effect.style.cssText = `
      color: #4CAF50;
      font-size: clamp(12px, 3vw, 14px);
      font-weight: bold;
    `;
    effect.textContent = option.effect;
    
    const cost = document.createElement('span');
    cost.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      color: ${canAfford ? '#FFD700' : '#999'};
      font-size: clamp(12px, 3vw, 14px);
    `;
    
    if (!isMaxed) {
      const costIcon = createSvgIcon(IconType.CURRENCY, { size: 16 });
      cost.innerHTML = `${costIcon}<span>${option.cost}</span>`;
    }
    
    footer.appendChild(effect);
    footer.appendChild(cost);
    infoContainer.appendChild(footer);
    
    card.appendChild(infoContainer);
    
    // Click handler
    if (canAfford && !isMaxed) {
      card.addEventListener('mouseenter', () => {
        card.style.background = 'rgba(255, 255, 255, 0.08)';
        card.style.transform = 'translateX(4px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.transform = 'translateX(0)';
      });
      
      card.addEventListener('click', () => {
        this.playSound(SoundType.TOWER_UPGRADE);
        this.onUpgrade(option.type, option.cost);
        this.hide();
      });
    }
    
    return card;
  }
  
  private getTowerIcon(type: string): IconType {
    switch (type) {
      case 'BASIC': return IconType.BASIC_TOWER;
      case 'SNIPER': return IconType.SNIPER_TOWER;
      case 'RAPID': return IconType.RAPID_TOWER;
      case 'WALL': return IconType.WALL;
      default: return IconType.TOWER;
    }
  }
  
  protected beforeHide(): void {
    this.onClose();
  }
}