import React, { useState, useEffect } from "react";
import { Panel, Button } from "./shared";
import { GlassCard } from "./shared/Glass";
import { IconContainer, InlineStats, type Stat } from "./index";
import { FloatingPanel } from "./floating";
import { cn } from "@/lib/utils";
import { UpgradeType } from "@/entities/Tower";
import type { Tower } from "@/entities/Tower";
import { IconType } from "@/ui/icons/SvgIcons";
import { uiStore, UIPanelType } from "@/stores/uiStore";
import { useIsPanelOpen } from "../hooks/useUIStore";
import { useGameStoreSelector } from "../hooks/useGameStore";
import { SoundType } from "@/audio/AudioManager";

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
 * TowerUpgrade React component
 * Shows a centered modal for tower upgrades and selling
 */
export const TowerUpgrade: React.FC = () => {
  const [sellButtonEnabled, setSellButtonEnabled] = useState(false);
  const currency = useGameStoreSelector((state) => state.currency);
  const isOpen = useIsPanelOpen(UIPanelType.TOWER_UPGRADE);

  // Get tower from metadata
  const metadata = uiStore
    .getState()
    .getPanelMetadata(UIPanelType.TOWER_UPGRADE);
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
        name: "Damage",
        description: "Increase tower damage",
        cost: tower.getUpgradeCost(UpgradeType.DAMAGE),
        currentLevel: tower.getUpgradeLevel(UpgradeType.DAMAGE),
        maxLevel: tower.getMaxUpgradeLevel(),
        icon: IconType.DAMAGE,
        effect: getUpgradeEffectText(tower, UpgradeType.DAMAGE),
      },
      {
        type: UpgradeType.RANGE,
        name: "Range",
        description: "Increase attack range",
        cost: tower.getUpgradeCost(UpgradeType.RANGE),
        currentLevel: tower.getUpgradeLevel(UpgradeType.RANGE),
        maxLevel: tower.getMaxUpgradeLevel(),
        icon: IconType.RANGE,
        effect: getUpgradeEffectText(tower, UpgradeType.RANGE),
      },
      {
        type: UpgradeType.FIRE_RATE,
        name: "Fire Rate",
        description: "Increase attack speed",
        cost: tower.getUpgradeCost(UpgradeType.FIRE_RATE),
        currentLevel: tower.getUpgradeLevel(UpgradeType.FIRE_RATE),
        maxLevel: tower.getMaxUpgradeLevel(),
        icon: IconType.SPEED,
        effect: getUpgradeEffectText(tower, UpgradeType.FIRE_RATE),
      },
    ];
  };

  const getUpgradeEffectText = (
    tower: Tower,
    upgradeType: UpgradeType
  ): string => {
    const level = tower.getUpgradeLevel(upgradeType);
    const baseValue = getBaseValue(tower, upgradeType);
    const currentValue = getCurrentValue(tower, upgradeType);
    const nextValue = getNextValue(tower, upgradeType);

    if (level >= tower.getMaxUpgradeLevel()) {
      return `MAX (${formatValue(currentValue, upgradeType)})`;
    }

    const percentIncrease = ((nextValue - baseValue) / baseValue) * 100;
    return `${formatValue(currentValue, upgradeType)} → ${formatValue(nextValue, upgradeType)} (+${percentIncrease.toFixed(0)}%)`;
  };

  const getBaseValue = (tower: Tower, upgradeType: UpgradeType): number => {
    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return tower.getBaseDamage();
      case UpgradeType.RANGE:
        return tower.getBaseRange();
      case UpgradeType.FIRE_RATE:
        return tower.getBaseFireRate();
      default:
        return 0;
    }
  };

  const getCurrentValue = (tower: Tower, upgradeType: UpgradeType): number => {
    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return tower.damage;
      case UpgradeType.RANGE:
        return tower.range;
      case UpgradeType.FIRE_RATE:
        return tower.attackSpeed;
      default:
        return 0;
    }
  };

  const getNextValue = (tower: Tower, upgradeType: UpgradeType): number => {
    const level = tower.getUpgradeLevel(upgradeType);
    const baseValue = getBaseValue(tower, upgradeType);
    const multiplier = 1 + (level + 1) * 0.2;
    return Math.round(baseValue * multiplier * 10) / 10;
  };

  const formatValue = (value: number, upgradeType: UpgradeType): string => {
    switch (upgradeType) {
      case UpgradeType.DAMAGE:
        return value.toFixed(1);
      case UpgradeType.RANGE:
        return value.toFixed(0);
      case UpgradeType.FIRE_RATE:
        return `${value.toFixed(1)}/s`;
      default:
        return value.toString();
    }
  };

  const totalInvested = tower.getTotalInvestment();
  const sellValue = Math.floor(totalInvested * 0.7);

  const towerStats: Stat[] = [
    { label: "Type", value: tower.getDisplayName() },
    { label: "Level", value: `${Math.floor(tower.getAverageUpgradeLevel())}` },
    { label: "Total Invested", value: totalInvested, icon: IconType.COINS },
  ];

  return (
    <FloatingPanel
      open={isOpen}
      onOpenChange={handleClose}
      placement="center"
      modal={true}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      animation="scale"
      className="w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Panel
        title="Tower Upgrade"
        icon={IconType.UPGRADE}
        onClose={handleClose}
        className="!bg-transparent"
      >
        {/* Tower Info */}
        <div className="p-4 border-b border-ui-border-subtle">
          <div className="flex items-center gap-4">
            <IconContainer
              icon={tower.getIconType()}
              size="lg"
              className="bg-ui-bg-primary"
            />
            <div className="flex-1">
              <InlineStats stats={towerStats} />
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="p-4 space-y-3">
          {getUpgradeOptions().map((upgrade) => {
            const canAfford = currency >= upgrade.cost;
            const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel;
            const canUpgrade = canAfford && !isMaxLevel;

            return (
              <GlassCard
                key={upgrade.type}
                variant="dark"
                blur="sm"
                padding="sm"
                hover={canUpgrade}
                className={cn(
                  "flex items-center gap-3",
                  "transition-all duration-200",
                  "bg-black/95"
                )}
              >
                <IconContainer
                  icon={upgrade.icon}
                  size="md"
                  className="bg-ui-bg-secondary"
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ui-text-primary text-shadow-sm">
                      {upgrade.name}
                    </span>
                    <span className="text-xs text-ui-text-secondary text-shadow-sm">
                      Level {upgrade.currentLevel}/{upgrade.maxLevel}
                    </span>
                  </div>

                  <div className="text-xs text-ui-text-secondary text-shadow-sm mb-2">
                    {upgrade.effect}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-ui-text-muted text-shadow-sm">
                      {upgrade.description}
                    </div>

                    {!isMaxLevel && (
                      <Button
                        size="sm"
                        variant={canAfford ? "primary" : "secondary"}
                        disabled={!canUpgrade}
                        onClick={() => handleUpgrade(upgrade.type)}
                        icon={IconType.COINS}
                      >
                        {upgrade.cost}
                      </Button>
                    )}

                    {isMaxLevel && (
                      <span className="text-xs font-bold text-status-warning text-shadow-sm">
                        MAX
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Sell Button */}
        <div className="p-4 border-t border-ui-border-subtle">
          <Button
            variant="danger"
            size="lg"
            fullWidth
            disabled={!sellButtonEnabled}
            onClick={handleSell}
            icon={IconType.SELL}
          >
            Sell for {sellValue} coins
          </Button>

          {!sellButtonEnabled && (
            <div className="text-xs text-center text-ui-text-muted text-shadow-sm mt-2">
              Sell button enabled in a moment...
            </div>
          )}
        </div>
      </Panel>
    </FloatingPanel>
  );
};
