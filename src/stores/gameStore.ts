/**
 * Game Store - Centralized game state management using Zustand
 * Manages complete game state for multiplayer readiness
 * Uses immer for immutable updates and efficient subscriptions
 */

import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { GAME_INIT } from '@/config/GameConfig';
import { utilizeEntityStore } from '@/stores/entityStore';
import { uiStore } from '@/stores/uiStore';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export interface GameStats {
  enemiesKilled: number;
  towersBuilt: number;
  wavesSurvived: number;
  totalDamageDealt: number;
  totalCurrencyEarned: number;
  gameTime: number;
  enemyTypeKills: Record<string, number>;
  towerTypesBuilt: Record<string, number>;
}

export interface GameStore {
  // Game state
  gameState: GameState;
  isPaused: boolean;
  isGameOver: boolean;
  gameSpeed: number;

  // Resources
  currency: number;
  lives: number;
  score: number;

  // Player progression
  playerLevel: number;
  playerExperience: number;
  playerNextLevelExp: number;
  playerHealth: number;
  playerMaxHealth: number;

  // Wave state
  currentWave: number;
  isWaveActive: boolean;
  waveInProgress: boolean;
  enemiesRemaining: number;
  nextWaveTime: number;

  // Statistics
  stats: GameStats;

  // Game state actions
  setGameState: (state: GameState) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameSpeed: (speed: number) => void;
  gameOver: () => void;
  resetGame: () => void;

  // Resource management actions
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  addScore: (points: number) => void;
  loseLife: (amount?: number) => void;

  // Wave actions
  startWave: (waveNumber: number) => void;
  endWave: () => void;
  setNextWaveTime: (time: number) => void;
  setEnemiesRemaining: (count: number) => void;

  // Player progression actions
  addExperience: (exp: number) => void;
  levelUp: () => void;
  setPlayerHealth: (health: number, maxHealth?: number) => void;

  // Statistics actions
  recordEnemyKill: (enemyType: string, reward: number) => void;
  recordTowerBuilt: (towerType: string) => void;
  recordDamageDealt: (damage: number) => void;
  updateGameTime: (deltaTime: number) => void;

  // Selectors
  canAfford: (cost: number) => boolean;
  isAlive: () => boolean;
  getFormattedTime: () => string;
}

export const gameStore = createStore<GameStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          gameState: 'MENU' as GameState,
          isPaused: false,
          isGameOver: false,
          gameSpeed: 1,

          // Resources
          currency: GAME_INIT.startingCurrency,
          lives: GAME_INIT.startingLives,
          score: GAME_INIT.startingScore,

          // Player progression
          playerLevel: 1,
          playerExperience: 0,
          playerNextLevelExp: 100,
          playerHealth: 100,
          playerMaxHealth: 100,

          // Wave state
          currentWave: 0,
          isWaveActive: false,
          waveInProgress: false,
          enemiesRemaining: 0,
          nextWaveTime: 0,

          // Statistics
          stats: {
            enemiesKilled: 0,
            towersBuilt: 0,
            wavesSurvived: 0,
            totalDamageDealt: 0,
            totalCurrencyEarned: 0,
            gameTime: 0,
            enemyTypeKills: {} as Record<string, number>,
            towerTypesBuilt: {} as Record<string, number>
          },

          // Game state actions
          setGameState: (state) => set((draft) => {
            draft.gameState = state;
            if (state === 'GAME_OVER') {
              draft.isGameOver = true;
              draft.isPaused = true;
            } else if (state === 'PLAYING') {
              draft.isPaused = false;
              draft.isGameOver = false;
            }
          }),

          pauseGame: () => set((draft) => {
            draft.isPaused = true;
          }),

          resumeGame: () => set((draft) => {
            draft.isPaused = false;
          }),

          setGameSpeed: (speed) => set((draft) => {
            draft.gameSpeed = Math.max(0.25, Math.min(4, speed));
          }),

          gameOver: () => set((draft) => {
            draft.gameState = 'GAME_OVER';
            draft.isGameOver = true;
            draft.isPaused = true;
          }),

          // Resource management actions
          addCurrency: (amount) => set((draft) => {
            draft.currency += amount;
            draft.stats.totalCurrencyEarned += amount;
          }),

          spendCurrency: (amount) => {
            const state = get();
            if (state.currency >= amount) {
              set((draft) => {
                draft.currency -= amount;
              });
              return true;
            }
            return false;
          },

          addScore: (points) => set((draft) => {
            draft.score += points;
          }),

          loseLife: (amount = 1) => set((draft) => {
            draft.lives = Math.max(0, draft.lives - amount);
            if (draft.lives <= 0) {
              draft.gameState = 'GAME_OVER';
              draft.isGameOver = true;
            }
          }),

          // Wave actions
          startWave: (waveNumber) => set((draft) => {
            draft.currentWave = waveNumber;
            draft.isWaveActive = true;
            draft.waveInProgress = true;
            draft.nextWaveTime = 0;
          }),

          endWave: () => set((draft) => {
            draft.isWaveActive = false;
            draft.waveInProgress = false;
            draft.enemiesRemaining = 0;
            draft.stats.wavesSurvived += 1;
          }),

          setNextWaveTime: (time) => set((draft) => {
            draft.nextWaveTime = time;
          }),

          setEnemiesRemaining: (count) => set((draft) => {
            draft.enemiesRemaining = count;
          }),

          // Player progression actions
          addExperience: (exp) => set((draft) => {
            draft.playerExperience += exp;

            // Auto level up when reaching threshold
            while (draft.playerExperience >= draft.playerNextLevelExp) {
              draft.playerExperience -= draft.playerNextLevelExp;
              draft.playerLevel += 1;
              draft.playerNextLevelExp = Math.floor(draft.playerNextLevelExp * 1.5);
              // Could trigger level up rewards here
            }
          }),

          levelUp: () => set((draft) => {
            draft.playerLevel += 1;
            draft.playerNextLevelExp = Math.floor(draft.playerNextLevelExp * 1.5);
          }),

          setPlayerHealth: (health, maxHealth) => set((draft) => {
            draft.playerHealth = health;
            if (maxHealth !== undefined) {
              draft.playerMaxHealth = maxHealth;
            }
          }),

          // Statistics actions
          recordEnemyKill: (enemyType, reward) => set((draft) => {
            draft.stats.enemiesKilled += 1;
            draft.currency += reward;
            draft.stats.totalCurrencyEarned += reward;

            // Ensure enemyTypeKills exists
            if (!draft.stats.enemyTypeKills) {
              draft.stats.enemyTypeKills = {};
            }

            // Track enemy type kills
            if (!draft.stats.enemyTypeKills[enemyType]) {
              draft.stats.enemyTypeKills[enemyType] = 0;
            }
            draft.stats.enemyTypeKills[enemyType] += 1;
          }),

          recordTowerBuilt: (towerType) => set((draft) => {
            draft.stats.towersBuilt += 1;

            // Ensure towerTypesBuilt exists
            if (!draft.stats.towerTypesBuilt) {
              draft.stats.towerTypesBuilt = {};
            }

            // Track tower types built
            if (!draft.stats.towerTypesBuilt[towerType]) {
              draft.stats.towerTypesBuilt[towerType] = 0;
            }
            draft.stats.towerTypesBuilt[towerType] += 1;
          }),

          recordDamageDealt: (damage) => set((draft) => {
            draft.stats.totalDamageDealt += damage;
          }),

          updateGameTime: (deltaTime) => set((draft) => {
            draft.stats.gameTime += deltaTime;
          }),

          resetGame: () => {
            // Clear all entities first
            utilizeEntityStore.getState().clearAllEntities();

            // Close all UI panels
            uiStore.getState().closeAllPanels(true);

            // Reset game state
            set((draft) => {
              // Reset to initial state
              draft.gameState = 'MENU';
              draft.isPaused = false;
              draft.isGameOver = false;
              draft.gameSpeed = 1;

              // Reset resources
              draft.currency = GAME_INIT.startingCurrency;
              draft.lives = GAME_INIT.startingLives;
              draft.score = GAME_INIT.startingScore;

              // Reset player progression
              draft.playerLevel = 1;
              draft.playerExperience = 0;
              draft.playerNextLevelExp = 100;
              draft.playerHealth = 100;
              draft.playerMaxHealth = 100;

              // Reset wave state
              draft.currentWave = 0;
              draft.isWaveActive = false;
              draft.waveInProgress = false;
              draft.enemiesRemaining = 0;
              draft.nextWaveTime = 0;

              // Reset statistics
              draft.stats = {
                enemiesKilled: 0,
                towersBuilt: 0,
                wavesSurvived: 0,
                totalDamageDealt: 0,
                totalCurrencyEarned: 0,
                gameTime: 0,
                enemyTypeKills: {} as Record<string, number>,
                towerTypesBuilt: {} as Record<string, number>
              };
            });
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
        }))
      ),
      {
        name: 'game-store',
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // If the persisted state is invalid or old version, reset to defaults
          if (version !== 1 || !persistedState || typeof persistedState.currency !== 'number') {
            console.warn('[GameStore] Resetting corrupted or old persisted state');
            return {
              gameState: 'MENU' as GameState,
              gameSpeed: 1,
              currency: GAME_INIT.startingCurrency,
              lives: GAME_INIT.startingLives,
              score: GAME_INIT.startingScore,
              playerLevel: 1,
              playerExperience: 0,
              playerNextLevelExp: 100,
              playerHealth: 100,
              playerMaxHealth: 100,
              currentWave: 0,
              isWaveActive: false,
              waveInProgress: false,
              enemiesRemaining: 0,
              nextWaveTime: 0,
              stats: {
                enemiesKilled: 0,
                towersBuilt: 0,
                wavesSurvived: 0,
                totalDamageDealt: 0,
                totalCurrencyEarned: 0,
                gameTime: 0,
                enemyTypeKills: {},
                towerTypesBuilt: {}
              }
            };
          }
          return persistedState;
        },
        partialize: (state) => ({
          // Persist complete game state for multiplayer/resume
          gameState: state.gameState,
          gameSpeed: state.gameSpeed,

          // Resources
          currency: state.currency,
          lives: state.lives,
          score: state.score,

          // Player progression
          playerLevel: state.playerLevel,
          playerExperience: state.playerExperience,
          playerNextLevelExp: state.playerNextLevelExp,
          playerHealth: state.playerHealth,
          playerMaxHealth: state.playerMaxHealth,

          // Wave state
          currentWave: state.currentWave,
          isWaveActive: state.isWaveActive,
          waveInProgress: state.waveInProgress,
          enemiesRemaining: state.enemiesRemaining,
          nextWaveTime: state.nextWaveTime,

          // Statistics
          stats: state.stats,

          // Don't persist temporary UI states
          // isPaused: state.isPaused,
          // isGameOver: state.isGameOver,
        })
      }
    ),
    {
      name: 'wave-td-game-store'
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
export const getPlayerLevel = () => gameStore.getState().playerLevel;
export const getPlayerExperience = () => gameStore.getState().playerExperience;

export const getWaveInfo = () => {
  const state = gameStore.getState();
  return {
    currentWave: state.currentWave,
    isWaveActive: state.isWaveActive,
    enemiesRemaining: state.enemiesRemaining,
    nextWaveTime: state.nextWaveTime
  };
};

export const getPlayerInfo = () => {
  const state = gameStore.getState();
  return {
    level: state.playerLevel,
    experience: state.playerExperience,
    nextLevelExp: state.playerNextLevelExp,
    health: state.playerHealth,
    maxHealth: state.playerMaxHealth
  };
};

export const getGameStats = () => gameStore.getState().stats;

// Selective subscriptions using the selector
export const subscribeToPlayerStats = (
  callback: (level: number, exp: number, nextExp: number, health: number, maxHealth: number) => void
) => {
  let previousValues: [number, number, number, number, number] | null = null;

  return gameStore.subscribe((state) => {
    const currentValues: [number, number, number, number, number] = [
      state.playerLevel,
      state.playerExperience,
      state.playerNextLevelExp,
      state.playerHealth,
      state.playerMaxHealth
    ];

    if (!previousValues || currentValues.some((val, i) => val !== previousValues![i])) {
      callback(...currentValues);
      previousValues = currentValues;
    }
  });
};

export const subscribeToResources = (
  callback: (currency: number, lives: number, score: number) => void
) => {
  let previousValues: [number, number, number] | null = null;

  return gameStore.subscribe((state) => {
    const currentValues: [number, number, number] = [state.currency, state.lives, state.score];

    if (!previousValues || currentValues.some((val, i) => val !== previousValues![i])) {
      callback(...currentValues);
      previousValues = currentValues;
    }
  });
};

export const subscribeToWaveState = (
  callback: (wave: number, isActive: boolean, enemiesRemaining: number) => void
) => {
  let previousValues: [number, boolean, number] | null = null;

  return gameStore.subscribe((state) => {
    const currentValues: [number, boolean, number] = [
      state.currentWave,
      state.isWaveActive,
      state.enemiesRemaining
    ];

    if (!previousValues || currentValues.some((val, i) => val !== previousValues![i])) {
      callback(...currentValues);
      previousValues = currentValues;
    }
  });
};