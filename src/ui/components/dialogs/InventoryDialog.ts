import { BaseDialog } from './BaseDialog';
import type { Game } from '@/core/Game';
import type { Inventory, InventoryItem, ItemType } from '@/systems/Inventory';
import { ItemSlot } from '../inventory/SimpleItemSlot';
import { ItemTooltip } from '../inventory/SimpleItemTooltip';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';

export interface InventoryDialogOptions {
  game: Game;
  inventory: Inventory;
  audioManager: AudioManager;
}

export class InventoryDialog extends BaseDialog {
  private game: Game;
  private inventory: Inventory;
  private itemSlots: ItemSlot[] = [];
  private tooltip: ItemTooltip;
  
  // UI elements
  private tabs: HTMLElement | null = null;
  private grid: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  
  // State
  private activeTab: ItemType | 'ALL' = 'ALL';
  private selectedSlot: number | null = null;
  private selectedItem: InventoryItem | null = null;
  
  // Touch handling
  private touchStartX: number = 0;
  private currentTabIndex: number = 0;
  private tabOrder: (ItemType | 'ALL')[] = ['ALL', 'CONSUMABLE', 'EQUIPMENT', 'MATERIAL', 'SPECIAL'];
  
  constructor(options: InventoryDialogOptions) {
    super({
      title: 'Inventory',
      width: DIALOG_CONFIG.sizes.large,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'inventory-dialog'
    });
    
    this.game = options.game;
    this.inventory = options.inventory;
    
    this.tooltip = new ItemTooltip({
      game: options.game,
      audioManager: options.audioManager
    });
    
    this.buildContent();
    this.setupInventoryListeners();
  }
  
  protected buildContent(): void {
    // Create tabs
    this.createTabs();
    
    // Create grid area
    this.createGrid();
    
    // Create footer with stats and actions
    this.createFooter();
    const footer = this.footer!;
    
    // Stats container
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      color: #CCCCCC;
      font-size: clamp(12px, 3vw, 14px);
    `;
    
    this.statsElement = document.createElement('span');
    statsContainer.appendChild(this.statsElement);
    
    // Actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    `;
    
    // Sort button
    const sortButton = this.createButton('Sort', {
      icon: IconType.UPGRADE,
      onClick: () => {
        this.inventory.sortInventory();
        this.updateSlots();
      }
    });
    
    // Use button
    const useButton = this.createButton('Use', {
      icon: IconType.CHECKMARK,
      color: '#2196F3',
      onClick: () => {
        if (this.selectedSlot !== null && this.selectedItem) {
          this.useItem(this.selectedSlot, this.selectedItem);
        }
      }
    });
    useButton.id = 'use-button';
    useButton.disabled = true;
    
    // Upgrade button
    const upgradeButton = this.createButton('Upgrade', {
      icon: IconType.UPGRADE,
      color: '#FFC107',
      onClick: () => {
        const success = this.game.purchaseInventoryUpgrade();
        if (success) {
          this.playSound(SoundType.TOWER_UPGRADE);
          this.updateSlots();
          this.updateUpgradeButton();
        } else {
          this.playSound(SoundType.ERROR);
        }
      }
    });
    upgradeButton.id = 'upgrade-button';
    
    actionsContainer.appendChild(sortButton);
    actionsContainer.appendChild(useButton);
    actionsContainer.appendChild(upgradeButton);
    
    footer.appendChild(statsContainer);
    footer.appendChild(actionsContainer);
    
    // Mount tooltip to content
    this.tooltip.mount(this.content);
    
    // Initial update
    this.updateSlots();
    this.updateUpgradeButton();
  }
  
  private createTabs(): void {
    this.tabs = document.createElement('div');
    this.tabs.className = 'inventory-tabs';
    this.tabs.style.cssText = `
      display: flex;
      background: rgba(40, 40, 40, 0.8);
      border-radius: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
    `;
    
    // Hide scrollbar
    const style = document.createElement('style');
    style.textContent = `
      .inventory-tabs::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    const tabData = [
      { id: 'ALL', name: 'All', icon: IconType.BUILD },
      { id: 'CONSUMABLE', name: 'Items', icon: IconType.HEALTH },
      { id: 'EQUIPMENT', name: 'Gear', icon: IconType.SHIELD },
      { id: 'MATERIAL', name: 'Mats', icon: IconType.UPGRADE },
      { id: 'SPECIAL', name: 'Special', icon: IconType.CROWN }
    ];
    
    tabData.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = `inventory-tab ${this.activeTab === tab.id ? 'active' : ''}`;
      tabButton.style.cssText = `
        flex: 1;
        min-width: clamp(60px, 15vw, 100px);
        padding: 12px 8px;
        background: ${this.activeTab === tab.id ? 'rgba(76, 175, 80, 0.2)' : 'transparent'};
        border: none;
        color: ${this.activeTab === tab.id ? '#4CAF50' : '#CCCCCC'};
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: clamp(10px, 2.5vw, 12px);
      `;
      
      const icon = createSvgIcon(tab.icon, { size: 20 });
      tabButton.innerHTML = `${icon}<span>${tab.name}</span>`;
      
      tabButton.addEventListener('click', () => {
        this.setActiveTab(tab.id as any);
      });
      
      this.tabs.appendChild(tabButton);
    });
    
    this.content.appendChild(this.tabs);
    
    // Touch swipe support for tabs
    if ('ontouchstart' in window) {
      this.setupTabSwipeGestures();
    }
  }
  
  private createGrid(): void {
    this.grid = document.createElement('div');
    this.grid.className = 'inventory-grid';
    
    // Responsive grid columns
    const columns = window.innerWidth <= 480 ? 4 : 
                   window.innerWidth <= 768 ? 6 : 8;
    
    this.grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: ${DIALOG_CONFIG.spacing.itemGap}px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      max-height: clamp(200px, 50vh, 400px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;
    
    // Create initial slots
    this.createItemSlots();
    
    this.content.appendChild(this.grid);
  }
  
  private createItemSlots(): void {
    const totalSlots = this.inventory.getStatistics().totalSlots;
    
    for (let i = 0; i < totalSlots; i++) {
      const slot = new ItemSlot({
        slotIndex: i,
        item: null,
        game: this.game,
        audioManager: this.options.audioManager!,
        onClick: (index, item) => this.handleSlotClick(index, item),
        onHover: (index, item, event) => this.handleSlotHover(index, item, event),
        onDragStart: (index) => this.handleSlotDragStart(index),
        onDragEnd: (fromSlot, toSlot) => this.handleSlotDragEnd(fromSlot, toSlot)
      });
      
      this.itemSlots.push(slot);
      slot.mount(this.grid!);
    }
  }
  
  private setupTabSwipeGestures(): void {
    this.content.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    });
    
    this.content.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - this.touchStartX;
      
      if (Math.abs(deltaX) > 50) { // Swipe threshold
        if (deltaX > 0 && this.currentTabIndex > 0) {
          // Swipe right - previous tab
          this.currentTabIndex--;
          this.setActiveTab(this.tabOrder[this.currentTabIndex]);
        } else if (deltaX < 0 && this.currentTabIndex < this.tabOrder.length - 1) {
          // Swipe left - next tab
          this.currentTabIndex++;
          this.setActiveTab(this.tabOrder[this.currentTabIndex]);
        }
      }
    });
  }
  
  private setActiveTab(tab: ItemType | 'ALL'): void {
    this.playSound(SoundType.BUTTON_CLICK);
    this.activeTab = tab;
    this.currentTabIndex = this.tabOrder.indexOf(tab);
    this.updateTabs();
    this.updateSlots();
  }
  
  private updateTabs(): void {
    if (!this.tabs) return;
    
    const tabButtons = this.tabs.querySelectorAll('.inventory-tab');
    tabButtons.forEach((button, index) => {
      const isActive = this.tabOrder[index] === this.activeTab;
      
      (button as HTMLElement).style.background = isActive ? 'rgba(76, 175, 80, 0.2)' : 'transparent';
      (button as HTMLElement).style.color = isActive ? '#4CAF50' : '#CCCCCC';
    });
  }
  
  private updateSlots(): void {
    const slots = this.inventory.getSlots();
    const stats = this.inventory.getStatistics();
    
    // Check if we need to add more slots
    while (this.itemSlots.length < slots.length) {
      const slotIndex = this.itemSlots.length;
      const slot = new ItemSlot({
        slotIndex,
        item: null,
        game: this.game,
        audioManager: this.options.audioManager!,
        onClick: (index, item) => this.handleSlotClick(index, item),
        onHover: (index, item, event) => this.handleSlotHover(index, item, event),
        onDragStart: (index) => this.handleSlotDragStart(index),
        onDragEnd: (fromSlot, toSlot) => this.handleSlotDragEnd(fromSlot, toSlot)
      });
      
      this.itemSlots.push(slot);
      if (this.grid) {
        slot.mount(this.grid);
      }
    }
    
    // Update each slot
    this.itemSlots.forEach((slot, index) => {
      if (index < slots.length) {
        const inventorySlot = slots[index];
        const item = inventorySlot?.item || null;
        
        // Apply tab filtering
        const shouldShow = this.shouldShowItem(item);
        slot.updateProps({ 
          item: shouldShow ? item : null,
          visible: shouldShow
        });
      } else {
        slot.updateProps({
          item: null,
          visible: false
        });
      }
    });
    
    // Update stats
    if (this.statsElement) {
      this.statsElement.textContent = `${stats.usedSlots}/${stats.totalSlots} slots`;
    }
  }
  
  private shouldShowItem(item: InventoryItem | null): boolean {
    if (!item) return true; // Show empty slots
    if (this.activeTab === 'ALL') return true;
    return item.type === this.activeTab;
  }
  
  private handleSlotClick(slotIndex: number, item: InventoryItem | null): void {
    this.playSound(SoundType.SELECT);
    
    if (this.selectedSlot === slotIndex) {
      // Deselect
      this.selectedSlot = null;
      this.selectedItem = null;
    } else {
      // Select
      this.selectedSlot = slotIndex;
      this.selectedItem = item;
    }
    
    this.updateSlotSelection();
  }
  
  private handleSlotHover(slotIndex: number, item: InventoryItem | null, event: MouseEvent): void {
    if (item) {
      const rect = this.content.getBoundingClientRect();
      this.tooltip.show(item, event.clientX - rect.left, event.clientY - rect.top);
    } else {
      this.tooltip.hide();
    }
  }
  
  private handleSlotDragStart(slotIndex: number): void {
    // Drag start logic
  }
  
  private handleSlotDragEnd(fromSlot: number, toSlot: number): void {
    if (fromSlot !== toSlot) {
      const success = this.inventory.moveItem(fromSlot, toSlot);
      if (success) {
        this.playSound(SoundType.SELECT);
      } else {
        this.playSound(SoundType.ERROR);
      }
    }
  }
  
  private updateSlotSelection(): void {
    this.itemSlots.forEach((slot, index) => {
      slot.updateProps({ 
        selected: index === this.selectedSlot 
      });
    });
    
    // Update use button
    const useButton = document.getElementById('use-button') as HTMLButtonElement;
    if (useButton) {
      const canUse = this.selectedSlot !== null && this.selectedItem !== null &&
        (this.selectedItem.type === 'CONSUMABLE' || this.selectedItem.type === 'EQUIPMENT');
      
      useButton.disabled = !canUse;
      useButton.style.opacity = canUse ? '1' : '0.5';
    }
  }
  
  private updateUpgradeButton(): void {
    const upgradeButton = document.getElementById('upgrade-button') as HTMLButtonElement;
    if (!upgradeButton) return;
    
    const upgradeInfo = this.game.getInventoryUpgradeInfo();
    const canUpgrade = this.game.canUpgradeInventory();
    
    if (upgradeInfo.nextCost === -1) {
      upgradeButton.innerHTML = `<span>Max Capacity</span>`;
      upgradeButton.disabled = true;
    } else {
      const icon = createSvgIcon(IconType.UPGRADE, { size: 20 });
      upgradeButton.innerHTML = `${icon}<span>${upgradeInfo.nextCost}g</span>`;
      upgradeButton.disabled = !canUpgrade;
    }
    
    upgradeButton.style.opacity = upgradeButton.disabled ? '0.5' : '1';
  }
  
  private useItem(slotIndex: number, item: InventoryItem): void {
    const success = this.game.useInventoryItem(slotIndex);
    
    if (success) {
      this.playSound(SoundType.TOWER_UPGRADE);
      this.selectedSlot = null;
      this.selectedItem = null;
      this.updateSlots();
      this.updateSlotSelection();
    } else {
      this.playSound(SoundType.ERROR);
    }
  }
  
  private setupInventoryListeners(): void {
    this.inventory.on('inventoryChanged', () => {
      this.updateSlots();
    });
  }
  
  protected afterShow(): void {
    this.updateSlots();
  }
  
  protected beforeHide(): void {
    this.tooltip.hide();
  }
  
  protected onResize(): void {
    // Update grid columns on resize
    if (this.grid) {
      const columns = window.innerWidth <= 480 ? 4 : 
                     window.innerWidth <= 768 ? 6 : 8;
      this.grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
  }
  
  protected onDestroy(): void {
    this.tooltip.unmount();
    this.itemSlots.forEach(slot => slot.unmount());
  }
}