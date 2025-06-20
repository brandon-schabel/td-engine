/**
 * TowerUpgradeUI.ts - Tower upgrade interface using FloatingUIManager
 * Recent changes:
 * 1. Initial implementation replacing TowerUpgradePopup
 * 2. Uses FloatingUIManager for positioning and lifecycle
 * 3. Implements bulk upgrade functionality
 * 4. Singleton pattern for single active UI
 * 5. Mobile-responsive with proper touch support
 */

import type { Tower } from '@/entities/Tower';
import { UpgradeType, TowerType } from '@/entities/Tower';
import type { Game } from '@/core/Game';
import type { FloatingUIManager } from './FloatingUIManager';
import type { FloatingUIElement } from './FloatingUIElement';
import { COLOR_THEME } from '@/config/ColorTheme';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { formatNumber } from '@/utils/formatters';

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

export class TowerUpgradeUI {
  private static activeUI: TowerUpgradeUI | null = null;

  private tower: Tower;
  private game: Game;
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private bulkAmount: number | 'MAX' = 1;
  private upgradeOptions: UpgradeOption[] = [];
  private sellButtonEnabled: boolean = false;
  private sellButtonTimeout: number | null = null;
  private isDestroyed: boolean = false;
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

  constructor(tower: Tower, game: Game) {
    // Destroy any existing UI
    if (TowerUpgradeUI.activeUI) {
      TowerUpgradeUI.activeUI.destroy();
    }

    this.tower = tower;
    this.game = game;
    this.floatingUI = game.getFloatingUIManager();

    this.setupUpgradeOptions();
    this.create();

    // Register as active UI
    TowerUpgradeUI.activeUI = this;
  }

  private setupUpgradeOptions(): void {
    this.upgradeOptions = [
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

  private create(): void {
    const elementId = `tower-upgrade-${this.tower.id}`;
    
    this.element = this.floatingUI.create(elementId, 'custom', {
      offset: { x: 0, y: -30 },
      anchor: 'top',
      smoothing: 0.1,
      autoHide: false,
      persistent: true,
      zIndex: 1000,
      className: 'tower-upgrade-ui'
    });

    this.element.setTarget(this.tower);
    this.updateContent();
    this.element.enable();

    // Prevent clicks on the UI from propagating to the canvas
    this.setupClickHandling();

    // Enable sell button after 1 second
    this.sellButtonTimeout = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.sellButtonEnabled = true;
        this.updateSellButton();
      }
    }, 1000);

    // Handle escape key
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  private handleEscapeKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && !this.isDestroyed) {
      this.game.deselectTower();
    }
  }

  private setupClickHandling(): void {
    if (!this.element || this.isDestroyed) return;
    
    const element = this.element.getElement();
    
    // Prevent all mouse events from propagating to the canvas
    const stopPropagation = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };
    
    // Remove existing handlers if any
    element.removeEventListener('mousedown', stopPropagation, true);
    element.removeEventListener('mouseup', stopPropagation, true);
    element.removeEventListener('click', stopPropagation, true);
    
    // Add handlers to stop propagation
    element.addEventListener('mousedown', stopPropagation, true);
    element.addEventListener('mouseup', stopPropagation, true);
    element.addEventListener('click', stopPropagation, true);
    
    // Store handlers for cleanup
    (element as any).__stopPropagation = stopPropagation;
    
    // Handle click outside to close
    if (!this.clickOutsideHandler) {
      this.clickOutsideHandler = (e: MouseEvent) => {
        if (!element.contains(e.target as Node)) {
          this.game.deselectTower();
        }
      };
      
      // Add with slight delay to avoid immediate trigger
      setTimeout(() => {
        if (!this.isDestroyed) {
          document.addEventListener('click', this.clickOutsideHandler!, true);
        }
      }, 100);
    }
  }

  private updateContent(): void {
    if (!this.element || this.isDestroyed) return;

    const content = document.createElement('div');
    content.style.cssText = `
      background: ${COLOR_THEME.ui.background.secondary}f0;
      border: 2px solid ${COLOR_THEME.ui.border.default};
      border-radius: 8px;
      padding: 16px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      pointer-events: auto;
    `;

    // Add header
    content.appendChild(this.createHeader());
    
    // Add currency display
    content.appendChild(this.createCurrencyDisplay());
    
    // Add current stats
    content.appendChild(this.createCurrentStats());
    
    // Add bulk selector if upgrades available
    if (this.hasAvailableUpgrades()) {
      content.appendChild(this.createBulkSelector());
      content.appendChild(this.createUpgradeCards());
    }
    
    // Add action buttons
    content.appendChild(this.createActionButtons());

    // Clear and append the actual DOM element to preserve event handlers
    const container = this.element.getElement();
    container.innerHTML = '';
    container.appendChild(content);
    
    // Re-setup click handling after content update
    this.setupClickHandling();
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
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
    titleContainer.innerHTML = `
      <div style="font-weight: bold; font-size: 16px; color: ${COLOR_THEME.ui.text.primary};">
        ${this.getTowerName()}
      </div>
      <div style="font-size: 12px; color: ${COLOR_THEME.ui.text.secondary};">
        Level ${this.tower.getLevel()}
      </div>
    `;
    header.appendChild(titleContainer);

    const sellValue = document.createElement('div');
    sellValue.style.cssText = `
      font-size: 12px;
      color: ${COLOR_THEME.ui.currency};
      text-align: right;
    `;
    sellValue.innerHTML = `${createSvgIcon(IconType.COINS, { size: 12 })} ${formatNumber(this.tower.getSellValue())}`;
    header.appendChild(sellValue);

    return header;
  }

  private createCurrencyDisplay(): HTMLElement {
    const display = document.createElement('div');
    display.style.cssText = `
      text-align: center;
      margin-bottom: 16px;
      padding: 10px;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(255, 215, 0, 0.3);
    `;

    display.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        ${createSvgIcon(IconType.COINS, { size: 20 })}
        <span style="font-size: 18px; font-weight: bold; color: #FFD700;">
          ${formatNumber(this.game.getCurrency())}
        </span>
        <span style="color: #ccc; font-size: 14px;">Available</span>
      </div>
    `;

    return display;
  }

  private createCurrentStats(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
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
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        ${index < stats.length - 1 ? 'margin-bottom: 6px;' : ''}
      `;

      row.innerHTML = `
        <span style="width: 16px; height: 16px; color: ${COLOR_THEME.ui.text.secondary};">
          ${createSvgIcon(stat.icon, { size: 16 })}
        </span>
        <span style="font-size: 12px; color: ${COLOR_THEME.ui.text.secondary}; flex: 1;">
          ${stat.label}
        </span>
        <span style="font-size: 13px; font-weight: bold; color: ${COLOR_THEME.ui.text.primary};">
          ${stat.value}
        </span>
      `;

      container.appendChild(row);
    });

    return container;
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
      
      button.onclick = () => {
        this.bulkAmount = increment;
        this.setupUpgradeOptions();
        this.updateContent();
      };

      container.appendChild(button);
    });

    return container;
  }

  private hasAvailableUpgrades(): boolean {
    return this.upgradeOptions.some(option => option.currentLevel < option.maxLevel);
  }

  private createUpgradeCards(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      max-height: 240px;
      overflow-y: auto;
    `;

    this.upgradeOptions.forEach(option => {
      container.appendChild(this.createUpgradeCard(option));
    });

    return container;
  }

  private createUpgradeCard(option: UpgradeOption): HTMLElement {
    const bulkCost = this.calculateBulkCost(option);
    const bulkLevels = this.calculateBulkLevels(option);
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
    header.innerHTML = `
      <span style="font-weight: bold; color: ${isMaxed ? '#FFD700' : '#4CAF50'}; font-size: 14px;">
        ${option.name}
      </span>
      <span style="color: #ccc; font-size: 11px;">
        ${isMaxed ? 'MAX' : `Lvl ${option.currentLevel}/${option.maxLevel}`}
      </span>
    `;
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
    footer.innerHTML = `
      <span style="color: #4CAF50; font-size: 11px; font-weight: bold;">
        ${option.effect}
      </span>
      ${!isMaxed ? `
        <span style="display: flex; align-items: center; gap: 4px; color: ${canAfford ? '#FFD700' : '#999'}; font-size: 11px;">
          ${createSvgIcon(IconType.COINS, { size: 12 })}
          <span>${formatNumber(bulkCost)}${bulkLevels > 1 ? ` (x${bulkLevels})` : ''}</span>
        </span>
      ` : ''}
    `;
    infoContainer.appendChild(footer);
    card.appendChild(infoContainer);

    if (canAfford && !isMaxed) {
      card.onmouseenter = () => {
        card.style.background = 'rgba(255, 255, 255, 0.08)';
        card.style.transform = 'translateX(2px)';
      };
      card.onmouseleave = () => {
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.transform = 'translateX(0)';
      };
      card.onclick = () => this.handleBulkUpgrade(option);
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

    // Apply bulk discounts
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
        if (!this.game.upgradeTower(this.tower, option.type)) {
          break;
        }
      }
      this.setupUpgradeOptions();
      this.updateContent();
    }
  }

  private createActionButtons(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
    `;

    const sellButton = document.createElement('button');
    sellButton.id = 'sell-button';
    sellButton.style.cssText = `
      flex: 1;
      padding: 10px;
      background: ${COLOR_THEME.ui.background.secondary}88;
      border: 1px solid ${COLOR_THEME.ui.text.danger}66;
      border-radius: 6px;
      color: ${COLOR_THEME.ui.text.danger};
      font-weight: bold;
      cursor: ${this.sellButtonEnabled ? 'pointer' : 'not-allowed'};
      opacity: ${this.sellButtonEnabled ? '1' : '0.6'};
      transition: all 0.2s;
    `;
    
    sellButton.innerHTML = `Sell for ${createSvgIcon(IconType.COINS, { size: 16 })} ${formatNumber(this.tower.getSellValue())}`;
    
    if (this.sellButtonEnabled) {
      sellButton.onmouseenter = () => {
        sellButton.style.background = `${COLOR_THEME.ui.text.danger}22`;
      };
      sellButton.onmouseleave = () => {
        sellButton.style.background = `${COLOR_THEME.ui.background.secondary}88`;
      };
      sellButton.onclick = () => this.handleSell();
    }

    container.appendChild(sellButton);
    return container;
  }

  private updateSellButton(): void {
    if (this.isDestroyed || !this.element) return;
    
    // Re-render to update sell button state
    this.updateContent();
  }

  private handleSell(): void {
    if (!this.sellButtonEnabled || this.isDestroyed) return;

    if (this.game.sellTower(this.tower)) {
      // Tower sold successfully - Game will handle cleanup
      this.destroy();
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
    if (this.isDestroyed) return;
    this.setupUpgradeOptions();
    this.updateContent();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Clear timeout
    if (this.sellButtonTimeout) {
      clearTimeout(this.sellButtonTimeout);
      this.sellButtonTimeout = null;
    }

    // Remove event listeners
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    // Remove click outside handler
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler, true);
      this.clickOutsideHandler = null;
    }
    
    // Remove stop propagation handlers
    if (this.element) {
      const element = this.element.getElement();
      const stopPropagation = (element as any).__stopPropagation;
      if (stopPropagation) {
        element.removeEventListener('mousedown', stopPropagation, true);
        element.removeEventListener('mouseup', stopPropagation, true);
        element.removeEventListener('click', stopPropagation, true);
        delete (element as any).__stopPropagation;
      }
    }

    // Remove from FloatingUIManager
    if (this.element) {
      this.floatingUI.remove(`tower-upgrade-${this.tower.id}`);
      this.element = null;
    }

    // Clear static reference
    if (TowerUpgradeUI.activeUI === this) {
      TowerUpgradeUI.activeUI = null;
    }
  }

  public static destroyActiveUI(): void {
    if (TowerUpgradeUI.activeUI) {
      TowerUpgradeUI.activeUI.destroy();
      TowerUpgradeUI.activeUI = null;
    }
  }

  public static getActiveUI(): TowerUpgradeUI | null {
    return TowerUpgradeUI.activeUI;
  }
}