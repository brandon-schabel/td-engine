import { Tower, UpgradeType } from '@/entities/Tower';
import { Game } from '@/core/Game';
import { COLOR_THEME } from '@/config/ColorTheme';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';

export class SimpleTowerInfo {
  private container: HTMLElement;
  private tower: Tower;
  private game: Game;
  private audioManager?: AudioManager;
  private updateInterval?: number;
  private isProcessingAction: boolean = false;
  
  constructor(tower: Tower, game: Game, audioManager?: AudioManager) {
    this.tower = tower;
    this.game = game;
    this.audioManager = audioManager;
    this.container = this.createContainer();
    this.updateContent();
    this.startUpdating();
  }
  
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'simple-tower-info';
    container.className = 'simple-tower-info';
    container.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: clamp(280px, 80vw, 360px);
      background: ${COLOR_THEME.ui.background.primary}e6;
      border: 2px solid ${COLOR_THEME.ui.text.success};
      border-radius: 12px;
      padding: 16px;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    
    // Add styles for buttons - only active state, no hover
    const style = document.createElement('style');
    style.textContent = `
      #simple-tower-info * {
        pointer-events: none;
      }
      #simple-tower-info button {
        pointer-events: auto !important;
        position: relative;
        overflow: hidden;
        transition: none !important;
      }
      #simple-tower-info button:active {
        opacity: 0.8 !important;
        transform: scale(0.98) !important;
      }
      #simple-tower-info button:focus {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Store style reference for cleanup
    (container as any)._style = style;
    
    // Prevent clicks on the container from propagating
    container.onclick = (e) => {
      e.stopPropagation();
    };
    
    return container;
  }
  
  private updateContent(): void {
    this.container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      color: ${COLOR_THEME.ui.text.success};
      font-size: 18px;
    `;
    title.textContent = `${this.tower.towerType} Tower (Lvl ${this.tower.getLevel()})`;
    
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${COLOR_THEME.ui.text.secondary};
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      outline: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    `;
    closeBtn.innerHTML = '×';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.close();
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    this.container.appendChild(header);
    
    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    `;
    
    const statItems = [
      { label: 'Damage', value: Math.round(this.tower.damage), icon: IconType.DAMAGE },
      { label: 'Range', value: Math.round(this.tower.range), icon: IconType.RANGE },
      { label: 'Speed', value: (this.tower.fireRate * 60).toFixed(1), icon: IconType.SPEED }
    ];
    
    statItems.forEach(stat => {
      const statDiv = document.createElement('div');
      statDiv.style.cssText = `
        background: rgba(0, 0, 0, 0.3);
        padding: 8px;
        border-radius: 6px;
        text-align: center;
      `;
      
      const icon = document.createElement('div');
      icon.innerHTML = createSvgIcon(stat.icon, { size: 20 });
      icon.style.color = COLOR_THEME.ui.text.success;
      icon.style.marginBottom = '4px';
      
      const value = document.createElement('div');
      value.style.cssText = `
        color: ${COLOR_THEME.ui.text.primary};
        font-weight: bold;
        font-size: 14px;
      `;
      value.textContent = stat.value.toString();
      
      const label = document.createElement('div');
      label.style.cssText = `
        color: ${COLOR_THEME.ui.text.secondary};
        font-size: 12px;
      `;
      label.textContent = stat.label;
      
      statDiv.appendChild(icon);
      statDiv.appendChild(value);
      statDiv.appendChild(label);
      stats.appendChild(statDiv);
    });
    
    this.container.appendChild(stats);
    
    // Upgrade levels
    const upgrades = document.createElement('div');
    upgrades.style.cssText = `
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;
    `;
    
    const upgradeTypes = [
      { type: UpgradeType.DAMAGE, name: 'DMG' },
      { type: UpgradeType.RANGE, name: 'RNG' },
      { type: UpgradeType.FIRE_RATE, name: 'SPD' }
    ];
    
    upgradeTypes.forEach(upgrade => {
      const level = this.tower.getUpgradeLevel(upgrade.type);
      const maxLevel = this.tower.getMaxUpgradeLevel();
      
      const upgradeDiv = document.createElement('div');
      upgradeDiv.style.cssText = `
        text-align: center;
      `;
      
      const label = document.createElement('div');
      label.style.cssText = `
        color: ${COLOR_THEME.ui.text.secondary};
        font-size: 12px;
        margin-bottom: 4px;
      `;
      label.textContent = upgrade.name;
      
      // Progress bar container
      const progressContainer = document.createElement('div');
      progressContainer.style.cssText = `
        position: relative;
        width: 60px;
        height: 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
      `;
      
      // Progress fill
      const progressFill = document.createElement('div');
      const percentage = (level / maxLevel) * 100;
      progressFill.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${percentage}%;
        background: ${COLOR_THEME.ui.text.success};
        transition: width 0.3s ease;
      `;
      
      // Progress text
      const progressText = document.createElement('div');
      progressText.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
      `;
      progressText.textContent = `${level}/${maxLevel}`;
      
      progressContainer.appendChild(progressFill);
      progressContainer.appendChild(progressText);
      
      upgradeDiv.appendChild(label);
      upgradeDiv.appendChild(progressContainer);
      upgrades.appendChild(upgradeDiv);
    });
    
    this.container.appendChild(upgrades);
    
    // Action buttons
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    
    // Upgrade button
    const canUpgrade = this.tower.getLevel() < 9;
    const upgradeBtn = document.createElement('button');
    upgradeBtn.style.cssText = `
      flex: 1;
      padding: 12px;
      background: ${canUpgrade ? COLOR_THEME.ui.button.primary : 'rgba(255, 255, 255, 0.1)'};
      border: 1px solid ${canUpgrade ? COLOR_THEME.ui.text.success : 'rgba(255, 255, 255, 0.2)'};
      border-radius: 6px;
      color: white;
      font-weight: bold;
      cursor: ${canUpgrade ? 'pointer' : 'not-allowed'};
      opacity: ${canUpgrade ? '1' : '0.5'};
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      outline: none;
    `;
    upgradeBtn.innerHTML = createSvgIcon(IconType.UPGRADE, { size: 16 }) + ' Upgrade';
    upgradeBtn.disabled = !canUpgrade;
    
    if (canUpgrade) {
      upgradeBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (this.isProcessingAction) return;
        this.isProcessingAction = true;
        
        this.audioManager?.playUISound(SoundType.BUTTON_CLICK);
        // Open upgrade dialog
        const event = new CustomEvent('showTowerUpgrade', { detail: { tower: this.tower } });
        document.dispatchEvent(event);
        
        // Small delay to prevent double-clicks
        setTimeout(() => {
          this.close();
        }, 100);
      };
    }
    
    // Sell button
    const sellBtn = document.createElement('button');
    sellBtn.style.cssText = `
      flex: 1;
      padding: 12px;
      background: rgba(255, 59, 48, 0.2);
      border: 1px solid #FF3B30;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      outline: none;
    `;
    sellBtn.innerHTML = createSvgIcon(IconType.SELL, { size: 16 }) + ` Sell (${this.tower.getSellValue()}g)`;
    
    sellBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (this.isProcessingAction) return;
      this.isProcessingAction = true;
      
      this.audioManager?.playUISound(SoundType.SELL);
      this.game.sellTower(this.tower);
      this.close();
    };
    
    actions.appendChild(upgradeBtn);
    actions.appendChild(sellBtn);
    this.container.appendChild(actions);
  }
  
  private startUpdating(): void {
    this.updateInterval = window.setInterval(() => {
      if (!this.game.isTowerSelected(this.tower)) {
        this.close();
        return;
      }
      this.updateContent();
    }, 100);
  }
  
  public show(): void {
    // Remove any existing tower info
    const existing = document.getElementById('simple-tower-info');
    if (existing) {
      existing.remove();
    }
    
    document.body.appendChild(this.container);
  }
  
  public close(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Clean up style element
    const style = (this.container as any)._style;
    if (style && style.parentNode) {
      style.remove();
    }
    
    this.container.remove();
    this.game.deselectTower();
  }
}