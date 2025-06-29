/**
 * Refactored BuildMenuUI using BasePopupUI
 * Maintains all existing functionality with cleaner architecture
 */

import type { Game } from '@/core/Game';
import { BasePopupUI } from './BasePopupUI';
import { TowerType } from '@/entities/Tower';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { COLOR_THEME } from '@/config/ColorTheme';
import { TOWER_COSTS } from '@/config/GameConfig';
import {
  createClickableCard,
  createCompactResource,
  createResourceDisplay,
  cn
} from '@/ui/elements';

interface TowerOption {
  type: TowerType;
  name: string;
  cost: number;
  icon: IconType;
  color: string;
}

interface BuildMenuState {
  currency: number;
}

/**
 * Build menu UI for selecting towers to build.
 * Shows a grid of available towers with costs and affordability.
 */
export class BuildMenuUI extends BasePopupUI {
  private onTowerSelect: ((type: TowerType) => void) | null = null;
  private currencyUpdater = this.setupSmartUpdater<BuildMenuState>('currency', {
    currency: (value) => this.updateCurrencyDisplay(value)
  });
  
  // Tower configuration
  private readonly towers: TowerOption[] = [
    {
      type: TowerType.BASIC,
      name: 'Basic Tower',
      cost: TOWER_COSTS.BASIC,
      icon: IconType.BASIC_TOWER,
      color: COLOR_THEME.towers.basic
    },
    {
      type: TowerType.SNIPER,
      name: 'Sniper Tower',
      cost: TOWER_COSTS.SNIPER,
      icon: IconType.SNIPER_TOWER,
      color: COLOR_THEME.towers.frost
    },
    {
      type: TowerType.RAPID,
      name: 'Rapid Tower',
      cost: TOWER_COSTS.RAPID,
      icon: IconType.RAPID_TOWER,
      color: COLOR_THEME.towers.artillery
    },
    {
      type: TowerType.WALL,
      name: 'Wall',
      cost: TOWER_COSTS.WALL,
      icon: IconType.WALL,
      color: COLOR_THEME.towers.wall
    }
  ];
  
  // Tower color mapping
  private readonly towerColorMap: Record<string, string> = {
    'BASIC': 'text-game-tower-basic',
    'SNIPER': 'text-game-tower-sniper',
    'RAPID': 'text-game-tower-rapid',
    'WALL': 'text-game-tower-wall'
  };
  
  constructor(game: Game) {
    super(game, {
      className: 'build-menu-ui',
      width: 300,
      height: 400,
      excludeSelectors: ['.ui-control-bar button', '.ui-button-build']
    });
    console.log('[BuildMenuUI] Constructor called');
  }
  
  /**
   * Show the build menu at specified position.
   * Set the tower select callback before calling this.
   */
  setTowerSelectCallback(callback: (type: TowerType) => void): void {
    console.log('[BuildMenuUI] setTowerSelectCallback called with:', callback);
    this.onTowerSelect = callback;
  }
  
  /**
   * Show the build menu - matches parent signature.
   */
  show(x: number, y: number, anchorElement?: HTMLElement): void {
    // Check if already showing - singleton behavior
    if (this.element) {
      this.element.enable();
      this.updateContent();
      return;
    }
    
    super.show(x, y, anchorElement);
  }
  
  protected getPopupId(): string {
    return 'build-menu-ui';
  }
  
  protected onPopupCreated(): void {
    // Set up periodic updates for currency changes
    this.setupPeriodicUpdate(250);
  }
  
  protected createPopupContent(): HTMLElement {
    console.log('[BuildMenuUI] createPopupContent called, onTowerSelect is:', this.onTowerSelect);
    const content = document.createElement('div');
    content.className = cn('ui-card');
    
    // Title
    const title = document.createElement('h2');
    title.className = cn('ui-dialog-title', 'ui-text-center');
    title.textContent = 'Build Tower';
    content.appendChild(title);
    
    // Tower grid
    const grid = document.createElement('div');
    grid.className = cn('ui-grid', 'cols-2', 'ui-gap-sm', 'ui-mb-md');
    
    const currency = this.game.getCurrency();
    
    // Create tower cards
    this.towers.forEach(tower => {
      const card = this.createTowerCard(tower, currency);
      grid.appendChild(card);
    });
    
    content.appendChild(grid);
    
    // Currency display
    const currencyDisplay = createResourceDisplay({
      value: currency,
      icon: IconType.COINS,
      label: 'Available',
      variant: 'default',
      showLabel: true,
      customClasses: ['ui-flex-center', 'ui-mt-md'],
      id: 'currency-display'
    });
    content.appendChild(currencyDisplay);
    
    // Close hint
    const closeHint = document.createElement('div');
    closeHint.className = cn('ui-text-center', 'ui-text-secondary', 'ui-mt-sm');
    closeHint.textContent = 'Click outside to close';
    content.appendChild(closeHint);
    
    return content;
  }
  
  private createTowerCard(tower: TowerOption, currency: number): HTMLElement {
    const canAfford = currency >= tower.cost;
    
    const card = createClickableCard(() => {
      console.log('[BuildMenuUI] Card clicked, canAfford:', canAfford, 'tower:', tower.type);
      console.log('[BuildMenuUI] onTowerSelect is:', this.onTowerSelect);
      if (canAfford) {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        if (this.onTowerSelect) {
          console.log('[BuildMenuUI] Calling onTowerSelect with:', tower.type);
          this.onTowerSelect(tower.type);
        } else {
          console.log('[BuildMenuUI] ERROR: onTowerSelect is null!');
        }
        this.close();
      }
    }, {
      variant: 'elevated',
      padding: 'sm',
      customClasses: [
        'tower-card',
        'group',
        'hover:-translate-y-0.5',
        'transition-transform',
        ...(canAfford ? [] : ['ui-disabled'])
      ],
      ariaLabel: `Build ${tower.name} for ${tower.cost} coins`
    });
    
    // Data attributes for updates
    card.setAttribute('data-tower-type', tower.type);
    card.setAttribute('data-tower-cost', String(tower.cost));
    if (!canAfford) {
      card.setAttribute('disabled', 'true');
    }
    
    // Tower icon
    const iconWrapper = document.createElement('div');
    const towerColorClass = this.towerColorMap[tower.type] || 'text-primary';
    iconWrapper.className = cn(
      'tower-card-icon',
      'w-12',
      'h-12',
      'mx-auto',
      'mb-2',
      'block',
      'transition-transform',
      'group-hover:scale-110-rotate-5',
      towerColorClass
    );
    iconWrapper.setAttribute('data-tower-type', tower.type);
    iconWrapper.innerHTML = createSvgIcon(tower.icon, { size: 48 });
    card.appendChild(iconWrapper);
    
    // Tower name
    const nameElement = document.createElement('div');
    nameElement.className = cn(
      'tower-card-name',
      'text-base',
      'font-semibold',
      'text-center',
      'mb-2',
      'text-primary',
      'transition-colors',
      'group-hover:text-primary'
    );
    nameElement.textContent = tower.name;
    card.appendChild(nameElement);
    
    // Cost display
    const costDisplay = createCompactResource(tower.cost, IconType.COINS, {
      customClasses: [
        'tower-card-cost',
        'mx-auto',
        'transition-all',
        'group-hover:scale-105',
        'group-hover:bg-black/50'
      ]
    });
    card.appendChild(costDisplay);
    
    return card;
  }
  
  updateContent(): void {
    const state: BuildMenuState = {
      currency: this.game.getCurrency()
    };
    
    this.currencyUpdater.update(state);
    this.updateTowerAffordability(state.currency);
  }
  
  
  
  private updateCurrencyDisplay(currency: number): void {
    if (!this.element) return;
    
    const element = this.element.getElement();
    if (!element) return;
    
    // Update currency display component
    const currencyDisplay = element.querySelector('#currency-display') as any;
    if (currencyDisplay?.updateValue) {
      currencyDisplay.updateValue(currency);
    }
  }
  
  private updateTowerAffordability(currency: number): void {
    if (!this.element) return;
    
    const element = this.element.getElement();
    if (!element) return;
    
    // Update each tower card's affordability
    const towerCards = element.querySelectorAll('.tower-card[data-tower-cost]');
    towerCards.forEach((card) => {
      const cardEl = card as HTMLDivElement;
      const cost = parseInt(cardEl.getAttribute('data-tower-cost') || '0');
      const canAfford = currency >= cost;
      
      // Check if affordability changed
      const wasDisabled = cardEl.hasAttribute('disabled');
      if (wasDisabled !== !canAfford) {
        if (canAfford) {
          cardEl.classList.remove('ui-disabled');
          cardEl.removeAttribute('disabled');
          cardEl.style.pointerEvents = '';
        } else {
          cardEl.classList.add('ui-disabled');
          cardEl.setAttribute('disabled', 'true');
          cardEl.style.pointerEvents = 'none';
        }
        
        // Update aria-label
        const towerName = cardEl.querySelector('.tower-card-name')?.textContent || 'Tower';
        cardEl.setAttribute('aria-label', `Build ${towerName} for ${cost} coins`);
      }
    });
  }
  
  /**
   * Hide the menu (keeps it ready to show again).
   */
  hide(): void {
    if (this.element) {
      this.element.disable();
    }
  }
  
  destroy(): void {
    console.log('[BuildMenuUI] destroy called, NOT clearing callback for singleton reuse');
    // Don't clear the callback - preserve it for singleton reuse
    super.destroy();
  }
}