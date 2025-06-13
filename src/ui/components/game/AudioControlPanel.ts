/**
 * AudioControlPanel Component
 * Controls for game audio settings
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from '../GameComponent';
import { Button } from '../Button';
import { styled } from '../../core/styled';

interface AudioControlPanelState extends GameComponentState {
  expanded: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export class AudioControlPanel extends GameComponent<GameComponentProps, AudioControlPanelState> {
  private volumeSliders: Map<string, HTMLInputElement> = new Map();

  override getInitialState(): AudioControlPanelState {
    return {
      visible: true,
      loading: false,
      error: null,
      expanded: false,
      masterVolume: 70,
      musicVolume: 60,
      sfxVolume: 80,
      muted: false
    };
  }

  onMount(): void {
    super.onMount();
    
    // Load saved audio settings from localStorage
    this.loadAudioSettings();
  }

  protected renderContent(): HTMLElement {
    if (!this.state.visible) {
      return this.createElement(styled.div`display: none;`);
    }

    const Container = this.createContainer('audio-control-panel', {
      position: 'fixed',
      bottom: '20px',
      right: '300px', // Position next to tower selection panel
      width: this.state.expanded ? '280px' : '60px',
      zIndex: 1100,
      transition: 'all 0.3s ease'
    });

    const container = this.createElement(Container);
    
    if (this.state.expanded) {
      const expandedPanel = this.createExpandedPanel();
      container.appendChild(expandedPanel);
    } else {
      const collapsedPanel = this.createCollapsedPanel();
      container.appendChild(collapsedPanel);
    }
    
    return container;
  }

  private createCollapsedPanel(): HTMLElement {
    const CollapsedPanel = styled.div`
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.secondary};
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(8px);
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    `;
    
    const panel = this.createElement(CollapsedPanel, {
      onClick: () => this.setState({ expanded: true })
    });
    
    const AudioIcon = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xl};
      color: ${(props: { theme: any }) => props.theme.colors.secondary};
    `;
    
    const icon = this.createElement(AudioIcon, {}, 
      this.state.muted ? '🔇' : '🔊');
    panel.appendChild(icon);
    
    return panel;
  }

  private createExpandedPanel(): HTMLElement {
    const ExpandedPanel = styled.div`
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.secondary};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.md};
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      
      @media (max-width: 768px) {
        position: fixed;
        bottom: 50%;
        right: 50%;
        transform: translate(50%, 50%);
        width: 90vw;
        max-width: 300px;
      }
    `;
    
    const panel = this.createElement(ExpandedPanel);
    
    // Header
    const header = this.createHeader();
    panel.appendChild(header);
    
    // Content
    const content = this.createContent();
    panel.appendChild(content);
    
    return panel;
  }

  private createHeader(): HTMLElement {
    const Header = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.3);
    `;
    
    const header = this.createElement(Header);
    
    const HeaderContent = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const headerContent = this.createElement(HeaderContent);
    
    const HeaderIcon = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xl};
    `;
    
    const HeaderTitle = styled.h3`
      margin: 0;
      color: ${(props: { theme: any }) => props.theme.colors.secondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
    `;
    
    const icon = this.createElement(HeaderIcon, {}, '🎵');
    const title = this.createElement(HeaderTitle, {}, 'Audio Settings');
    
    headerContent.appendChild(icon);
    headerContent.appendChild(title);
    
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
      onClick: () => this.setState({ expanded: false }),
      title: 'Collapse'
    }, '−');
    
    header.appendChild(headerContent);
    header.appendChild(closeButton);
    
    return header;
  }

  private createContent(): HTMLElement {
    const Content = styled.div`
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const content = this.createElement(Content);
    
    // Master mute toggle
    const muteToggle = this.createMuteToggle();
    content.appendChild(muteToggle);
    
    // Volume controls
    const volumeControls = this.createVolumeControls();
    content.appendChild(volumeControls);
    
    // Quick presets
    const presets = this.createPresets();
    content.appendChild(presets);
    
    return content;
  }

  private createMuteToggle(): HTMLElement {
    const MuteToggle = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${(props: { theme: any }) => props.theme.spacing.sm} 0;
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.md};
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const muteToggle = this.createElement(MuteToggle);
    
    const MuteLabel = styled.span`
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.semibold};
    `;
    
    const label = this.createElement(MuteLabel, {}, 'Master Mute');
    
    const muteButton = new Button({
      text: this.state.muted ? '🔇 Unmute' : '🔊 Mute',
      variant: this.state.muted ? 'warning' : 'secondary',
      size: 'small',
      onClick: () => this.toggleMute()
    });
    
    muteToggle.appendChild(label);
    muteButton.mount(muteToggle);
    
    return muteToggle;
  }

  private createVolumeControls(): HTMLElement {
    const VolumeControls = styled.div`
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const volumeControls = this.createElement(VolumeControls);
    
    const controls = [
      { key: 'master', label: 'Master Volume', value: this.state.masterVolume, icon: '🔊' },
      { key: 'music', label: 'Music', value: this.state.musicVolume, icon: '🎵' },
      { key: 'sfx', label: 'Sound Effects', value: this.state.sfxVolume, icon: '🔔' }
    ];
    
    controls.forEach(control => {
      const controlElement = this.createVolumeControl(control);
      volumeControls.appendChild(controlElement);
    });
    
    return volumeControls;
  }

  private createVolumeControl(control: { key: string; label: string; value: number; icon: string }): HTMLElement {
    const VolumeControl = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const volumeControl = this.createElement(VolumeControl);
    
    const ControlIcon = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.md};
      width: 20px;
      text-align: center;
    `;
    
    const ControlContent = styled.div`
      flex: 1;
    `;
    
    const ControlLabel = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      margin-bottom: 4px;
    `;
    
    const SliderContainer = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const VolumeSlider = styled.input`
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      border: none;
      outline: none;
      
      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: ${(props: { theme: any }) => props.theme.colors.primary};
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      &::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      
      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: ${(props: { theme: any }) => props.theme.colors.primary};
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      
      &::-moz-range-thumb:hover {
        transform: scale(1.2);
      }
    `;
    
    const VolumeValue = styled.span`
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      min-width: 30px;
      text-align: right;
    `;
    
    const icon = this.createElement(ControlIcon, {}, control.icon);
    const content = this.createElement(ControlContent);
    const label = this.createElement(ControlLabel, {}, control.label);
    const sliderContainer = this.createElement(SliderContainer);
    
    const slider = this.createElement(VolumeSlider, {
      type: 'range',
      min: '0',
      max: '100',
      value: control.value.toString(),
      oninput: (e: Event) => this.handleVolumeChange(control.key, e)
    }) as HTMLInputElement;
    
    const value = this.createElement(VolumeValue, {}, `${control.value}%`);
    
    this.volumeSliders.set(control.key, slider);
    
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(value);
    
    content.appendChild(label);
    content.appendChild(sliderContainer);
    
    volumeControl.appendChild(icon);
    volumeControl.appendChild(content);
    
    return volumeControl;
  }

  private createPresets(): HTMLElement {
    const Presets = styled.div`
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: ${(props: { theme: any }) => props.theme.spacing.md};
    `;
    
    const presets = this.createElement(Presets);
    
    const PresetsTitle = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.semibold};
      margin-bottom: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const title = this.createElement(PresetsTitle, {}, 'Quick Presets');
    presets.appendChild(title);
    
    const PresetsContainer = styled.div`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${(props: { theme: any }) => props.theme.spacing.xs};
    `;
    
    const presetsContainer = this.createElement(PresetsContainer);
    
    const presetConfigs = [
      { name: 'Balanced', master: 70, music: 60, sfx: 80 },
      { name: 'Music Focus', master: 80, music: 90, sfx: 50 },
      { name: 'SFX Focus', master: 80, music: 40, sfx: 100 },
      { name: 'Quiet', master: 30, music: 30, sfx: 30 }
    ];
    
    presetConfigs.forEach(preset => {
      const presetButton = new Button({
        text: preset.name,
        variant: 'secondary',
        size: 'small',
        style: { fontSize: '11px', padding: '6px 8px' },
        onClick: () => this.applyPreset(preset)
      });
      
      presetButton.mount(presetsContainer);
    });
    
    presets.appendChild(presetsContainer);
    
    return presets;
  }

  private handleVolumeChange(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    
    switch (key) {
      case 'master':
        this.setState({ masterVolume: value });
        break;
      case 'music':
        this.setState({ musicVolume: value });
        break;
      case 'sfx':
        this.setState({ sfxVolume: value });
        break;
    }
    
    // Update the value display
    const valueElement = target.parentElement?.querySelector('span:last-child');
    if (valueElement) {
      valueElement.textContent = `${value}%`;
    }
    
    // Save settings and apply volume changes
    this.saveAudioSettings();
    this.applyVolumeChanges(key, value);
  }

  private toggleMute(): void {
    const newMutedState = !this.state.muted;
    this.setState({ muted: newMutedState });
    this.saveAudioSettings();
    this.applyMuteState(newMutedState);
  }

  private applyPreset(preset: { name: string; master: number; music: number; sfx: number }): void {
    this.setState({
      masterVolume: preset.master,
      musicVolume: preset.music,
      sfxVolume: preset.sfx
    });
    
    // Update slider values
    this.volumeSliders.get('master')!.value = preset.master.toString();
    this.volumeSliders.get('music')!.value = preset.music.toString();
    this.volumeSliders.get('sfx')!.value = preset.sfx.toString();
    
    // Update value displays
    this.volumeSliders.forEach((slider, key) => {
      const valueElement = slider.parentElement?.querySelector('span:last-child');
      if (valueElement) {
        const value = key === 'master' ? preset.master : 
                     key === 'music' ? preset.music : preset.sfx;
        valueElement.textContent = `${value}%`;
      }
    });
    
    this.saveAudioSettings();
    this.uiManager.showNotification(`Applied ${preset.name} preset`, 'success', 1500);
  }

  private loadAudioSettings(): void {
    try {
      const saved = localStorage.getItem('gameAudioSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.setState({
          masterVolume: settings.masterVolume || 70,
          musicVolume: settings.musicVolume || 60,
          sfxVolume: settings.sfxVolume || 80,
          muted: settings.muted || false
        });
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  private saveAudioSettings(): void {
    try {
      const settings = {
        masterVolume: this.state.masterVolume,
        musicVolume: this.state.musicVolume,
        sfxVolume: this.state.sfxVolume,
        muted: this.state.muted
      };
      localStorage.setItem('gameAudioSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  private applyVolumeChanges(key: string, value: number): void {
    // In a full implementation, this would connect to the actual audio system
    // For now, just show a notification
    console.log(`Audio: ${key} volume set to ${value}%`);
  }

  private applyMuteState(muted: boolean): void {
    // In a full implementation, this would mute/unmute the actual audio
    // For now, just show a notification
    console.log(`Audio: ${muted ? 'Muted' : 'Unmuted'}`);
  }

  /**
   * Public API methods
   */
  public toggle(): void {
    this.setState({ expanded: !this.state.expanded });
  }

  public expand(): void {
    this.setState({ expanded: true });
  }

  public collapse(): void {
    this.setState({ expanded: false });
  }

  /**
   * Called after state updates to refresh display
   */
  onStateUpdate(): void {
    super.onStateUpdate();
    
    // Update volume slider values when state changes
    setTimeout(() => {
      this.volumeSliders.get('master')!.value = this.state.masterVolume.toString();
      this.volumeSliders.get('music')!.value = this.state.musicVolume.toString();
      this.volumeSliders.get('sfx')!.value = this.state.sfxVolume.toString();
    }, 0);
  }
}