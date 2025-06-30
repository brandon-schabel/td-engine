import React from 'react';
import { useIsPanelOpen } from './hooks/useUIStore';
import { UIPanelType } from '@/stores/uiStore';
import { PauseMenu } from './components/PauseMenu';
import { Settings } from './components/Settings';
import { Inventory } from './components/Inventory';
import { BuildMenu } from './components/BuildMenu';
import { TowerUpgrade } from './components/TowerUpgrade';
import { PlayerUpgrade } from './components/PlayerUpgrade';
import { GameOver } from './components/GameOver';
import { GameHUD } from './components/hud/GameHUD';

/**
 * Main React UI component that manages all UI panels
 * This component subscribes to the UI store and conditionally renders panels
 */
export const AppUI: React.FC = () => {
  // Subscribe to individual panel states for optimal performance
  const isPauseMenuOpen = useIsPanelOpen(UIPanelType.PAUSE_MENU);
  const isSettingsOpen = useIsPanelOpen(UIPanelType.SETTINGS);
  const isGameOverOpen = useIsPanelOpen(UIPanelType.GAME_OVER);
  const isInventoryOpen = useIsPanelOpen(UIPanelType.INVENTORY);
  const isBuildMenuOpen = useIsPanelOpen(UIPanelType.BUILD_MENU);
  const isTowerUpgradeOpen = useIsPanelOpen(UIPanelType.TOWER_UPGRADE);
  const isPlayerUpgradeOpen = useIsPanelOpen(UIPanelType.PLAYER_UPGRADE);

  return (
    <>
      {/* HUD - Always visible during gameplay */}
      <GameHUD />
      
      {/* Modal/Dialog panels */}
      {isPauseMenuOpen && <PauseMenu />}
      {isSettingsOpen && <Settings />}
      {isGameOverOpen && <GameOver />}
      
      {/* Non-modal panels */}
      {isInventoryOpen && <Inventory />}
      {isBuildMenuOpen && <BuildMenu />}
      {isTowerUpgradeOpen && <TowerUpgrade />}
      {isPlayerUpgradeOpen && <PlayerUpgrade />}
    </>
  );
};