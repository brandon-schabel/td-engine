import { Game } from '@/core/Game';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

export class CameraControls {
  private container: HTMLElement | null = null;
  private game: Game;
  private zoomDisplay: HTMLElement | null = null;

  constructor(options: { 
    game: Game; 
    position?: string;
    showLabels?: boolean;
    showZoomLevel?: boolean;
    compact?: boolean;
  }) {
    this.game = options.game;
  }

  mount(parent: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 1000;
    `;

    // Create zoom controls
    const zoomInBtn = this.createButton(IconType.ZOOM_IN, 'Zoom In', () => {
      const camera = this.game.getCamera();
      camera.zoomIn();
      this.updateZoomDisplay();
    });

    const zoomOutBtn = this.createButton(IconType.ZOOM_OUT, 'Zoom Out', () => {
      const camera = this.game.getCamera();
      camera.zoomOut();
      this.updateZoomDisplay();
    });

    const resetBtn = this.createButton(IconType.RESET, 'Reset View', () => {
      const camera = this.game.getCamera();
      camera.reset();
      this.updateZoomDisplay();
    });

    // Create zoom level display
    this.zoomDisplay = document.createElement('div');
    this.zoomDisplay.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #FFD700;
      border-radius: 4px;
      padding: 4px 8px;
      color: #FFD700;
      font-family: Arial, sans-serif;
      font-size: 11px;
      text-align: center;
    `;
    this.updateZoomDisplay();

    // Add controls to container
    this.container.appendChild(zoomInBtn);
    this.container.appendChild(zoomOutBtn);
    this.container.appendChild(resetBtn);
    this.container.appendChild(this.zoomDisplay);

    parent.appendChild(this.container);
  }

  private createButton(iconType: IconType, title: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = 'camera-control-button';
    button.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #FFD700;
      color: #FFD700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    button.title = title;
    button.innerHTML = createSvgIcon(iconType, { size: 20 });
    
    button.addEventListener('click', onClick);
    
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(0, 0, 0, 0.9)';
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
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