/**
 * Entity Popups Demo
 * Demonstrates the floating UI popup system for entities
 */

import { Game } from '@/core/Game';
import { DamageType } from '@/ui/components/floating/DamageNumberPopup';
import { EntityInfoPopup } from '@/ui/components/floating/EntityInfoPopup';
import { HealthBarPopup } from '@/ui/components/floating/HealthBarPopup';
import { IconType } from '@/ui/icons/SvgIcons';

// Example 1: Damage Numbers
function showDamageNumbers(game: Game) {
  const popupManager = game.getPopupManager();
  const enemies = game.getEnemies();
  
  // Show damage numbers on all enemies
  enemies.forEach((enemy, index) => {
    setTimeout(() => {
      const damage = Math.floor(Math.random() * 50) + 10;
      const isCritical = Math.random() > 0.7;
      
      popupManager.createDamageNumber(
        enemy,
        damage,
        isCritical ? DamageType.CRITICAL : DamageType.NORMAL
      );
    }, index * 100);
  });
}

// Example 2: Entity Info Popups
function showEntityInfo(game: Game) {
  const popupManager = game.getPopupManager();
  const player = game.getPlayer();
  
  // Show player info
  const playerInfo = popupManager.createEntityInfo(player, {
    title: 'Player',
    sections: [
      {
        label: 'Level',
        value: player.getLevel(),
        icon: IconType.STAR,
        color: '#FFD700'
      },
      {
        label: 'Health',
        value: player.health,
        icon: IconType.HEALTH,
        color: '#00FF00',
        format: (v) => `${v}/${player.maxHealth}`
      },
      {
        label: 'Damage',
        value: player.getDamage(),
        icon: IconType.DAMAGE,
        color: '#FF6347'
      },
      {
        label: 'Speed',
        value: player.getSpeed(),
        icon: IconType.SPEED,
        color: '#87CEEB'
      }
    ],
    showHealthBar: true,
    updateInterval: 100
  });
  
  // Hide after 5 seconds
  setTimeout(() => {
    popupManager.removePopup(playerInfo);
  }, 5000);
}

// Example 3: Health Bars
function showHealthBars(game: Game) {
  const popupManager = game.getPopupManager();
  const towers = game.getTowers();
  
  // Add health bars to all towers
  towers.forEach(tower => {
    popupManager.createHealthBar(tower, {
      hideWhenFull: true,
      flashOnDamage: true,
      showText: true
    });
  });
}

// Example 4: Combined Effects
function showCombinedEffects(game: Game) {
  const popupManager = game.getPopupManager();
  const enemies = game.getEnemies();
  
  // Simulate AOE damage with burst effect
  const centerEnemy = enemies[Math.floor(enemies.length / 2)];
  if (centerEnemy) {
    // Find nearby enemies
    const nearbyEnemies = enemies.filter(enemy => 
      enemy.distanceTo(centerEnemy) < 100
    );
    
    // Show damage burst
    popupManager.createDamageBurst(
      nearbyEnemies,
      75,
      DamageType.FIRE
    );
    
    // Add temporary info popup on center enemy
    const aoePop = popupManager.createEntityInfo(centerEnemy, {
      title: 'AOE Center',
      sections: [
        {
          value: 'Explosion!',
          color: '#FF6347'
        }
      ],
      backgroundColor: 'rgba(255, 99, 71, 0.9)',
      borderColor: '#FF6347',
      autoHide: true,
      hideDelay: 2000
    });
  }
}

// Example 5: Custom Popup Usage
function createCustomPopup(game: Game) {
  const popupManager = game.getPopupManager();
  const player = game.getPlayer();
  
  // Create a power-up notification
  const powerUpPopup = popupManager.createEntityInfo(player, {
    title: 'Power Up!',
    sections: [
      {
        value: '+50% Damage',
        icon: IconType.DAMAGE,
        color: '#FF0000'
      },
      {
        value: 'Duration: 10s',
        icon: IconType.TIMER,
        color: '#FFD700'
      }
    ],
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    borderColor: '#FFD700',
    anchor: 'bottom',
    offset: { x: 0, y: 20 },
    autoHide: true,
    hideDelay: 3000
  });
}

// Usage in game
export function setupEntityPopupsDemo(game: Game) {
  // Add keyboard shortcuts for demo
  window.addEventListener('keydown', (e) => {
    switch(e.key) {
      case '1':
        showDamageNumbers(game);
        break;
      case '2':
        showEntityInfo(game);
        break;
      case '3':
        showHealthBars(game);
        break;
      case '4':
        showCombinedEffects(game);
        break;
      case '5':
        createCustomPopup(game);
        break;
      case '0':
        // Clear all popups
        game.getPopupManager().clearAll();
        break;
    }
  });
  
  console.log('Entity Popups Demo loaded!');
  console.log('Press keys 1-5 to show different popup types');
  console.log('Press 0 to clear all popups');
}