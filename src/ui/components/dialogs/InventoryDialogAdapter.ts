import { InventoryDialog } from './InventoryDialog';
import type { InventoryDialogOptions } from './InventoryDialog';
import type { Item } from '@/systems/Inventory';
import { ItemType } from '@/systems/Inventory';
import { Game } from '@/core/Game';
import { Inventory } from '@/systems/Inventory';
import { AudioManager } from '@/audio/AudioManager';

export interface InventoryDialogAdapterOptions {
  game: Game;
  audioManager?: AudioManager;
  onItemSelected?: (item: Item, slot: number) => void;
  onClosed?: () => void;
}

/**
 * Adapter that integrates InventoryDialog with the game's inventory system
 */
export class InventoryDialogAdapter extends InventoryDialog {
  private onItemSelected?: (item: Item, slot: number) => void;
  private onClosed?: () => void;
  private inventoryUpdateHandler: () => void;
  
  constructor(options: InventoryDialogAdapterOptions) {
    const inventory = options.game.getInventory();
    
    super({
      game: options.game,
      inventory,
      audioManager: options.audioManager,
      onItemClick: (item: Item | null, slot: number) => this.handleItemClick(item, slot),
      onTabChange: (tab: ItemType | 'all') => this.handleTabChange(tab)
    });
    
    this.onItemSelected = options.onItemSelected;
    this.onClosed = options.onClosed;
    
    // Set up inventory update listener
    this.inventoryUpdateHandler = () => this.updateInventoryDisplay();
    this.setupInventoryListener();
  }
  
  private handleItemClick(item: Item | null, slot: number): void {
    if (!item) return;
    
    // Handle item usage through the game
    const player = this.game.getPlayer();
    if (!player) return;
    
    // Check if item is usable
    if (item.type === ItemType.CONSUMABLE || item.type === ItemType.EQUIPMENT || item.type === ItemType.WEAPON) {
      // Use item through inventory system
      const success = this.game.useInventoryItem(slot, 1);
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
  
  private handleTabChange(tab: ItemType | 'all'): void {
    // Tab changes are handled by the base class
    // This is just for any additional game-specific logic
  }
  
  private setupInventoryListener(): void {
    // Listen for inventory changes
    const inventory = this.game.getInventory();
    if (inventory && 'on' in inventory) {
      (inventory as any).on('itemAdded', this.inventoryUpdateHandler);
      (inventory as any).on('itemRemoved', this.inventoryUpdateHandler);
      (inventory as any).on('itemMoved', this.inventoryUpdateHandler);
    }
  }
  
  private removeInventoryListener(): void {
    const inventory = this.game.getInventory();
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
  
  private getCurrentTab(): ItemType | 'all' {
    // Get current tab from the active tab button
    const activeTab = this.content.querySelector('.tab-button.active');
    if (!activeTab) return 'all';
    
    const tabValue = activeTab.getAttribute('data-tab');
    return (tabValue as ItemType | 'all') || 'all';
  }
  
  protected override afterShow(): void {
    super.afterShow();
    
    // Update display when shown
    this.updateInventoryDisplay();
  }
  
  protected override beforeHide(): void {
    super.beforeHide();
    
    if (this.onClosed) {
      this.onClosed();
    }
  }
  
  public override destroy(): void {
    this.removeInventoryListener();
    super.destroy();
  }
}