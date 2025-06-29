import { BaseFloatingUI } from './BaseFloatingUI';
import { Game } from '@/core/Game';
import { cn } from '@/ui/styles/UtilityStyles';

export interface DialogOptions {
  title: string;
  modal?: boolean;
  closeable?: boolean;
  className?: string;
  width?: string;
}

/**
 * Abstract base class for dialog-style floating UI components.
 * Extends BaseFloatingUI with common dialog functionality.
 */
export abstract class BaseDialogUI extends BaseFloatingUI {
  protected title: string;
  protected modal: boolean;
  protected closeable: boolean;
  protected className?: string;
  protected width?: string;
  
  constructor(game: Game, options: DialogOptions) {
    super(game);
    this.title = options.title;
    this.modal = options.modal ?? false;
    this.closeable = options.closeable ?? true;
    this.className = options.className;
    this.width = options.width;
  }
  
  /**
   * Create the dialog UI element.
   */
  create(): void {
    const content = this.createDialogContent();
    
    const dialogOptions: any = {
      title: this.title,
      modal: this.modal,
      closeable: this.closeable,
      onClose: this.closeable ? () => this.close() : undefined
    };
    
    // Add optional className if provided
    if (this.className) {
      dialogOptions.className = this.className;
    }
    
    // Add width constraint if provided
    if (this.width) {
      dialogOptions.className = cn(dialogOptions.className || '', this.width);
    }
    
    this.element = this.floatingUI.createDialog(this.getDialogId(), content, dialogOptions);
    
    // Set up click-outside handler for non-modal, closeable dialogs
    if (this.closeable && !this.modal) {
      this.setupClickOutside(this.getExcludeSelectors());
    }
    
    // Call post-create hook for subclasses
    this.onDialogCreated();
  }
  
  /**
   * Get the unique ID for this dialog. Must be implemented by subclasses.
   */
  protected abstract getDialogId(): string;
  
  /**
   * Create the content for the dialog. Must be implemented by subclasses.
   */
  protected abstract createDialogContent(): HTMLElement;
  
  /**
   * Optional hook called after dialog is created.
   * Can be overridden by subclasses for additional setup.
   */
  protected onDialogCreated(): void {
    // Default implementation does nothing
  }
  
  /**
   * Get CSS selectors to exclude from click-outside detection.
   * Can be overridden by subclasses to add custom exclusions.
   */
  protected getExcludeSelectors(): string[] {
    return ['.ui-control-bar button', '.floating-ui-dialog'];
  }
  
  /**
   * Update the dialog title.
   */
  protected updateTitle(newTitle: string): void {
    this.title = newTitle;
    
    if (this.element) {
      const titleElement = this.element.getElement().querySelector('.dialog-title');
      if (titleElement) {
        titleElement.textContent = newTitle;
      }
    }
  }
  
  /**
   * Default implementation of updateContent.
   * Most dialogs have static content and don't need dynamic updates.
   * Subclasses can override this if they need to update content dynamically.
   */
  updateContent(): void {
    // Default implementation does nothing
    // Dialogs typically have static content that doesn't need updating
  }
}