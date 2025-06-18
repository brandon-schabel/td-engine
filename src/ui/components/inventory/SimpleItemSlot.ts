/**
 * SimpleItemSlot - Lightweight inventory slot component
 */

import type { InventoryItem } from '@/systems/Inventory';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';

export interface ItemSlotOptions {
  index: number;
  item: InventoryItem | null;
  onSelect?: (index: number) => void;
  onHover?: (index: number) => void;
  onDrop?: (fromIndex: number, toIndex: number) => void;
}

export class ItemSlot {
  private element: HTMLElement;
  private index: number;
  private item: InventoryItem | null;
  private options: ItemSlotOptions;

  constructor(options: ItemSlotOptions) {
    this.options = options;
    this.index = options.index;
    this.item = options.item;
    this.element = this.createElement();
    this.updateDisplay();
  }

  private createElement(): HTMLElement {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.style.cssText = `
      width: 60px;
      height: 60px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    `;
    
    // Add hover effect
    slot.addEventListener('mouseenter', () => {
      slot.style.borderColor = '#FFD700';
      slot.style.transform = 'scale(1.05)';
      if (this.options.onHover) {
        this.options.onHover(this.index);
      }
    });
    
    slot.addEventListener('mouseleave', () => {
      slot.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      slot.style.transform = 'scale(1)';
    });
    
    // Add click handler
    slot.addEventListener('click', () => {
      if (this.options.onSelect) {
        this.options.onSelect(this.index);
      }
    });
    
    // Add drag and drop
    slot.draggable = true;
    slot.dataset.slotIndex = this.index.toString();
    
    slot.addEventListener('dragstart', (e) => {
      if (!this.item) {
        e.preventDefault();
        return;
      }
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', this.index.toString());
      slot.style.opacity = '0.5';
    });
    
    slot.addEventListener('dragend', () => {
      slot.style.opacity = '1';
    });
    
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      slot.style.borderColor = '#4CAF50';
    });
    
    slot.addEventListener('dragleave', () => {
      slot.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer!.getData('text/plain'));
      if (this.options.onDrop && fromIndex !== this.index) {
        this.options.onDrop(fromIndex, this.index);
      }
      slot.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    return slot;
  }

  private updateDisplay(): void {
    this.element.innerHTML = '';
    
    if (this.item) {
      const rarityColors = {
        COMMON: '#CCCCCC',
        RARE: '#4169E1',
        EPIC: '#9370DB',
        LEGENDARY: '#FFD700'
      };
      
      this.element.style.borderColor = rarityColors[this.item.rarity] || '#CCCCCC';
      
      // Item icon (simplified)
      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 32px;
        height: 32px;
        background: ${rarityColors[this.item.rarity] || '#CCCCCC'};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      `;
      icon.textContent = this.getItemEmoji(this.item.type);
      
      // Quantity badge
      if (this.item.quantity > 1) {
        const quantity = document.createElement('div');
        quantity.style.cssText = `
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: rgba(0, 0, 0, 0.8);
          color: #FFD700;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: bold;
        `;
        quantity.textContent = this.item.quantity.toString();
        this.element.appendChild(quantity);
      }
      
      this.element.appendChild(icon);
    }
  }

  private getItemEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      'CONSUMABLE': '🧪',
      'EQUIPMENT': '⚔️',
      'MATERIAL': '📦',
      'CURRENCY': '💰',
      'KEY': '🗝️',
      'QUEST': '📜'
    };
    return emojiMap[type] || '❓';
  }

  setItem(item: InventoryItem | null): void {
    this.item = item;
    this.updateDisplay();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  cleanup(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}