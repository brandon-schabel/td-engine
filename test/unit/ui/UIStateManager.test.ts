import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIStateManager, UIPanelType } from '@/ui/UIStateManager';
import type { UIController } from '@/ui/UIController';

describe('UIStateManager', () => {
  let stateManager: UIStateManager;
  let mockUIController: UIController;

  beforeEach(() => {
    mockUIController = {} as UIController;
    stateManager = new UIStateManager(mockUIController);
  });

  describe('Panel State Management', () => {
    it('should open a panel successfully', () => {
      const result = stateManager.openPanel(UIPanelType.INVENTORY);
      
      expect(result).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
    });

    it('should not open a panel that is already open', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      const result = stateManager.openPanel(UIPanelType.INVENTORY);
      
      expect(result).toBe(false);
    });

    it('should close an open panel', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      const result = stateManager.closePanel(UIPanelType.INVENTORY);
      
      expect(result).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(false);
    });

    it('should not close a panel that is already closed', () => {
      const result = stateManager.closePanel(UIPanelType.INVENTORY);
      expect(result).toBe(false);
    });

    it('should toggle panel state', () => {
      // Initially closed
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(false);
      
      // Toggle open
      stateManager.togglePanel(UIPanelType.INVENTORY);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
      
      // Toggle closed
      stateManager.togglePanel(UIPanelType.INVENTORY);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(false);
    });

    it('should track panel metadata', () => {
      const metadata = { towerId: '123', level: 5 };
      stateManager.openPanel(UIPanelType.TOWER_UPGRADE, metadata);
      
      expect(stateManager.getPanelMetadata(UIPanelType.TOWER_UPGRADE)).toEqual(metadata);
    });

    it('should update panel metadata', () => {
      stateManager.openPanel(UIPanelType.TOWER_UPGRADE, { towerId: '123' });
      stateManager.updatePanelMetadata(UIPanelType.TOWER_UPGRADE, { level: 5 });
      
      expect(stateManager.getPanelMetadata(UIPanelType.TOWER_UPGRADE)).toEqual({
        towerId: '123',
        level: 5
      });
    });
  });

  describe('Modal Exclusivity', () => {
    it('should close previous modal when opening a new modal', () => {
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      expect(stateManager.isPanelOpen(UIPanelType.PAUSE_MENU)).toBe(true);
      
      stateManager.openPanel(UIPanelType.SETTINGS);
      expect(stateManager.isPanelOpen(UIPanelType.PAUSE_MENU)).toBe(false);
      expect(stateManager.isPanelOpen(UIPanelType.SETTINGS)).toBe(true);
    });

    it('should track current modal', () => {
      expect(stateManager.getCurrentModal()).toBeNull();
      
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      expect(stateManager.getCurrentModal()).toBe(UIPanelType.PAUSE_MENU);
      
      stateManager.closePanel(UIPanelType.PAUSE_MENU);
      expect(stateManager.getCurrentModal()).toBeNull();
    });

    it('should not affect non-modal panels when opening modal', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      
      // Inventory should still be open (non-modal)
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.PAUSE_MENU)).toBe(true);
    });
  });

  describe('Exclusive Panels', () => {
    it('should close other exclusive panels when opening an exclusive panel', () => {
      stateManager.openPanel(UIPanelType.TOWER_UPGRADE);
      stateManager.openPanel(UIPanelType.PLAYER_UPGRADE);
      
      expect(stateManager.isPanelOpen(UIPanelType.TOWER_UPGRADE)).toBe(false);
      expect(stateManager.isPanelOpen(UIPanelType.PLAYER_UPGRADE)).toBe(true);
    });

    it('should not close non-exclusive panels', () => {
      stateManager.openPanel(UIPanelType.BUILD_MENU);
      stateManager.openPanel(UIPanelType.TOWER_UPGRADE);
      
      // Build menu is not exclusive, so it should remain open
      expect(stateManager.isPanelOpen(UIPanelType.BUILD_MENU)).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.TOWER_UPGRADE)).toBe(true);
    });
  });

  describe('Event Emitting', () => {
    it('should emit panelOpened event', () => {
      const openedHandler = vi.fn();
      stateManager.on('panelOpened', openedHandler);
      
      stateManager.openPanel(UIPanelType.INVENTORY);
      
      expect(openedHandler).toHaveBeenCalledWith({
        panel: UIPanelType.INVENTORY,
        state: expect.objectContaining({
          id: UIPanelType.INVENTORY,
          isOpen: true,
          openedAt: expect.any(Number)
        })
      });
    });

    it('should emit panelClosed event', () => {
      const closedHandler = vi.fn();
      stateManager.on('panelClosed', closedHandler);
      
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.closePanel(UIPanelType.INVENTORY);
      
      expect(closedHandler).toHaveBeenCalledWith({
        panel: UIPanelType.INVENTORY,
        state: expect.objectContaining({
          id: UIPanelType.INVENTORY,
          isOpen: false,
          closedAt: expect.any(Number)
        })
      });
    });

    it('should emit modalChanged event', () => {
      const modalHandler = vi.fn();
      stateManager.on('modalChanged', modalHandler);
      
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      
      expect(modalHandler).toHaveBeenCalledTimes(1);
      expect(modalHandler).toHaveBeenCalledWith({
        current: UIPanelType.PAUSE_MENU,
        previous: null
      });
      
      modalHandler.mockClear();
      stateManager.openPanel(UIPanelType.SETTINGS);
      
      // Should be called twice: once for closing PAUSE_MENU, once for opening SETTINGS
      expect(modalHandler).toHaveBeenCalledTimes(2);
      expect(modalHandler).toHaveBeenNthCalledWith(1, {
        current: null,
        previous: UIPanelType.PAUSE_MENU
      });
      expect(modalHandler).toHaveBeenNthCalledWith(2, {
        current: UIPanelType.SETTINGS,
        previous: null
      });
    });

    it('should emit panelToggled event', () => {
      const toggleHandler = vi.fn();
      stateManager.on('panelToggled', toggleHandler);
      
      stateManager.togglePanel(UIPanelType.INVENTORY);
      
      expect(toggleHandler).toHaveBeenCalledWith({
        panel: UIPanelType.INVENTORY,
        isOpen: true
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should close all panels', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      stateManager.openPanel(UIPanelType.BUILD_MENU);
      
      stateManager.closeAllPanels();
      
      expect(stateManager.getOpenPanels()).toHaveLength(0);
    });

    it('should close only transient panels', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.openPanel(UIPanelType.GAME_OVER); // Persistent panel
      
      stateManager.closeTransientPanels();
      
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(false);
      expect(stateManager.isPanelOpen(UIPanelType.GAME_OVER)).toBe(true);
    });

    it('should get all open panels', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      
      const openPanels = stateManager.getOpenPanels();
      
      expect(openPanels).toContain(UIPanelType.INVENTORY);
      expect(openPanels).toContain(UIPanelType.PAUSE_MENU);
      expect(openPanels).toHaveLength(2);
    });
  });

  describe('State Persistence', () => {
    it('should create state snapshot', () => {
      stateManager.openPanel(UIPanelType.INVENTORY, { filter: 'weapons' });
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      
      const snapshot = stateManager.getStateSnapshot();
      
      expect(snapshot).toMatchObject({
        timestamp: expect.any(Number),
        currentModal: UIPanelType.PAUSE_MENU,
        panels: {
          [UIPanelType.INVENTORY]: {
            isOpen: true,
            metadata: { filter: 'weapons' }
          },
          [UIPanelType.PAUSE_MENU]: {
            isOpen: true
          }
        }
      });
    });

    it('should restore from state snapshot', () => {
      const snapshot = {
        timestamp: Date.now(),
        currentModal: UIPanelType.SETTINGS,
        panels: {
          [UIPanelType.INVENTORY]: {
            isOpen: true,
            metadata: { filter: 'armor' }
          },
          [UIPanelType.SETTINGS]: {
            isOpen: true,
            metadata: { tab: 'audio' }
          }
        }
      };
      
      stateManager.restoreStateSnapshot(snapshot);
      
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.SETTINGS)).toBe(true);
      expect(stateManager.getCurrentModal()).toBe(UIPanelType.SETTINGS);
      expect(stateManager.getPanelMetadata(UIPanelType.INVENTORY)).toEqual({ filter: 'armor' });
      expect(stateManager.getPanelMetadata(UIPanelType.SETTINGS)).toEqual({ tab: 'audio' });
    });
  });

  describe('State History', () => {
    it('should track state history', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      stateManager.closePanel(UIPanelType.INVENTORY);
      
      const history = stateManager.getStateHistory();
      
      expect(history).toHaveLength(3);
      expect(history[0].timestamp).toBeLessThan(history[1].timestamp);
      expect(history[1].timestamp).toBeLessThan(history[2].timestamp);
    });

    it('should limit state history to 50 entries', () => {
      // Create 55 state changes
      for (let i = 0; i < 55; i++) {
        stateManager.togglePanel(UIPanelType.INVENTORY);
      }
      
      const history = stateManager.getStateHistory();
      expect(history).toHaveLength(50);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      stateManager.openPanel(UIPanelType.INVENTORY);
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      
      stateManager.reset();
      
      expect(stateManager.getOpenPanels()).toHaveLength(0);
      expect(stateManager.getCurrentModal()).toBeNull();
      expect(stateManager.getStateHistory()).toHaveLength(0);
    });
  });
});