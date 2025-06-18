import { Game } from '@/core/Game';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager, SoundType } from '@/audio/AudioManager';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export class CameraControls {
  private container: HTMLElement;
  private game: Game;
  private audioManager: AudioManager;
  private zoomDisplay: HTMLElement | null = null;

  constructor(game: Game, audioManager: AudioManager) {
    this.game = game;
    this.audioManager = audioManager;
    this.container = this.createContainer();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 50px;
      right: 10px;
      background: ${COLOR_THEME.ui.background.overlay};
      border: ${UI_CONSTANTS.floatingUI.borderWidth}px solid ${COLOR_THEME.ui.button.primary};
      border-radius: ${UI_CONSTANTS.floatingUI.borderRadius}px;
      padding: ${UI_CONSTANTS.floatingUI.padding}px;
      color: ${COLOR_THEME.ui.button.primary};
      font-weight: bold;
      font-size: clamp(14px, 3vw, 18px);
      z-index: ${UI_CONSTANTS.zIndex.ui};
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    // Create camera icon
    const cameraIcon = createSvgIcon(IconType.CAMERA, { size: 20 });
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = cameraIcon;
    container.appendChild(iconSpan);

    // Create zoom controls wrapper
    const controlsWrapper = document.createElement('div');
    controlsWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Create zoom in button
    const zoomInBtn = this.createIconButton(IconType.ZOOM_IN, 'Zoom In', () => {
      const camera = this.game.getCamera();
      camera.zoomIn();
      this.updateZoomDisplay();
      this.audioManager.playUISound(SoundType.BUTTON_CLICK);
    });

    // Create zoom out button
    const zoomOutBtn = this.createIconButton(IconType.ZOOM_OUT, 'Zoom Out', () => {
      const camera = this.game.getCamera();
      camera.zoomOut();
      this.updateZoomDisplay();
      this.audioManager.playUISound(SoundType.BUTTON_CLICK);
    });

    // Create reset button
    const resetBtn = this.createIconButton(IconType.RESET_ZOOM, 'Reset View', () => {
      const camera = this.game.getCamera();
      camera.reset();
      this.updateZoomDisplay();
      this.audioManager.playUISound(SoundType.BUTTON_CLICK);
    });

    // Create zoom level display
    this.zoomDisplay = document.createElement('span');
    this.zoomDisplay.style.cssText = `
      margin-left: 4px;
      font-size: clamp(12px, 2.5vw, 16px);
    `;
    this.updateZoomDisplay();

    // Add controls to wrapper
    controlsWrapper.appendChild(zoomInBtn);
    controlsWrapper.appendChild(zoomOutBtn);
    controlsWrapper.appendChild(resetBtn);
    controlsWrapper.appendChild(this.zoomDisplay);

    // Add wrapper to container
    container.appendChild(controlsWrapper);

    return container;
  }

  private createIconButton(iconType: IconType, title: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = 'camera-icon-button';
    button.style.cssText = `
      background: none;
      border: none;
      color: ${COLOR_THEME.ui.button.primary};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 4px;
      border-radius: ${UI_CONSTANTS.floatingUI.borderRadius / 2}px;
    `;
    button.title = title;
    button.innerHTML = createSvgIcon(iconType, { size: 18 });
    
    button.addEventListener('click', onClick);
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '${COLOR_THEME.ui.button.hover}';
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'none';
      button.style.transform = 'scale(1)';
    });
    
    return button;
  }

  private updateZoomDisplay(): void {
    if (!this.zoomDisplay) return;
    const camera = this.game.getCamera();
    const zoomLevel = Math.round(camera.getZoom() * 100);
    this.zoomDisplay.textContent = `${zoomLevel}%`;
  }

  cleanup(): void {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}