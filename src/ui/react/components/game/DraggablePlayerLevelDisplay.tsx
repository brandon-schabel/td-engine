import React, { useState, useEffect, useCallback } from 'react';
import { ProgressBar } from '../shared/ProgressBar';
import { DraggablePanel } from '../floating';
import { useGameNotifications } from './GameNotifications';
import { cn } from '@/lib/utils';
import type { Game } from '@/core/Game';
import { SoundType } from '@/audio/AudioManager';
import { IconType } from '@/ui/icons/SvgIcons';

interface DraggablePlayerLevelDisplayProps {
  game: Game;
  visible?: boolean;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
}

/**
 * Draggable player level display with experience progress
 * Replaces the FloatingUIManager-based level display
 */
export const DraggablePlayerLevelDisplay: React.FC<DraggablePlayerLevelDisplayProps> = ({ 
  game, 
  visible = true,
  draggable = true,
  defaultPosition,
}) => {
  const [level, setLevel] = useState(0);
  const [experience, setExperience] = useState(0);
  const [experienceToNext, setExperienceToNext] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMaxLevel, setIsMaxLevel] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  
  const { success: showNotification } = useGameNotifications();
  const isMobile = 'ontouchstart' in window;

  // Calculate default position if not provided
  const calculatedDefaultPosition = defaultPosition || {
    x: window.innerWidth - (isMobile ? 140 : 240),
    y: isMobile ? 20 : 50
  };

  // Show level up notification
  const showLevelUpNotification = useCallback((newLevel: number, pointsEarned: number) => {
    // Show toast notification
    showNotification(
      `LEVEL ${newLevel}`,
      {
        icon: IconType.STAR,
        duration: 3000,
        action: pointsEarned > 0 ? {
          label: `+${pointsEarned} Point${pointsEarned > 1 ? 's' : ''}`,
          onClick: () => {
            // Could open upgrade menu here
          }
        } : undefined
      }
    );

    // Play level up sound
    try {
      game.getAudioManager().playSound(SoundType.PLAYER_LEVEL_UP, 1);
    } catch (error) {
      console.debug('Level up sound could not be played:', error);
    }

    // Add glow effect
    setShowGlow(true);
    setTimeout(() => setShowGlow(false), 3000);
  }, [game, showNotification]);

  // Connect to game for level up notifications
  useEffect(() => {
    game.setPlayerLevelDisplay({
      showLevelUpNotification
    });
  }, [game, showLevelUpNotification]);

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

  if (!visible) return null;

  return (
    <DraggablePanel
      id="player-level-display"
      draggable={draggable}
      defaultPosition={calculatedDefaultPosition}
      persistent={true}
      variant="glass-dark"
      className={cn(
        isMobile ? 'p-2' : 'p-3',
        showGlow && 'animate-golden-pulse'
      )}
      zIndex={500}
    >
      <div className={cn(
        isMobile ? 'min-w-[120px]' : 'min-w-[200px]'
      )}>
        {/* Level header */}
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            isMobile ? 'text-sm' : 'text-lg',
            'font-bold text-white'
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
          isMaxLevel ? 'text-status-warning font-bold' : 'text-white/80'
        )}>
          {isMaxLevel 
            ? 'MAX LEVEL' 
            : `${Math.floor(experience)} / ${experienceToNext} XP`
          }
        </div>
      </div>
    </DraggablePanel>
  );
};