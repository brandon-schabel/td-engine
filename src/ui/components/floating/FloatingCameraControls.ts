import { FloatingUIBase } from './FloatingUIBase';
import type { FloatingUIOptions } from './FloatingUIBase';
import { IconButton } from './IconButton';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';
import { AudioManager, SoundType } from '@/audio/AudioManager';

export interface FloatingCameraControlsOptions extends Omit<FloatingUIOptions, 'updateInterval'> {
  game: Game;
  audioManager: AudioManager;
}

export class FloatingCameraControls extends FloatingUIBase {
  private game: Game;
  private audioManager: AudioManager;
  private zoomLevelDisplay?: HTMLSpanElement;
  private buttons: IconButton[] = [];
  private intervalId?: number;
  
  constructor(options: FloatingCameraControlsOptions) {
    const { game, audioManager, ...baseOptions } = options;
    
    super({
      ...baseOptions,
      borderColor: baseOptions.borderColor || '#00BCD4',
      textColor: baseOptions.textColor || '#00BCD4',
      updateInterval: 0 // Disable auto-update in parent
    });
    
    this.game = game;
    this.audioManager = audioManager;
    
    this.setupContent();
    
    // Start updates after everything is initialized
    this.startUpdateInterval(100);
  }
  
  private setupContent(): void {
    // Camera icon
    const cameraIcon = document.createElement('span');
    cameraIcon.innerHTML = this.createIcon(IconType.CAMERA);
    this.element.appendChild(cameraIcon);
    
    // Button container
    const buttonContainer = document.createElement('span');
    buttonContainer.style.cssText = 'display: flex; align-items: center; gap: 6px;';
    
    // Create buttons
    const zoomInButton = new IconButton({
      iconType: IconType.ZOOM_IN,
      title: 'Zoom In',
      onClick: () => {
        this.game.getCamera().zoomIn();
        this.audioManager.playUISound(SoundType.BUTTON_CLICK);
      }
    });
    
    const zoomOutButton = new IconButton({
      iconType: IconType.ZOOM_OUT,
      title: 'Zoom Out',
      onClick: () => {
        this.game.getCamera().zoomOut();
        this.audioManager.playUISound(SoundType.BUTTON_CLICK);
      }
    });
    
    const resetButton = new IconButton({
      iconType: IconType.RESET_ZOOM,
      title: 'Reset',
      onClick: () => {
        this.game.getCamera().reset();
        this.audioManager.playUISound(SoundType.BUTTON_CLICK);
      }
    });
    
    // Add buttons to container
    this.buttons = [zoomInButton, zoomOutButton, resetButton];
    this.buttons.forEach(button => {
      buttonContainer.appendChild(button.getElement());
    });
    
    // Zoom level display
    this.zoomLevelDisplay = document.createElement('span');
    this.zoomLevelDisplay.style.cssText = 'margin-left: 4px; font-size: clamp(12px, 2.5vw, 16px);';
    buttonContainer.appendChild(this.zoomLevelDisplay);
    
    this.element.appendChild(buttonContainer);
  }
  
  protected update(): void {
    const camera = this.game.getCamera();
    const zoomLevel = Math.round(camera.getZoom() * 100);
    if (this.zoomLevelDisplay) {
      this.zoomLevelDisplay.textContent = `${zoomLevel}%`;
    }
  }
  
  private startUpdateInterval(interval: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = window.setInterval(() => {
      this.update();
    }, interval);
    // Initial update
    this.update();
  }
  
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.buttons.forEach(button => button.destroy());
    super.destroy();
  }
}