import { BaseDialog } from './BaseDialog';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { COLOR_THEME } from '@/config/ColorTheme';

export interface UpgradeDialogOptions {
  target: Player;
  currentCurrency: number;
  audioManager?: AudioManager;
  onUpgrade: (type: PlayerUpgradeType, cost: number) => void;
  onClose: () => void;
}

interface UpgradeOption {
  type: PlayerUpgradeType;
  name: string;
  description: string;
  cost: number;
  currentLevel: number;
  maxLevel: number;
  icon: IconType;
  effect: string;
}

export class UpgradeDialog extends BaseDialog {
  private target: Player;
  private currentCurrency: number;
  private onUpgrade: (type: PlayerUpgradeType, cost: number) => void;
  private onClose: () => void;
  private upgradeOptions: UpgradeOption[] = [];
  private bulkAmount: number | 'MAX' = 1;
  private currencyDisplay: HTMLElement | null = null;

  constructor(options: UpgradeDialogOptions) {
    super({
      title: 'Upgrade Player',
      width: DIALOG_CONFIG.sizes.medium,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'upgrade-dialog'
    });

    this.target = options.target;
    this.currentCurrency = options.currentCurrency;
    this.onUpgrade = options.onUpgrade;
    this.onClose = options.onClose;

    this.setupUpgradeOptions();
    this.buildContent();
  }

  private setupUpgradeOptions(): void {
    const player = this.target;
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

  protected buildContent(): void {
    this.content.innerHTML = '';
    if (this.footer) {
      this.footer.innerHTML = '';
    }

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

    this.currencyDisplay = currencyDisplay;
    this.content.appendChild(currencyDisplay);

    const bulkSelector = this.createBulkSelector();
    this.content.appendChild(bulkSelector);

    const upgradesContainer = document.createElement('div');
    upgradesContainer.className = 'upgrades-container';
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

    if (!this.footer) {
      this.createFooter();
    }
    const footer = this.footer!;

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
    const bulkCost = this.calculateBulkCost(option);
    const canAfford = this.currentCurrency >= bulkCost && option.currentLevel < option.maxLevel;
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
    level.textContent = isMaxed ? 'MAX' : `Lvl ${option.currentLevel}/${option.maxLevel}`;

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
      const totalCost = this.calculateBulkCost(option);
      const levels = this.calculateBulkLevels(option);
      if (levels > 1) {
        cost.innerHTML = `${costIcon}<span>${totalCost} (x${levels})</span>`;
      } else {
        cost.innerHTML = `${costIcon}<span>${totalCost}</span>`;
      }
    }

    footer.appendChild(effect);
    footer.appendChild(cost);
    infoContainer.appendChild(footer);

    card.appendChild(infoContainer);

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
        const levels = this.calculateBulkLevels(option);
        const totalCost = this.calculateBulkCost(option);

        if (this.currentCurrency >= totalCost) {
          this.playSound(SoundType.TOWER_UPGRADE);

          for (let i = 0; i < levels; i++) {
            this.onUpgrade(option.type, Math.floor(option.cost * Math.pow(1.08, option.currentLevel + i)));
          }
        }
      });
    }

    return card;
  }

  protected override beforeHide(): void {
    this.onClose();
  }

  private createBulkSelector(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    `;

    const label = document.createElement('span');
    label.style.cssText = `
      color: #ccc;
      font-size: 14px;
    `;
    label.textContent = 'Upgrade:';
    container.appendChild(label);

    const increments = [1, 5, 10, 25, 'MAX'] as const;
    increments.forEach(increment => {
      const button = document.createElement('button');
      button.style.cssText = `
        padding: 6px 12px;
        background: ${this.bulkAmount === increment ? COLOR_THEME.ui.button.primary : 'rgba(255, 255, 255, 0.1)'};
        border: 1px solid ${this.bulkAmount === increment ? COLOR_THEME.ui.text.success : 'rgba(255, 255, 255, 0.2)'};
        border-radius: 4px;
        color: white;
        font-weight: ${this.bulkAmount === increment ? 'bold' : 'normal'};
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      button.textContent = increment === 'MAX' ? 'MAX' : `x${increment}`;

      button.addEventListener('click', () => {
        this.bulkAmount = increment;
        this.setupUpgradeOptions();
        this.updateUpgradeCards();
        container.querySelectorAll('button').forEach(btn => {
          const isSelected = btn.textContent === (increment === 'MAX' ? 'MAX' : `x${increment}`);
          btn.style.background = isSelected ? COLOR_THEME.ui.button.primary : 'rgba(255, 255, 255, 0.1)';
          btn.style.border = `1px solid ${isSelected ? COLOR_THEME.ui.text.success : 'rgba(255, 255, 255, 0.2)'}`;
          btn.style.fontWeight = isSelected ? 'bold' : 'normal';
        });
      });

      container.appendChild(button);
    });

    return container;
  }

  private calculateBulkLevels(option: UpgradeOption): number {
    if (this.bulkAmount === 'MAX') {
      return option.maxLevel - option.currentLevel;
    }
    return Math.min(this.bulkAmount, option.maxLevel - option.currentLevel);
  }

  private calculateBulkCost(option: UpgradeOption): number {
    const levels = this.calculateBulkLevels(option);
    if (levels === 0) return 0;

    let totalCost = 0;
    let currentLevel = option.currentLevel;

    for (let i = 0; i < levels; i++) {
      totalCost += Math.floor(option.cost * Math.pow(1.08, currentLevel));
      currentLevel++;
    }

    if (levels >= 20) {
      totalCost *= 0.85;
    } else if (levels >= 10) {
      totalCost *= 0.90;
    } else if (levels >= 5) {
      totalCost *= 0.95;
    }

    return Math.floor(totalCost);
  }

  public updateCurrency(newCurrency: number): void {
    this.currentCurrency = newCurrency;

    if (this.currencyDisplay) {
      const currencyIcon = createSvgIcon(IconType.CURRENCY, { size: 24 });
      this.currencyDisplay.innerHTML = `
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
    }

    this.setupUpgradeOptions();
    this.updateUpgradeCards();
  }

  private updateUpgradeCards(): void {
    const upgradesContainer = this.content.querySelector('.upgrades-container') as HTMLElement;
    if (!upgradesContainer) {
      this.buildContent();
      return;
    }

    upgradesContainer.innerHTML = '';
    this.upgradeOptions.forEach(option => {
      const upgradeCard = this.createUpgradeCard(option);
      upgradesContainer.appendChild(upgradeCard);
    });
  }
}