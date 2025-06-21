/**
 * SimpleItemSlot - Lightweight inventory slot component
 */

import type { InventoryItem } from '@/systems/Inventory';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';

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
    
    // Add hover effect
    slot.addEventListener('mouseenter', () => {
      if (this.options.onHover) {
        this.options.onHover(this.index);
      }
    });
    
    // Add click handler with touch support
    if (this.options.onSelect) {
      addClickAndTouchSupport(slot, () => {
        this.options.onSelect!(this.index);
      });
    }
    
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
      slot.classList.add('drag-over');
    });
    
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
    
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer!.getData('text/plain'));
      if (this.options.onDrop && fromIndex !== this.index) {
        this.options.onDrop(fromIndex, this.index);
      }
      slot.classList.remove('drag-over');
    });
    
    return slot;
  }

  private updateDisplay(): void {
    this.element.innerHTML = '';
    
    if (this.item) {
      // Add rarity class
      this.element.className = `inventory-slot rarity-${this.item.rarity.toLowerCase()}`;
      
      // Item icon (simplified)
      const icon = document.createElement('div');
      icon.className = 'inventory-item-icon';
      icon.textContent = this.getItemEmoji(this.item.type);
      
      // Quantity badge
      if (this.item.quantity > 1) {
        const quantity = document.createElement('div');
        quantity.className = 'inventory-count';
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
  
  getItem(): InventoryItem | null {
    return this.item;
  }

  cleanup(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}