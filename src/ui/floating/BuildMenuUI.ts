/**
 * Recent changes:
 * - Refactored to use new UI element abstractions (createClickableCard, createCompactResource)
 * - Using cn() helper for className assignments
 * - Removed hardcoded class strings in favor of utility classes
 * - Improved tower card creation with structured components
 * - Enhanced cost display with currency icon using createCompactResource
 */

import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { TowerType } from '@/entities/Tower';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { COLOR_THEME } from '@/config/ColorTheme';
import { TOWER_COSTS } from '@/config/GameConfig';
import { 
  createClickableCard,
  createCompactResource,
  createResourceDisplay
} from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';

export class BuildMenuUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private onTowerSelect: ((type: TowerType) => void) | null = null;
  private updateInterval: number | null = null;
  private position: { x: number; y: number } | null = null;
  private contentInitialized: boolean = false;
  private lastCurrency: number = -1;
  
  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
  }

  public show(x: number, y: number, onTowerSelect: (type: TowerType) => void, anchorElement?: HTMLElement): void {
    // x, y are screen coordinates
    this.position = { x, y };
    this.onTowerSelect = onTowerSelect;
    
    if (this.element) {
      // If anchor element is provided, update options
      if (anchorElement) {
        this.element.setOptions({
          anchorElement,
          anchor: 'top',
          offset: { x: 0, y: -10 }
        });
      } else {
        // Fallback to position-based approach
        const positionEntity = {
          x,
          y: y - 10, // Position above the button
          position: { x, y: y - 10 },
          getPosition: () => ({ x, y: y - 10 })
        };
        this.element.setTarget(positionEntity as unknown as Entity);
      }
      this.element.enable();
      // Only update dynamic values for existing content
      this.updateDynamicValues();
      return;
    }
    
    this.create(anchorElement);
  }

  private create(anchorElement?: HTMLElement): void {
    if (!this.position || !this.onTowerSelect) return;
    
    const elementId = 'build-menu-ui';
    
    if (anchorElement) {
      // Use DOM element anchoring
      this.element = this.floatingUI.create(elementId, 'popup', {
        anchorElement,
        anchor: 'top',
        offset: { x: 0, y: -10 },
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 900,
        className: 'build-menu-ui',
        screenSpace: true
      });
    } else {
      // Fallback to position-based approach
      this.element = this.floatingUI.create(elementId, 'popup', {
        offset: { x: 0, y: -10 },
        anchor: 'bottom',
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 900,
        className: 'build-menu-ui',
        screenSpace: true
      });
      
      // Create a dummy entity with screen coordinates
      const positionEntity = {
        position: { x: this.position.x, y: this.position.y - 10 },
        getPosition: () => ({ x: this.position!.x, y: this.position!.y - 10 })
      };
      
      this.element.setTarget(positionEntity as unknown as Entity);
    }
    
    this.createInitialContent();
    this.element.enable();
    
    // Update only dynamic values periodically
    this.updateInterval = window.setInterval(() => {
      this.updateDynamicValues();
    }, 250);
    
    // Close on click outside
    setTimeout(() => {
      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.build-menu-ui')) {
          this.close();
          document.removeEventListener('click', clickHandler);
        }
      };
      document.addEventListener('click', clickHandler);
    }, 100);
  }

  private createInitialContent(): void {
    if (!this.element || !this.onTowerSelect) return;

    const content = document.createElement('div');
    content.className = cn('ui-card');
    
    // Create title
    const title = document.createElement('h2');
    title.className = cn('ui-dialog-title', 'ui-text-center');
    title.textContent = 'Build Tower';
    content.appendChild(title);
    
    // Create tower grid
    const grid = document.createElement('div');
    grid.className = cn('ui-grid', 'cols-2', 'ui-gap-sm', 'ui-mb-md');
    content.appendChild(grid);

    const towers = [
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

    const currency = this.game.getCurrency();

    towers.forEach(tower => {
      const canAfford = currency >= tower.cost;
      
      // Create clickable card for the tower
      const card = createClickableCard(() => {
        if (canAfford) {
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          if (this.onTowerSelect) {
            this.onTowerSelect(tower.type);
          }
          this.close();
        }
      }, {
        variant: 'elevated',
        padding: 'sm',
        customClasses: [
          'tower-card',
          'group',
          'ui-shimmer',
          'hover:-translate-y-0.5',
          'transition-transform',
          ...(canAfford ? [] : ['ui-disabled'])
        ],
        ariaLabel: `Build ${tower.name} for ${tower.cost} coins`
      });
      
      // Add data attributes for styling and state tracking
      card.setAttribute('data-tower-type', tower.type);
      card.setAttribute('data-tower-cost', String(tower.cost));
      if (!canAfford) {
        card.setAttribute('disabled', 'true');
      }
      
      // Create tower icon
      const iconWrapper = document.createElement('div');
      // Map tower types to specific color classes
      const towerColorMap: Record<string, string> = {
        'BASIC': 'text-game-tower-basic',
        'SNIPER': 'text-game-tower-sniper',
        'RAPID': 'text-game-tower-rapid',
        'WALL': 'text-game-tower-wall'
      };
      const towerColorClass = towerColorMap[tower.type] || 'text-primary';
      
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
      
      // Create tower name
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
      
      // Create cost display using createCompactResource
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

      grid.appendChild(card);
    });

    // Create available currency display
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
    
    // Create close hint
    const closeHint = document.createElement('div');
    closeHint.className = cn('ui-text-center', 'ui-text-secondary', 'ui-mt-sm');
    closeHint.textContent = 'Click outside to close';
    content.appendChild(closeHint);
    
    this.element.setContent(content);
    
    this.contentInitialized = true;
    this.lastCurrency = currency;
  }

  private updateDynamicValues(): void {
    if (!this.element || !this.contentInitialized) return;

    const element = this.element.getElement();
    if (!element) return;

    const currency = this.game.getCurrency();

    // Only update if currency changed
    if (currency === this.lastCurrency) return;

    // Update currency display using the ResourceDisplay's update method
    const currencyDisplay = element.querySelector('#currency-display') as any;
    if (currencyDisplay && currencyDisplay.updateValue) {
      currencyDisplay.updateValue(currency);
    }

    // Update tower card states
    const towerCards = element.querySelectorAll('.tower-card[data-tower-cost]');
    towerCards.forEach((card) => {
      const cardEl = card as HTMLDivElement;
      const cost = parseInt(cardEl.getAttribute('data-tower-cost') || '0');
      const canAfford = currency >= cost;
      
      // Only update if affordability changed
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

    this.lastCurrency = currency;
  }

  public hide(): void {
    if (this.element) {
      this.element.disable();
    }
  }

  public close(): void {
    this.destroy();
  }

  public destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }
    
    this.position = null;
    this.onTowerSelect = null;
    this.contentInitialized = false;
    this.lastCurrency = -1;
  }
}