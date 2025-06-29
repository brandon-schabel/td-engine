/**
 * Handles transitions between scenes with various effects
 * Now powered by GSAP for smoother animations
 */

import { cn } from '@/ui/styles/UtilityStyles';
import { gsap } from '@/utils/AnimationUtils';

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
    await gsap.to(this.overlay, {
      opacity: 1,
      duration: duration / 2000, // Convert to seconds
      ease: 'power2.inOut'
    });

    // Switch scenes
    if (fromElement) {
      fromElement.style.display = 'none';
    }
    toElement.style.display = 'flex';

    // Fade out overlay
    await gsap.to(this.overlay, {
      opacity: 0,
      duration: duration / 2000,
      ease: 'power2.inOut'
    });

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
    // Determine transform values based on transition type
    let fromX = 0, fromY = 0;
    let toStartX = 0, toStartY = 0;

    switch (type) {
      case TransitionType.SLIDE_LEFT:
        fromX = -100;
        toStartX = 100;
        break;
      case TransitionType.SLIDE_RIGHT:
        fromX = 100;
        toStartX = -100;
        break;
      case TransitionType.SLIDE_UP:
        fromY = -100;
        toStartY = 100;
        break;
      case TransitionType.SLIDE_DOWN:
        fromY = 100;
        toStartY = -100;
        break;
    }

    // Set initial positions
    gsap.set(toElement, {
      xPercent: toStartX,
      yPercent: toStartY,
      display: 'flex'
    });

    // Create timeline for synchronized animations
    const tl = gsap.timeline();

    // Animate both elements simultaneously
    if (fromElement) {
      tl.to(fromElement, {
        xPercent: fromX,
        yPercent: fromY,
        duration: duration / 1000,
        ease: this.convertEasing(easing)
      }, 0);
    }

    tl.to(toElement, {
      xPercent: 0,
      yPercent: 0,
      duration: duration / 1000,
      ease: this.convertEasing(easing)
    }, 0);

    // Wait for animation to complete
    await tl;

    // Clean up
    if (fromElement) {
      fromElement.style.display = 'none';
      gsap.set(fromElement, { clearProps: 'all' });
    }
    gsap.set(toElement, { clearProps: 'transform' });
  }

  private convertEasing(cssEasing: string): string {
    // Convert CSS easing to GSAP easing
    const easingMap: Record<string, string> = {
      'ease': 'power1.inOut',
      'ease-in': 'power2.in',
      'ease-out': 'power2.out',
      'ease-in-out': 'power2.inOut',
      'linear': 'none'
    };
    return easingMap[cssEasing] || 'power2.inOut';
  }

  public destroy(): void {
    this.overlay.remove();
  }
}