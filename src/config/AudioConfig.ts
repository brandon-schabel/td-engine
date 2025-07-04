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
