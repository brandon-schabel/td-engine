import React from 'react';
import { Panel } from './shared';
import { ResourceDisplay, Icon } from './index';
import { cn } from '@/lib/utils';
import { TowerType } from '@/entities/Tower';
import { IconType } from '@/ui/icons/SvgIcons';
import { COLOR_THEME } from '@/config/ColorTheme';
import { TOWER_COSTS } from '@/config/GameConfig';
import { useGameStoreSelector } from '../hooks/useGameStore';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { SoundType } from '@/audio/AudioManager';

interface TowerOption {
  type: TowerType;
  name: string;
  cost: number;
  icon: IconType;
  color: string;
}

/**
 * BuildMenu React component - Replaces BuildMenuUI
 * Shows a grid of available towers with costs and affordability
 */
export const BuildMenu: React.FC = () => {
  const currency = useGameStoreSelector(state => state.currency);
  
  // Get metadata from UI store for position and callback
  const metadata = uiStore.getState().getPanelMetadata(UIPanelType.BUILD_MENU);
  const position = metadata?.position as { x: number; y: number } | undefined;
  const onTowerSelect = metadata?.onTowerSelect as ((type: TowerType) => void) | undefined;
  
  // Get game instance
  const game = (window as any).currentGame;
  
  const towers: TowerOption[] = [
    {
      type: TowerType.BASIC,
      name: 'Basic Tower',
      cost: TOWER_COSTS.BASIC,
      icon: IconType.BASIC_TOWER,
      color: COLOR_THEME.towers.basic
    },
    {
      type: TowerType.SNIPER,
      name: 'Sniper Tower',
      cost: TOWER_COSTS.SNIPER,
      icon: IconType.SNIPER_TOWER,
      color: COLOR_THEME.towers.frost
    },
    {
      type: TowerType.RAPID,
      name: 'Rapid Tower',
      cost: TOWER_COSTS.RAPID,
      icon: IconType.RAPID_TOWER,
      color: COLOR_THEME.towers.artillery
    },
    {
      type: TowerType.WALL,
      name: 'Wall',
      cost: TOWER_COSTS.WALL,
      icon: IconType.WALL,
      color: COLOR_THEME.towers.wall
    }
  ];
  
  const handleClose = () => {
    uiStore.getState().closePanel(UIPanelType.BUILD_MENU);
  };
  
  const handleTowerSelect = (tower: TowerOption) => {
    const canAfford = currency >= tower.cost;
    
    if (canAfford) {
      game?.getAudioManager()?.playUISound(SoundType.BUTTON_CLICK);
      if (onTowerSelect) {
        onTowerSelect(tower.type);
      }
      handleClose();
    } else {
      game?.getAudioManager()?.playUISound(SoundType.ERROR);
    }
  };
  
  
  // Calculate position
  const style: React.CSSProperties = position ? {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'auto' as const
  } : {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'auto' as const
  };
  
  return (
    <div style={style} className={cn('z-[1000]')}>
      <Panel
        title="Build Tower"
        onClose={handleClose}
        className={cn('w-[300px]')}
      >
        {/* Tower grid */}
        <div className={cn('grid', 'grid-cols-2', 'gap-2', 'mb-4')}>
          {towers.map(tower => (
            <TowerCard
              key={tower.type}
              tower={tower}
              canAfford={currency >= tower.cost}
              onClick={() => handleTowerSelect(tower)}
            />
          ))}
        </div>
        
        {/* Currency display */}
        <div className={cn('flex', 'justify-center')}>
          <ResourceDisplay
            label="Currency"
            value={`$${currency}`}
            icon={IconType.COINS}
            variant="compact"
          />
        </div>
      </Panel>
    </div>
  );
};

/**
 * Individual tower card component
 */
const TowerCard: React.FC<{
  tower: TowerOption;
  canAfford: boolean;
  onClick: () => void;
}> = ({ tower, canAfford, onClick }) => {
  return (
    <div
      className={cn(
        'bg-ui-bg-tertiary',
        'border-2',
        canAfford ? 'border-ui-border-DEFAULT hover:border-button-primary' : 'border-ui-border-subtle',
        'rounded-lg',
        'p-4',
        'cursor-pointer',
        'transition-all',
        'text-center',
        !canAfford && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
    >
      <div className={cn('flex', 'justify-center', 'mb-2')}>
        <Icon type={tower.icon} size={48} color={tower.color} />
      </div>
      
      <h3 className={cn('text-sm', 'font-semibold', 'text-white', 'mb-1')}>
        {tower.name}
      </h3>
      
      <div className={cn(
        'text-xs',
        'font-bold',
        canAfford ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
      )}>
        ${tower.cost}
      </div>
    </div>
  );
};