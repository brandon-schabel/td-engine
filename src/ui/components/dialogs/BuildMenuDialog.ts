import { BaseDialog } from './BaseDialog';
import { TowerType } from '@/entities/Tower';
import { TOWER_COSTS } from '@/config/GameConfig';
import { TOWER_STATS } from '@/config/TowerConfig';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';

export interface BuildMenuDialogOptions {
  currentCurrency: number;
  audioManager?: AudioManager;
  onTowerSelect: (type: TowerType) => void;
  onCancel: () => void;
}

interface TowerOption {
  type: TowerType;
  name: string;
  cost: number;
  icon: IconType;
  description: string;
  stats: {
    damage: number;
    range: number;
    fireRate: number;
  };
}

export class BuildMenuDialog extends BaseDialog {
  private currentCurrency: number;
  private onTowerSelect: (type: TowerType) => void;
  private onCancel: () => void;
  private selectedType: TowerType | null = null;
  
  private towerOptions: TowerOption[] = [
    {
      type: TowerType.BASIC,
      name: 'Basic Tower',
      cost: TOWER_COSTS['BASIC'],
      icon: IconType.BASIC_TOWER,
      description: 'Balanced all-around tower',
      stats: TOWER_STATS[TowerType.BASIC]
    },
    {
      type: TowerType.SNIPER,
      name: 'Sniper Tower',
      cost: TOWER_COSTS['SNIPER'],
      icon: IconType.SNIPER_TOWER,
      description: 'Long range, high damage',
      stats: TOWER_STATS[TowerType.SNIPER]
    },
    {
      type: TowerType.RAPID,
      name: 'Rapid Tower',
      cost: TOWER_COSTS['RAPID'],
      icon: IconType.RAPID_TOWER,
      description: 'Fast firing, low damage',
      stats: TOWER_STATS[TowerType.RAPID]
    },
    {
      type: TowerType.WALL,
      name: 'Wall',
      cost: TOWER_COSTS['WALL'],
      icon: IconType.WALL,
      description: 'Blocks enemy movement',
      stats: { damage: 0, range: 0, fireRate: 0 }
    }
  ];
  
  constructor(options: BuildMenuDialogOptions) {
    super({
      title: 'Build Tower',
      width: DIALOG_CONFIG.sizes.medium,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'build-menu-dialog'
    });
    
    this.currentCurrency = options.currentCurrency;
    this.onTowerSelect = options.onTowerSelect;
    this.onCancel = options.onCancel;
    
    this.buildContent();
  }
  
  protected buildContent(): void {
    // Currency display
    const currencyDisplay = document.createElement('div');
    currencyDisplay.style.cssText = `
      text-align: center;
      margin-bottom: 20px;
      padding: 12px;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 215, 0, 0.3);
    `;
    
    const currencyIcon = createSvgIcon(IconType.CURRENCY, { size: 24 });
    currencyDisplay.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        ${currencyIcon}
        <span style="font-size: clamp(18px, 4.5vw, 22px); font-weight: bold; color: #FFD700;">
          ${this.currentCurrency}
        </span>
        <span style="color: #ccc; font-size: clamp(14px, 3.5vw, 16px);">
          Available
        </span>
      </div>
    `;
    
    this.content.appendChild(currencyDisplay);
    
    // Tower grid
    const towerGrid = document.createElement('div');
    towerGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 35vw, 200px), 1fr));
      gap: 16px;
      margin-bottom: 20px;
    `;
    
    this.towerOptions.forEach(tower => {
      const towerCard = this.createTowerCard(tower);
      towerGrid.appendChild(towerCard);
    });
    
    this.content.appendChild(towerGrid);
    
    // Selected tower details
    const detailsSection = document.createElement('div');
    detailsSection.id = 'tower-details';
    detailsSection.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      min-height: 80px;
      display: none;
    `;
    
    this.content.appendChild(detailsSection);
    
    // Footer buttons
    this.createFooter();
    const footer = this.footer!;
    
    const buildButton = this.createButton('Build', {
      icon: IconType.BUILD,
      primary: true,
      onClick: () => {
        if (this.selectedType !== null) {
          this.hide();
          this.onTowerSelect(this.selectedType);
        }
      }
    });
    buildButton.id = 'build-button';
    buildButton.disabled = true;
    
    const cancelButton = this.createButton('Cancel', {
      icon: IconType.CLOSE,
      color: '#F44336',
      onClick: () => {
        this.hide();
        this.onCancel();
      }
    });
    
    footer.appendChild(buildButton);
    footer.appendChild(cancelButton);
  }
  
  private createTowerCard(tower: TowerOption): HTMLElement {
    const canAfford = this.currentCurrency >= tower.cost;
    
    const card = document.createElement('div');
    card.className = 'tower-card';
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid ${canAfford ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'};
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: ${canAfford ? 'pointer' : 'not-allowed'};
      opacity: ${canAfford ? '1' : '0.6'};
      transition: all 0.2s ease;
      position: relative;
    `;
    
    // Tower icon
    const icon = createSvgIcon(tower.icon, { size: 48 });
    const iconDiv = document.createElement('div');
    iconDiv.innerHTML = icon;
    iconDiv.style.cssText = `
      margin-bottom: 12px;
      filter: ${canAfford ? 'none' : 'grayscale(100%)'};
    `;
    card.appendChild(iconDiv);
    
    // Tower name
    const name = document.createElement('div');
    name.style.cssText = `
      font-weight: bold;
      color: ${canAfford ? '#4CAF50' : '#999'};
      margin-bottom: 4px;
      font-size: clamp(14px, 3.5vw, 16px);
    `;
    name.textContent = tower.name;
    card.appendChild(name);
    
    // Tower cost
    const cost = document.createElement('div');
    cost.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: clamp(12px, 3vw, 14px);
      color: ${canAfford ? '#FFD700' : '#999'};
    `;
    const costIcon = createSvgIcon(IconType.CURRENCY, { size: 16 });
    cost.innerHTML = `${costIcon}<span>${tower.cost}</span>`;
    card.appendChild(cost);
    
    // Hover and click effects
    if (canAfford) {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      });
      
      card.addEventListener('mouseleave', () => {
        if (this.selectedType !== tower.type) {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = 'none';
        }
      });
      
      card.addEventListener('click', () => {
        this.selectTower(tower, card);
      });
    }
    
    return card;
  }
  
  private selectTower(tower: TowerOption, card: HTMLElement): void {
    // Deselect previous
    const previousCard = this.content.querySelector('.tower-card.selected');
    if (previousCard) {
      previousCard.classList.remove('selected');
      (previousCard as HTMLElement).style.border = '2px solid rgba(76, 175, 80, 0.5)';
      (previousCard as HTMLElement).style.transform = 'translateY(0)';
      (previousCard as HTMLElement).style.boxShadow = 'none';
    }
    
    // Select new
    this.selectedType = tower.type;
    card.classList.add('selected');
    card.style.border = '2px solid #4CAF50';
    card.style.transform = 'translateY(-4px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    
    // Update details
    this.updateTowerDetails(tower);
    
    // Enable build button
    const buildButton = document.getElementById('build-button') as HTMLButtonElement;
    if (buildButton) {
      buildButton.disabled = false;
      buildButton.style.opacity = '1';
    }
    
    this.playSound(SoundType.SELECT);
  }
  
  private updateTowerDetails(tower: TowerOption): void {
    const detailsSection = document.getElementById('tower-details');
    if (!detailsSection) return;
    
    detailsSection.style.display = 'block';
    
    if (tower.type === TowerType.WALL) {
      detailsSection.innerHTML = `
        <div style="text-align: center;">
          <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px; font-size: clamp(16px, 4vw, 18px);">
            ${tower.name}
          </div>
          <div style="color: #ccc; font-size: clamp(12px, 3vw, 14px);">
            ${tower.description}
          </div>
          <div style="color: #FF9800; margin-top: 12px; font-size: clamp(12px, 3vw, 14px);">
            Blocks enemy movement but cannot attack
          </div>
        </div>
      `;
    } else {
      const stats = [
        { label: 'Damage', value: tower.stats.damage, icon: IconType.DAMAGE },
        { label: 'Range', value: tower.stats.range, icon: IconType.RANGE },
        { label: 'Fire Rate', value: `${tower.stats.fireRate}/s`, icon: IconType.SPEED }
      ];
      
      detailsSection.innerHTML = `
        <div>
          <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px; font-size: clamp(16px, 4vw, 18px);">
            ${tower.name}
          </div>
          <div style="color: #ccc; margin-bottom: 12px; font-size: clamp(12px, 3vw, 14px);">
            ${tower.description}
          </div>
          <div style="display: flex; justify-content: space-around; gap: 12px;">
            ${stats.map(stat => `
              <div style="text-align: center;">
                <div style="opacity: 0.7; margin-bottom: 4px;">
                  ${createSvgIcon(stat.icon, { size: 20 })}
                </div>
                <div style="color: #4CAF50; font-weight: bold; font-size: clamp(14px, 3.5vw, 16px);">
                  ${stat.value}
                </div>
                <div style="color: #999; font-size: clamp(10px, 2.5vw, 12px);">
                  ${stat.label}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }
  
  protected beforeHide(): void {
    if (this.selectedType === null) {
      this.onCancel();
    }
  }
}