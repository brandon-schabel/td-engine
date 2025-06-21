/**
 * SimpleItemSlot - Lightweight inventory slot component
 */

import type { InventoryItem } from '@/systems/Inventory';
import { addClickAndTouchSupport } from '@/ui/utils/touchSupport';
import { cn } from '@/ui/styles/UtilityStyles';

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
    slot.className = cn(
      'w-[60px]',
      'h-[60px]',
      'aspect-square',
      'bg-surface-secondary',
      'border-2',
      'border-subtle',
      'rounded-sm',
      'transition-all',
      'relative',
      'cursor-pointer',
      'hover:border-primary',
      'hover:shadow-md'
    );
    
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
      slot.classList.add('drag-over', 'border-yellow-400', 'bg-yellow-400\\/10');
    });
    
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over', 'border-yellow-400', 'bg-yellow-400\\/10');
    });
    
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer!.getData('text/plain'));
      if (this.options.onDrop && fromIndex !== this.index) {
        this.options.onDrop(fromIndex, this.index);
      }
      slot.classList.remove('drag-over', 'border-yellow-400', 'bg-yellow-400\\/10');
    });
    
    return slot;
  }

  private updateDisplay(): void {
    // Clear existing content
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    
    if (this.item) {
      // Add rarity class
      const rarityColors = {
        common: 'border-gray-400',
        uncommon: 'border-green-400',
        rare: 'border-blue-400',
        epic: 'border-purple-400',
        legendary: 'border-yellow-400'
      };
      
      this.element.className = cn(
        'inventory-slot',
        'w-[60px]',
        'h-[60px]',
        'aspect-square',
        'bg-surface-secondary',
        'border-2',
        rarityColors[this.item.rarity.toLowerCase() as keyof typeof rarityColors] || 'border-subtle',
        'rounded-sm',
        'transition-all',
        'relative',
        'cursor-pointer',
        'hover:shadow-md',
        'hover:scale-105',
        `rarity-${this.item.rarity.toLowerCase()}`
      );
      
      // Item icon (simplified)
      const icon = document.createElement('div');
      icon.className = cn(
        'absolute',
        'inset-0',
        'flex',
        'items-center',
        'justify-center',
        'text-2xl',
        'select-none'
      );
      icon.textContent = this.getItemEmoji(this.item.type);
      
      // Quantity badge
      if (this.item.quantity > 1) {
        const quantity = document.createElement('div');
        quantity.className = cn(
          'absolute',
          'bottom-0',
          'right-0',
          'bg-black/80',
          'text-white',
          'text-xs',
          'font-bold',
          'px-1',
          'py-0.5',
          'rounded-tl-sm',
          'min-w-[20px]',
          'text-center'
        );
        quantity.textContent = this.item.quantity.toString();
        this.element.appendChild(quantity);
      }
      
      this.element.appendChild(icon);
    } else {
      // Reset to empty slot
      this.element.className = cn(
        'inventory-slot',
        'w-[60px]',
        'h-[60px]',
        'aspect-square',
        'bg-surface-secondary',
        'border-2',
        'border-subtle',
        'rounded-sm',
        'transition-all',
        'relative',
        'cursor-pointer',
        'hover:border-primary',
        'hover:bg-surface-hover',
        'hover:shadow-md',
        'hover:scale-105'
      );
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