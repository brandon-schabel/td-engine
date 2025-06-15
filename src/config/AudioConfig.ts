/**
 * Audio system configuration constants
 * Centralizes all audio-related settings and parameters
 */

// Audio system settings
export const AUDIO_SYSTEM = {
  masterVolume: 0.3,
  maxConcurrentSounds: 8,
  minSoundInterval: 0.05, // 50ms minimum between any sounds
  shootingSoundInterval: 0.2, // 200ms minimum between shooting sounds
  spatialAudio: {
    enabled: true,
    maxDistance: 600,
    panDivisor: 400,
    falloffPower: 2
  }
} as const;

// Sound effect volumes (relative to master)
export const SOUND_VOLUMES = {
  ui: {
    buttonClick: 0.4,
    buttonHover: 0.2,
    select: 0.3,
    deselect: 0.3,
    error: 0.5,
    success: 0.6,
    warning: 0.5
  },
  combat: {
    towerShoot: 0.3,
    playerShoot: 0.4,
    enemyHit: 0.3,
    enemyDeath: 0.5,
    towerPlace: 0.6,
    towerUpgrade: 0.7,
    towerDestroy: 0.8
  },
  player: {
    takeDamage: 0.7,
    heal: 0.6,
    powerUp: 0.8,
    levelUp: 0.9,
    footstep: 0.2
  },
  game: {
    waveStart: 0.8,
    waveComplete: 0.9,
    gameOver: 1.0,
    victory: 1.0,
    countdown: 0.5
  }
} as const;

// Sound effect parameters (for generated sounds)
export const SOUND_PARAMS = {
  shooting: {
    frequency: 440,
    duration: 0.1,
    fadeOut: 0.05
  },
  explosion: {
    frequency: 80,
    duration: 0.3,
    fadeOut: 0.2,
    noise: true
  },
  powerUp: {
    frequencies: [523.25, 659.25, 783.99], // C, E, G
    duration: 0.5,
    fadeIn: 0.1,
    fadeOut: 0.2
  },
  damage: {
    frequency: 200,
    duration: 0.2,
    fadeOut: 0.1,
    distortion: 0.5
  }
} as const;

// Music configuration
export const MUSIC_CONFIG = {
  enabled: false, // Currently no background music
  volume: 0.5,
  fadeInDuration: 2000,
  fadeOutDuration: 1000,
  crossfadeDuration: 500
} as const;