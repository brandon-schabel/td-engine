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

    // Note: Escape key is handled by UIController, not here
  }

  private setupClickHandling(): void {
    if (!this.element || this.isDestroyed) return;
    
    const element = this.element.getElement();
    
    // Only prevent events from bubbling up to the canvas when clicking on non-interactive areas
    const handleMouseEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow events on interactive elements to process normally
      if (target.matches('button, .ui-button, input, select, textarea, a')) {
        return; // Let the event bubble normally for interactive elements
      }
      
      // Only stop propagation for clicks on the background/card itself
      if (target === element || target.matches('.ui-card, .tower-upgrade-panel')) {
        e.stopPropagation();
      }
    };
    
    // Remove existing handlers if any
    const oldHandler = (element as any).__handleMouseEvent;
    if (oldHandler) {
      element.removeEventListener('mousedown', oldHandler);
      element.removeEventListener('click', oldHandler);
    }
    
    // Add new handlers
    element.addEventListener('mousedown', handleMouseEvent);
    element.addEventListener('click', handleMouseEvent);
    
    // Store handler for cleanup
    (element as any).__handleMouseEvent = handleMouseEvent;
    
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
    content.className = 'tower-upgrade-panel';

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
    header.className = 'tower-upgrade-header';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'tower-upgrade-icon';
    iconContainer.dataset.towerType = this.tower.towerType.toLowerCase();
    iconContainer.innerHTML = createSvgIcon(this.getTowerIcon(), { size: 32 });
    header.appendChild(iconContainer);

    const titleContainer = document.createElement('div');
    titleContainer.className = 'tower-upgrade-title';
    titleContainer.innerHTML = `
      <div class="tower-upgrade-name">${this.getTowerName()}</div>
      <div class="tower-upgrade-level">Level ${this.tower.getLevel()}</div>
    `;
    header.appendChild(titleContainer);

    const sellValue = document.createElement('div');
    sellValue.className = 'tower-upgrade-sell-value';
    sellValue.innerHTML = `${createSvgIcon(IconType.COINS, { size: 12 })} ${formatNumber(this.tower.getSellValue())}`;
    header.appendChild(sellValue);

    return header;
  }

  private createCurrencyDisplay(): HTMLElement {
    const display = document.createElement('div');
    display.className = 'tower-upgrade-currency';

    display.innerHTML = `
      <div class="tower-upgrade-currency-inner">
        ${createSvgIcon(IconType.COINS, { size: 20 })}
        <span class="currency-value">${formatNumber(this.game.getCurrency())}</span>
        <span class="currency-label">Available</span>
      </div>
    `;

    return display;
  }

  private createCurrentStats(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tower-upgrade-stats';

    const stats = [
      { label: 'Damage', value: this.tower.damage, icon: IconType.DAMAGE },
      { label: 'Range', value: this.tower.range, icon: IconType.RANGE },
      { label: 'Fire Rate', value: `${(1000 / this.tower.fireRate).toFixed(1)}/s`, icon: IconType.SPEED }
    ];

    stats.forEach((stat) => {
      const row = document.createElement('div');
      row.className = 'tower-stat-row';

      row.innerHTML = `
        <span class="tower-stat-icon">
          ${createSvgIcon(stat.icon, { size: 16 })}
        </span>
        <span class="tower-stat-label">${stat.label}</span>
        <span class="tower-stat-value">${stat.value}</span>
      `;

      container.appendChild(row);
    });

    return container;
  }

  private createBulkSelector(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tower-bulk-selector';

    const label = document.createElement('span');
    label.className = 'bulk-selector-label';
    label.textContent = 'Upgrade:';
    container.appendChild(label);

    const increments = [1, 5, 10, 25, 'MAX'] as const;
    increments.forEach(increment => {
      const button = document.createElement('button');
      button.className = `ui-button bulk-selector-button ${this.bulkAmount === increment ? 'active' : ''}`;
      button.textContent = increment === 'MAX' ? 'MAX' : `x${increment}`;
      
      const handleBulkSelect = () => {
        this.bulkAmount = increment;
        this.setupUpgradeOptions();
        this.updateContent();
      };
      
      button.addEventListener('click', handleBulkSelect);
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleBulkSelect();
      });

      container.appendChild(button);
    });

    return container;
  }

  private hasAvailableUpgrades(): boolean {
    return this.upgradeOptions.some(option => option.currentLevel < option.maxLevel);
  }

  private createUpgradeCards(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tower-upgrade-cards';

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
    card.className = `tower-upgrade-card ${canAfford && !isMaxed ? 'can-afford' : ''} ${isMaxed ? 'maxed' : ''}`;

    const iconContainer = document.createElement('div');
    iconContainer.className = 'upgrade-card-icon';
    iconContainer.innerHTML = createSvgIcon(option.icon, { size: 24 });
    card.appendChild(iconContainer);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'upgrade-card-info';

    const header = document.createElement('div');
    header.className = 'upgrade-card-header';
    header.innerHTML = `
      <span class="upgrade-card-name ${isMaxed ? 'maxed' : ''}">${option.name}</span>
      <span class="upgrade-card-level">${isMaxed ? 'MAX' : `Lvl ${option.currentLevel}/${option.maxLevel}`}</span>
    `;
    infoContainer.appendChild(header);

    const description = document.createElement('div');
    description.className = 'upgrade-card-description';
    description.textContent = option.description;
    infoContainer.appendChild(description);

    const footer = document.createElement('div');
    footer.className = 'upgrade-card-footer';
    footer.innerHTML = `
      <span class="upgrade-card-effect">${option.effect}</span>
      ${!isMaxed ? `
        <span class="upgrade-card-cost ${canAfford ? 'affordable' : ''}">
          ${createSvgIcon(IconType.COINS, { size: 12 })}
          <span>${formatNumber(bulkCost)}${bulkLevels > 1 ? ` (x${bulkLevels})` : ''}</span>
        </span>
      ` : ''}
    `;
    infoContainer.appendChild(footer);
    card.appendChild(infoContainer);

    if (canAfford && !isMaxed) {
      const handleUpgrade = () => this.handleBulkUpgrade(option);
      
      card.addEventListener('click', handleUpgrade);
      card.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleUpgrade();
      });
      
      // Add cursor pointer for clickable cards
      card.style.cursor = 'pointer';
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
    container.className = 'tower-upgrade-actions';

    const sellButton = document.createElement('button');
    sellButton.id = 'sell-button';
    sellButton.className = `ui-button tower-sell-button ${!this.sellButtonEnabled ? 'disabled' : ''}`;
    
    sellButton.innerHTML = `Sell for ${createSvgIcon(IconType.COINS, { size: 16 })} ${formatNumber(this.tower.getSellValue())}`;
    
    if (this.sellButtonEnabled) {
      const handleSellClick = () => this.handleSell();
      
      sellButton.addEventListener('click', handleSellClick);
      sellButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleSellClick();
      });
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

    // Remove click outside handler
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler, true);
      this.clickOutsideHandler = null;
    }
    
    // Remove mouse event handlers
    if (this.element) {
      const element = this.element.getElement();
      const handleMouseEvent = (element as any).__handleMouseEvent;
      if (handleMouseEvent) {
        element.removeEventListener('mousedown', handleMouseEvent);
        element.removeEventListener('click', handleMouseEvent);
        delete (element as any).__handleMouseEvent;
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