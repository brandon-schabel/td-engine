import type { Player } from '@/entities/Player';
import type { Game } from '@/core/Game';
import { BaseDialogUI } from './BaseDialogUI';
import { SoundType } from '@/audio/AudioManager';
import {
  createButton,
  createStatGrid,
  createResourceDisplay,
  createStructuredCard,
  cn,
  type Stat
} from '@/ui/elements';
import { IconType } from '@/ui/icons/SvgIcons';

interface PlayerStats {
  health: number;
  maxHealth: number;
  speed: string;
  currency: number;
}

interface Ability {
  key: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
}

/**
 * Player upgrade UI for managing player stats and abilities.
 * Shows current stats and available upgrades.
 */
export class PlayerUpgradeUI extends BaseDialogUI {
  private player: Player;
  private statsUpdater = this.setupSmartUpdater<PlayerStats>('stats', {
    health: (value) => this.updateHealthDisplay(value),
    maxHealth: (value) => this.updateHealthDisplay(this.player.health, value),
    speed: (value) => this.updateSpeedDisplay(value),
    currency: (value) => this.updateCurrencyDisplay(value)
  });
  
  // UI Elements
  private currencyElement: HTMLElement | null = null;
  private healthElement: HTMLElement | null = null;
  private speedElement: HTMLElement | null = null;
  
  constructor(player: Player, game: Game, screenPos?: { x: number; y: number }, anchorElement?: HTMLElement) {
    // Calculate dialog position
    let position = screenPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    if (screenPos) {
      const controlBarHeight = 60;
      const menuHeight = 500;
      const menuWidth = 400;
      const padding = 10;
      
      position.x = Math.max(
        menuWidth / 2 + padding,
        Math.min(screenPos.x, window.innerWidth - menuWidth / 2 - padding)
      );
      position.y = window.innerHeight - controlBarHeight - menuHeight / 2 - padding;
    }
    
    super(game, {
      title: 'Player Upgrades',
      closeable: true,
      modal: false,
      width: 'min-w-[400px]'
    });
    
    this.player = player;
    
    // Handle positioning if needed
    if (anchorElement) {
      // Will be handled by dialog creation
    }
  }
  
  protected getDialogId(): string {
    return `player-upgrade-${this.player.id}`;
  }
  
  protected onDialogCreated(): void {
    // Set up periodic updates
    this.setupPeriodicUpdate(100);
    
    // Set up click outside exclusions
    this.setupClickOutside(['.ui-control-bar button', '.ui-button-player-upgrade']);
  }
  
  protected createDialogContent(): HTMLElement {
    const dialogContent = document.createElement('div');
    dialogContent.className = cn('p-6', 'space-y-6', 'max-h-[500px]', 'overflow-y-auto');
    
    // Currency display
    this.currencyElement = createResourceDisplay({
      icon: IconType.COINS,
      value: this.game.getCurrency(),
      label: '',
      customClasses: ['mb-4']
    });
    dialogContent.appendChild(this.currencyElement);
    
    // Stats section
    const statsSection = this.createStatsSection();
    dialogContent.appendChild(statsSection);
    
    // Abilities section
    const abilitiesSection = this.createAbilitiesSection();
    dialogContent.appendChild(abilitiesSection);
    
    return dialogContent;
  }
  
  private createStatsSection(): HTMLElement {
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
        value: `${this.player.health}/${this.player.maxHealth}`,
        valueColor: 'success'
      },
      {
        label: 'Shield',
        value: '0/0',
        valueColor: 'primary'
      },
      {
        label: 'Move Speed',
        value: this.player.speed.toFixed(1),
        valueColor: 'warning'
      }
    ];
    
    const statsGrid = createStatGrid(stats, {
      columns: 3,
      customClasses: ['player-stats']
    });
    
    // Store references to stat elements
    const statItems = statsGrid.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
      const valueEl = item.querySelector('.stat-value');
      if (index === 0 && valueEl) this.healthElement = valueEl as HTMLElement;
      if (index === 2 && valueEl) this.speedElement = valueEl as HTMLElement;
      
      // Add data attribute for identification
      const labels = ['health', 'shield', 'speed'];
      if (labels[index]) {
        item.setAttribute('data-stat', labels[index]);
      }
    });
    
    statsSection.appendChild(statsGrid);
    return statsSection;
  }
  
  private createAbilitiesSection(): HTMLElement {
    const abilitiesSection = document.createElement('div');
    abilitiesSection.className = cn('space-y-3');
    
    const abilitiesTitle = document.createElement('h3');
    abilitiesTitle.className = cn('text-lg', 'font-semibold', 'text-primary', 'mb-3');
    abilitiesTitle.textContent = 'ABILITIES';
    abilitiesSection.appendChild(abilitiesTitle);
    
    const upgradeTree = document.createElement('div');
    upgradeTree.className = cn('space-y-3');
    upgradeTree.id = 'ability-tree';
    
    // Initial render of abilities
    this.renderAbilities(upgradeTree);
    
    abilitiesSection.appendChild(upgradeTree);
    return abilitiesSection;
  }
  
  private renderAbilities(container: HTMLElement): void {
    // Clear existing content
    container.innerHTML = '';
    
    // Simplified abilities display
    const abilities: Ability[] = [
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
      const card = this.createAbilityCard(ability, currency);
      container.appendChild(card);
    });
  }
  
  private createAbilityCard(ability: Ability, currency: number): HTMLElement {
    const isMaxLevel = ability.level >= ability.maxLevel;
    const canAfford = currency >= ability.cost;
    const canUpgrade = !isMaxLevel && canAfford;
    
    // Create header
    const headerDiv = document.createElement('div');
    headerDiv.className = cn('flex', 'justify-between', 'items-center', 'mb-2');
    
    const nameSpan = document.createElement('span');
    nameSpan.className = cn('font-medium', 'text-primary');
    nameSpan.textContent = `${ability.name} Level ${ability.level}/${ability.maxLevel}`;
    headerDiv.appendChild(nameSpan);
    
    // Create card
    const card = createStructuredCard({
      header: headerDiv,
      body: ability.description,
      bodyClasses: ['text-secondary'],
      customClasses: [
        'bg-surface-secondary',
        'border',
        isMaxLevel ? 'border-success' : canUpgrade ? 'border-white/20' : 'border-white/10',
        'hover:border-primary',
        'transition-all'
      ]
    });
    
    // Add footer
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
    
    return card;
  }
  
  updateContent(): void {
    const stats: PlayerStats = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      speed: this.player.speed.toFixed(1),
      currency: this.game.getCurrency()
    };
    
    // Update stats with smart updater
    this.statsUpdater.update(stats);
    
    // Update ability affordability
    this.updateAbilityButtons(stats.currency);
  }
  
  private updateHealthDisplay(health: number, maxHealth?: number): void {
    if (this.healthElement) {
      const max = maxHealth ?? this.player.maxHealth;
      this.healthElement.textContent = `${health}/${max}`;
    }
  }
  
  private updateSpeedDisplay(speed: string): void {
    if (this.speedElement) {
      this.speedElement.textContent = speed;
    }
  }
  
  private updateCurrencyDisplay(currency: number): void {
    if (this.currencyElement) {
      const valueEl = this.currencyElement.querySelector('.resource-value');
      if (valueEl) {
        valueEl.textContent = String(currency);
      }
    }
  }
  
  private updateAbilityButtons(currency: number): void {
    if (!this.element) return;
    
    const element = this.element.getElement();
    if (!element) return;
    
    // Update each ability button's state
    const abilityButtons = element.querySelectorAll('[data-ability]');
    abilityButtons.forEach((button) => {
      const btn = button as HTMLButtonElement;
      const cost = parseInt(btn.dataset.cost || '0');
      const canAfford = currency >= cost;
      const isMaxLevel = btn.closest('.border-success') !== null;
      
      if (!isMaxLevel) {
        btn.disabled = !canAfford;
        btn.classList.toggle('disabled', !canAfford);
      }
    });
  }
  
  private handleUpgrade(abilityKey: string): void {
    // TODO: Integrate with actual player ability system when available
    console.log('Upgrading ability:', abilityKey);
    
    // For now, just play sound
    this.game.getAudioManager()?.playUISound(SoundType.UPGRADE);
    
    // Refresh abilities display
    const container = this.element?.getElement()?.querySelector('#ability-tree');
    if (container) {
      this.renderAbilities(container as HTMLElement);
    }
  }
}