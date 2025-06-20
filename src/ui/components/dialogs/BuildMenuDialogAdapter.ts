import { BuildMenuDialog } from './BuildMenuDialog';
import { TowerType } from '@/entities/Tower';
import { Game } from '@/core/Game';
import { AudioManager } from '@/audio/AudioManager';

export interface BuildMenuDialogAdapterOptions {
  game: Game;
  audioManager?: AudioManager;
  onTowerSelected?: (type: TowerType) => void;
  onClosed?: () => void;
}

/**
 * Adapter that integrates BuildMenuDialog with the game's tower placement system
 */
export class BuildMenuDialogAdapter extends BuildMenuDialog {
  private game: Game;
  private onTowerSelected?: (type: TowerType) => void;
  private onClosed?: () => void;
  
  constructor(options: BuildMenuDialogAdapterOptions) {
    super({
      currentCurrency: options.game.getCurrency(),
      audioManager: options.audioManager,
      onTowerSelect: (type: TowerType) => this.handleTowerSelect(type),
      onCancel: () => this.handleClose()
    });
    
    this.game = options.game;
    this.onTowerSelected = options.onTowerSelected;
    this.onClosed = options.onClosed;
  }
  
  private handleTowerSelect(type: TowerType): void {
    // Start tower placement in the game
    this.game.setSelectedTowerType(type);
    
    // Call custom callback if provided
    if (this.onTowerSelected) {
      this.onTowerSelected(type);
    }
    
    // Hide the dialog after selection
    this.hide();
  }
  
  private handleClose(): void {
    // Cancel any active tower placement
    this.game.setSelectedTowerType(null);
    
    // Call custom callback if provided
    if (this.onClosed) {
      this.onClosed();
    }
  }
  
  public override show(): void {
    // Cancel any active tower placement before showing
    this.game.setSelectedTowerType(null);
    
    // Update currency display
    this.updateCurrency(this.game.getCurrency());
    
    super.show();
  }
  
  /**
   * Update the dialog when game currency changes
   */
  public updateCurrency(currency: number): void {
    // Rebuild the dialog with updated currency
    // Since BuildMenuDialog doesn't have a public update method,
    // we need to recreate it or update the DOM directly
    (this as any).currentCurrency = currency;
    
    // Update button states based on affordability
    const buttons = this.content.querySelectorAll('.tower-button');
    buttons.forEach((button: Element) => {
      const costText = button.textContent || '';
      const costMatch = costText.match(/\$(\d+)/);
      if (costMatch) {
        const cost = parseInt(costMatch[1]);
        const htmlButton = button as HTMLButtonElement;
        htmlButton.disabled = currency < cost;
        htmlButton.style.opacity = currency < cost ? '0.5' : '1';
      }
    });
  }
}