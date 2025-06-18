import { TowerInfoDialog } from './TowerInfoDialog';
import type { TowerInfoDialogOptions } from './TowerInfoDialog';
import { Tower } from '@/entities/Tower';
import { Game } from '@/core/Game';
import { AudioManager } from '@/audio/AudioManager';
import { DialogManager } from '@/ui/systems/DialogManager';
import { UpgradeDialogAdapter } from './UpgradeDialogAdapter';

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
  private game: Game;
  private tower: Tower;
  private dialogManager: DialogManager;
  private onClosed?: () => void;
  private upgradeDialog?: UpgradeDialogAdapter;
  
  constructor(options: TowerInfoDialogAdapterOptions) {
    console.log('[TowerInfoDialogAdapter] Constructor called with options:', {
      tower: options.tower?.towerType,
      game: !!options.game,
      audioManager: !!options.audioManager
    });
    
    super({
      tower: options.tower,
      game: options.game,
      audioManager: options.audioManager,
      onUpgrade: () => this.handleUpgrade(),
      onSell: () => this.handleSell(),
      onClose: () => this.handleClose()
    });
    
    console.log('[TowerInfoDialogAdapter] Super constructor completed');
    
    this.game = options.game;
    this.tower = options.tower;
    this.dialogManager = DialogManager.getInstance();
    this.onClosed = options.onClosed;
    
    console.log('[TowerInfoDialogAdapter] Construction complete');
  }
  
  private handleUpgrade(): void {
    // Hide this dialog
    this.hide();
    
    // Create and show the full upgrade dialog
    this.upgradeDialog = new UpgradeDialogAdapter({
      game: this.game,
      target: this.tower,
      audioManager: this.audioManager,
      onUpgraded: (type, cost) => {
        // Upgrade handled by adapter
      },
      onSold: () => {
        // Close both dialogs
        this.dialogManager.hide('towerUpgrade');
        this.dialogManager.unregister('towerUpgrade');
        this.upgradeDialog = undefined;
      },
      onClosed: () => {
        // Clean up upgrade dialog
        this.dialogManager.unregister('towerUpgrade');
        this.upgradeDialog = undefined;
      }
    });
    
    // Register and show upgrade dialog
    this.dialogManager.register('towerUpgrade', this.upgradeDialog);
    this.dialogManager.show('towerUpgrade');
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
    // Clean up any open upgrade dialog
    if (this.upgradeDialog) {
      this.dialogManager.hide('towerUpgrade');
      this.dialogManager.unregister('towerUpgrade');
      this.upgradeDialog = undefined;
    }
    
    super.destroy();
  }
}