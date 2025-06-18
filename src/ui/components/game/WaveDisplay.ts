import { Game } from '@/core/Game';
import { IconType } from '@/ui/icons/SvgIcons';
import { FloatingUIElement } from './FloatingUIElement';

export class WaveDisplay extends FloatingUIElement {
  private game: Game;

  constructor(game: Game) {
    super({
      id: 'wave-display',
      position: { top: 10, right: 10 },
      borderColor: '#4CAF50',
      icon: IconType.WAVE,
      iconSize: 20,
      onUpdate: (element) => this.updateWaveInfo()
    });
    
    this.game = game;
    this.updateWaveInfo();
  }

  private updateWaveInfo(): void {
    const waveNumber = this.game.getCurrentWave();
    const enemiesRemaining = this.game.getEnemies().length;
    let waveText = `Wave ${waveNumber}`;
    
    if (enemiesRemaining > 0) {
      waveText += ` - ${enemiesRemaining} enemies`;
    } else if (this.game.isWaveComplete()) {
      waveText += ' - Complete!';
    }
    
    this.setContent(waveText);
  }
}