/**
 * TowerSelectionPanel Component
 * Panel for selecting and placing towers
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from './GameComponent';
import { Button } from './Button';
import { Card } from './Card';
import { styled } from '../core/styled';
import type { TowerType } from '../../entities/Tower';

interface TowerSelectionState extends GameComponentState {
  selectedType: TowerType | null;
  currency: number;
  isWaveComplete: boolean;
}

interface TowerInfo {
  type: TowerType;
  name: string;
  cost: number;
  shortcut: string;
  description: string;
}

// Tower configuration with costs
const TOWER_COSTS = {
  BASIC: 100,
  SNIPER: 200,
  RAPID: 150,
  WALL: 50
};

export class TowerSelectionPanel extends GameComponent<GameComponentProps, TowerSelectionState> {
  private towerButtons: Map<TowerType, Button> = new Map();
  private cancelButton: Button | null = null;
  private startWaveButton: Button | null = null;
  private playerUpgradeButton: Button | null = null;
  
  private readonly towers: TowerInfo[] = [
    {
      type: 'BASIC' as TowerType,
      name: 'Basic',
      cost: TOWER_COSTS.BASIC,
      shortcut: '1',
      description: 'Balanced damage and fire rate'
    },
    {
      type: 'SNIPER' as TowerType,
      name: 'Sniper',
      cost: TOWER_COSTS.SNIPER,
      shortcut: '2',
      description: 'Long range, high damage'
    },
    {
      type: 'RAPID' as TowerType,
      name: 'Rapid',
      cost: TOWER_COSTS.RAPID,
      shortcut: '3',
      description: 'Fast fire rate, lower damage'
    },
    {
      type: 'WALL' as TowerType,
      name: 'Wall',
      cost: TOWER_COSTS.WALL,
      shortcut: '4',
      description: 'Blocks enemy movement'
    }
  ];
  
  override getInitialState(): TowerSelectionState {
    const gameState = this.getGameState();
    return {
      visible: true,
      loading: false,
      error: null,
      selectedType: gameState.selectedTowerType,
      currency: gameState.currency,
      isWaveComplete: this.game.isWaveComplete()
    };
  }

  onMount(): void {
    super.onMount();
    
    // Set up game event listeners
    this.game.on('currencyChanged', (data) => {
      this.setState({ currency: data.amount });
      this.updateButtonStates();
    });
    
    this.game.on('selectedTowerTypeChanged', (data) => {
      this.setState({ selectedType: data.type });
      this.updateTowerSelection();
    });
    
    this.game.on('waveCompleted', () => {
      this.setState({ isWaveComplete: true });
      this.updateButtonStates();
    });
    
    this.game.on('waveStarted', () => {
      this.setState({ isWaveComplete: false });
      this.updateButtonStates();
    });
  }
  
  protected renderContent(): HTMLElement {
    const Container = this.createContainer('tower-selection-panel', {
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      minWidth: '220px',
      zIndex: 1000
    });

    const container = this.createElement(Container);
    
    // Create main panel using styled components
    const Panel = styled.div`
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.border};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.md};
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      
      @media (max-width: 768px) {
        bottom: ${(props: { theme: any }) => props.theme.spacing.sm};
        left: ${(props: { theme: any }) => props.theme.spacing.sm};
        right: ${(props: { theme: any }) => props.theme.spacing.sm};
        position: fixed;
        width: auto;
        min-width: auto;
      }
    `;
    
    const panel = this.createElement(Panel);
    
    // Panel title
    const Title = styled.h3`
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.md} 0;
      color: ${(props: { theme: any }) => props.theme.colors.primary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
      text-align: center;
    `;
    
    const title = this.createElement(Title, {}, 'Build Towers');
    panel.appendChild(title);
    
    // Tower buttons container
    const TowerButtonsContainer = styled.div`
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const towerButtonsContainer = this.createElement(TowerButtonsContainer);
    
    // Create tower buttons
    this.towers.forEach(tower => {
      const button = this.createTowerButton(tower);
      this.towerButtons.set(tower.type, button);
      towerButtonsContainer.appendChild(button.getElement()!);
    });
    
    panel.appendChild(towerButtonsContainer);
    
    // Cancel button
    this.cancelButton = new Button({
      text: 'Cancel (ESC)',
      variant: 'secondary',
      size: 'small',
      fullWidth: true,
      style: { marginBottom: '12px' },
      onClick: () => this.handleCancel()
    });
    
    this.cancelButton.mount(panel);
    
    // Divider
    const Divider = styled.div`
      height: 1px;
      background: ${(props: { theme: any }) => props.theme.colors.border};
      margin: ${(props: { theme: any }) => props.theme.spacing.md} 0;
    `;
    
    const divider = this.createElement(Divider);
    panel.appendChild(divider);
    
    // Game actions section
    const ActionsTitle = styled.div`
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.sm};
      color: ${(props: { theme: any }) => props.theme.colors.info};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      text-align: center;
    `;
    
    const actionsTitle = this.createElement(ActionsTitle, {}, 'Game Actions');
    panel.appendChild(actionsTitle);
    
    // Action buttons container
    const ActionButtonsContainer = styled.div`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const actionButtonsContainer = this.createElement(ActionButtonsContainer);
    
    // Start wave button
    this.startWaveButton = new Button({
      text: 'Start Wave',
      variant: 'success',
      size: 'small',
      style: { height: '40px' },
      onClick: () => this.handleStartWave()
    });
    
    // Player upgrades button
    this.playerUpgradeButton = new Button({
      text: 'Player Upgrades',
      variant: 'info',
      size: 'small',
      style: { height: '40px' },
      onClick: () => this.handlePlayerUpgrades()
    });
    
    // Mount action buttons
    this.startWaveButton.mount(actionButtonsContainer);
    this.playerUpgradeButton.mount(actionButtonsContainer);
    
    panel.appendChild(actionButtonsContainer);
    container.appendChild(panel);
    
    // Update initial state
    this.updateButtonStates();
    
    return container;
  }

  private createTowerButton(tower: TowerInfo): Button {
    const button = new Button({
      text: `${tower.name}\n${this.formatCurrency(tower.cost)}`,
      variant: 'primary',
      size: 'small',
      className: `tower-button tower-${tower.type.toLowerCase()}`,
      style: {
        minWidth: '65px',
        height: '50px',
        fontSize: '11px',
        lineHeight: '1.2',
        whiteSpace: 'pre-line',
        padding: '6px',
        position: 'relative'
      },
      onClick: () => this.handleTowerSelect(tower.type)
    });

    // Add shortcut indicator
    const ShortcutIndicator = styled.div`
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 9px;
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      background: rgba(0, 0, 0, 0.7);
      padding: 1px 3px;
      border-radius: 2px;
      pointer-events: none;
    `;

    const element = button.getElement();
    if (element) {
      const shortcut = this.createElement(ShortcutIndicator, {}, tower.shortcut);
      element.appendChild(shortcut);
      
      // Add tooltip
      element.title = tower.description;
    }

    return button;
  }
  
  private handleTowerSelect(type: TowerType): void {
    if (this.state.selectedType === type) {
      // Deselect if clicking same tower
      this.game.setSelectedTowerType(null);
    } else {
      // Select new tower
      this.game.setSelectedTowerType(type);
    }
  }
  
  private handleCancel(): void {
    this.game.setSelectedTowerType(null);
  }
  
  private handleStartWave(): void {
    if (this.game.isWaveComplete() && !this.game.isGameOverPublic()) {
      this.game.startNextWave();
    }
  }
  
  private handlePlayerUpgrades(): void {
    // Emit event to UIManager to toggle player upgrades
    this.uiManager.showNotification('Player upgrades panel coming soon!', 'info');
  }
  
  private updateTowerSelection(): void {
    this.towerButtons.forEach((button, type) => {
      const element = button.getElement();
      if (element) {
        if (type === this.state.selectedType) {
          element.classList.add('selected');
          element.style.transform = 'scale(1.05)';
          element.style.boxShadow = '0 0 0 2px #4CAF50';
        } else {
          element.classList.remove('selected');
          element.style.transform = 'scale(1)';
          element.style.boxShadow = '';
        }
      }
    });
  }
  
  private updateButtonStates(): void {
    // Update tower button affordability
    this.towers.forEach(tower => {
      const button = this.towerButtons.get(tower.type);
      if (button) {
        const canAfford = this.state.currency >= tower.cost;
        const element = button.getElement();
        
        if (element) {
          element.style.opacity = canAfford ? '1' : '0.5';
          element.title = canAfford ? 
            `${tower.description} (${tower.shortcut})` : 
            `Need ${this.formatCurrency(tower.cost - this.state.currency)} more`;
          
          // Update disabled state
          if (canAfford) {
            element.removeAttribute('disabled');
            element.style.cursor = 'pointer';
          } else {
            element.setAttribute('disabled', 'true');
            element.style.cursor = 'not-allowed';
          }
        }
      }
    });
    
    // Update start wave button
    if (this.startWaveButton) {
      const element = this.startWaveButton.getElement();
      const canStartWave = this.state.isWaveComplete && !this.game.isGameOverPublic();
      
      if (element) {
        if (canStartWave) {
          element.removeAttribute('disabled');
          element.style.opacity = '1';
          element.style.cursor = 'pointer';
        } else {
          element.setAttribute('disabled', 'true');
          element.style.opacity = '0.5';
          element.style.cursor = 'not-allowed';
        }
      }
    }
  }
  
  /**
   * Called after state updates to refresh display
   */
  onStateUpdate(): void {
    super.onStateUpdate();
    this.updateTowerSelection();
    this.updateButtonStates();
  }
}