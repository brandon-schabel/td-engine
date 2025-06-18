import { Game } from '@/core/Game';
import { IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { FloatingUIElement } from './FloatingUIElement';
import { IconButton } from './IconButton';

export class FloatingCameraControls extends FloatingUIElement {
  private game: Game;
  private audioManager: AudioManager;
  private zoomDisplay: HTMLElement;
  private controlsWrapper: HTMLElement;

  constructor(game: Game, audioManager: AudioManager) {
    super({
      id: 'camera-controls-display',
      position: { top: 60, right: 10 },
      borderColor: '#00BCD4',
      icon: IconType.CAMERA,
      iconSize: 20,
      updateInterval: 0 // We'll update manually when zoom changes
    });
    
    this.game = game;
    this.audioManager = audioManager;
    
    // Create controls wrapper
    this.controlsWrapper = document.createElement('div');
    this.controlsWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    
    // Create zoom controls
    this.createZoomControls();
    
    // Create zoom display
    this.zoomDisplay = document.createElement('span');
    this.zoomDisplay.style.cssText = `
      margin-left: 4px;
      font-size: clamp(12px, 2.5vw, 16px);
    `;
    this.updateZoomDisplay();
    
    this.controlsWrapper.appendChild(this.zoomDisplay);
    
    // Add controls to container
    this.contentElement.appendChild(this.controlsWrapper);
  }

  private createZoomControls(): void {
    // Zoom in button
    const zoomInBtn = new IconButton({
      iconType: IconType.ZOOM_IN,
      iconSize: 18,
      title: 'Zoom In',
      baseColor: '#00BCD4',
      onClick: () => {
        this.game.getCamera().zoomIn();
        this.updateZoomDisplay();
        this.audioManager.playUISound(SoundType.BUTTON_CLICK);
      }
    });
    
    // Zoom out button
    const zoomOutBtn = new IconButton({
      iconType: IconType.ZOOM_OUT,
      iconSize: 18,
      title: 'Zoom Out',
      baseColor: '#00BCD4',
      onClick: () => {
        this.game.getCamera().zoomOut();
        this.updateZoomDisplay();
        this.audioManager.playUISound(SoundType.BUTTON_CLICK);
      }
    });
    
    // Reset button
    const resetBtn = new IconButton({
      iconType: IconType.RESET_ZOOM,
      iconSize: 18,
      title: 'Reset View',
      baseColor: '#00BCD4',
      onClick: () => {
        this.game.getCamera().reset();
        this.updateZoomDisplay();
        this.audioManager.playUISound(SoundType.BUTTON_CLICK);
      }
    });
    
    // Mount buttons to controls wrapper
    zoomInBtn.mount(this.controlsWrapper);
    zoomOutBtn.mount(this.controlsWrapper);
    resetBtn.mount(this.controlsWrapper);
  }

  private updateZoomDisplay(): void {
    const camera = this.game.getCamera();
    const zoomLevel = Math.round(camera.getZoom() * 100);
    this.zoomDisplay.textContent = `${zoomLevel}%`;
  }
}