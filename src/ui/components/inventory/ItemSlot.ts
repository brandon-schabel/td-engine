/**
 * ItemSlot - Individual inventory slot component
 * Handles displaying items, drag and drop, and user interactions
 */

import type { Game } from '@/core/Game';
import type { InventoryItem, ItemRarity } from '@/systems/Inventory';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { Component } from '@/ui/core';

export interface ItemSlotProps {
  slotIndex: number;
  item: InventoryItem | null;
  game: Game;
  audioManager: AudioManager;
  selected?: boolean;
  visible?: boolean;
  onClick?: (slotIndex: number, item: InventoryItem | null) => void;
  onHover?: (slotIndex: number, item: InventoryItem | null, event: MouseEvent) => void;
  onDragStart?: (slotIndex: number) => void;
  onDragEnd?: (fromSlot: number, toSlot: number) => void;
}

export class ItemSlot extends Component<ItemSlotProps> {
  private container: HTMLElement | null = null;
  private slotElement: HTMLElement | null = null;
  private isDragging: boolean = false;
  private dragStartSlot: number = -1;

  constructor(props: ItemSlotProps) {
    super(props);

    // Bind methods
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  protected getInitialState(): any {
    return {};
  }

  protected render(): HTMLElement {
    // Not used since we manually create in mount
    return document.createElement('div');
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    if (this.container && this.slotElement) {
      this.container.removeChild(this.slotElement);
    }
    this.container = null;
    this.slotElement = null;
  }

  private render(): void {
    if (!this.container) return;

    this.slotElement = document.createElement('div');
    this.slotElement.className = 'item-slot';
    this.slotElement.style.cssText = `
      position: relative;
      width: 64px;
      height: 64px;
      background: rgba(60, 60, 60, 0.8);
      border: 2px solid ${this.getBorderColor()};
      border-radius: 6px;
      display: ${this.props.visible !== false ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      cursor: ${this.props.item ? 'pointer' : 'default'};
      transition: all 0.2s ease;
      user-select: none;
    `;

    // Make draggable if item exists
    if (this.props.item) {
      this.slotElement.draggable = true;
      this.slotElement.addEventListener('dragstart', this.handleDragStart);
      this.slotElement.addEventListener('dragend', this.handleDragEnd);
    }

    // Always allow dropping
    this.slotElement.addEventListener('dragover', this.handleDragOver);
    this.slotElement.addEventListener('drop', this.handleDrop);

    // Add event listeners
    this.slotElement.addEventListener('click', this.handleClick);
    this.slotElement.addEventListener('mouseenter', this.handleMouseEnter);
    this.slotElement.addEventListener('mouseleave', this.handleMouseLeave);

    // Render item content
    this.renderItemContent();

    this.container.appendChild(this.slotElement);
  }

  private renderItemContent(): void {
    if (!this.slotElement) return;

    // Clear existing content
    this.slotElement.innerHTML = '';

    if (this.props.item) {
      // Create item container
      const itemContainer = document.createElement('div');
      itemContainer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      `;

      // Add rarity glow effect
      const rarityGlow = this.getRarityGlow(this.props.item.rarity);
      if (rarityGlow) {
        itemContainer.style.boxShadow = `inset 0 0 10px ${rarityGlow}`;
        itemContainer.style.borderRadius = '4px';
      }

      // Create icon
      const iconElement = document.createElement('div');
      iconElement.style.cssText = `
        color: ${this.getRarityColor(this.props.item.rarity)};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      `;

      const icon = createSvgIcon(this.props.item.iconType as IconType, { size: 32 });
      iconElement.innerHTML = icon;

      // Create quantity badge if > 1
      if (this.props.item.quantity > 1) {
        const quantityBadge = document.createElement('div');
        quantityBadge.style.cssText = `
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 2px;
          min-width: 12px;
          text-align: center;
        `;
        quantityBadge.textContent = this.props.item.quantity.toString();
        itemContainer.appendChild(quantityBadge);
      }

      // Add rarity indicator
      const rarityIndicator = document.createElement('div');
      rarityIndicator.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        width: 8px;
        height: 8px;
        background: ${this.getRarityColor(this.props.item.rarity)};
        border-radius: 50%;
        box-shadow: 0 0 4px ${this.getRarityColor(this.props.item.rarity)};
      `;

      itemContainer.appendChild(iconElement);
      itemContainer.appendChild(rarityIndicator);
      this.slotElement.appendChild(itemContainer);
    } else {
      // Empty slot - show slot number for debugging in development
      if (process.env.NODE_ENV === 'development') {
        const slotNumber = document.createElement('div');
        slotNumber.style.cssText = `
          color: rgba(255, 255, 255, 0.2);
          font-size: 10px;
          position: absolute;
          top: 2px;
          left: 2px;
        `;
        slotNumber.textContent = this.props.slotIndex.toString();
        this.slotElement.appendChild(slotNumber);
      }
    }
  }

  private getBorderColor(): string {
    if (this.props.selected) {
      return '#FFD700'; // Gold for selected
    }
    
    if (this.props.item) {
      return this.getRarityColor(this.props.item.rarity);
    }
    
    return 'rgba(100, 100, 100, 0.5)'; // Default border for empty slots
  }

  private getRarityColor(rarity: ItemRarity): string {
    const colors = {
      COMMON: '#9E9E9E',     // Gray
      RARE: '#2196F3',       // Blue  
      EPIC: '#9C27B0',       // Purple
      LEGENDARY: '#FF9800'   // Orange/Gold
    };
    return colors[rarity] || colors.COMMON;
  }

  private getRarityGlow(rarity: ItemRarity): string | null {
    const glows = {
      COMMON: null,
      RARE: 'rgba(33, 150, 243, 0.3)',
      EPIC: 'rgba(156, 39, 176, 0.3)', 
      LEGENDARY: 'rgba(255, 152, 0, 0.4)'
    };
    return glows[rarity] || null;
  }

  // Event handlers
  private handleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.props.onClick?.(this.props.slotIndex, this.props.item);
  }

  private handleMouseEnter(event: MouseEvent): void {
    if (this.slotElement) {
      this.slotElement.style.transform = 'scale(1.05)';
      this.slotElement.style.borderColor = this.props.item ? '#FFD700' : 'rgba(255, 215, 0, 0.5)';
    }
    
    this.props.onHover?.(this.props.slotIndex, this.props.item, event);
  }

  private handleMouseLeave(): void {
    if (this.slotElement) {
      this.slotElement.style.transform = 'scale(1)';
      this.slotElement.style.borderColor = this.getBorderColor();
    }
  }

  private handleDragStart(event: DragEvent): void {
    if (!this.props.item) {
      event.preventDefault();
      return;
    }

    this.isDragging = true;
    this.dragStartSlot = this.props.slotIndex;
    
    // Set drag data
    event.dataTransfer?.setData('text/plain', this.props.slotIndex.toString());
    event.dataTransfer!.effectAllowed = 'move';
    
    // Visual feedback
    if (this.slotElement) {
      this.slotElement.style.opacity = '0.5';
    }

    this.props.onDragStart?.(this.props.slotIndex);
    this.props.audioManager.playUISound(SoundType.SELECT);
  }

  private handleDragEnd(): void {
    this.isDragging = false;
    
    if (this.slotElement) {
      this.slotElement.style.opacity = '1';
    }
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    // Visual feedback for valid drop target
    if (this.slotElement && !this.isDragging) {
      this.slotElement.style.background = 'rgba(76, 175, 80, 0.2)';
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    
    // Reset visual feedback
    if (this.slotElement) {
      this.slotElement.style.background = 'rgba(60, 60, 60, 0.8)';
    }

    const fromSlotStr = event.dataTransfer?.getData('text/plain');
    if (fromSlotStr) {
      const fromSlot = parseInt(fromSlotStr, 10);
      const toSlot = this.props.slotIndex;
      
      if (fromSlot !== toSlot) {
        this.props.onDragEnd?.(fromSlot, toSlot);
      }
    }
  }

  // Public API
  updateProps(newProps: Partial<ItemSlotProps>): void {
    const needsRerender = 
      newProps.item !== this.props.item ||
      newProps.selected !== this.props.selected ||
      newProps.visible !== this.props.visible;

    Object.assign(this.props, newProps);

    if (needsRerender && this.slotElement) {
      // Update styling
      this.slotElement.style.borderColor = this.getBorderColor();
      this.slotElement.style.display = this.props.visible !== false ? 'flex' : 'none';
      this.slotElement.style.cursor = this.props.item ? 'pointer' : 'default';
      
      // Update draggable state
      if (this.props.item) {
        this.slotElement.draggable = true;
      } else {
        this.slotElement.draggable = false;
      }

      // Re-render content
      this.renderItemContent();
    }
  }

  forceUpdate(): void {
    if (this.slotElement) {
      this.renderItemContent();
      this.slotElement.style.borderColor = this.getBorderColor();
    }
  }

  getSlotIndex(): number {
    return this.props.slotIndex;
  }

  getItem(): InventoryItem | null {
    return this.props.item;
  }

  isEmpty(): boolean {
    return this.props.item === null;
  }

  isSelected(): boolean {
    return this.props.selected === true;
  }
}