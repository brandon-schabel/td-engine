/**
 * ItemTooltip - Rich tooltip component for displaying item information
 * Shows detailed item stats, descriptions, and actions
 */

import { Component } from '@/ui/core/Component';
import type { Game } from '@/core/Game';
import type { InventoryItem, ItemType, ItemRarity } from '@/systems/Inventory';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import { AudioManager } from '@/audio/AudioManager';

export interface ItemTooltipProps {
  game: Game;
  audioManager: AudioManager;
}

export class ItemTooltip extends Component<ItemTooltipProps> {
  private container: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private currentItem: InventoryItem | null = null;
  private visible: boolean = false;

  constructor(props: ItemTooltipProps) {
    super(props);
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.createTooltip();
  }

  unmount(): void {
    if (this.container && this.tooltip) {
      this.container.removeChild(this.tooltip);
    }
    this.container = null;
    this.tooltip = null;
  }

  private createTooltip(): void {
    if (!this.container) return;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'item-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid #4CAF50;
      border-radius: 6px;
      padding: 12px;
      max-width: 300px;
      z-index: 3000;
      display: none;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    this.container.appendChild(this.tooltip);
  }

  show(item: InventoryItem, x: number, y: number): void {
    if (!this.tooltip || this.currentItem === item) return;

    this.currentItem = item;
    this.visible = true;
    this.renderTooltipContent(item);
    this.positionTooltip(x, y);
    
    this.tooltip.style.display = 'block';
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(10px)';
    
    // Animate in
    requestAnimationFrame(() => {
      if (this.tooltip) {
        this.tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        this.tooltip.style.opacity = '1';
        this.tooltip.style.transform = 'translateY(0)';
      }
    });
  }

  hide(): void {
    if (!this.tooltip || !this.visible) return;

    this.visible = false;
    this.currentItem = null;
    
    this.tooltip.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(-5px)';
    
    setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.style.display = 'none';
      }
    }, 150);
  }

  private renderTooltipContent(item: InventoryItem): void {
    if (!this.tooltip) return;

    // Clear existing content
    this.tooltip.innerHTML = '';

    // Create header with item name and rarity
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(76, 175, 80, 0.3);
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      color: ${this.getRarityColor(item.rarity)};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    icon.innerHTML = createSvgIcon(item.iconType as IconType, { size: 24 });

    const nameContainer = document.createElement('div');
    nameContainer.style.cssText = 'flex: 1;';

    const name = document.createElement('div');
    name.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      color: ${this.getRarityColor(item.rarity)};
      line-height: 1.2;
    `;
    name.textContent = item.name;

    const rarity = document.createElement('div');
    rarity.style.cssText = `
      font-size: 11px;
      color: ${this.getRarityColor(item.rarity)};
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    rarity.textContent = item.rarity.replace('_', ' ');

    // Add quantity badge if stacked
    if (item.quantity > 1) {
      const quantity = document.createElement('div');
      quantity.style.cssText = `
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: bold;
      `;
      quantity.textContent = `x${item.quantity}`;
      header.appendChild(quantity);
    }

    nameContainer.appendChild(name);
    nameContainer.appendChild(rarity);
    header.appendChild(icon);
    header.appendChild(nameContainer);

    this.tooltip.appendChild(header);

    // Add description
    const description = document.createElement('div');
    description.style.cssText = `
      color: #CCCCCC;
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 8px;
    `;
    description.textContent = item.description;
    this.tooltip.appendChild(description);

    // Add item type badge
    const typeBadge = document.createElement('div');
    typeBadge.style.cssText = `
      display: inline-block;
      background: ${this.getTypeColor(item.type)};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
    `;
    typeBadge.textContent = item.type.replace('_', ' ');
    this.tooltip.appendChild(typeBadge);

    // Add stats section for equipment
    if (item.type === 'EQUIPMENT' && item.metadata) {
      this.renderEquipmentStats(item);
    }

    // Add consumable effects
    if (item.type === 'CONSUMABLE' && item.metadata) {
      this.renderConsumableEffects(item);
    }

    // Add material info
    if (item.type === 'MATERIAL') {
      this.renderMaterialInfo(item);
    }

    // Add special item info
    if (item.type === 'SPECIAL') {
      this.renderSpecialInfo(item);
    }

    // Add acquisition info
    const footer = document.createElement('div');
    footer.style.cssText = `
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(76, 175, 80, 0.2);
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
    `;
    
    const acquiredDate = new Date(item.acquiredAt);
    footer.textContent = `Acquired: ${acquiredDate.toLocaleDateString()}`;
    this.tooltip.appendChild(footer);
  }

  private renderEquipmentStats(item: InventoryItem): void {
    if (!this.tooltip || !item.metadata) return;

    const statsSection = document.createElement('div');
    statsSection.style.cssText = `
      background: rgba(40, 40, 40, 0.6);
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;
    `;

    const statsTitle = document.createElement('div');
    statsTitle.style.cssText = `
      font-weight: bold;
      font-size: 11px;
      color: #4CAF50;
      margin-bottom: 6px;
      text-transform: uppercase;
    `;
    statsTitle.textContent = 'Equipment Stats';

    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
      font-size: 11px;
    `;

    // Add stat bonuses
    const stats = [
      { key: 'damageBonus', label: 'Damage', icon: IconType.DAMAGE, color: '#ff6b6b' },
      { key: 'healthBonus', label: 'Health', icon: IconType.HEALTH, color: '#51cf66' },
      { key: 'speedBonus', label: 'Speed', icon: IconType.SPEED, color: '#4ecdc4' },
      { key: 'fireRateBonus', label: 'Fire Rate', icon: IconType.FIRE_RATE, color: '#ffe66d' }
    ];

    stats.forEach(stat => {
      const value = item.metadata[stat.key as keyof typeof item.metadata] as number;
      if (value && value !== 0) {
        const statElement = document.createElement('div');
        statElement.style.cssText = `
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${stat.color};
        `;
        
        const icon = createSvgIcon(stat.icon, { size: 12 });
        const prefix = value > 0 ? '+' : '';
        statElement.innerHTML = `${icon}<span>${prefix}${value} ${stat.label}</span>`;
        
        statsGrid.appendChild(statElement);
      }
    });

    if (statsGrid.children.length > 0) {
      statsSection.appendChild(statsTitle);
      statsSection.appendChild(statsGrid);
      this.tooltip.appendChild(statsSection);
    }
  }

  private renderConsumableEffects(item: InventoryItem): void {
    if (!this.tooltip || !item.metadata) return;

    const effectsSection = document.createElement('div');
    effectsSection.style.cssText = `
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.3);
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;
    `;

    const effectsTitle = document.createElement('div');
    effectsTitle.style.cssText = `
      font-weight: bold;
      font-size: 11px;
      color: #2196F3;
      margin-bottom: 6px;
      text-transform: uppercase;
    `;
    effectsTitle.textContent = 'Effects';

    const effectText = document.createElement('div');
    effectText.style.cssText = `
      font-size: 11px;
      color: #CCCCCC;
      line-height: 1.3;
    `;

    // Describe the effect based on metadata
    if (item.metadata.effect === 'instant_heal' && item.metadata.healAmount) {
      effectText.textContent = `Instantly restores ${item.metadata.healAmount} health`;
    } else if (item.metadata.effect === 'damage_boost' && item.metadata.damageBonus && item.metadata.duration) {
      const bonus = Math.round(item.metadata.damageBonus * 100);
      const duration = item.metadata.duration / 1000;
      effectText.textContent = `Increases damage by ${bonus}% for ${duration} seconds`;
    } else if (item.metadata.effect === 'speed_boost' && item.metadata.speedBonus && item.metadata.duration) {
      const bonus = Math.round(item.metadata.speedBonus * 100);
      const duration = item.metadata.duration / 1000;
      effectText.textContent = `Increases movement speed by ${bonus}% for ${duration} seconds`;
    } else if (item.metadata.effect === 'fire_rate_boost' && item.metadata.fireRateBonus && item.metadata.duration) {
      const bonus = Math.round(item.metadata.fireRateBonus * 100);
      const duration = item.metadata.duration / 1000;
      effectText.textContent = `Increases fire rate by ${bonus}% for ${duration} seconds`;
    } else if (item.metadata.effect === 'shield' && item.metadata.duration) {
      const duration = item.metadata.duration / 1000;
      effectText.textContent = `Provides protective shield for ${duration} seconds`;
    } else {
      effectText.textContent = 'Special consumable effect';
    }

    effectsSection.appendChild(effectsTitle);
    effectsSection.appendChild(effectText);
    this.tooltip.appendChild(effectsSection);
  }

  private renderMaterialInfo(item: InventoryItem): void {
    if (!this.tooltip) return;

    const materialSection = document.createElement('div');
    materialSection.style.cssText = `
      background: rgba(156, 39, 176, 0.1);
      border: 1px solid rgba(156, 39, 176, 0.3);
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;
    `;

    const materialTitle = document.createElement('div');
    materialTitle.style.cssText = `
      font-weight: bold;
      font-size: 11px;
      color: #9C27B0;
      margin-bottom: 6px;
      text-transform: uppercase;
    `;
    materialTitle.textContent = 'Crafting Material';

    const materialText = document.createElement('div');
    materialText.style.cssText = `
      font-size: 11px;
      color: #CCCCCC;
      line-height: 1.3;
    `;
    materialText.textContent = 'Used for crafting and upgrading equipment';

    materialSection.appendChild(materialTitle);
    materialSection.appendChild(materialText);
    this.tooltip.appendChild(materialSection);
  }

  private renderSpecialInfo(item: InventoryItem): void {
    if (!this.tooltip) return;

    const specialSection = document.createElement('div');
    specialSection.style.cssText = `
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;
    `;

    const specialTitle = document.createElement('div');
    specialTitle.style.cssText = `
      font-weight: bold;
      font-size: 11px;
      color: #FF9800;
      margin-bottom: 6px;
      text-transform: uppercase;
    `;
    specialTitle.textContent = 'Special Item';

    const specialText = document.createElement('div');
    specialText.style.cssText = `
      font-size: 11px;
      color: #CCCCCC;
      line-height: 1.3;
    `;

    if (item.metadata.unique) {
      specialText.textContent = 'Unique item with special properties';
    } else {
      specialText.textContent = 'Special item for various purposes';
    }

    specialSection.appendChild(specialTitle);
    specialSection.appendChild(specialText);
    this.tooltip.appendChild(specialSection);
  }

  private positionTooltip(x: number, y: number): void {
    if (!this.tooltip) return;

    // Ensure tooltip stays within viewport
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x + 10; // Offset from cursor
    let finalY = y + 10;

    // Adjust horizontal position
    if (finalX + tooltipRect.width > viewportWidth) {
      finalX = x - tooltipRect.width - 10;
    }

    // Adjust vertical position
    if (finalY + tooltipRect.height > viewportHeight) {
      finalY = y - tooltipRect.height - 10;
    }

    // Ensure minimum margins
    finalX = Math.max(10, Math.min(finalX, viewportWidth - tooltipRect.width - 10));
    finalY = Math.max(10, Math.min(finalY, viewportHeight - tooltipRect.height - 10));

    this.tooltip.style.left = `${finalX}px`;
    this.tooltip.style.top = `${finalY}px`;
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

  private getTypeColor(type: ItemType): string {
    const colors = {
      CONSUMABLE: '#4CAF50',   // Green
      EQUIPMENT: '#2196F3',    // Blue
      MATERIAL: '#9C27B0',     // Purple
      SPECIAL: '#FF9800'       // Orange
    };
    return colors[type] || '#666666';
  }

  // Public API
  isVisible(): boolean {
    return this.visible;
  }

  getCurrentItem(): InventoryItem | null {
    return this.currentItem;
  }

  updateProps(newProps: Partial<ItemTooltipProps>): void {
    Object.assign(this.props, newProps);
  }

  forceUpdate(): void {
    if (this.currentItem && this.visible) {
      this.renderTooltipContent(this.currentItem);
    }
  }
}