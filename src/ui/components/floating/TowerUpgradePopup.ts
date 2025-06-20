/**
 * TowerUpgradePopup.ts - Interactive popup for tower upgrades
 * Changes:
 * 1. Initial implementation with upgrade options display
 * 2. Cost validation and purchase handling
 * 3. Upgrade preview information
 * 4. Visual feedback for affordable/unaffordable upgrades
 * 5. Added bulk upgrade functionality from UpgradeDialog - bulk selector, upgrade cards, cost calculations
 */

import { InteractiveEntityPopup, type InteractiveEntityPopupOptions } from './InteractiveEntityPopup';
import type { Tower } from '@/entities/Tower';
import { UpgradeType, TowerType } from '@/entities/Tower';
import type { Camera } from '@/systems/Camera';
import type { Game } from '@/core/Game';
import { COLOR_THEME } from '@/config/ColorTheme';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { formatNumber } from '@/utils/formatters';

export interface TowerUpgradePopupOptions extends InteractiveEntityPopupOptions {
  game: Game;
  onUpgrade?: (tower: Tower) => void;
  onSell?: (tower: Tower) => void;
}

interface UpgradeOption {
  type: UpgradeType;
  name: string;
  description: string;
  cost: number;
  currentLevel: number;
  maxLevel: number;
  icon: IconType;
  effect: string;
}

export class TowerUpgradePopup extends InteractiveEntityPopup {
  private static activePopup: TowerUpgradePopup | null = null; // Singleton pattern

  private tower: Tower;
  private game: Game;
  private upgradeOptions: Required<TowerUpgradePopupOptions>;
  private contentContainer?: HTMLElement;
  private sellButton?: HTMLElement;
  private bulkAmount: number | 'MAX' = 1;
  private upgradeOptionsList: UpgradeOption[] = [];
  private currencyDisplay?: HTMLElement;
  private sellButtonEnabled: boolean = false; // Track sell button state
  private cleanupTimeouts: number[] = []; // Track timeouts for cleanup

  constructor(
    tower: Tower,
    camera: Camera,
    options: TowerUpgradePopupOptions
  ) {
    // Destroy any existing popup before creating new one
    if (TowerUpgradePopup.activePopup) {
      console.log('[TowerUpgradePopup] Destroying existing popup instance');
      TowerUpgradePopup.activePopup.forceDestroy();
    }

    const defaults = {
      anchor: 'top' as const,
      offset: { x: 0, y: -20 },
      className: 'tower-upgrade-popup',
      closeOnClickOutside: true, // Re-enabled with better timing
      closeOnEscape: true,
      fadeIn: true,
      fadeOut: true,
      onUpgrade: () => { },
      onSell: () => { }
    };

    super(tower, camera, { ...defaults, ...options });

    this.tower = tower;
    this.game = options.game;
    this.upgradeOptions = this.interactiveOptions as Required<TowerUpgradePopupOptions>;

    // Register this as the active popup
    TowerUpgradePopup.activePopup = this;

    this.setupUpgradeOptions();
    this.buildActualContent();
  }

  protected buildContent(): void {
    if (!this.tower) return;
    this.buildActualContent();
  }

  private setupUpgradeOptions(): void {
    this.upgradeOptionsList = [
      {
        type: UpgradeType.DAMAGE,
        name: 'Damage',
        description: 'Increase tower damage',
        cost: this.tower.getUpgradeCost(UpgradeType.DAMAGE),
        currentLevel: this.tower.getUpgradeLevel(UpgradeType.DAMAGE),
        maxLevel: this.tower.getMaxUpgradeLevel(),
        icon: IconType.DAMAGE,
        effect: '+25% damage'
      },
      {
        type: UpgradeType.RANGE,
        name: 'Range',
        description: 'Increase attack range',
        cost: this.tower.getUpgradeCost(UpgradeType.RANGE),
        currentLevel: this.tower.getUpgradeLevel(UpgradeType.RANGE),
        maxLevel: this.tower.getMaxUpgradeLevel(),
        icon: IconType.RANGE,
        effect: '+20% range'
      },
      {
        type: UpgradeType.FIRE_RATE,
        name: 'Fire Rate',
        description: 'Attack more frequently',
        cost: this.tower.getUpgradeCost(UpgradeType.FIRE_RATE),
        currentLevel: this.tower.getUpgradeLevel(UpgradeType.FIRE_RATE),
        maxLevel: this.tower.getMaxUpgradeLevel(),
        icon: IconType.SPEED,
        effect: '+30% speed'
      }
    ];
  }

  private buildActualContent(): void {
    console.log(`[TowerUpgradePopup] Building content for ${this.tower.towerType} tower`);

    this.element.style.cssText += `
      background: ${COLOR_THEME.ui.background.secondary}f0;
      border: 2px solid ${COLOR_THEME.ui.border.default};
      border-radius: 8px;
      padding: 16px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 9999 !important;
      position: fixed !important;
      pointer-events: auto !important;
      opacity: 1 !important;
      visibility: visible !important;
    `;

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'tower-upgrade-content';
    this.element.appendChild(this.contentContainer);

    this.updateContent();

    // Debug logging
    console.log(`[TowerUpgradePopup] Element styles:`, {
      position: this.element.style.position,
      zIndex: this.element.style.zIndex,
      opacity: this.element.style.opacity,
      visibility: this.element.style.visibility,
      display: this.element.style.display,
      transform: this.element.style.transform,
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
      inDOM: document.body.contains(this.element)
    });
  }

  private updateContent(): void {
    if (!this.contentContainer) return;
    this.contentContainer.innerHTML = '';

    this.createHeader();
    this.createCurrencyDisplay();
    this.createCurrentStats();
    this.createBulkSelector();

    if (this.hasAvailableUpgrades()) {
      this.createUpgradeCards();
    }

    this.createActionButtons();

    requestAnimationFrame(() => this.updatePosition());
  }

  private createHeader(): void {
    const header = document.createElement('div');
    header.className = 'tower-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${COLOR_THEME.ui.border.default}44;
    `;

    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      width: 32px;
      height: 32px;
      color: ${this.getTowerColor()};
    `;
    iconContainer.innerHTML = createSvgIcon(this.getTowerIcon(), { size: 32 });
    header.appendChild(iconContainer);

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = 'flex: 1;';

    const name = document.createElement('div');
    name.style.cssText = `
      font-weight: bold;
      font-size: 16px;
      color: ${COLOR_THEME.ui.text.primary};
    `;
    name.textContent = this.getTowerName();
    titleContainer.appendChild(name);

    const level = document.createElement('div');
    level.style.cssText = `
      font-size: 12px;
      color: ${COLOR_THEME.ui.text.secondary};
    `;
    level.textContent = `Level ${this.tower.getLevel()}`;
    titleContainer.appendChild(level);

    header.appendChild(titleContainer);

    const sellValue = document.createElement('div');
    sellValue.style.cssText = `
      font-size: 12px;
      color: ${COLOR_THEME.ui.currency};
      text-align: right;
    `;
    sellValue.innerHTML = `${createSvgIcon(IconType.COINS, { size: 12 })} ${formatNumber(this.tower.getSellValue())}`;
    header.appendChild(sellValue);

    this.contentContainer!.appendChild(header);
  }

  private createCurrencyDisplay(): void {
    this.currencyDisplay = document.createElement('div');
    this.currencyDisplay.style.cssText = `
      text-align: center;
      margin-bottom: 16px;
      padding: 10px;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(255, 215, 0, 0.3);
    `;

    const currencyIcon = createSvgIcon(IconType.COINS, { size: 20 });
    this.currencyDisplay.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        ${currencyIcon}
        <span style="font-size: 18px; font-weight: bold; color: #FFD700;">
          ${formatNumber(this.game.getCurrency())}
        </span>
        <span style="color: #ccc; font-size: 14px;">Available</span>
      </div>
    `;

    this.contentContainer!.appendChild(this.currencyDisplay);
  }

  private createCurrentStats(): void {
    const statsContainer = document.createElement('div');
    statsContainer.className = 'current-stats';
    statsContainer.style.cssText = `
      margin-bottom: 16px;
      padding: 10px;
      background: ${COLOR_THEME.ui.background.primary}66;
      border-radius: 6px;
    `;

    const stats = [
      { label: 'Damage', value: this.tower.damage, icon: IconType.DAMAGE },
      { label: 'Range', value: this.tower.range, icon: IconType.RANGE },
      { label: 'Fire Rate', value: `${(1000 / this.tower.fireRate).toFixed(1)}/s`, icon: IconType.SPEED }
    ];

    stats.forEach((stat, index) => {
      const statRow = document.createElement('div');
      statRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        ${index < stats.length - 1 ? 'margin-bottom: 6px;' : ''}
      `;

      const iconEl = document.createElement('span');
      iconEl.style.cssText = `
        width: 16px;
        height: 16px;
        color: ${COLOR_THEME.ui.text.secondary};
      `;
      iconEl.innerHTML = createSvgIcon(stat.icon, { size: 16 });
      statRow.appendChild(iconEl);

      const label = document.createElement('span');
      label.style.cssText = `
        font-size: 12px;
        color: ${COLOR_THEME.ui.text.secondary};
        flex: 1;
      `;
      label.textContent = stat.label;
      statRow.appendChild(label);

      const value = document.createElement('span');
      value.style.cssText = `
        font-size: 13px;
        font-weight: bold;
        color: ${COLOR_THEME.ui.text.primary};
      `;
      value.textContent = stat.value.toString();
      statRow.appendChild(value);

      statsContainer.appendChild(statRow);
    });

    this.contentContainer!.appendChild(statsContainer);
  }

  private createBulkSelector(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 16px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    `;

    const label = document.createElement('span');
    label.style.cssText = `
      color: #ccc;
      font-size: 12px;
      font-weight: bold;
    `;
    label.textContent = 'Upgrade:';
    container.appendChild(label);

    const increments = [1, 5, 10, 25, 'MAX'] as const;
    increments.forEach(increment => {
      const button = document.createElement('button');
      button.style.cssText = `
        padding: 4px 8px;
        background: ${this.bulkAmount === increment ? COLOR_THEME.ui.button.primary : 'rgba(255, 255, 255, 0.1)'};
        border: 1px solid ${this.bulkAmount === increment ? COLOR_THEME.ui.text.success : 'rgba(255, 255, 255, 0.2)'};
        border-radius: 4px;
        color: white;
        font-size: 11px;
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

    this.contentContainer!.appendChild(container);
    return container;
  }

  private hasAvailableUpgrades(): boolean {
    return this.upgradeOptionsList.some(option => option.currentLevel < option.maxLevel);
  }

  private createUpgradeCards(): void {
    const upgradesContainer = document.createElement('div');
    upgradesContainer.className = 'upgrades-container';
    upgradesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      max-height: 240px;
      overflow-y: auto;
    `;

    this.upgradeOptionsList.forEach(option => {
      const upgradeCard = this.createUpgradeCard(option);
      upgradesContainer.appendChild(upgradeCard);
    });

    this.contentContainer!.appendChild(upgradesContainer);
  }

  private createUpgradeCard(option: UpgradeOption): HTMLElement {
    const bulkCost = this.calculateBulkCost(option);
    const canAfford = this.game.getCurrency() >= bulkCost && option.currentLevel < option.maxLevel;
    const isMaxed = option.currentLevel >= option.maxLevel;

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid ${isMaxed ? 'rgba(255, 215, 0, 0.5)' : 'rgba(76, 175, 80, 0.5)'};
      border-radius: 6px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: ${canAfford && !isMaxed ? 'pointer' : 'not-allowed'};
      opacity: ${!isMaxed ? '1' : '0.7'};
      transition: all 0.2s ease;
    `;

    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 6px;
    `;
    iconContainer.innerHTML = createSvgIcon(option.icon, { size: 24 });
    card.appendChild(iconContainer);

    const infoContainer = document.createElement('div');
    infoContainer.style.cssText = 'flex: 1;';

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
      font-size: 14px;
    `;
    name.textContent = option.name;

    const level = document.createElement('span');
    level.style.cssText = `
      color: #ccc;
      font-size: 11px;
    `;
    level.textContent = isMaxed ? 'MAX' : `Lvl ${option.currentLevel}/${option.maxLevel}`;

    header.appendChild(name);
    header.appendChild(level);
    infoContainer.appendChild(header);

    const description = document.createElement('div');
    description.style.cssText = `
      color: #999;
      font-size: 11px;
      margin-bottom: 6px;
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
      font-size: 11px;
      font-weight: bold;
    `;
    effect.textContent = option.effect;

    const cost = document.createElement('span');
    cost.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      color: ${canAfford ? '#FFD700' : '#999'};
      font-size: 11px;
    `;

    if (!isMaxed) {
      const costIcon = createSvgIcon(IconType.COINS, { size: 12 });
      const totalCost = this.calculateBulkCost(option);
      const levels = this.calculateBulkLevels(option);
      if (levels > 1) {
        cost.innerHTML = `${costIcon}<span>${formatNumber(totalCost)} (x${levels})</span>`;
      } else {
        cost.innerHTML = `${costIcon}<span>${formatNumber(totalCost)}</span>`;
      }
    }

    footer.appendChild(effect);
    footer.appendChild(cost);
    infoContainer.appendChild(footer);
    card.appendChild(infoContainer);

    if (canAfford && !isMaxed) {
      card.addEventListener('mouseenter', () => {
        card.style.background = 'rgba(255, 255, 255, 0.08)';
        card.style.transform = 'translateX(2px)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.transform = 'translateX(0)';
      });

      card.addEventListener('click', () => {
        this.handleBulkUpgrade(option);
      });
    }

    return card;
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

  private handleBulkUpgrade(option: UpgradeOption): void {
    const levels = this.calculateBulkLevels(option);
    const totalCost = this.calculateBulkCost(option);

    if (this.game.getCurrency() >= totalCost) {
      for (let i = 0; i < levels; i++) {
        // const levelCost = Math.floor(option.cost * Math.pow(1.08, option.currentLevel + i));
        if (this.game.upgradeTower(this.tower, option.type)) {
          this.upgradeOptions.onUpgrade(this.tower);
        }
      }
      this.setupUpgradeOptions();
      this.updateContent();
    }
  }

  private updateUpgradeCards(): void {
    const upgradesContainer = this.contentContainer?.querySelector('.upgrades-container') as HTMLElement;
    if (!upgradesContainer) {
      this.updateContent();
      return;
    }

    upgradesContainer.innerHTML = '';
    this.upgradeOptionsList.forEach(option => {
      const upgradeCard = this.createUpgradeCard(option);
      upgradesContainer.appendChild(upgradeCard);
    });
  }

  private createActionButtons(): void {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'action-buttons';
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
    `;

    this.sellButton = this.createButton('Sell', () => {
      if (this.sellButtonEnabled) {
        this.handleSell();
      } else {
        console.log('[TowerUpgradePopup] Sell button clicked but disabled');
      }
    }, {
      className: 'sell-button'
    });

    // Apply initial disabled styles
    this.updateSellButtonStyles();

    buttonContainer.appendChild(this.sellButton);
    this.contentContainer!.appendChild(buttonContainer);
  }

  private updateSellButtonStyles(): void {
    if (!this.sellButton) return;

    // Ensure the button is never actually disabled at DOM level
    (this.sellButton as HTMLButtonElement).disabled = false;

    this.sellButton.style.cssText += `
      flex: 1;
      background: ${this.sellButtonEnabled ? COLOR_THEME.ui.background.secondary : 'rgba(100, 100, 100, 0.5)'}88;
      border-color: ${this.sellButtonEnabled ? COLOR_THEME.ui.text.danger : 'rgba(150, 150, 150, 0.5)'}66;
      color: ${this.sellButtonEnabled ? COLOR_THEME.ui.text.danger : 'rgba(150, 150, 150, 0.8)'};
      cursor: ${this.sellButtonEnabled ? 'pointer' : 'not-allowed'};
      opacity: ${this.sellButtonEnabled ? '1' : '0.6'};
      transition: all 0.2s ease;
    `;
  }

  private handleSell(): void {
    console.log('[TowerUpgradePopup] Handling sell');

    if (this.game.sellTower(this.tower)) {
      console.log('[TowerUpgradePopup] Tower sold successfully, calling callbacks and closing');

      // Call the onSell callback
      this.upgradeOptions.onSell(this.tower);

      // Close the popup immediately
      this.hide();

      // Also destroy to ensure cleanup
      setTimeout(() => {
        if (!this.destroyed) {
          this.destroy();
        }
      }, 100);
    } else {
      console.log('[TowerUpgradePopup] Failed to sell tower');
    }
  }

  private getTowerName(): string {
    switch (this.tower.towerType) {
      case TowerType.BASIC: return 'Basic Tower';
      case TowerType.SNIPER: return 'Sniper Tower';
      case TowerType.RAPID: return 'Rapid Tower';
      case TowerType.WALL: return 'Wall';
      default: return 'Tower';
    }
  }

  private getTowerIcon(): IconType {
    switch (this.tower.towerType) {
      case TowerType.BASIC: return IconType.BASIC_TOWER;
      case TowerType.SNIPER: return IconType.SNIPER_TOWER;
      case TowerType.RAPID: return IconType.RAPID_TOWER;
      case TowerType.WALL: return IconType.WALL;
      default: return IconType.TOWER;
    }
  }

  private getTowerColor(): string {
    switch (this.tower.towerType) {
      case TowerType.BASIC: return COLOR_THEME.towers.basic;
      case TowerType.SNIPER: return COLOR_THEME.towers.frost;
      case TowerType.RAPID: return COLOR_THEME.towers.artillery;
      case TowerType.WALL: return COLOR_THEME.towers.wall;
      default: return COLOR_THEME.ui.text.primary;
    }
  }

  public updateState(): void {
    this.setupUpgradeOptions();
    this.updateContent();
  }

  public override show(): void {
    console.log(`[TowerUpgradePopup] Show method called`);

    // Check if another popup is already active
    if (TowerUpgradePopup.activePopup && TowerUpgradePopup.activePopup !== this) {
      console.log(`[TowerUpgradePopup] Another popup is active, destroying it first`);
      TowerUpgradePopup.activePopup.forceDestroy();
    }

    // Register this as the active popup
    TowerUpgradePopup.activePopup = this;

    // Reset sell button state for each opening
    this.sellButtonEnabled = false;

    // Call parent show first
    super.show();

    // Enable sell button after 1 second
    const sellButtonTimeout = setTimeout(() => {
      if (!this.destroyed && TowerUpgradePopup.activePopup === this) {
        this.sellButtonEnabled = true;
        this.updateSellButtonStyles();
        console.log('[TowerUpgradePopup] Sell button enabled');
      }
    }, 1000);
    this.cleanupTimeouts.push(sellButtonTimeout);

    // Ensure proper styling and positioning
    requestAnimationFrame(() => {
      if (this.element && !this.destroyed && TowerUpgradePopup.activePopup === this) {
        // Force the popup to a visible location (remove this later for proper positioning)
        this.element.style.position = 'fixed';
        this.element.style.top = '50px';
        this.element.style.left = '50px';
        this.element.style.zIndex = '99999';
        this.element.style.pointerEvents = 'auto';
        this.element.style.opacity = '1';
        this.element.style.visibility = 'visible';
        this.element.style.display = 'block';
        this.element.style.transform = 'none';

        // Add a bright border for visibility (remove this later)
        this.element.style.border = '3px solid red';
        this.element.style.background = 'rgba(0, 0, 0, 0.9)';
        this.element.style.minWidth = '300px';
        this.element.style.minHeight = '200px';

        // Only prevent propagation on the popup content, not globally
        this.element.addEventListener('click', (e) => {
          // Stop clicks inside the popup from propagating to close handlers
          e.stopPropagation();
        }, { once: false });

        console.log(`[TowerUpgradePopup] Popup configured and visible`);
      }
    });
  }

  protected override handleClose(): void {
    console.log(`[TowerUpgradePopup] Popup closing`);

    // Call the onClose callback if provided
    if (this.interactiveOptions.onClose) {
      this.interactiveOptions.onClose();
    }

    // Hide the popup
    this.hide();
  }

  public override hide(): void {
    console.log(`[TowerUpgradePopup] Popup hiding`);

    // Clean up timeouts when hiding
    this.cleanupTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.cleanupTimeouts = [];

    super.hide();
  }

  public override destroy(): void {
    console.log(`[TowerUpgradePopup] Popup destroying`);

    // Clean up all timeouts
    this.cleanupTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.cleanupTimeouts = [];

    // Reset sell button state
    this.sellButtonEnabled = false;

    // Clear static reference if this is the active popup
    if (TowerUpgradePopup.activePopup === this) {
      TowerUpgradePopup.activePopup = null;
    }

    super.destroy();
  }

  public forceDestroy(): void {
    console.log(`[TowerUpgradePopup] Force destroying popup`);

    // Immediately clear static reference
    TowerUpgradePopup.activePopup = null;

    // Clean up all timeouts immediately
    this.cleanupTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.cleanupTimeouts = [];

    // Force hide immediately without animations
    if (this.element && this.element.parentNode) {
      this.element.style.display = 'none';
      this.element.parentNode.removeChild(this.element);
    }

    // Mark as destroyed
    this.destroyed = true;
    this.visible = false;
  }

  public static create(
    tower: Tower,
    camera: Camera,
    game: Game,
    options?: Partial<TowerUpgradePopupOptions>
  ): TowerUpgradePopup {
    // Clean up any existing popup first
    TowerUpgradePopup.destroyActivePopup();

    return new TowerUpgradePopup(tower, camera, {
      game,
      ...options
    });
  }

  public static destroyActivePopup(): void {
    if (TowerUpgradePopup.activePopup) {
      console.log('[TowerUpgradePopup] Destroying active popup via static method');
      TowerUpgradePopup.activePopup.forceDestroy();
      TowerUpgradePopup.activePopup = null;
    }
  }

  public static getActivePopup(): TowerUpgradePopup | null {
    return TowerUpgradePopup.activePopup;
  }

  public static hasActivePopup(): boolean {
    return TowerUpgradePopup.activePopup !== null;
  }
}