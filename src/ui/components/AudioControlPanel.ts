/**
 * AudioControlPanel Component
 * Compact audio controls with expandable settings
 */

import { GameComponent, type GameComponentProps } from './GameComponent';
import { Button } from './Button';
import { Card } from './Card';
import { styleSystem } from '../core/StyleSystem';
import type { AudioManager } from '@/audio/AudioManager';

interface AudioControlProps extends GameComponentProps {
  audioManager: AudioManager;
  gameAudioManager: AudioManager;
}

interface AudioControlState {
  expanded: boolean;
  volume: number;
  muted: boolean;
}

export class AudioControlPanel extends GameComponent<AudioControlProps, AudioControlState> {
  private audioButton: Button | null = null;
  private volumeSlider: HTMLInputElement | null = null;
  private muteButton: Button | null = null;
  private closeButton: Button | null = null;
  private settingsPanel: HTMLElement | null = null;
  
  protected getInitialState(): AudioControlState {
    return {
      expanded: false,
      volume: 30,
      muted: false
    };
  }
  
  protected render(): HTMLElement {
    const theme = styleSystem.getTheme();
    const container = document.createElement('div');
    container.className = 'audio-control-panel';
    
    // Main audio button (always visible)
    this.audioButton = new Button({
      text: this.state.muted ? '🔇' : '🔊',
      variant: 'primary',
      className: 'audio-button',
      style: {
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        fontSize: '16px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: `2px solid ${theme.colors.warning}`,
        color: theme.colors.warning,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        zIndex: 1001
      },
      onClick: () => this.togglePanel()
    });
    
    this.audioButton.mount(container);
    
    // Settings panel (hidden by default)
    this.settingsPanel = this.createSettingsPanel();
    container.appendChild(this.settingsPanel);
    
    // Click outside to close
    this.setupClickOutside();
    
    return container;
  }
  
  private createSettingsPanel(): HTMLElement {
    const theme = styleSystem.getTheme();
    
    const panel = document.createElement('div');
    panel.className = 'audio-settings-panel';
    panel.style.cssText = `
      position: absolute;
      top: 60px;
      left: ${theme.spacing.md};
      display: ${this.state.expanded ? 'block' : 'none'};
      z-index: 1000;
    `;
    
    // Create card
    const card = new Card({
      title: 'Audio Settings',
      className: 'audio-settings-card',
      style: {
        minWidth: '180px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: `2px solid ${theme.colors.warning}`,
      }
    });
    
    const cardContent = card.getElement()?.querySelector('.card-content');
    if (cardContent) {
      // Volume control
      const volumeContainer = document.createElement('div');
      volumeContainer.style.cssText = `
        margin-bottom: ${theme.spacing.md};
      `;
      
      const volumeLabel = document.createElement('label');
      volumeLabel.textContent = `Volume: ${this.state.volume}%`;
      volumeLabel.style.cssText = `
        display: block;
        margin-bottom: ${theme.spacing.xs};
        font-size: ${theme.typography.fontSize.sm};
        color: ${theme.colors.text};
      `;
      volumeLabel.id = 'volume-label';
      
      this.volumeSlider = document.createElement('input');
      this.volumeSlider.type = 'range';
      this.volumeSlider.min = '0';
      this.volumeSlider.max = '100';
      this.volumeSlider.value = String(this.state.volume);
      this.volumeSlider.style.cssText = `
        width: 100%;
        height: 6px;
        background: ${theme.colors.backgroundDark};
        outline: none;
        border-radius: 3px;
        cursor: pointer;
      `;
      
      // Custom slider styling
      const sliderStyle = document.createElement('style');
      sliderStyle.textContent = `
        .audio-settings-panel input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${theme.colors.warning};
          cursor: pointer;
          border: 2px solid ${theme.colors.background};
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
        }
        
        .audio-settings-panel input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${theme.colors.warning};
          cursor: pointer;
          border: 2px solid ${theme.colors.background};
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
        }
        
        .audio-settings-panel input[type="range"]::-webkit-slider-runnable-track {
          background: linear-gradient(to right, 
            ${theme.colors.warning} 0%, 
            ${theme.colors.warning} ${this.state.volume}%, 
            ${theme.colors.backgroundDark} ${this.state.volume}%, 
            ${theme.colors.backgroundDark} 100%);
        }
      `;
      panel.appendChild(sliderStyle);
      
      this.volumeSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.handleVolumeChange(value);
      });
      
      volumeContainer.appendChild(volumeLabel);
      volumeContainer.appendChild(this.volumeSlider);
      cardContent.appendChild(volumeContainer);
      
      // Mute button
      this.muteButton = new Button({
        text: this.state.muted ? 'Unmute' : 'Mute',
        variant: this.state.muted ? 'success' : 'warning',
        size: 'small',
        fullWidth: true,
        style: {
          marginBottom: theme.spacing.sm
        },
        onClick: () => this.toggleMute()
      });
      this.muteButton.mount(cardContent as HTMLElement);
      
      // Close button
      this.closeButton = new Button({
        text: 'Close',
        variant: 'secondary',
        size: 'small',
        fullWidth: true,
        onClick: () => this.closePanel()
      });
      this.closeButton.mount(cardContent as HTMLElement);
    }
    
    card.mount(panel);
    
    return panel;
  }
  
  private togglePanel(): void {
    this.setState({ expanded: !this.state.expanded });
    this.updatePanelVisibility();
  }
  
  private closePanel(): void {
    this.setState({ expanded: false });
    this.updatePanelVisibility();
  }
  
  private updatePanelVisibility(): void {
    if (this.settingsPanel) {
      this.settingsPanel.style.display = this.state.expanded ? 'block' : 'none';
    }
  }
  
  private handleVolumeChange(value: number): void {
    this.setState({ volume: value });
    
    // Update label
    const label = this.settingsPanel?.querySelector('#volume-label');
    if (label) {
      label.textContent = `Volume: ${value}%`;
    }
    
    // Update slider track
    if (this.volumeSlider) {
      const track = this.volumeSlider.style;
      track.background = `linear-gradient(to right, 
        var(--color-warning) 0%, 
        var(--color-warning) ${value}%, 
        var(--color-background-dark) ${value}%, 
        var(--color-background-dark) 100%)`;
    }
    
    // Emit event
    const normalizedVolume = value / 100;
    this.uiManager.emit('audio-settings-changed', {
      volume: normalizedVolume,
      muted: this.state.muted
    });
  }
  
  private toggleMute(): void {
    const newMuted = !this.state.muted;
    this.setState({ muted: newMuted });
    
    // Update buttons
    if (this.audioButton) {
      this.audioButton.setProps({ text: newMuted ? '🔇' : '🔊' });
    }
    
    if (this.muteButton) {
      this.muteButton.setProps({ 
        text: newMuted ? 'Unmute' : 'Mute',
        variant: newMuted ? 'success' : 'warning'
      });
    }
    
    // Update slider
    if (this.volumeSlider) {
      this.volumeSlider.disabled = newMuted;
      this.volumeSlider.style.opacity = newMuted ? '0.5' : '1';
    }
    
    // Emit event
    this.uiManager.emit('audio-settings-changed', {
      volume: this.state.volume / 100,
      muted: newMuted
    });
  }
  
  private setupClickOutside(): void {
    document.addEventListener('click', (e) => {
      if (this.state.expanded && this.settingsPanel) {
        const audioButton = this.audioButton?.getElement();
        const target = e.target as Node;
        
        if (!this.settingsPanel.contains(target) && 
            !audioButton?.contains(target)) {
          this.closePanel();
        }
      }
    });
    
    // Prevent clicks inside panel from bubbling
    this.settingsPanel?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  protected getStyles() {
    return {};
  }
}