/**
 * PowerUpDisplay Component
 * Shows active power-ups with timers and effects
 */

import { styled } from '@/ui/core/styled';
import type { Game } from '@/core/Game';
import type { Player } from '@/entities/Player';
import type { ActivePowerUp } from '@/entities/player/PlayerPowerUps';
import { createSvgIcon, IconType } from '../../icons/SvgIcons';

interface PowerUpInfo {
  type: string;
  name: string;
  iconType: IconType;
  color: string;
  endTime: number;
  duration: number;
}

interface PowerUpDisplayProps {
  game: Game;
  uiManager?: any;
  visible?: boolean;
}

export class PowerUpDisplay {
  private updateTimer: number | null = null;
  private container: HTMLElement | null = null;
  private game: Game;
  private activePowerUps: PowerUpInfo[] = [];
  
  // Power-up configuration
  private readonly powerUpConfig = {
    'EXTRA_DAMAGE': {
      name: 'Extra Damage',
      iconType: IconType.POWERUP_DAMAGE,
      color: '#ff6b6b',
      duration: 10000
    },
    'FASTER_SHOOTING': {
      name: 'Rapid Fire',
      iconType: IconType.POWERUP_FIRE_RATE,
      color: '#ffe66d',
      duration: 8000
    },
    'SHIELD': {
      name: 'Shield',
      iconType: IconType.POWERUP_SHIELD,
      color: '#4ecdc4',
      duration: 15000
    },
    'SPEED_BOOST': {
      name: 'Speed Boost',
      iconType: IconType.POWERUP_SPEED,
      color: '#a8e6cf',
      duration: 12000
    },
    'HEALTH_REGEN': {
      name: 'Health Regen',
      iconType: IconType.POWERUP_HEALTH_REGEN,
      color: '#ff9ff3',
      duration: 20000
    }
  };

  constructor(props: PowerUpDisplayProps) {
    this.game = props.game;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.ensureAnimationStyles();
    this.render();
    this.startUpdateTimer();
  }

  unmount(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }

  private startUpdateTimer(): void {
    // Update every 100ms for smooth animations
    this.updateTimer = window.setInterval(() => {
      this.updateActivePowerUps();
    }, 100);
  }

  private updateActivePowerUps(): void {
    const player = this.game.getPlayer() as Player;
    if (!player) return;

    const activePowerUps = player.getPlayerPowerUps().getActivePowerUps();
    const currentTime = Date.now();
    
    const powerUpInfos: PowerUpInfo[] = [];
    
    activePowerUps.forEach((powerUp: ActivePowerUp) => {
      const config = this.powerUpConfig[powerUp.type as keyof typeof this.powerUpConfig];
      if (config && powerUp.endTime > currentTime) {
        const remainingTime = powerUp.endTime - currentTime;
        const totalDuration = config.duration;
        
        powerUpInfos.push({
          type: powerUp.type,
          name: config.name,
          iconType: config.iconType,
          color: config.color,
          endTime: powerUp.endTime,
          duration: totalDuration
        });
      }
    });

    // Only update if there are changes
    if (this.hasChanges(powerUpInfos)) {
      this.activePowerUps = powerUpInfos;
      this.render();
    }
  }

  private hasChanges(newPowerUps: PowerUpInfo[]): boolean {
    const current = this.activePowerUps;
    
    if (current.length !== newPowerUps.length) return true;
    
    return newPowerUps.some((newPU, index) => {
      const currentPU = current[index];
      return !currentPU || 
             currentPU.type !== newPU.type || 
             Math.abs(currentPU.endTime - newPU.endTime) > 1000; // 1s threshold
    });
  }

  private render(): void {
    if (!this.container) return;

    // Clear existing content
    this.container.innerHTML = '';

    if (this.activePowerUps.length === 0) {
      return; // Return if no power-ups
    }

    // Main container for power-ups
    const powerUpContainer = document.createElement('div');
    powerUpContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1200;
      pointer-events: none;
    `;

    // Create power-up items
    this.activePowerUps.forEach(powerUp => {
      const item = this.createPowerUpItem(powerUp);
      powerUpContainer.appendChild(item);
    });

    this.container.appendChild(powerUpContainer);
  }

  private createPowerUpItem(powerUp: PowerUpInfo): HTMLElement {
    const currentTime = Date.now();
    const timeRemaining = Math.max(0, powerUp.endTime - currentTime);
    const progress = timeRemaining / powerUp.duration;
    const secondsRemaining = Math.ceil(timeRemaining / 1000);

    const item = document.createElement('div');
    const isLowTime = timeRemaining < 3000;
    
    item.style.cssText = `
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid ${isLowTime ? '#ff4444' : powerUp.color};
      border-radius: 8px;
      padding: 8px;
      min-width: 200px;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      ${isLowTime ? 'animation: powerup-pulse 1s ease-in-out infinite;' : ''}
    `;

    // Icon
    const icon = document.createElement('div');
    icon.style.cssText = `
      margin-right: 8px;
      filter: drop-shadow(0 0 8px ${powerUp.color});
      animation: powerup-glow 2s ease-in-out infinite alternate;
      color: ${powerUp.color};
    `;
    icon.innerHTML = createSvgIcon(powerUp.iconType, { size: 24, title: powerUp.name });

    // Info container
    const infoContainer = document.createElement('div');
    infoContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    `;

    // Name
    const name = document.createElement('div');
    name.style.cssText = `
      font-weight: bold;
      color: white;
      font-size: 14px;
      margin-bottom: 2px;
      text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
    `;
    name.textContent = powerUp.name;

    // Timer
    const timer = document.createElement('div');
    timer.style.cssText = `
      font-size: 12px;
      color: ${isLowTime ? '#ff4444' : powerUp.color};
      font-weight: 600;
      text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
    `;

    // Format timer as MM:SS for durations over 60 seconds, otherwise just seconds
    const timerText = timeRemaining >= 60000 
      ? `${Math.floor(timeRemaining / 60000)}:${String(Math.floor((timeRemaining % 60000) / 1000)).padStart(2, '0')}`
      : `${secondsRemaining}s`;
    
    timer.textContent = timerText;

    // Progress bar background
    const progressBackground = document.createElement('div');
    progressBackground.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
    `;

    // Progress bar fill
    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: ${isLowTime ? `linear-gradient(90deg, #ff4444, ${powerUp.color})` : powerUp.color};
      width: ${Math.max(0, progress * 100)}%;
      transition: width 0.1s ease-out;
      box-shadow: 0 0 8px ${powerUp.color};
      ${isLowTime ? 'animation: powerup-progress-pulse 0.5s ease-in-out infinite alternate;' : ''}
    `;

    // Assemble components
    infoContainer.appendChild(name);
    infoContainer.appendChild(timer);

    item.appendChild(icon);
    item.appendChild(infoContainer);
    item.appendChild(progressBackground);
    item.appendChild(progressFill);

    return item;
  }

  // Add CSS for animations
  private ensureAnimationStyles(): void {
    if (document.getElementById('powerup-animations')) return;

    const style = document.createElement('style');
    style.id = 'powerup-animations';
    style.textContent = `
      @keyframes powerup-pulse {
        0% { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(255, 68, 68, 0.5); }
        50% { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(255, 68, 68, 0.3); }
        100% { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(255, 68, 68, 0.5); }
      }
      
      @keyframes powerup-glow {
        from { filter: drop-shadow(0 0 8px currentColor); }
        to { filter: drop-shadow(0 0 12px currentColor) drop-shadow(0 0 16px currentColor); }
      }
      
      @keyframes powerup-progress-pulse {
        from { opacity: 0.8; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}