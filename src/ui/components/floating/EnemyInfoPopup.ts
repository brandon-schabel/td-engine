/**
 * EnemyInfoPopup.ts - Simple enemy info popup for hover/click
 * Changes:
 * 1. Initial implementation extending EntityInfoPopup
 * 2. Enemy-specific information display
 * 3. Health bar and status effects
 * 4. Reward preview
 * 5. Dynamic updates
 */

import { EntityInfoPopup, type EntityInfoOptions } from './EntityInfoPopup';
import type { Enemy } from '@/entities/Enemy';
import type { Camera } from '@/systems/Camera';
import { COLOR_THEME } from '@/config/ColorTheme';
import { IconType } from '@/ui/icons/SvgIcons';
import { formatNumber } from '@/utils/formatters';
import { ENEMY_STATS } from '@/config/EnemyConfig';

export interface EnemyInfoPopupOptions extends EntityInfoOptions {
  showReward?: boolean;
  showResistances?: boolean;
}

export class EnemyInfoPopup extends EntityInfoPopup {
  private enemy: Enemy;
  private enemyOptions: EnemyInfoPopupOptions;

  constructor(
    enemy: Enemy,
    camera: Camera,
    options: EnemyInfoPopupOptions = {}
  ) {
    const enemyStats = ENEMY_STATS[enemy.enemyType];
    const enemyName = enemy.enemyType.charAt(0).toUpperCase() + enemy.enemyType.slice(1).toLowerCase();
    
    const defaults: EnemyInfoPopupOptions = {
      title: `${enemyName} Enemy`,
      showHealthBar: true,
      showReward: true,
      showResistances: false,
      updateInterval: 100,
      anchor: 'top',
      offset: { x: 0, y: -15 },
      className: 'enemy-info-popup',
      autoHide: true,
      hideDelay: 0, // Will hide when not hovering
      fadeIn: true,
      fadeOut: true
    };

    super(enemy, camera, { ...defaults, ...options });
    
    this.enemy = enemy;
    this.enemyOptions = { ...defaults, ...options };
    
    this.updateSections();
  }

  private updateSections(): void {
    const sections = [];
    
    // Speed
    sections.push({
      label: 'Speed',
      value: this.enemy.speed,
      icon: IconType.SPEED,
      format: (v: number) => `${v}/s`
    });
    
    // Armor
    if (this.enemy.armor > 0) {
      sections.push({
        label: 'Armor',
        value: this.enemy.armor,
        icon: IconType.SHIELD,
        color: COLOR_THEME.ui.text.secondary
      });
    }
    
    // Reward
    if (this.enemyOptions.showReward) {
      const enemyStats = ENEMY_STATS[this.enemy.enemyType];
      sections.push({
        label: 'Reward',
        value: enemyStats.reward,
        icon: IconType.COIN,
        color: COLOR_THEME.ui.currency,
        format: (v: number) => formatNumber(v)
      });
    }
    
    // Status effects
    if (this.enemy.isSlowed) {
      sections.push({
        label: 'Status',
        value: 'Slowed',
        icon: IconType.SLOW,
        color: COLOR_THEME.effects.slow
      });
    }
    
    if (this.enemy.isPoisoned) {
      sections.push({
        label: 'Status',
        value: 'Poisoned',
        icon: IconType.POISON,
        color: COLOR_THEME.effects.poison
      });
    }
    
    this.setSections(sections);
  }

  protected onUpdate(): void {
    // Update sections if enemy state changes
    this.updateSections();
  }

  /**
   * Static factory for quick enemy info
   */
  public static createQuickInfo(
    enemy: Enemy,
    camera: Camera
  ): EnemyInfoPopup {
    return new EnemyInfoPopup(enemy, camera, {
      showReward: true,
      showResistances: false,
      backgroundColor: COLOR_THEME.ui.background.secondary + 'dd',
      borderColor: this.getEnemyColor(enemy),
      minWidth: '150px',
      maxWidth: '200px'
    });
  }

  private static getEnemyColor(enemy: Enemy): string {
    switch (enemy.enemyType) {
      case 'basic':
        return COLOR_THEME.enemies.basic.fill;
      case 'fast':
        return COLOR_THEME.enemies.fast.fill;
      case 'strong':
        return COLOR_THEME.enemies.strong.fill;
      case 'boss':
        return COLOR_THEME.enemies.boss.fill;
      default:
        return COLOR_THEME.ui.border.default;
    }
  }
}