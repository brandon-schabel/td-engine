import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { SaveGameManager } from '@/core/managers/SaveGameManager';
import type { Game } from '@/core/Game';
import { gameStore } from '@/stores/gameStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock document.dispatchEvent
global.document = {
  dispatchEvent: vi.fn()
} as any;

describe('SaveGameManager', () => {
  let saveGameManager: SaveGameManager;
  let mockGame: Partial<Game>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset game store
    gameStore.getState().resetGame();

    // Create mock game with required methods
    mockGame = {
      getTowers: vi.fn().mockReturnValue([]),
      getEnemies: vi.fn().mockReturnValue([]),
      getPlayer: vi.fn().mockReturnValue({
        serialize: vi.fn().mockReturnValue({
          position: { x: 0, y: 0 },
          health: 100,
          maxHealth: 100,
          level: 1,
          experience: 0
        })
      }),
      getInventory: vi.fn().mockReturnValue({
        getState: vi.fn().mockReturnValue({
          slots: [],
          config: { maxSlots: 20 },
          statistics: { itemsCollected: 0, itemsUsed: 0 }
        })
      }),
      getWaveManager: vi.fn().mockReturnValue({
        currentWave: 1,
        isWaveActive: vi.fn().mockReturnValue(false),
        isInfiniteWavesEnabled: vi.fn().mockReturnValue(false)
      }),
      getEnemyHealthMultiplier: vi.fn().mockReturnValue(1.0),
      getEnemySpeedMultiplier: vi.fn().mockReturnValue(1.0),
      getCurrentMapData: vi.fn().mockReturnValue({
        metadata: {
          seed: 'test-seed',
          width: 50,
          height: 50,
          biome: 'forest',
          difficulty: 'normal'
        }
      }),
      getGrid: vi.fn().mockReturnValue({ cellSize: 32 }),
      getCamera: vi.fn().mockReturnValue({
        getPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        getZoom: vi.fn().mockReturnValue(1.0)
      }),
      getGameStartTime: vi.fn().mockReturnValue(Date.now()),
      getCurrentWave: vi.fn().mockReturnValue(1),
      restoreFromSnapshot: vi.fn().mockReturnValue(true)
    };

    saveGameManager = new SaveGameManager(mockGame as Game);
  });

  describe('save', () => {
    it('should save game state to localStorage', () => {
      saveGameManager.save();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('hasSavedGame', 'true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gameSave',
        expect.any(String)
      );
    });

    it('should create valid snapshot when saving', () => {
      saveGameManager.save();

      const savedData = JSON.parse(
        (localStorageMock.setItem as Mock).mock.calls[0][1]
      );

      expect(savedData).toHaveProperty('version');
      expect(savedData).toHaveProperty('gameStore');
      expect(savedData).toHaveProperty('towers');
      expect(savedData).toHaveProperty('enemies');
      expect(savedData).toHaveProperty('player');
      expect(savedData).toHaveProperty('inventory');
      expect(savedData).toHaveProperty('waveState');
      expect(savedData).toHaveProperty('mapConfig');
      expect(savedData).toHaveProperty('camera');
      expect(savedData).toHaveProperty('metadata');
    });
  });

  describe('load', () => {
    it('should return false when no save exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = saveGameManager.load();
      
      expect(result).toBe(false);
      expect(mockGame.restoreFromSnapshot).not.toHaveBeenCalled();
    });

    it('should load valid save data', () => {
      const validSaveData = {
        version: 1,
        gameStore: {},
        towers: [],
        enemies: [],
        player: {},
        inventory: {},
        waveState: {},
        mapConfig: {},
        camera: {},
        metadata: {}
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validSaveData));
      
      const result = saveGameManager.load();
      
      expect(result).toBe(true);
      expect(mockGame.restoreFromSnapshot).toHaveBeenCalledWith(validSaveData);
    });

    it('should handle corrupted save data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const result = saveGameManager.load();
      
      expect(result).toBe(false);
    });
  });

  describe('clearSaveData', () => {
    it('should remove save data from localStorage', () => {
      saveGameManager.clearSaveData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gameSave');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hasSavedGame');
    });
  });

  describe('hasSavedGame', () => {
    it('should return true when save exists', () => {
      localStorageMock.getItem.mockReturnValue('true');
      
      expect(saveGameManager.hasSavedGame()).toBe(true);
    });

    it('should return false when no save exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      expect(saveGameManager.hasSavedGame()).toBe(false);
    });
  });

  describe('autoSave', () => {
    it('should save game and dispatch event', () => {
      saveGameManager.autoSave();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameAutoSaved'
        })
      );
    });

    it('should update last save time', () => {
      const beforeTime = saveGameManager.getLastSaveTime();
      saveGameManager.autoSave();
      const afterTime = saveGameManager.getLastSaveTime();
      
      expect(afterTime).toBeGreaterThan(beforeTime);
    });
  });

  describe('saveAfterWave', () => {
    it('should save game and dispatch event', () => {
      saveGameManager.saveAfterWave();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameWaveSaved'
        })
      );
    });
  });

  describe('updateAutoSaveTimer', () => {
    it('should trigger auto-save after interval', () => {
      const interval = saveGameManager.getAutoSaveInterval();
      
      // Update timer just below interval
      saveGameManager.updateAutoSaveTimer(interval - 100);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Update timer to exceed interval
      saveGameManager.updateAutoSaveTimer(200);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reset timer after auto-save', () => {
      const interval = saveGameManager.getAutoSaveInterval();
      
      // Trigger auto-save
      saveGameManager.updateAutoSaveTimer(interval + 100);
      vi.clearAllMocks();
      
      // Update timer again with small delta
      saveGameManager.updateAutoSaveTimer(100);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});