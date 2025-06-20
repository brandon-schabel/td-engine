import { EnhancedUpgradeDialog } from './EnhancedUpgradeDialog';
import type { EnhancedUpgradeDialogOptions } from './EnhancedUpgradeDialog';
import { Tower, UpgradeType } from '@/entities/Tower';
import { Player, PlayerUpgradeType } from '@/entities/Player';
import { Game } from '@/core/Game';
import { AudioManager } from '@/audio/AudioManager';
import { UpgradeService } from '@/services/UpgradeService';

export interface UpgradeDialogAdapterOptions extends Omit<EnhancedUpgradeDialogOptions, 'onUpgrade' | 'onSell' | 'onClose' | 'upgradeService'> {
  game: Game;
  audioManager?: AudioManager;
  onUpgraded?: (type: UpgradeType | PlayerUpgradeType, cost: number) => void;
  onSold?: () => void;
  onClosed?: () => void;
}

/**
 * Adapter that integrates UpgradeDialog with the game's upgrade system
 */
export class UpgradeDialogAdapter extends EnhancedUpgradeDialog {
  private game: Game;
  private upgradeTarget: Tower | Player;
  private updateInterval?: number;
  private currencyUpdateInterval?: number;
  private lastPosition?: { x: number; y: number };
  private onUpgraded?: (type: UpgradeType | PlayerUpgradeType, cost: number) => void;
  private onSold?: () => void;
  private onClosed?: () => void;
  
  constructor(options: UpgradeDialogAdapterOptions) {
    const target = options.target;
    const isTower = target instanceof Tower;
    
    super({
      ...options,
      currentCurrency: options.currentCurrency || options.game.getCurrency(),
      upgradeService: new UpgradeService((options.game as any).resourceManager || { canAfford: () => true, spend: () => true } as any),
      onUpgrade: (type: UpgradeType | PlayerUpgradeType, cost: number) => this.handleUpgrade(type, cost),
      onSell: isTower ? () => this.handleSell() : undefined,
      onClose: () => this.handleClose()
    });
    
    this.game = options.game;
    this.upgradeTarget = target;
    this.onUpgraded = options.onUpgraded;
    this.onSold = options.onSold;
    this.onClosed = options.onClosed;
    
    // Store initial position for towers
    if (isTower) {
      const tower = target as Tower;
      this.lastPosition = { x: tower.position.x, y: tower.position.y };
    }
  }
  
  private handleUpgrade(type: UpgradeType | PlayerUpgradeType, cost: number): void {
    const target = this.upgradeTarget;
    
    // Perform the upgrade through the game
    if (target instanceof Tower) {
      const success = this.game.upgradeTower(target as Tower, type as UpgradeType);
      if (success) {
        // Update the dialog's currency display
        this.updateCurrency(this.game.getCurrency());
        
        if (this.onUpgraded) {
          this.onUpgraded(type, cost);
        }
      }
    } else if (target instanceof Player) {
      const success = this.game.upgradePlayer(type as PlayerUpgradeType);
      if (success) {
        // Update the dialog's currency display
        this.updateCurrency(this.game.getCurrency());
        
        if (this.onUpgraded) {
          this.onUpgraded(type, cost);
        }
      }
    }
  }
  
  private handleSell(): void {
    if (this.upgradeTarget instanceof Tower) {
      // Selling not implemented in game - just remove the tower
      // This would need to be implemented in the Game class
      console.warn('Tower selling not implemented in Game class');
      if (this.onSold) {
        this.onSold();
      }
    }
  }
  
  private handleClose(): void {
    // Clear selection if it's a tower
    if (this.upgradeTarget instanceof Tower) {
      // Clear selection by setting selectedTower to null
      // This would need a public method in Game class
      console.warn('Clear selection not available as public method');
    }
    
    if (this.onClosed) {
      this.onClosed();
    }
  }
  
  protected override afterShow(): void {
    super.afterShow();
    
    // For towers, update position periodically
    if (this.upgradeTarget instanceof Tower) {
      this.startPositionTracking();
    }
    
    // Start currency tracking for all upgrade dialogs
    this.startCurrencyTracking();
  }
  
  protected override beforeHide(): void {
    super.beforeHide();
    this.stopPositionTracking();
    this.stopCurrencyTracking();
  }
  
  private startPositionTracking(): void {
    if (!(this.upgradeTarget instanceof Tower)) return;
    
    // Update dialog position to follow tower
    this.updateInterval = window.setInterval(() => {
      if (!this.upgradeTarget || !(this.upgradeTarget instanceof Tower)) {
        this.stopPositionTracking();
        return;
      }
      
      const tower = this.upgradeTarget as Tower;
      
      // Check if tower still exists in game
      if (!this.game.getTowers().includes(tower)) {
        this.hide();
        return;
      }
      
      // Update position if tower moved (shouldn't happen, but just in case)
      if (this.lastPosition && 
          (tower.position.x !== this.lastPosition.x || tower.position.y !== this.lastPosition.y)) {
        this.updateDialogPosition(tower);
        this.lastPosition = { x: tower.position.x, y: tower.position.y };
      }
    }, 100);
  }
  
  private stopPositionTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
  
  private updateDialogPosition(tower: Tower): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const camera = this.game.getCamera();
    
    // Convert world position to screen position
    const screenPos = camera.worldToScreen({ x: tower.position.x, y: tower.position.y });
    
    // Calculate dialog position (offset to the right of tower)
    const dialogX = rect.left + screenPos.x + 40;
    const dialogY = rect.top + screenPos.y - 100;
    
    // Update dialog position
    const dialog = this.dialog;
    dialog.style.position = 'fixed';
    dialog.style.left = `${dialogX}px`;
    dialog.style.top = `${dialogY}px`;
    dialog.style.transform = 'none';
    
    // Keep on screen
    const dialogRect = dialog.getBoundingClientRect();
    if (dialogRect.right > window.innerWidth) {
      dialog.style.left = `${window.innerWidth - dialogRect.width - 10}px`;
    }
    if (dialogRect.bottom > window.innerHeight) {
      dialog.style.top = `${window.innerHeight - dialogRect.height - 10}px`;
    }
  }
  
  private startCurrencyTracking(): void {
    // Update currency every 500ms to catch changes from enemy kills, etc.
    this.currencyUpdateInterval = window.setInterval(() => {
      const currentCurrency = this.game.getCurrency();
      this.updateCurrency(currentCurrency);
    }, 500);
  }
  
  private stopCurrencyTracking(): void {
    if (this.currencyUpdateInterval) {
      clearInterval(this.currencyUpdateInterval);
      this.currencyUpdateInterval = undefined;
    }
  }
  
  public override destroy(): void {
    this.stopPositionTracking();
    this.stopCurrencyTracking();
    super.destroy();
  }
}