import '../../setup';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScoreManager, type GameStats, type ScoreboardEntry } from '@/systems/ScoreManager';

describe('ScoreManager', () => {
  const createMockStats = (overrides: Partial<GameStats> = {}): GameStats => ({
    score: 1000,
    wave: 5,
    currency: 200,
    enemiesKilled: 50,
    towersBuilt: 10,
    playerLevel: 3,
    gameTime: 300,
    date: Date.now(),
    mapBiome: 'forest',
    mapDifficulty: 'normal',
    ...overrides
  });

  beforeEach(() => {
    ScoreManager.clearScores();
    vi.clearAllMocks();
  });

  afterEach(() => {
    ScoreManager.clearScores();
  });

  describe('saveScore', () => {
    test('saves a new score entry', () => {
      const stats = createMockStats();
      const entry = ScoreManager.saveScore(stats);
      
      expect(entry).toMatchObject(stats);
      expect(entry.id).toBeDefined();
      expect(entry.rank).toBe(1);
    });

    test('generates unique ids', () => {
      const stats = createMockStats();
      const entry1 = ScoreManager.saveScore(stats);
      const entry2 = ScoreManager.saveScore(stats);
      
      expect(entry1.id).not.toBe(entry2.id);
    });

    test('sorts scores by score descending', () => {
      ScoreManager.saveScore(createMockStats({ score: 500 }));
      ScoreManager.saveScore(createMockStats({ score: 1500 }));
      ScoreManager.saveScore(createMockStats({ score: 1000 }));
      
      const scores = ScoreManager.getScores();
      expect(scores[0].score).toBe(1500);
      expect(scores[1].score).toBe(1000);
      expect(scores[2].score).toBe(500);
    });

    test('sorts by wave if scores are equal', () => {
      ScoreManager.saveScore(createMockStats({ score: 1000, wave: 3 }));
      ScoreManager.saveScore(createMockStats({ score: 1000, wave: 5 }));
      ScoreManager.saveScore(createMockStats({ score: 1000, wave: 4 }));
      
      const scores = ScoreManager.getScores();
      expect(scores[0].wave).toBe(5);
      expect(scores[1].wave).toBe(4);
      expect(scores[2].wave).toBe(3);
    });

    test('assigns correct ranks', () => {
      ScoreManager.saveScore(createMockStats({ score: 500 }));
      ScoreManager.saveScore(createMockStats({ score: 1500 }));
      ScoreManager.saveScore(createMockStats({ score: 1000 }));
      
      const scores = ScoreManager.getScores();
      expect(scores[0].rank).toBe(1);
      expect(scores[1].rank).toBe(2);
      expect(scores[2].rank).toBe(3);
    });

    test('limits stored scores to MAX_SCORES', () => {
      // Save more than MAX_SCORES (50)
      for (let i = 0; i < 55; i++) {
        ScoreManager.saveScore(createMockStats({ score: i }));
      }
      
      const scores = ScoreManager.getScores();
      expect(scores.length).toBe(50);
      // Should keep the highest scores
      expect(scores[0].score).toBe(54);
      expect(scores[49].score).toBe(5);
    });
  });

  describe('getScores', () => {
    test('returns empty array when no scores', () => {
      expect(ScoreManager.getScores()).toEqual([]);
    });

    test('returns all saved scores', () => {
      ScoreManager.saveScore(createMockStats({ score: 100 }));
      ScoreManager.saveScore(createMockStats({ score: 200 }));
      
      const scores = ScoreManager.getScores();
      expect(scores).toHaveLength(2);
    });

    test('handles corrupted localStorage data', () => {
      localStorage.setItem('towerDefenseScores', 'invalid json');
      expect(ScoreManager.getScores()).toEqual([]);
    });

    test('handles non-array localStorage data', () => {
      localStorage.setItem('towerDefenseScores', '{"not": "an array"}');
      expect(ScoreManager.getScores()).toEqual([]);
    });
  });

  describe('getTopScores', () => {
    beforeEach(() => {
      for (let i = 1; i <= 20; i++) {
        ScoreManager.saveScore(createMockStats({ score: i * 100 }));
      }
    });

    test('returns top 10 scores by default', () => {
      const topScores = ScoreManager.getTopScores();
      expect(topScores).toHaveLength(10);
      expect(topScores[0].score).toBe(2000);
      expect(topScores[9].score).toBe(1100);
    });

    test('returns specified number of top scores', () => {
      const topScores = ScoreManager.getTopScores(5);
      expect(topScores).toHaveLength(5);
      expect(topScores[0].score).toBe(2000);
      expect(topScores[4].score).toBe(1600);
    });

    test('returns all scores if limit exceeds total', () => {
      const topScores = ScoreManager.getTopScores(30);
      expect(topScores).toHaveLength(20);
    });
  });

  describe('getPersonalBest', () => {
    test('returns null when no scores', () => {
      expect(ScoreManager.getPersonalBest()).toBeNull();
    });

    test('returns highest score', () => {
      ScoreManager.saveScore(createMockStats({ score: 500 }));
      ScoreManager.saveScore(createMockStats({ score: 1500 }));
      ScoreManager.saveScore(createMockStats({ score: 1000 }));
      
      const best = ScoreManager.getPersonalBest();
      expect(best?.score).toBe(1500);
    });
  });

  describe('getAverageScore', () => {
    test('returns 0 when no scores', () => {
      expect(ScoreManager.getAverageScore()).toBe(0);
    });

    test('calculates correct average', () => {
      ScoreManager.saveScore(createMockStats({ score: 1000 }));
      ScoreManager.saveScore(createMockStats({ score: 2000 }));
      ScoreManager.saveScore(createMockStats({ score: 3000 }));
      
      expect(ScoreManager.getAverageScore()).toBe(2000);
    });

    test('rounds average to nearest integer', () => {
      ScoreManager.saveScore(createMockStats({ score: 1000 }));
      ScoreManager.saveScore(createMockStats({ score: 1500 }));
      
      expect(ScoreManager.getAverageScore()).toBe(1250);
    });
  });

  describe('getTotalGamesPlayed', () => {
    test('returns 0 when no games', () => {
      expect(ScoreManager.getTotalGamesPlayed()).toBe(0);
    });

    test('returns correct count', () => {
      ScoreManager.saveScore(createMockStats());
      ScoreManager.saveScore(createMockStats());
      ScoreManager.saveScore(createMockStats());
      
      expect(ScoreManager.getTotalGamesPlayed()).toBe(3);
    });
  });

  describe('clearScores', () => {
    test('removes all scores', () => {
      ScoreManager.saveScore(createMockStats());
      ScoreManager.saveScore(createMockStats());
      
      ScoreManager.clearScores();
      
      expect(ScoreManager.getScores()).toEqual([]);
      expect(localStorage.getItem('towerDefenseScores')).toBeNull();
    });
  });

  describe('getScoreStats', () => {
    test('returns zeros when no scores', () => {
      const stats = ScoreManager.getScoreStats();
      
      expect(stats).toEqual({
        totalGames: 0,
        personalBest: 0,
        averageScore: 0,
        highestWave: 0,
        totalPlayTime: 0
      });
    });

    test('calculates all statistics correctly', () => {
      ScoreManager.saveScore(createMockStats({ 
        score: 1000, 
        wave: 5, 
        gameTime: 300 
      }));
      ScoreManager.saveScore(createMockStats({ 
        score: 2000, 
        wave: 8, 
        gameTime: 450 
      }));
      ScoreManager.saveScore(createMockStats({ 
        score: 1500, 
        wave: 6, 
        gameTime: 375 
      }));
      
      const stats = ScoreManager.getScoreStats();
      
      expect(stats.totalGames).toBe(3);
      expect(stats.personalBest).toBe(2000);
      expect(stats.averageScore).toBe(1500);
      expect(stats.highestWave).toBe(8);
      expect(stats.totalPlayTime).toBe(1125); // 300 + 450 + 375
    });
  });

  describe('localStorage integration', () => {
    test('persists scores across instances', () => {
      ScoreManager.saveScore(createMockStats({ score: 1234 }));
      
      // Simulate page reload by getting scores again
      const scores = ScoreManager.getScores();
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(1234);
    });

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });
      
      // Mock console.warn to verify error handling
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Should not throw
      expect(() => {
        ScoreManager.saveScore(createMockStats());
      }).not.toThrow();
      
      // Should have logged a warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save scores'),
        expect.any(Error)
      );
      
      // Restore mocks
      localStorage.setItem = originalSetItem;
      warnSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    test('handles very large scores', () => {
      const largeScore = createMockStats({ score: Number.MAX_SAFE_INTEGER });
      const entry = ScoreManager.saveScore(largeScore);
      
      expect(entry.score).toBe(Number.MAX_SAFE_INTEGER);
    });

    test('handles zero scores', () => {
      ScoreManager.saveScore(createMockStats({ score: 0 }));
      const scores = ScoreManager.getScores();
      
      expect(scores[0].score).toBe(0);
    });

    test('preserves all game statistics', () => {
      const fullStats = createMockStats({
        score: 12345,
        wave: 15,
        currency: 567,
        enemiesKilled: 234,
        towersBuilt: 45,
        playerLevel: 7,
        gameTime: 1234,
        date: 1234567890,
        mapBiome: 'desert',
        mapDifficulty: 'hard'
      });
      
      ScoreManager.saveScore(fullStats);
      const saved = ScoreManager.getScores()[0];
      
      expect(saved).toMatchObject(fullStats);
    });
  });
});