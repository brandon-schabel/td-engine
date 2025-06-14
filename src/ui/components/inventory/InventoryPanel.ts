/**
 * InventoryPanel - Main inventory UI component
 * Displays items in a grid layout with tabs, search, and management features
 */

import { Component } from '../../core/Component';
import type { Game } from '../../../core/Game';
import type { Inventory, InventoryItem, ItemType } from '../../../systems/Inventory';
import { ItemSlot } from './ItemSlot';
import { ItemTooltip } from './ItemTooltip';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import { AudioManager, SoundType } from '../../../audio/AudioManager';

export interface InventoryPanelProps {
  game: Game;
  inventory: Inventory;
  audioManager: AudioManager;
  visible?: boolean;
  position?: 'center' | 'left' | 'right';
  width?: number;
  height?: number;
}

export interface InventoryPanelState {
  visible: boolean;
  selectedSlot: number | null;
  selectedItem: InventoryItem | null;
  activeTab: ItemType | 'ALL';
  hoveredSlot: number | null;
  draggedSlot: number | null;
}

export class InventoryPanel extends Component<InventoryPanelProps> {
  private state: InventoryPanelState;
  private container: HTMLElement | null = null;
  private itemSlots: ItemSlot[] = [];
  private tooltip: ItemTooltip;
  
  // UI elements
  private panel: HTMLElement | null = null;
  private header: HTMLElement | null = null;
  private tabs: HTMLElement | null = null;
  private grid: HTMLElement | null = null;
  private footer: HTMLElement | null = null;

  constructor(props: InventoryPanelProps) {
    super(props);
    
    this.state = {
      visible: props.visible ?? false,
      selectedSlot: null,
      selectedItem: null,
      activeTab: 'ALL',
      hoveredSlot: null,
      draggedSlot: null
    };

    this.tooltip = new ItemTooltip({
      game: props.game,
      audioManager: props.audioManager
    });

    // Bind methods
    this.handleSlotClick = this.handleSlotClick.bind(this);
    this.handleSlotHover = this.handleSlotHover.bind(this);
    this.handleSlotDragStart = this.handleSlotDragStart.bind(this);
    this.handleSlotDragEnd = this.handleSlotDragEnd.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    // Listen to inventory events
    this.props.inventory.on('inventoryChanged', () => {
      this.updateSlots();
    });
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
    this.setupEventListeners();
  }

  unmount(): void {
    this.cleanup();
    if (this.container && this.panel) {
      this.container.removeChild(this.panel);
    }
    this.container = null;
  }

  private render(): void {
    if (!this.container) return;

    // Create main panel
    this.panel = document.createElement('div');
    this.panel.className = 'inventory-panel ui-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${this.props.width || 600}px;
      height: ${this.props.height || 500}px;
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid #4CAF50;
      border-radius: 8px;
      display: ${this.state.visible ? 'flex' : 'none'};
      flex-direction: column;
      z-index: 2000;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
    `;

    // Create header
    this.createHeader();
    
    // Create tabs
    this.createTabs();
    
    // Create main grid area
    this.createGrid();
    
    // Create footer
    this.createFooter();

    // Mount tooltip
    this.tooltip.mount(this.panel);

    this.container.appendChild(this.panel);
    this.updateSlots();
  }

  private createHeader(): void {
    this.header = document.createElement('div');
    this.header.className = 'inventory-header';
    this.header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(76, 175, 80, 0.3);
      background: rgba(76, 175, 80, 0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: #4CAF50;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    const inventoryIcon = createSvgIcon(IconType.BUILD, { size: 24 });
    title.innerHTML = `${inventoryIcon} Inventory`;

    const closeButton = document.createElement('button');
    closeButton.className = 'ui-button icon-only';
    closeButton.style.cssText = `
      width: 32px;
      height: 32px;
      padding: 0;
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid #F44336;
      color: #F44336;
      border-radius: 4px;
    `;
    
    const closeIcon = createSvgIcon(IconType.CLOSE, { size: 20 });
    closeButton.innerHTML = closeIcon;
    closeButton.addEventListener('click', this.handleCloseClick);

    this.header.appendChild(title);
    this.header.appendChild(closeButton);
    this.panel!.appendChild(this.header);
  }

  private createTabs(): void {
    this.tabs = document.createElement('div');
    this.tabs.className = 'inventory-tabs';
    this.tabs.style.cssText = `
      display: flex;
      background: rgba(40, 40, 40, 0.8);
      border-bottom: 1px solid rgba(76, 175, 80, 0.3);
    `;

    const tabData = [
      { id: 'ALL', name: 'All', icon: IconType.BUILD },
      { id: 'CONSUMABLE', name: 'Consumables', icon: IconType.HEALTH },
      { id: 'EQUIPMENT', name: 'Equipment', icon: IconType.SHIELD },
      { id: 'MATERIAL', name: 'Materials', icon: IconType.UPGRADE },
      { id: 'SPECIAL', name: 'Special', icon: IconType.CROWN }
    ];

    tabData.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.className = `inventory-tab ${this.state.activeTab === tab.id ? 'active' : ''}`;
      tabButton.style.cssText = `
        flex: 1;
        padding: 12px 8px;
        background: ${this.state.activeTab === tab.id ? 'rgba(76, 175, 80, 0.2)' : 'transparent'};
        border: none;
        color: ${this.state.activeTab === tab.id ? '#4CAF50' : '#CCCCCC'};
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 10px;
      `;

      const icon = createSvgIcon(tab.icon, { size: 20 });
      tabButton.innerHTML = `${icon}<span>${tab.name}</span>`;
      
      tabButton.addEventListener('click', () => this.handleTabClick(tab.id as any));
      tabButton.addEventListener('mouseenter', () => {
        if (this.state.activeTab !== tab.id) {
          tabButton.style.background = 'rgba(76, 175, 80, 0.1)';
        }
      });
      tabButton.addEventListener('mouseleave', () => {
        if (this.state.activeTab !== tab.id) {
          tabButton.style.background = 'transparent';
        }
      });

      this.tabs.appendChild(tabButton);
    });

    this.panel!.appendChild(this.tabs);
  }

  private createGrid(): void {
    this.grid = document.createElement('div');
    this.grid.className = 'inventory-grid';
    this.grid.style.cssText = `
      flex: 1;
      padding: 16px;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 4px;
      overflow: auto;
    `;

    // Create item slots
    const inventory = this.props.inventory;
    const totalSlots = inventory.getStatistics().totalSlots;
    
    for (let i = 0; i < totalSlots; i++) {
      const slot = new ItemSlot({
        slotIndex: i,
        item: null,
        game: this.props.game,
        audioManager: this.props.audioManager,
        onClick: this.handleSlotClick,
        onHover: this.handleSlotHover,
        onDragStart: this.handleSlotDragStart,
        onDragEnd: this.handleSlotDragEnd
      });

      this.itemSlots.push(slot);
      slot.mount(this.grid);
    }

    this.panel!.appendChild(this.grid);
  }

  private createFooter(): void {
    this.footer = document.createElement('div');
    this.footer.className = 'inventory-footer';
    this.footer.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid rgba(76, 175, 80, 0.3);
      background: rgba(40, 40, 40, 0.8);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    `;

    const stats = document.createElement('div');
    stats.className = 'inventory-stats';
    stats.style.color = '#CCCCCC';

    const actions = document.createElement('div');
    actions.className = 'inventory-actions';
    actions.style.cssText = 'display: flex; gap: 8px;';

    // Sort button
    const sortButton = document.createElement('button');
    sortButton.className = 'ui-button has-icon';
    sortButton.style.cssText = `
      padding: 6px 12px;
      font-size: 11px;
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid #4CAF50;
      color: #4CAF50;
    `;
    
    const sortIcon = createSvgIcon(IconType.UPGRADE, { size: 14 });
    sortButton.innerHTML = `${sortIcon}<span>Sort</span>`;
    sortButton.addEventListener('click', () => {
      this.props.inventory.sortInventory();
      this.props.audioManager.playUISound(SoundType.BUTTON_CLICK);
    });

    actions.appendChild(sortButton);

    this.footer.appendChild(stats);
    this.footer.appendChild(actions);
    this.panel!.appendChild(this.footer);
  }

  private updateSlots(): void {
    const inventory = this.props.inventory;
    const slots = inventory.getSlots();
    const stats = inventory.getStatistics();

    // Update each slot
    this.itemSlots.forEach((slot, index) => {
      const inventorySlot = slots[index];
      const item = inventorySlot?.item || null;
      
      // Apply tab filtering
      const shouldShow = this.shouldShowItem(item);
      slot.updateProps({ 
        item: shouldShow ? item : null,
        visible: shouldShow
      });
    });

    // Update footer stats
    if (this.footer) {
      const statsElement = this.footer.querySelector('.inventory-stats');
      if (statsElement) {
        statsElement.textContent = `${stats.usedSlots}/${stats.totalSlots} slots used`;
      }
    }
  }

  private shouldShowItem(item: InventoryItem | null): boolean {
    if (!item) return true; // Always show empty slots
    if (this.state.activeTab === 'ALL') return true;
    return item.type === this.state.activeTab;
  }

  // Event handlers
  private handleSlotClick(slotIndex: number, item: InventoryItem | null): void {
    this.props.audioManager.playUISound(SoundType.SELECT);
    
    if (this.state.selectedSlot === slotIndex) {
      // Deselect
      this.setState({
        selectedSlot: null,
        selectedItem: null
      });
    } else {
      // Select
      this.setState({
        selectedSlot: slotIndex,
        selectedItem: item
      });
    }

    // Update visual selection
    this.updateSlotSelection();
  }

  private handleSlotHover(slotIndex: number, item: InventoryItem | null, event: MouseEvent): void {
    this.setState({ hoveredSlot: slotIndex });
    
    if (item) {
      this.tooltip.show(item, event.clientX, event.clientY);
    } else {
      this.tooltip.hide();
    }
  }

  private handleSlotDragStart(slotIndex: number): void {
    this.setState({ draggedSlot: slotIndex });
  }

  private handleSlotDragEnd(fromSlot: number, toSlot: number): void {
    if (fromSlot !== toSlot) {
      const success = this.props.inventory.moveItem(fromSlot, toSlot);
      if (success) {
        this.props.audioManager.playUISound(SoundType.SELECT);
      } else {
        this.props.audioManager.playUISound(SoundType.ERROR);
      }
    }
    
    this.setState({ draggedSlot: null });
  }

  private handleTabClick(tab: ItemType | 'ALL'): void {
    this.props.audioManager.playUISound(SoundType.BUTTON_CLICK);
    this.setState({ activeTab: tab });
    this.updateTabs();
    this.updateSlots();
  }

  private handleCloseClick(): void {
    this.props.audioManager.playUISound(SoundType.BUTTON_CLICK);
    this.hide();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.state.visible) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.hide();
        break;
      case 'Tab':
        event.preventDefault();
        // Cycle through tabs
        const tabs: (ItemType | 'ALL')[] = ['ALL', 'CONSUMABLE', 'EQUIPMENT', 'MATERIAL', 'SPECIAL'];
        const currentIndex = tabs.indexOf(this.state.activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.handleTabClick(tabs[nextIndex]);
        break;
    }
  }

  private updateSlotSelection(): void {
    this.itemSlots.forEach((slot, index) => {
      slot.updateProps({ 
        selected: index === this.state.selectedSlot 
      });
    });
  }

  private updateTabs(): void {
    if (!this.tabs) return;
    
    const tabButtons = this.tabs.querySelectorAll('.inventory-tab');
    tabButtons.forEach((button, index) => {
      const tabIds = ['ALL', 'CONSUMABLE', 'EQUIPMENT', 'MATERIAL', 'SPECIAL'];
      const isActive = tabIds[index] === this.state.activeTab;
      
      (button as HTMLElement).style.background = isActive ? 'rgba(76, 175, 80, 0.2)' : 'transparent';
      (button as HTMLElement).style.color = isActive ? '#4CAF50' : '#CCCCCC';
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Close on outside click
    document.addEventListener('click', (event) => {
      if (this.state.visible && this.panel && !this.panel.contains(event.target as Node)) {
        this.hide();
      }
    });
  }

  private cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.tooltip.unmount();
    this.itemSlots.forEach(slot => slot.unmount());
    this.itemSlots = [];
  }

  // Public API
  show(): void {
    this.setState({ visible: true });
    if (this.panel) {
      this.panel.style.display = 'flex';
    }
    this.updateSlots();
  }

  hide(): void {
    this.setState({ visible: false });
    if (this.panel) {
      this.panel.style.display = 'none';
    }
    this.tooltip.hide();
  }

  toggle(): void {
    if (this.state.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.state.visible;
  }

  selectSlot(slotIndex: number): void {
    const item = this.props.inventory.getItem(slotIndex);
    this.setState({
      selectedSlot: slotIndex,
      selectedItem: item
    });
    this.updateSlotSelection();
  }

  getSelectedItem(): InventoryItem | null {
    return this.state.selectedItem;
  }

  // Component interface
  updateProps(newProps: Partial<InventoryPanelProps>): void {
    Object.assign(this.props, newProps);
    
    if (newProps.visible !== undefined) {
      if (newProps.visible) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  forceUpdate(): void {
    this.updateSlots();
    this.updateTabs();
    this.updateSlotSelection();
  }

  getState(): InventoryPanelState {
    return { ...this.state };
  }

  setState(newState: Partial<InventoryPanelState>): void {
    Object.assign(this.state, newState);
  }
}