/**
 * Game Store - Centralized game state management using Zustand
 * Manages resources, scores, and game progression
 */

import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools, persist } from 'zustand/middleware';
import { GAME_INIT } from '@/config/GameConfig';

interface GameStats {
  enemiesKilled: number;
  towersBuilt: number;
  wavesSurvived: number;
  totalDamageDealt: number;
  totalCurrencyEarned: number;
  gameTime: number;
}

interface GameStore {
  // Resources
  currency: number;
  lives: number;
  score: number;
  
  // Player state
  playerHealth: number;
  playerMaxHealth: number;
  
  // Wave state
  currentWave: number;
  isWaveActive: boolean;
  waveInProgress: boolean;
  enemiesRemaining: number;
  nextWaveTime: number;
  
  // Game state
  isPaused: boolean;
  isGameOver: boolean;
  gameSpeed: number;
  
  // Statistics
  stats: GameStats;
  
  // Actions
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  addScore: (points: number) => void;
  loseLife: (amount?: number) => void;
  
  // Wave actions
  startWave: (waveNumber: number) => void;
  endWave: () => void;
  setNextWaveTime: (time: number) => void;
  setEnemiesRemaining: (count: number) => void;
  
  // Player actions
  setPlayerHealth: (health: number, maxHealth?: number) => void;
  
  // Game control actions
  pauseGame: () => void;
  resumeGame: () => void;
  setGameSpeed: (speed: number) => void;
  gameOver: () => void;
  resetGame: () => void;
  
  // Stats actions
  incrementEnemiesKilled: () => void;
  incrementTowersBuilt: () => void;
  addDamageDealt: (damage: number) => void;
  updateGameTime: (deltaTime: number) => void;
  
  // Selectors
  canAfford: (cost: number) => boolean;
  isAlive: () => boolean;
  getFormattedTime: () => string;
}

export const gameStore = createStore<GameStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        currency: GAME_INIT.startingCurrency,
        lives: GAME_INIT.startingLives,
        score: GAME_INIT.startingScore,
        
        playerHealth: 100,
        playerMaxHealth: 100,
        
        currentWave: 0,
        isWaveActive: false,
        waveInProgress: false,
        enemiesRemaining: 0,
        nextWaveTime: 0,
        
        isPaused: false,
        isGameOver: false,
        gameSpeed: 1,
        
        stats: {
          enemiesKilled: 0,
          towersBuilt: 0,
          wavesSurvived: 0,
          totalDamageDealt: 0,
          totalCurrencyEarned: 0,
          gameTime: 0
        },
        
        // Resource actions
        addCurrency: (amount) => {
          set((state) => ({
            currency: state.currency + amount,
            stats: {
              ...state.stats,
              totalCurrencyEarned: state.stats.totalCurrencyEarned + amount
            }
          }));
        },
        
        spendCurrency: (amount) => {
          const state = get();
          if (state.currency >= amount) {
            set({ currency: state.currency - amount });
            return true;
          }
          return false;
        },
        
        addScore: (points) => {
          set((state) => ({ score: state.score + points }));
        },
        
        loseLife: (amount = 1) => {
          set((state) => {
            const newLives = Math.max(0, state.lives - amount);
            return {
              lives: newLives,
              isGameOver: newLives <= 0 ? true : state.isGameOver
            };
          });
        },
        
        // Wave actions
        startWave: (waveNumber) => {
          set({
            currentWave: waveNumber,
            isWaveActive: true,
            waveInProgress: true,
            nextWaveTime: 0
          });
        },
        
        endWave: () => {
          set((state) => ({
            isWaveActive: false,
            waveInProgress: false,
            enemiesRemaining: 0,
            stats: {
              ...state.stats,
              wavesSurvived: state.stats.wavesSurvived + 1
            }
          }));
        },
        
        setNextWaveTime: (time) => {
          set({ nextWaveTime: time });
        },
        
        setEnemiesRemaining: (count) => {
          set({ enemiesRemaining: count });
        },
        
        // Player actions
        setPlayerHealth: (health, maxHealth) => {
          set((state) => ({
            playerHealth: health,
            playerMaxHealth: maxHealth !== undefined ? maxHealth : state.playerMaxHealth
          }));
        },
        
        // Game control actions
        pauseGame: () => {
          set({ isPaused: true });
        },
        
        resumeGame: () => {
          set({ isPaused: false });
        },
        
        setGameSpeed: (speed) => {
          set({ gameSpeed: Math.max(0.25, Math.min(4, speed)) });
        },
        
        gameOver: () => {
          set({ isGameOver: true, isPaused: true });
        },
        
        resetGame: () => {
          set({
            currency: GAME_INIT.startingCurrency,
            lives: GAME_INIT.startingLives,
            score: GAME_INIT.startingScore,
            playerHealth: 100,
            playerMaxHealth: 100,
            currentWave: 0,
            isWaveActive: false,
            waveInProgress: false,
            enemiesRemaining: 0,
            nextWaveTime: 0,
            isPaused: false,
            isGameOver: false,
            gameSpeed: 1,
            stats: {
              enemiesKilled: 0,
              towersBuilt: 0,
              wavesSurvived: 0,
              totalDamageDealt: 0,
              totalCurrencyEarned: 0,
              gameTime: 0
            }
          });
        },
        
        // Stats actions
        incrementEnemiesKilled: () => {
          set((state) => ({
            stats: {
              ...state.stats,
              enemiesKilled: state.stats.enemiesKilled + 1
            }
          }));
        },
        
        incrementTowersBuilt: () => {
          set((state) => ({
            stats: {
              ...state.stats,
              towersBuilt: state.stats.towersBuilt + 1
            }
          }));
        },
        
        addDamageDealt: (damage) => {
          set((state) => ({
            stats: {
              ...state.stats,
              totalDamageDealt: state.stats.totalDamageDealt + damage
            }
          }));
        },
        
        updateGameTime: (deltaTime) => {
          set((state) => ({
            stats: {
              ...state.stats,
              gameTime: state.stats.gameTime + deltaTime
            }
          }));
        },
        
        // Selectors
        canAfford: (cost) => {
          return get().currency >= cost;
        },
        
        isAlive: () => {
          return get().lives > 0;
        },
        
        getFormattedTime: () => {
          const time = get().stats.gameTime;
          const minutes = Math.floor(time / 60000);
          const seconds = Math.floor((time % 60000) / 1000);
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      })),
      {
        name: 'game-store',
        partialize: (state) => ({
          // Persist full game state for resume functionality
          currency: state.currency,
          lives: state.lives,
          score: state.score,
          playerHealth: state.playerHealth,
          playerMaxHealth: state.playerMaxHealth,
          currentWave: state.currentWave,
          isWaveActive: state.isWaveActive,
          waveInProgress: state.waveInProgress,
          enemiesRemaining: state.enemiesRemaining,
          nextWaveTime: state.nextWaveTime,
          gameSpeed: state.gameSpeed,
          stats: state.stats,
          // Don't persist pause/game over states
          // isPaused: state.isPaused,
          // isGameOver: state.isGameOver,
        })
      }
    ),
    {
      name: 'game-store'
    }
  )
);

// Store API
export const getGameState = () => gameStore.getState();
export const subscribeToGameStore = (callback: (state: GameStore) => void) => gameStore.subscribe(callback);

// Convenience getters
export const getCurrency = () => gameStore.getState().currency;
export const getLives = () => gameStore.getState().lives;
export const getScore = () => gameStore.getState().score;
export const getWaveInfo = () => {
  const state = gameStore.getState();
  return {
    currentWave: state.currentWave,
    isWaveActive: state.isWaveActive,
    nextWaveTime: state.nextWaveTime
  };
};
export const getGameStats = () => gameStore.getState().stats;