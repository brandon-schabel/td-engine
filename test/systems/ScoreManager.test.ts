/**
 * Unit tests for ScoreManager
 * Tests score persistence and statistics with mocked localStorage
 */

import '../setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '@/systems/ScoreManager';
import { createMockGameStats } from '../helpers/mockData';
import { BiomeType } from '@/types/MapData';

describe('ScoreManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveScore', () => {
    it('should save a score and return it with rank', () => {
      const stats = createMockGameStats();
      const entry = ScoreManager.saveScore(stats);

      expect(entry).toMatchObject(stats);
      expect(entry.id).toBeDefined();
      expect(entry.rank).toBe(1);
    });

    it('should generate unique IDs', () => {
      const stats1 = createMockGameStats();
      const stats2 = createMockGameStats();

      const entry1 = ScoreManager.saveScore(stats1);
      const entry2 = ScoreManager.saveScore(stats2);

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should sort scores by score descending', () => {
      ScoreManager.saveScore(createMockGameStats({ score: 500 }));
      ScoreManager.saveScore(createMockGameStats({ score: 1000 }));
      ScoreManager.saveScore(createMockGameStats({ score: 750 }));

      const scores = ScoreManager.getScores();

      expect(scores[0].score).toBe(1000);
      expect(scores[1].score).toBe(750);
      expect(scores[2].score).toBe(500);
    });

    it('should sort by wave if scores are equal', () => {
      ScoreManager.saveScore(createMockGameStats({ score: 1000, wave: 5 }));
      ScoreManager.saveScore(createMockGameStats({ score: 1000, wave: 10 }));
      ScoreManager.saveScore(createMockGameStats({ score: 1000, wave: 7 }));

      const scores = ScoreManager.getScores();

      expect(scores[0].wave).toBe(10);
      expect(scores[1].wave).toBe(7);
      expect(scores[2].wave).toBe(5);
    });

    it('should limit stored scores to MAX_SCORES', () => {
      // Add more than MAX_SCORES (50)
      for (let i = 0; i < 60; i++) {
        ScoreManager.saveScore(createMockGameStats({ score: i }));
      }

      const scores = ScoreManager.getScores();
      expect(scores).toHaveLength(50);

      // Should keep highest scores
      expect(scores[0].score).toBe(59);
      expect(scores[49].score).toBe(10);
    });

    it('should assign correct ranks', () => {
      ScoreManager.saveScore(createMockGameStats({ score: 500 }));
      ScoreManager.saveScore(createMockGameStats({ score: 1000 }));
      ScoreManager.saveScore(createMockGameStats({ score: 750 }));

      const scores = ScoreManager.getScores();

      expect(scores[0].rank).toBe(1);
      expect(scores[1].rank).toBe(2);
      expect(scores[2].rank).toBe(3);
    });
  });

  describe('getScores', () => {
    it('should return empty array when no scores', () => {
      expect(ScoreManager.getScores()).toEqual([]);
    });

    it('should return all saved scores', () => {
      ScoreManager.saveScore(createMockGameStats());
      ScoreManager.saveScore(createMockGameStats());
      ScoreManager.saveScore(createMockGameStats());

      expect(ScoreManager.getScores()).toHaveLength(3);
    });

    it('should handle corrupted localStorage', () => {
      localStorage.setItem('towerDefenseScores', 'invalid json');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const scores = ScoreManager.getScores();

      expect(scores).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle non-array data in localStorage', () => {
      localStorage.setItem('towerDefenseScores', JSON.stringify({ notAnArray: true }));
      
      expect(ScoreManager.getScores()).toEqual([]);
    });
  });

  describe('getTopScores', () => {
    beforeEach(() => {
      // Add test scores
      for (let i = 1; i <= 20; i++) {
        ScoreManager.saveScore(createMockGameStats({ score: i * 100 }));
      }
    });

    it('should return top 10 scores by default', () => {
      const topScores = ScoreManager.getTopScores();

      expect(topScores).toHaveLength(10);
      expect(topScores[0].score).toBe(2000);
      expect(topScores[9].score).toBe(1100);
    });

    it('should return custom limit', () => {
      const top5 = ScoreManager.getTopScores(5);

      expect(top5).toHaveLength(5);
      expect(top5[0].score).toBe(2000);
      expect(top5[4].score).toBe(1600);
    });

    it('should handle limit larger than available scores', () => {
      localStorage.clear();
      ScoreManager.saveScore(createMockGameStats());
      ScoreManager.saveScore(createMockGameStats());

      const topScores = ScoreManager.getTopScores(10);
      expect(topScores).toHaveLength(2);
    });
  });

  describe('getPersonalBest', () => {
    it('should return highest score', () => {
      ScoreManager.saveScore(createMockGameStats({ score: 500 }));
      ScoreManager.saveScore(createMockGameStats({ score: 1000 }));
      ScoreManager.saveScore(createMockGameStats({ score: 750 }));

      const best = ScoreManager.getPersonalBest();

      expect(best).not.toBeNull();
      expect(best?.score).toBe(1000);
    });

    it('should return null when no scores', () => {
      expect(ScoreManager.getPersonalBest()).toBeNull();
    });
  });

  describe('getAverageScore', () => {
    it('should calculate average score', () => {
      ScoreManager.saveScore(createMockGameStats({ score: 1000 }));
      ScoreManager.saveScore(createMockGameStats({ score: 2000 }));
      ScoreManager.saveScore(createMockGameStats({ score: 3000 }));

      expect(ScoreManager.getAverageScore()).toBe(2000);
    });

    it('should round to nearest integer', () => {
      ScoreManager.saveScore(createMockGameStats({ score: 1000 }));
      ScoreManager.saveScore(createMockGameStats({ score: 1500 }));

      expect(ScoreManager.getAverageScore()).toBe(1250);
    });

    it('should return 0 when no scores', () => {
      expect(ScoreManager.getAverageScore()).toBe(0);
    });
  });

  describe('getTotalGamesPlayed', () => {
    it('should return total number of games', () => {
      expect(ScoreManager.getTotalGamesPlayed()).toBe(0);

      ScoreManager.saveScore(createMockGameStats());
      expect(ScoreManager.getTotalGamesPlayed()).toBe(1);

      ScoreManager.saveScore(createMockGameStats());
      ScoreManager.saveScore(createMockGameStats());
      expect(ScoreManager.getTotalGamesPlayed()).toBe(3);
    });
  });

  describe('clearScores', () => {
    it('should remove all scores', () => {
      ScoreManager.saveScore(createMockGameStats());
      ScoreManager.saveScore(createMockGameStats());

      ScoreManager.clearScores();

      expect(ScoreManager.getScores()).toEqual([]);
      expect(localStorage.getItem('towerDefenseScores')).toBeNull();
    });
  });

  describe('getScoreStats', () => {
    it('should return comprehensive statistics', () => {
      ScoreManager.saveScore(createMockGameStats({ 
        score: 1000, 
        wave: 10, 
        gameTime: 300 
      }));
      ScoreManager.saveScore(createMockGameStats({ 
        score: 2000, 
        wave: 15, 
        gameTime: 600 
      }));
      ScoreManager.saveScore(createMockGameStats({ 
        score: 1500, 
        wave: 12, 
        gameTime: 450 
      }));

      const stats = ScoreManager.getScoreStats();

      expect(stats).toEqual({
        totalGames: 3,
        personalBest: 2000,
        averageScore: 1500,
        highestWave: 15,
        totalPlayTime: 1350
      });
    });

    it('should handle empty scores', () => {
      const stats = ScoreManager.getScoreStats();

      expect(stats).toEqual({
        totalGames: 0,
        personalBest: 0,
        averageScore: 0,
        highestWave: 0,
        totalPlayTime: 0
      });
    });

    it('should round total play time', () => {
      ScoreManager.saveScore(createMockGameStats({ gameTime: 123.456 }));
      ScoreManager.saveScore(createMockGameStats({ gameTime: 234.567 }));

      const stats = ScoreManager.getScoreStats();
      expect(stats.totalPlayTime).toBe(358); // Rounded
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage save errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      ScoreManager.saveScore(createMockGameStats());

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save scores to localStorage:',
        expect.any(Error)
      );

      // Restore
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('data integrity', () => {
    it('should preserve all game stats fields', () => {
      const stats = createMockGameStats({
        score: 12345,
        wave: 25,
        currency: 999,
        enemiesKilled: 250,
        towersBuilt: 15,
        playerLevel: 10,
        gameTime: 1800,
        date: Date.now(),
        mapBiome: BiomeType.DESERT,
        mapDifficulty: 'hard'
      });

      ScoreManager.saveScore(stats);
      const saved = ScoreManager.getScores()[0];

      expect(saved).toMatchObject(stats);
    });

    it('should handle concurrent saves', () => {
      const scores = [];
      for (let i = 0; i < 10; i++) {
        scores.push(ScoreManager.saveScore(createMockGameStats({ score: i * 100 })));
      }

      const savedScores = ScoreManager.getScores();
      expect(savedScores).toHaveLength(10);
    });
  });
});