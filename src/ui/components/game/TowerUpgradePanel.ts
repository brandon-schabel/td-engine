/**
 * TowerUpgradePanel Component
 * Modern replacement for legacy tower upgrade UI
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from '../GameComponent';
import { Button } from '../Button';
import { styled } from '../../core/styled';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import type { Tower, UpgradeType } from '../../../entities/Tower';
import type { UIState } from '../../core/UIStateManager';

export interface TowerUpgradePanelProps extends GameComponentProps {
  autoPosition?: boolean;
  showTowerStats?: boolean;
  compactMode?: boolean;
}

interface TowerUpgradePanelState extends GameComponentState {
  selectedTower: Tower | null;
  currency: number;
  position: { x: number; y: number };
}

interface UpgradeOption {
  type: UpgradeType;
  name: string;
  icon: IconType;
  description: string;
}

const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    type: 'DAMAGE',
    name: 'Damage',
    icon: IconType.DAMAGE,
    description: 'Increase damage output'
  },
  {
    type: 'RANGE',
    name: 'Range',
    icon: IconType.RANGE,
    description: 'Extend targeting range'
  },
  {
    type: 'FIRE_RATE',
    name: 'Fire Rate',
    icon: IconType.FIRE_RATE,
    description: 'Increase attack speed'
  }
];

export class TowerUpgradePanel extends GameComponent<TowerUpgradePanelProps, TowerUpgradePanelState> {
  private upgradeButtons: Map<UpgradeType, Button> = new Map();
  private closeButton: Button | null = null;
  
  protected override getInitialState(): TowerUpgradePanelState {
    const gameState = this.getGameState();
    return {
      visible: false, // Start hidden
      loading: false,
      error: null,
      selectedTower: gameState.selectedTower,
      currency: gameState.currency,
      position: { x: 0, y: 0 }
    };
  }

  protected override onMount(): void {
    super.onMount();
    
    // Subscribe to UI state changes
    this.subscribeToUIState('selectedTower', this.handleTowerSelected);
    this.subscribeToUIState('currency', this.handleCurrencyChange);
    
    // Hide panel when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
  }

  protected override onUnmount(): void {
    super.onUnmount();
    
    // Cleanup event listeners - UI state subscriptions are automatically cleaned up
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleTowerSelected = (tower: Tower | null) => {
    if (tower) {
      // Position panel near the tower
      const towerPos = tower.getPosition();
      const canvas = this.game.getCanvas();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calculate optimal position
      const position = this.calculateOptimalPosition(
        towerPos.x + canvasRect.left,
        towerPos.y + canvasRect.top
      );
      
      this.setState({
        selectedTower: tower,
        visible: true,
        position
      });
    } else {
      this.hide();
    }
  };

  private handleCurrencyChange = (amount: number) => {
    this.setState({ currency: amount });
  };

  private handleDocumentClick = (event: MouseEvent) => {
    // Hide panel if clicking outside and not on a tower
    if (this.state.visible && this.element && !this.element.contains(event.target as Node)) {
      // Check if clicking on canvas (might be selecting a different tower)
      const canvas = this.game.getCanvas();
      if (!canvas.contains(event.target as Node)) {
        this.hide();
      }
    }
  };

  private calculateOptimalPosition(centerX: number, centerY: number): { x: number; y: number } {
    const panelWidth = 250;
    const panelHeight = 200;
    const margin = 20;
    
    // Try to position to the right of the tower
    let x = centerX + 30;
    let y = centerY - panelHeight / 2;
    
    // Adjust if panel would go off-screen
    if (x + panelWidth > window.innerWidth - margin) {
      x = centerX - panelWidth - 30; // Position to the left
    }
    
    if (y < margin) {
      y = margin;
    } else if (y + panelHeight > window.innerHeight - margin) {
      y = window.innerHeight - panelHeight - margin;
    }
    
    return { x, y };
  }

  private upgradeTower = (upgradeType: UpgradeType) => {
    if (this.state.selectedTower) {
      const success = this.game.upgradeTower(this.state.selectedTower, upgradeType);
      if (success) {
        // Show success feedback
        this.uiManager.showNotification(`Tower ${upgradeType.toLowerCase()} upgraded!`, 'success');
      } else {
        // Show error feedback
        this.uiManager.showNotification('Cannot upgrade tower', 'error');
      }
    }
  };

  private closePanelAndDeselect = () => {
    this.game.setSelectedTower(null);
  };

  protected renderContent(): HTMLElement {
    const Container = this.createContainer('tower-upgrade-panel', {
      position: 'fixed',
      left: `${this.state.position.x}px`,
      top: `${this.state.position.y}px`,
      zIndex: 1100,
      maxWidth: '250px'
    });

    const container = this.createElement(Container);
    
    // Main panel
    const Panel = styled.div`
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.info};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.lg};
      backdrop-filter: blur(10px);
      box-shadow: ${(props: { theme: any }) => props.theme.shadows.xl};
      overflow: hidden;
      animation: slideUp 0.2s ease-out;
    `;
    
    const panel = this.createElement(Panel);
    
    // Header
    const header = this.createHeader();
    panel.appendChild(header);
    
    // Tower stats
    if (this.state.selectedTower) {
      const stats = this.createTowerStats();
      panel.appendChild(stats);
    }
    
    // Upgrade options
    const upgradeSection = this.createUpgradeSection();
    panel.appendChild(upgradeSection);
    
    container.appendChild(panel);
    return container;
  }

  private createHeader(): HTMLElement {
    const Header = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid ${(props: { theme: any }) => props.theme.colors.border};
    `;
    
    const header = this.createElement(Header);
    
    // Title
    const Title = styled.h3`
      margin: 0;
      color: ${(props: { theme: any }) => props.theme.colors.info};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.md};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
    `;
    
    const title = this.createElement(Title, {}, 'Tower Upgrades');
    
    // Close button
    this.closeButton = new Button({
      variant: 'ghost',
      size: 'sm',
      icon: '✕',
      onClick: this.closePanelAndDeselect
    });
    
    header.appendChild(title);
    this.closeButton.mount(header);
    
    return header;
  }

  private createTowerStats(): HTMLElement {
    const tower = this.state.selectedTower!;
    
    const StatsSection = styled.div`
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      background: rgba(40, 40, 40, 0.9);
      border-bottom: 1px solid ${(props: { theme: any }) => props.theme.colors.border};
    `;
    
    const section = this.createElement(StatsSection);
    
    // Stats grid
    const StatsGrid = styled.div`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
    `;
    
    const grid = this.createElement(StatsGrid);
    
    // Create stat items
    const stats = [
      { label: 'Type', value: tower.towerType, icon: '🏗️' },
      { label: 'Level', value: tower.getTotalUpgrades(), icon: '⭐' },
      { label: 'Damage', value: tower.damage, icon: '⚔️' },
      { label: 'Range', value: Math.round(tower.range), icon: '🎯' },
      { label: 'Fire Rate', value: `${tower.fireRate.toFixed(1)}/s`, icon: '⚡' },
      { label: 'Kills', value: tower.getKillCount?.() || 0, icon: '💀' }
    ];
    
    stats.forEach(stat => {
      const StatItem = styled.div`
        display: flex;
        align-items: center;
        gap: ${(props: { theme: any }) => props.theme.spacing.xs};
        color: ${(props: { theme: any }) => props.theme.colors.text};
      `;
      
      const item = this.createElement(StatItem);
      item.innerHTML = `
        <span style="font-size: 12px;">${stat.icon}</span>
        <span style="color: #999; font-size: 11px;">${stat.label}:</span>
        <span style="font-weight: bold;">${stat.value}</span>
      `;
      
      grid.appendChild(item);
    });
    
    section.appendChild(grid);
    return section;
  }

  private createUpgradeSection(): HTMLElement {
    const UpgradeSection = styled.div`
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const section = this.createElement(UpgradeSection);
    
    // Clear existing buttons
    this.upgradeButtons.clear();
    
    // Create upgrade buttons
    UPGRADE_OPTIONS.forEach(upgrade => {
      const button = this.createUpgradeButton(upgrade);
      this.upgradeButtons.set(upgrade.type, button);
      button.mount(section);
    });
    
    return section;
  }

  private createUpgradeButton(upgrade: UpgradeOption): Button {
    const tower = this.state.selectedTower!;
    const cost = this.game.getUpgradeCost(tower, upgrade.type);
    const level = tower.getUpgradeLevel(upgrade.type);
    const canUpgrade = tower.canUpgrade(upgrade.type) && this.game.canAffordUpgrade(tower, upgrade.type);
    
    // Calculate next level stats
    const nextValue = this.getNextUpgradeValue(tower, upgrade.type);
    const currentValue = this.getCurrentUpgradeValue(tower, upgrade.type);
    const increase = nextValue - currentValue;
    
    const button = new Button({
      variant: canUpgrade ? 'success' : 'secondary',
      size: 'sm',
      fullWidth: true,
      disabled: !canUpgrade,
      style: { marginBottom: '8px' },
      onClick: () => this.upgradeTower(upgrade.type)
    });
    
    // Custom button content
    const buttonEl = button.getElement();
    if (buttonEl) {
      const icon = createSvgIcon(upgrade.icon, { size: 16 });
      const content = document.createElement('div');
      content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        font-size: 11px;
      `;
      
      const leftSide = document.createElement('div');
      leftSide.style.cssText = 'display: flex; align-items: center; gap: 6px;';
      leftSide.innerHTML = `${icon}<span><strong>${upgrade.name}</strong> Lv.${level}/5</span>`;
      
      const rightSide = document.createElement('div');
      rightSide.style.cssText = 'text-align: right; font-size: 10px;';
      
      if (cost > 0) {
        rightSide.innerHTML = `<div style="color: #FFD700; font-weight: bold;">${this.formatCurrency(cost)}</div><div style="color: #4CAF50;">+${increase}</div>`;
      } else {
        rightSide.innerHTML = '<div style="color: #666;">MAX</div>';
      }
      
      content.appendChild(leftSide);
      content.appendChild(rightSide);
      
      buttonEl.innerHTML = '';
      buttonEl.appendChild(content);
      
      // Tooltip
      buttonEl.title = upgrade.description;
    }
    
    return button;
  }

  private getCurrentUpgradeValue(tower: Tower, upgradeType: UpgradeType): number {
    switch (upgradeType) {
      case 'DAMAGE':
        return tower.damage;
      case 'RANGE':
        return tower.range;
      case 'FIRE_RATE':
        return tower.fireRate;
      default:
        return 0;
    }
  }

  private getNextUpgradeValue(tower: Tower, upgradeType: UpgradeType): number {
    const level = tower.getUpgradeLevel(upgradeType);
    if (level >= 5) return this.getCurrentUpgradeValue(tower, upgradeType);
    
    switch (upgradeType) {
      case 'DAMAGE':
        return Math.floor(tower.damage * 1.2);
      case 'RANGE':
        return Math.floor(tower.range * 1.15);
      case 'FIRE_RATE':
        return tower.fireRate * 1.25;
      default:
        return 0;
    }
  }

  protected override onStateUpdate(prevState: TowerUpgradePanelState): void {
    super.onStateUpdate(prevState);
    
    // Update upgrade buttons if tower or currency changed
    if (prevState.selectedTower !== this.state.selectedTower || 
        prevState.currency !== this.state.currency) {
      this.updateUpgradeButtons();
    }
  }

  private updateUpgradeButtons(): void {
    if (!this.state.selectedTower) return;
    
    UPGRADE_OPTIONS.forEach(upgrade => {
      const button = this.upgradeButtons.get(upgrade.type);
      if (button) {
        const tower = this.state.selectedTower!;
        const canUpgrade = tower.canUpgrade(upgrade.type) && this.game.canAffordUpgrade(tower, upgrade.type);
        
        button.setProps({
          variant: canUpgrade ? 'success' : 'secondary',
          disabled: !canUpgrade
        });
      }
    });
  }
}