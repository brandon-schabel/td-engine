export interface GameStats {
  score: number;
  wave: number;
  currency: number;
  enemiesKilled: number;
  towersBuilt: number;
  playerLevel: number;
  gameTime: number; // in seconds
  date: number; // timestamp
  mapBiome: string;
  mapDifficulty: string;
}

export interface ScoreboardEntry extends GameStats {
  id: string;
  rank?: number;
}

export class ScoreManager {
  private static readonly STORAGE_KEY = 'towerDefenseScores';
  private static readonly MAX_SCORES = 50;

  static saveScore(stats: GameStats): ScoreboardEntry {
    const entry: ScoreboardEntry = {
      ...stats,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    const scores = this.getScores();
    scores.push(entry);
    
    // Sort by score (descending) then by wave (descending)
    scores.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return b.wave - a.wave;
    });

    // Keep only top scores
    const topScores = scores.slice(0, this.MAX_SCORES);
    
    // Add ranks
    topScores.forEach((score, index) => {
      score.rank = index + 1;
    });

    this.saveToStorage(topScores);
    
    // Return the saved entry with its rank
    return topScores.find(s => s.id === entry.id) || entry;
  }

  static getScores(): ScoreboardEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const scores = JSON.parse(stored) as ScoreboardEntry[];
      return Array.isArray(scores) ? scores : [];
    } catch (error) {
      console.warn('Failed to load scores from localStorage:', error);
      return [];
    }
  }

  static getTopScores(limit: number = 10): ScoreboardEntry[] {
    return this.getScores().slice(0, limit);
  }

  static getPersonalBest(): ScoreboardEntry | null {
    const scores = this.getScores();
    return scores.length > 0 ? scores[0] : null;
  }

  static getAverageScore(): number {
    const scores = this.getScores();
    if (scores.length === 0) return 0;
    
    const total = scores.reduce((sum, score) => sum + score.score, 0);
    return Math.round(total / scores.length);
  }

  static getTotalGamesPlayed(): number {
    return this.getScores().length;
  }

  static clearScores(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static saveToStorage(scores: ScoreboardEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    } catch (error) {
      console.warn('Failed to save scores to localStorage:', error);
    }
  }

  static getScoreStats(): {
    totalGames: number;
    personalBest: number;
    averageScore: number;
    highestWave: number;
    totalPlayTime: number;
  } {
    const scores = this.getScores();
    
    if (scores.length === 0) {
      return {
        totalGames: 0,
        personalBest: 0,
        averageScore: 0,
        highestWave: 0,
        totalPlayTime: 0
      };
    }

    const personalBest = scores[0]?.score || 0;
    const averageScore = this.getAverageScore();
    const highestWave = Math.max(...scores.map(s => s.wave));
    const totalPlayTime = scores.reduce((sum, score) => sum + score.gameTime, 0);

    return {
      totalGames: scores.length,
      personalBest,
      averageScore,
      highestWave,
      totalPlayTime: Math.round(totalPlayTime)
    };
  }
}