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
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { DIALOG_CONFIG } from '@/config/UIConfig';
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
    content.className = 'inventory-content';
    
    // Add styles
    content.innerHTML = `
      <style>
        .inventory-content {
          padding: ${UI_CONSTANTS.spacing.lg}px;
          background: ${COLOR_THEME.ui.background.secondary};
          border: 2px solid ${COLOR_THEME.ui.border.default};
          border-radius: 8px;
          width: ${DIALOG_CONFIG.sizes.large}px;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        
        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${UI_CONSTANTS.spacing.lg}px;
        }
        
        .inventory-title {
          font-size: 20px;
          font-weight: bold;
          color: ${COLOR_THEME.ui.text.primary};
        }
        
        .inventory-close {
          background: ${COLOR_THEME.ui.button.danger};
          color: white;
          border: none;
          padding: ${UI_CONSTANTS.spacing.sm}px ${UI_CONSTANTS.spacing.md}px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .inventory-close:hover {
          opacity: 0.8;
        }
        
        .inventory-tabs {
          display: flex;
          background: rgba(40, 40, 40, 0.8);
          border-radius: 8px;
          margin-bottom: 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .inventory-tabs::-webkit-scrollbar {
          display: none;
        }
        
        .inventory-tab {
          flex: 1;
          min-width: clamp(60px, 15vw, 100px);
          padding: 12px 8px;
          background: transparent;
          border: none;
          color: #CCCCCC;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: clamp(10px, 2.5vw, 12px);
        }
        
        .inventory-tab.active {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }
        
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(${isMobile(window.innerWidth) ? 4 : isTablet(window.innerWidth) ? 6 : 8}, 1fr);
          gap: ${DIALOG_CONFIG.spacing.itemGap}px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          max-height: ${isMobile(window.innerWidth) ? 'calc(100vh - 300px)' : 'clamp(200px, 50vh, 400px)'};
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          flex: 1;
        }
        
        .inventory-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: ${UI_CONSTANTS.spacing.lg}px;
          padding-top: ${UI_CONSTANTS.spacing.md}px;
          border-top: 1px solid ${COLOR_THEME.ui.border.default};
        }
        
        .inventory-stats {
          color: #CCCCCC;
          font-size: clamp(12px, 3vw, 14px);
        }
        
        .inventory-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .action-button {
          padding: ${UI_CONSTANTS.spacing.sm}px ${UI_CONSTANTS.spacing.md}px;
          background: ${COLOR_THEME.ui.button.primary};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        
        .action-button:hover:not(:disabled) {
          opacity: 0.8;
        }
        
        .action-button:disabled {
          background: ${COLOR_THEME.ui.button.secondary};
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .action-button.use-button {
          background: #2196F3;
        }
        
        .action-button.upgrade-button {
          background: #FFC107;
        }
      </style>
      
      <div class="inventory-header">
        <h2 class="inventory-title">Inventory</h2>
        <button class="inventory-close">✕</button>
      </div>
      
      <div class="inventory-tabs" id="inventory-tabs"></div>
      <div class="inventory-grid" id="inventory-grid"></div>
      
      <div class="inventory-footer">
        <div class="inventory-stats" id="inventory-stats">0/0 slots</div>
        <div class="inventory-actions">
          <button class="action-button" id="sort-button">
            ${createSvgIcon(IconType.UPGRADE, { size: 16 })}
            Sort
          </button>
          <button class="action-button use-button" id="use-button" disabled>
            ${createSvgIcon(IconType.CHECKMARK, { size: 16 })}
            Use
          </button>
          <button class="action-button upgrade-button" id="upgrade-button">
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
      closeButton.addEventListener('click', () => this.close());
    }
    
    const sortButton = content.querySelector('#sort-button');
    if (sortButton) {
      sortButton.addEventListener('click', () => this.handleSort());
    }
    
    const useButton = content.querySelector('#use-button');
    if (useButton) {
      useButton.addEventListener('click', () => this.handleUse());
    }
    
    const upgradeButton = content.querySelector('#upgrade-button');
    if (upgradeButton) {
      upgradeButton.addEventListener('click', () => this.handleUpgrade());
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
      
      tabButton.addEventListener('click', () => {
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
    const tabs = document.querySelectorAll('.inventory-tab');
    tabs.forEach((tabElement, index) => {
      if (this.tabOrder[index] === tab) {
        tabElement.classList.add('active');
      } else {
        tabElement.classList.remove('active');
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
          slot.getElement().style.borderColor = '#4CAF50';
          slot.getElement().style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
        } else {
          slot.getElement().style.borderColor = 'rgba(255, 255, 255, 0.2)';
          slot.getElement().style.boxShadow = 'none';
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