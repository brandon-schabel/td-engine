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
  
  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
  }

  public show(x: number, y: number, onTowerSelect: (type: TowerType) => void): void {
    this.position = { x, y };
    this.onTowerSelect = onTowerSelect;
    
    if (this.element) {
      this.element.enable();
      this.updateContent();
      return;
    }
    
    this.create();
  }

  private create(): void {
    if (!this.position || !this.onTowerSelect) return;
    
    const elementId = 'build-menu-ui';
    
    this.element = this.floatingUI.create(elementId, 'popup', {
      offset: { x: 0, y: -20 },
      anchor: 'bottom',
      smoothing: 0,
      autoHide: false,
      persistent: true,
      zIndex: 900,
      className: 'build-menu-ui'
    });
    
    // Create a dummy entity at the click position
    const positionEntity = {
      position: this.position,
      getPosition: () => this.position!
    };
    
    this.element.setTarget(positionEntity as Entity);
    this.updateContent();
    this.element.enable();
    
    // Update content periodically to reflect currency changes
    this.updateInterval = window.setInterval(() => {
      this.updateContent();
    }, 500);
    
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

  private updateContent(): void {
    if (!this.element || !this.onTowerSelect) return;

    const content = document.createElement('div');
    content.className = 'ui-card';
    
    content.innerHTML = `
      <h2 class="ui-dialog-title ui-text-center">Build Tower</h2>
      <div class="ui-grid cols-2 ui-gap-sm ui-mb-md"></div>
      <div class="resource-item ui-flex-center">
        ${createSvgIcon(IconType.COINS, { size: 20 })}
        <span class="resource-value">${formatNumber(this.game.getCurrency())}</span>
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

      if (canAfford) {
        button.addEventListener('click', () => {
          this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
          if (this.onTowerSelect) {
            this.onTowerSelect(tower.type);
          }
          this.close();
        });
      }

      grid.appendChild(button);
    });

    this.element.setContent(content);
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
  }
}