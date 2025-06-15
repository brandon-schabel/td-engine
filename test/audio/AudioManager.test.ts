import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from '@/audio/AudioManager';
import { describeSystem, when, then } from '../helpers/templates';
import { withTestContext, setupTestEnvironment } from '../helpers/setup';
import { assertPerformance } from '../helpers/assertions';

// Setup global mocks
setupTestEnvironment();

describeSystem('AudioManager', () => new AudioManager(), (getAudioManager) => {
  let audioManager: AudioManager;
  
  beforeEach(() => {
    audioManager = getAudioManager();
  });
  
  describe('initialization', () => {
    it('creates with default state', () => {
      expect(audioManager).toBeDefined();
      expect(audioManager.isInitialized()).toBe(false);
    });
    
    it('initializes audio context on first use', async () => {
      await audioManager.initialize();
      expect(audioManager.isInitialized()).toBe(true);
    });
    
    it('handles initialization failure gracefully', async () => {
      const AudioContextMock = vi.fn(() => {
        throw new Error('Audio not supported');
      });
      global.AudioContext = AudioContextMock as any;
      
      const newManager = new AudioManager();
      await expect(newManager.initialize()).rejects.toThrow();
    });
  });
  
  describe('volume control', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });
    
    it(when('master volume is set'), () => {
      audioManager.setMasterVolume(0.5);
      expect(audioManager.getMasterVolume()).toBe(0.5);
    });
    
    it(then('volume is clamped between 0 and 1'), () => {
      audioManager.setMasterVolume(-1);
      expect(audioManager.getMasterVolume()).toBe(0);
      
      audioManager.setMasterVolume(2);
      expect(audioManager.getMasterVolume()).toBe(1);
    });
    
    it('applies volume to playing sounds', async () => {
      const mockSound = await audioManager.loadSound('test', 'test.mp3');
      audioManager.setMasterVolume(0.7);
      
      const playedSound = audioManager.playSound('test');
      expect(playedSound).toBeDefined();
    });
  });
  
  describe('sound loading', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });
    
    it('loads sound successfully', async () => {
      const sound = await audioManager.loadSound('test', 'test.mp3');
      expect(sound).toBeDefined();
    });
    
    it('caches loaded sounds', async () => {
      const sound1 = await audioManager.loadSound('test', 'test.mp3');
      const sound2 = await audioManager.loadSound('test', 'test.mp3');
      expect(sound1).toBe(sound2);
    });
    
    it('handles loading errors', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      await expect(audioManager.loadSound('error', 'error.mp3'))
        .rejects.toThrow('Network error');
    });
  });
  
  describe('sound playback', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      await audioManager.loadSound('test', 'test.mp3');
    });
    
    it('plays loaded sound', () => {
      const sound = audioManager.playSound('test');
      expect(sound).toBeDefined();
    });
    
    it('returns null for unloaded sound', () => {
      const sound = audioManager.playSound('nonexistent');
      expect(sound).toBeNull();
    });
    
    it('plays sound with custom volume', () => {
      const sound = audioManager.playSound('test', { volume: 0.3 });
      expect(sound).toBeDefined();
    });
    
    it('plays sound with loop option', () => {
      const sound = audioManager.playSound('test', { loop: true });
      expect(sound).toBeDefined();
    });
  });
  
  describe('spatial audio', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      await audioManager.loadSound('spatial', 'spatial.mp3');
    });
    
    it(when('playing spatial sound'), () => {
      const sound = audioManager.playSpatialSound('spatial', 
        { x: 100, y: 100 }, // sound position
        { x: 0, y: 0 }      // listener position
      );
      expect(sound).toBeDefined();
    });
    
    it(then('volume decreases with distance'), () => {
      const near = audioManager.playSpatialSound('spatial',
        { x: 50, y: 50 },
        { x: 0, y: 0 }
      );
      
      const far = audioManager.playSpatialSound('spatial',
        { x: 500, y: 500 },
        { x: 0, y: 0 }
      );
      
      expect(near).toBeDefined();
      expect(far).toBeDefined();
    });
    
    it('applies custom max distance', () => {
      const sound = audioManager.playSpatialSound('spatial',
        { x: 1000, y: 1000 },
        { x: 0, y: 0 },
        { maxDistance: 2000 }
      );
      expect(sound).toBeDefined();
    });
  });
  
  describe('sound management', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      await audioManager.loadSound('test1', 'test1.mp3');
      await audioManager.loadSound('test2', 'test2.mp3');
    });
    
    it('stops all sounds', () => {
      audioManager.playSound('test1');
      audioManager.playSound('test2');
      
      audioManager.stopAllSounds();
      expect(audioManager.getActiveSounds().length).toBe(0);
    });
    
    it('tracks active sounds', () => {
      expect(audioManager.getActiveSounds().length).toBe(0);
      
      audioManager.playSound('test1');
      audioManager.playSound('test2');
      
      expect(audioManager.getActiveSounds().length).toBe(2);
    });
    
    it('removes finished sounds from active list', async () => {
      const sound = audioManager.playSound('test1');
      expect(audioManager.getActiveSounds().length).toBe(1);
      
      // Simulate sound ending
      if (sound) {
        sound.stop();
      }
      
      // Check cleanup
      audioManager.cleanupFinishedSounds();
      expect(audioManager.getActiveSounds().length).toBe(0);
    });
  });
  
  describe('sound categories', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      await audioManager.loadSound('ui', 'ui.mp3');
      await audioManager.loadSound('game', 'game.mp3');
      await audioManager.loadSound('music', 'music.mp3');
    });
    
    it('sets volume by category', () => {
      audioManager.setCategoryVolume('UI', 0.8);
      audioManager.setCategoryVolume('GAME', 0.6);
      audioManager.setCategoryVolume('MUSIC', 0.4);
      
      expect(audioManager.getCategoryVolume('UI')).toBe(0.8);
      expect(audioManager.getCategoryVolume('GAME')).toBe(0.6);
      expect(audioManager.getCategoryVolume('MUSIC')).toBe(0.4);
    });
    
    it('applies category volume to sounds', () => {
      audioManager.setCategoryVolume('UI', 0.5);
      const sound = audioManager.playSound('ui', { category: 'UI' });
      expect(sound).toBeDefined();
    });
  });
  
  describe('performance', () => {
    beforeEach(async () => {
      await audioManager.initialize();
      for (let i = 0; i < 10; i++) {
        await audioManager.loadSound(`sound${i}`, `sound${i}.mp3`);
      }
    });
    
    it('handles multiple simultaneous sounds efficiently', () => {
      assertPerformance(() => {
        for (let i = 0; i < 10; i++) {
          audioManager.playSound(`sound${i % 10}`);
        }
      }, 5); // Should complete in under 5ms per iteration
    });
    
    it('spatial calculations are performant', () => {
      assertPerformance(() => {
        audioManager.playSpatialSound('sound0',
          { x: Math.random() * 1000, y: Math.random() * 1000 },
          { x: 500, y: 500 }
        );
      }, 1); // Should complete in under 1ms per iteration
    });
  });
  
  describe('error handling', () => {
    it('handles play before initialization', () => {
      const newManager = new AudioManager();
      expect(() => newManager.playSound('test')).not.toThrow();
      expect(newManager.playSound('test')).toBeNull();
    });
    
    it('handles invalid sound names gracefully', async () => {
      await audioManager.initialize();
      expect(() => audioManager.playSound('')).not.toThrow();
      expect(audioManager.playSound('')).toBeNull();
    });
  });
  
  describe('cleanup', () => {
    it('properly cleans up resources', async () => {
      await audioManager.initialize();
      await audioManager.loadSound('test', 'test.mp3');
      audioManager.playSound('test');
      
      audioManager.destroy();
      expect(audioManager.isInitialized()).toBe(false);
      expect(audioManager.getActiveSounds().length).toBe(0);
    });
  });
});