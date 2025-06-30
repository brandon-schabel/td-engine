import React, { useState, useEffect, useRef } from 'react';
import { ProgressBar } from '../shared/ProgressBar';
import { cn } from '@/lib/utils';
import type { Game } from '@/core/Game';
import { PersistentPositionManager } from '@/ui/utils/PersistentPositionManager';
import { SoundType } from '@/audio/AudioManager';

interface PlayerLevelDisplayProps {
  game: Game;
  visible?: boolean;
}

export const PlayerLevelDisplay: React.FC<PlayerLevelDisplayProps> = ({ 
  game, 
  visible = true 
}) => {
  const [level, setLevel] = useState(0);
  const [experience, setExperience] = useState(0);
  const [experienceToNext, setExperienceToNext] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMaxLevel, setIsMaxLevel] = useState(false);
  const floatingRef = useRef<any>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  const isMobile = 'ontouchstart' in window;

  // Initialize floating UI
  useEffect(() => {
    const floatingUI = game.getFloatingUIManager();
    const floatingElement = floatingUI.create('player-level-display', 'custom', {
      className: cn('pointer-events-auto'),
      screenSpace: true,
      draggable: true,
      persistPosition: true,
      positionKey: 'player-level-display-position',
      zIndex: 500,
      smoothing: 0,
      autoHide: false,
      persistent: true
    });

    floatingRef.current = floatingElement;

    // Load saved position or use default
    const savedPosition = PersistentPositionManager.loadPosition('player-level-display', 'player-level-display-position');
    if (savedPosition) {
      const minMargin = 20;
      const width = isMobile ? 120 : 220;
      const adjustedPos = {
        x: Math.min(Math.max(minMargin, savedPosition.x), window.innerWidth - width - minMargin),
        y: Math.max(minMargin, savedPosition.y)
      };
      floatingElement.setTarget(adjustedPos);
    } else {
      const width = isMobile ? 120 : 220;
      const height = isMobile ? 70 : 100;
      const padding = isMobile ? 20 : 50;
      const defaultPos = PersistentPositionManager.getDefaultPosition(width, height, 'top-right', padding);
      floatingElement.setTarget({ x: defaultPos.x, y: defaultPos.y });
    }

    if (visible) {
      floatingElement.enable();
    }

    // Connect to game for level up notifications
    game.setPlayerLevelDisplay({
      showLevelUpNotification: (newLevel: number, pointsEarned: number) => {
        showLevelUpNotification(newLevel, pointsEarned);
      }
    });

    return () => {
      floatingUI.remove('player-level-display');
    };
  }, [game, visible, isMobile]);

  // Update display content
  useEffect(() => {
    if (floatingRef.current && displayRef.current) {
      floatingRef.current.setContent(displayRef.current);
    }
  }, [level, experience, availablePoints, progress]);

  // Update level data
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const player = game.getPlayer();
      const levelSystem = player.getPlayerLevelSystem();
      
      setLevel(levelSystem.getLevel());
      setExperience(levelSystem.getExperience());
      setExperienceToNext(levelSystem.getExperienceToNextLevel());
      setAvailablePoints(levelSystem.getAvailableUpgradePoints());
      setProgress(levelSystem.getLevelProgress());
      setIsMaxLevel(levelSystem.getLevel() >= 50);
    }, 100);

    return () => clearInterval(updateInterval);
  }, [game]);

  // Visibility control
  useEffect(() => {
    if (floatingRef.current) {
      if (visible) {
        floatingRef.current.enable();
      } else {
        floatingRef.current.disable();
      }
    }
  }, [visible]);

  const showLevelUpNotification = (newLevel: number, pointsEarned: number) => {
    const floatingUI = game.getFloatingUIManager();
    const notificationId = `level-up-${Date.now()}`;
    
    const notification = floatingUI.create(notificationId, 'popup', {
      persistent: false,
      autoHide: false,
      smoothing: 0.1,
      className: cn(
        'fixed top-20 left-1/2 transform -translate-x-1/2',
        'bg-ui-bg-primary border-2 border-status-warning',
        'rounded-lg px-6 py-3 shadow-lg z-[900]',
        'animate-slide-down-fade-in'
      )
    });

    const content = document.createElement('div');
    content.className = 'text-center space-y-1';
    
    const levelDiv = document.createElement('div');
    levelDiv.className = 'text-lg font-bold text-game-currency';
    levelDiv.textContent = `LEVEL ${newLevel}`;
    
    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'text-sm text-status-warning';
    pointsDiv.textContent = pointsEarned === 1 
      ? '+1 Upgrade Point' 
      : `+${pointsEarned} Upgrade Points`;
    
    content.appendChild(levelDiv);
    content.appendChild(pointsDiv);

    notification.setContent(content);
    notification.enable();

    // Play level up sound
    try {
      game.getAudioManager().playSound(SoundType.PLAYER_LEVEL_UP, 1);
    } catch (error) {
      console.debug('Level up sound could not be played:', error);
    }

    // Add glow effect
    if (displayRef.current) {
      displayRef.current.classList.add('animate-golden-pulse');
      setTimeout(() => {
        displayRef.current?.classList.remove('animate-golden-pulse');
      }, 3000);
    }

    // Auto-remove notification
    setTimeout(() => {
      floatingUI.remove(notificationId);
    }, 2500);
  };

  return (
    <div 
      ref={displayRef}
      className={cn(
        'bg-ui-bg-secondary border border-ui-border-DEFAULT rounded-lg',
        isMobile ? 'p-2' : 'p-3',
        'shadow-lg',
        isMobile ? 'min-w-[120px]' : 'min-w-[200px]',
        'pointer-events-auto'
      )}
    >
      {/* Level header */}
      <div className="flex items-center justify-between mb-2">
        <div className={cn(
          isMobile ? 'text-sm' : 'text-lg',
          'font-bold text-ui-text-primary'
        )}>
          Level {level}
        </div>
        
        {availablePoints > 0 && (
          <div className={cn(
            isMobile ? 'text-xs' : 'text-sm',
            'text-status-success font-medium'
          )}>
            {availablePoints} Points
          </div>
        )}
      </div>

      {/* Experience progress bar */}
      <div className="mb-1">
        <ProgressBar
          progress={progress}
          className={cn(
            'w-full',
            isMobile ? 'h-2' : 'h-3'
          )}
          fillColor="primary"
          animated
        />
      </div>

      {/* Experience text */}
      <div className={cn(
        'text-xs text-center',
        isMaxLevel ? 'text-status-warning font-bold' : 'text-ui-text-secondary'
      )}>
        {isMaxLevel 
          ? 'MAX LEVEL' 
          : `${Math.floor(experience)} / ${experienceToNext} XP`
        }
      </div>
    </div>
  );
};