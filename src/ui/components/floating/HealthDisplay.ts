import { FloatingDisplay } from './FloatingDisplay';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export class HealthDisplay extends FloatingDisplay {
  constructor(game: Game) {
    super({
      position: { top: UI_CONSTANTS.hud.padding + 45, left: UI_CONSTANTS.hud.padding },
      borderColor: COLOR_THEME.ui.text.danger,
      textColor: COLOR_THEME.ui.text.danger,
      iconType: IconType.HEART,
      getValue: () => {
        const player = game.getPlayer();
        if (!player) return { value: '0/0', color: COLOR_THEME.ui.text.danger };
        
        const health = Math.max(0, player.health);
        const maxHealth = player.maxHealth;
        const healthPercent = (health / maxHealth) * 100;
        
        // Determine color based on health percentage
        let color = COLOR_THEME.ui.text.success; // Green
        if (healthPercent <= 25) {
          color = COLOR_THEME.ui.text.danger; // Red
        } else if (healthPercent <= 50) {
          color = COLOR_THEME.ui.text.warning; // Orange
        }
        
        return {
          value: `${health}/${maxHealth}`,
          color
        };
      }
    });
  }
}