import { cn } from '@/ui/styles/UtilityStyles';
import { type InventoryItem, ItemRarity, ItemType } from '@/systems/Inventory';
import { FloatingUIManager, type FloatingUIElement } from '@/ui/floating/index';

/**
 * Reusable tooltip component for inventory items.
 * Displays item details in a floating tooltip.
 */
export class ItemTooltipUI {
  private floatingUI: FloatingUIManager;
  private element: FloatingUIElement | null = null;
  
  constructor(floatingUI: FloatingUIManager) {
    this.floatingUI = floatingUI;
  }
  
  /**
   * Show tooltip for an item at the given position.
   */
  show(item: InventoryItem, x: number, y: number): void {
    this.hide();
    
    const content = this.createTooltipContent(item);
    
    this.element = this.floatingUI.create('item-tooltip', 'tooltip', {
      offset: { x: 10, y: 10 },
      anchor: 'top-left',
      smoothing: 0,
      autoHide: false,
      persistent: false,
      zIndex: 2000,
      className: 'item-tooltip',
      screenSpace: true
    });
    
    this.element.setContent(content);
    
    // Set initial position
    const positionEntity = {
      position: { x, y },
      getPosition: () => ({ x, y })
    };
    this.element.setTarget(positionEntity as any);
    this.element.enable();
  }
  
  /**
   * Update tooltip position.
   */
  updatePosition(x: number, y: number): void {
    if (this.element) {
      const positionEntity = {
        position: { x, y },
        getPosition: () => ({ x, y })
      };
      this.element.setTarget(positionEntity as any);
    }
  }
  
  /**
   * Hide the tooltip.
   */
  hide(): void {
    if (this.element) {
      this.floatingUI.remove('item-tooltip');
      this.element = null;
    }
  }
  
  /**
   * Create tooltip content for an item.
   */
  private createTooltipContent(item: InventoryItem): HTMLElement {
    const container = document.createElement('div');
    container.className = cn(
      'bg-black/90',
      'border',
      'border-border-primary',
      'rounded-lg',
      'p-3',
      'min-w-[200px]',
      'max-w-[300px]',
      'space-y-2'
    );
    
    // Header with name and rarity
    const header = document.createElement('div');
    header.className = cn('space-y-1');
    
    const name = document.createElement('div');
    name.className = cn('font-semibold', 'text-base', this.getRarityColor(item.rarity));
    name.textContent = item.name;
    header.appendChild(name);
    
    const type = document.createElement('div');
    type.className = cn('text-xs', 'text-secondary');
    type.textContent = this.getItemTypeLabel(item);
    header.appendChild(type);
    
    container.appendChild(header);
    
    // Description
    if (item.description) {
      const desc = document.createElement('div');
      desc.className = cn('text-sm', 'text-white/80', 'leading-relaxed');
      desc.textContent = item.description;
      container.appendChild(desc);
    }
    
    // Stats for equipment
    if (item.type === ItemType.EQUIPMENT && item.metadata) {
      const stats = this.createEquipmentStats(item);
      if (stats) {
        container.appendChild(stats);
      }
    }
    
    // Quantity/Stack info
    if (item.maxStack > 1) {
      const stack = document.createElement('div');
      stack.className = cn('text-xs', 'text-secondary', 'pt-2', 'border-t', 'border-border-primary');
      stack.textContent = `Stack: ${item.quantity}/${item.maxStack}`;
      container.appendChild(stack);
    }
    
    return container;
  }
  
  /**
   * Create equipment stats display.
   */
  private createEquipmentStats(item: InventoryItem): HTMLElement | null {
    const stats = [];
    const metadata = item.metadata;
    
    if (metadata.damageBonus) {
      stats.push({ label: 'Damage', value: `+${metadata.damageBonus}`, color: 'text-red-400' });
    }
    if (metadata.healthBonus) {
      stats.push({ label: 'Health', value: `+${metadata.healthBonus}`, color: 'text-green-400' });
    }
    if (metadata.speedBonus) {
      stats.push({ label: 'Speed', value: `${metadata.speedBonus > 0 ? '+' : ''}${metadata.speedBonus}`, color: 'text-blue-400' });
    }
    if (metadata.fireRateBonus) {
      stats.push({ label: 'Fire Rate', value: `+${metadata.fireRateBonus}`, color: 'text-yellow-400' });
    }
    
    if (stats.length === 0) return null;
    
    const container = document.createElement('div');
    container.className = cn('space-y-1', 'pt-2', 'border-t', 'border-border-primary');
    
    stats.forEach(stat => {
      const row = document.createElement('div');
      row.className = cn('flex', 'justify-between', 'text-sm');
      
      const label = document.createElement('span');
      label.className = cn('text-secondary');
      label.textContent = stat.label + ':';
      
      const value = document.createElement('span');
      value.className = cn('font-medium', stat.color);
      value.textContent = stat.value;
      
      row.appendChild(label);
      row.appendChild(value);
      container.appendChild(row);
    });
    
    return container;
  }
  
  /**
   * Get rarity color class.
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
   * Get item type label.
   */
  private getItemTypeLabel(item: InventoryItem): string {
    if (item.type === ItemType.EQUIPMENT && item.metadata.equipmentSlot) {
      return `${item.metadata.equipmentSlot} • ${item.rarity}`;
    }
    return `${item.type} • ${item.rarity}`;
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.hide();
  }
}