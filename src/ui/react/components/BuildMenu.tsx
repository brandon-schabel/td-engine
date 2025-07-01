import React, { useRef, useEffect } from 'react';
import { Panel } from './shared';
import { GlassCard } from './shared/Glass';
import { ResourceDisplay, Icon } from './index';
import { FloatingPanel } from './floating';
import { cn } from '@/lib/utils';
import { TowerType } from '@/entities/Tower';
import { IconType } from '@/ui/icons/SvgIcons';
import { COLOR_THEME } from '@/config/ColorTheme';
import { TOWER_COSTS } from '@/config/GameConfig';
import { useGameStoreSelector } from '../hooks/useGameStore';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { useIsPanelOpen } from '../hooks/useUIStore';
import { SoundType } from '@/audio/AudioManager';

interface TowerOption {
  type: TowerType;
  name: string;
  cost: number;
  icon: IconType;
  color: string;
}

/**
 * BuildMenu React component
 * Shows a floating panel with available towers
 */
export const BuildMenu: React.FC = () => {
  const currency = useGameStoreSelector(state => state.currency);
  const isOpen = useIsPanelOpen(UIPanelType.BUILD_MENU);
  const anchorRef = useRef<HTMLElement | null>(null);
  
  // Get metadata from UI store for position and callback
  const metadata = uiStore.getState().getPanelMetadata(UIPanelType.BUILD_MENU);
  const position = metadata?.position as { x: number; y: number } | undefined;
  const onTowerSelect = metadata?.onTowerSelect as ((type: TowerType) => void) | undefined;
  const anchorElement = metadata?.anchorElement as HTMLElement | undefined;
  
  // Get game instance
  const game = (window as any).currentGame;
  
  // Update anchor element
  useEffect(() => {
    if (anchorElement) {
      anchorRef.current = anchorElement;
    } else if (position) {
      // Create virtual element for position-based anchoring
      anchorRef.current = {
        getBoundingClientRect: () => ({
          x: position.x,
          y: position.y,
          width: 0,
          height: 0,
          top: position.y,
          left: position.x,
          right: position.x,
          bottom: position.y,
        }),
      } as any;
    }
  }, [anchorElement, position]);
  
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
  
  return (
    <FloatingPanel
      open={isOpen}
      onOpenChange={handleClose}
      anchor={anchorRef.current}
      placement={anchorElement ? "top" : "center"}
      modal={false}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      animation="scale"
      className="w-[300px]"
    >
      <Panel 
        title="Build Tower" 
        icon={IconType.BUILD}
        onClose={handleClose}
        className="!bg-transparent"
      >
        <div className="grid grid-cols-2 gap-2 p-3">
          {towers.map((tower) => {
            const canAfford = currency >= tower.cost;
            
            return (
              <GlassCard
                key={tower.type}
                onClick={() => handleTowerSelect(tower)}
                variant="dark"
                blur="md"
                padding="sm"
                hover={canAfford}
                className={cn(
                  'flex flex-col items-center gap-2',
                  'transition-all duration-200',
                  canAfford ? [
                    'cursor-pointer',
                    'hover:scale-105 active:scale-95'
                  ] : [
                    'cursor-not-allowed opacity-50'
                  ]
                )}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tower.color}20` }}
                >
                  <Icon 
                    type={tower.icon} 
                    size={32} 
                    color={tower.color}
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-xs font-medium text-ui-text-primary">
                    {tower.name}
                  </div>
                  <ResourceDisplay
                    value={tower.cost}
                    icon={IconType.COINS}
                    variant="inline"
                    className={cn(
                      'text-xs',
                      !canAfford && 'text-status-error'
                    )}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
        
        <div className="px-3 pb-3">
          <div className="text-xs text-ui-text-secondary text-center">
            Select a tower to build
          </div>
        </div>
      </Panel>
    </FloatingPanel>
  );
};