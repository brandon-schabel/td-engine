// Fix for dialog visibility issues
import { DialogManager } from './systems/DialogManager';
import { UpgradeDialogAdapter } from './components/dialogs/UpgradeDialogAdapter';
import { InventoryDialogAdapter } from './components/dialogs/InventoryDialogAdapter';
import type { Game } from '@/core/Game';
import type { AudioManager } from '@/audio/AudioManager';

export class DialogShowFix {
  static ensurePlayerUpgradeDialog(game: Game, audioManager: AudioManager): boolean {
    const dialogManager = DialogManager.getInstance();
    
    console.log('[DialogFix] Ensuring player upgrade dialog...');
    
    const player = game.getPlayer();
    if (!player) {
      console.error('[DialogFix] No player found!');
      return false;
    }
    
    // Check if dialog exists
    let dialog = dialogManager.getDialog('playerUpgrade');
    
    if (!dialog) {
      console.log('[DialogFix] Creating player upgrade dialog...');
      try {
        dialog = new UpgradeDialogAdapter({
          game,
          target: player,
          audioManager,
          onUpgraded: (type, cost) => {
            console.log('[DialogFix] Player upgraded:', type, 'for cost:', cost);
          },
          onClosed: () => {
            console.log('[DialogFix] Player upgrade dialog closed');
          }
        });
        
        dialogManager.register('playerUpgrade', dialog);
        console.log('[DialogFix] Player upgrade dialog registered');
      } catch (error) {
        console.error('[DialogFix] Failed to create player upgrade dialog:', error);
        return false;
      }
    }
    
    // Force show the dialog
    try {
      console.log('[DialogFix] Forcing dialog show...');
      dialogManager.show('playerUpgrade');
      
      // Double-check visibility
      setTimeout(() => {
        const isVisible = dialog?.isVisible();
        console.log('[DialogFix] Dialog visibility after show:', isVisible);
        
        if (!isVisible) {
          // Try direct manipulation as last resort
          const container = (dialog as any).container;
          if (container) {
            console.log('[DialogFix] Attempting direct DOM manipulation...');
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            
            // Check if in DOM
            if (!document.body.contains(container)) {
              console.log('[DialogFix] Adding container to DOM...');
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
    
    console.log('[DialogFix] Ensuring inventory dialog...');
    
    // Check if dialog exists
    let dialog = dialogManager.getDialog('inventory');
    
    if (!dialog) {
      console.log('[DialogFix] Creating inventory dialog...');
      try {
        dialog = new InventoryDialogAdapter({
          game,
          audioManager,
          onItemSelected: (item, slot) => {
            console.log('[DialogFix] Item selected:', item, 'in slot:', slot);
          }
        });
        
        dialogManager.register('inventory', dialog);
        console.log('[DialogFix] Inventory dialog registered');
      } catch (error) {
        console.error('[DialogFix] Failed to create inventory dialog:', error);
        return false;
      }
    }
    
    // Force show the dialog
    try {
      console.log('[DialogFix] Forcing dialog show...');
      dialogManager.show('inventory');
      
      // Double-check visibility
      setTimeout(() => {
        const isVisible = dialog?.isVisible();
        console.log('[DialogFix] Dialog visibility after show:', isVisible);
        
        if (!isVisible) {
          // Try direct manipulation as last resort
          const container = (dialog as any).container;
          if (container) {
            console.log('[DialogFix] Attempting direct DOM manipulation...');
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            
            // Check if in DOM
            if (!document.body.contains(container)) {
              console.log('[DialogFix] Adding container to DOM...');
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