/**
 * Animation Configuration
 * Centralizes all animation durations, timings, and easing functions
 */

export const ANIMATION_CONFIG = {
  // Default animation durations (in milliseconds)
  durations: {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 300,
    slower: 500,
    slowest: 1000,
    
    // Specific animations
    uiTransition: 200,
    buttonHover: 150,
    buttonPress: 100,
    dialogOpen: 300,
    dialogClose: 200,
    fadeIn: 300,
    fadeOut: 200,
    slideIn: 400,
    slideOut: 300,
    tooltipShow: 200,
    tooltipHide: 150,
    damageNumber: 1000,
    healEffect: 800,
    powerUpCollect: 500,
    towerPlace: 300,
    towerUpgrade: 400,
    enemySpawn: 500,
    enemyDeath: 300,
    projectileImpact: 150,
    waveComplete: 1000,
    screenShake: 500,
  },

  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Frame-based timings
  frames: {
    fps: 60,
    frameTime: 16.67, // 1000/60
    skipThreshold: 33.34, // Skip frame if delta > 2 frames
  },

  // Particle animations
  particles: {
    lifetime: {
      min: 500,
      max: 2000,
    },
    fadeInTime: 100,
    fadeOutTime: 200,
    explosionDuration: 1000,
    smokeDuration: 2000,
    sparkDuration: 500,
  },

  // UI state transitions
  transitions: {
    menuStateChange: 300,
    screenTransition: 500,
    loadingFade: 400,
    hudSlide: 300,
    inventoryToggle: 200,
    modalBackdrop: 200,
  },

  // Combat animations
  combat: {
    attackSwing: 200,
    projectileFlight: 1000, // Base duration, actual depends on distance
    impactFlash: 100,
    damageFlash: 150,
    healPulse: 800,
    criticalHit: 300,
    dodgeRoll: 400,
  },

  // Tower animations
  towers: {
    construction: 500,
    destruction: 300,
    upgrade: 600,
    rotationSpeed: 0.1, // Radians per frame
    recoil: 100,
    laserCharge: 200,
    frostPulse: 1000,
  },

  // Enemy animations
  enemies: {
    spawn: 500,
    death: 300,
    hit: 150,
    freeze: 2000,
    burn: 3000,
    poison: 5000,
    stun: 1000,
  },

  // Effect delays
  delays: {
    tooltipHover: 500,
    buttonHoldThreshold: 500,
    doubleClickWindow: 300,
    comboWindow: 1000,
    autoSaveInterval: 30000,
  },

  // Animation curves for custom interpolation
  curves: {
    // Attack damage falloff
    damageFalloff: (t: number) => 1 - t * t,
    // Explosion shockwave
    shockwave: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    // Bounce effect
    bounce: (t: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  },
} as const;

export type AnimationConfig = typeof ANIMATION_CONFIG;

// Helper function to get duration value
export function getAnimationDuration(key: keyof typeof ANIMATION_CONFIG.durations): number {
  return ANIMATION_CONFIG.durations[key];
}

// Helper function for interpolation
export function interpolate(start: number, end: number, t: number, curve?: (t: number) => number): number {
  const normalizedT = Math.max(0, Math.min(1, t));
  const curvedT = curve ? curve(normalizedT) : normalizedT;
  return start + (end - start) * curvedT;
}