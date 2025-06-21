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
        name: 'Speed',
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
      offset: { x: 0, y: -20 },
      anchor: 'top',
      smoothing: 0.1,
      autoHide: false,
      persistent: true,
      zIndex: 1000,
      className: 'tower-upgrade-ui compact'
    });

    this.element.setTarget(this.tower);
    this.updateContent();
    this.element.enable();

    // Prevent clicks on the UI from propagating to the canvas
    this.setupClickHandling();

    // Enable sell button after 0.5 seconds (reduced from 1 second)
    this.sellButtonTimeout = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.sellButtonEnabled = true;
        this.updateSellButton();
      }
    }, 500);

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
    content.className = 'tower-upgrade-panel compact';

    // Add compact header with stats inline
    content.appendChild(this.createCompactHeader());

    // Add upgrade cards
    if (this.hasAvailableUpgrades()) {
      content.appendChild(this.createCompactUpgradeCards());
    }

    // Add action buttons
    content.appendChild(this.createCompactActionButtons());

    // Clear and append the actual DOM element to preserve event handlers
    const container = this.element.getElement();
    container.innerHTML = '';
    container.appendChild(content);

    // Re-setup click handling after content update
    this.setupClickHandling();
  }

  private createCompactHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'tower-upgrade-header ui-header compact';

    const towerInfo = document.createElement('div');
    towerInfo.className = 'tower-info';

    // Tower icon
    const towerIcon = document.createElement('div');
    towerIcon.className = 'tower-icon ui-icon-container sm';
    towerIcon.dataset.towerType = this.tower.towerType.toLowerCase();
    towerIcon.innerHTML = createSvgIcon(this.getTowerIcon(), { size: 20 });

    // Tower details
    const towerDetails = document.createElement('div');
    towerDetails.className = 'tower-details';

    const towerName = document.createElement('div');
    towerName.className = 'tower-name';
    towerName.textContent = `${this.getTowerName()} Lv.${this.tower.getLevel()}`;

    const towerStats = document.createElement('div');
    towerStats.className = 'tower-stats';
    const damage = document.createElement('span');
    damage.textContent = `${this.tower.damage}dmg`;
    const range = document.createElement('span');
    range.textContent = `${this.tower.range}rng`;
    const fireRate = document.createElement('span');
    fireRate.textContent = `${(1000 / this.tower.fireRate).toFixed(1)}/s`;

    towerStats.appendChild(damage);
    towerStats.innerHTML += ' • ';
    towerStats.appendChild(range);
    towerStats.innerHTML += ' • ';
    towerStats.appendChild(fireRate);

    towerDetails.appendChild(towerName);
    towerDetails.appendChild(towerStats);

    // Currency display
    const currency = document.createElement('div');
    currency.className = 'tower-currency';
    currency.innerHTML = `${createSvgIcon(IconType.COINS, { size: 14 })} ${formatNumber(this.game.getCurrency())}`;

    towerInfo.appendChild(towerIcon);
    towerInfo.appendChild(towerDetails);
    towerInfo.appendChild(currency);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'ui-button small close-button ui-close-button';
    closeButton.innerHTML = createSvgIcon(IconType.CLOSE, { size: 14 });
    closeButton.title = 'Close (Esc)';

    const handleClose = () => {
      this.game.deselectTower();
    };

    closeButton.addEventListener('click', handleClose);
    closeButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleClose();
    });

    header.appendChild(towerInfo);
    header.appendChild(closeButton);
    return header;
  }

  private createCompactUpgradeCards(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tower-upgrade-cards compact';

    this.upgradeOptions.forEach(option => {
      container.appendChild(this.createCompactUpgradeCard(option));
    });

    return container;
  }

  private createCompactUpgradeCard(option: UpgradeOption): HTMLElement {
    const canAfford = this.game.getCurrency() >= option.cost && option.currentLevel < option.maxLevel;
    const isMaxed = option.currentLevel >= option.maxLevel;

    const card = document.createElement('div');
    card.className = `tower-upgrade-card ui-card interactive compact ${canAfford && !isMaxed ? 'can-afford' : ''} ${isMaxed ? 'maxed' : ''}`;

    // Upgrade icon
    const icon = document.createElement('div');
    icon.className = 'upgrade-icon';
    icon.innerHTML = createSvgIcon(option.icon, { size: 16 });

    // Upgrade info
    const info = document.createElement('div');
    info.className = 'upgrade-info';

    const name = document.createElement('div');
    name.className = 'upgrade-name';
    name.textContent = `${option.name} ${isMaxed ? 'MAX' : `${option.currentLevel}/${option.maxLevel}`}`;

    if (!isMaxed) {
      const cost = document.createElement('div');
      cost.className = `upgrade-cost ${canAfford ? 'affordable' : ''}`;
      cost.innerHTML = `${createSvgIcon(IconType.COINS, { size: 12 })} ${formatNumber(option.cost)}`;
      info.appendChild(name);
      info.appendChild(cost);
    } else {
      const maxed = document.createElement('div');
      maxed.className = 'upgrade-maxed';
      maxed.textContent = 'MAXED';
      info.appendChild(name);
      info.appendChild(maxed);
    }

    card.appendChild(icon);
    card.appendChild(info);

    if (canAfford && !isMaxed) {
      const handleUpgrade = () => this.handleSingleUpgrade(option);

      card.addEventListener('click', handleUpgrade);
      card.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleUpgrade();
      });
    }

    return card;
  }

  private handleSingleUpgrade(option: UpgradeOption): void {
    if (this.game.getCurrency() >= option.cost) {
      this.game.upgradeTower(this.tower, option.type);
      this.setupUpgradeOptions();
      this.updateContent();
    }
  }

  private createCompactActionButtons(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tower-upgrade-actions compact';

    const sellButton = document.createElement('button');
    sellButton.className = `ui-button small tower-sell-button ${!this.sellButtonEnabled ? 'disabled' : ''}`;
    sellButton.innerHTML = `Sell ${createSvgIcon(IconType.COINS, { size: 14 })} ${formatNumber(this.tower.getSellValue())}`;

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

  private hasAvailableUpgrades(): boolean {
    return this.upgradeOptions.some(option => option.currentLevel < option.maxLevel);
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