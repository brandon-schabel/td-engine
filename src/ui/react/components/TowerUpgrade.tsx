import React, { useState, useEffect } from 'react';
import { Panel, Button } from './shared';
import { IconContainer, InlineStats, type Stat } from './index';
import { cn } from '@/lib/utils';
import { UpgradeType } from '@/entities/Tower';
import type { Tower } from '@/entities/Tower';
import { IconType } from '@/ui/icons/SvgIcons';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { useGameStoreSelector } from '../hooks/useGameStore';
import { SoundType } from '@/audio/AudioManager';

interface UpgradeOption {
  type: UpgradeType;
  name: string;
  description: string;
  cost: number;
  currentLevel: number;
  maxLevel: number;
  icon: IconType;
  effect: string;
}

/**
 * TowerUpgrade React component - Replaces TowerUpgradeUI
 * Manages tower upgrades and selling with safety features
 */
export const TowerUpgrade: React.FC = () => {
  const [sellButtonEnabled, setSellButtonEnabled] = useState(false);
  const currency = useGameStoreSelector(state => state.currency);
  
  // Get tower from metadata
  const metadata = uiStore.getState().getPanelMetadata(UIPanelType.TOWER_UPGRADE);
  const tower = metadata?.tower as Tower | undefined;
  
  // Get game instance
  const game = (window as any).currentGame;
  
  // Force update mechanism for tower state changes
  const [, forceUpdate] = useState({});
  const refresh = () => forceUpdate({});
  
  // Set up periodic updates
  useEffect(() => {
    const interval = setInterval(refresh, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Enable sell button after delay
  useEffect(() => {
    const timeout = setTimeout(() => setSellButtonEnabled(true), 500);
    return () => clearTimeout(timeout);
  }, []);
  
  if (!tower) return null;
  
  const handleClose = () => {
    game?.deselectTower();
  };
  
  const handleUpgrade = (upgradeType: UpgradeType) => {
    const cost = tower.getUpgradeCost(upgradeType);
    if (currency >= cost && tower.canUpgrade(upgradeType)) {
      const success = game?.upgradeTower(tower, upgradeType);
      if (success) {
        game?.getAudioManager()?.playUISound(SoundType.TOWER_UPGRADE);
        refresh();
      } else {
        game?.getAudioManager()?.playUISound(SoundType.ERROR);
      }
    }
  };
  
  const handleSell = () => {
    if (sellButtonEnabled) {
      game?.getAudioManager()?.playUISound(SoundType.SELL);
      game?.sellTower(tower);
      handleClose();
    }
  };
  
  const getUpgradeOptions = (): UpgradeOption[] => {
    return [
      {
        type: UpgradeType.DAMAGE,
        name: 'Damage',
        description: 'Increase tower damage',
        cost: tower.getUpgradeCost(UpgradeType.DAMAGE),
        currentLevel: tower.getUpgradeLevel(UpgradeType.DAMAGE),
        maxLevel: tower.getMaxUpgradeLevel(),
        icon: IconType.DAMAGE,
        effect: getUpgradeEffectText(tower, UpgradeType.DAMAGE)
      },
      {
        type: UpgradeType.RANGE,
        name: 'Range',
        description: 'Increase attack range',
        cost: tower.getUpgradeCost(UpgradeType.RANGE),
        currentLevel: tower.getUpgradeLevel(UpgradeType.RANGE),
        maxLevel: tower.getMaxUpgradeLevel(),
        icon: IconType.RANGE,
        effect: getUpgradeEffectText(tower, UpgradeType.RANGE)
      },
      {
        type: UpgradeType.FIRE_RATE,
        name: 'Speed',
        description: 'Attack more frequently',
        cost: tower.getUpgradeCost(UpgradeType.FIRE_RATE),
        currentLevel: tower.getUpgradeLevel(UpgradeType.FIRE_RATE),
        maxLevel: tower.getMaxUpgradeLevel(),
        icon: IconType.SPEED,
        effect: getUpgradeEffectText(tower, UpgradeType.FIRE_RATE)
      }
    ];
  };
  
  const getUpgradeEffectText = (tower: Tower, upgradeType: UpgradeType): string => {
    const preview = tower.getUpgradePreview(upgradeType);
    if (!preview) return 'MAX';
    
    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return `${Math.round(preview.currentValue)} → ${Math.round(preview.newValue)} (+${Math.round(preview.increase)})`;
      case UpgradeType.RANGE:
        return `${Math.round(preview.currentValue)} → ${Math.round(preview.newValue)} (+${Math.round(preview.increase)})`;
      case UpgradeType.FIRE_RATE:
        return `${preview.currentValue.toFixed(1)}/s → ${preview.newValue.toFixed(1)}/s (+${preview.increase.toFixed(1)}/s)`;
      default:
        return '';
    }
  };
  
  // Calculate position to follow tower
  const towerWorldPos = tower.position;
  const screenPos = game?.worldToScreen(towerWorldPos.x, towerWorldPos.y);
  
  const style: React.CSSProperties = screenPos ? {
    position: 'fixed',
    left: `${screenPos.x}px`,
    top: `${screenPos.y - 20}px`,
    transform: 'translate(-50%, -100%)',
    pointerEvents: 'auto' as const
  } : {
    display: 'none'
  };
  
  const hasAvailableUpgrades = getUpgradeOptions().some(
    opt => opt.currentLevel < opt.maxLevel
  );
  
  return (
    <div style={style} className={cn('z-[1000]')}>
      <Panel
        className={cn('min-w-[280px]', 'max-w-[320px]', 'tower-upgrade-panel', 'compact')}
        onClose={handleClose}
      >
        {/* Tower Header */}
        <TowerHeader tower={tower} />
        
        {/* Upgrade Options */}
        {hasAvailableUpgrades && (
          <div className={cn('space-y-2', 'mb-3')}>
            {getUpgradeOptions().map(option => (
              <UpgradeCard
                key={option.type}
                option={option}
                canAfford={currency >= option.cost}
                onUpgrade={() => handleUpgrade(option.type)}
              />
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className={cn('flex', 'gap-2', 'mt-3')}>
          <Button
            icon={IconType.SELL}
            variant="danger"
            size="sm"
            disabled={!sellButtonEnabled}
            onClick={handleSell}
            className="flex-1"
          >
            Sell (${Math.floor(tower.getTotalValue() * 0.7)})
          </Button>
          
          <Button
            icon={IconType.INFO}
            variant="secondary"
            size="sm"
            onClick={() => console.log('Show stats')}
            className="flex-1"
          >
            Stats
          </Button>
        </div>
      </Panel>
    </div>
  );
};

/**
 * Tower header component
 */
const TowerHeader: React.FC<{ tower: Tower }> = ({ tower }) => {
  const stats: Stat[] = [
    { label: 'Dmg', value: Math.round(tower.damage).toString() },
    { label: 'Rng', value: Math.round(tower.range).toString() },
    { label: 'Spd', value: `${tower.fireRate.toFixed(1)}/s` }
  ];
  
  return (
    <div className={cn('flex', 'items-center', 'justify-between', 'mb-3')}>
      <div className={cn('flex', 'items-center', 'gap-3')}>
        <IconContainer
          icon={getTowerIcon(tower.towerType)}
          size="md"
          variant="filled"
          color="primary"
        />
        <div>
          <div className={cn('text-sm', 'font-semibold', 'text-white')}>
            {tower.towerType.replace('_', ' ')}
          </div>
          <InlineStats stats={stats} />
        </div>
      </div>
    </div>
  );
};

/**
 * Upgrade option card
 */
const UpgradeCard: React.FC<{
  option: UpgradeOption;
  canAfford: boolean;
  onUpgrade: () => void;
}> = ({ option, canAfford, onUpgrade }) => {
  const isMaxLevel = option.currentLevel >= option.maxLevel;
  
  return (
    <div
      className={cn(
        'bg-ui-bg-tertiary',
        'border',
        isMaxLevel ? 'border-ui-border-subtle' : canAfford ? 'border-button-primary hover:border-button-primary-hover' : 'border-ui-border-DEFAULT',
        'rounded',
        'p-2',
        'cursor-pointer',
        'transition-all',
        isMaxLevel && 'opacity-50 cursor-not-allowed'
      )}
      onClick={!isMaxLevel && canAfford ? onUpgrade : undefined}
    >
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <div className={cn('flex', 'items-center', 'gap-2')}>
          <span className={cn('text-lg')}>{option.name}</span>
          <span className={cn('text-xs', 'text-ui-text-secondary')}>
            Lv.{option.currentLevel}/{option.maxLevel}
          </span>
        </div>
        <span className={cn(
          'text-sm',
          'font-bold',
          canAfford ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
        )}>
          ${option.cost}
        </span>
      </div>
      <div className={cn('text-xs', 'text-ui-text-secondary', 'mt-1')}>
        {option.effect}
      </div>
    </div>
  );
};


// Helper function to get tower icon
const getTowerIcon = (towerType: string): IconType => {
  const iconMap: Record<string, IconType> = {
    'BASIC': IconType.BASIC_TOWER,
    'SNIPER': IconType.SNIPER_TOWER,
    'RAPID': IconType.RAPID_TOWER,
    'WALL': IconType.WALL
  };
  return iconMap[towerType] || IconType.BASIC_TOWER;
};