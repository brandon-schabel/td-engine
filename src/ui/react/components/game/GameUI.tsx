import React, { useEffect, useState } from 'react';
import { ControlBar } from './ControlBar';
import { TowerPlacementIndicator } from './TowerPlacementIndicator';
import { DraggableCurrencyDisplay } from './DraggableCurrencyDisplay';
import { DraggableScoreDisplay } from './DraggableScoreDisplay';
import { DraggableHealthDisplay } from './DraggableHealthDisplay';
import { DraggableWaveDisplay } from './DraggableWaveDisplay';
import { DraggablePlayerLevelDisplay } from './DraggablePlayerLevelDisplay';
import { MobileControls } from './MobileControls';
import { useFloatingDamageNumbers } from '../floating/FloatingDamageNumber';
import { BuildModeOverlay } from '../floating/BuildModeOverlay';
import { useIsPanelOpen } from '../../hooks/useUIStore';
import { UIPanelType } from '@/stores/uiStore';
import type { Game } from '@/core/Game';

interface GameUIProps {
  game: Game;
}

// Export separate components for better control over layout
export const GameOverlayUI: React.FC<GameUIProps> = ({ game }) => {
  const [selectedTowerType, setSelectedTowerType] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(game.isPaused());

  // Event listeners for tower selection and pause state
  useEffect(() => {
    const updatePaused = () => setIsPaused(game.isPaused());
    const updateSelectedTower = () => setSelectedTowerType(game.getSelectedTowerType());

    document.addEventListener('gamePaused', updatePaused);
    document.addEventListener('gameResumed', updatePaused);

    const checkTowerSelection = setInterval(updateSelectedTower, 100);

    return () => {
      document.removeEventListener('gamePaused', updatePaused);
      document.removeEventListener('gameResumed', updatePaused);
      clearInterval(checkTowerSelection);
    };
  }, [game]);

  return (
    <>
      <TowerPlacementIndicator selectedTowerType={selectedTowerType} />
      
      {/* Game paused overlay */}
      {isPaused && (
        <div className="game-paused" />
      )}
    </>
  );
};

export const GameUI: React.FC<GameUIProps> = ({ game }) => {
  const [selectedTowerType, setSelectedTowerType] = useState<string | null>(null);
  const [isWaveComplete, setIsWaveComplete] = useState(game.isWaveComplete());
  const [isPaused, setIsPaused] = useState(game.isPaused());
  const { showDamage, DamageNumbers } = useFloatingDamageNumbers();
  const isInBuildMode = useIsPanelOpen(UIPanelType.BUILD_MODE);

  // Event listeners
  useEffect(() => {
    const updateSelectedTower = () => setSelectedTowerType(game.getSelectedTowerType());
    const updateWaveComplete = () => setIsWaveComplete(game.isWaveComplete());
    const updatePaused = () => setIsPaused(game.isPaused());

    // Wave events
    document.addEventListener('waveComplete', updateWaveComplete);
    document.addEventListener('waveStarted', updateWaveComplete);

    // Game state events
    document.addEventListener('gamePaused', updatePaused);
    document.addEventListener('gameResumed', updatePaused);

    // Tower selection
    const checkTowerSelection = setInterval(updateSelectedTower, 100);

    return () => {
      document.removeEventListener('waveComplete', updateWaveComplete);
      document.removeEventListener('waveStarted', updateWaveComplete);
      document.removeEventListener('gamePaused', updatePaused);
      document.removeEventListener('gameResumed', updatePaused);
      clearInterval(checkTowerSelection);
    };
  }, [game]);

  // Damage number event listener
  useEffect(() => {
    const handleDamageNumber = (e: CustomEvent) => {
      const { worldPosition, value, type } = e.detail;
      showDamage({
        worldPosition,
        value,
        type: type || 'physical',
        duration: 1500,
      });
    };

    document.addEventListener('damageNumber', handleDamageNumber as EventListener);
    return () => {
      document.removeEventListener('damageNumber', handleDamageNumber as EventListener);
    };
  }, [showDamage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          handleBuildMenu();
          break;
        case 'u':
          handlePlayerUpgrade();
          break;
        case 'e':
          handleInventory();
          break;
        case 'enter':
          if (isWaveComplete && !game.isGameOverPublic()) {
            handleStartWave();
          }
          break;
        case ' ':
          e.preventDefault();
          handlePause();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isWaveComplete, game]);

  const handleBuildMenu = () => {
    const uiController = game.getUIController();
    const buildButton = document.querySelector('.ui-button-control[title*="Build"]') as HTMLElement;
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let anchorElement: HTMLElement | undefined = undefined;
    
    if (!isMobile && buildButton) {
      // Desktop: anchor to button
      const rect = buildButton.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      anchorElement = buildButton;
    }
    // Mobile: use center position (no anchor)

    uiController.showBuildMenu(screenPos.x, screenPos.y, (towerType) => {
      game.setSelectedTowerType(towerType);
      setSelectedTowerType(towerType);
    }, anchorElement);
  };

  const handlePlayerUpgrade = () => {
    const uiController = game.getUIController();
    const player = game.getPlayer();
    if (player) {
      uiController.showPlayerUpgrade(player);
    }
  };

  const handleInventory = () => {
    const uiController = game.getUIController();
    const inventoryButton = document.querySelector('.ui-button-control[title*="Inventory"]') as HTMLElement;
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    if (!isMobile && inventoryButton) {
      // Desktop: position above button
      const rect = inventoryButton.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
    }
    // Mobile: use center position
    
    uiController.showInventory(screenPos);
  };

  const handleStartWave = () => {
    game.startNextWave();
  };

  const handlePause = () => {
    const uiController = game.getUIController();
    
    if (game.isPaused()) {
      game.resume();
      uiController.close('pause-menu');
    } else {
      game.pause();
      uiController.showPauseMenu({
        onResume: () => {
          game.resume();
          uiController.close('pause-menu');
        },
        onSettings: () => {
          uiController.close('pause-menu');
          // Settings will be opened by ControlBar
        },
        onRestart: () => {
          if (confirm('Are you sure you want to restart the game?')) {
            window.location.reload();
          }
        },
        onQuit: () => {
          if (confirm('Are you sure you want to quit to main menu?')) {
            window.location.reload();
          }
        }
      });
    }
  };

  const handleCancelBuildMode = () => {
    game.getUIController().exitBuildMode();
  };

  return (
    <>
      {/* Draggable displays */}
      <DraggableHealthDisplay />
      <DraggableCurrencyDisplay />
      <DraggableWaveDisplay />
      <DraggableScoreDisplay />
      <DraggablePlayerLevelDisplay game={game} />
      
      <ControlBar
        game={game}
        onBuildMenu={handleBuildMenu}
        onPlayerUpgrade={handlePlayerUpgrade}
        onInventory={handleInventory}
        onStartWave={handleStartWave}
        onPause={handlePause}
        isWaveComplete={isWaveComplete}
        isPaused={isPaused}
      />

      <TowerPlacementIndicator selectedTowerType={selectedTowerType} />

      {/* Build mode overlay */}
      {isInBuildMode && (
        <BuildModeOverlay onCancel={handleCancelBuildMode} />
      )}

      {/* Damage numbers */}
      <DamageNumbers />

      {/* Game paused overlay */}
      {isPaused && (
        <div className="game-paused" />
      )}
      
      {/* Mobile Controls */}
      <MobileControls game={game} />
    </>
  );
};