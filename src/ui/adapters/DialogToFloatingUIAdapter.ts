import type { DialogManager } from '@/ui/systems/DialogManager';
import type { FloatingUIManager } from '@/ui/floating/FloatingUIManager';
import type { BaseDialog } from '@/ui/components/dialogs/BaseDialog';

/**
 * Adapter class that provides backward compatibility between the existing DialogManager
 * and the new FloatingUIManager system. This adapter intercepts DialogManager.show() calls
 * and redirects them to FloatingUIManager.createDialog() while maintaining compatibility
 * with the existing dialog interface.
 * 
 * Recent changes:
 * - Initial implementation of adapter pattern
 * - Added dialog property extraction methods
 * - Implemented dialog show interception
 * - Added proper cleanup handling
 * - Added edge case handling for missing dialogs
 */
export class DialogToFloatingUIAdapter {
  private floatingUIManager: FloatingUIManager;
  private dialogManager: DialogManager;
  private dialogIdToFloatingIdMap = new Map<string, string>();
  private originalShow: (id: string) => void;
  private originalHide: (id: string) => void;

  /**
   * Creates a new DialogToFloatingUIAdapter instance
   * @param floatingUIManager The new FloatingUIManager instance to redirect to
   * @param dialogManager The existing DialogManager instance to adapt
   */
  constructor(floatingUIManager: FloatingUIManager, dialogManager: DialogManager) {
    this.floatingUIManager = floatingUIManager;
    this.dialogManager = dialogManager;

    // Store original methods
    this.originalShow = this.dialogManager.show.bind(this.dialogManager);
    this.originalHide = this.dialogManager.hide.bind(this.dialogManager);

    // Override DialogManager methods
    this.interceptDialogManagerMethods();
  }

  /**
   * Intercepts DialogManager methods to redirect to FloatingUIManager
   */
  private interceptDialogManagerMethods(): void {
    // Override the show method
    (this.dialogManager as any).show = (id: string) => {
      console.log(`[DialogToFloatingUIAdapter] Intercepting show() for dialog: ${id}`);
      this.showDialogWithFloatingUI(id);
    };

    // Override the hide method
    (this.dialogManager as any).hide = (id: string) => {
      console.log(`[DialogToFloatingUIAdapter] Intercepting hide() for dialog: ${id}`);
      this.hideDialogWithFloatingUI(id);
    };
  }

  /**
   * Shows a dialog using the FloatingUIManager
   * @param dialogId The ID of the dialog in DialogManager
   */
  private showDialogWithFloatingUI(dialogId: string): void {
    // Get the dialog from DialogManager
    const dialog = this.dialogManager.getDialog(dialogId);

    if (!dialog) {
      console.error(`[DialogToFloatingUIAdapter] Dialog with id "${dialogId}" not found`);
      return;
    }

    // Check if we've already created a floating UI for this dialog
    const existingFloatingId = this.dialogIdToFloatingIdMap.get(dialogId);
    if (existingFloatingId) {
      // Dialog already exists in FloatingUIManager, just enable it
      const floatingElement = this.floatingUIManager.get(existingFloatingId);
      if (floatingElement) {
        floatingElement.enable();
        return;
      }
    }

    // Extract dialog properties
    const title = this.getDialogTitle(dialog);
    const content = this.getDialogContent(dialog);
    const isModal = this.isDialogModal(dialog);
    const isCloseable = this.isDialogCloseable(dialog);

    // Generate a unique ID for the floating UI element
    const floatingId = `dialog_adapter_${dialogId}`;

    // Create the dialog using FloatingUIManager
    this.floatingUIManager.createDialog(floatingId, content, {
      title: title,
      modal: isModal,
      closeable: isCloseable,
      onClose: () => {
        // Clean up mapping
        this.dialogIdToFloatingIdMap.delete(dialogId);

        // Call the original hide method to update DialogManager state
        this.originalHide(dialogId);
      },
      className: 'adapted-dialog'
    });

    // Store the mapping
    this.dialogIdToFloatingIdMap.set(dialogId, floatingId);

    // Call the original show method to maintain DialogManager state
    // but prevent actual display by temporarily disabling the dialog
    const dialogElement = (dialog as any).container;
    if (dialogElement) {
      dialogElement.style.display = 'none';
      this.originalShow(dialogId);
      // Keep it hidden since FloatingUIManager is handling display
      dialogElement.style.display = 'none';
    } else {
      this.originalShow(dialogId);
    }
  }

  /**
   * Hides a dialog using the FloatingUIManager
   * @param dialogId The ID of the dialog in DialogManager
   */
  private hideDialogWithFloatingUI(dialogId: string): void {
    const floatingId = this.dialogIdToFloatingIdMap.get(dialogId);

    if (floatingId) {
      // Remove from FloatingUIManager
      this.floatingUIManager.remove(floatingId);

      // Clean up mapping
      this.dialogIdToFloatingIdMap.delete(dialogId);
    }

    // Call original hide to update DialogManager state
    this.originalHide(dialogId);
  }

  /**
   * Extracts the title from a BaseDialog instance
   * @param dialog The dialog instance
   * @returns The dialog title
   */
  private getDialogTitle(dialog: BaseDialog): string {
    try {
      // Try to access the title through the options property
      const options = (dialog as any).options;
      if (options && options.title) {
        return options.title;
      }

      // Fallback: try to get title from the dialog method if it exists
      if (typeof (dialog as any).getTitle === 'function') {
        return (dialog as any).getTitle();
      }

      // Last resort: extract from the header element
      const header = (dialog as any).header;
      if (header) {
        const titleElement = header.querySelector('.dialog-title');
        if (titleElement) {
          return titleElement.textContent || 'Untitled Dialog';
        }
      }

      return 'Untitled Dialog';
    } catch (error) {
      console.warn('[DialogToFloatingUIAdapter] Error extracting dialog title:', error);
      return 'Untitled Dialog';
    }
  }

  /**
   * Extracts the content from a BaseDialog instance
   * @param dialog The dialog instance
   * @returns The dialog content as string or HTMLElement
   */
  private getDialogContent(dialog: BaseDialog): string | HTMLElement {
    try {
      // Try to get content through a method if it exists
      if (typeof (dialog as any).getContent === 'function') {
        return (dialog as any).getContent();
      }

      // Try to access the content element directly
      const contentElement = (dialog as any).content;
      if (contentElement) {
        // Clone the content to avoid modifying the original
        return contentElement.cloneNode(true) as HTMLElement;
      }

      return '<p>No content available</p>';
    } catch (error) {
      console.warn('[DialogToFloatingUIAdapter] Error extracting dialog content:', error);
      return '<p>Error loading content</p>';
    }
  }

  /**
   * Determines if a dialog is modal
   * @param dialog The dialog instance
   * @returns True if the dialog is modal
   */
  private isDialogModal(dialog: BaseDialog): boolean {
    try {
      // Try to get modal property through a method
      if (typeof (dialog as any).isModal === 'function') {
        return (dialog as any).isModal();
      }

      // Try to access options
      const options = (dialog as any).options;
      if (options && typeof options.modal === 'boolean') {
        return options.modal;
      }

      // Default to true for safety
      return true;
    } catch (error) {
      console.warn('[DialogToFloatingUIAdapter] Error checking if dialog is modal:', error);
      return true;
    }
  }

  /**
   * Determines if a dialog is closeable
   * @param dialog The dialog instance
   * @returns True if the dialog is closeable
   */
  private isDialogCloseable(dialog: BaseDialog): boolean {
    try {
      // Try to get closeable property through a method
      if (typeof (dialog as any).isCloseable === 'function') {
        return (dialog as any).isCloseable();
      }

      // Try to access options
      const options = (dialog as any).options;
      if (options && typeof options.closeable === 'boolean') {
        return options.closeable;
      }

      // Default to true for better UX
      return true;
    } catch (error) {
      console.warn('[DialogToFloatingUIAdapter] Error checking if dialog is closeable:', error);
      return true;
    }
  }

  /**
   * Restores the original DialogManager methods
   */
  public restore(): void {
    // Restore original methods
    (this.dialogManager as any).show = this.originalShow;
    (this.dialogManager as any).hide = this.originalHide;

    // Clean up any remaining floating UI dialogs
    this.dialogIdToFloatingIdMap.forEach((floatingId) => {
      this.floatingUIManager.remove(floatingId);
    });
    this.dialogIdToFloatingIdMap.clear();
  }

  /**
   * Gets the current mapping of DialogManager IDs to FloatingUIManager IDs
   * @returns A copy of the current mappings
   */
  public getMappings(): Map<string, string> {
    return new Map(this.dialogIdToFloatingIdMap);
  }
}