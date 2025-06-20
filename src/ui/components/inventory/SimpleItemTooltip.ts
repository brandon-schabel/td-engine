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
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #FFD700;
      border-radius: 8px;
      padding: 12px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: white;
      z-index: 10000;
      pointer-events: none;
      display: none;
      min-width: 200px;
      max-width: 300px;
    `;
    document.body.appendChild(this.tooltip);
  }

  show(item: InventoryItem, x: number, y: number): void {
    if (!this.tooltip) return;
    
    const rarityColors = {
      COMMON: '#CCCCCC',
      RARE: '#4169E1',
      EPIC: '#9370DB',
      LEGENDARY: '#FFD700'
    };
    
    const color = rarityColors[item.rarity] || '#CCCCCC';
    
    this.tooltip.innerHTML = `
      <div style="font-weight: bold; color: ${color}; margin-bottom: 8px;">
        ${item.name}
      </div>
      <div style="color: ${color}; font-size: 10px; margin-bottom: 8px;">
        ${item.rarity} ${item.type}
      </div>
      <div style="margin-bottom: 8px;">
        ${item.description}
      </div>
      ${item.quantity > 1 ? `<div style="color: #FFD700;">Quantity: ${item.quantity}</div>` : ''}
      ${item.type === 'CONSUMABLE' ? '<div style="color: #87CEEB; margin-top: 8px;">Click to use</div>' : ''}
      ${item.type === 'EQUIPMENT' ? '<div style="color: #87CEEB; margin-top: 8px;">Click to equip</div>' : ''}
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
    this.tooltip.style.display = 'block';
    this.visible = true;
  }

  hide(): void {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
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