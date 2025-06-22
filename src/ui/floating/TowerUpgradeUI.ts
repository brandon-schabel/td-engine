/**
 * TowerUpgradeUI.ts - Tower upgrade interface using FloatingUIManager
 * Recent changes:
 * 1. Complete refactor to use UI element abstractions and utility classes
 * 2. Eliminated manual DOM construction in favor of declarative element creation
 * 3. Replaced all ui-* classes with utility classes
 * 4. Improved readability and maintainability
 * 5. Mobile-responsive with proper touch support
 */

import type { Tower } from '@/entities/Tower';
import { UpgradeType, TowerType } from '@/entities/Tower';
import type { Game } from '@/core/Game';
import type { FloatingUIManager } from './FloatingUIManager';
import type { FloatingUIElement } from './FloatingUIElement';
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
  private currencyDisplay: HTMLDivElement | null = null;

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

    // Enable sell button after 0.5 seconds
    this.sellButtonTimeout = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.sellButtonEnabled = true;
        this.updateSellButton();
      }
    }, 500);
  }

  private setupClickHandling(): void {
    if (!this.element || this.isDestroyed) return;

    const element = this.element.getElement();

    // Only prevent events from bubbling up to the canvas when clicking on non-interactive areas
    const handleMouseEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Allow events on interactive elements to process normally
      if (target.matches('button, input, select, textarea, a, [role="button"]')) {
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

    // Clear and append the actual DOM element to preserve event handlers
    const container = this.element.getElement();
    container.innerHTML = '';
    container.appendChild(panel);

    // Re-setup click handling after content update
    this.setupClickHandling();
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
      onClick: () => this.game.deselectTower(),
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

    // Determine grid columns based on number of upgrades
    if (this.upgradeOptions.length <= 2) {
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

    // Card content wrapper
    const content = document.createElement('div');
    content.className = cn('flex', 'items-center', 'gap-2');

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

    if (!isMaxed) {
      const cost = createCurrencyDisplay(option.cost, {
        variant: 'inline',
        color: canAfford ? 'success' : 'danger',
        customClasses: ['text-xs']
      });
      info.appendChild(name);
      info.appendChild(cost);
    } else {
      const maxedText = document.createElement('div');
      maxedText.className = cn('text-xs', 'text-muted', 'font-semibold');
      maxedText.textContent = 'MAXED';
      info.appendChild(name);
      info.appendChild(maxedText);
    }

    content.appendChild(icon);
    content.appendChild(info);
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
    
    // Update currency display if it exists
    if (this.currencyDisplay) {
      const updateValue = (this.currencyDisplay as any).updateValue;
      if (updateValue) {
        updateValue(this.game.getCurrency());
      }
    }
    
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

    // Clear currency display reference
    this.currencyDisplay = null;
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