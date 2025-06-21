import type { Game } from '@/core/Game';
import type { Entity } from '@/entities/Entity';
import type { FloatingUIElement } from './index';
import type { InventoryItem } from '@/systems/Inventory';
import { FloatingUIManager } from './index';
import { ItemType } from '@/systems/Inventory';
import { ItemSlot } from '../components/inventory/SimpleItemSlot';
import { ItemTooltip } from '../components/inventory/SimpleItemTooltip';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';
import { isMobile, isTablet } from '@/config/ResponsiveConfig';

export class InventoryUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  private game: Game;
  private updateInterval: number | null = null;
  
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

  constructor(game: Game) {
    this.floatingUI = game.getFloatingUIManager();
    this.game = game;
    this.tooltip = new ItemTooltip();
    this.create();
  }

  private create(): void {
    const elementId = 'inventory-ui';
    
    this.element = this.floatingUI.create(elementId, 'dialog', {
      offset: { x: 0, y: 0 },
      anchor: 'center',
      smoothing: 0,
      autoHide: false,
      persistent: true,
      zIndex: 1000,
      className: 'inventory-ui'
    });
    
    // Set target to center of screen
    const centerEntity = {
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      getPosition: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    };
    
    this.element.setTarget(centerEntity as Entity);
    this.updateContent();
    this.element.enable();
    
    // Update content periodically
    this.updateInterval = window.setInterval(() => {
      this.updateSlots();
      this.updateStats();
      this.updateUpgradeButton();
    }, 250);
    
    // Set up inventory listeners
    this.setupInventoryListeners();
  }

  private updateContent(): void {
    if (!this.element) return;

    const content = document.createElement('div');
    content.className = 'inventory-dialog';
    
    content.innerHTML = `
      <div class="inventory-header">
        <h2 class="inventory-title">Inventory</h2>
        <button class="ui-button inventory-close" aria-label="Close inventory">✕</button>
      </div>
      
      <div class="inventory-tabs" id="inventory-tabs"></div>
      <div class="inventory-grid" id="inventory-grid" data-columns="${isMobile(window.innerWidth) ? 4 : isTablet(window.innerWidth) ? 6 : 8}"></div>
      
      <div class="inventory-footer">
        <div class="inventory-stats" id="inventory-stats">0/0 slots</div>
        <div class="inventory-actions">
          <button class="ui-button action-button" id="sort-button">
            ${createSvgIcon(IconType.UPGRADE, { size: 16 })}
            Sort
          </button>
          <button class="ui-button action-button use-button" id="use-button" disabled>
            ${createSvgIcon(IconType.CHECKMARK, { size: 16 })}
            Use
          </button>
          <button class="ui-button action-button upgrade-button" id="upgrade-button">
            ${createSvgIcon(IconType.UPGRADE, { size: 16 })}
            <span id="upgrade-button-text">Upgrade</span>
          </button>
        </div>
      </div>
    `;

    // Create tabs
    this.createTabs(content);
    
    // Create item slots
    this.createItemSlots(content);
    
    // Add event listeners
    const closeButton = content.querySelector('.inventory-close');
    if (closeButton) {
      addClickAndTouchSupport(closeButton as HTMLElement, () => this.close());
    }
    
    const sortButton = content.querySelector('#sort-button');
    if (sortButton) {
      addClickAndTouchSupport(sortButton as HTMLElement, () => this.handleSort());
    }
    
    const useButton = content.querySelector('#use-button');
    if (useButton) {
      addClickAndTouchSupport(useButton as HTMLElement, () => this.handleUse());
    }
    
    const upgradeButton = content.querySelector('#upgrade-button');
    if (upgradeButton) {
      addClickAndTouchSupport(upgradeButton as HTMLElement, () => this.handleUpgrade());
    }
    
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
    
    const tabData = [
      { id: 'ALL', name: 'All', icon: IconType.BUILD },
      { id: ItemType.CONSUMABLE, name: 'Items', icon: IconType.HEALTH },
      { id: ItemType.EQUIPMENT, name: 'Gear', icon: IconType.SHIELD },
      { id: ItemType.MATERIAL, name: 'Mats', icon: IconType.UPGRADE },
      { id: ItemType.SPECIAL, name: 'Special', icon: IconType.CROWN }
    ];
    
    tabData.forEach((tab) => {
      const tabButton = document.createElement('button');
      tabButton.className = `inventory-tab ${this.activeTab === tab.id ? 'active' : ''}`;
      tabButton.innerHTML = `${createSvgIcon(tab.icon, { size: 20 })}<span>${tab.name}</span>`;
      
      addClickAndTouchSupport(tabButton, () => {
        this.setActiveTab(tab.id as any);
      });
      
      tabsContainer.appendChild(tabButton);
    });
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
    
    // Update tab styles
    const tabs = document.querySelectorAll('[data-tab-id]');
    tabs.forEach((tabElement) => {
      const isActive = tabElement.getAttribute('data-tab-id') === tab;
      if (isActive) {
        tabElement.classList.remove('outline');
      } else {
        tabElement.classList.add('outline');
      }
    });
    
    this.updateSlots();
  }

  private updateSlots(): void {
    const inventory = this.game.getInventory();
    const slots = inventory.getSlots();
    
    // Update each slot
    this.itemSlots.forEach((slot, index) => {
      if (index < slots.length) {
        const inventorySlot = slots[index];
        const item = inventorySlot?.item || null;
        
        // Apply tab filtering
        const shouldShow = this.shouldShowItem(item);
        slot.setItem(shouldShow ? item : null);
        slot.getElement().style.display = shouldShow ? 'block' : 'none';
        
        // Update selection state
        if (index === this.selectedSlot) {
          slot.getElement().classList.add('selected');
        } else {
          slot.getElement().classList.remove('selected');
        }
      } else {
        slot.setItem(null);
        slot.getElement().style.display = 'none';
      }
    });
  }

  private shouldShowItem(item: InventoryItem | null): boolean {
    if (!item) return true;
    if (this.activeTab === 'ALL') return true;
    return item.type === this.activeTab;
  }

  private updateStats(): void {
    const inventory = this.game.getInventory();
    const stats = inventory.getStatistics();
    const statsElement = document.getElementById('inventory-stats');
    if (statsElement) {
      statsElement.textContent = `${stats.usedSlots}/${stats.totalSlots} slots`;
    }
  }

  private updateUpgradeButton(): void {
    const upgradeButton = document.getElementById('upgrade-button') as HTMLButtonElement;
    const upgradeText = document.getElementById('upgrade-button-text');
    if (!upgradeButton || !upgradeText) return;
    
    const upgradeInfo = this.game.getInventoryUpgradeInfo();
    const canUpgrade = this.game.canUpgradeInventory();
    
    if (upgradeInfo.nextCost === -1) {
      upgradeText.textContent = 'Max Capacity';
      upgradeButton.disabled = true;
    } else {
      upgradeText.textContent = `${upgradeInfo.nextCost}g`;
      upgradeButton.disabled = !canUpgrade;
    }
    
    // Update use button state
    const useButton = document.getElementById('use-button') as HTMLButtonElement;
    if (useButton) {
      const canUse = this.selectedSlot !== null && this.selectedItem !== null &&
        (this.selectedItem.type === ItemType.CONSUMABLE || this.selectedItem.type === ItemType.EQUIPMENT);
      
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
}