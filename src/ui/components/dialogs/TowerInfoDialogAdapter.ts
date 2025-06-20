import { TowerInfoDialog } from './TowerInfoDialog';
import { Tower } from '@/entities/Tower';
import { Game } from '@/core/Game';
import { AudioManager } from '@/audio/AudioManager';

export interface TowerInfoDialogAdapterOptions {
  tower: Tower;
  game: Game;
  audioManager?: AudioManager;
  onClosed?: () => void;
}

/**
 * Adapter that integrates TowerInfoDialog with the game
 */
export class TowerInfoDialogAdapter extends TowerInfoDialog {
  private onClosed?: () => void;
  
  constructor(options: TowerInfoDialogAdapterOptions) {
    super({
      tower: options.tower,
      game: options.game,
      audioManager: options.audioManager,
      onUpgrade: () => this.handleUpgrade(),
      onSell: () => this.handleSell(),
      onClose: () => this.handleClose()
    });
    
    this.onClosed = options.onClosed;
  }
  
  private handleUpgrade(): void {
    // Hide this dialog
    this.hide();
    
    // Tower upgrades now handled by TowerUpgradeUI in Game.ts
    // Select the tower to trigger the floating UI
    this.game.selectTower(this.tower);
  }
  
  private handleSell(): void {
    // Sell the tower through the game's proper method
    const success = this.game.sellTower(this.tower);
    
    if (success) {
      // Close dialog
      this.hide();
    }
  }
  
  private handleClose(): void {
    // Clear tower selection in game
    this.game.deselectTower();
    
    if (this.onClosed) {
      this.onClosed();
    }
  }
  
  public override destroy(): void {
    super.destroy();
  }
}