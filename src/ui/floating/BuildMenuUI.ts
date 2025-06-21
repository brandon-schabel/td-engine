import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { TowerType } from '@/entities/Tower';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { TOWER_COSTS } from '@/config/GameConfig';
import { formatNumber } from '@/utils/formatters';
import { isMobile } from '@/config/ResponsiveConfig';

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
    content.className = 'build-menu-content';
    
    // Add styles
    content.innerHTML = `
      <style>
        .build-menu-content {
          padding: ${UI_CONSTANTS.spacing.lg}px;
          background: ${COLOR_THEME.ui.background.secondary}f0;
          border: 2px solid ${COLOR_THEME.ui.border.default};
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          min-width: ${isMobile(window.innerWidth) ? '280px' : '320px'};
        }
        
        .build-menu-title {
          margin: 0 0 ${UI_CONSTANTS.spacing.lg}px 0;
          color: ${COLOR_THEME.ui.text.primary};
          text-align: center;
          font-size: ${isMobile(window.innerWidth) ? '20px' : '24px'};
          font-weight: bold;
        }
        
        .build-menu-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: ${UI_CONSTANTS.spacing.md}px;
          margin-bottom: ${UI_CONSTANTS.spacing.lg}px;
        }
        
        .tower-option {
          padding: ${UI_CONSTANTS.spacing.md}px;
          background: ${COLOR_THEME.ui.background.primary};
          border: 2px solid ${COLOR_THEME.ui.border.default};
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: ${UI_CONSTANTS.spacing.sm}px;
        }
        
        .tower-option:hover:not(:disabled) {
          transform: scale(1.05);
          border-color: ${COLOR_THEME.ui.text.success};
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
        }
        
        .tower-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(100, 100, 100, 0.3);
        }
        
        .tower-icon {
          width: ${isMobile(window.innerWidth) ? '40px' : '48px'};
          height: ${isMobile(window.innerWidth) ? '40px' : '48px'};
        }
        
        .tower-name {
          color: ${COLOR_THEME.ui.text.primary};
          font-weight: bold;
          font-size: ${isMobile(window.innerWidth) ? '12px' : '14px'};
          text-align: center;
        }
        
        .tower-cost {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: ${isMobile(window.innerWidth) ? '11px' : '12px'};
        }
        
        .tower-cost.affordable {
          color: ${COLOR_THEME.ui.currency};
        }
        
        .tower-cost.unaffordable {
          color: ${COLOR_THEME.ui.text.danger};
        }
        
        .currency-display {
          text-align: center;
          padding: ${UI_CONSTANTS.spacing.md}px;
          background: rgba(255, 215, 0, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(255, 215, 0, 0.3);
        }
        
        .currency-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${UI_CONSTANTS.spacing.sm}px;
        }
        
        .currency-amount {
          font-size: ${isMobile(window.innerWidth) ? '16px' : '18px'};
          font-weight: bold;
          color: #FFD700;
        }
        
        .currency-label {
          color: #ccc;
          font-size: ${isMobile(window.innerWidth) ? '12px' : '14px'};
        }
        
        .close-hint {
          text-align: center;
          margin-top: ${UI_CONSTANTS.spacing.md}px;
          font-size: 11px;
          color: ${COLOR_THEME.ui.text.secondary};
          font-style: italic;
        }
      </style>
      
      <h2 class="build-menu-title">Build Tower</h2>
      <div class="build-menu-grid"></div>
      <div class="currency-display">
        <div class="currency-content">
          ${createSvgIcon(IconType.COINS, { size: 20 })}
          <span class="currency-amount">${formatNumber(this.game.getCurrency())}</span>
          <span class="currency-label">Available</span>
        </div>
      </div>
      <div class="close-hint">Click outside to close</div>
    `;

    const grid = content.querySelector('.build-menu-grid');
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
      const button = document.createElement('button');
      button.className = 'tower-option';
      const canAfford = currency >= tower.cost;
      button.disabled = !canAfford;

      const iconDiv = document.createElement('div');
      iconDiv.className = 'tower-icon';
      iconDiv.style.color = tower.color;
      iconDiv.innerHTML = createSvgIcon(tower.icon, { size: isMobile(window.innerWidth) ? 40 : 48 });
      button.appendChild(iconDiv);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'tower-name';
      nameDiv.textContent = tower.name;
      button.appendChild(nameDiv);

      const costDiv = document.createElement('div');
      costDiv.className = `tower-cost ${canAfford ? 'affordable' : 'unaffordable'}`;
      costDiv.innerHTML = `${createSvgIcon(IconType.COINS, { size: 16 })} ${formatNumber(tower.cost)}`;
      button.appendChild(costDiv);

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