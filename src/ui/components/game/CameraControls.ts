/**
 * CameraControls Component
 * UI controls for camera zoom and positioning
 */

import { Component } from '../../core/Component';
import type { ComponentProps, ComponentState } from '../../core/types';
import { StyleSystem } from '../../core/StyleSystem';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';
import type { Game } from '../../../core/Game';

export interface CameraControlsProps extends ComponentProps {
  game: Game;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showLabels?: boolean;
  showZoomLevel?: boolean;
  compact?: boolean;
}

export interface CameraControlsState extends ComponentState {
  currentZoom: number;
  isFollowing: boolean;
  expanded: boolean;
}

/**
 * CameraControls - Zoom and camera control UI component
 */
export class CameraControls extends Component<CameraControlsProps, CameraControlsState> {
  private updateInterval: number | null = null;
  
  protected getDefaultProps(): Partial<CameraControlsProps> {
    return {
      position: 'bottom-right',
      showLabels: false,
      showZoomLevel: true,
      compact: false
    };
  }

  protected getInitialState(): CameraControlsState {
    return {
      currentZoom: 1.0,
      isFollowing: true,
      expanded: false
    };
  }

  protected render(): HTMLElement {
    const { position, showLabels, showZoomLevel, compact } = this.props;
    const { currentZoom, isFollowing, expanded } = this.state;
    const styles = this.getStyles();
    
    const zoomPercentage = Math.round(currentZoom * 100);
    const followIcon = isFollowing ? IconType.CAMERA : IconType.SETTINGS;
    
    const container = document.createElement('div');
    container.className = `${styles.container} ${styles[position!]}`;
    container.setAttribute('data-camera-controls', 'container');
    
    if (compact && !expanded) {
      container.innerHTML = `
        <button class="${styles.expandButton}" data-action="expand" title="Camera Controls">
          ${createSvgIcon(IconType.CAMERA, { size: 20 })}
        </button>
      `;
      return container;
    }
    
    container.innerHTML = `
        ${compact ? `
          <button class="${styles.collapseButton}" data-action="collapse" title="Collapse">
            ${createSvgIcon(IconType.CLOSE, { size: 16 })}
          </button>
        ` : ''}
        
        <div class="${styles.header}">
          <span class="${styles.title}">Camera</span>
          ${showZoomLevel ? `<span class="${styles.zoomLevel}">${zoomPercentage}%</span>` : ''}
        </div>
        
        <div class="${styles.controls}">
          <div class="${styles.zoomControls}">
            <button class="${styles.button}" data-action="zoom-in" title="Zoom In (+)">
              ${createSvgIcon(IconType.ZOOM_IN, { size: 18 })}
              ${showLabels ? '<span>In</span>' : ''}
            </button>
            
            <button class="${styles.button}" data-action="zoom-out" title="Zoom Out (-)">
              ${createSvgIcon(IconType.ZOOM_OUT, { size: 18 })}
              ${showLabels ? '<span>Out</span>' : ''}
            </button>
            
            <button class="${styles.button}" data-action="zoom-reset" title="Reset Zoom (0)">
              ${createSvgIcon(IconType.SETTINGS, { size: 18 })}
              ${showLabels ? '<span>1:1</span>' : ''}
            </button>
            
            <button class="${styles.button}" data-action="zoom-fit" title="Fit to Screen (F)">
              ${createSvgIcon(IconType.ZOOM_FIT, { size: 18 })}
              ${showLabels ? '<span>Fit</span>' : ''}
            </button>
          </div>
          
          <div class="${styles.separator}"></div>
          
          <div class="${styles.cameraControls}">
            <button class="${styles.button} ${isFollowing ? styles.active : ''}" data-action="toggle-follow" title="Toggle Follow Player (C)">
              ${createSvgIcon(followIcon, { size: 18 })}
              ${showLabels ? `<span>${isFollowing ? 'Following' : 'Free'}</span>` : ''}
            </button>
          </div>
    `;
    
    return container;
  }

  private getStyles() {
    const theme = StyleSystem.getInstance().getTheme();
    const { compact } = this.props;
    
    return StyleSystem.getInstance().createStyles({
      container: {
        position: 'fixed',
        background: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: compact ? '4px' : '8px',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        minWidth: compact ? 'auto' : '200px',
        color: theme.colors.text,
        fontSize: '12px',
        userSelect: 'none',
        transition: 'all 0.2s ease'
      },
      
      'top-right': {
        top: '80px',
        right: '12px'
      },
      
      'top-left': {
        top: '80px',
        left: '12px'
      },
      
      'bottom-right': {
        bottom: '80px',
        right: '12px'
      },
      
      'bottom-left': {
        bottom: '80px',
        left: '12px'
      },
      
      expandButton: {
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
        
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }
      },
      
      collapseButton: {
        position: 'absolute',
        top: '4px',
        right: '4px',
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '3px',
        opacity: 0.7,
        transition: 'all 0.2s ease',
        
        '&:hover': {
          opacity: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }
      },
      
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        paddingRight: compact ? '20px' : '0'
      },
      
      title: {
        fontWeight: 'bold',
        color: theme.colors.primary
      },
      
      zoomLevel: {
        fontSize: '11px',
        color: theme.colors.textSecondary,
        fontFamily: 'monospace'
      },
      
      controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      },
      
      zoomControls: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px'
      },
      
      separator: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        margin: '2px 0'
      },
      
      cameraControls: {
        display: 'flex',
        gap: '4px'
      },
      
      button: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        color: 'inherit',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        fontSize: '10px',
        transition: 'all 0.2s ease',
        minHeight: '32px',
        
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.4)'
        },
        
        '&:active': {
          transform: 'scale(0.95)'
        },
        
        '& span': {
          fontSize: '9px',
          whiteSpace: 'nowrap'
        }
      },
      
      active: {
        backgroundColor: theme.colors.primary + '40',
        borderColor: theme.colors.primary + '80',
        color: theme.colors.primary
      }
    });
  }

  protected afterMount(): void {
    this.setupEventListeners();
    this.startUpdates();
  }

  private setupEventListeners(): void {
    if (!this.element) return;
    
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement;
      if (!button) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const action = button.dataset.action;
      this.handleAction(action!);
    });
  }

  private handleAction(action: string): void {
    const { game } = this.mergedProps;
    
    switch (action) {
      case 'zoom-in':
        game.zoomIn();
        break;
        
      case 'zoom-out':
        game.zoomOut();
        break;
        
      case 'zoom-reset':
        game.setZoom(1.0);
        break;
        
      case 'zoom-fit':
        game.zoomToFit();
        break;
        
      case 'toggle-follow':
        const newFollowState = game.toggleCameraFollow();
        this.setState({ isFollowing: newFollowState });
        break;
        
      case 'expand':
        this.setState({ expanded: true });
        break;
        
      case 'collapse':
        this.setState({ expanded: false });
        break;
    }
  }

  private startUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateState();
    }, 100);
  }

  private updateState(): void {
    const { game } = this.mergedProps;
    const camera = game.getCamera();
    
    const currentZoom = camera.getZoom();
    const isFollowing = camera.isFollowingTarget();
    
    if (currentZoom !== this.state.currentZoom || isFollowing !== this.state.isFollowing) {
      this.setState({ 
        currentZoom,
        isFollowing
      });
    }
  }

  protected beforeUnmount(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Public API methods
   */
  
  public setPosition(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): void {
    this.updateProps({ position });
  }
  
  public setCompact(compact: boolean): void {
    this.updateProps({ compact });
    if (!compact) {
      this.setState({ expanded: false });
    }
  }
  
  public toggle(): void {
    if (this.props.compact) {
      this.setState({ expanded: !this.state.expanded });
    }
  }
}