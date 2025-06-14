/**
 * UpgradePanel Component
 * Dynamic panel for tower and player upgrades
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from './GameComponent';
import { Button } from './Button';
import { styled } from '../core/styled';
import type { Tower } from '@/entities/Tower';

interface UpgradePanelState extends GameComponentState {
  mode: 'tower' | 'player' | null;
  targetTower: Tower | null;
  currency: number;
}

interface UpgradeInfo {
  type: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  maxLevel: number;
}

// Upgrade configuration
const UPGRADE_CONFIG = {
  maxLevel: 5,
  baseCost: 50,
  costMultiplier: 1.5
};

export class UpgradePanel extends GameComponent<GameComponentProps, UpgradePanelState> {
  private upgradeButtons: Map<string, Button> = new Map();
  private closeButton: Button | null = null;
  
  private readonly towerUpgrades: UpgradeInfo[] = [
    {
      type: 'DAMAGE',
      name: 'Damage',
      icon: '⚔️',
      color: '#ff6b6b',
      description: 'Increase tower damage',
      maxLevel: UPGRADE_CONFIG.maxLevel
    },
    {
      type: 'RANGE',
      name: 'Range',
      icon: '📡',
      color: '#4ecdc4',
      description: 'Increase attack range',
      maxLevel: UPGRADE_CONFIG.maxLevel
    },
    {
      type: 'FIRE_RATE',
      name: 'Fire Rate',
      icon: '⚡',
      color: '#ffe66d',
      description: 'Attack faster',
      maxLevel: UPGRADE_CONFIG.maxLevel
    }
  ];
  
  private readonly playerUpgrades: UpgradeInfo[] = [
    {
      type: 'DAMAGE',
      name: 'Damage',
      icon: '💥',
      color: '#ff6b6b',
      description: 'Increase player damage',
      maxLevel: UPGRADE_CONFIG.maxLevel
    },
    {
      type: 'SPEED',
      name: 'Speed',
      icon: '🏃',
      color: '#4ecdc4',
      description: 'Move faster',
      maxLevel: UPGRADE_CONFIG.maxLevel
    },
    {
      type: 'FIRE_RATE',
      name: 'Fire Rate',
      icon: '🔫',
      color: '#ffe66d',
      description: 'Shoot faster',
      maxLevel: UPGRADE_CONFIG.maxLevel
    },
    {
      type: 'HEALTH',
      name: 'Health',
      icon: '💚',
      color: '#51cf66',
      description: 'Increase max health',
      maxLevel: UPGRADE_CONFIG.maxLevel
    }
  ];
  
  override getInitialState(): UpgradePanelState {
    const gameState = this.getGameState();
    return {
      visible: false, // Hidden by default
      loading: false,
      error: null,
      mode: null,
      targetTower: null,
      currency: gameState.currency
    };
  }

  onMount(): void {
    super.onMount();
    
    // Set up game event listeners
    this.game.on('currencyChanged', (data) => {
      this.setState({ currency: data.amount });
      this.updateUpgradeStates();
    });
    
    this.game.on('towerSelected', (data) => {
      if (data.tower) {
        this.showPanel('tower', data.tower);
      } else if (this.state.mode === 'tower') {
        this.hidePanel();
      }
    });
  }
  
  protected renderContent(): HTMLElement {
    if (!this.state.visible || !this.state.mode) {
      return this.createElement(styled.div`display: none;`);
    }

    const Container = this.createContainer('upgrade-panel', {
      position: 'fixed',
      top: this.state.mode === 'player' ? '200px' : '150px',
      right: this.state.mode === 'player' ? 'auto' : '16px',
      left: this.state.mode === 'player' ? '16px' : 'auto',
      minWidth: '280px',
      zIndex: 1500,
      pointerEvents: 'auto'
    });

    const container = this.createElement(Container);
    
    // Main panel
    const Panel = styled.div`
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid ${(props: { theme: any }) => 
        this.state.mode === 'player' ? props.theme.colors.info : props.theme.colors.success};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.md};
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      
      @media (max-width: 768px) {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        right: auto;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
      }
    `;
    
    const panel = this.createElement(Panel);
    
    // Panel header
    const Header = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.md};
      padding-bottom: ${(props: { theme: any }) => props.theme.spacing.sm};
      border-bottom: 1px solid ${(props: { theme: any }) => props.theme.colors.border};
    `;
    
    const header = this.createElement(Header);
    
    // Title
    const Title = styled.h3`
      margin: 0;
      color: ${(props: { theme: any }) => 
        this.state.mode === 'player' ? props.theme.colors.info : props.theme.colors.success};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
    `;
    
    const titleText = this.state.mode === 'player' ? 'Player Upgrades' : 
                     this.state.targetTower ? `${this.state.targetTower.towerType} Tower` : 'Tower Upgrades';
    const title = this.createElement(Title, {}, titleText);
    
    // Close button
    const CloseButton = styled.button`
      background: none;
      border: none;
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      cursor: pointer;
      padding: ${(props: { theme: any }) => props.theme.spacing.xs};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: ${(props: { theme: any }) => props.theme.colors.text};
      }
    `;
    
    const closeButton = this.createElement(CloseButton, {
      onClick: () => this.handleClose()
    }, '✕');
    
    header.appendChild(title);
    header.appendChild(closeButton);
    panel.appendChild(header);
    
    // Upgrades container
    const UpgradesContainer = styled.div`
      display: flex;
      flex-direction: column;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const upgradesContainer = this.createElement(UpgradesContainer);
    
    // Get current upgrades based on mode
    const upgrades = this.state.mode === 'player' ? this.playerUpgrades : this.towerUpgrades;
    
    // Clear existing buttons and create new ones
    this.upgradeButtons.clear();
    upgrades.forEach(upgrade => {
      const button = this.createUpgradeButton(upgrade);
      this.upgradeButtons.set(upgrade.type, button);
      upgradesContainer.appendChild(button.getElement()!);
    });
    
    panel.appendChild(upgradesContainer);
    container.appendChild(panel);
    
    // Update states after rendering
    setTimeout(() => this.updateUpgradeStates(), 0);
    
    return container;
  }
  
  private createUpgradeButton(upgrade: UpgradeInfo): Button {
    const UpgradeButtonContainer = styled.div`
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid ${(props: { theme: any }) => props.theme.colors.border};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
      padding: ${(props: { theme: any }) => props.theme.spacing.sm};
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      
      &:hover {
        background: rgba(60, 60, 60, 0.9);
        border-color: ${upgrade.color};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
      
      &.max-level {
        background: rgba(255, 215, 0, 0.2);
        border-color: gold;
      }
    `;

    const button = this.createElement(UpgradeButtonContainer, {
      className: 'upgrade-button',
      onClick: () => this.handleUpgrade(upgrade.type),
      title: upgrade.description
    });

    // Content layout
    const ContentLayout = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;

    const contentLayout = this.createElement(ContentLayout);

    // Icon
    const UpgradeIcon = styled.div`
      font-size: 28px;
      filter: drop-shadow(0 0 6px ${upgrade.color});
      min-width: 32px;
      text-align: center;
    `;

    const icon = this.createElement(UpgradeIcon, {}, upgrade.icon);

    // Info container
    const InfoContainer = styled.div`
      flex: 1;
      min-width: 0;
    `;

    const infoContainer = this.createElement(InfoContainer);

    // Name
    const UpgradeName = styled.div`
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
      color: ${(props: { theme: any }) => props.theme.colors.text};
      margin-bottom: 4px;
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
    `;

    const name = this.createElement(UpgradeName, { className: 'upgrade-name' }, upgrade.name);

    // Level info
    const LevelInfo = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      margin-bottom: 2px;
    `;

    const levelInfo = this.createElement(LevelInfo, { className: 'upgrade-info' }, 
      `Level ${this.createElement('span', { className: 'upgrade-level' }, '0')}/${upgrade.maxLevel}`);

    // Cost info
    const CostInfo = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      color: ${(props: { theme: any }) => props.theme.colors.warning};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.semibold};
    `;

    const costInfo = this.createElement(CostInfo, { className: 'upgrade-cost' },
      `Cost: $${this.createElement('span', { className: 'cost-value' }, '0')}`);

    // Progress bar
    const ProgressBar = styled.div`
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: ${upgrade.color};
      transition: width 0.3s ease;
      width: 0%;
    `;

    const progressBar = this.createElement(ProgressBar, { className: 'upgrade-progress' });

    // Assemble components
    infoContainer.appendChild(name);
    infoContainer.appendChild(levelInfo);
    infoContainer.appendChild(costInfo);

    contentLayout.appendChild(icon);
    contentLayout.appendChild(infoContainer);

    button.appendChild(contentLayout);
    button.appendChild(progressBar);

    // Create a Button wrapper for compatibility
    const buttonWrapper = new Button({
      text: '',
      variant: 'primary',
      size: 'small',
      fullWidth: true,
      className: 'upgrade-button-wrapper',
      style: { padding: '0', background: 'none', border: 'none' },
      onClick: () => this.handleUpgrade(upgrade.type)
    });

    // Replace button content with our custom element
    const wrapperElement = buttonWrapper.getElement();
    if (wrapperElement) {
      wrapperElement.innerHTML = '';
      wrapperElement.appendChild(button);
    }

    return buttonWrapper;
  }
  
  private handleUpgrade(type: string): void {
    const cost = this.calculateUpgradeCost(type);
    const level = this.getCurrentUpgradeLevel(type);
    
    if (level >= UPGRADE_CONFIG.maxLevel) {
      this.uiManager.showNotification('Upgrade already at maximum level!', 'warning');
      return;
    }
    
    if (!this.canAfford(cost)) {
      this.uiManager.showNotification(`Need ${this.formatCurrency(cost - this.state.currency)} more!`, 'error');
      return;
    }
    
    let success = false;
    
    if (this.state.mode === 'tower' && this.state.targetTower) {
      // Connect to actual tower upgrade system
      import('@/entities/Tower').then(({ UpgradeType }) => {
        const upgradeType = UpgradeType[type as keyof typeof UpgradeType];
        if (upgradeType && this.state.targetTower) {
          success = this.game.upgradeTower(this.state.targetTower, upgradeType);
          
          if (success) {
            this.uiManager.showNotification(`Tower ${type} upgraded successfully!`, 'success');
            this.updateUpgradeStates();
          } else {
            this.uiManager.showNotification(`Failed to upgrade tower ${type}!`, 'error');
          }
        }
      });
    } else if (this.state.mode === 'player') {
      // Connect to actual player upgrade system
      import('@/entities/Player').then(({ PlayerUpgradeType }) => {
        const upgradeType = PlayerUpgradeType[type as keyof typeof PlayerUpgradeType];
        if (upgradeType) {
          success = this.game.upgradePlayer(upgradeType);
          
          if (success) {
            this.uiManager.showNotification(`Player ${type} upgraded successfully!`, 'success');
            this.updateUpgradeStates();
          } else {
            this.uiManager.showNotification(`Failed to upgrade player ${type}!`, 'error');
          }
        }
      });
    }
  }
  
  private handleClose(): void {
    this.hidePanel();
  }
  
  /**
   * Show the upgrade panel
   */
  showPanel(mode: 'tower' | 'player', tower: Tower | null = null): void {
    this.setState({ 
      mode, 
      targetTower: tower,
      visible: true 
    });
    this.forceUpdate();
  }
  
  /**
   * Hide the upgrade panel
   */
  hidePanel(): void {
    this.setState({ 
      mode: null, 
      targetTower: null,
      visible: false 
    });
  }
  
  /**
   * Calculate upgrade cost for a given type
   */
  private calculateUpgradeCost(type: string): number {
    const level = this.getCurrentUpgradeLevel(type);
    if (level >= UPGRADE_CONFIG.maxLevel) return 0;
    
    return Math.floor(UPGRADE_CONFIG.baseCost * Math.pow(UPGRADE_CONFIG.costMultiplier, level));
  }
  
  /**
   * Get current upgrade level for a given type
   */
  private getCurrentUpgradeLevel(type: string): number {
    if (this.state.mode === 'tower' && this.state.targetTower) {
      // Import UpgradeType dynamically to avoid circular dependencies
      if (type === 'DAMAGE') {
        return this.state.targetTower.getUpgradeLevel('DAMAGE' as any);
      } else if (type === 'RANGE') {
        return this.state.targetTower.getUpgradeLevel('RANGE' as any);
      } else if (type === 'FIRE_RATE') {
        return this.state.targetTower.getUpgradeLevel('FIRE_RATE' as any);
      }
    } else if (this.state.mode === 'player') {
      const player = this.game.getPlayer();
      if (type === 'DAMAGE') {
        return player.getUpgradeLevel('DAMAGE' as any);
      } else if (type === 'SPEED') {
        return player.getUpgradeLevel('SPEED' as any);
      } else if (type === 'FIRE_RATE') {
        return player.getUpgradeLevel('FIRE_RATE' as any);
      } else if (type === 'HEALTH') {
        return player.getUpgradeLevel('HEALTH' as any);
      }
    }
    return 0;
  }
  
  /**
   * Update upgrade states for all buttons
   */
  private updateUpgradeStates(): void {
    const upgrades = this.state.mode === 'player' ? this.playerUpgrades : this.towerUpgrades;
    
    upgrades.forEach(upgrade => {
      const button = this.upgradeButtons.get(upgrade.type);
      if (button) {
        const level = this.getCurrentUpgradeLevel(upgrade.type);
        const cost = this.calculateUpgradeCost(upgrade.type);
        const canUpgrade = level < upgrade.maxLevel && this.state.currency >= cost;
        
        this.updateUpgradeButton(button, upgrade, level, cost, canUpgrade);
      }
    });
  }
  
  /**
   * Update a single upgrade button's display
   */
  private updateUpgradeButton(button: Button, upgrade: UpgradeInfo, level: number, cost: number, canUpgrade: boolean): void {
    const element = button.getElement();
    if (!element) return;
    
    // Update level
    const levelElement = element.querySelector('.upgrade-level');
    if (levelElement) {
      levelElement.textContent = String(level);
    }
    
    // Update cost
    const costElement = element.querySelector('.cost-value');
    if (costElement) {
      costElement.textContent = level >= upgrade.maxLevel ? 'MAX' : String(cost);
    }
    
    // Update progress bar
    const progressElement = element.querySelector('.upgrade-progress') as HTMLElement;
    if (progressElement) {
      progressElement.style.width = `${(level / upgrade.maxLevel) * 100}%`;
    }
    
    // Update button container state
    const buttonContainer = element.querySelector('.upgrade-button') as HTMLElement;
    if (buttonContainer) {
      buttonContainer.classList.toggle('disabled', !canUpgrade);
      buttonContainer.classList.toggle('max-level', level >= upgrade.maxLevel);
    }
  }
  
  /**
   * Called after state updates to refresh display
   */
  onStateUpdate(): void {
    super.onStateUpdate();
    if (this.state.visible && this.state.mode) {
      this.updateUpgradeStates();
    }
  }
  
  /**
   * Check if player can afford the given cost
   */
  private canAfford(cost: number): boolean {
    return this.state.currency >= cost;
  }
  
  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return `$${amount}`;
  }
}