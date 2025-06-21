import type { Player } from '@/entities/Player';
import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { SoundType } from '@/audio/AudioManager';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';

export class PlayerUpgradeUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private player: Player;
  private game: Game;
  private updateInterval: number | null = null;
  private contentInitialized = false;
  private lastCurrency = -1;
  private lastStats: any = {};
  private screenPos?: { x: number; y: number };
  private anchorElement?: HTMLElement;

  constructor(player: Player, game: Game, screenPos?: { x: number; y: number }, anchorElement?: HTMLElement) {
    this.floatingUI = game.getFloatingUIManager();
    this.player = player;
    this.game = game;
    this.screenPos = screenPos;
    this.anchorElement = anchorElement;
    this.create();
  }

  private create(): void {
    const elementId = `player-upgrade-${this.player.id}`;

    if (this.anchorElement) {
      // Use DOM element anchoring
      this.element = this.floatingUI.create(elementId, 'dialog', {
        anchorElement: this.anchorElement,
        anchor: 'top',
        offset: { x: 0, y: -10 },
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 1000,
        className: 'player-upgrade-ui',
        screenSpace: true
      });
    } else {
      // Fallback to position-based approach
      let position = this.screenPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      // If we have a screen position (from button), position above control bar
      if (this.screenPos) {
        const controlBarHeight = 60;
        const menuHeight = 500; // Approximate height
        const menuWidth = 400; // Approximate width
        const padding = 10;

        // Center horizontally on the button, constrain to screen
        position.x = Math.max(
          menuWidth / 2 + padding,
          Math.min(this.screenPos.x, window.innerWidth - menuWidth / 2 - padding)
        );

        // Position above control bar
        position.y = window.innerHeight - controlBarHeight - menuHeight / 2 - padding;
      }

      this.element = this.floatingUI.create(elementId, 'dialog', {
        offset: { x: 0, y: 0 },
        anchor: 'center',
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 1000,
        className: 'player-upgrade-ui',
        screenSpace: true
      });

      // Set target position
      const positionEntity = {
        position: position,
        getPosition: () => position
      };

      this.element.setTarget(positionEntity as unknown as Entity);
    }

    this.updateContent();
    this.element.enable();

    // Update content periodically
    this.updateInterval = window.setInterval(() => {
      this.updateContent();
    }, 100);
  }

  private updateContent(): void {
    if (!this.element) return;

    // Only create the full content on first render
    if (!this.contentInitialized) {
      this.createInitialContent();
      this.contentInitialized = true;
    }

    // Perform smart updates for dynamic values
    this.updateDynamicValues();
  }

  private createInitialContent(): void {
    const currency = this.game.getCurrency();
    // const abilities = this.player.getAbilityManager(); // Not used in this method

    const content = document.createElement('div');
    content.className = 'ui-dialog';
    content.innerHTML = `
      <div class="ui-dialog-header">
        <h2 class="ui-dialog-title">Player Upgrades</h2>
        <button class="ui-button small ui-button-close" aria-label="Close upgrades">✕</button>
      </div>
      
      <div class="ui-dialog-content ui-scrollable">
        <div class="resource-item ui-mb-md">
          <span>💰</span>
          <span class="resource-value">${currency}</span>
          <span class="ui-text-secondary">Currency</span>
        </div>
        
        <div class="ui-mb-lg">
          <h3 class="ui-dialog-title ui-font-base ui-mb-md">Stats</h3>
          <div class="player-stats">
            <div class="stat-item" data-stat="health">
              <span class="stat-label">Health</span>
              <span class="stat-value">${this.player.health}/${this.player.maxHealth}</span>
            </div>
            <div class="stat-item" data-stat="shield">
              <span class="stat-label">Shield</span>
              <span class="stat-value">0/0</span>
            </div>
            <div class="stat-item" data-stat="speed">
              <span class="stat-label">Move Speed</span>
              <span class="stat-value">${this.player.speed.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="ui-dialog-title ui-font-base ui-mb-md">Abilities</h3>
          <div class="upgrade-tree">
            ${this.renderAbilities()}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeButton = content.querySelector('.ui-button-close');
    if (closeButton) {
      addClickAndTouchSupport(closeButton as HTMLElement, () => this.close());
    }

    // Add upgrade button listeners
    const upgradeButtons = content.querySelectorAll('[data-ability]');
    upgradeButtons.forEach((button) => {
      addClickAndTouchSupport(button as HTMLElement, () => {
        const target = button as HTMLButtonElement;
        const abilityType = target.dataset.ability;
        if (abilityType) {
          this.handleUpgrade(abilityType);
        }
      });
    });

    this.element!.setContent(content);
  }

  private updateDynamicValues(): void {
    const element = this.element?.getElement();
    if (!element) return;

    const currency = this.game.getCurrency();

    // Only update currency if it changed
    if (currency !== this.lastCurrency) {
      const currencyElement = element.querySelector('.resource-value');
      if (currencyElement) {
        currencyElement.textContent = String(currency);
      }
      this.lastCurrency = currency;
    }

    // Update player stats
    const currentStats = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      speed: this.player.speed.toFixed(1)
    };

    // Update health if changed
    if (currentStats.health !== this.lastStats.health || currentStats.maxHealth !== this.lastStats.maxHealth) {
      const healthElement = element.querySelector('[data-stat="health"] .stat-value');
      if (healthElement) {
        healthElement.textContent = `${currentStats.health}/${currentStats.maxHealth}`;
      }
    }

    // Update speed if changed
    if (currentStats.speed !== this.lastStats.speed) {
      const speedElement = element.querySelector('[data-stat="speed"] .stat-value');
      if (speedElement) {
        speedElement.textContent = currentStats.speed;
      }
    }

    this.lastStats = currentStats;

    // Update ability buttons (only if element exists)
    if (!element) return;

    // Update ability buttons
    const abilityButtons = element.querySelectorAll('[data-ability]');
    abilityButtons.forEach((button) => {
      const btn = button as HTMLButtonElement;
      const cost = parseInt(btn.dataset.cost || '0');
      const canAfford = currency >= cost;
      const isMaxLevel = btn.closest('.upgrade-node')?.classList.contains('unlocked');

      if (!isMaxLevel) {
        btn.disabled = !canAfford;
        btn.classList.toggle('disabled', !canAfford);
      }
    });
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
        <div class="upgrade-node ${isMaxLevel ? 'unlocked' : canUpgrade ? '' : 'locked'}">
          <div class="ui-flex-between ui-mb-xs">
            <span class="upgrade-name">${ability.name}</span>
            <span class="ui-text-success">Level ${ability.level}/${ability.maxLevel}</span>
          </div>
          <div class="upgrade-description">${ability.description}</div>
          ${!isMaxLevel ? `
            <div class="ui-flex-between ui-mt-sm">
              <span class="upgrade-cost">Cost: ${ability.cost}</span>
              <button class="ui-button small" data-ability="${ability.key}" data-cost="${ability.cost}" ${!canUpgrade ? 'disabled' : ''}>
                Upgrade
              </button>
            </div>
          ` : '<div class="ui-text-center ui-mt-sm ui-text-success">Max Level</div>'}
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