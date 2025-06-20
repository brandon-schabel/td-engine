import { AUDIO_SYSTEM } from '../config/AudioConfig';

export enum SoundType {
  // Combat sounds
  PLAYER_SHOOT = 'player_shoot',
  TOWER_SHOOT = 'tower_shoot',
  ENEMY_HIT = 'enemy_hit',
  ENEMY_DEATH = 'enemy_death',
  PLAYER_HIT = 'player_hit',

  // Tower sounds
  TOWER_PLACE = 'tower_place',
  TOWER_UPGRADE = 'tower_upgrade',
  TOWER_DESTROY = 'tower_destroy',
  UPGRADE = 'upgrade',
  SELL = 'sell',

  // UI sounds
  BUTTON_CLICK = 'button_click',
  BUTTON_HOVER = 'button_hover',
  SELECT = 'select',
  DESELECT = 'deselect',
  ERROR = 'error',

  // Game state sounds
  WAVE_START = 'wave_start',
  WAVE_COMPLETE = 'wave_complete',
  GAME_OVER = 'game_over',
  VICTORY = 'victory',

  // Pickup sounds
  HEALTH_PICKUP = 'health_pickup',
  CURRENCY_PICKUP = 'currency_pickup',
  POWERUP_PICKUP = 'powerup_pickup',

  // Player sounds
  PLAYER_LEVEL_UP = 'player_level_up',
  PLAYER_HEAL = 'player_heal',
  PLAYER_MOVE = 'player_move'
}

interface SoundConfig {
  frequency?: number;
  duration?: number;
  volume?: number;
  type?: 'sine' | 'square' | 'sawtooth' | 'triangle';
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  modulation?: {
    frequency: number;
    depth: number;
  };
  noise?: boolean;
  sequence?: SoundConfig[];
}

export class AudioManager {
  private audioContext: AudioContext;
  private masterVolume: number = AUDIO_SYSTEM.masterVolume;
  private soundConfigs: Map<SoundType, SoundConfig> = new Map();
  private isEnabled: boolean = true;
  private activeSounds: Set<AudioBufferSourceNode | OscillatorNode> = new Set();
  private lastSoundTime: Map<SoundType, number> = new Map();
  private maxConcurrentSounds: number = AUDIO_SYSTEM.maxConcurrentSounds;

  constructor() {
    // Create audio context - handle both new and legacy APIs
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else {
      // Create a mock audio context for testing/server environments
      this.audioContext = {
        destination: {},
        currentTime: 0,
        sampleRate: 44100,
        createOscillator: () => ({
          type: 'sine',
          frequency: { value: 440, setValueAtTime: () => { } },
          connect: () => { },
          start: () => { },
          stop: () => { },
          onended: null,
          addEventListener: () => { },
          removeEventListener: () => { }
        }),
        createGain: () => ({
          gain: { value: 1, setValueAtTime: () => { } },
          connect: () => { }
        }),
        close: () => Promise.resolve()
      } as any;
    }

    // Resume audio context on first user interaction (required by browsers)
    if (typeof document !== 'undefined') {
      document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
      document.addEventListener('keydown', () => this.resumeAudioContext(), { once: true });
    }

    this.initializeSounds();
  }

  private resumeAudioContext(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private initializeSounds(): void {
    // Combat sounds
    this.soundConfigs.set(SoundType.PLAYER_SHOOT, {
      frequency: 800,
      duration: 0.15,
      volume: 0.4,
      type: 'triangle',
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.09 },
      modulation: { frequency: 20, depth: 50 }
    });

    this.soundConfigs.set(SoundType.TOWER_SHOOT, {
      frequency: 600,
      duration: 0.2,
      volume: 0.3,
      type: 'square',
      envelope: { attack: 0.02, decay: 0.08, sustain: 0.2, release: 0.1 }
    });

    this.soundConfigs.set(SoundType.ENEMY_HIT, {
      frequency: 150,
      duration: 0.1,
      volume: 0.5,
      type: 'sawtooth',
      envelope: { attack: 0.01, decay: 0.04, sustain: 0.2, release: 0.05 },
      noise: true
    });

    this.soundConfigs.set(SoundType.ENEMY_DEATH, {
      sequence: [
        {
          frequency: 300,
          duration: 0.1,
          volume: 0.4,
          type: 'square',
          envelope: { attack: 0.01, decay: 0.03, sustain: 0.3, release: 0.06 }
        },
        {
          frequency: 150,
          duration: 0.15,
          volume: 0.3,
          type: 'sawtooth',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.2, release: 0.07 },
          noise: true
        }
      ]
    });

    this.soundConfigs.set(SoundType.PLAYER_HIT, {
      frequency: 200,
      duration: 0.3,
      volume: 0.6,
      type: 'sawtooth',
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.18 },
      modulation: { frequency: 8, depth: 30 }
    });

    // Tower sounds
    this.soundConfigs.set(SoundType.TOWER_PLACE, {
      sequence: [
        {
          frequency: 400,
          duration: 0.1,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.01, decay: 0.04, sustain: 0.5, release: 0.05 }
        },
        {
          frequency: 600,
          duration: 0.15,
          volume: 0.3,
          type: 'triangle',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.4, release: 0.07 }
        }
      ]
    });

    this.soundConfigs.set(SoundType.TOWER_UPGRADE, {
      sequence: [
        {
          frequency: 523, // C5
          duration: 0.1,
          volume: 0.3,
          type: 'sine',
          envelope: { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.06 }
        },
        {
          frequency: 659, // E5
          duration: 0.1,
          volume: 0.3,
          type: 'sine',
          envelope: { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.06 }
        },
        {
          frequency: 784, // G5
          duration: 0.2,
          volume: 0.4,
          type: 'triangle',
          envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.1 }
        }
      ]
    });

    // Add UPGRADE sound (alias for TOWER_UPGRADE)
    this.soundConfigs.set(SoundType.UPGRADE, {
      sequence: [
        {
          frequency: 523, // C5
          duration: 0.1,
          volume: 0.3,
          type: 'sine',
          envelope: { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.06 }
        },
        {
          frequency: 659, // E5
          duration: 0.1,
          volume: 0.3,
          type: 'sine',
          envelope: { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.06 }
        },
        {
          frequency: 784, // G5
          duration: 0.2,
          volume: 0.4,
          type: 'triangle',
          envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.1 }
        }
      ]
    });

    // Add SELL sound
    this.soundConfigs.set(SoundType.SELL, {
      sequence: [
        {
          frequency: 440, // A4
          duration: 0.1,
          volume: 0.3,
          type: 'square',
          envelope: { attack: 0.01, decay: 0.04, sustain: 0.4, release: 0.05 }
        },
        {
          frequency: 330, // E4
          duration: 0.15,
          volume: 0.4,
          type: 'sawtooth',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.3, release: 0.07 }
        }
      ]
    });

    // UI sounds
    this.soundConfigs.set(SoundType.BUTTON_CLICK, {
      frequency: 1000,
      duration: 0.08,
      volume: 0.2,
      type: 'square',
      envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.05 }
    });

    this.soundConfigs.set(SoundType.BUTTON_HOVER, {
      frequency: 1200,
      duration: 0.05,
      volume: 0.15,
      type: 'sine',
      envelope: { attack: 0.01, decay: 0.01, sustain: 0.8, release: 0.03 }
    });

    this.soundConfigs.set(SoundType.SELECT, {
      frequency: 800,
      duration: 0.12,
      volume: 0.25,
      type: 'triangle',
      envelope: { attack: 0.01, decay: 0.04, sustain: 0.6, release: 0.07 },
      modulation: { frequency: 15, depth: 20 }
    });

    this.soundConfigs.set(SoundType.ERROR, {
      frequency: 220,
      duration: 0.25,
      volume: 0.4,
      type: 'square',
      envelope: { attack: 0.02, decay: 0.08, sustain: 0.3, release: 0.15 },
      modulation: { frequency: 5, depth: 40 }
    });

    // Game state sounds
    this.soundConfigs.set(SoundType.WAVE_START, {
      sequence: [
        {
          frequency: 440, // A4
          duration: 0.15,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.05, sustain: 0.6, release: 0.08 }
        },
        {
          frequency: 554, // C#5
          duration: 0.15,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.05, sustain: 0.6, release: 0.08 }
        },
        {
          frequency: 659, // E5
          duration: 0.3,
          volume: 0.5,
          type: 'triangle',
          envelope: { attack: 0.03, decay: 0.1, sustain: 0.5, release: 0.17 }
        }
      ]
    });

    this.soundConfigs.set(SoundType.WAVE_COMPLETE, {
      sequence: [
        {
          frequency: 659, // E5
          duration: 0.2,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.6, release: 0.12 }
        },
        {
          frequency: 784, // G5
          duration: 0.2,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.6, release: 0.12 }
        },
        {
          frequency: 1047, // C6
          duration: 0.4,
          volume: 0.5,
          type: 'triangle',
          envelope: { attack: 0.03, decay: 0.15, sustain: 0.4, release: 0.22 }
        }
      ]
    });

    this.soundConfigs.set(SoundType.VICTORY, {
      sequence: [
        {
          frequency: 523, // C5
          duration: 0.3,
          volume: 0.5,
          type: 'sine',
          envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.15 }
        },
        {
          frequency: 659, // E5
          duration: 0.3,
          volume: 0.5,
          type: 'sine',
          envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.15 }
        },
        {
          frequency: 784, // G5
          duration: 0.3,
          volume: 0.5,
          type: 'sine',
          envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.15 }
        },
        {
          frequency: 1047, // C6
          duration: 0.6,
          volume: 0.6,
          type: 'triangle',
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.35 }
        }
      ]
    });

    this.soundConfigs.set(SoundType.GAME_OVER, {
      sequence: [
        {
          frequency: 440, // A4
          duration: 0.4,
          volume: 0.5,
          type: 'sawtooth',
          envelope: { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.2 }
        },
        {
          frequency: 415, // G#4
          duration: 0.4,
          volume: 0.5,
          type: 'sawtooth',
          envelope: { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.2 }
        },
        {
          frequency: 370, // F#4
          duration: 0.8,
          volume: 0.6,
          type: 'sawtooth',
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.45 }
        }
      ]
    });

    // Pickup sounds
    this.soundConfigs.set(SoundType.HEALTH_PICKUP, {
      sequence: [
        {
          frequency: 784, // G5
          duration: 0.1,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.01, decay: 0.03, sustain: 0.7, release: 0.06 }
        },
        {
          frequency: 988, // B5
          duration: 0.15,
          volume: 0.4,
          type: 'triangle',
          envelope: { attack: 0.02, decay: 0.05, sustain: 0.6, release: 0.08 }
        }
      ]
    });

    this.soundConfigs.set(SoundType.CURRENCY_PICKUP, {
      frequency: 1319, // E6
      duration: 0.12,
      volume: 0.3,
      type: 'sine',
      envelope: { attack: 0.01, decay: 0.04, sustain: 0.5, release: 0.07 },
      modulation: { frequency: 25, depth: 15 }
    });

    this.soundConfigs.set(SoundType.POWERUP_PICKUP, {
      sequence: [
        {
          frequency: 1047, // C6
          duration: 0.08,
          volume: 0.3,
          type: 'triangle',
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.8, release: 0.05 }
        },
        {
          frequency: 1319, // E6
          duration: 0.08,
          volume: 0.3,
          type: 'triangle',
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.8, release: 0.05 }
        },
        {
          frequency: 1568, // G6
          duration: 0.16,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.6, release: 0.08 }
        }
      ]
    });

    // Player sounds
    this.soundConfigs.set(SoundType.PLAYER_LEVEL_UP, {
      sequence: [
        {
          frequency: 523, // C5
          duration: 0.2,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.7, release: 0.12 }
        },
        {
          frequency: 784, // G5
          duration: 0.2,
          volume: 0.4,
          type: 'sine',
          envelope: { attack: 0.02, decay: 0.06, sustain: 0.7, release: 0.12 }
        },
        {
          frequency: 1047, // C6
          duration: 0.3,
          volume: 0.5,
          type: 'triangle',
          envelope: { attack: 0.03, decay: 0.1, sustain: 0.6, release: 0.17 }
        },
        {
          frequency: 1568, // G6
          duration: 0.4,
          volume: 0.5,
          type: 'sine',
          envelope: { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.2 }
        }
      ]
    });

    this.soundConfigs.set(SoundType.PLAYER_HEAL, {
      frequency: 880, // A5
      duration: 0.25,
      volume: 0.3,
      type: 'sine',
      envelope: { attack: 0.03, decay: 0.08, sustain: 0.6, release: 0.14 },
      modulation: { frequency: 12, depth: 25 }
    });
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  private stopOldestSound(): void {
    const firstSound = this.activeSounds.values().next().value;
    if (firstSound) {
      try {
        firstSound.stop();
        this.activeSounds.delete(firstSound);
      } catch (error) {
        // Sound might already be stopped
        this.activeSounds.delete(firstSound);
      }
    }
  }

  stopAllSounds(): void {
    this.activeSounds.forEach(sound => {
      try {
        sound.stop();
      } catch (error) {
        // Sound might already be stopped
      }
    });
    this.activeSounds.clear();
  }

  playSound(soundType: SoundType, volumeMultiplier: number = 1): void {
    if (!this.isEnabled || this.audioContext.state === 'suspended') {
      return;
    }

    // More aggressive throttling for shooting sounds to prevent audio getting stuck
    const now = this.audioContext.currentTime;
    const lastTime = this.lastSoundTime.get(soundType) || 0;

    // Extra throttling for shooting sounds
    const minInterval = (soundType === SoundType.PLAYER_SHOOT || soundType === SoundType.TOWER_SHOOT)
      ? AUDIO_SYSTEM.shootingSoundInterval // 200ms minimum between shooting sounds
      : AUDIO_SYSTEM.minSoundInterval; // Default 50ms

    if (now - lastTime < minInterval) {
      return;
    }
    this.lastSoundTime.set(soundType, now);

    // Limit concurrent sounds
    if (this.activeSounds.size >= this.maxConcurrentSounds) {
      this.stopOldestSound();
    }

    const config = this.soundConfigs.get(soundType);
    if (!config) {
      console.warn(`Sound ${soundType} not found`);
      return;
    }

    try {
      if (config.sequence) {
        this.playSequence(config.sequence, volumeMultiplier);
      } else {
        this.playSingleSound(config, volumeMultiplier);
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundType}:`, error);
    }
  }

  private playSequence(sequence: SoundConfig[], volumeMultiplier: number): void {
    let currentTime = this.audioContext.currentTime;

    sequence.forEach(config => {
      this.playSingleSound(config, volumeMultiplier, currentTime);
      currentTime += (config.duration || 0.1) + 0.02; // Small gap between sounds
    });
  }

  private playSingleSound(config: SoundConfig, volumeMultiplier: number, _startTime?: number): void {
    const currentTime = _startTime || this.audioContext.currentTime;
    const duration = config.duration || 0.1;
    const volume = (config.volume || 0.5) * this.masterVolume * volumeMultiplier;


    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = config.type || 'sine';
    oscillator.frequency.setValueAtTime(config.frequency || 440, currentTime);

    // Track this sound for cleanup
    this.activeSounds.add(oscillator);

    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();

    // SIMPLIFIED: Just basic volume fade without complex envelopes
    gainNode.gain.setValueAtTime(volume, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

    // SIMPLIFIED: Skip modulation and noise for now to debug

    // Connect audio graph
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Clean up oscillator when done
    oscillator.onended = () => {
      this.activeSounds.delete(oscillator);
    };

    // Add error handling via event listener (onerror doesn't exist on OscillatorNode)
    try {
      oscillator.addEventListener('error', (error) => {
        console.error("Oscillator error:", error);
        this.activeSounds.delete(oscillator);
      });
    } catch (e) {
      // Ignore if event listener isn't supported
    }

    try {
      // Start and stop
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
    } catch (error) {
      console.error("Error starting/stopping oscillator:", error);
      this.activeSounds.delete(oscillator);
    }
  }


  // Convenience methods for common sound categories
  playUISound(soundType: SoundType): void {
    this.playSound(soundType, 0.7); // UI sounds slightly quieter
  }

  playCombatSound(soundType: SoundType): void {
    this.playSound(soundType, 1.0); // Combat sounds at normal volume
  }

  playGameStateSound(soundType: SoundType): void {
    this.playSound(soundType, 1.2); // Game state sounds slightly louder
  }

  // Create positional audio effect (simple stereo panning based on position)
  playSoundAtPosition(soundType: SoundType, position: { x: number; y: number }, viewportCenter: { x: number; y: number }): void {
    if (!this.isEnabled) return;

    // Extra throttling for positional sounds (100ms minimum between same type)
    const now = this.audioContext.currentTime;
    const lastTime = this.lastSoundTime.get(soundType) || 0;
    if (now - lastTime < 0.1) {
      return;
    }

    const config = this.soundConfigs.get(soundType);
    if (!config) return;

    // Calculate pan based on horizontal position relative to viewport center
    // const panValue = Math.max(-1, Math.min(1, (position.x - viewportCenter.x) / AUDIO_SYSTEM.spatialAudio.panDivisor));

    // Calculate volume based on distance from center
    const distance = Math.sqrt(
      Math.pow(position.x - viewportCenter.x, 2) +
      Math.pow(position.y - viewportCenter.y, 2)
    );
    const maxDistance = AUDIO_SYSTEM.spatialAudio.maxDistance; // Max distance for audio falloff
    const volumeMultiplier = Math.max(0.1, 1 - (distance / maxDistance));

    // For now, just play with volume adjustment
    // TODO: Add proper stereo panning in future update
    this.playSound(soundType, volumeMultiplier);
  }
}