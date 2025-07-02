import React, { useRef, useEffect } from "react";
import { Panel } from "./shared";
import { GlassCard, GlassPanel } from "./shared/Glass";
import { ResourceDisplay, Icon } from "./index";
import { FloatingPanel, FloatingPortal } from "./floating";
import { cn } from "@/lib/utils";
import { TowerType } from "@/entities/Tower";
import { IconType } from "@/ui/icons/SvgIcons";
import { COLOR_THEME } from "@/config/ColorTheme";
import { TOWER_COSTS } from "@/config/GameConfig";
import { uiStore, UIPanelType } from "@/stores/uiStore";
import { useIsPanelOpen } from "../hooks/useUIStore";
import { SoundType } from "@/audio/AudioManager";
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency, useCanAfford, useStatisticActions } from '@/stores/hooks/useGameStore';

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
  const currency = useCurrency();
  const isOpen = useIsPanelOpen(UIPanelType.BUILD_MENU);
  const anchorRef = useRef<HTMLElement | null>(null);
  const { recordTowerBuilt } = useStatisticActions();
  
  // Check if mobile
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

  // Get metadata from UI store for position and callback
  const metadata = uiStore.getState().getPanelMetadata(UIPanelType.BUILD_MENU);
  const position = metadata?.position as { x: number; y: number } | undefined;
  const onTowerSelect = metadata?.onTowerSelect as
    | ((type: TowerType) => void)
    | undefined;
  const anchorElement = metadata?.anchorElement as HTMLElement | undefined;

  // Get game instance
  const game = (window as any).currentGame;

  // Update anchor element
  useEffect(() => {
    // Force center positioning on mobile
    if (isMobile) {
      anchorRef.current = null;
    } else if (anchorElement) {
      anchorRef.current = anchorElement;
    } else {
      // No anchor for center positioning
      anchorRef.current = null;
    }
  }, [anchorElement, isMobile]);

  const towers: TowerOption[] = [
    {
      type: TowerType.BASIC,
      name: "Basic Tower",
      cost: TOWER_COSTS.BASIC,
      icon: IconType.BASIC_TOWER,
      color: COLOR_THEME.towers.basic,
    },
    {
      type: TowerType.SNIPER,
      name: "Sniper Tower",
      cost: TOWER_COSTS.SNIPER,
      icon: IconType.SNIPER_TOWER,
      color: COLOR_THEME.towers.frost,
    },
    {
      type: TowerType.RAPID,
      name: "Rapid Tower",
      cost: TOWER_COSTS.RAPID,
      icon: IconType.RAPID_TOWER,
      color: COLOR_THEME.towers.artillery,
    },
    {
      type: TowerType.WALL,
      name: "Wall",
      cost: TOWER_COSTS.WALL,
      icon: IconType.WALL,
      color: COLOR_THEME.towers.wall,
    },
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
        // Record tower built for statistics
        recordTowerBuilt(tower.type);
      }
      handleClose();
    } else {
      game?.getAudioManager()?.playUISound(SoundType.ERROR);
    }
  };

  // For mobile, use a simple centered modal
  if (isMobile && isOpen) {
    return (
      <FloatingPortal>
        <AnimatePresence>
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={handleClose}
            />
            
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-[300px]"
            >
              <GlassPanel
                variant="dark"
                blur="xl"
                opacity={90}
                border={true}
                glow={true}
                className="rounded-lg"
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
                            "flex flex-col items-center gap-2",
                            "transition-all duration-200",
                            canAfford
                              ? ["cursor-pointer", "hover:scale-105 active:scale-95"]
                              : ["cursor-not-allowed opacity-50"]
                          )}
                        >
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10"
                            style={{
                              background: `linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)`,
                              boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 12px ${tower.color}30`,
                            }}
                          >
                            <Icon
                              type={tower.icon}
                              size={24}
                              color={tower.color}
                            />
                          </div>

                          <div className="text-center">
                            <div className="text-xs font-medium text-white/90">
                              {tower.name}
                            </div>
                            <ResourceDisplay
                              icon={IconType.CURRENCY}
                              value={tower.cost}
                              showLabel={false}
                              className={cn(
                                "justify-center mt-1 text-sm",
                                !canAfford && "text-red-400"
                              )}
                            />
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </Panel>
              </GlassPanel>
            </motion.div>
          </div>
        </AnimatePresence>
      </FloatingPortal>
    );
  }

  // Desktop version using FloatingPanel
  return (
    <FloatingPanel
      open={isOpen}
      onOpenChange={handleClose}
      anchor={anchorRef.current}
      placement={anchorRef.current ? "top" : "center"}
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
                  "flex flex-col items-center gap-2",
                  "transition-all duration-200",
                  canAfford
                    ? ["cursor-pointer", "hover:scale-105 active:scale-95"]
                    : ["cursor-not-allowed opacity-50"]
                )}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10"
                  style={{
                    background: `linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)`,
                    boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 12px ${tower.color}30`,
                  }}
                >
                  <Icon
                    type={tower.icon}
                    size={32}
                    color={tower.color}
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                </div>

                <div className="text-center">
                  <div className="text-xs font-medium text-ui-text-primary text-shadow-sm">
                    {tower.name}
                  </div>
                  <ResourceDisplay
                    value={tower.cost}
                    icon={IconType.COINS}
                    variant="inline"
                    className={cn("text-xs", !canAfford && "text-status-error")}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>

        <div className="px-3 pb-3">
          <div className="text-xs text-ui-text-secondary text-center text-shadow-sm">
            Select a tower to build
          </div>
        </div>
      </Panel>
    </FloatingPanel>
  );
};
