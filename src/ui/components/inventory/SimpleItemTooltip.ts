/**
 * SimpleItemTooltip - Lightweight tooltip for inventory items
 */

import type { InventoryItem } from '@/systems/Inventory';
import { cn } from '@/ui/styles/UtilityStyles';

export class ItemTooltip {
  private tooltip: HTMLElement | null = null;
  private visible: boolean = false;

  constructor() {
    this.createTooltip();
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = cn(
      'absolute',
      'bg-black/95',
      'border-2',
      'border-yellow-400',
      'rounded-md',
      'p-3',
      'z-[10000]',
      'pointer-events-none',
      'opacity-0',
      'transition-opacity',
      'duration-200',
      'max-w-[300px]'
    );
    document.body.appendChild(this.tooltip);
  }

  show(item: InventoryItem, x: number, y: number): void {
    if (!this.tooltip) return;
    
    // Rarity colors are now handled by CSS data attributes
    
    // Rarity colors
    const rarityColors = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400'
    };
    
    const rarityColor = rarityColors[item.rarity.toLowerCase() as keyof typeof rarityColors] || 'text-gray-400';
    
    this.tooltip.innerHTML = `
      <div class="${cn('text-lg', 'font-bold', 'mb-1', rarityColor)}">
        ${item.name}
      </div>
      <div class="${cn('text-sm', 'mb-2', rarityColor)}">
        ${item.rarity} ${item.type}
      </div>
      <div class="${cn('text-sm', 'text-gray-300', 'mb-2')}">
        ${item.description}
      </div>
      ${item.quantity > 1 ? `<div class="${cn('text-sm', 'text-gray-400')}">Quantity: ${item.quantity}</div>` : ''}
      ${item.type === 'CONSUMABLE' ? `<div class="${cn('text-sm', 'text-green-400', 'mt-2')}">Click to use</div>` : ''}
      ${item.type === 'EQUIPMENT' ? `<div class="${cn('text-sm', 'text-blue-400', 'mt-2')}">Click to equip</div>` : ''}
    `;
    
    // Position tooltip
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let tooltipX = x + 10;
    let tooltipY = y + 10;
    
    // Keep tooltip on screen
    if (tooltipX + tooltipRect.width > window.innerWidth) {
      tooltipX = x - tooltipRect.width - 10;
    }
    if (tooltipY + tooltipRect.height > window.innerHeight) {
      tooltipY = y - tooltipRect.height - 10;
    }
    
    this.tooltip.style.left = `${tooltipX}px`;
    this.tooltip.style.top = `${tooltipY}px`;
    this.tooltip.classList.remove('opacity-0');
    this.tooltip.classList.add('opacity-100');
    this.visible = true;
  }

  hide(): void {
    if (this.tooltip) {
      this.tooltip.classList.remove('opacity-100');
      this.tooltip.classList.add('opacity-0');
      this.visible = false;
    }
  }

  update(x: number, y: number): void {
    if (!this.tooltip || !this.visible) return;
    
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let tooltipX = x + 10;
    let tooltipY = y + 10;
    
    if (tooltipX + tooltipRect.width > window.innerWidth) {
      tooltipX = x - tooltipRect.width - 10;
    }
    if (tooltipY + tooltipRect.height > window.innerHeight) {
      tooltipY = y - tooltipRect.height - 10;
    }
    
    this.tooltip.style.left = `${tooltipX}px`;
    this.tooltip.style.top = `${tooltipY}px`;
  }

  cleanup(): void {
    if (this.tooltip && this.tooltip.parentElement) {
      this.tooltip.parentElement.removeChild(this.tooltip);
    }
  }
}