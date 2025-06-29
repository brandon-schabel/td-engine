import { cn } from '@/ui/styles/UtilityStyles';
import { IconType, createIconElement } from '@/ui/icons/SvgIcons';
import { ItemRarity, type InventoryItem } from '@/systems/Inventory';

export interface ItemSlotOptions {
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: (item: InventoryItem | null) => void;
  onRightClick?: (item: InventoryItem | null) => void;
  className?: string;
}

export interface DragDropCallbacks {
  onDragStart?: (item: InventoryItem | null, element: HTMLElement) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

/**
 * Reusable item slot component for inventory UIs.
 * Handles item display, selection, and drag-drop functionality.
 */
export class ItemSlot {
  private element: HTMLElement;
  private item: InventoryItem | null = null;
  private options: Required<ItemSlotOptions>;
  private dragDropCallbacks?: DragDropCallbacks;
  
  constructor(options: ItemSlotOptions = {}) {
    this.options = {
      size: options.size || 'md',
      showQuantity: options.showQuantity ?? true,
      interactive: options.interactive ?? true,
      selected: options.selected ?? false,
      disabled: options.disabled ?? false,
      onClick: options.onClick || (() => {}),
      onRightClick: options.onRightClick || (() => {}),
      className: options.className || ''
    };
    
    this.element = this.createElement();
  }
  
  /**
   * Create the slot element.
   */
  createSlot(): HTMLElement {
    return this.element;
  }
  
  /**
   * Update the slot with a new item.
   */
  updateSlot(item: InventoryItem | null): void {
    this.item = item;
    this.updateContent();
    this.updateAppearance();
  }
  
  /**
   * Set selected state.
   */
  setSelected(selected: boolean): void {
    this.options.selected = selected;
    this.updateAppearance();
  }
  
  /**
   * Set disabled state.
   */
  setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.updateAppearance();
  }
  
  /**
   * Enable drag and drop functionality.
   */
  enableDragDrop(callbacks: DragDropCallbacks): void {
    this.dragDropCallbacks = callbacks;
    
    if (this.options.interactive && !this.options.disabled) {
      this.element.draggable = true;
      
      this.element.addEventListener('dragstart', (e) => {
        if (this.dragDropCallbacks?.onDragStart) {
          this.dragDropCallbacks.onDragStart(this.item, this.element);
        }
        
        // Set drag data
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          if (this.item) {
            e.dataTransfer.setData('item', JSON.stringify(this.item));
          }
        }
        
        this.element.classList.add('dragging');
      });
      
      this.element.addEventListener('dragend', () => {
        this.element.classList.remove('dragging');
        if (this.dragDropCallbacks?.onDragEnd) {
          this.dragDropCallbacks.onDragEnd();
        }
      });
      
      this.element.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.dragDropCallbacks?.onDragOver) {
          this.dragDropCallbacks.onDragOver(e);
        }
        this.element.classList.add('drag-over');
      });
      
      this.element.addEventListener('dragleave', () => {
        this.element.classList.remove('drag-over');
      });
      
      this.element.addEventListener('drop', (e) => {
        e.preventDefault();
        this.element.classList.remove('drag-over');
        if (this.dragDropCallbacks?.onDrop) {
          this.dragDropCallbacks.onDrop(e);
        }
      });
    }
  }
  
  /**
   * Get the current item.
   */
  getItem(): InventoryItem | null {
    return this.item;
  }
  
  /**
   * Get the slot element.
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * Create the slot element structure.
   */
  private createElement(): HTMLElement {
    const slot = document.createElement('div');
    slot.className = this.getSlotClasses();
    
    // Click handlers
    if (this.options.interactive) {
      slot.addEventListener('click', () => {
        if (!this.options.disabled) {
          this.options.onClick(this.item);
        }
      });
      
      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!this.options.disabled) {
          this.options.onRightClick(this.item);
        }
      });
    }
    
    return slot;
  }
  
  /**
   * Update the slot content.
   */
  private updateContent(): void {
    this.element.innerHTML = '';
    
    if (this.item) {
      // Item icon
      const iconContainer = document.createElement('div');
      iconContainer.className = cn('item-icon', 'flex', 'items-center', 'justify-center');
      
      const icon = createIconElement(this.item.iconType as IconType, {
        size: this.getIconSize(),
        className: this.getRarityColor(this.item.rarity)
      });
      iconContainer.appendChild(icon);
      this.element.appendChild(iconContainer);
      
      // Quantity badge
      if (this.options.showQuantity && this.item.quantity > 1) {
        const badge = document.createElement('span');
        badge.className = cn(
          'absolute',
          'bottom-0.5',
          'right-0.5',
          'min-w-[20px]',
          'h-5',
          'px-1',
          'bg-black/80',
          'text-white',
          'text-xs',
          'font-bold',
          'rounded',
          'flex',
          'items-center',
          'justify-center',
          'quantity-badge'
        );
        badge.textContent = this.formatQuantity(this.item.quantity);
        this.element.appendChild(badge);
      }
      
      // Rarity indicator
      const rarityBar = document.createElement('div');
      rarityBar.className = cn(
        'absolute',
        'bottom-0',
        'left-0',
        'right-0',
        'h-1',
        this.getRarityBarColor(this.item.rarity),
        'rarity-indicator'
      );
      this.element.appendChild(rarityBar);
    }
  }
  
  /**
   * Update slot appearance based on state.
   */
  private updateAppearance(): void {
    this.element.className = this.getSlotClasses();
  }
  
  /**
   * Get slot CSS classes based on state.
   */
  private getSlotClasses(): string {
    const sizeClasses = {
      sm: cn('w-12', 'h-12'),
      md: cn('w-16', 'h-16'),
      lg: cn('w-20', 'h-20')
    };
    
    return cn(
      'relative',
      'rounded-lg',
      'border-2',
      'transition-all',
      'duration-200',
      sizeClasses[this.options.size],
      this.options.className,
      
      // State-based styling
      this.item ? 'bg-surface-secondary' : 'bg-black/40',
      this.options.selected ? 'border-primary' : 'border-border-primary',
      this.options.disabled ? 'opacity-50 cursor-not-allowed' : '',
      
      // Interactive states
      this.options.interactive && !this.options.disabled ? cn(
        'cursor-pointer',
        'hover:border-primary/60',
        'hover:bg-surface-secondary/80'
      ) : '',
      
      // Drag states
      'dragging:opacity-50',
      'drag-over:border-success',
      'drag-over:bg-success/20'
    );
  }
  
  /**
   * Get icon size based on slot size.
   */
  private getIconSize(): number {
    const sizes = {
      sm: 24,
      md: 32,
      lg: 40
    };
    return sizes[this.options.size];
  }
  
  /**
   * Get rarity color for item icon.
   */
  private getRarityColor(rarity: ItemRarity): string {
    const colors = {
      [ItemRarity.COMMON]: 'text-gray-400',
      [ItemRarity.RARE]: 'text-blue-400',
      [ItemRarity.EPIC]: 'text-purple-400',
      [ItemRarity.LEGENDARY]: 'text-orange-400'
    };
    return colors[rarity] || 'text-gray-400';
  }
  
  /**
   * Get rarity bar color.
   */
  private getRarityBarColor(rarity: ItemRarity): string {
    const colors = {
      [ItemRarity.COMMON]: 'bg-gray-400',
      [ItemRarity.RARE]: 'bg-blue-400',
      [ItemRarity.EPIC]: 'bg-purple-400',
      [ItemRarity.LEGENDARY]: 'bg-orange-400'
    };
    return colors[rarity] || 'bg-gray-400';
  }
  
  /**
   * Format quantity display.
   */
  private formatQuantity(quantity: number): string {
    if (quantity >= 1000) {
      return `${Math.floor(quantity / 1000)}k`;
    }
    return quantity.toString();
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.element.remove();
    this.dragDropCallbacks = undefined;
  }
}