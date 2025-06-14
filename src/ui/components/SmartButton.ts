/**
 * SmartButton - Button component that integrates with ButtonStateManager
 * Provides automatic state management, cooldown indicators, and game integration
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from './GameComponent';
import type { ButtonStateManager, ButtonState, ButtonConfig } from '../core/ButtonStateManager';
import { styled } from '../core/styled';

export interface SmartButtonProps extends GameComponentProps {
  buttonConfig: ButtonConfig;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  showIcon?: boolean;
  showText?: boolean;
  showShortcut?: boolean;
  showCooldown?: boolean;
  showTooltip?: boolean;
  className?: string;
  style?: Record<string, any>;
}

export interface SmartButtonState extends GameComponentState {
  buttonState: ButtonState | null;
  isHovered: boolean;
  isPressed: boolean;
  tooltipVisible: boolean;
}

export class SmartButton extends GameComponent<SmartButtonProps, SmartButtonState> {
  private buttonStateManager: ButtonStateManager;
  private cooldownAnimation: Animation | null = null;
  private unsubscribeFromButtonManager: (() => void) | null = null;

  constructor(props: SmartButtonProps) {
    super(props);
    this.buttonStateManager = this.uiManager.getButtonStateManager();
    
    // Register button with state manager
    this.buttonStateManager.registerButton(props.buttonConfig);
  }

  protected getInitialState(): SmartButtonState {
    return {
      ...super.getInitialState(),
      buttonState: null,
      isHovered: false,
      isPressed: false,
      tooltipVisible: false
    };
  }

  protected onMount(): void {
    super.onMount();
    
    // Subscribe to button state changes
    this.unsubscribeFromButtonManager = this.buttonStateManager.on('buttonStateChanged', (data) => {
      if (data.buttonId === this.props.buttonConfig.id) {
        this.setState({ buttonState: data.state });
      }
    });

    // Initial state fetch
    const initialState = this.buttonStateManager.getButtonState(this.props.buttonConfig.id);
    if (initialState) {
      this.setState({ buttonState: initialState });
    }
  }

  protected renderContent(): HTMLElement {
    const button = this.createButton();
    const tooltip = this.createTooltip();
    
    const container = document.createElement('div');
    container.className = 'smart-button-container';
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    
    container.appendChild(button);
    
    if (this.props.showTooltip && tooltip) {
      container.appendChild(tooltip);
    }
    
    return container;
  }

  private createButton(): HTMLElement {
    const ButtonElement = styled.button`
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;
      
      &:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      /* Size variants */
      &.small {
        padding: 6px 12px;
        font-size: 12px;
        min-height: 28px;
      }
      
      &.medium {
        padding: 8px 16px;
        font-size: 14px;
        min-height: 36px;
      }
      
      &.large {
        padding: 12px 20px;
        font-size: 16px;
        min-height: 44px;
      }
      
      /* Color variants */
      &.primary {
        background: #3b82f6;
        color: white;
        
        &:hover:not(:disabled) {
          background: #2563eb;
        }
        
        &:active {
          background: #1d4ed8;
        }
      }
      
      &.secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        
        &:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #9ca3af;
        }
        
        &:active {
          background: #d1d5db;
        }
      }
      
      &.danger {
        background: #ef4444;
        color: white;
        
        &:hover:not(:disabled) {
          background: #dc2626;
        }
        
        &:active {
          background: #b91c1c;
        }
      }
      
      &.success {
        background: #10b981;
        color: white;
        
        &:hover:not(:disabled) {
          background: #059669;
        }
        
        &:active {
          background: #047857;
        }
      }
      
      &.outline {
        background: transparent;
        color: #3b82f6;
        border: 1px solid #3b82f6;
        
        &:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }
        
        &:active {
          background: #2563eb;
        }
      }
      
      /* Loading state */
      &.loading {
        pointer-events: none;
        
        .button-content {
          opacity: 0.5;
        }
      }
      
      /* Cooldown overlay */
      .cooldown-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        pointer-events: none;
      }
      
      /* Progress indicator for cooldowns */
      .cooldown-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: #10b981;
        transition: width 0.1s ease;
      }
      
      /* Loading spinner */
      .loading-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      /* Icon styling */
      .button-icon {
        font-size: 1.2em;
        line-height: 1;
      }
      
      /* Shortcut key styling */
      .button-shortcut {
        font-size: 0.8em;
        opacity: 0.7;
        margin-left: auto;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 4px;
        border-radius: 3px;
        min-width: 20px;
        text-align: center;
      }
    `;

    const button = ButtonElement.create();
    
    // Apply size and variant classes
    button.classList.add(this.props.size || 'medium');
    button.classList.add(this.props.variant || 'primary');
    
    if (this.props.className) {
      button.classList.add(this.props.className);
    }
    
    // Apply custom styles
    if (this.props.style) {
      Object.assign(button.style, this.props.style);
    }

    // Set button properties
    button.disabled = !this.state.buttonState?.enabled;
    
    if (this.state.buttonState?.loading) {
      button.classList.add('loading');
    }

    // Add button content
    button.appendChild(this.createButtonContent());
    
    // Add cooldown overlay if needed
    if (this.state.buttonState?.cooldownRemaining && this.state.buttonState.cooldownRemaining > 0) {
      button.appendChild(this.createCooldownOverlay());
      button.appendChild(this.createCooldownProgress());
    }
    
    // Add loading spinner if needed
    if (this.state.buttonState?.loading) {
      button.appendChild(this.createLoadingSpinner());
    }

    // Event handlers
    button.addEventListener('click', this.handleClick.bind(this));
    button.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    button.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    button.addEventListener('mousedown', this.handleMouseDown.bind(this));
    button.addEventListener('mouseup', this.handleMouseUp.bind(this));

    return button;
  }

  private createButtonContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'button-content';
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '6px';
    content.style.width = '100%';

    // Add icon
    if (this.props.showIcon && this.state.buttonState?.icon) {
      const icon = document.createElement('span');
      icon.className = 'button-icon';
      icon.textContent = this.state.buttonState.icon;
      content.appendChild(icon);
    }

    // Add text
    if (this.props.showText && this.state.buttonState?.text) {
      const text = document.createElement('span');
      text.className = 'button-text';
      text.textContent = this.state.buttonState.text;
      content.appendChild(text);
    }

    // Add shortcut
    if (this.props.showShortcut && this.state.buttonState?.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'button-shortcut';
      shortcut.textContent = this.state.buttonState.shortcut;
      content.appendChild(shortcut);
    }

    return content;
  }

  private createCooldownOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'cooldown-overlay';
    
    if (this.state.buttonState && this.state.buttonState.cooldownRemaining > 0) {
      const seconds = Math.ceil(this.state.buttonState.cooldownRemaining / 1000);
      overlay.textContent = seconds.toString();
    }
    
    return overlay;
  }

  private createCooldownProgress(): HTMLElement {
    const progress = document.createElement('div');
    progress.className = 'cooldown-progress';
    
    if (this.state.buttonState && this.state.buttonState.cooldownTotal > 0) {
      const percentage = ((this.state.buttonState.cooldownTotal - this.state.buttonState.cooldownRemaining) / this.state.buttonState.cooldownTotal) * 100;
      progress.style.width = `${percentage}%`;
    }
    
    return progress;
  }

  private createLoadingSpinner(): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    return spinner;
  }

  private createTooltip(): HTMLElement | null {
    if (!this.props.showTooltip) return null;

    const Tooltip = styled.div`
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 8px;
      padding: 8px 12px;
      background: #1f2937;
      color: white;
      font-size: 12px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      z-index: 1000;
      
      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #1f2937;
      }
      
      &.visible {
        opacity: 1;
        visibility: visible;
      }
    `;

    const tooltip = Tooltip.create();
    
    // Build tooltip content
    let tooltipText = this.state.buttonState?.text || this.props.buttonConfig.id;
    
    if (this.state.buttonState?.errorMessage) {
      tooltipText += ` - ${this.state.buttonState.errorMessage}`;
    } else if (this.state.buttonState?.successMessage) {
      tooltipText += ` - ${this.state.buttonState.successMessage}`;
    }
    
    if (this.state.buttonState?.shortcut) {
      tooltipText += ` (${this.state.buttonState.shortcut})`;
    }
    
    tooltip.textContent = tooltipText;
    
    if (this.state.isHovered && this.state.tooltipVisible) {
      tooltip.classList.add('visible');
    }

    return tooltip;
  }

  private async handleClick(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.state.buttonState?.enabled || this.state.buttonState?.loading) {
      return;
    }

    // Trigger haptic feedback on mobile
    if (this.isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Activate button through state manager
    const success = await this.buttonStateManager.activateButton(this.props.buttonConfig.id);
    
    if (success) {
      // Visual feedback for successful activation
      this.setState({ isPressed: true });
      setTimeout(() => {
        this.setState({ isPressed: false });
      }, 150);
    }
  }

  private handleMouseEnter(): void {
    this.setState({ 
      isHovered: true,
      tooltipVisible: true 
    });
  }

  private handleMouseLeave(): void {
    this.setState({ 
      isHovered: false,
      tooltipVisible: false 
    });
  }

  private handleMouseDown(): void {
    this.setState({ isPressed: true });
  }

  private handleMouseUp(): void {
    this.setState({ isPressed: false });
  }

  /**
   * Public API
   */
  
  getButtonState(): ButtonState | null {
    return this.state.buttonState;
  }

  isEnabled(): boolean {
    return this.state.buttonState?.enabled || false;
  }

  isOnCooldown(): boolean {
    return (this.state.buttonState?.cooldownRemaining || 0) > 0;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.unsubscribeFromButtonManager) {
      this.unsubscribeFromButtonManager();
    }
    
    if (this.cooldownAnimation) {
      this.cooldownAnimation.cancel();
    }
    
    super.destroy();
  }
}