/**
 * ActionPanel Component
 * Modern replacement for legacy game action UI (start wave, player upgrades, etc.)
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from '../GameComponent';
import { Button } from '../Button';
import { styled } from '@/ui/core/styled';

export interface ActionPanelProps extends GameComponentProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  showLabels?: boolean;
  compact?: boolean;
}

interface ActionPanelState extends GameComponentState {
  isWaveComplete: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  currentWave: number;
}

export class ActionPanel extends GameComponent<ActionPanelProps, ActionPanelState> {
  private startWaveButton: Button | null = null;
  private pauseButton: Button | null = null;
  private playerUpgradeButton: Button | null = null;
  private inventoryButton: Button | null = null;
  private settingsButton: Button | null = null;
  
  protected override getInitialState(): ActionPanelState {
    const gameState = this.getGameState();
    return {
      visible: this.props.visible ?? true,
      loading: false,
      error: null,
      isWaveComplete: this.game.isWaveComplete(),
      isGameOver: gameState.isGameOver,
      isPaused: gameState.isPaused,
      currentWave: gameState.wave
    };
  }

  protected override onMount(): void {
    super.onMount();
    
    // Subscribe to game events
    this.game.on('waveStarted', this.handleWaveStarted);
    this.game.on('waveCompleted', this.handleWaveCompleted);
    this.game.on('gamePaused', this.handleGamePaused);
    this.game.on('gameResumed', this.handleGameResumed);
    this.game.on('gameOver', this.handleGameOver);
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  protected override onUnmount(): void {
    super.onUnmount();
    
    // Cleanup event listeners
    this.game.off('waveStarted', this.handleWaveStarted);
    this.game.off('waveCompleted', this.handleWaveCompleted);
    this.game.off('gamePaused', this.handleGamePaused);
    this.game.off('gameResumed', this.handleGameResumed);
    this.game.off('gameOver', this.handleGameOver);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleWaveStarted = (data: { waveNumber: number }) => {
    this.setState({ 
      isWaveComplete: false, 
      currentWave: data.waveNumber 
    });
  };

  private handleWaveCompleted = () => {
    this.setState({ isWaveComplete: true });
  };

  private handleGamePaused = () => {
    this.setState({ isPaused: true });
  };

  private handleGameResumed = () => {
    this.setState({ isPaused: false });
  };

  private handleGameOver = () => {
    this.setState({ isGameOver: true });
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.state.visible) return;
    
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.startNextWave();
        break;
      case ' ':
        event.preventDefault();
        this.togglePause();
        break;
      case 'u':
      case 'U':
        event.preventDefault();
        this.togglePlayerUpgrades();
        break;
      case 'e':
      case 'E':
        event.preventDefault();
        this.toggleInventory();
        break;
    }
  };

  private startNextWave = () => {
    if (this.state.isWaveComplete && !this.state.isGameOver) {
      this.game.startNextWave();
    }
  };

  private togglePause = () => {
    if (this.state.isPaused) {
      this.game.resume();
    } else {
      this.game.pause();
    }
  };

  private togglePlayerUpgrades = () => {
    // Emit event to UIManager to show player upgrades
    this.uiManager.togglePlayerUpgrades();
  };

  private toggleInventory = () => {
    // Emit event to UIManager to show inventory
    this.emit('toggleInventory');
  };

  private showSettings = () => {
    // Emit event to UIManager to show settings
    this.emit('showSettings');
  };

  protected renderContent(): HTMLElement {
    const Container = this.createContainer('action-panel', {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    });

    const container = this.createElement(Container);
    
    // Main panel
    const Panel = styled.div`
      display: flex;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      align-items: center;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: ${(props: { theme: any }) => props.theme.spacing.xs};
      }
    `;
    
    const panel = this.createElement(Panel);
    
    // Create action buttons
    this.createActionButtons(panel);
    
    container.appendChild(panel);
    return container;
  }

  private createActionButtons(container: HTMLElement): void {
    // Start Wave Button
    this.startWaveButton = new Button({
      variant: this.state.isWaveComplete ? 'success' : 'secondary',
      size: this.isMobile ? 'sm' : 'md',
      disabled: !this.state.isWaveComplete || this.state.isGameOver,
      icon: this.state.isWaveComplete ? '▶' : '⏸',
      children: this.state.isWaveComplete ? 'Start Wave' : `Wave ${this.state.currentWave}`,
      onClick: this.startNextWave,
      style: {
        minWidth: this.isMobile ? '80px' : '120px'
      }
    });
    
    // Pause Button
    this.pauseButton = new Button({
      variant: 'warning',
      size: this.isMobile ? 'sm' : 'md',
      icon: this.state.isPaused ? '▶' : '⏸',
      children: this.state.isPaused ? 'Resume' : 'Pause',
      onClick: this.togglePause
    });
    
    // Player Upgrades Button
    this.playerUpgradeButton = new Button({
      variant: 'info',
      size: this.isMobile ? 'sm' : 'md',
      icon: '👤',
      children: this.isMobile ? '' : 'Upgrades',
      onClick: this.togglePlayerUpgrades,
      style: {
        minWidth: this.isMobile ? '40px' : '100px'
      }
    });
    
    // Inventory Button
    this.inventoryButton = new Button({
      variant: 'secondary',
      size: this.isMobile ? 'sm' : 'md',
      icon: '🎒',
      children: this.isMobile ? '' : 'Inventory',
      onClick: this.toggleInventory,
      style: {
        minWidth: this.isMobile ? '40px' : '100px'
      }
    });
    
    // Settings Button
    this.settingsButton = new Button({
      variant: 'ghost',
      size: this.isMobile ? 'sm' : 'md',
      icon: '⚙',
      children: this.isMobile ? '' : 'Settings',
      onClick: this.showSettings,
      style: {
        minWidth: this.isMobile ? '40px' : '80px'
      }
    });
    
    // Mount buttons
    this.startWaveButton.mount(container);
    this.pauseButton.mount(container);
    this.playerUpgradeButton.mount(container);
    this.inventoryButton.mount(container);
    this.settingsButton.mount(container);
  }

  protected override onStateUpdate(prevState: ActionPanelState): void {
    super.onStateUpdate(prevState);
    
    // Update button states
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    // Update start wave button
    if (this.startWaveButton) {
      this.startWaveButton.setProps({
        variant: this.state.isWaveComplete ? 'success' : 'secondary',
        disabled: !this.state.isWaveComplete || this.state.isGameOver,
        icon: this.state.isWaveComplete ? '▶' : '⏸',
        children: this.state.isWaveComplete ? 'Start Wave' : `Wave ${this.state.currentWave}`
      });
    }
    
    // Update pause button
    if (this.pauseButton) {
      this.pauseButton.setProps({
        icon: this.state.isPaused ? '▶' : '⏸',
        children: this.state.isPaused ? 'Resume' : 'Pause'
      });
    }
    
    // Disable all buttons if game is over
    if (this.state.isGameOver) {
      [this.startWaveButton, this.pauseButton, this.playerUpgradeButton, this.inventoryButton].forEach(button => {
        if (button) {
          button.setProps({ disabled: true });
        }
      });
    }
  }
}