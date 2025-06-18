import { FloatingDisplay } from './FloatingDisplay';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';

export class WaveDisplay extends FloatingDisplay {
  constructor(game: Game) {
    super({
      position: { top: 10, right: 10 },
      borderColor: '#4CAF50',
      textColor: '#4CAF50',
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