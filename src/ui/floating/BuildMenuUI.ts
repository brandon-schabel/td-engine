/**
 * Recent changes:
 * - Fully integrated with centralized StyleManager and design token system
 * - Removed all inline styles including icon colors
 * - Now uses semantic CSS classes exclusively
 * - Tower types now use data attributes for styling
 * - Improved accessibility with ARIA labels
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
import { formatNumber } from '@/utils/formatters';

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
    content.className = 'ui-card';
    
    content.innerHTML = `
      <h2 class="ui-dialog-title ui-text-center">Build Tower</h2>
      <div class="ui-grid cols-2 ui-gap-sm ui-mb-md"></div>
      <div class="resource-item ui-flex-center">
        ${createSvgIcon(IconType.COINS, { size: 20 })}
        <span class="resource-value" data-update="currency">${formatNumber(this.game.getCurrency())}</span>
        <span class="ui-text-secondary">Available</span>
      </div>
      <div class="ui-text-center ui-text-secondary ui-mt-sm">Click outside to close</div>
    `;

    const grid = content.querySelector('.ui-grid');
    if (!grid) return;

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
      const button = document.createElement('button');
      button.className = `tower-card ${!canAfford ? 'disabled' : ''}`;
      button.disabled = !canAfford;
      button.setAttribute('data-tower-type', tower.type);
      button.setAttribute('data-tower-cost', String(tower.cost));
      button.setAttribute('aria-label', `Build ${tower.name} for ${tower.cost} coins`);

      button.innerHTML = `
        <div class="tower-card-icon" data-tower-type="${tower.type}">
          ${createSvgIcon(tower.icon, { size: 48 })}
        </div>
        <div class="tower-card-name">${tower.name}</div>
        <div class="tower-card-cost">
          ${createSvgIcon(IconType.COINS, { size: 16 })}
          <span>${formatNumber(tower.cost)}</span>
        </div>
      `;

      // Event handlers will be attached via delegation

      grid.appendChild(button);
    });

    this.element.setContent(content);
    
    // Set up delegated event handling for tower buttons
    const handleTowerClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.tower-card:not(.disabled)') as HTMLButtonElement;
      
      if (button && !button.disabled) {
        const towerType = button.getAttribute('data-tower-type') as TowerType;
        if (towerType) {
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          if (this.onTowerSelect) {
            this.onTowerSelect(towerType);
          }
          this.close();
        }
      }
    };
    
    content.addEventListener('click', handleTowerClick);
    content.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.tower-card:not(.disabled)')) {
        e.preventDefault(); // Prevent ghost click
        handleTowerClick(e);
      }
    });
    
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

    // Update currency display
    const currencyElement = element.querySelector('.resource-value[data-update="currency"]');
    if (currencyElement) {
      currencyElement.textContent = formatNumber(currency);
    }

    // Update tower button states
    const towerButtons = element.querySelectorAll('.tower-card[data-tower-cost]');
    towerButtons.forEach((button) => {
      const buttonEl = button as HTMLButtonElement;
      const cost = parseInt(buttonEl.getAttribute('data-tower-cost') || '0');
      const canAfford = currency >= cost;
      
      // Only update if affordability changed
      const wasDisabled = buttonEl.disabled;
      if (wasDisabled !== !canAfford) {
        buttonEl.disabled = !canAfford;
        if (canAfford) {
          buttonEl.classList.remove('disabled');
        } else {
          buttonEl.classList.add('disabled');
        }
        
        // Update aria-label
        const towerName = buttonEl.querySelector('.tower-card-name')?.textContent || 'Tower';
        buttonEl.setAttribute('aria-label', `Build ${towerName} for ${cost} coins`);
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