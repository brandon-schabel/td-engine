import type { Game } from '@/core/Game';
import { BaseDialogUI } from './BaseDialogUI';
import { TabManager } from './components/TabManager';
import { ItemSlot } from './components/ItemSlot';
import { ItemTooltipUI } from './components/ItemTooltipUI';
import { SmartUpdater } from './SmartUpdater';
import { ItemType, type InventoryItem } from '@/systems/Inventory';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { isMobile, isTablet } from '@/config/ResponsiveConfig';
import { createButton, cn } from '@/ui/elements';
import { formatNumber } from './floatingUIUtils';

interface InventoryState {
  usedSlots: number;
  totalSlots: number;
  upgradeCost: number;
  canAffordUpgrade: boolean;
  selectedItem: InventoryItem | null;
}

/**
 * Refactored Inventory UI using base classes and reusable components.
 * Manages item display, sorting, usage, and upgrades.
 */
export class InventoryUI extends BaseDialogUI {
  // UI Components
  private tabManager: TabManager;
  private itemSlots: ItemSlot[] = [];
  private tooltip: ItemTooltipUI;
  private stateUpdater: SmartUpdater<InventoryState>;
  
  // UI State
  private selectedSlotIndex: number | null = null;
  private draggedFromSlot: number | null = null;
  
  // UI Elements
  private gridElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private useButton: HTMLElement | null = null;
  private upgradeButton: HTMLElement | null = null;
  
  constructor(game: Game, screenPos?: { x: number; y: number }, anchorElement?: HTMLElement) {
    // Calculate dialog position
    let position = screenPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    if (screenPos) {
      const controlBarHeight = 60;
      const menuHeight = 600;
      const menuWidth = 600;
      const padding = 10;
      
      position.x = Math.max(
        menuWidth / 2 + padding,
        Math.min(screenPos.x, window.innerWidth - menuWidth / 2 - padding)
      );
      position.y = window.innerHeight - controlBarHeight - menuHeight / 2 - padding;
    }
    
    super(game, {
      title: 'Inventory',
      closeable: true,
      modal: false,
      className: cn('inventory-ui', 'min-w-[600px]')
    });
    
    // Initialize components
    this.tooltip = new ItemTooltipUI(this.floatingUI);
    
    // Initialize tab manager
    this.tabManager = new TabManager({
      tabs: [
        { id: 'ALL', label: 'All', icon: '📦' },
        { id: ItemType.CONSUMABLE, label: 'Items', icon: '🧪' },
        { id: ItemType.EQUIPMENT, label: 'Gear', icon: '⚔️' },
        { id: ItemType.MATERIAL, label: 'Mats', icon: '🔨' },
        { id: ItemType.SPECIAL, label: 'Special', icon: '👑' }
      ],
      defaultTab: 'ALL',
      onTabChange: (tabId) => this.handleTabChange(tabId)
    });
    
    // Initialize smart updater
    this.stateUpdater = new SmartUpdater<InventoryState>({
      usedSlots: (value) => this.updateStatsDisplay(value, -1),
      totalSlots: (value) => this.updateStatsDisplay(-1, value),
      upgradeCost: (value) => this.updateUpgradeButton(value, false),
      canAffordUpgrade: (value) => this.updateUpgradeButton(-1, value),
      selectedItem: (value) => this.updateUseButton(value)
    });
  }
  
  protected getDialogId(): string {
    return 'inventory-ui';
  }
  
  protected onDialogCreated(): void {
    // Set up periodic updates
    this.setupPeriodicUpdate(250);
    
    // Set up inventory listeners
    this.setupInventoryListeners();
    
    // Set up click outside exclusions
    this.setupClickOutside(['.ui-control-bar button', '.ui-button-inventory']);
  }
  
  protected createDialogContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('space-y-4');
    
    // Tab bar
    const tabBar = this.tabManager.createTabBar();
    container.appendChild(tabBar);
    
    // Tab content container
    const tabContent = this.tabManager.createContentContainer();
    
    // Inventory grid
    this.gridElement = this.createInventoryGrid();
    tabContent.appendChild(this.gridElement);
    
    container.appendChild(tabContent);
    
    // Footer with stats and actions
    const footer = this.createFooter();
    container.appendChild(footer);
    
    // Create item slots
    this.createItemSlots();
    
    return container;
  }
  
  private createInventoryGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = cn(
      'grid',
      'gap-2',
      'p-4',
      'bg-black/20',
      'rounded-lg',
      'max-h-[400px]',
      'overflow-y-auto'
    );
    
    const columns = isMobile(window.innerWidth) ? 4 : isTablet(window.innerWidth) ? 6 : 8;
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    return grid;
  }
  
  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = cn(
      'flex',
      'justify-between',
      'items-center',
      'pt-4',
      'border-t',
      'border-border-primary'
    );
    
    // Stats display
    this.statsElement = document.createElement('div');
    this.statsElement.className = cn('text-sm', 'text-secondary');
    this.statsElement.textContent = '0/0 slots';
    footer.appendChild(this.statsElement);
    
    // Action buttons
    const actions = document.createElement('div');
    actions.className = cn('flex', 'gap-2');
    
    // Sort button
    const sortButton = createButton({
      text: 'Sort',
      icon: IconType.UPGRADE,
      size: 'sm',
      variant: 'secondary',
      onClick: () => this.handleSort()
    });
    actions.appendChild(sortButton);
    
    // Use button
    this.useButton = createButton({
      text: 'Use',
      icon: IconType.CHECKMARK,
      size: 'sm',
      variant: 'secondary',
      disabled: true,
      onClick: () => this.handleUse()
    });
    actions.appendChild(this.useButton);
    
    // Upgrade button
    this.upgradeButton = createButton({
      text: 'Upgrade',
      icon: IconType.UPGRADE,
      size: 'sm',
      variant: 'secondary',
      onClick: () => this.handleUpgrade()
    });
    actions.appendChild(this.upgradeButton);
    
    footer.appendChild(actions);
    return footer;
  }
  
  private createItemSlots(): void {
    if (!this.gridElement) return;
    
    const inventory = this.game.getInventory();
    const totalSlots = inventory.getStatistics().totalSlots;
    
    // Clear existing slots
    this.itemSlots.forEach(slot => slot.destroy());
    this.itemSlots = [];
    this.gridElement.innerHTML = '';
    
    // Create new slots
    for (let i = 0; i < totalSlots; i++) {
      const slot = new ItemSlot({
        size: 'md',
        showQuantity: true,
        interactive: true,
        onClick: (item) => this.handleSlotClick(i),
        onRightClick: (item) => this.handleSlotRightClick(i)
      });
      
      // Enable drag & drop
      slot.enableDragDrop({
        onDragStart: (item) => {
          this.draggedFromSlot = i;
          this.game.getAudioManager()?.playUISound(SoundType.UI_TICK);
        },
        onDragEnd: () => {
          this.draggedFromSlot = null;
        },
        onDrop: (e) => {
          if (this.draggedFromSlot !== null && this.draggedFromSlot !== i) {
            this.handleSlotDrop(this.draggedFromSlot, i);
          }
        }
      });
      
      this.itemSlots.push(slot);
      this.gridElement.appendChild(slot.createSlot());
    }
  }
  
  updateContent(): void {
    const inventory = this.game.getInventory();
    const state: InventoryState = {
      usedSlots: inventory.getStatistics().usedSlots,
      totalSlots: inventory.getStatistics().totalSlots,
      upgradeCost: inventory.getUpgradeCost(),
      canAffordUpgrade: this.game.getCurrency() >= inventory.getUpgradeCost(),
      selectedItem: this.selectedSlotIndex !== null ? 
        inventory.getSlots()[this.selectedSlotIndex]?.item || null : null
    };
    
    // Update state with smart updater
    this.stateUpdater.update(state);
    
    // Update item slots
    this.updateItemSlots();
  }
  
  private updateItemSlots(): void {
    const inventory = this.game.getInventory();
    const slots = inventory.getSlots();
    const activeTab = this.tabManager.getActiveTab();
    
    this.itemSlots.forEach((itemSlot, index) => {
      if (index < slots.length) {
        const item = slots[index]?.item || null;
        
        // Update slot content
        itemSlot.updateSlot(item);
        
        // Update visibility based on active tab
        const visible = activeTab === 'ALL' || (item && item.type === activeTab);
        itemSlot.getElement().style.display = visible ? 'block' : 'none';
        
        // Update selected state
        itemSlot.setSelected(index === this.selectedSlotIndex);
      }
    });
  }
  
  private updateStatsDisplay(usedSlots: number, totalSlots: number): void {
    if (!this.statsElement) return;
    
    // Get current values if not provided
    if (usedSlots === -1 || totalSlots === -1) {
      const stats = this.game.getInventory().getStatistics();
      usedSlots = usedSlots === -1 ? stats.usedSlots : usedSlots;
      totalSlots = totalSlots === -1 ? stats.totalSlots : totalSlots;
    }
    
    this.statsElement.textContent = `${usedSlots}/${totalSlots} slots`;
  }
  
  private updateUpgradeButton(cost: number, canAfford: boolean): void {
    if (!this.upgradeButton) return;
    
    // Get current values if not provided
    if (cost === -1) {
      cost = this.game.getInventory().getUpgradeCost();
    }
    if (!canAfford) {
      canAfford = this.game.getCurrency() >= cost;
    }
    
    // Update button text
    const textSpan = this.upgradeButton.querySelector('span:not([class*="icon"])');
    if (textSpan) {
      textSpan.textContent = `Upgrade (${formatNumber(cost)})`;
    }
    
    // Update button state
    this.upgradeButton.classList.toggle('opacity-50', !canAfford);
    this.upgradeButton.classList.toggle('cursor-not-allowed', !canAfford);
    (this.upgradeButton as HTMLButtonElement).disabled = !canAfford;
  }
  
  private updateUseButton(item: InventoryItem | null): void {
    if (!this.useButton) return;
    
    const canUse = item !== null && item.type === ItemType.CONSUMABLE;
    this.useButton.classList.toggle('opacity-50', !canUse);
    this.useButton.classList.toggle('cursor-not-allowed', !canUse);
    (this.useButton as HTMLButtonElement).disabled = !canUse;
  }
  
  private handleTabChange(tabId: string): void {
    this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    this.updateItemSlots();
  }
  
  private handleSlotClick(index: number): void {
    const inventory = this.game.getInventory();
    const item = inventory.getSlots()[index]?.item || null;
    
    if (this.selectedSlotIndex === index) {
      // Deselect if clicking same slot
      this.selectedSlotIndex = null;
    } else {
      // Select new slot
      this.selectedSlotIndex = index;
      this.game.getAudioManager()?.playUISound(SoundType.UI_TICK);
    }
    
    // Force update of selected item
    this.stateUpdater.invalidate('selectedItem');
    this.updateContent();
  }
  
  private handleSlotRightClick(index: number): void {
    const inventory = this.game.getInventory();
    const item = inventory.getSlots()[index]?.item || null;
    
    if (item && item.type === ItemType.CONSUMABLE) {
      inventory.useItem(index);
      this.game.getAudioManager()?.playUISound(SoundType.ITEM_USE);
    }
  }
  
  private handleSlotDrop(fromIndex: number, toIndex: number): void {
    const inventory = this.game.getInventory();
    inventory.moveItem(fromIndex, toIndex);
    this.game.getAudioManager()?.playUISound(SoundType.UI_TICK);
  }
  
  private handleSort(): void {
    const inventory = this.game.getInventory();
    inventory.sortInventory();
    this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
  }
  
  private handleUse(): void {
    if (this.selectedSlotIndex !== null) {
      const inventory = this.game.getInventory();
      const item = inventory.getSlots()[this.selectedSlotIndex]?.item;
      
      if (item && item.type === ItemType.CONSUMABLE) {
        inventory.useItem(this.selectedSlotIndex);
        this.game.getAudioManager()?.playUISound(SoundType.ITEM_USE);
        
        // Clear selection if item was consumed
        const newItem = inventory.getSlots()[this.selectedSlotIndex]?.item;
        if (!newItem) {
          this.selectedSlotIndex = null;
        }
      }
    }
  }
  
  private handleUpgrade(): void {
    const inventory = this.game.getInventory();
    const cost = inventory.getUpgradeCost();
    
    if (this.game.getCurrency() >= cost) {
      inventory.upgradeCapacity();
      this.game.spendCurrency(cost);
      this.game.getAudioManager()?.playUISound(SoundType.UPGRADE);
      
      // Recreate slots with new capacity
      this.createItemSlots();
    }
  }
  
  private setupInventoryListeners(): void {
    const inventory = this.game.getInventory();
    
    inventory.on('inventoryChanged', () => {
      this.updateContent();
    });
    
    inventory.on('itemAdded', () => {
      this.game.getAudioManager()?.playUISound(SoundType.ITEM_PICKUP);
    });
  }
  
  public destroy(): void {
    // Clean up components
    this.tabManager.destroy();
    this.tooltip.destroy();
    this.itemSlots.forEach(slot => slot.destroy());
    
    // Call parent destroy
    super.destroy();
  }
}