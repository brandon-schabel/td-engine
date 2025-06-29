import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import type { InventoryItem } from '@/systems/Inventory';
import { FloatingUIManager } from './index';
import { ItemType } from '@/systems/Inventory';
import { ItemSlot } from '../components/inventory/SimpleItemSlot';
import { ItemTooltip } from '../components/inventory/SimpleItemTooltip';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { isMobile, isTablet } from '@/config/ResponsiveConfig';
import { createDialogHeader, createTabBar, createButton, cn, type Tab } from '@/ui/elements';

export class InventoryUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private updateInterval: number | null = null;
  // private contentInitialized = false; // Not used in this simplified version
  private lastStats = { usedSlots: -1, totalSlots: -1 };
  private lastUpgradeInfo = { cost: -1, canAfford: false };
  
  // UI state
  private activeTab: ItemType | 'ALL' = 'ALL';
  private selectedSlot: number | null = null;
  private selectedItem: InventoryItem | null = null;
  private itemSlots: ItemSlot[] = [];
  private tooltip: ItemTooltip;
  
  // Touch handling
  private touchStartX: number = 0;
  private currentTabIndex: number = 0;
  private tabOrder: (ItemType | 'ALL')[] = ['ALL', ItemType.CONSUMABLE, ItemType.EQUIPMENT, ItemType.MATERIAL, ItemType.SPECIAL];
  
  private screenPos?: { x: number; y: number };
  private anchorElement?: HTMLElement;
  private clickOutsideCleanup: (() => void) | null = null;

  constructor(game: Game, screenPos?: { x: number; y: number }, anchorElement?: HTMLElement) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
    this.tooltip = new ItemTooltip();
    this.screenPos = screenPos;
    this.anchorElement = anchorElement;
    this.create();
  }

  private create(): void {
    const elementId = 'inventory-ui';
    
    if (this.anchorElement) {
      // Use DOM element anchoring
      this.element = this.floatingUI.create(elementId, 'dialog', {
        anchorElement: this.anchorElement,
        anchor: 'top',
        offset: { x: 0, y: -10 },
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 1000,
        className: 'inventory-ui',
        screenSpace: true
      });
    } else {
      // Fallback to position-based approach
      let position = this.screenPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      
      // If we have a screen position (from button), position above control bar
      if (this.screenPos) {
        const controlBarHeight = 60;
        const menuHeight = 600; // Approximate height
        const menuWidth = 600; // Approximate width
        const padding = 10;
        
        // Center horizontally on the button, constrain to screen
        position.x = Math.max(
          menuWidth / 2 + padding,
          Math.min(this.screenPos.x, window.innerWidth - menuWidth / 2 - padding)
        );
        
        // Position above control bar
        position.y = window.innerHeight - controlBarHeight - menuHeight / 2 - padding;
      }
      
      this.element = this.floatingUI.create(elementId, 'dialog', {
        offset: { x: 0, y: 0 },
        anchor: 'center',
        smoothing: 0,
        autoHide: false,
        persistent: true,
        zIndex: 1000,
        className: 'inventory-ui',
        screenSpace: true
      });
      
      // Set target position
      const positionEntity = {
        position: position,
        getPosition: () => position
      };
      
      this.element.setTarget(positionEntity as unknown as Entity);
    }
    
    this.updateContent();
    this.element.enable();
    
    // Update content periodically - but smarter
    this.updateInterval = window.setInterval(() => {
      this.smartUpdate();
    }, 250);
    
    // Set up inventory listeners
    this.setupInventoryListeners();
    
    // Add click outside handler
    this.clickOutsideCleanup = this.floatingUI.addClickOutsideHandler(
      this.element,
      () => this.close(),
      ['.ui-control-bar button', '.ui-button-inventory'] // Exclude inventory button clicks
    );
  }

  private updateContent(): void {
    if (!this.element) return;

    const content = document.createElement('div');
    content.className = cn('ui-dialog', 'p-0');
    
    // Create header with close button
    const header = createDialogHeader('Inventory', () => this.close());
    content.appendChild(header);
    
    // Create tabs section
    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'inventory-tabs';
    tabsContainer.className = cn('p-4', 'pb-0');
    content.appendChild(tabsContainer);
    
    // Create inventory grid
    const grid = document.createElement('div');
    grid.id = 'inventory-grid';
    grid.className = cn('grid', 'gap-2', 'p-2', 'rounded-md', 'max-h-[400px]', 'overflow-y-auto');
    const columns = isMobile(window.innerWidth) ? 4 : isTablet(window.innerWidth) ? 6 : 8;
    grid.dataset.columns = String(columns);
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    content.appendChild(grid);
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = cn('flex', 'justify-between', 'items-center', 'mt-5', 'pt-4', 'border-t', 'border-default', 'p-4');
    
    // Stats display
    const stats = document.createElement('div');
    stats.className = cn('text-sm', 'text-secondary');
    stats.id = 'inventory-stats';
    stats.textContent = '0/0 slots';
    footer.appendChild(stats);
    
    // Action buttons container
    const actions = document.createElement('div');
    actions.className = cn('flex', 'gap-2');
    
    // Sort button
    const sortButton = createButton({
      id: 'sort-button',
      text: 'Sort',
      icon: IconType.UPGRADE,
      iconSize: 16,
      size: 'sm',
      variant: 'secondary',
      customClasses: ['action-button'],
      onClick: () => this.handleSort()
    });
    actions.appendChild(sortButton);
    
    // Use button
    const useButton = createButton({
      id: 'use-button',
      text: 'Use',
      icon: IconType.CHECKMARK,
      iconSize: 16,
      size: 'sm',
      variant: 'secondary',
      disabled: true,
      customClasses: ['action-button', 'use-button'],
      onClick: () => this.handleUse()
    });
    actions.appendChild(useButton);
    
    // Upgrade button - we'll update the text dynamically
    const upgradeButton = createButton({
      id: 'upgrade-button',
      text: 'Upgrade',
      icon: IconType.UPGRADE,
      iconSize: 16,
      size: 'sm',
      variant: 'secondary',
      customClasses: ['action-button', 'upgrade-button'],
      onClick: () => this.handleUpgrade()
    });
    
    // Store reference to the text span inside the button for dynamic updates
    const textSpan = upgradeButton.querySelector('span');
    if (textSpan) {
      textSpan.id = 'upgrade-button-text';
    }
    
    actions.appendChild(upgradeButton);
    footer.appendChild(actions);
    content.appendChild(footer);

    // Create tabs
    this.createTabs(content);
    
    // Create item slots
    this.createItemSlots(content);
    
    // Add touch swipe support
    if ('ontouchstart' in window) {
      this.setupTouchGestures(content);
    }

    this.element.setContent(content);
    
    // Initial updates
    this.updateSlots();
    this.updateStats();
    this.updateUpgradeButton();
  }

  private createTabs(container: HTMLElement): void {
    const tabsContainer = container.querySelector('#inventory-tabs');
    if (!tabsContainer) return;
    
    const tabs: Tab[] = [
      { id: 'ALL', label: 'All', icon: IconType.BUILD },
      { id: ItemType.CONSUMABLE, label: 'Items', icon: IconType.HEALTH },
      { id: ItemType.EQUIPMENT, label: 'Gear', icon: IconType.SHIELD },
      { id: ItemType.MATERIAL, label: 'Mats', icon: IconType.UPGRADE },
      { id: ItemType.SPECIAL, label: 'Special', icon: IconType.CROWN }
    ];
    
    const tabBar = createTabBar({
      tabs,
      defaultTabId: this.activeTab,
      variant: 'pills',
      size: 'sm',
      fullWidth: true,
      showContent: false,
      onChange: (tabId) => {
        this.setActiveTab(tabId as ItemType | 'ALL');
      },
      customClasses: []
    });
    
    tabsContainer.appendChild(tabBar);
  }

  private createItemSlots(container: HTMLElement): void {
    const grid = container.querySelector('#inventory-grid');
    if (!grid) return;
    
    const inventory = this.game.getInventory();
    const totalSlots = inventory.getStatistics().totalSlots;
    
    // Clear existing slots
    this.itemSlots.forEach(slot => slot.cleanup());
    this.itemSlots = [];
    grid.innerHTML = '';
    
    // Create new slots
    for (let i = 0; i < totalSlots; i++) {
      const slot = new ItemSlot({
        index: i,
        item: null,
        onSelect: (index) => this.handleSlotClick(index),
        onHover: (index) => this.handleSlotHover(index),
        onDrop: (fromSlot, toSlot) => this.handleSlotDrop(fromSlot, toSlot)
      });
      
      this.itemSlots.push(slot);
      grid.appendChild(slot.getElement());
    }
  }

  private setupTouchGestures(container: HTMLElement): void {
    container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    });
    
    container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - this.touchStartX;
      
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0 && this.currentTabIndex > 0) {
          this.currentTabIndex--;
          this.setActiveTab(this.tabOrder[this.currentTabIndex]);
        } else if (deltaX < 0 && this.currentTabIndex < this.tabOrder.length - 1) {
          this.currentTabIndex++;
          this.setActiveTab(this.tabOrder[this.currentTabIndex]);
        }
      }
    });
  }

  private setActiveTab(tab: ItemType | 'ALL'): void {
    this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
    this.activeTab = tab;
    this.currentTabIndex = this.tabOrder.indexOf(tab);
    
    // The tab bar component manages its own styling through the onChange callback
    // We just need to update the slots visibility
    this.updateSlots();
  }

  private updateSlots(): void {
    const inventory = this.game.getInventory();
    const slots = inventory.getSlots();
    
    // Track items that actually changed
    const changedIndices = new Set<number>();
    
    // First pass: detect changes
    this.itemSlots.forEach((slot, index) => {
      if (index < slots.length) {
        const inventorySlot = slots[index];
        const newItem = inventorySlot?.item || null;
        const currentItem = slot.getItem();
        
        // Check if item changed
        if (currentItem?.id !== newItem?.id || currentItem?.quantity !== newItem?.quantity) {
          changedIndices.add(index);
        }
      }
    });
    
    // Second pass: update only changed slots
    this.itemSlots.forEach((slot, index) => {
      if (index < slots.length) {
        const inventorySlot = slots[index];
        const item = inventorySlot?.item || null;
        
        // Only update if item changed
        if (changedIndices.has(index)) {
          slot.setItem(item);
        }
        
        // Update visibility based on tab (this is fast)
        const shouldShow = this.shouldShowItem(item);
        const element = slot.getElement();
        const isHidden = element.classList.contains('hidden');
        if (shouldShow && isHidden) {
          element.classList.remove('hidden');
        } else if (!shouldShow && !isHidden) {
          element.classList.add('hidden');
        }
        
        // Update selection state only if needed
        const isSelected = index === this.selectedSlot;
        const hasSelectedClass = slot.getElement().classList.contains('selected');
        if (isSelected && !hasSelectedClass) {
          slot.getElement().classList.add('selected', 'border-primary', 'shadow-glow-primary');
          slot.getElement().classList.remove('border-subtle');
        } else if (!isSelected && hasSelectedClass) {
          slot.getElement().classList.remove('selected', 'border-primary', 'shadow-glow-primary');
          slot.getElement().classList.add('border-subtle');
        }
      } else {
        // Handle slots beyond inventory size
        if (slot.getItem() !== null) {
          slot.setItem(null);
        }
        const element = slot.getElement();
        if (!element.classList.contains('hidden')) {
          element.classList.add('hidden');
        }
      }
    });
  }
  
  private smartUpdate(): void {
    // Only update what actually changed
    this.updateSlots();
    this.updateStats();
    this.updateUpgradeButton();
  }

  private shouldShowItem(item: InventoryItem | null): boolean {
    if (!item) return true;
    if (this.activeTab === 'ALL') return true;
    return item.type === this.activeTab;
  }

  private updateStats(): void {
    const inventory = this.game.getInventory();
    const stats = inventory.getStatistics();
    
    // Only update if stats changed
    if (stats.usedSlots !== this.lastStats.usedSlots || stats.totalSlots !== this.lastStats.totalSlots) {
      const statsElement = document.getElementById('inventory-stats');
      if (statsElement) {
        statsElement.textContent = `${stats.usedSlots}/${stats.totalSlots} slots`;
      }
      this.lastStats = { ...stats };
    }
  }

  private updateUpgradeButton(): void {
    const upgradeInfo = this.game.getInventoryUpgradeInfo();
    const canUpgrade = this.game.canUpgradeInventory();
    
    // Only update if something changed
    if (upgradeInfo.nextCost !== this.lastUpgradeInfo.cost || canUpgrade !== this.lastUpgradeInfo.canAfford) {
      const upgradeButton = document.getElementById('upgrade-button') as HTMLButtonElement;
      const upgradeText = document.getElementById('upgrade-button-text');
      
      if (upgradeButton && upgradeText) {
        if (upgradeInfo.nextCost === -1) {
          upgradeText.textContent = 'Max Capacity';
          upgradeButton.disabled = true;
        } else {
          upgradeText.textContent = `${upgradeInfo.nextCost}g`;
          upgradeButton.disabled = !canUpgrade;
        }
      }
      
      this.lastUpgradeInfo = { cost: upgradeInfo.nextCost, canAfford: canUpgrade };
    }
    
    // Update use button state only if selection changed
    const canUse = this.selectedSlot !== null && this.selectedItem !== null &&
      (this.selectedItem.type === ItemType.CONSUMABLE || this.selectedItem.type === ItemType.EQUIPMENT);
    
    const useButton = document.getElementById('use-button') as HTMLButtonElement;
    if (useButton && useButton.disabled === canUse) { // Only update if state changed
      useButton.disabled = !canUse;
    }
  }

  private handleSlotClick(index: number): void {
    this.game.getAudioManager()?.playUISound(SoundType.SELECT);
    
    const inventory = this.game.getInventory();
    const slots = inventory.getSlots();
    
    if (this.selectedSlot === index) {
      this.selectedSlot = null;
      this.selectedItem = null;
    } else {
      this.selectedSlot = index;
      this.selectedItem = slots[index]?.item || null;
    }
    
    this.updateSlots();
    this.updateUpgradeButton();
  }

  private handleSlotHover(index: number): void {
    const inventory = this.game.getInventory();
    const slots = inventory.getSlots();
    const item = slots[index]?.item || null;
    
    if (item) {
      const mouseEvent = window.event as MouseEvent;
      if (mouseEvent) {
        this.tooltip.show(item, mouseEvent.clientX, mouseEvent.clientY);
      }
    } else {
      this.tooltip.hide();
    }
  }

  private handleSlotDrop(fromSlot: number, toSlot: number): void {
    if (fromSlot !== toSlot) {
      const inventory = this.game.getInventory();
      const success = inventory.moveItem(fromSlot, toSlot);
      if (success) {
        this.game.getAudioManager()?.playUISound(SoundType.SELECT);
      } else {
        this.game.getAudioManager()?.playUISound(SoundType.ERROR);
      }
      this.updateSlots();
    }
  }

  private handleSort(): void {
    const inventory = this.game.getInventory();
    inventory.sortInventory();
    this.updateSlots();
    this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
  }

  private handleUse(): void {
    if (this.selectedSlot !== null && this.selectedItem) {
      const success = this.game.useInventoryItem(this.selectedSlot, 1);
      
      if (success) {
        this.game.getAudioManager()?.playUISound(SoundType.TOWER_UPGRADE);
        this.selectedSlot = null;
        this.selectedItem = null;
        this.updateSlots();
        this.updateUpgradeButton();
      } else {
        this.game.getAudioManager()?.playUISound(SoundType.ERROR);
      }
    }
  }

  private handleUpgrade(): void {
    const success = this.game.purchaseInventoryUpgrade();
    if (success) {
      this.game.getAudioManager()?.playUISound(SoundType.TOWER_UPGRADE);
      
      // Re-create item slots with new capacity
      const container = document.querySelector('.inventory-content');
      if (container) {
        this.createItemSlots(container as HTMLElement);
      }
      
      this.updateSlots();
      this.updateStats();
      this.updateUpgradeButton();
    } else {
      this.game.getAudioManager()?.playUISound(SoundType.ERROR);
    }
  }

  private setupInventoryListeners(): void {
    const inventory = this.game.getInventory();
    if (inventory && 'on' in inventory) {
      (inventory as any).on('inventoryChanged', () => {
        this.updateSlots();
        this.updateStats();
      });
    }
  }

  private close(): void {
    this.destroy();
  }

  public destroy(): void {
    // Hide tooltip
    this.tooltip.hide();
    
    // Clean up tooltip if it has cleanup method
    if ('cleanup' in this.tooltip && typeof this.tooltip.cleanup === 'function') {
      this.tooltip.cleanup();
    }
    
    // Clean up item slots
    this.itemSlots.forEach(slot => slot.cleanup());
    this.itemSlots = [];
    
    // Clear update interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    
    // Clean up click outside handler
    if (this.clickOutsideCleanup) {
      this.clickOutsideCleanup();
      this.clickOutsideCleanup = null;
      this.updateInterval = null;
    }
    
    // Remove inventory listeners
    const inventory = this.game.getInventory();
    if (inventory && 'off' in inventory) {
      (inventory as any).off('inventoryChanged');
    }
    
    // Remove floating UI element
    if (this.element) {
      this.floatingUI.remove(this.element.id);
      this.element = null;
    }
  }
  
  public show(): void {
    // Element is already created and shown in the constructor
    // This method exists for UIController compatibility
    if (this.element) {
      this.element.enable();
    }
  }
}