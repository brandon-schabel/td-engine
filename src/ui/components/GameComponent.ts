/**
 * GameComponent - Base class for all game-specific UI components  
 * Provides common functionality and game integration
 */

import { Component } from '../core/Component';
import type { ComponentProps, ComponentState } from '../core/types';
import type { GameWithEvents } from '@/core/GameWithEvents';
import type { GameUIManager } from '../GameUIManager';
import type { UIStateManager } from '../core/UIStateManager';
import { styled, extendStyled } from '../core/styled';

export interface GameComponentProps extends ComponentProps {
  game: GameWithEvents;
  uiManager: GameUIManager;
  isMobile?: boolean;
  visible?: boolean;
}

export interface GameComponentState extends ComponentState {
  visible: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Base class for all game UI components
 * Provides game integration, common styling, and lifecycle management
 */
export abstract class GameComponent<
  P extends GameComponentProps = GameComponentProps,
  S extends GameComponentState = GameComponentState
> extends Component<P, S> {
  protected game: GameWithEvents;
  protected uiManager: GameUIManager;
  protected uiState: UIStateManager;
  protected isMobile: boolean;

  constructor(props: P) {
    super(props);
    
    this.game = props.game;
    this.uiManager = props.uiManager;
    this.uiState = props.uiManager.getUIState();
    this.isMobile = props.isMobile || false;
  }

  /**
   * Override to provide component-specific initial state
   */
  protected override getInitialState(): S {
    return {
      visible: this.props.visible ?? true,
      loading: false,
      error: null
    } as S;
  }

  /**
   * Get current game state information
   */
  protected getGameState() {
    return {
      currency: this.game.getCurrency(),
      lives: this.game.getLives(),
      score: this.game.getScore(),
      wave: this.game.getCurrentWave(),
      isPaused: this.game.isPaused(),
      isGameOver: this.game.isGameOverPublic(),
      selectedTower: this.game.getSelectedTower(),
      selectedTowerType: this.game.getSelectedTowerType(),
      towers: this.game.getTowers(),
      enemies: this.game.getEnemies()
    };
  }

  /**
   * Show loading state
   */
  protected setLoading(loading: boolean, message?: string) {
    this.setState({ 
      loading,
      error: loading ? null : this.state.error 
    } as Partial<S>);
  }

  /**
   * Show error state
   */
  protected setError(error: string | null) {
    this.setState({ 
      error,
      loading: false 
    } as Partial<S>);
  }

  /**
   * Show/hide component
   */
  show() {
    this.setState({ visible: true } as Partial<S>);
  }

  hide() {
    this.setState({ visible: false } as Partial<S>);
  }

  toggle() {
    this.setState({ visible: !this.state.visible } as Partial<S>);
  }

  /**
   * Check if component should be visible
   */
  isVisible(): boolean {
    return this.state.visible;
  }

  /**
   * Format currency display
   */
  protected formatCurrency(amount: number): string {
    return `$${amount.toLocaleString()}`;
  }

  /**
   * Format large numbers
   */
  protected formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Helper to check if player can afford something
   */
  protected canAfford(cost: number): boolean {
    return this.game.getCurrency() >= cost;
  }

  /**
   * Get responsive class names
   */
  protected getResponsiveClasses(): string {
    const classes = ['game-component'];
    
    if (this.isMobile) {
      classes.push('mobile');
    } else {
      classes.push('desktop');
    }
    
    if (!this.state.visible) {
      classes.push('hidden');
    }
    
    if (this.state.loading) {
      classes.push('loading');
    }
    
    if (this.state.error) {
      classes.push('error');
    }
    
    return classes.join(' ');
  }

  /**
   * Create base container with common styling
   */
  protected createContainer(className: string = '', additionalStyles: Record<string, any> = {}) {
    const Container = styled.div`
      position: relative;
      transition: opacity 0.3s ease, transform 0.3s ease;
      
      &.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(-10px);
      }
      
      &.loading {
        opacity: 0.7;
        pointer-events: none;
      }
      
      &.error {
        border: 1px solid ${(props: { theme: any }) => props.theme.colors.error};
        background-color: ${(props: { theme: any }) => props.theme.colors.error}10;
      }
      
      /* Mobile optimizations */
      &.mobile {
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      /* Desktop optimizations */
      &.desktop {
        user-select: text;
      }
    `;

    return extendStyled(Container)`
      ${additionalStyles}
    `;
  }

  /**
   * Create loading indicator
   */
  protected renderLoadingIndicator() {
    if (!this.state.loading) return null;

    const LoadingSpinner = styled.div`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      
      &::after {
        content: '';
        display: block;
        width: 20px;
        height: 20px;
        border: 2px solid ${(props: { theme: any }) => props.theme.colors.primary};
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    return this.createElement(LoadingSpinner, {});
  }

  /**
   * Create error display
   */
  protected renderError() {
    if (!this.state.error) return null;

    const ErrorContainer = styled.div`
      padding: 12px;
      background-color: ${(props: { theme: any }) => props.theme.colors.error}20;
      border: 1px solid ${(props: { theme: any }) => props.theme.colors.error};
      border-radius: 6px;
      color: ${(props: { theme: any }) => props.theme.colors.error};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      text-align: center;
      margin-bottom: 8px;
    `;

    return this.createElement(ErrorContainer, {}, this.state.error!);
  }

  /**
   * Create element from styled component
   */
  protected createElement(StyledComp: any, props?: any, textContent?: string): HTMLElement {
    const element = StyledComp.create ? StyledComp.create(props) : StyledComp;
    if (textContent !== undefined) {
      element.textContent = textContent;
    }
    return element;
  }

  /**
   * Abstract method to render component content
   */
  protected abstract renderContent(): HTMLElement;

  /**
   * Base render method that wraps content in container
   */
  protected render(): HTMLElement {
    const container = this.createContainer();
    const content = this.renderContent();
    const element = this.createElement(container, { className: this.getResponsiveClasses() });
    
    // Add loading and error indicators
    const loadingIndicator = this.renderLoadingIndicator();
    const errorDisplay = this.renderError();
    
    if (errorDisplay) {
      element.appendChild(errorDisplay);
    }
    
    element.appendChild(content);
    
    if (loadingIndicator) {
      element.appendChild(loadingIndicator);
    }
    
    return element;
  }

  /**
   * Subscribe to UI state changes
   */
  protected subscribeToUIState<K extends keyof any>(
    key: K, 
    callback: (value: any) => void
  ): () => void {
    return this.uiState.subscribe(key, callback);
  }

  /**
   * Subscribe to multiple UI state keys
   */
  protected subscribeToMultipleUIState<K extends keyof any>(
    keys: K[], 
    callback: (state: any) => void
  ): () => void {
    return this.uiState.subscribeMultiple(keys, callback);
  }

  /**
   * Enhanced cleanup for game components
   */
  destroy() {
    // Remove any game event listeners if set up by subclasses
    super.destroy();
  }
}