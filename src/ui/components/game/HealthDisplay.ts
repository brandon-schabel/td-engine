import { Game } from '@/core/Game';
import { IconType } from '@/ui/icons/SvgIcons';
import { FloatingUIElement } from './FloatingUIElement';

export class HealthDisplay extends FloatingUIElement {
  private game: Game;

  constructor(game: Game) {
    super({
      id: 'health-display',
      position: { top: 55, left: 10 },
      borderColor: '#FF4444',
      icon: IconType.HEART,
      iconSize: 20,
      onUpdate: (element) => this.updateHealth()
    });
    
    this.game = game;
    this.updateHealth();
  }

  private updateHealth(): void {
    const player = this.game.getPlayer();
    if (player) {
      const health = Math.max(0, player.health);
      const maxHealth = player.maxHealth;
      const healthPercent = (health / maxHealth) * 100;
      
      // Update color based on health percentage
      let color = '#4CAF50'; // Green
      if (healthPercent <= 25) {
        color = '#FF4444'; // Red
      } else if (healthPercent <= 50) {
        color = '#FF9800'; // Orange
      }
      
      this.setBorderColor(color);
      this.setContent(`${health}/${maxHealth}`);
    }
  }
}