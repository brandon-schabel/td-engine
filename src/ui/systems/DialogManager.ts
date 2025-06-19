import { BaseDialog } from '@/ui/components/dialogs/BaseDialog';

export class DialogManager {
  private static instance: DialogManager;
  private dialogs: Map<string, BaseDialog> = new Map();
  private dialogStack: string[] = [];
  private currentZIndex: number = 10000;
  private isInputBlocked: boolean = false;
  
  private constructor() {
    this.setupGlobalHandlers();
  }
  
  public static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager();
    }
    return DialogManager.instance;
  }
  
  private setupGlobalHandlers(): void {
    // Prevent scrolling when dialogs are open on mobile
    document.addEventListener('touchmove', (e) => {
      if (this.isInputBlocked) {
        // Only prevent if the touch is not within dialog content
        const target = e.target as HTMLElement;
        if (!target.closest('.dialog-content')) {
          e.preventDefault();
        }
      }
    }, { passive: false });
    
    // Handle back button on mobile browsers
    window.addEventListener('popstate', (e) => {
      if (this.dialogStack.length > 0) {
        e.preventDefault();
        this.closeTopDialog();
      }
    });
  }
  
  public register(id: string, dialog: BaseDialog): void {
    console.log(`[DialogManager] Registering dialog: ${id}`);
    if (this.dialogs.has(id)) {
      console.warn(`[DialogManager] Dialog with id "${id}" already registered. Replacing.`);
      this.dialogs.get(id)?.destroy();
    }
    
    this.dialogs.set(id, dialog);
    console.log('[DialogManager] Registered dialogs:', Array.from(this.dialogs.keys()));
  }
  
  public unregister(id: string): void {
    const dialog = this.dialogs.get(id);
    if (dialog) {
      dialog.destroy();
      this.dialogs.delete(id);
      this.removeFromStack(id);
    }
  }
  
  public show(id: string): void {
    console.log(`[DialogManager] Attempting to show dialog: ${id}`);
    const dialog = this.dialogs.get(id);
    if (!dialog) {
      console.error(`[DialogManager] Dialog with id "${id}" not found`);
      console.log('[DialogManager] Available dialogs:', Array.from(this.dialogs.keys()));
      return;
    }
    
    console.log(`[DialogManager] Dialog "${id}" visibility:`, dialog.isVisible());
    
    if (dialog.isVisible()) {
      console.log(`[DialogManager] Dialog "${id}" already visible, moving to top`);
      // Move to top of stack
      this.removeFromStack(id);
      this.dialogStack.push(id);
      dialog.setZIndex(this.getNextZIndex());
      return;
    }
    
    // Show dialog
    console.log(`[DialogManager] Showing dialog "${id}" with z-index:`, this.currentZIndex);
    dialog.setZIndex(this.getNextZIndex());
    
    // Ensure dialog show is called after z-index is set
    try {
      dialog.show();
      this.dialogStack.push(id);
      console.log(`[DialogManager] Dialog stack after show:`, [...this.dialogStack]);
      
      // Verify dialog is actually visible after a short delay
      setTimeout(() => {
        if (!dialog.isVisible()) {
          console.error(`[DialogManager] Dialog "${id}" failed to show properly`);
          // Try to force visibility
          const container = (dialog as any).container;
          if (container && container.style) {
            console.log(`[DialogManager] Forcing visibility for "${id}"`);
            container.style.display = 'block';
            container.style.visibility = 'visible';
          }
        }
      }, 100);
    } catch (error) {
      console.error(`[DialogManager] Error showing dialog "${id}":`, error);
      return;
    }
    
    // Update input blocking
    this.updateInputBlocking();
    
    // Add class to body for dialog-specific CSS fixes
    document.body.classList.add('dialog-open');
    
    // iOS-specific: prevent body scrolling
    if (this.isIOS()) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.dataset.scrollPosition = scrollY.toString();
    }
  }
  
  public hide(id: string): void {
    const dialog = this.dialogs.get(id);
    if (!dialog || !dialog.isVisible()) {
      return;
    }
    
    dialog.hide();
    this.removeFromStack(id);
    
    // Update input blocking
    this.updateInputBlocking();
    
    // Remove dialog-open class if no dialogs remain
    if (this.dialogStack.length === 0) {
      document.body.classList.remove('dialog-open');
      
      // Restore body scrolling and position if no dialogs open
      if (this.isIOS()) {
        const scrollY = parseInt(document.body.dataset.scrollPosition || '0');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        delete document.body.dataset.scrollPosition;
        window.scrollTo(0, scrollY);
      }
    }
  }
  
  public toggle(id: string): void {
    console.log(`[DialogManager] Toggling dialog: ${id}`);
    const dialog = this.dialogs.get(id);
    if (!dialog) {
      console.error(`[DialogManager] Dialog with id "${id}" not found`);
      console.log('[DialogManager] Available dialogs:', Array.from(this.dialogs.keys()));
      return;
    }
    
    if (dialog.isVisible()) {
      this.hide(id);
    } else {
      this.show(id);
    }
  }
  
  public hideAll(): void {
    // Hide in reverse order (top to bottom)
    [...this.dialogStack].reverse().forEach(id => {
      this.hide(id);
    });
  }
  
  public closeTopDialog(): void {
    if (this.dialogStack.length > 0) {
      const topId = this.dialogStack[this.dialogStack.length - 1];
      this.hide(topId);
    }
  }
  
  public getDialog(id: string): BaseDialog | undefined {
    return this.dialogs.get(id);
  }
  
  public isAnyDialogOpen(): boolean {
    return this.dialogStack.length > 0;
  }
  
  public getIsInputBlocked(): boolean {
    return this.isInputBlocked;
  }
  
  public getOpenDialogs(): string[] {
    return [...this.dialogStack];
  }
  
  private removeFromStack(id: string): void {
    const index = this.dialogStack.indexOf(id);
    if (index !== -1) {
      this.dialogStack.splice(index, 1);
    }
  }
  
  private getNextZIndex(): number {
    return this.currentZIndex++;
  }
  
  private updateInputBlocking(): void {
    this.isInputBlocked = this.dialogStack.length > 0;
  }
  
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  }
  
  public destroy(): void {
    this.hideAll();
    this.dialogs.forEach(dialog => dialog.destroy());
    this.dialogs.clear();
    this.dialogStack = [];
  }
}