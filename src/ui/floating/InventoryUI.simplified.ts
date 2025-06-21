/**
 * Recent changes:
 * - Removed inline styles in favor of centralized styling system
 * - Removed direct responsive checks, now handled by CSS
 * - Simplified component by using shared styles
 * - Maintained all functionality while reducing code complexity
 * - Integrated with new StyleManager system
 */

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
    
    content.innerHTML = `
      <div class="inventory-header">
        <h2 class="inventory-title">Inventory</h2>
        <button class="inventory-close">✕</button>
      </div>
      
      <div class="inventory-tabs" id="inventory-tabs"></div>
      <div class="inventory-body">
        <div class="inventory-left">
          <div class="inventory-slots" id="inventory-grid"></div>
        </div>
        <div class="inventory-right">
          <div class="equipment-panel">
            <h3 class="panel-title">Equipment</h3>
            <div class="equipment-slots" id="equipment-slots"></div>
          </div>
          <div class="stats-panel">
            <h3 class="panel-title">Stats</h3>
            <div class="stats-list" id="stats-list"></div>
          </div>
        </div>
      </div>
      
      <div class="inventory-footer">
        <div class="inventory-stats" id="inventory-stats">0/0 slots</div>
        <div class="inventory-actions">
          <button class="ui-button" id="sort-button">
            ${createSvgIcon(IconType.UPGRADE, { size: 16 })}
            Sort
          </button>
          <button class="ui-button primary" id="use-button" disabled>
            ${createSvgIcon(IconType.CHECKMARK, { size: 16 })}
            Use
          </button>
          <button class="ui-button success" id="upgrade-button">
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
    this.addEventListeners(content);
    
    // Update initial state
    this.updateStats();
    this.updateUpgradeButton();
    
    this.element.setContent(content);
  }

  private createTabs(container: HTMLElement): void {
    const tabsContainer = container.querySelector('#inventory-tabs');
    if (!tabsContainer) return;

    this.tabOrder.forEach((tabType, index) => {
      const tab = document.createElement('button');
      tab.className = 'inventory-tab';
      if (tabType === this.activeTab) {
        tab.classList.add('active');
      }

      const icon = this.getTabIcon(tabType);
      const label = this.getTabLabel(tabType);
      
      tab.innerHTML = `
        ${createSvgIcon(icon, { size: 20 })}
        <span>${label}</span>
      `;

      tab.addEventListener('click', () => {
        this.game.getAudioManager()?.playUISound(SoundType.SELECT);
        this.setActiveTab(tabType);
        this.currentTabIndex = index;
      });

      tabsContainer.appendChild(tab);
    });
  }

  private getTabIcon(type: ItemType | 'ALL'): IconType {
    switch (type) {
      case 'ALL': return IconType.INVENTORY;
      case ItemType.CONSUMABLE: return IconType.CONSUMABLE;
      case ItemType.EQUIPMENT: return IconType.EQUIPMENT;
      case ItemType.MATERIAL: return IconType.MATERIAL;
      case ItemType.SPECIAL: return IconType.SPECIAL;
      default: return IconType.INVENTORY;
    }
  }

  private getTabLabel(type: ItemType | 'ALL'): string {
    switch (type) {
      case 'ALL': return 'All';
      case ItemType.CONSUMABLE: return 'Consumables';
      case ItemType.EQUIPMENT: return 'Equipment';
      case ItemType.MATERIAL: return 'Materials';
      case ItemType.SPECIAL: return 'Special';
      default: return 'Unknown';
    }
  }

  private createItemSlots(container: HTMLElement): void {
    const grid = container.querySelector('#inventory-grid');
    if (!grid) return;

    // Clear existing slots
    grid.innerHTML = '';
    this.itemSlots = [];

    const inventory = this.game.getInventory();
    const items = this.getFilteredItems();
    const maxSlots = inventory.getMaxSlots();

    for (let i = 0; i < maxSlots; i++) {
      const item = items[i];
      const slot = new ItemSlot(i, item);
      
      slot.onClick = () => this.handleSlotClick(i, item);
      slot.onHover = (item, element) => this.showTooltip(item, element);
      slot.onHoverEnd = () => this.hideTooltip();
      
      this.itemSlots.push(slot);
      grid.appendChild(slot.getElement());
    }
  }

  private getFilteredItems(): InventoryItem[] {
    const inventory = this.game.getInventory();
    const items = inventory.getItems();
    
    if (this.activeTab === 'ALL') {
      return items;
    }
    
    return items.filter(item => item.type === this.activeTab);
  }

  private handleSlotClick(slotIndex: number, item: InventoryItem | undefined): void {
    this.game.getAudioManager()?.playUISound(SoundType.SELECT);
    
    if (this.selectedSlot === slotIndex) {
      this.selectedSlot = null;
      this.selectedItem = null;
    } else {
      this.selectedSlot = slotIndex;
      this.selectedItem = item || null;
    }
    
    this.updateSlotSelection();
    this.updateActionButtons();
  }

  private updateSlotSelection(): void {
    this.itemSlots.forEach((slot, index) => {
      slot.setSelected(index === this.selectedSlot);
    });
  }

  private showTooltip(item: InventoryItem, element: HTMLElement): void {
    this.tooltip.show(item, element);
  }

  private hideTooltip(): void {
    this.tooltip.hide();
  }

  private setActiveTab(tab: ItemType | 'ALL'): void {
    this.activeTab = tab;
    this.selectedSlot = null;
    this.selectedItem = null;
    this.updateContent();
  }

  private updateSlots(): void {
    const items = this.getFilteredItems();
    this.itemSlots.forEach((slot, index) => {
      slot.setItem(items[index]);
    });
  }

  private updateStats(): void {
    const statsElement = document.querySelector('#inventory-stats');
    if (!statsElement) return;

    const inventory = this.game.getInventory();
    const usedSlots = inventory.getUsedSlots();
    const maxSlots = inventory.getMaxSlots();
    
    statsElement.textContent = `${usedSlots}/${maxSlots} slots`;
  }

  private updateUpgradeButton(): void {
    const upgradeButton = document.querySelector('#upgrade-button') as HTMLButtonElement;
    const upgradeText = document.querySelector('#upgrade-button-text');
    if (!upgradeButton || !upgradeText) return;

    const inventory = this.game.getInventory();
    const level = inventory.getLevel();
    const maxLevel = inventory.getMaxLevel();
    const upgradeCost = inventory.getUpgradeCost();
    const canUpgrade = inventory.canUpgrade();

    if (level >= maxLevel) {
      upgradeText.textContent = 'Max Level';
      upgradeButton.disabled = true;
    } else {
      upgradeText.textContent = `Upgrade (${upgradeCost} coins)`;
      upgradeButton.disabled = !canUpgrade;
    }
  }

  private updateActionButtons(): void {
    const useButton = document.querySelector('#use-button') as HTMLButtonElement;
    if (!useButton) return;

    if (this.selectedItem && this.selectedItem.type === ItemType.CONSUMABLE) {
      useButton.disabled = false;
    } else {
      useButton.disabled = true;
    }
  }

  private addEventListeners(container: HTMLElement): void {
    // Close button
    const closeButton = container.querySelector('.inventory-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        this.hide();
      });
    }

    // Sort button
    const sortButton = container.querySelector('#sort-button');
    if (sortButton) {
      sortButton.addEventListener('click', () => {
        this.game.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
        this.game.getInventory().sort();
        this.updateContent();
      });
    }

    // Use button
    const useButton = container.querySelector('#use-button');
    if (useButton) {
      useButton.addEventListener('click', () => {
        if (this.selectedItem && this.selectedSlot !== null) {
          this.game.getAudioManager()?.playUISound(SoundType.USE_ITEM);
          this.game.getInventory().useItem(this.selectedSlot);
          this.selectedItem = null;
          this.selectedSlot = null;
          this.updateContent();
        }
      });
    }

    // Upgrade button
    const upgradeButton = container.querySelector('#upgrade-button');
    if (upgradeButton) {
      upgradeButton.addEventListener('click', () => {
        const inventory = this.game.getInventory();
        if (inventory.canUpgrade()) {
          this.game.getAudioManager()?.playUISound(SoundType.UPGRADE);
          const result = inventory.upgrade();
          if (result.success) {
            this.updateContent();
          }
        }
      });
    }

    // Touch support for swipe between tabs
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      
      if (Math.abs(deltaX) > 50) { // Minimum swipe distance
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
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  private setupInventoryListeners(): void {
    const inventory = this.game.getInventory();
    
    inventory.on('itemAdded', () => {
      this.updateContent();
    });
    
    inventory.on('itemRemoved', () => {
      this.updateContent();
    });
    
    inventory.on('itemsChanged', () => {
      this.updateContent();
    });
    
    inventory.on('upgraded', () => {
      this.updateContent();
    });
  }

  public show(): void {
    if (this.element) {
      this.element.enable();
      this.game.pause();
    }
  }

  public hide(): void {
    if (this.element) {
      this.element.disable();
      this.game.resume();
    }
  }

  public toggle(): void {
    if (this.element && this.element.isEnabled()) {
      this.hide();
    } else {
      this.show();
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.element) {
      this.floatingUI.remove('inventory-ui');
      this.element = null;
    }
    
    this.tooltip.destroy();
  }
}