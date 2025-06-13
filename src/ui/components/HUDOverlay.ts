/**
 * HUDOverlay Component
 * Displays game resources and stats as a DOM overlay
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from './GameComponent';
import { styled } from '../core/styled';

interface HUDItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

interface HUDOverlayState extends GameComponentState {
  currency: number;
  lives: number;
  score: number;
  wave: number;
  isPaused: boolean;
  isGameOver: boolean;
}

export class HUDOverlay extends GameComponent<GameComponentProps, HUDOverlayState> {
  private elements: Map<string, HTMLElement> = new Map();
  
  protected override getInitialState(): HUDOverlayState {
    const gameState = this.getGameState();
    return {
      visible: this.props.visible ?? true,
      loading: false,
      error: null,
      currency: gameState.currency,
      lives: gameState.lives,
      score: gameState.score,
      wave: gameState.wave,
      isPaused: gameState.isPaused,
      isGameOver: gameState.isGameOver,
    };
  }

  protected override onMount() {
    super.onMount();
    
    // Set up game event listeners
    this.game.on('currencyChanged', (data) => {
      this.setState({ currency: data.amount } as Partial<HUDOverlayState>);
      this.animateHUDValue('currency');
    });
    
    this.game.on('livesChanged', (data) => {
      const wasLower = data.amount < data.previous;
      this.setState({ lives: data.amount } as Partial<HUDOverlayState>);
      this.animateHUDValue('lives', wasLower);
    });
    
    this.game.on('scoreChanged', (data) => {
      this.setState({ score: data.amount } as Partial<HUDOverlayState>);
      this.animateHUDValue('score');
    });
    
    this.game.on('waveStarted', (data) => {
      this.setState({ wave: data.waveNumber } as Partial<HUDOverlayState>);
      this.animateHUDValue('wave');
    });
    
    this.game.on('gamePaused', () => {
      this.setState({ isPaused: true } as Partial<HUDOverlayState>);
    });
    
    this.game.on('gameResumed', () => {
      this.setState({ isPaused: false } as Partial<HUDOverlayState>);
    });
    
    this.game.on('gameOver', () => {
      this.setState({ isGameOver: true } as Partial<HUDOverlayState>);
    });
  }
  
  protected renderContent(): HTMLElement {
    const Container = this.createContainer('hud-overlay', {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100
    });

    const container = this.createElement(Container);
    
    // Create HUD container using styled components
    const HUDContainer = styled.div`
      position: absolute;
      top: ${(props: { theme: any }) => props.theme.spacing.md};
      left: ${(props: { theme: any }) => props.theme.spacing.md};
      display: flex;
      flex-direction: column;
      gap: ${(props: { theme: any }) => props.theme.spacing.xs};
      pointer-events: none;
      z-index: 100;
      
      @media (max-width: 768px) {
        top: ${(props: { theme: any }) => props.theme.spacing.sm};
        left: ${(props: { theme: any }) => props.theme.spacing.sm};
        gap: ${(props: { theme: any }) => props.theme.spacing.xxs};
      }
    `;
    
    const hudContainer = this.createElement(HUDContainer);
    
    // Create HUD items
    const items: HUDItem[] = [
      { label: 'Currency', value: this.formatCurrency(this.state.currency), icon: '💰', color: 'warning' },
      { label: 'Lives', value: this.state.lives, icon: '❤️', color: 'error' },
      { label: 'Score', value: this.formatNumber(this.state.score), icon: '⭐', color: 'success' },
      { label: 'Wave', value: this.state.wave, icon: '🌊', color: 'info' }
    ];
    
    items.forEach(item => {
      const element = this.createHUDItem(item);
      this.elements.set(item.label.toLowerCase(), element);
      hudContainer.appendChild(element);
    });
    
    container.appendChild(hudContainer);
    
    // Create overlays container
    const OverlaysContainer = styled.div`
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      z-index: 500;
    `;
    
    const overlaysContainer = this.createElement(OverlaysContainer);
    
    // Pause overlay
    const pauseOverlay = this.createStateOverlay('PAUSED', 'warning', 'Press SPACE to resume');
    pauseOverlay.style.display = this.state.isPaused ? 'flex' : 'none';
    this.elements.set('pause-overlay', pauseOverlay);
    
    // Game over overlay
    const gameOverOverlay = this.createStateOverlay('GAME OVER', 'error');
    gameOverOverlay.style.display = this.state.isGameOver ? 'flex' : 'none';
    this.elements.set('gameover-overlay', gameOverOverlay);
    
    overlaysContainer.appendChild(pauseOverlay);
    overlaysContainer.appendChild(gameOverOverlay);
    
    container.appendChild(overlaysContainer);
    
    return container;
  }
  
  private createHUDItem(item: HUDItem): HTMLElement {
    const HUDItemContainer = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.xs};
      background: rgba(0, 0, 0, 0.8);
      padding: ${(props: { theme: any }) => props.theme.spacing.xs} ${(props: { theme: any }) => props.theme.spacing.sm};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      min-width: 120px;
      
      @media (max-width: 768px) {
        min-width: 100px;
        padding: ${(props: { theme: any }) => props.theme.spacing.xxs} ${(props: { theme: any }) => props.theme.spacing.xs};
      }
    `;
    
    const element = this.createElement(HUDItemContainer, { className: 'hud-item' });
    
    // Icon
    if (item.icon) {
      const HUDIcon = styled.span`
        font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.md};
        filter: drop-shadow(0 0 2px ${(props: { theme: any }) => props.theme.colors[item.color as keyof typeof props.theme.colors]});
        
        @media (max-width: 768px) {
          font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
        }
      `;
      
      const icon = this.createElement(HUDIcon, { className: 'hud-icon' }, item.icon);
      element.appendChild(icon);
    }
    
    // Label and value container
    const TextContainer = styled.div`
      display: flex;
      flex-direction: column;
      flex: 1;
    `;
    
    const textContainer = this.createElement(TextContainer);
    
    // Label
    const HUDLabel = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      @media (max-width: 768px) {
        font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xxs};
      }
    `;
    
    const label = this.createElement(HUDLabel, { className: 'hud-label' }, item.label);
    
    // Value
    const HUDValue = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
      color: ${(props: { theme: any }) => props.theme.colors[item.color as keyof typeof props.theme.colors] || props.theme.colors.text};
      text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
      transition: transform 0.2s ease-out, text-shadow 0.2s ease-out;
      
      @media (max-width: 768px) {
        font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.md};
      }
    `;
    
    const value = this.createElement(HUDValue, { className: 'hud-value' }, String(item.value));
    
    textContainer.appendChild(label);
    textContainer.appendChild(value);
    element.appendChild(textContainer);
    
    return element;
  }
  
  private createStateOverlay(title: string, colorKey: string, subtitle?: string): HTMLElement {
    const StateOverlay = styled.div`
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
      
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 0.9; }
      }
    `;
    
    const overlay = this.createElement(StateOverlay, { className: 'state-overlay' });
    
    const StateTitle = styled.h1`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xxxl};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
      color: ${(props: { theme: any }) => props.theme.colors[colorKey as keyof typeof props.theme.colors]};
      text-shadow: 0 0 20px ${(props: { theme: any }) => props.theme.colors[colorKey as keyof typeof props.theme.colors]}, 
                   0 0 40px ${(props: { theme: any }) => props.theme.colors[colorKey as keyof typeof props.theme.colors]};
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.md} 0;
      animation: pulse 2s ease-in-out infinite;
      text-align: center;
      
      @media (max-width: 768px) {
        font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xl};
      }
    `;
    
    const titleElement = this.createElement(StateTitle, {}, title);
    overlay.appendChild(titleElement);
    
    if (subtitle) {
      const StateSubtitle = styled.p`
        font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
        color: ${(props: { theme: any }) => props.theme.colors.text};
        margin: 0;
        opacity: 0.8;
        text-align: center;
        
        @media (max-width: 768px) {
          font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.md};
        }
      `;
      
      const subtitleElement = this.createElement(StateSubtitle, {}, subtitle);
      overlay.appendChild(subtitleElement);
    }
    
    return overlay;
  }
  
  /**
   * Animate HUD value changes with visual feedback
   */
  private animateHUDValue(itemKey: string, negative: boolean = false): void {
    const element = this.elements.get(itemKey)?.querySelector('.hud-value') as HTMLElement;
    if (!element) return;
    
    // Update the display value
    this.updateHUDValue(itemKey);
    
    // Animate the change
    const color = negative ? '#ff4444' : '#44ff44';
    element.style.transform = 'scale(1.2)';
    element.style.textShadow = `0 0 10px ${color}`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.textShadow = '0 0 4px rgba(0, 0, 0, 0.5)';
    }, 200);
  }
  
  /**
   * Update individual HUD value displays
   */
  private updateHUDValue(itemKey: string): void {
    const element = this.elements.get(itemKey)?.querySelector('.hud-value');
    if (!element) return;
    
    switch (itemKey) {
      case 'currency':
        element.textContent = this.formatCurrency(this.state.currency);
        break;
      case 'lives':
        element.textContent = String(this.state.lives);
        break;
      case 'score':
        element.textContent = this.formatNumber(this.state.score);
        break;
      case 'wave':
        element.textContent = String(this.state.wave);
        break;
    }
  }
  
  /**
   * Update overlay visibility
   */
  private updateOverlays(): void {
    const pauseOverlay = this.elements.get('pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.style.display = this.state.isPaused ? 'flex' : 'none';
    }
    
    const gameOverOverlay = this.elements.get('gameover-overlay');
    if (gameOverOverlay) {
      gameOverOverlay.style.display = this.state.isGameOver ? 'flex' : 'none';
    }
  }
  
  /**
   * Called after state updates to refresh display
   */
  protected override onStateUpdate(prevState: HUDOverlayState): void {
    super.onStateUpdate(prevState);
    this.updateOverlays();
  }
}