/**
 * Handles transitions between scenes with various effects
 */

import { cn } from '@/ui/styles/UtilityStyles';

export enum TransitionType {
  FADE = 'fade',
  SLIDE_LEFT = 'slide-left',
  SLIDE_RIGHT = 'slide-right',
  SLIDE_UP = 'slide-up',
  SLIDE_DOWN = 'slide-down',
  NONE = 'none'
}

export interface TransitionOptions {
  type?: TransitionType;
  duration?: number; // in milliseconds
  easing?: string;
}

export class SceneTransition {
  private overlay: HTMLDivElement;
  private isTransitioning: boolean = false;

  constructor() {
    this.overlay = this.createOverlay();
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = cn(
      'fixed',
      'inset-0',
      'bg-black',
      'pointer-events-none',
      'z-[9999]'
    );
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    return overlay;
  }

  /**
   * Perform a transition between scenes
   */
  public async transition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement,
    options: TransitionOptions = {}
  ): Promise<void> {
    if (this.isTransitioning) {
      console.warn('SceneTransition: Already transitioning');
      return;
    }

    const {
      type = TransitionType.FADE,
      duration = 300,
      easing = 'ease-in-out'
    } = options;

    this.isTransitioning = true;

    try {
      if (type === TransitionType.NONE) {
        // Instant transition
        if (fromElement) {
          fromElement.style.display = 'none';
        }
        toElement.style.display = 'flex';
      } else if (type === TransitionType.FADE) {
        await this.fadeTransition(fromElement, toElement, duration);
      } else {
        await this.slideTransition(fromElement, toElement, type, duration, easing);
      }
    } finally {
      this.isTransitioning = false;
    }
  }

  private async fadeTransition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement,
    duration: number
  ): Promise<void> {
    // Add overlay to DOM
    document.body.appendChild(this.overlay);

    // Fade in overlay
    await this.animateOpacity(this.overlay, 0, 1, duration / 2);

    // Switch scenes
    if (fromElement) {
      fromElement.style.display = 'none';
    }
    toElement.style.display = 'flex';

    // Fade out overlay
    await this.animateOpacity(this.overlay, 1, 0, duration / 2);

    // Remove overlay
    this.overlay.remove();
  }

  private async slideTransition(
    fromElement: HTMLElement | null,
    toElement: HTMLElement,
    type: TransitionType,
    duration: number,
    easing: string
  ): Promise<void> {
    // Set up transition styles
    toElement.style.transition = `transform ${duration}ms ${easing}`;
    if (fromElement) {
      fromElement.style.transition = `transform ${duration}ms ${easing}`;
    }

    // Determine transform values based on transition type
    let fromTransform = '';
    let toInitialTransform = '';
    let toFinalTransform = 'translateX(0) translateY(0)';

    switch (type) {
      case TransitionType.SLIDE_LEFT:
        fromTransform = 'translateX(-100%)';
        toInitialTransform = 'translateX(100%)';
        break;
      case TransitionType.SLIDE_RIGHT:
        fromTransform = 'translateX(100%)';
        toInitialTransform = 'translateX(-100%)';
        break;
      case TransitionType.SLIDE_UP:
        fromTransform = 'translateY(-100%)';
        toInitialTransform = 'translateY(100%)';
        break;
      case TransitionType.SLIDE_DOWN:
        fromTransform = 'translateY(100%)';
        toInitialTransform = 'translateY(-100%)';
        break;
    }

    // Set initial positions
    toElement.style.transform = toInitialTransform;
    toElement.style.display = 'flex';

    // Force layout update
    void toElement.offsetHeight;

    // Start transition
    if (fromElement) {
      fromElement.style.transform = fromTransform;
    }
    toElement.style.transform = toFinalTransform;

    // Wait for transition to complete
    await this.wait(duration);

    // Clean up
    if (fromElement) {
      fromElement.style.display = 'none';
      fromElement.style.transform = '';
      fromElement.style.transition = '';
    }
    toElement.style.transform = '';
    toElement.style.transition = '';
  }

  private async animateOpacity(
    element: HTMLElement,
    from: number,
    to: number,
    duration: number
  ): Promise<void> {
    element.style.opacity = from.toString();
    
    // Force layout update
    void element.offsetHeight;
    
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = to.toString();
    
    await this.wait(duration);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public destroy(): void {
    this.overlay.remove();
  }
}