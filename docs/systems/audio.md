# Audio System

The audio system in TD Engine uses the Web Audio API to generate dynamic sounds procedurally, eliminating the need for audio file assets while providing rich, responsive audio feedback.

## Architecture Overview

```
AudioManager
  ├─> AudioContext (Web Audio API)
  ├─> Sound Configurations (procedural definitions)
  ├─> Sound Generation (oscillators, envelopes)
  ├─> Spatial Audio (positional sounds)
  └─> Performance Management (throttling, pooling)
```

## Core Components

### AudioManager Class

```typescript
class AudioManager {
  private audioContext: AudioContext;
  private masterVolume: number = 0.7;
  private soundConfigs: Map<SoundType, SoundConfig> = new Map();
  private isEnabled: boolean = true;
  private activeSounds: Set<AudioBufferSourceNode | OscillatorNode> = new Set();
  private lastSoundTime: Map<SoundType, number> = new Map();
  private maxConcurrentSounds: number = 20;
}
```

### Sound Types

```typescript
enum SoundType {
  // Combat sounds
  PLAYER_SHOOT = 'player_shoot',
  TOWER_SHOOT = 'tower_shoot',
  ENEMY_HIT = 'enemy_hit',
  ENEMY_DEATH = 'enemy_death',
  
  // UI sounds
  BUTTON_CLICK = 'button_click',
  SELECT = 'select',
  ERROR = 'error',
  
  // Game state sounds
  WAVE_START = 'wave_start',
  WAVE_COMPLETE = 'wave_complete',
  GAME_OVER = 'game_over',
  VICTORY = 'victory',
  
  // Pickup sounds
  HEALTH_PICKUP = 'health_pickup',
  POWERUP_PICKUP = 'powerup_pickup'
}
```

## Sound Generation

### Sound Configuration

Each sound is defined by parameters rather than audio files:

```typescript
interface SoundConfig {
  frequency?: number;         // Base frequency in Hz
  duration?: number;          // Length in seconds
  volume?: number;           // 0-1 volume level
  type?: OscillatorType;     // 'sine' | 'square' | 'sawtooth' | 'triangle'
  envelope?: {               // ADSR envelope
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  modulation?: {             // Frequency modulation
    frequency: number;
    depth: number;
  };
  noise?: boolean;           // Add noise component
  sequence?: SoundConfig[];  // Multiple sounds in sequence
}
```

### Example Sound Definitions

```typescript
// Player shoot - sharp, high-pitched
this.soundConfigs.set(SoundType.PLAYER_SHOOT, {
  frequency: 800,
  duration: 0.15,
  volume: 0.4,
  type: 'triangle',
  envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.09 },
  modulation: { frequency: 20, depth: 50 }
});

// Victory - ascending melody
this.soundConfigs.set(SoundType.VICTORY, {
  sequence: [
    { frequency: 523, duration: 0.3, type: 'sine' },  // C5
    { frequency: 659, duration: 0.3, type: 'sine' },  // E5
    { frequency: 784, duration: 0.3, type: 'sine' },  // G5
    { frequency: 1047, duration: 0.6, type: 'triangle' } // C6
  ]
});
```

## Sound Synthesis

### Basic Sound Generation

```typescript
private playSingleSound(config: SoundConfig, volumeMultiplier: number): void {
  const oscillator = this.audioContext.createOscillator();
  const gainNode = this.audioContext.createGain();
  
  // Configure oscillator
  oscillator.type = config.type || 'sine';
  oscillator.frequency.setValueAtTime(
    config.frequency || 440, 
    this.audioContext.currentTime
  );
  
  // Apply volume envelope
  const volume = (config.volume || 0.5) * this.masterVolume * volumeMultiplier;
  gainNode.gain.setValueAtTime(volume, currentTime);
  gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
  
  // Connect and play
  oscillator.connect(gainNode);
  gainNode.connect(this.audioContext.destination);
  oscillator.start(currentTime);
  oscillator.stop(currentTime + duration);
}
```

### Advanced Techniques

#### ADSR Envelope
```typescript
private applyEnvelope(gainNode: GainNode, envelope: Envelope, 
                     startTime: number, duration: number, volume: number): void {
  const attackTime = startTime + envelope.attack;
  const decayTime = attackTime + envelope.decay;
  const releaseTime = startTime + duration - envelope.release;
  
  // Attack
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, attackTime);
  
  // Decay
  gainNode.gain.linearRampToValueAtTime(volume * envelope.sustain, decayTime);
  
  // Sustain (holds at sustain level)
  
  // Release
  gainNode.gain.setValueAtTime(volume * envelope.sustain, releaseTime);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
}
```

#### Frequency Modulation
```typescript
private addModulation(oscillator: OscillatorNode, modulation: Modulation): void {
  const modulator = this.audioContext.createOscillator();
  const modulationGain = this.audioContext.createGain();
  
  modulator.frequency.value = modulation.frequency;
  modulationGain.gain.value = modulation.depth;
  
  modulator.connect(modulationGain);
  modulationGain.connect(oscillator.frequency);
  modulator.start();
}
```

#### Noise Generation
```typescript
private createNoiseNode(duration: number, volume: number): AudioBufferSourceNode {
  const bufferSize = this.audioContext.sampleRate * duration;
  const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
  const output = buffer.getChannelData(0);
  
  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * volume;
  }
  
  const noiseNode = this.audioContext.createBufferSource();
  noiseNode.buffer = buffer;
  return noiseNode;
}
```

## Spatial Audio

Position-based audio with simple stereo panning:

```typescript
playSoundAtPosition(soundType: SoundType, position: Vector2, viewportCenter: Vector2): void {
  // Calculate pan based on horizontal position
  const panValue = Math.max(-1, Math.min(1, 
    (position.x - viewportCenter.x) / 500
  ));
  
  // Calculate volume based on distance
  const distance = Math.sqrt(
    Math.pow(position.x - viewportCenter.x, 2) + 
    Math.pow(position.y - viewportCenter.y, 2)
  );
  const maxDistance = 800;
  const volumeMultiplier = Math.max(0.1, 1 - (distance / maxDistance));
  
  // TODO: Implement actual panning with StereoPannerNode
  this.playSound(soundType, volumeMultiplier);
}
```

## Performance Management

### Sound Throttling

Prevent audio overload with minimum intervals:

```typescript
playSound(soundType: SoundType, volumeMultiplier: number = 1): void {
  const now = this.audioContext.currentTime;
  const lastTime = this.lastSoundTime.get(soundType) || 0;
  
  // Throttle shooting sounds more aggressively
  let minInterval = 0.05; // 50ms default
  if (soundType === SoundType.PLAYER_SHOOT || soundType === SoundType.TOWER_SHOOT) {
    minInterval = 0.2; // 200ms for shooting
  }
  
  if (now - lastTime < minInterval) {
    return; // Skip this sound
  }
  
  this.lastSoundTime.set(soundType, now);
  // ... play sound
}
```

### Concurrent Sound Limiting

```typescript
private stopOldestSound(): void {
  if (this.activeSounds.size >= this.maxConcurrentSounds) {
    const firstSound = this.activeSounds.values().next().value;
    if (firstSound) {
      firstSound.stop();
      this.activeSounds.delete(firstSound);
    }
  }
}
```

### Cleanup

```typescript
oscillator.onended = () => {
  this.activeSounds.delete(oscillator);
};
```

## Browser Compatibility

### Audio Context Creation
```typescript
constructor() {
  // Handle both standard and webkit prefix
  if (typeof window !== 'undefined' && 
      (window.AudioContext || (window as any).webkitAudioContext)) {
    this.audioContext = new (window.AudioContext || 
                           (window as any).webkitAudioContext)();
  } else {
    // Create mock for testing/server
    this.audioContext = this.createMockAudioContext();
  }
}
```

### Resume on User Interaction
```typescript
private resumeAudioContext(): void {
  if (this.audioContext.state === 'suspended') {
    this.audioContext.resume();
  }
}

// In constructor
document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
```

## Usage Examples

### Basic Usage
```typescript
const audioManager = new AudioManager();

// Play a sound
audioManager.playSound(SoundType.BUTTON_CLICK);

// Play with volume adjustment
audioManager.playUISound(SoundType.SELECT); // 70% volume

// Positional sound
audioManager.playSoundAtPosition(
  SoundType.ENEMY_HIT, 
  enemy.position, 
  camera.getCenter()
);
```

### Integration with Game Systems
```typescript
// In Game class
if (projectile.hitEnemy) {
  this.audioHandler.playEnemyHit(enemy.position);
  
  if (!enemy.isAlive) {
    this.audioHandler.playEnemyDeath(enemy.position);
  }
}
```

## Configuration

### Volume Settings
```typescript
// Master volume
audioManager.setMasterVolume(0.8); // 0-1 range

// Enable/disable all sounds
audioManager.setEnabled(false); // Mute all

// Category-specific volumes (via multipliers)
audioManager.playUISound(sound);     // 0.7x multiplier
audioManager.playCombatSound(sound);  // 1.0x multiplier
audioManager.playGameStateSound(sound); // 1.2x multiplier
```

### Sound Parameters
```typescript
const AUDIO_CONFIG = {
  masterVolume: 0.7,
  maxConcurrentSounds: 20,
  minSoundInterval: 0.05,      // 50ms between same sound
  shootingSoundInterval: 0.2,   // 200ms between shooting
  spatialAudio: {
    panDivisor: 500,           // Horizontal distance for full pan
    maxDistance: 800           // Maximum distance for volume falloff
  }
};
```

## Best Practices

1. **Throttle Appropriately**: Different sounds need different throttling
2. **Clean Up**: Always remove ended sounds from tracking
3. **Volume Balance**: Test sounds at different master volumes
4. **User Experience**: Always handle suspended audio contexts
5. **Performance**: Limit concurrent sounds on lower-end devices

## Common Patterns

### Sound Sequences
```typescript
// Multi-part sounds for complex effects
{
  sequence: [
    { frequency: 200, duration: 0.1, type: 'square' },
    { frequency: 150, duration: 0.15, type: 'sawtooth', noise: true }
  ]
}
```

### Dynamic Sounds
```typescript
// Vary sound based on game state
const frequency = 400 + (player.level * 50); // Higher pitch at higher levels
const duration = Math.max(0.1, 0.3 - (player.speed * 0.01)); // Shorter at higher speed
```

### Sound Categories
```typescript
playUISound(type: SoundType): void {
  this.playSound(type, 0.7); // UI sounds at 70% volume
}

playCombatSound(type: SoundType): void {
  this.playSound(type, 1.0); // Combat at full volume
}
```