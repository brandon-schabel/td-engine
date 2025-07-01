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
import { GameNotificationsProvider } from './components/game/GameNotifications';
import { DraggablePlayerLevelDisplay } from './components/game/DraggablePlayerLevelDisplay';
import { DebugDraggable } from './components/DebugDraggable';

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
  
  // Get game instance
  const game = (window as any).currentGame;

  return (
    <GameNotificationsProvider>
      {/* Debug draggable for testing */}
      <DebugDraggable />
      
      {/* HUD - Always visible during gameplay */}
      <GameHUD />
      
      {/* Draggable displays */}
      {game && <DraggablePlayerLevelDisplay game={game} />}
      
      {/* Modal/Dialog panels */}
      {isPauseMenuOpen && <PauseMenu />}
      {isSettingsOpen && <Settings />}
      {isGameOverOpen && <GameOver />}
      
      {/* Non-modal panels */}
      {isInventoryOpen && <Inventory />}
      {isBuildMenuOpen && <BuildMenu />}
      {isTowerUpgradeOpen && <TowerUpgrade />}
      {isPlayerUpgradeOpen && <PlayerUpgrade />}
    </GameNotificationsProvider>
  );
};