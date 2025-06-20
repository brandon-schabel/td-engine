import { InventoryDialog } from './InventoryDialog';
import type { InventoryItem } from '@/systems/Inventory';
import { ItemType } from '@/systems/Inventory';
import { Game } from '@/core/Game';
import { AudioManager } from '@/audio/AudioManager';

export interface InventoryDialogAdapterOptions {
  game: Game;
  audioManager?: AudioManager;
  onItemSelected?: (item: InventoryItem, slot: number) => void;
  onClosed?: () => void;
}

/**
 * Adapter that integrates InventoryDialog with the game's inventory system
 */
export class InventoryDialogAdapter extends InventoryDialog {
  private onItemSelected?: (item: InventoryItem, slot: number) => void;
  private onClosed?: () => void;
  private inventoryUpdateHandler: () => void;
  
  constructor(options: InventoryDialogAdapterOptions) {
    const inventory = options.game.getInventory();
    
    super({
      game: options.game,
      inventory,
      audioManager: options.audioManager || new AudioManager()
    });
    
    this.onItemSelected = options.onItemSelected;
    this.onClosed = options.onClosed;
    
    // Set up inventory update listener
    this.inventoryUpdateHandler = () => this.updateInventoryDisplay();
    this.setupInventoryListener();
    
    // Override the base class slot click handler
    const originalHandleSlotClick = (this as any).handleSlotClick;
    (this as any).handleSlotClick = (slotIndex: number, item: InventoryItem | null) => {
      if (originalHandleSlotClick) {
        originalHandleSlotClick.call(this, slotIndex, item);
      }
      this.handleItemClick(item, slotIndex);
    };
  }
  
  private handleItemClick(item: InventoryItem | null, slot: number): void {
    if (!item) return;
    
    // Handle item usage through the game
    const player = (this as any).game.getPlayer();
    if (!player) return;
    
    // Check if item is usable
    if (item.type === ItemType.CONSUMABLE || item.type === ItemType.EQUIPMENT) {
      // Use item through inventory system
      const success = (this as any).game.useInventoryItem(slot, 1);
      if (success) {
        // Update display after use
        this.updateInventoryDisplay();
      }
    }
    
    // Call custom callback
    if (this.onItemSelected) {
      this.onItemSelected(item, slot);
    }
  }
  
  private setupInventoryListener(): void {
    // Listen for inventory changes
    const inventory = (this as any).game.getInventory();
    if (inventory && 'on' in inventory) {
      (inventory as any).on('itemAdded', this.inventoryUpdateHandler);
      (inventory as any).on('itemRemoved', this.inventoryUpdateHandler);
      (inventory as any).on('itemMoved', this.inventoryUpdateHandler);
    }
  }
  
  private removeInventoryListener(): void {
    const inventory = (this as any).game.getInventory();
    if (inventory && 'off' in inventory) {
      (inventory as any).off('itemAdded', this.inventoryUpdateHandler);
      (inventory as any).off('itemRemoved', this.inventoryUpdateHandler);
      (inventory as any).off('itemMoved', this.inventoryUpdateHandler);
    }
  }
  
  private updateInventoryDisplay(): void {
    // Re-render the current tab by updating the slots
    (this as any).updateSlots();
  }
  
  
  protected afterShow(): void {
    super.afterShow();
    
    // Update display when shown
    this.updateInventoryDisplay();
  }
  
  protected beforeHide(): void {
    super.beforeHide();
    
    if (this.onClosed) {
      this.onClosed();
    }
  }
  
  public destroy(): void {
    this.removeInventoryListener();
    super.destroy();
  }
}