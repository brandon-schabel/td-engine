import React, { useState } from 'react';
import { Modal, Button } from './shared';
import { GlassPanel } from './shared/Glass';
import { StructuredCard } from './shared/Card';
import { Icon, IconType } from './index';
import { cn } from '@/lib/utils';
import { UpgradeType, getNextLevelDescription } from '@/config/PlayerUpgradeConfig';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { SoundType } from '@/audio/AudioManager';

/**
 * PlayerUpgrade React component - Replaces UpgradeUI
 * Displays available upgrades and allows players to spend upgrade points
 */
export const PlayerUpgrade: React.FC = () => {
  // Force update mechanism
  const [, forceUpdate] = useState({});
  const refresh = () => forceUpdate({});
  
  // Get game instance
  const game = (window as any).currentGame;
  const player = game?.getPlayer();
  const levelSystem = player?.getPlayerLevelSystem();
  const upgradeManager = player?.getPlayerUpgradeManager();
  
  if (!player || !levelSystem || !upgradeManager) return null;
  
  const handleClose = () => {
    uiStore.getState().closePanel(UIPanelType.PLAYER_UPGRADE);
  };
  
  const handlePurchaseUpgrade = (type: UpgradeType) => {
    const success = upgradeManager.purchaseUpgrade(type);
    
    if (success) {
      game?.getAudioManager()?.playSound(SoundType.SELECT, 1);
      refresh();
    }
  };
  
  const availablePoints = levelSystem.getAvailableUpgradePoints();
  const playerLevel = levelSystem.getLevel();
  
  return (
    <Modal isOpen={true} onClose={handleClose}>
      <GlassPanel
        variant="dark"
        blur="xl"
        opacity={90}
        border={true}
        glow={true}
        className={cn('min-w-[400px]', 'max-w-[500px]', 'rounded-2xl', 'overflow-hidden')}
      >
        <GlassPanel.Header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Player Upgrades</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </GlassPanel.Header>
        <GlassPanel.Body className="p-0">
        <div className={cn('flex', 'flex-col', 'h-full')}>
          {/* Header with available points */}
          <PointsHeader 
            availablePoints={availablePoints}
            playerLevel={playerLevel}
          />
          
          {/* Scrollable upgrade cards */}
          <div className="flex-1 overflow-hidden px-4">
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
              {Object.values(UpgradeType).map(type => (
                <UpgradeCard
                  key={type}
                  type={type}
                  upgradeManager={upgradeManager}
                  onPurchase={() => handlePurchaseUpgrade(type)}
                />
              ))}
            </div>
          </div>
          
          {/* Close button */}
          <div className="px-4 pb-4 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </div>
        </GlassPanel.Body>
      </GlassPanel>
    </Modal>
  );
};

/**
 * Points header component
 */
const PointsHeader: React.FC<{
  availablePoints: number;
  playerLevel: number;
}> = ({ availablePoints, playerLevel }) => {
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-game-currency/20">
          <Icon type={IconType.STAR} size={24} className="text-game-currency" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ui-text-primary">
            Available Points: {availablePoints}
          </h2>
          <p className="text-sm text-ui-text-secondary">
            Level {playerLevel}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual upgrade card component
 */
const UpgradeCard: React.FC<{
  type: UpgradeType;
  upgradeManager: any;
  onPurchase: () => void;
}> = ({ type, upgradeManager, onPurchase }) => {
  const definition = upgradeManager.getUpgradeDefinition(type);
  const currentLevel = upgradeManager.getUpgradeLevel(type);
  const canPurchase = upgradeManager.canPurchaseUpgrade(type);
  const isMaxLevel = currentLevel >= definition.maxLevel;
  
  const iconMap: Record<UpgradeType, IconType> = {
    [UpgradeType.DAMAGE]: IconType.DAMAGE,
    [UpgradeType.FIRE_RATE]: IconType.FIRE_RATE,
    [UpgradeType.MOVEMENT_SPEED]: IconType.SPEED,
    [UpgradeType.MAX_HEALTH]: IconType.HEALTH,
    [UpgradeType.REGENERATION]: IconType.SHIELD
  };
  
  const icon = iconMap[type] || IconType.UPGRADE;
  
  return (
    <StructuredCard
      variant="default"
      header={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-button-primary/20">
            <Icon type={icon} size={20} className="text-button-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-ui-text-primary">
              {definition.name}
            </h3>
            <p className="text-sm text-ui-text-secondary">
              Level {currentLevel}/{definition.maxLevel}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-ui-text-secondary">
            {getNextLevelDescription(type, currentLevel)}
          </p>
          <p className="text-sm text-ui-text-secondary">
            Cost: {isMaxLevel ? 'MAX' : `${definition.costPerLevel} point${definition.costPerLevel > 1 ? 's' : ''}`}
          </p>
        </div>
        
        <Button
          variant={canPurchase ? 'primary' : 'secondary'}
          disabled={!canPurchase}
          fullWidth
          onClick={onPurchase}
        >
          {isMaxLevel ? 'Max Level' : 'Upgrade'}
        </Button>
      </div>
    </StructuredCard>
  );
};