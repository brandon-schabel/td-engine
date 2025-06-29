/**
 * GSAP-based Animation Utilities
 * Replaces manual interpolation and animation code with GSAP
 */

import { gsap } from 'gsap';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';

// Re-export GSAP for convenience
export { gsap };

// Convert our custom easing names to GSAP easing
const easingMap: Record<string, string> = {
  linear: 'none',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  easeInQuad: 'power2.in',
  easeOutQuad: 'power2.out',
  easeInOutQuad: 'power2.inOut',
  easeInCubic: 'power3.in',
  easeOutCubic: 'power3.out',
  easeInOutCubic: 'power3.inOut',
  bounce: 'bounce.out',
  elastic: 'elastic.out'
};

/**
 * Get GSAP easing string from our config
 */
export function getGSAPEasing(configEasing: keyof typeof ANIMATION_CONFIG.easing): string {
  const easingKey = ANIMATION_CONFIG.easing[configEasing];
  return easingMap[easingKey] || easingKey;
}

/**
 * Get animation duration from config
 */
export function getDuration(key: keyof typeof ANIMATION_CONFIG.durations): number {
  return ANIMATION_CONFIG.durations[key] / 1000; // Convert ms to seconds for GSAP
}

/**
 * Animate a damage number floating up and fading out
 */
export function animateDamageNumber(element: HTMLElement, options?: {
  duration?: number;
  distance?: number;
  onComplete?: () => void;
}): gsap.core.Tween {
  const { 
    duration = getDuration('damageNumber'), 
    distance = 50,
    onComplete 
  } = options || {};

  return gsap.to(element, {
    y: `-=${distance}`,
    opacity: 0,
    duration,
    ease: 'power2.out',
    onComplete: () => {
      element.remove();
      onComplete?.();
    }
  });
}

/**
 * Animate health pickup bobbing
 */
export function animateHealthPickupBob(target: { bobOffset: number; rotation: number }): gsap.core.Timeline {
  const tl = gsap.timeline({ repeat: -1 });
  
  // Bobbing animation
  tl.to(target, {
    bobOffset: 5,
    duration: 1,
    ease: 'power1.inOut'
  })
  .to(target, {
    bobOffset: -5,
    duration: 1,
    ease: 'power1.inOut'
  });

  // Rotation animation (separate, continuous)
  gsap.to(target, {
    rotation: Math.PI * 2,
    duration: 3,
    ease: 'none',
    repeat: -1
  });

  return tl;
}

/**
 * Animate tower placement
 */
export function animateTowerPlacement(element: HTMLElement | SVGElement): gsap.core.Tween {
  gsap.set(element, { scale: 0, opacity: 0 });
  
  return gsap.to(element, {
    scale: 1,
    opacity: 1,
    duration: getDuration('towerPlace'),
    ease: 'back.out(1.7)'
  });
}

/**
 * Animate tower destruction
 */
export function animateTowerDestruction(element: HTMLElement | SVGElement, onComplete?: () => void): gsap.core.Tween {
  return gsap.to(element, {
    scale: 0,
    opacity: 0,
    rotation: 90,
    duration: getDuration('towerDestruction'),
    ease: 'power2.in',
    onComplete
  });
}

/**
 * Animate projectile impact
 */
export function animateProjectileImpact(element: HTMLElement | SVGElement): gsap.core.Timeline {
  const tl = gsap.timeline({
    onComplete: () => element.remove()
  });

  tl.to(element, {
    scale: 1.5,
    opacity: 0,
    duration: getDuration('projectileImpact'),
    ease: 'power2.out'
  });

  return tl;
}

/**
 * Animate UI element fade in
 */
export function fadeIn(element: HTMLElement, options?: {
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}): gsap.core.Tween {
  const { 
    duration = getDuration('fadeIn'), 
    delay = 0,
    onComplete 
  } = options || {};

  gsap.set(element, { opacity: 0 });
  
  return gsap.to(element, {
    opacity: 1,
    duration,
    delay,
    ease: 'power2.out',
    onComplete
  });
}

/**
 * Animate UI element fade out
 */
export function fadeOut(element: HTMLElement, options?: {
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}): gsap.core.Tween {
  const { 
    duration = getDuration('fadeOut'), 
    delay = 0,
    onComplete 
  } = options || {};
  
  return gsap.to(element, {
    opacity: 0,
    duration,
    delay,
    ease: 'power2.in',
    onComplete
  });
}

/**
 * Animate UI slide in
 */
export function slideIn(element: HTMLElement, direction: 'left' | 'right' | 'top' | 'bottom' = 'left'): gsap.core.Tween {
  const distance = 100;
  const fromVars: gsap.TweenVars = { opacity: 0 };
  
  switch (direction) {
    case 'left':
      fromVars.x = -distance;
      break;
    case 'right':
      fromVars.x = distance;
      break;
    case 'top':
      fromVars.y = -distance;
      break;
    case 'bottom':
      fromVars.y = distance;
      break;
  }

  gsap.set(element, fromVars);
  
  return gsap.to(element, {
    x: 0,
    y: 0,
    opacity: 1,
    duration: getDuration('slideIn'),
    ease: 'power2.out'
  });
}

/**
 * Animate camera smoothing (replaces manual lerp)
 */
export function smoothCameraFollow(
  camera: { position: { x: number; y: number } },
  target: { x: number; y: number },
  smoothing: number = 0.1
): void {
  gsap.to(camera.position, {
    x: target.x,
    y: target.y,
    duration: smoothing,
    ease: 'none',
    overwrite: 'auto'
  });
}

/**
 * Animate zoom changes
 */
export function animateZoom(
  target: { zoom: number },
  newZoom: number,
  duration: number = 0.3
): gsap.core.Tween {
  return gsap.to(target, {
    zoom: newZoom,
    duration,
    ease: 'power2.inOut'
  });
}

/**
 * Create a reusable shake animation
 */
export function shake(element: HTMLElement | { x: number; y: number }, options?: {
  intensity?: number;
  duration?: number;
  onComplete?: () => void;
}): gsap.core.Tween {
  const { 
    intensity = 10, 
    duration = getDuration('screenShake'),
    onComplete 
  } = options || {};

  return gsap.to(element, {
    x: `+=${intensity}`,
    y: `+=${intensity}`,
    duration: duration / 10,
    ease: 'none',
    repeat: Math.floor(duration * 10) - 1,
    yoyo: true,
    onComplete: () => {
      // Reset position
      if ('style' in element) {
        gsap.set(element, { x: 0, y: 0 });
      }
      onComplete?.();
    }
  });
}

/**
 * Animate progress bar fill
 */
export function animateProgress(
  element: HTMLElement,
  fromProgress: number,
  toProgress: number,
  duration?: number
): gsap.core.Tween {
  const progressObj = { progress: fromProgress };
  
  return gsap.to(progressObj, {
    progress: toProgress,
    duration: duration || 0.3,
    ease: 'power2.out',
    onUpdate: () => {
      element.style.width = `${progressObj.progress * 100}%`;
    }
  });
}



/**
 * Kill all animations on an element
 */
export function killAnimations(target: any): void {
  gsap.killTweensOf(target);
}

/**
 * Global animation speed control
 */
export function setGlobalTimeScale(scale: number): void {
  gsap.globalTimeline.timeScale(scale);
}

// Initialize GSAP with our defaults
gsap.defaults({
  ease: 'power2.out',
  duration: 0.3
});