import { Game } from '@/core/Game';
import { CollectibleType } from '@/entities/items/ItemTypes';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export class PowerUpDisplay {
  private container: HTMLElement | null = null;
  private game: Game;
  private updateInterval: number | null = null;

  constructor(options: { game: Game; visible?: boolean }) {
    this.game = options.game;
  }

  mount(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    parent.appendChild(this.container);

    // Start updating
    this.updateInterval = window.setInterval(() => this.update(), 100);
  }

  private update(): void {
    if (!this.container) return;

    const player = this.game.getPlayer();
    const activePowerUps = player.getActivePowerUps();
    
    // Clear existing display
    this.container.innerHTML = '';
    
    // Display each active power-up
    activePowerUps.forEach((duration, type) => {
      const powerUpEl = document.createElement('div');
      powerUpEl.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 12px;
      `;
      
      // Get icon for power-up type
      const iconType = this.getPowerUpIcon(type);
      const icon = createSvgIcon(iconType, { size: 20 });
      
      // Calculate remaining time
      const remainingTime = Math.ceil(duration / 1000);
      
      powerUpEl.innerHTML = `
        ${icon}
        <span>${this.getPowerUpName(type)}</span>
        <span style="color: #FFD700;">${remainingTime}s</span>
      `;
      
      this.container.appendChild(powerUpEl);
    });
  }

  private getPowerUpIcon(type: string): IconType {
    const iconMap: Record<string, IconType> = {
      'EXTRA_DAMAGE': IconType.DAMAGE,
      'SPEED_BOOST': IconType.SPEED,
      'FASTER_SHOOTING': IconType.FIRE_RATE,
      'SHIELD': IconType.SHIELD,
      'EXTRA_CURRENCY': IconType.COIN,
      'HEALTH': IconType.HEALTH
    };
    return iconMap[type] || IconType.POWERUP;
  }

  private getPowerUpName(type: string): string {
    const nameMap: Record<string, string> = {
      'EXTRA_DAMAGE': 'Extra Damage',
      'SPEED_BOOST': 'Speed Boost',
      'FASTER_SHOOTING': 'Rapid Fire',
      'SHIELD': 'Shield',
      'EXTRA_CURRENCY': 'Extra Currency',
      'HEALTH': 'Health Boost'
    };
    return nameMap[type] || 'Power-Up';
  }

  cleanup(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}