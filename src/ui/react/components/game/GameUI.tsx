import React, { useEffect, useState, useRef } from 'react';
import { ControlBar } from './ControlBar';
import { TowerPlacementIndicator } from './TowerPlacementIndicator';
import { ResourceDisplay } from '../shared/ResourceDisplay';
import { IconType } from '@/ui/icons/SvgIcons';
import { cn } from '@/lib/utils';
import type { Game } from '@/core/Game';
import { PersistentPositionManager } from '@/ui/utils/PersistentPositionManager';

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
  const [currency, setCurrency] = useState(game.getCurrency());
  const [selectedTowerType, setSelectedTowerType] = useState<string | null>(null);
  const [isWaveComplete, setIsWaveComplete] = useState(game.isWaveComplete());
  const [isPaused, setIsPaused] = useState(game.isPaused());
  const currencyFloatingRef = useRef<any>(null);

  // Initialize UI components
  useEffect(() => {
    const floatingUI = game.getFloatingUIManager();

    // Create floating currency display
    const currencyFloatingElement = floatingUI.create('currency-display-floating', 'custom', {
      className: cn('pointer-events-auto'),
      screenSpace: true,
      draggable: true,
      persistPosition: true,
      positionKey: 'currency-display-position',
      zIndex: 500,
      smoothing: 0,
      autoHide: false,
      persistent: true
    });

    currencyFloatingRef.current = currencyFloatingElement;

    // Load saved position or use default
    const savedPos = PersistentPositionManager.loadPosition('currency-display', 'currency-display-position');
    if (savedPos) {
      const minMargin = 20;
      const adjustedPos = {
        x: Math.max(minMargin, savedPos.x),
        y: Math.max(60, savedPos.y)
      };
      currencyFloatingElement.setTarget(adjustedPos);
    } else {
      currencyFloatingElement.setTarget({ x: 20, y: 100 });
    }
    currencyFloatingElement.enable();

    return () => {
      floatingUI.remove('currency-display-floating');
    };
  }, [game]);

  // Update currency display
  useEffect(() => {
    if (currencyFloatingRef.current) {
      const content = (
        <ResourceDisplay
          id="currency-display"
          value={currency}
          icon={IconType.COINS}
          variant="compact"
          showIcon={true}
        />
      );
      currencyFloatingRef.current.setContent(content);
    }
  }, [currency]);

  // Event listeners
  useEffect(() => {
    const updateCurrency = () => setCurrency(game.getCurrency());
    const updateWaveComplete = () => setIsWaveComplete(game.isWaveComplete());
    const updatePaused = () => setIsPaused(game.isPaused());
    const updateSelectedTower = () => setSelectedTowerType(game.getSelectedTowerType());

    // Currency events
    document.addEventListener('currencyChanged', updateCurrency);
    document.addEventListener('towerBuilt', updateCurrency);
    document.addEventListener('towerUpgraded', updateCurrency);
    document.addEventListener('towerSold', updateCurrency);

    // Wave events
    document.addEventListener('waveComplete', updateWaveComplete);
    document.addEventListener('waveStarted', updateWaveComplete);

    // Game state events
    document.addEventListener('gamePaused', updatePaused);
    document.addEventListener('gameResumed', updatePaused);

    // Tower selection
    const checkTowerSelection = setInterval(updateSelectedTower, 100);

    return () => {
      document.removeEventListener('currencyChanged', updateCurrency);
      document.removeEventListener('towerBuilt', updateCurrency);
      document.removeEventListener('towerUpgraded', updateCurrency);
      document.removeEventListener('towerSold', updateCurrency);
      document.removeEventListener('waveComplete', updateWaveComplete);
      document.removeEventListener('waveStarted', updateWaveComplete);
      document.removeEventListener('gamePaused', updatePaused);
      document.removeEventListener('gameResumed', updatePaused);
      clearInterval(checkTowerSelection);
    };
  }, [game]);

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
    
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    if (buildButton) {
      const rect = buildButton.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
    }

    uiController.showBuildMenu(screenPos.x, screenPos.y, (towerType) => {
      game.setSelectedTowerType(towerType);
      setSelectedTowerType(towerType);
    }, buildButton || undefined);
  };

  const handlePlayerUpgrade = () => {
    const uiController = game.getUIController();
    const player = game.getPlayer();
    
    if (player) {
      const upgradeButton = document.querySelector('.ui-button-control[title*="Player Upgrades"]') as HTMLElement;
      let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      
      if (upgradeButton) {
        const rect = upgradeButton.getBoundingClientRect();
        screenPos = {
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        };
      }
      
      uiController.showPlayerUpgrade(player, screenPos);
    }
  };

  const handleInventory = () => {
    const uiController = game.getUIController();
    const inventoryButton = document.querySelector('.ui-button-control[title*="Inventory"]') as HTMLElement;
    
    let screenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    if (inventoryButton) {
      const rect = inventoryButton.getBoundingClientRect();
      screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
    }
    
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

  return (
    <>
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

      {/* Game paused overlay */}
      {isPaused && (
        <div className="game-paused" />
      )}
    </>
  );
};