import { describe, it, expect, beforeEach } from 'vitest';
import { UIStateManager, UIPanelType } from '../UIStateManager';

describe('UIStateManager', () => {
  let stateManager: UIStateManager;

  beforeEach(() => {
    // Mock UIController
    const mockUIController = {} as any;
    stateManager = new UIStateManager(mockUIController);
  });

  describe('Panel State Management', () => {
    it('should open a panel', () => {
      const result = stateManager.openPanel(UIPanelType.BUILD_MENU);
      expect(result).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.BUILD_MENU)).toBe(true);
    });

    it('should close a panel', () => {
      stateManager.openPanel(UIPanelType.BUILD_MENU);
      const result = stateManager.closePanel(UIPanelType.BUILD_MENU);
      expect(result).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.BUILD_MENU)).toBe(false);
    });

    it('should toggle panel state', () => {
      // First toggle - should open
      stateManager.togglePanel(UIPanelType.INVENTORY);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
      
      // Second toggle - should close
      stateManager.togglePanel(UIPanelType.INVENTORY);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(false);
    });

    it('should handle exclusive panels', () => {
      // Open player upgrade
      stateManager.openPanel(UIPanelType.PLAYER_UPGRADE);
      expect(stateManager.isPanelOpen(UIPanelType.PLAYER_UPGRADE)).toBe(true);
      
      // Open inventory - should close player upgrade
      stateManager.openPanel(UIPanelType.INVENTORY);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.PLAYER_UPGRADE)).toBe(false);
    });

    it('should allow multiple non-exclusive panels', () => {
      // Build menu is non-exclusive
      stateManager.openPanel(UIPanelType.BUILD_MENU);
      stateManager.openPanel(UIPanelType.BUILD_MODE);
      
      expect(stateManager.isPanelOpen(UIPanelType.BUILD_MENU)).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.BUILD_MODE)).toBe(true);
    });
  });

  describe('Build Mode', () => {
    it('should enter build mode', () => {
      stateManager.enterBuildMode({ towerType: 'BASIC' });
      expect(stateManager.isInBuildMode()).toBe(true);
    });

    it('should exit build mode', () => {
      stateManager.enterBuildMode({ towerType: 'BASIC' });
      stateManager.exitBuildMode();
      expect(stateManager.isInBuildMode()).toBe(false);
    });

    it('should store build mode metadata', () => {
      stateManager.enterBuildMode({ towerType: 'SNIPER' });
      const metadata = stateManager.getPanelMetadata(UIPanelType.BUILD_MODE);
      expect(metadata).toEqual({ towerType: 'SNIPER' });
    });
  });

  describe('Modal Management', () => {
    it('should only allow one modal at a time', () => {
      stateManager.openPanel(UIPanelType.PAUSE_MENU);
      expect(stateManager.getCurrentModal()).toBe(UIPanelType.PAUSE_MENU);
      
      stateManager.openPanel(UIPanelType.SETTINGS);
      expect(stateManager.getCurrentModal()).toBe(UIPanelType.SETTINGS);
      expect(stateManager.isPanelOpen(UIPanelType.PAUSE_MENU)).toBe(false);
    });
  });

  describe('State Events', () => {
    it('should emit panelOpened event', () => {
      let eventData: any = null;
      stateManager.on('panelOpened', (data) => {
        eventData = data;
      });

      stateManager.openPanel(UIPanelType.BUILD_MENU);
      expect(eventData).toBeTruthy();
      expect(eventData.panel).toBe(UIPanelType.BUILD_MENU);
      expect(eventData.state.isOpen).toBe(true);
    });

    it('should emit panelClosed event', () => {
      let eventData: any = null;
      stateManager.on('panelClosed', (data) => {
        eventData = data;
      });

      stateManager.openPanel(UIPanelType.BUILD_MENU);
      stateManager.closePanel(UIPanelType.BUILD_MENU);
      
      expect(eventData).toBeTruthy();
      expect(eventData.panel).toBe(UIPanelType.BUILD_MENU);
      expect(eventData.state.isOpen).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should save and restore state snapshot', () => {
      // Open some panels
      stateManager.openPanel(UIPanelType.BUILD_MENU);
      stateManager.openPanel(UIPanelType.INVENTORY, { filter: 'weapons' });
      
      // Get snapshot
      const snapshot = stateManager.getStateSnapshot();
      
      // Close all panels
      stateManager.closeAllPanels();
      expect(stateManager.getOpenPanels()).toHaveLength(0);
      
      // Restore snapshot
      stateManager.restoreStateSnapshot(snapshot);
      
      // Check restored state
      expect(stateManager.isPanelOpen(UIPanelType.BUILD_MENU)).toBe(true);
      expect(stateManager.isPanelOpen(UIPanelType.INVENTORY)).toBe(true);
      expect(stateManager.getPanelMetadata(UIPanelType.INVENTORY)).toEqual({ filter: 'weapons' });
    });
  });
});