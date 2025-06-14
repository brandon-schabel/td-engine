import { AudioManager, SoundType } from '../audio/AudioManager';
import { Camera } from './Camera';
import { Enemy } from '@/entities/Enemy';
import { Player } from '@/entities/Player';
import type { Vector2 } from '@/utils/Vector2';
import { AUDIO_CONFIG } from '../config/GameConfig';

/**
 * GameAudioHandler - Centralized audio management for game events
 * Handles spatial audio positioning and game state sound effects
 */
export class GameAudioHandler {
  private audioManager: AudioManager;
  private camera: Camera;
  private waveCompleteSoundPlayed: boolean = false;
  private victorySoundPlayed: boolean = false;

  constructor(audioManager: AudioManager, camera: Camera) {
    this.audioManager = audioManager;
    this.camera = camera;
  }

  /**
   * Calculate audio listener position based on camera
   */
  private getAudioListenerPosition(): Vector2 {
    const cameraPos = this.camera.getPosition();
    return {
      x: cameraPos.x + AUDIO_CONFIG.listenerOffset.x,
      y: cameraPos.y + AUDIO_CONFIG.listenerOffset.y
    };
  }

  /**
   * Play positioned sound effect
   */
  private playPositionedSound(soundType: SoundType, worldPosition: Vector2): void {
    const listenerPosition = this.getAudioListenerPosition();
    this.audioManager.playSoundAtPosition(soundType, worldPosition, listenerPosition);
  }

  /**
   * Player shooting sound
   */
  playPlayerShoot(playerPosition: Vector2): void {
    this.playPositionedSound(SoundType.PLAYER_SHOOT, playerPosition);
  }

  /**
   * Tower shooting sound
   */
  playTowerShoot(towerPosition: Vector2): void {
    this.playPositionedSound(SoundType.TOWER_SHOOT, towerPosition);
  }

  /**
   * Enemy hit sound (not killed)
   */
  playEnemyHit(enemyPosition: Vector2): void {
    this.playPositionedSound(SoundType.ENEMY_HIT, enemyPosition);
  }

  /**
   * Enemy death sound
   */
  playEnemyDeath(enemyPosition: Vector2): void {
    this.playPositionedSound(SoundType.ENEMY_DEATH, enemyPosition);
  }

  /**
   * Handle enemy damage/death audio with single method
   */
  handleEnemyDamage(enemy: Enemy, wasKilled: boolean): void {
    if (wasKilled) {
      this.playEnemyDeath(enemy.position);
    } else {
      this.playEnemyHit(enemy.position);
    }
  }

  /**
   * Tower placement sound
   */
  playTowerPlace(): void {
    this.audioManager.playSound(SoundType.TOWER_PLACE);
  }

  /**
   * Tower upgrade sound
   */
  playTowerUpgrade(): void {
    this.audioManager.playSound(SoundType.TOWER_UPGRADE);
  }

  /**
   * Player level up sound
   */
  playPlayerLevelUp(): void {
    this.audioManager.playSound(SoundType.PLAYER_LEVEL_UP);
  }

  /**
   * Health pickup sound
   */
  playHealthPickup(): void {
    this.audioManager.playSound(SoundType.HEALTH_PICKUP);
  }

  /**
   * Power-up pickup sound
   */
  playPowerUpPickup(): void {
    this.audioManager.playSound(SoundType.POWERUP_PICKUP);
  }

  /**
   * Wave start sound
   */
  playWaveStart(): void {
    this.audioManager.playGameStateSound(SoundType.WAVE_START);
  }

  /**
   * Wave complete sound (only once per wave)
   */
  playWaveComplete(): void {
    if (!this.waveCompleteSoundPlayed) {
      this.audioManager.playGameStateSound(SoundType.WAVE_COMPLETE);
      this.waveCompleteSoundPlayed = true;
    }
  }

  /**
   * Victory sound (only once)
   */
  playVictory(): void {
    if (!this.victorySoundPlayed) {
      this.audioManager.playGameStateSound(SoundType.VICTORY);
      this.victorySoundPlayed = true;
    }
  }

  /**
   * Game over sound
   */
  playGameOver(): void {
    this.audioManager.playGameStateSound(SoundType.GAME_OVER);
  }

  /**
   * Reset wave audio flags (call when starting new wave)
   */
  resetWaveAudioFlags(): void {
    this.waveCompleteSoundPlayed = false;
  }

  /**
   * Reset victory audio flag (call when restarting game)
   */
  resetVictoryAudioFlag(): void {
    this.victorySoundPlayed = false;
  }

  /**
   * Reset all audio flags
   */
  resetAllAudioFlags(): void {
    this.resetWaveAudioFlags();
    this.resetVictoryAudioFlag();
  }

  /**
   * Get the underlying audio manager for direct access when needed
   */
  getAudioManager(): AudioManager {
    return this.audioManager;
  }
}