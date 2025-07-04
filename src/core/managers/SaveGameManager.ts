import type { Game } from "../Game";
import type { SerializedGameState } from "@/types/SaveGame";
import { SAVE_VERSION, isValidSaveGame, serializeVector2 } from "@/types/SaveGame";
import { gameStore } from "@/stores/gameStore";
import { DecorationLevel } from "@/types/MapData";

/**
 * Manages game save/load functionality
 * Handles serialization, deserialization, and auto-save features
 */
export class SaveGameManager {
  private game: Game;
  private autoSaveTimer: number = 0;
  private readonly AUTO_SAVE_INTERVAL: number = 60000; // Auto-save every 60 seconds
  private lastSaveTime: number = 0;

  constructor(game: Game) {
    this.game = game;
  }

  /**
   * Save the current game state to localStorage
   */
  public save(): void {
    try {
      const snapshot = this.createSnapshot();
      localStorage.setItem('gameSave', JSON.stringify(snapshot));
      localStorage.setItem('hasSavedGame', 'true');

      // Validation logging
      console.log('Game saved successfully:', {
        player: {
          level: snapshot.player.level,
          experience: snapshot.player.experience,
          health: `${snapshot.player.health}/${snapshot.player.maxHealth}`
        },
        towers: {
          count: snapshot.towers.length,
          types: snapshot.towers.map(t => t.type)
        },
        wave: snapshot.waveState.currentWave,
        currency: snapshot.gameStore.currency,
        score: snapshot.gameStore.score
      });
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  /**
   * Load game state from localStorage
   * @returns true if load was successful
   */
  public load(): boolean {
    try {
      const saved = localStorage.getItem('gameSave');
      if (!saved) return false;

      const snapshot = JSON.parse(saved) as SerializedGameState;
      return this.loadFromSnapshot(snapshot);
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  /**
   * Create a snapshot of the current game state
   * @returns Serialized game state
   */
  private createSnapshot(): SerializedGameState {
    const gameState = gameStore.getState();

    return {
      version: SAVE_VERSION,

      // Core game state
      gameStore: {
        currency: gameState.currency,
        lives: gameState.lives,
        score: gameState.score,
        playerHealth: gameState.playerHealth,
        playerMaxHealth: gameState.playerMaxHealth,
        currentWave: gameState.currentWave,
        isWaveActive: gameState.isWaveActive,
        waveInProgress: gameState.waveInProgress,
        enemiesRemaining: gameState.enemiesRemaining,
        nextWaveTime: gameState.nextWaveTime,
        gameSpeed: gameState.gameSpeed,
        stats: gameState.stats
      },

      // Entity states
      towers: this.game.getTowers().map(tower => tower.serialize()),
      enemies: this.game.getEnemies().map(enemy => enemy.serialize()),
      player: this.game.getPlayer().serialize(),

      // Systems state
      inventory: {
        items: this.game.getInventory().getState().slots
          .filter(slot => slot.item !== null)
          .map(slot => slot.item!),
        maxSlots: this.game.getInventory().getState().config.maxSlots,
        itemsCollected: this.game.getInventory().getState().statistics.itemsCollected,
        itemsUsed: this.game.getInventory().getState().statistics.itemsUsed
      },

      waveState: {
        currentWave: this.game.getWaveManager().currentWave,
        isWaveActive: this.game.getWaveManager().isWaveActive(),
        waveInProgress: gameState.waveInProgress,
        enemiesRemaining: this.game.getEnemies().length,
        nextWaveTime: gameState.nextWaveTime,
        infiniteWavesEnabled: this.game.getWaveManager().isInfiniteWavesEnabled(),
        enemyHealthMultiplier: this.game.getEnemyHealthMultiplier(),
        enemySpeedMultiplier: this.game.getEnemySpeedMultiplier()
      },

      // Map configuration
      mapConfig: {
        seed: this.game.getCurrentMapData().metadata.seed,
        width: this.game.getCurrentMapData().metadata.width,
        height: this.game.getCurrentMapData().metadata.height,
        cellSize: this.game.getGrid().cellSize,
        biome: this.game.getCurrentMapData().metadata.biome,
        difficulty: this.game.getCurrentMapData().metadata.difficulty,
        decorationLevel: DecorationLevel.MODERATE // Default since it's not in MapData
      },

      // Camera state
      camera: {
        position: serializeVector2(this.game.getCamera().getPosition()),
        zoom: this.game.getCamera().getZoom()
      },

      // Game metadata
      metadata: {
        saveVersion: SAVE_VERSION,
        timestamp: Date.now(),
        gameTime: gameState.stats.gameTime,
        realTimePlayed: Date.now() - this.game.getGameStartTime(),
        gameVersion: '1.0.0'
      }
    };
  }

  /**
   * Restore game state from a snapshot
   * @param snapshot - The saved game state to restore
   * @returns true if restore was successful
   */
  private loadFromSnapshot(snapshot: SerializedGameState): boolean {
    try {
      // Validate save version
      if (!isValidSaveGame(snapshot)) {
        console.error('Invalid save game format');
        return false;
      }

      // Delegate to game's restore method
      return this.game.restoreFromSnapshot(snapshot);
    } catch (error) {
      console.error('Error restoring game state:', error);
      return false;
    }
  }

  /**
   * Clear all saved game data
   */
  public clearSaveData(): void {
    localStorage.removeItem('gameSave');
    localStorage.removeItem('hasSavedGame');
    console.log('Save data cleared');
  }

  /**
   * Check if there is a saved game available
   * @returns true if a saved game exists
   */
  public hasSavedGame(): boolean {
    return localStorage.getItem('hasSavedGame') === 'true';
  }

  /**
   * Perform auto-save
   */
  public autoSave(): void {
    try {
      this.save();
      this.lastSaveTime = Date.now();
      console.log('[SaveGameManager] Auto-save completed');

      // Dispatch auto-save event for UI notification
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('gameAutoSaved', {
          detail: { timestamp: this.lastSaveTime }
        }));
      }
    } catch (error) {
      console.error('[SaveGameManager] Auto-save failed:', error);
    }
  }

  /**
   * Save after wave completion
   */
  public saveAfterWave(): void {
    // Reset auto-save timer to prevent immediate auto-save
    this.autoSaveTimer = 0;
    this.save();
    
    console.log('[SaveGameManager] Saved game after wave completion');
    
    // Dispatch wave save event
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('gameWaveSaved', {
        detail: { 
          timestamp: Date.now(),
          wave: this.game.getCurrentWave()
        }
      }));
    }
  }

  /**
   * Update auto-save timer
   * @param deltaTime - Time elapsed since last update
   */
  public updateAutoSaveTimer(deltaTime: number): void {
    this.autoSaveTimer += deltaTime;
    
    if (this.autoSaveTimer >= this.AUTO_SAVE_INTERVAL) {
      this.autoSave();
      this.autoSaveTimer = 0;
    }
  }

  /**
   * Get the last save time
   * @returns Timestamp of last save
   */
  public getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * Get auto-save interval
   * @returns Auto-save interval in milliseconds
   */
  public getAutoSaveInterval(): number {
    return this.AUTO_SAVE_INTERVAL;
  }
}