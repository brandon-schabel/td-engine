// Debug wrapper to help diagnose dialog issues
export class DebugDialogWrapper {
  private static loggedIssues = new Set<string>();

  static wrapDialogShow(dialogId: string, showFn: () => void, context: string = ''): void {
    console.log(`[DebugDialog] Attempting to show ${dialogId} from ${context}`);
    
    try {
      // Check if dialogManager exists
      if (!(window as any).dialogManager) {
        this.logOnce('no-dialog-manager', '❌ DialogManager not found in window!');
        return;
      }

      const dialogManager = (window as any).dialogManager;
      
      // Check if dialog is registered
      const dialog = dialogManager.getDialog(dialogId);
      if (!dialog) {
        this.logOnce(`no-dialog-${dialogId}`, `❌ Dialog '${dialogId}' not registered!`);
        return;
      }

      // Check dialog state
      console.log(`[DebugDialog] Dialog '${dialogId}' found, visible:`, dialog.isVisible());
      
      // Try to show
      showFn();
      
      // Check result
      setTimeout(() => {
        const isVisible = dialog.isVisible();
        console.log(`[DebugDialog] Dialog '${dialogId}' visibility after show:`, isVisible);
        
        if (!isVisible) {
          this.checkCommonIssues(dialogId, dialog);
        }
      }, 100);
      
    } catch (error) {
      console.error(`[DebugDialog] Error showing ${dialogId}:`, error);
    }
  }

  private static logOnce(key: string, message: string): void {
    if (!this.loggedIssues.has(key)) {
      console.error(message);
      this.loggedIssues.add(key);
    }
  }

  private static getRegisteredDialogs(): string[] {
    try {
      const dialogManager = (window as any).dialogManager;
      if (!dialogManager) return [];
      
      // Try to get registered dialog IDs
      const dialogs: string[] = [];
      ['buildMenu', 'inventory', 'playerUpgrade', 'gameSettings', 'pause', 'settings', 'gameOver'].forEach(id => {
        if (dialogManager.getDialog(id)) {
          dialogs.push(id);
        }
      });
      
      return dialogs;
    } catch (error) {
      return [];
    }
  }

  private static checkCommonIssues(dialogId: string, dialog: any): void {
    console.group(`[DebugDialog] Checking common issues for ${dialogId}`);
    
    // Check if dialog container is in DOM
    if (dialog.container) {
      const inDOM = document.body.contains(dialog.container);
      console.log('- Container in DOM:', inDOM);
      
      if (inDOM) {
        const styles = window.getComputedStyle(dialog.container);
        console.log('- Container display:', styles.display);
        console.log('- Container visibility:', styles.visibility);
        console.log('- Container opacity:', styles.opacity);
        console.log('- Container z-index:', styles.zIndex);
      }
    }
    
    // Check for CSS issues
    const allDialogs = document.querySelectorAll('.dialog-container');
    console.log('- Total dialog containers in DOM:', allDialogs.length);
    
    allDialogs.forEach((container, index) => {
      const styles = window.getComputedStyle(container as HTMLElement);
      console.log(`  Dialog ${index}: display=${styles.display}, z-index=${styles.zIndex}`);
    });
    
    console.groupEnd();
  }

  static testDialogSystem(): void {
    console.group('[DebugDialog] Testing Dialog System');
    
    const dialogManager = (window as any).dialogManager;
    if (!dialogManager) {
      console.error('❌ DialogManager not found');
      console.groupEnd();
      return;
    }
    
    console.log('✅ DialogManager found');
    console.log('Registered dialogs:', this.getRegisteredDialogs());
    
    // Test each dialog
    const testDialogs = ['buildMenu', 'inventory', 'playerUpgrade'];
    testDialogs.forEach(dialogId => {
      const dialog = dialogManager.getDialog(dialogId);
      if (dialog) {
        console.log(`✅ ${dialogId} is registered`);
      } else {
        console.log(`❌ ${dialogId} is NOT registered`);
      }
    });
    
    console.groupEnd();
  }
}

// Make it globally available for debugging
(window as any).DebugDialogWrapper = DebugDialogWrapper;