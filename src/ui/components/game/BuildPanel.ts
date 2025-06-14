/**
 * BuildPanel Component
 * Modern replacement for legacy tower selection UI
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from '../GameComponent';
import { Button } from '../Button';
import { styled } from '@/ui/core/styled';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import type { TowerType } from '@/entities/Tower';
import { TOWER_COSTS } from '../../../config/GameConfig';
import type { UIState } from '@/core/UIStateManager';

export interface BuildPanelProps extends GameComponentProps {
  initiallyMinimized?: boolean;
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
  showShortcuts?: boolean;
}

interface BuildPanelState extends GameComponentState {
  selectedType: TowerType | null;
  currency: number;
  isMinimized: boolean;
}

interface TowerOption {
  type: TowerType;
  name: string;
  cost: number;
  shortcut: string;
  description: string;
  icon: IconType;
}

const TOWER_OPTIONS: TowerOption[] = [
  {
    type: 'BASIC',
    name: 'Basic Tower',
    cost: TOWER_COSTS.BASIC,
    shortcut: '1',
    description: 'Balanced damage and fire rate',
    icon: IconType.BASIC_TOWER
  },
  {
    type: 'SNIPER',
    name: 'Sniper Tower',
    cost: TOWER_COSTS.SNIPER,
    shortcut: '2', 
    description: 'Long range, high damage',
    icon: IconType.SNIPER_TOWER
  },
  {
    type: 'RAPID',
    name: 'Rapid Tower',
    cost: TOWER_COSTS.RAPID,
    shortcut: '3',
    description: 'Fast fire rate, lower damage',
    icon: IconType.RAPID_TOWER
  },
  {
    type: 'WALL',
    name: 'Wall',
    cost: TOWER_COSTS.WALL,
    shortcut: '4',
    description: 'Blocks enemy movement',
    icon: IconType.WALL
  }
];

export class BuildPanel extends GameComponent<BuildPanelProps, BuildPanelState> {
  private towerButtons: Map<TowerType, Button> = new Map();
  private cancelButton: Button | null = null;
  
  protected override getInitialState(): BuildPanelState {
    const gameState = this.getGameState();
    return {
      visible: this.props.visible ?? true,
      loading: false,
      error: null,
      selectedType: gameState.selectedTowerType,
      currency: gameState.currency,
      isMinimized: this.props.initiallyMinimized ?? false
    };
  }

  protected override onMount(): void {
    super.onMount();
    
    // Subscribe to UI state changes using the reactive state manager
    this.subscribeToUIState('currency', this.handleCurrencyChange);
    this.subscribeToUIState('selectedTowerType', this.handleTowerTypeChange);
    this.subscribeToUIState('showBuildPanel', this.handleVisibilityChange);
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  protected override onUnmount(): void {
    super.onUnmount();
    
    // Cleanup event listeners - UI state subscriptions are automatically cleaned up
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleCurrencyChange = (amount: number) => {
    this.setState({ currency: amount });
  };

  private handleTowerTypeChange = (type: TowerType | null) => {
    this.setState({ selectedType: type });
  };

  private handleVisibilityChange = (visible: boolean) => {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.state.visible) return;
    
    switch (event.key) {
      case '1':
      case '2':
      case '3':
      case '4':
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        const tower = TOWER_OPTIONS[index];
        if (tower) {
          this.selectTower(tower.type);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.cancelSelection();
        break;
      case 'b':
      case 'B':
        event.preventDefault();
        this.toggle();
        break;
    }
  };

  private selectTower = (type: TowerType) => {
    if (this.state.selectedType === type) {
      // Deselect if already selected
      this.game.setSelectedTowerType(null);
    } else {
      // Select new tower type
      this.game.setSelectedTowerType(type);
    }
  };

  private cancelSelection = () => {
    this.game.setSelectedTowerType(null);
  };

  private toggleMinimize = () => {
    this.setState({ isMinimized: !this.state.isMinimized });
  };

  protected renderContent(): HTMLElement {
    const Container = this.createContainer('build-panel', {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 1000,
      minWidth: '280px'
    });

    const container = this.createElement(Container);
    
    // Main panel with backdrop blur
    const Panel = styled.div`
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.primary};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.lg};
      backdrop-filter: blur(10px);
      box-shadow: ${(props: { theme: any }) => props.theme.shadows.xl};
      overflow: hidden;
      transition: all 0.3s ease;
      
      @media (max-width: 768px) {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: ${(props: { theme: any }) => props.theme.borderRadius.lg} ${(props: { theme: any }) => props.theme.borderRadius.lg} 0 0;
        min-width: auto;
      }
    `;
    
    const panel = this.createElement(Panel);
    
    // Header with title and minimize button
    const header = this.createHeader();
    panel.appendChild(header);
    
    // Content (collapsible)
    if (!this.state.isMinimized) {
      const content = this.createContent();
      panel.appendChild(content);
    }
    
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
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    `;
    
    const header = this.createElement(Header);
    header.addEventListener('click', this.toggleMinimize);
    
    // Title
    const Title = styled.h3`
      margin: 0;
      color: ${(props: { theme: any }) => props.theme.colors.primary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const title = this.createElement(Title);
    const buildIcon = createSvgIcon(IconType.BUILD, { size: 20 });
    title.innerHTML = `${buildIcon} Build Towers`;
    
    // Minimize button
    const minimizeBtn = new Button({
      variant: 'ghost',
      size: 'sm',
      icon: this.state.isMinimized ? '▲' : '▼',
      onClick: (e) => {
        e.originalEvent.stopPropagation();
        this.toggleMinimize();
      }
    });
    
    header.appendChild(title);
    minimizeBtn.mount(header);
    
    return header;
  }

  private createContent(): HTMLElement {
    const Content = styled.div`
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const content = this.createElement(Content);
    
    // Tower grid
    const towerGrid = this.createTowerGrid();
    content.appendChild(towerGrid);
    
    // Cancel button
    this.cancelButton = new Button({
      variant: 'secondary',
      size: 'sm',
      fullWidth: true,
      children: 'Cancel Selection (ESC)',
      icon: '✕',
      style: { marginTop: '12px' },
      onClick: this.cancelSelection
    });
    
    this.cancelButton.mount(content);
    
    return content;
  }

  private createTowerGrid(): HTMLElement {
    const TowerGrid = styled.div`
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.md};
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(4, 1fr);
        gap: ${(props: { theme: any }) => props.theme.spacing.xs};
      }
    `;
    
    const grid = this.createElement(TowerGrid);
    
    // Clear existing buttons
    this.towerButtons.clear();
    
    // Create tower buttons
    TOWER_OPTIONS.forEach(tower => {
      const button = this.createTowerButton(tower);
      this.towerButtons.set(tower.type, button);
      button.mount(grid);
    });
    
    return grid;
  }

  private createTowerButton(tower: TowerOption): Button {
    const canAfford = this.state.currency >= tower.cost;
    const isSelected = this.state.selectedType === tower.type;
    
    const button = new Button({
      variant: isSelected ? 'success' : (canAfford ? 'primary' : 'secondary'),
      size: this.isMobile ? 'sm' : 'md',
      disabled: !canAfford,
      className: `tower-button ${isSelected ? 'selected' : ''}`,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 8px',
        minHeight: this.isMobile ? '60px' : '80px',
        position: 'relative',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isSelected ? '0 0 0 2px #4CAF50' : undefined
      },
      onClick: () => this.selectTower(tower.type)
    });
    
    // Custom button content with icon and text
    const buttonEl = button.getElement();
    if (buttonEl) {
      const icon = createSvgIcon(tower.icon, { size: this.isMobile ? 20 : 24 });
      const name = document.createElement('div');
      name.style.cssText = `
        font-weight: bold;
        font-size: ${this.isMobile ? '10px' : '12px'};
        text-align: center;
        line-height: 1.2;
      `;
      name.textContent = tower.name;
      
      const cost = document.createElement('div');
      cost.style.cssText = `
        color: #FFD700;
        font-size: ${this.isMobile ? '9px' : '11px'};
        font-weight: 600;
      `;
      cost.textContent = this.formatCurrency(tower.cost);
      
      // Shortcut indicator
      const shortcut = document.createElement('div');
      shortcut.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.8);
        color: #FFD700;
        font-size: 9px;
        padding: 2px 4px;
        border-radius: 3px;
        line-height: 1;
      `;
      shortcut.textContent = tower.shortcut;
      
      buttonEl.innerHTML = '';
      buttonEl.appendChild(shortcut);
      buttonEl.appendChild(icon);
      buttonEl.appendChild(name);
      buttonEl.appendChild(cost);
      
      // Tooltip
      buttonEl.title = `${tower.description} (${tower.shortcut})`;
    }
    
    return button;
  }

  protected override onStateUpdate(prevState: BuildPanelState): void {
    super.onStateUpdate(prevState);
    
    // Update tower buttons if currency or selection changed
    if (prevState.currency !== this.state.currency || 
        prevState.selectedType !== this.state.selectedType) {
      this.updateTowerButtons();
    }
  }

  private updateTowerButtons(): void {
    TOWER_OPTIONS.forEach(tower => {
      const button = this.towerButtons.get(tower.type);
      if (button) {
        const canAfford = this.state.currency >= tower.cost;
        const isSelected = this.state.selectedType === tower.type;
        
        // Update button props
        button.setProps({
          variant: isSelected ? 'success' : (canAfford ? 'primary' : 'secondary'),
          disabled: !canAfford
        });
        
        // Update visual state
        const buttonEl = button.getElement();
        if (buttonEl) {
          buttonEl.style.transform = isSelected ? 'scale(1.05)' : 'scale(1)';
          buttonEl.style.boxShadow = isSelected ? '0 0 0 2px #4CAF50' : '';
          
          if (isSelected) {
            buttonEl.classList.add('selected');
          } else {
            buttonEl.classList.remove('selected');
          }
        }
      }
    });
  }
}