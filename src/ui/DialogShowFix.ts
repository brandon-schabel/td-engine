// Fix for dialog visibility issues
import { DialogManager } from './systems/DialogManager';
import { UpgradeDialogAdapter } from './components/dialogs/UpgradeDialogAdapter';
import { InventoryDialogAdapter } from './components/dialogs/InventoryDialogAdapter';
import type { Game } from '@/core/Game';
import type { AudioManager } from '@/audio/AudioManager';

export class DialogShowFix {
  static ensurePlayerUpgradeDialog(game: Game, audioManager: AudioManager): boolean {
    const dialogManager = DialogManager.getInstance();
    
    
    const player = game.getPlayer();
    if (!player) {
      console.error('[DialogFix] No player found!');
      return false;
    }
    
    // Check if dialog exists
    let dialog = dialogManager.getDialog('playerUpgrade');
    
    if (!dialog) {
      try {
        dialog = new UpgradeDialogAdapter({
          game,
          target: player,
          audioManager,
          currentCurrency: game.getCurrency(),
        });
        
        dialogManager.register('playerUpgrade', dialog);
      } catch (error) {
        console.error('[DialogFix] Failed to create player upgrade dialog:', error);
        return false;
      }
    }
    
    // Force show the dialog
    try {
      dialogManager.show('playerUpgrade');
      
      // Double-check visibility
      setTimeout(() => {
        const isVisible = dialog?.isVisible();
        
        if (!isVisible) {
          // Try direct manipulation as last resort
          const container = (dialog as any).container;
          if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            
            // Check if in DOM
            if (!document.body.contains(container)) {
              document.body.appendChild(container);
            }
          }
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('[DialogFix] Failed to show dialog:', error);
      return false;
    }
  }
  
  static ensureInventoryDialog(game: Game, audioManager: AudioManager): boolean {
    const dialogManager = DialogManager.getInstance();
    
    // Check if dialog exists
    let dialog = dialogManager.getDialog('inventory');
    
    if (!dialog) {
      try {
        dialog = new InventoryDialogAdapter({
          game,
          audioManager,
        });
        
        dialogManager.register('inventory', dialog);
      } catch (error) {
        console.error('[DialogFix] Failed to create inventory dialog:', error);
        return false;
      }
    }
    
    // Force show the dialog
    try {
      dialogManager.show('inventory');
      
      // Double-check visibility
      setTimeout(() => {
        const isVisible = dialog?.isVisible();
        
        if (!isVisible) {
          // Try direct manipulation as last resort
          const container = (dialog as any).container;
          if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            
            // Check if in DOM
            if (!document.body.contains(container)) {
              document.body.appendChild(container);
            }
          }
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('[DialogFix] Failed to show dialog:', error);
      return false;
    }
  }
}

// Make available globally for debugging
(window as any).DialogShowFix = DialogShowFix;