import type { Player } from '@/entities/Player';
import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import { FloatingUIManager } from './index';
import { SoundType } from '@/audio/AudioManager';
import { 
  createButton,
  createDialogHeader,
  createStatGrid,
  createResourceDisplay,
  createStructuredCard,
  type Stat
} from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';

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
        className: '',
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
        className: '',
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

    const content = document.createElement('div');
    content.className = cn('bg-surface-primary', 'rounded-lg', 'border', 'border-white/10', 'min-w-[400px]');

    // Create header with close button
    const header = createDialogHeader('Player Upgrades', () => this.close());
    content.appendChild(header);
    
    // Create scrollable content area
    const dialogContent = document.createElement('div');
    dialogContent.className = cn('p-6', 'space-y-6', 'max-h-[500px]', 'overflow-y-auto');
    
    // Create currency display
    const currencyDisplay = createResourceDisplay({
      iconHtml: '💰',
      value: currency,
      label: '',
      customClasses: ['mb-4']
    });
    dialogContent.appendChild(currencyDisplay);
    
    // Create stats section
    const statsSection = document.createElement('div');
    statsSection.className = cn('space-y-3');
    
    const statsTitle = document.createElement('h3');
    statsTitle.className = cn('text-lg', 'font-semibold', 'text-primary', 'mb-3');
    statsTitle.textContent = 'STATS';
    statsSection.appendChild(statsTitle);
    
    // Create stats grid
    const stats: Stat[] = [
      {
        label: 'Health',
        value: `${this.player.health}/${this.player.maxHealth}`
      },
      {
        label: 'Shield',
        value: '0/0'
      },
      {
        label: 'Move Speed',
        value: this.player.speed.toFixed(1)
      }
    ];
    
    const statsGrid = createStatGrid(stats, {
      columns: 3,
      customClasses: ['player-stats']
    });
    
    // Add data-stat attributes to each stat item for easy querying
    const statItems = statsGrid.querySelectorAll('.stat-item');
    const statLabels = ['health', 'shield', 'speed'];
    statItems.forEach((item, index) => {
      if (statLabels[index]) {
        item.setAttribute('data-stat', statLabels[index]);
      }
    });
    
    statsSection.appendChild(statsGrid);
    dialogContent.appendChild(statsSection);
    
    // Create abilities section
    const abilitiesSection = document.createElement('div');
    abilitiesSection.className = cn('space-y-3');
    
    const abilitiesTitle = document.createElement('h3');
    abilitiesTitle.className = cn('text-lg', 'font-semibold', 'text-primary', 'mb-3');
    abilitiesTitle.textContent = 'ABILITIES';
    abilitiesSection.appendChild(abilitiesTitle);
    
    const upgradeTree = document.createElement('div');
    upgradeTree.className = cn('space-y-3');
    
    // Render abilities using DOM elements
    this.renderAbilitiesDOM(upgradeTree);
    
    abilitiesSection.appendChild(upgradeTree);
    dialogContent.appendChild(abilitiesSection);
    
    content.appendChild(dialogContent);
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

  private renderAbilitiesDOM(container: HTMLElement): void {
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

    abilities.forEach(ability => {
      const isMaxLevel = ability.level >= ability.maxLevel;
      const canAfford = currency >= ability.cost;
      const canUpgrade = !isMaxLevel && canAfford;

      // Create the ability card header
      const headerDiv = document.createElement('div');
      headerDiv.className = cn('flex', 'justify-between', 'items-center', 'mb-2');
      
      const nameSpan = document.createElement('span');
      nameSpan.className = cn('font-medium', 'text-primary');
      nameSpan.textContent = `${ability.name}Level ${ability.level}/${ability.maxLevel}`;
      headerDiv.appendChild(nameSpan);
      
      // Create the ability card
      const card = createStructuredCard({
        header: headerDiv,
        body: ability.description,
        customClasses: [
          'bg-surface-secondary',
          'border',
          isMaxLevel ? 'border-success' : canUpgrade ? 'border-white/20' : 'border-white/10',
          'hover:border-primary',
          'transition-all'
        ]
      });

      // Add footer content
      if (!isMaxLevel) {
        const footer = document.createElement('div');
        footer.className = cn('flex', 'justify-between', 'items-center', 'mt-3', 'pt-3', 'border-t', 'border-white/10');
        
        const costSpan = document.createElement('span');
        costSpan.className = cn('text-sm', canAfford ? 'text-success' : 'text-secondary');
        costSpan.textContent = `Cost: ${ability.cost}`;
        footer.appendChild(costSpan);
        
        const upgradeButton = createButton({
          text: 'Upgrade',
          size: 'sm',
          disabled: !canUpgrade,
          onClick: () => this.handleUpgrade(ability.key)
        });
        upgradeButton.dataset.ability = ability.key;
        upgradeButton.dataset.cost = String(ability.cost);
        footer.appendChild(upgradeButton);
        
        card.appendChild(footer);
      } else {
        const maxLevelText = document.createElement('div');
        maxLevelText.className = cn('text-center', 'mt-3', 'text-success', 'text-sm', 'font-medium');
        maxLevelText.textContent = 'Max Level';
        card.appendChild(maxLevelText);
      }

      container.appendChild(card);
    });
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