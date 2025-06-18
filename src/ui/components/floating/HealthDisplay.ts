import { FloatingDisplay } from './FloatingDisplay';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';

export class HealthDisplay extends FloatingDisplay {
  constructor(game: Game) {
    super({
      position: { top: 55, left: 10 },
      borderColor: '#FF4444',
      textColor: '#FF4444',
      iconType: IconType.HEART,
      getValue: () => {
        const player = game.getPlayer();
        if (!player) return { value: '0/0', color: '#FF4444' };
        
        const health = Math.max(0, player.health);
        const maxHealth = player.maxHealth;
        const healthPercent = (health / maxHealth) * 100;
        
        // Determine color based on health percentage
        let color = '#4CAF50'; // Green
        if (healthPercent <= 25) {
          color = '#FF4444'; // Red
        } else if (healthPercent <= 50) {
          color = '#FF9800'; // Orange
        }
        
        return {
          value: `${health}/${maxHealth}`,
          color
        };
      }
    });
  }
}