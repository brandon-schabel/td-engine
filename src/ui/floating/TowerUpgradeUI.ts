/**
 * TowerUpgradeUI.ts - Tower upgrade interface using FloatingUIManager
 * Refactored to extend BaseEntityUI for cleaner architecture while maintaining:
 * - Complex click event handling to prevent canvas interaction
 * - Sell button safety delay (500ms)
 * - Minimum open duration (300ms)
 * - Dynamic upgrade options based on tower state
 * - Lifecycle fully managed by UIController
 */

import type { Tower } from '@/entities/Tower';
import { UpgradeType, TowerType } from '@/entities/Tower';
import type { Game } from '@/core/Game';
import { BaseEntityUI } from './BaseEntityUI';
import { IconType } from '@/ui/icons/SvgIcons';
import { formatNumber } from '@/utils/formatters';
import { SoundType } from '@/audio/AudioManager';
import {
  createCard,
  createClickableCard,
  createButton,
  createCloseButton,
  createIconContainer,
  createCurrencyDisplay,
  createInlineStats,
  cn,
  type Stat
} from '@/ui/elements';

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

interface TowerUpgradeState {
  currency: number;
  upgradeOptions: UpgradeOption[];
}

/**
 * Tower upgrade UI that follows a tower entity.
 * Manages upgrades and tower selling with safety features.
 */
export class TowerUpgradeUI extends BaseEntityUI {
  private tower: Tower;
  private upgradeOptions: UpgradeOption[] = [];
  private sellButtonEnabled: boolean = false;
  private sellButtonTimeout: number | null = null;
  private openTime: number = 0;
  private minOpenDuration: number = 300; // Minimum time UI must stay open (ms)
  private clickOutsideSetupTimeout: number | null = null;
  
  // Smart updaters for efficient DOM updates
  private stateUpdater = this.setupSmartUpdater<TowerUpgradeState>('state', {
    currency: () => this.updateCurrencyAndAffordability(),
    upgradeOptions: () => this.rebuildUpgradeContent()
  });
  
  // UI element references
  private currencyDisplay: HTMLDivElement | null = null;

  constructor(tower: Tower, game: Game) {
    super(game, {
      className: 'tower-upgrade-ui compact',
      offset: { x: 0, y: -20 },
      smoothing: 0.1,
      zIndex: 1000,
      excludeSelectors: ['.ui-control-bar button', '.build-menu-popup']
    });

    this.tower = tower;
    this.setupUpgradeOptions();
    
    // Show for this tower
    this.showForEntity(tower);
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
        effect: this.getUpgradeEffectText(UpgradeType.DAMAGE)
      },
      {
        type: UpgradeType.RANGE,
        name: 'Range',
        description: 'Increase attack range',
        cost: this.tower.getUpgradeCost(UpgradeType.RANGE),
        currentLevel: this.tower.getUpgradeLevel(UpgradeType.RANGE),
        maxLevel: this.tower.getMaxUpgradeLevel(),
        icon: IconType.RANGE,
        effect: this.getUpgradeEffectText(UpgradeType.RANGE)
      },
      {
        type: UpgradeType.FIRE_RATE,
        name: 'Speed',
        description: 'Attack more frequently',
        cost: this.tower.getUpgradeCost(UpgradeType.FIRE_RATE),
        currentLevel: this.tower.getUpgradeLevel(UpgradeType.FIRE_RATE),
        maxLevel: this.tower.getMaxUpgradeLevel(),
        icon: IconType.SPEED,
        effect: this.getUpgradeEffectText(UpgradeType.FIRE_RATE)
      }
    ];
  }

  private getUpgradeEffectText(upgradeType: UpgradeType): string {
    const preview = this.tower.getUpgradePreview(upgradeType);
    if (!preview) {
      return 'MAX';
    }

    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return `${Math.round(preview.currentValue)} → ${Math.round(preview.newValue)} (+${Math.round(preview.increase)})`;
      case UpgradeType.RANGE:
        return `${Math.round(preview.currentValue)} → ${Math.round(preview.newValue)} (+${Math.round(preview.increase)})`;
      case UpgradeType.FIRE_RATE:
        // Fire rate shows attacks per second with 1 decimal
        return `${preview.currentValue.toFixed(1)}/s → ${preview.newValue.toFixed(1)}/s (+${preview.increase.toFixed(1)}/s)`;
      default:
        return '';
    }
  }

  protected getEntityUIId(): string {
    return `tower-upgrade-${this.tower.id}`;
  }
  
  protected onEntityUICreated(): void {
    // Record when the UI was opened
    this.openTime = Date.now();
    
    // Set up periodic updates for dynamic content
    this.setupPeriodicUpdate(100);
    
    // Set up special click handling for this UI
    this.setupSpecialClickHandling();
    
    // Enable sell button after 0.5 seconds (safety delay)
    this.sellButtonTimeout = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.sellButtonEnabled = true;
        this.updateSellButton();
      }
    }, 500);
  }
  
  protected createEntityUIContent(): HTMLElement {
    return this.createUpgradePanel();
  }

  private setupSpecialClickHandling(): void {
    if (!this.element || this.isDestroyed) return;

    const element = this.element.getElement();

    // Only prevent events from bubbling up to the canvas when clicking on non-interactive areas
    const handleMouseEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Allow events on interactive elements to process normally
      if (target.matches('button, input, select, textarea, a, [role="button"]') || 
          target.closest('button, input, select, textarea, a, [role="button"]')) {
        return;
      }

      // Only stop propagation for clicks on the background/card itself
      if (target === element || target.matches('.card-base, .tower-upgrade-panel')) {
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

    // Override the base click outside handler with special timing logic
    this.cleanupClickOutside();
    const clickOutsideHandler = (e: MouseEvent) => {
      // Don't close if UI was just opened (minimum open duration)
      const timeSinceOpen = Date.now() - this.openTime;
      if (timeSinceOpen < this.minOpenDuration) {
        return;
      }

      // Check if the click is outside the upgrade UI
      if (!element.contains(e.target as Node)) {
        // Check if we clicked on another tower
        const clickedElement = e.target as HTMLElement;
        const isCanvasClick = clickedElement.tagName === 'CANVAS' || clickedElement.id === 'game-canvas';
        
        // If we clicked on the canvas (not another UI element), close this UI
        if (isCanvasClick) {
          // Use game.deselectTower() to properly close through the game flow
          this.game.deselectTower();
        }
      }
    };

    // Add with a slight delay to avoid catching the same click that opened the UI
    this.clickOutsideSetupTimeout = window.setTimeout(() => {
      if (!this.isDestroyed) {
        document.addEventListener('mousedown', clickOutsideHandler, true);
        document.addEventListener('mouseup', clickOutsideHandler, true);
        document.addEventListener('click', clickOutsideHandler, true);
        this.clickOutsideHandler = clickOutsideHandler;
      }
    }, 50);
  }

  private createUpgradePanel(): HTMLElement {
    // Create main panel card
    const panel = createCard({
      variant: 'elevated',
      padding: 'sm',
      customClasses: ['tower-upgrade-panel', 'compact']
    });

    // Add header
    panel.appendChild(this.createCompactHeader());

    // Add upgrade cards
    if (this.hasAvailableUpgrades()) {
      panel.appendChild(this.createCompactUpgradeCards());
    }

    // Add action buttons
    panel.appendChild(this.createCompactActionButtons());

    return panel;
  }
  
  updateContent(): void {
    // Use smart updater to efficiently update state
    const state: TowerUpgradeState = {
      currency: this.game.getCurrency(),
      upgradeOptions: this.upgradeOptions
    };
    
    this.stateUpdater.update(state);
  }
  
  private rebuildUpgradeContent(): void {
    if (!this.element || this.isDestroyed) return;
    
    // Rebuild the entire content when upgrade options change
    const newContent = this.createUpgradePanel();
    this.element.setContent(newContent);
    
    // Re-setup click handling after content update
    this.setupSpecialClickHandling();
  }

  private createCompactHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = cn('flex', 'items-center', 'justify-between', 'mb-3');

    // Tower info section
    const towerInfo = document.createElement('div');
    towerInfo.className = cn('flex', 'items-center', 'gap-3');

    // Tower icon
    const towerTypeMap: Record<string, string> = {
      'BASIC': 'text-game-tower-basic border-game-tower-basic',
      'SNIPER': 'text-game-tower-sniper border-game-tower-sniper',
      'RAPID': 'text-game-tower-rapid border-game-tower-rapid',
      'WALL': 'text-game-tower-wall border-game-tower-wall'
    };
    const towerTypeClasses = towerTypeMap[this.tower.towerType] || 'text-primary border-primary';
    
    const towerIcon = createIconContainer({
      icon: this.getTowerIcon(),
      size: 'md',
      variant: 'filled',
      color: 'primary',
      customClasses: [
        'tower-icon',
        'bg-black/30',
        'border-2',
        'transition-all',
        ...towerTypeClasses.split(' ')
      ]
    });

    // Tower details
    const towerDetails = document.createElement('div');
    towerDetails.className = cn('flex', 'flex-col', 'gap-1');

    const towerName = document.createElement('div');
    towerName.className = cn('text-base', 'font-semibold', 'text-foreground');
    towerName.textContent = `${this.getTowerName()} Lv.${this.tower.getLevel()}`;

    // Tower stats using inline stats display
    const stats: Stat[] = [
      { label: 'DMG', value: this.tower.damage, valueColor: 'primary', labelColor: 'secondary' },
      { label: 'RNG', value: this.tower.range, valueColor: 'primary', labelColor: 'secondary' },
      { label: 'SPD', value: `${(1000 / this.tower.fireRate).toFixed(1)}/s`, valueColor: 'primary', labelColor: 'secondary' }
    ];

    const towerStats = createInlineStats(stats, {
      variant: 'minimal',
      showLabels: true
    });

    towerDetails.appendChild(towerName);
    towerDetails.appendChild(towerStats);

    // Currency display
    this.currencyDisplay = createCurrencyDisplay(this.game.getCurrency(), {
      variant: 'compact',
      customClasses: ['ml-auto']
    });

    towerInfo.appendChild(towerIcon);
    towerInfo.appendChild(towerDetails);
    towerInfo.appendChild(this.currencyDisplay);

    // Close button
    const closeButton = createCloseButton({
      size: 'sm',
      variant: 'ghost',
      onClick: () => {
        // Use game.deselectTower() to properly close through the game flow
        this.game.deselectTower();
      },
      ariaLabel: 'Close (Esc)'
    });
    
    // Add tooltip
    closeButton.title = 'Close (Esc)';

    header.appendChild(towerInfo);
    header.appendChild(closeButton);
    
    return header;
  }

  private createCompactUpgradeCards(): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('grid', 'gap-2', 'mb-3');

    // Use 1 column on very small screens, otherwise use original layout
    const isMobile = window.innerWidth < 400;
    if (isMobile) {
      container.classList.add('grid-cols-1');
    } else if (this.upgradeOptions.length <= 2) {
      container.classList.add('grid-cols-2');
    } else {
      container.classList.add('grid-cols-3');
    }

    this.upgradeOptions.forEach(option => {
      container.appendChild(this.createCompactUpgradeCard(option));
    });

    return container;
  }

  private createCompactUpgradeCard(option: UpgradeOption): HTMLElement {
    const canAfford = this.game.getCurrency() >= option.cost && option.currentLevel < option.maxLevel;
    const isMaxed = option.currentLevel >= option.maxLevel;

    const card = createClickableCard(
      () => this.handleSingleUpgrade(option),
      {
        variant: 'outlined',
        padding: 'sm',
        hoverable: canAfford && !isMaxed,
        clickable: canAfford && !isMaxed,
        customClasses: [
          'tower-upgrade-card',
          'compact',
          'bg-surface-secondary',
          'transition-all',
          'relative',
          'overflow-hidden',
          canAfford && !isMaxed ? 'can-afford hover:border-primary hover:bg-primary/10' : '',
          isMaxed ? 'maxed opacity-50' : ''
        ]
      }
    );
    
    // Add data attributes for smart updates
    card.setAttribute('data-upgrade-type', option.type);
    card.setAttribute('data-upgrade-cost', String(option.cost));

    // Card content wrapper - use flex-col for better mobile layout
    const content = document.createElement('div');
    content.className = cn('flex', 'flex-col', 'gap-1');

    // Top row with icon and name
    const topRow = document.createElement('div');
    topRow.className = cn('flex', 'items-center', 'gap-2');

    // Upgrade icon
    const icon = createIconContainer({
      icon: option.icon,
      size: 'sm',
      variant: 'ghost',
      color: isMaxed ? 'muted' : 'primary'
    });

    // Upgrade info
    const info = document.createElement('div');
    info.className = cn('flex', 'flex-col', 'flex-1', 'min-w-0');

    const name = document.createElement('div');
    name.className = cn('text-sm', 'font-medium', 'truncate', 'text-foreground');
    name.textContent = `${option.name} ${isMaxed ? 'MAX' : `${option.currentLevel}/${option.maxLevel}`}`;

    info.appendChild(name);

    if (!isMaxed) {
      // Add effect text showing stat increases
      const effectText = document.createElement('div');
      effectText.className = cn('text-xs', 'text-success', 'font-medium', 'mt-1');
      effectText.textContent = option.effect;
      content.appendChild(effectText);
      
      const cost = createCurrencyDisplay(option.cost, {
        variant: 'inline',
        color: canAfford ? 'success' : 'danger',
        customClasses: ['text-xs', 'mt-1']
      });
      content.appendChild(cost);
    } else {
      const maxedText = document.createElement('div');
      maxedText.className = cn('text-xs', 'text-muted', 'font-semibold');
      maxedText.textContent = 'MAXED';
      info.appendChild(maxedText);
    }

    topRow.appendChild(icon);
    topRow.appendChild(info);
    content.appendChild(topRow);
    card.appendChild(content);

    // Disable pointer events if not clickable
    if (!canAfford || isMaxed) {
      card.style.pointerEvents = 'none';
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
    container.className = cn('flex', 'gap-2');

    // Repair button
    const repairInfo = this.tower.getRepairInfo();
    if (repairInfo.canRepair) {
      const repairButton = createButton({
        text: `Repair ${formatNumber(repairInfo.cost)}`,
        variant: 'success',
        size: 'sm',
        icon: IconType.SETTINGS,
        onClick: () => this.handleRepair(),
        disabled: this.game.getCurrency() < repairInfo.cost,
        customClasses: ['flex-1']
      });
      repairButton.setAttribute('data-repair-button', 'true');
      repairButton.setAttribute('data-repair-cost', String(repairInfo.cost));
      container.appendChild(repairButton);
    }

    const sellButton = createButton({
      text: `Sell ${formatNumber(this.tower.getSellValue())}`,
      variant: 'danger',
      size: 'sm',
      icon: IconType.COINS,
      onClick: () => this.handleSell(),
      disabled: !this.sellButtonEnabled,
      customClasses: ['flex-1']
    });

    container.appendChild(sellButton);
    return container;
  }

  private updateSellButton(): void {
    if (this.isDestroyed || !this.element) return;

    // Force a rebuild to update sell button state
    this.rebuildUpgradeContent();
  }
  
  private updateCurrencyAndAffordability(): void {
    if (!this.element) return;
    
    const element = this.element.getElement();
    if (!element) return;
    
    const currency = this.game.getCurrency();
    
    // Update currency display
    if (this.currencyDisplay) {
      const updateValue = (this.currencyDisplay as any).updateValue;
      if (updateValue) {
        updateValue(currency);
      }
    }
    
    // Update upgrade card affordability
    const upgradeCards = element.querySelectorAll('.tower-upgrade-card[data-upgrade-cost]');
    upgradeCards.forEach((card) => {
      const cardEl = card as HTMLDivElement;
      const cost = parseInt(cardEl.getAttribute('data-upgrade-cost') || '0');
      const isMaxed = cardEl.classList.contains('maxed');
      const canAfford = currency >= cost && !isMaxed;
      
      // Update visual state
      if (!isMaxed) {
        if (canAfford) {
          cardEl.classList.add('can-afford');
          cardEl.classList.remove('ui-disabled');
          cardEl.style.pointerEvents = '';
        } else {
          cardEl.classList.remove('can-afford');
          cardEl.classList.add('ui-disabled');
          cardEl.style.pointerEvents = 'none';
        }
      }
    });
    
    // Update repair button if it exists
    const repairButton = element.querySelector('[data-repair-button]') as HTMLButtonElement;
    if (repairButton) {
      const repairCost = parseInt(repairButton.getAttribute('data-repair-cost') || '0');
      repairButton.disabled = currency < repairCost;
    }
  }

  private handleSell(): void {
    if (!this.sellButtonEnabled || this.isDestroyed) return;

    if (this.game.sellTower(this.tower)) {
      // Tower sold successfully - Game will handle cleanup
      this.destroy();
    }
  }

  private handleRepair(): void {
    const repairInfo = this.tower.getRepairInfo();
    if (!repairInfo.canRepair || this.game.getCurrency() < repairInfo.cost) {
      return;
    }
    
    // Deduct currency and repair
    this.game.addCurrency(-repairInfo.cost);
    this.tower.repair();
    
    // Play sound effect
    this.game.getAudioManager()?.playUISound(SoundType.UPGRADE);
    
    // Update the UI
    this.updateContent();
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

  close(): void {
    // Just call parent close() to avoid recursion
    // The destroy() method will handle the full cleanup
    super.close();
  }
  
  destroy(): void {
    // Clear all timeouts
    if (this.sellButtonTimeout) {
      clearTimeout(this.sellButtonTimeout);
      this.sellButtonTimeout = null;
    }
    
    if (this.clickOutsideSetupTimeout) {
      clearTimeout(this.clickOutsideSetupTimeout);
      this.clickOutsideSetupTimeout = null;
    }

    // Remove special mouse event handlers
    if (this.element) {
      const element = this.element.getElement();
      if (element) {
        const handleMouseEvent = (element as any).__handleMouseEvent;
        if (handleMouseEvent) {
          element.removeEventListener('mousedown', handleMouseEvent);
          element.removeEventListener('click', handleMouseEvent);
          delete (element as any).__handleMouseEvent;
        }
      }
    }

    // Remove click-outside handlers that were added in setupSpecialClickHandling
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler, true);
      document.removeEventListener('mouseup', this.clickOutsideHandler, true);
      document.removeEventListener('click', this.clickOutsideHandler, true);
      this.clickOutsideHandler = null;
    }

    // Clear references
    this.currencyDisplay = null;
    
    // Note: We don't call clearSelectedTower here to avoid circular dependencies
    // The game should handle tower selection state separately
    
    // Call parent destroy - this will handle the FloatingUIElement cleanup
    super.destroy();
  }
}