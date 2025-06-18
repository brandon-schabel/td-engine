import { BaseDialog } from './BaseDialog';
import { Tower, UpgradeType } from '@/entities/Tower';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';
import { Game } from '@/core/Game';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export interface TowerInfoDialogOptions {
  tower: Tower;
  game: Game;
  audioManager?: AudioManager;
  onUpgrade?: () => void;
  onSell?: () => void;
  onClose?: () => void;
}

export class TowerInfoDialog extends BaseDialog {
  protected tower: Tower;
  protected game: Game;
  protected onUpgrade?: () => void;
  protected onSell?: () => void;
  protected onClose?: () => void;
  protected audioManager?: AudioManager;
  private updateInterval?: number;
  
  constructor(options: TowerInfoDialogOptions) {
    console.log('[TowerInfoDialog] Constructor called');
    super({
      title: `${options.tower.towerType} Tower`,
      width: DIALOG_CONFIG.sizes.small,
      closeable: true,
      modal: false,
      audioManager: options.audioManager,
      className: 'tower-info-dialog'
    });
    
    console.log('[TowerInfoDialog] Base dialog constructed');
    
    this.tower = options.tower;
    this.game = options.game;
    this.onUpgrade = options.onUpgrade;
    this.onSell = options.onSell;
    this.onClose = options.onClose;
    this.audioManager = options.audioManager;
    
    // Ensure content exists before building
    if (!this.content) {
      console.error('[TowerInfoDialog] Content element not initialized!');
      return;
    }
    
    this.buildContent();
    this.startUpdating();
  }
  
  protected buildContent(): void {
    console.log('[TowerInfoDialog] buildContent called for tower:', this.tower.towerType);
    console.log('[TowerInfoDialog] Dialog container exists:', !!this.container);
    console.log('[TowerInfoDialog] Content element exists:', !!this.content);
    
    // Tower icon and basic info
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      margin-bottom: 16px;
    `;
    
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(76, 175, 80, 0.2);
      border-radius: 12px;
      border: 2px solid #4CAF50;
    `;
    
    const towerIcon = this.getTowerIcon(this.tower.towerType);
    iconContainer.innerHTML = createSvgIcon(towerIcon, { size: 48 });
    headerSection.appendChild(iconContainer);
    
    const infoContainer = document.createElement('div');
    infoContainer.style.cssText = `
      flex: 1;
    `;
    
    const towerName = document.createElement('div');
    towerName.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: #4CAF50;
      margin-bottom: 4px;
    `;
    towerName.textContent = this.getTowerName(this.tower.towerType);
    infoContainer.appendChild(towerName);
    
    const towerLevel = document.createElement('div');
    towerLevel.style.cssText = `
      font-size: 14px;
      color: #ccc;
    `;
    towerLevel.textContent = `Level ${this.tower.getLevel()}`;
    infoContainer.appendChild(towerLevel);
    
    headerSection.appendChild(infoContainer);
    this.content.appendChild(headerSection);
    
    // Stats section
    const statsSection = document.createElement('div');
    statsSection.className = 'tower-stats';
    statsSection.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    `;
    
    const stats = [
      { label: 'Damage', value: Math.round(this.tower.damage), icon: IconType.DAMAGE },
      { label: 'Range', value: Math.round(this.tower.range), icon: IconType.RANGE },
      { label: 'Fire Rate', value: (1000 / this.tower.fireRate).toFixed(1) + '/s', icon: IconType.SPEED },
      { label: 'Value', value: this.tower.getSellValue() + 'g', icon: IconType.COINS }
    ];
    
    stats.forEach(stat => {
      const statCard = document.createElement('div');
      statCard.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      const iconEl = document.createElement('div');
      iconEl.style.cssText = `
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4CAF50;
      `;
      iconEl.innerHTML = createSvgIcon(stat.icon, { size: 24 });
      
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        flex: 1;
      `;
      
      const label = document.createElement('div');
      label.style.cssText = `
        font-size: 11px;
        color: #999;
        text-transform: uppercase;
      `;
      label.textContent = stat.label;
      
      const value = document.createElement('div');
      value.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      `;
      value.textContent = stat.value.toString();
      
      textContainer.appendChild(label);
      textContainer.appendChild(value);
      statCard.appendChild(iconEl);
      statCard.appendChild(textContainer);
      statsSection.appendChild(statCard);
    });
    
    this.content.appendChild(statsSection);
    
    // Upgrade indicators
    const upgradeSection = document.createElement('div');
    upgradeSection.style.cssText = `
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
    `;
    
    const upgradeTitle = document.createElement('div');
    upgradeTitle.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      color: #4CAF50;
      margin-bottom: 8px;
    `;
    upgradeTitle.textContent = 'Upgrades';
    upgradeSection.appendChild(upgradeTitle);
    
    const upgradesGrid = document.createElement('div');
    upgradesGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    `;
    
    const upgradeTypes = [
      { type: UpgradeType.DAMAGE, name: 'Damage', icon: IconType.DAMAGE },
      { type: UpgradeType.RANGE, name: 'Range', icon: IconType.RANGE },
      { type: UpgradeType.FIRE_RATE, name: 'Speed', icon: IconType.SPEED }
    ];
    
    upgradeTypes.forEach(upgrade => {
      const upgradeCard = document.createElement('div');
      upgradeCard.style.cssText = `
        text-align: center;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
      `;
      
      const icon = document.createElement('div');
      icon.style.cssText = `
        margin-bottom: 4px;
        color: #4CAF50;
      `;
      icon.innerHTML = createSvgIcon(upgrade.icon, { size: 20 });
      
      const level = document.createElement('div');
      level.style.cssText = `
        font-size: 12px;
        color: #ccc;
      `;
      const currentLevel = this.tower.getUpgradeLevel(upgrade.type);
      const maxLevel = this.tower.getMaxUpgradeLevel();
      level.textContent = `${currentLevel}/${maxLevel}`;
      
      upgradeCard.appendChild(icon);
      upgradeCard.appendChild(level);
      upgradesGrid.appendChild(upgradeCard);
    });
    
    upgradeSection.appendChild(upgradesGrid);
    this.content.appendChild(upgradeSection);
    
    // Action buttons
    this.createFooter();
    const footer = this.footer!;
    
    // Upgrade button
    const canUpgrade = this.tower.getLevel() < 9; // Max combined level
    const upgradeButton = this.createButton('Upgrade', {
      icon: IconType.UPGRADE,
      color: '#4CAF50',
      onClick: () => {
        this.playSound(SoundType.BUTTON_CLICK);
        if (this.onUpgrade) {
          this.onUpgrade();
        }
        this.hide();
      }
    });
    
    if (!canUpgrade) {
      upgradeButton.style.opacity = '0.5';
      upgradeButton.style.cursor = 'not-allowed';
      upgradeButton.disabled = true;
      upgradeButton.innerHTML += ' (MAX)';
    }
    
    footer.appendChild(upgradeButton);
    
    // Sell button
    if (this.onSell) {
      const sellButton = this.createButton(`Sell (${this.tower.getSellValue()}g)`, {
        icon: IconType.COINS,
        color: '#FF9800',
        onClick: () => {
          this.playSound(SoundType.BUTTON_CLICK);
          if (confirm(`Sell this tower for ${this.tower.getSellValue()} gold?`)) {
            this.onSell!();
            this.hide();
          }
        }
      });
      footer.appendChild(sellButton);
    }
    
    // Close button
    const closeButton = this.createButton('Close', {
      icon: IconType.CLOSE,
      onClick: () => {
        this.hide();
      }
    });
    footer.appendChild(closeButton);
  }
  
  private getTowerIcon(type: string): IconType {
    switch (type) {
      case 'BASIC': return IconType.BASIC_TOWER;
      case 'SNIPER': return IconType.SNIPER_TOWER;
      case 'RAPID': return IconType.RAPID_TOWER;
      case 'WALL': return IconType.WALL;
      default: return IconType.TOWER;
    }
  }
  
  private getTowerName(type: string): string {
    switch (type) {
      case 'BASIC': return 'Basic Tower';
      case 'SNIPER': return 'Sniper Tower';
      case 'RAPID': return 'Rapid Tower';
      case 'WALL': return 'Wall';
      default: return 'Tower';
    }
  }
  
  private startUpdating(): void {
    // Update stats periodically in case they change
    this.updateInterval = window.setInterval(() => {
      // Check if tower still exists
      if (!this.game.getTowers().includes(this.tower)) {
        this.hide();
        return;
      }
      
      // Update stats if needed
      const statsElements = this.content.querySelectorAll('.tower-stats > div');
      if (statsElements.length >= 4) {
        // Update damage
        statsElements[0].querySelector('div:last-child')!.textContent = Math.round(this.tower.damage).toString();
        // Update range
        statsElements[1].querySelector('div:last-child')!.textContent = Math.round(this.tower.range).toString();
        // Update fire rate
        statsElements[2].querySelector('div:last-child')!.textContent = (1000 / this.tower.fireRate).toFixed(1) + '/s';
        // Update value
        statsElements[3].querySelector('div:last-child')!.textContent = this.tower.getSellValue() + 'g';
      }
    }, ANIMATION_CONFIG.durations.slower);
  }
  
  protected override afterShow(): void {
    super.afterShow();
    // Position dialog next to tower
    this.positionNearTower();
  }
  
  private positionNearTower(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const camera = this.game.getCamera();
    
    // Convert tower world position to screen position
    const screenPos = camera.worldToScreen(this.tower.position);
    
    // Calculate dialog position (offset to the right of tower)
    const dialogX = rect.left + screenPos.x + 60;
    const dialogY = rect.top + screenPos.y - 50;
    
    // Update dialog position
    this.dialog.style.position = 'fixed';
    this.dialog.style.left = `${dialogX}px`;
    this.dialog.style.top = `${dialogY}px`;
    this.dialog.style.transform = 'none';
    
    // Keep on screen
    const dialogRect = this.dialog.getBoundingClientRect();
    if (dialogRect.right > window.innerWidth - 20) {
      // Position to the left of tower instead
      this.dialog.style.left = `${rect.left + screenPos.x - dialogRect.width - 60}px`;
    }
    if (dialogRect.bottom > window.innerHeight - 20) {
      this.dialog.style.top = `${window.innerHeight - dialogRect.height - 20}px`;
    }
    if (dialogRect.top < 20) {
      this.dialog.style.top = '20px';
    }
  }
  
  protected override beforeHide(): void {
    super.beforeHide();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    if (this.onClose) {
      this.onClose();
    }
  }
  
  public override destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    super.destroy();
  }
}