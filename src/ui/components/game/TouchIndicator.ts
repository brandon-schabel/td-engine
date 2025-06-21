import { COLOR_THEME } from '@/config/ColorTheme';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

export class TouchIndicator {
  private container: HTMLElement;
  private indicators: Map<number, HTMLElement> = new Map();
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.setupStyles();
  }
  
  private setupStyles(): void {
    // Styles moved to ComponentStyles.ts
  }
  
  showTouch(touchId: number, x: number, y: number): void {
    // Remove existing indicator if any
    this.hideTouch(touchId);
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'touch-indicator';
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    
    this.container.appendChild(indicator);
    this.indicators.set(touchId, indicator);
    
    // Auto-remove after animation
    setTimeout(() => {
      this.hideTouch(touchId);
    }, ANIMATION_CONFIG.durations.powerUpCollect);
  }
  
  showRipple(x: number, y: number): void {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    this.container.appendChild(ripple);
    
    // Remove after animation
    setTimeout(() => {
      ripple.remove();
    }, ANIMATION_CONFIG.particles.explosionDuration * 0.6);
  }
  
  updateTouch(touchId: number, x: number, y: number): void {
    const indicator = this.indicators.get(touchId);
    if (indicator) {
      indicator.style.left = `${x}px`;
      indicator.style.top = `${y}px`;
    }
  }
  
  hideTouch(touchId: number): void {
    const indicator = this.indicators.get(touchId);
    if (indicator) {
      indicator.remove();
      this.indicators.delete(touchId);
    }
  }
  
  hideAllTouches(): void {
    this.indicators.forEach((indicator) => indicator.remove());
    this.indicators.clear();
  }
}