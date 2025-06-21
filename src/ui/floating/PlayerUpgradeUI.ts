import type { Player } from '@/entities/Player';
import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { SoundType } from '@/audio/AudioManager';

export class PlayerUpgradeUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private player: Player;
  private game: Game;
  private updateInterval: number | null = null;

  constructor(player: Player, game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.player = player;
    this.game = game;
    this.create();
  }

  private create(): void {
    const elementId = `player-upgrade-${this.player.id}`;
    
    this.element = this.floatingUI.create(elementId, 'dialog', {
      offset: { x: 0, y: 0 },
      anchor: 'center',
      smoothing: 0,
      autoHide: false,
      persistent: true,
      zIndex: 1000,
      className: 'player-upgrade-ui'
    });
    
    // Set target to center of screen
    const centerEntity = {
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      getPosition: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    };
    
    this.element.setTarget(centerEntity as Entity);
    this.updateContent();
    this.element.enable();
    
    // Update content periodically
    this.updateInterval = window.setInterval(() => {
      this.updateContent();
    }, 100);
  }

  private updateContent(): void {
    if (!this.element) return;

    const currency = this.game.getCurrency();
    // const abilities = this.player.getAbilityManager(); // Not used in this method

    const content = document.createElement('div');
    content.className = 'player-upgrade-content';
    content.innerHTML = `
      <style>
        .player-upgrade-content {
          padding: ${UI_CONSTANTS.spacing.lg}px;
          background: ${COLOR_THEME.ui.background.secondary};
          border: 2px solid ${COLOR_THEME.ui.border.default};
          border-radius: 8px;
          min-width: 400px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .player-upgrade-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${UI_CONSTANTS.spacing.lg}px;
        }
        
        .player-upgrade-title {
          font-size: 20px;
          font-weight: bold;
          color: ${COLOR_THEME.ui.text.primary};
        }
        
        .player-upgrade-close {
          background: ${COLOR_THEME.ui.button.danger};
          color: white;
          border: none;
          padding: ${UI_CONSTANTS.spacing.sm}px ${UI_CONSTANTS.spacing.md}px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .player-upgrade-close:hover {
          opacity: 0.8;
        }
        
        .player-upgrade-section {
          margin-bottom: ${UI_CONSTANTS.spacing.lg}px;
        }
        
        .player-upgrade-section-title {
          font-size: 18px;
          font-weight: bold;
          color: ${COLOR_THEME.ui.text.secondary};
          margin-bottom: ${UI_CONSTANTS.spacing.md}px;
        }
        
        .player-stat {
          display: flex;
          justify-content: space-between;
          padding: ${UI_CONSTANTS.spacing.sm}px 0;
          border-bottom: 1px solid ${COLOR_THEME.ui.border};
        }
        
        .player-stat-name {
          color: ${COLOR_THEME.ui.text.secondary};
        }
        
        .player-stat-value {
          color: ${COLOR_THEME.ui.text.primary};
          font-weight: bold;
        }
        
        .ability-card {
          background: ${COLOR_THEME.ui.background.primary};
          border: 1px solid ${COLOR_THEME.ui.border.default};
          border-radius: 6px;
          padding: ${UI_CONSTANTS.spacing.md}px;
          margin-bottom: ${UI_CONSTANTS.spacing.md}px;
        }
        
        .ability-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${UI_CONSTANTS.spacing.sm}px;
        }
        
        .ability-name {
          font-weight: bold;
          color: ${COLOR_THEME.ui.text.primary};
        }
        
        .ability-level {
          color: ${COLOR_THEME.ui.text.success};
        }
        
        .ability-description {
          color: ${COLOR_THEME.ui.text.secondary};
          font-size: 14px;
          margin-bottom: ${UI_CONSTANTS.spacing.sm}px;
        }
        
        .ability-upgrade {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: ${UI_CONSTANTS.spacing.sm}px;
        }
        
        .ability-cost {
          color: ${COLOR_THEME.ui.text.warning};
          font-weight: bold;
        }
        
        .upgrade-button {
          background: ${COLOR_THEME.ui.button.primary};
          color: white;
          border: none;
          padding: ${UI_CONSTANTS.spacing.sm}px ${UI_CONSTANTS.spacing.md}px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .upgrade-button:hover:not(:disabled) {
          opacity: 0.8;
        }
        
        .upgrade-button:disabled {
          background: ${COLOR_THEME.ui.button.secondary};
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .currency-display {
          color: ${COLOR_THEME.ui.text.warning};
          font-weight: bold;
          font-size: 16px;
        }
      </style>
      
      <div class="player-upgrade-header">
        <h2 class="player-upgrade-title">Player Upgrades</h2>
        <button class="player-upgrade-close">✕</button>
      </div>
      
      <div class="player-upgrade-section">
        <div class="currency-display">💰 Currency: ${currency}</div>
      </div>
      
      <div class="player-upgrade-section">
        <h3 class="player-upgrade-section-title">Stats</h3>
        <div class="player-stat">
          <span class="player-stat-name">Health</span>
          <span class="player-stat-value">${this.player.health}/${this.player.maxHealth}</span>
        </div>
        <div class="player-stat">
          <span class="player-stat-name">Shield</span>
          <span class="player-stat-value">0/0</span>
        </div>
        <div class="player-stat">
          <span class="player-stat-name">Move Speed</span>
          <span class="player-stat-value">${this.player.speed.toFixed(1)}</span>
        </div>
      </div>
      
      <div class="player-upgrade-section">
        <h3 class="player-upgrade-section-title">Abilities</h3>
        ${this.renderAbilities()}
      </div>
    `;

    // Add event listeners
    const closeButton = content.querySelector('.player-upgrade-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }

    // Add upgrade button listeners
    const upgradeButtons = content.querySelectorAll('.upgrade-button');
    upgradeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const abilityType = target.dataset.ability;
        if (abilityType) {
          this.handleUpgrade(abilityType);
        }
      });
    });

    this.element.setContent(content);
  }

  private renderAbilities(): string {
    // Simplified abilities display for now
    // TODO: Integrate with actual player ability system when available
    const abilities = [
      {
        key: 'heal',
        name: 'Heal',
        description: 'Restore health instantly',
        level: 0,
        maxLevel: 3,
        cost: 100
      },
      {
        key: 'regeneration', 
        name: 'Regeneration',
        description: 'Passive health regeneration',
        level: 0,
        maxLevel: 3,
        cost: 150
      }
    ];
    
    const currency = this.game.getCurrency();
    
    return abilities.map(ability => {
      const isMaxLevel = ability.level >= ability.maxLevel;
      const canAfford = currency >= ability.cost;
      const canUpgrade = !isMaxLevel && canAfford;
      
      return `
        <div class="ability-card">
          <div class="ability-header">
            <span class="ability-name">${ability.name}</span>
            <span class="ability-level">Level ${ability.level}/${ability.maxLevel}</span>
          </div>
          <div class="ability-description">${ability.description}</div>
          ${!isMaxLevel ? `
            <div class="ability-upgrade">
              <span class="ability-cost">Cost: ${ability.cost}</span>
              <button class="upgrade-button" data-ability="${ability.key}" ${!canUpgrade ? 'disabled' : ''}>
                Upgrade
              </button>
            </div>
          ` : '<div class="ability-upgrade"><span class="ability-cost">Max Level</span></div>'}
        </div>
      `;
    }).join('');
  }

  // Not used in simplified version
  /*
  private getEffectValue(abilityKey: string, level: number): string {
    if (level === 0) return 'Not unlocked';
    
    // Simplified effect values for now
    switch (abilityKey) {
      case 'heal':
        return `${30 + (level - 1) * 10} health`;
      case 'regeneration':
        return `${1 + (level - 1) * 1.5} HP/s`;
      default:
        return `Level ${level}`;
    }
  }
  */

  private handleUpgrade(_abilityType: string): void {
    // const abilities = this.player.getAbilityManager();
    // const result = abilities.upgradeAbility(abilityType);
    const result = { success: false, error: 'Abilities not implemented' };
    
    if (result.success) {
      this.game.getAudioManager()?.playUISound(SoundType.UPGRADE);
      this.updateContent();
    } else {
      console.warn('Failed to upgrade ability:', result.error);
    }
  }

  private close(): void {
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
  }
}