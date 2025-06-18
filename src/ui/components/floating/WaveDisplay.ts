import { FloatingDisplay } from './FloatingDisplay';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export class WaveDisplay extends FloatingDisplay {
  constructor(game: Game) {
    super({
      position: { top: UI_CONSTANTS.hud.padding, right: UI_CONSTANTS.hud.padding },
      borderColor: COLOR_THEME.ui.wave,
      textColor: COLOR_THEME.ui.wave,
      iconType: IconType.WAVE,
      getValue: () => {
        const waveNumber = game.getCurrentWave();
        const enemiesRemaining = game.getEnemies().length;
        let waveText = `Wave ${waveNumber}`;
        
        if (enemiesRemaining > 0) {
          waveText += ` - ${enemiesRemaining} enemies`;
        } else if (game.isWaveComplete()) {
          waveText += ' - Complete!';
        }
        
        return waveText;
      }
    });
  }
}