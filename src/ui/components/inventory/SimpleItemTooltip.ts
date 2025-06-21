/**
 * SimpleItemTooltip - Lightweight tooltip for inventory items
 */

import type { InventoryItem } from '@/systems/Inventory';

export class ItemTooltip {
  private tooltip: HTMLElement | null = null;
  private visible: boolean = false;

  constructor() {
    this.createTooltip();
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'item-tooltip';
    document.body.appendChild(this.tooltip);
  }

  show(item: InventoryItem, x: number, y: number): void {
    if (!this.tooltip) return;
    
    // Rarity colors are now handled by CSS data attributes
    
    this.tooltip.innerHTML = `
      <div class="item-tooltip-name" data-rarity="${item.rarity.toLowerCase()}">
        ${item.name}
      </div>
      <div class="item-tooltip-type" data-rarity="${item.rarity.toLowerCase()}">
        ${item.rarity} ${item.type}
      </div>
      <div class="item-tooltip-description">
        ${item.description}
      </div>
      ${item.quantity > 1 ? `<div class="item-tooltip-quantity">Quantity: ${item.quantity}</div>` : ''}
      ${item.type === 'CONSUMABLE' ? '<div class="item-tooltip-action">Click to use</div>' : ''}
      ${item.type === 'EQUIPMENT' ? '<div class="item-tooltip-action">Click to equip</div>' : ''}
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
    this.tooltip.classList.add('visible');
    this.visible = true;
  }

  hide(): void {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
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