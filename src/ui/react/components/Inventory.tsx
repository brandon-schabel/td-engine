import React, { useState, useEffect, useCallback } from 'react';
import { Panel, Button } from './shared';
import { TabBar } from './index';
import { cn } from '@/lib/utils';
import { IconType } from '@/ui/icons/SvgIcons';
import { ItemType, type InventoryItem } from '@/systems/Inventory';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { useGameStoreSelector } from '../hooks/useGameStore';
import { SoundType } from '@/audio/AudioManager';

/**
 * Inventory React component - Replaces InventoryUI
 * Manages item display, sorting, usage, and upgrades
 */
export const Inventory: React.FC = () => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [draggedFromSlot, setDraggedFromSlot] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  
  // Subscribe to game state
  const currency = useGameStoreSelector(state => state.currency);
  
  // Get game instance
  const game = (window as any).currentGame;
  const inventory = game?.getInventory();
  
  // Force update mechanism
  const [, forceUpdate] = useState({});
  const refresh = useCallback(() => forceUpdate({}), []);
  
  // Set up periodic updates
  useEffect(() => {
    const interval = setInterval(refresh, 250);
    return () => clearInterval(interval);
  }, [refresh]);
  
  const handleClose = () => {
    uiStore.getState().closePanel(UIPanelType.INVENTORY);
  };
  
  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index === selectedSlotIndex ? null : index);
    game?.getAudioManager()?.playUISound(SoundType.UI_TICK);
  };
  
  const handleUseItem = () => {
    if (selectedSlotIndex !== null && inventory) {
      const success = inventory.useItem(selectedSlotIndex);
      if (success) {
        game?.getAudioManager()?.playUISound(SoundType.POWERUP_PICKUP);
        setSelectedSlotIndex(null);
      } else {
        game?.getAudioManager()?.playUISound(SoundType.ERROR);
      }
    }
  };
  
  const handleSellItem = () => {
    if (selectedSlotIndex !== null && inventory) {
      const item = inventory.getSlots()[selectedSlotIndex]?.item;
      if (item) {
        inventory.removeItem(selectedSlotIndex);
        game?.addCurrency(Math.floor(item.sellValue || 0));
        game?.getAudioManager()?.playUISound(SoundType.CURRENCY_PICKUP);
        setSelectedSlotIndex(null);
      }
    }
  };
  
  const handleUpgradeInventory = () => {
    if (game?.canUpgradeInventory()) {
      game.upgradeInventory();
      game?.getAudioManager()?.playUISound(SoundType.UPGRADE);
      refresh();
    } else {
      game?.getAudioManager()?.playUISound(SoundType.ERROR);
    }
  };
  
  const handleDragStart = (index: number) => {
    setDraggedFromSlot(index);
    game?.getAudioManager()?.playUISound(SoundType.UI_TICK);
  };
  
  const handleDrop = (targetIndex: number) => {
    if (draggedFromSlot !== null && draggedFromSlot !== targetIndex && inventory) {
      inventory.swapItems(draggedFromSlot, targetIndex);
      game?.getAudioManager()?.playUISound(SoundType.UI_TICK);
      setDraggedFromSlot(null);
      refresh();
    }
  };
  
  if (!inventory) return null;
  
  const stats = inventory.getStatistics();
  const slots = inventory.getSlots();
  const selectedItem = selectedSlotIndex !== null ? slots[selectedSlotIndex]?.item : null;
  const upgradeCost = game?.getInventoryUpgradeCost() || 0;
  const canAffordUpgrade = game?.canUpgradeInventory() || false;
  
  return (
    <div 
      className={cn('fixed', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2', 'z-[1000]')}
      style={{ pointerEvents: 'auto' }}
    >
      <Panel
        title="Inventory"
        icon={IconType.INVENTORY}
        onClose={handleClose}
        className={cn('min-w-[600px]', 'max-w-[800px]')}
      >
        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Item Grid */}
        <div className={cn('mt-4')}>
          <ItemGrid
            slots={slots}
            totalSlots={stats.totalSlots}
            activeTab={activeTab}
            selectedSlotIndex={selectedSlotIndex}
            onSlotClick={handleSlotClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
        
        {/* Footer with stats and actions */}
        <div className={cn('mt-6', 'pt-4', 'border-t', 'border-ui-border-DEFAULT')}>
          {/* Stats Display */}
          <div className={cn('flex', 'justify-between', 'items-center', 'mb-4')}>
            <div className={cn('text-sm', 'text-ui-text-secondary')}>
              Slots: <span className={cn('text-white', 'font-bold')}>{stats.usedSlots}/{stats.totalSlots}</span>
            </div>
            <div className={cn('text-sm', 'text-ui-text-secondary')}>
              Currency: <span className={cn('text-success-DEFAULT', 'font-bold')}>${currency}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className={cn('flex', 'gap-2', 'justify-center')}>
            <Button
              icon={IconType.CHECKMARK}
              variant="primary"
              size="sm"
              disabled={!selectedItem || !selectedItem.usable}
              onClick={handleUseItem}
            >
              Use
            </Button>
            
            <Button
              icon={IconType.SELL}
              variant="danger"
              size="sm"
              disabled={!selectedItem}
              onClick={handleSellItem}
            >
              Sell
            </Button>
            
            <Button
              icon={IconType.UPGRADE}
              variant="secondary"
              size="sm"
              disabled={!canAffordUpgrade}
              onClick={handleUpgradeInventory}
            >
              Upgrade (${upgradeCost})
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
};

/**
 * Tab navigation component
 */
const TabNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <TabBar
      tabs={[
        { id: 'ALL', label: 'All' },
        { id: ItemType.CONSUMABLE, label: 'Items' },
        { id: ItemType.EQUIPMENT, label: 'Gear' },
        { id: ItemType.MATERIAL, label: 'Mats' },
        { id: ItemType.SPECIAL, label: 'Special' }
      ]}
      activeTabId={activeTab}
      onChange={(tabId) => onTabChange(tabId)}
      variant="underline"
    />
  );
};

/**
 * Item grid component
 */
const ItemGrid: React.FC<{
  slots: Array<{ item: InventoryItem | null }>;
  totalSlots: number;
  activeTab: string;
  selectedSlotIndex: number | null;
  onSlotClick: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
}> = ({ slots, totalSlots, activeTab, selectedSlotIndex, onSlotClick, onDragStart, onDrop }) => {
  return (
    <div className={cn('grid', 'grid-cols-10', 'gap-2', 'p-4', 'bg-black/30', 'rounded-md')}>
      {Array.from({ length: totalSlots }).map((_, index) => {
        const item = index < slots.length ? slots[index]?.item : null;
        const visible = activeTab === 'ALL' || (item && item.type === activeTab) || false;
        const isSelected = index === selectedSlotIndex;
        
        return (
          <ItemSlot
            key={index}
            item={item}
            isSelected={isSelected}
            visible={visible}
            onSlotClick={() => onSlotClick(index)}
            onDragStart={() => onDragStart(index)}
            onDrop={() => onDrop(index)}
          />
        );
      })}
    </div>
  );
};

/**
 * Individual item slot component
 */
const ItemSlot: React.FC<{
  item: InventoryItem | null;
  isSelected: boolean;
  visible: boolean;
  onSlotClick: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}> = ({ item, isSelected, visible, onSlotClick, onDragStart, onDrop }) => {
  if (!visible) return <div className={cn('w-12', 'h-12')} />;
  
  return (
    <div
      className={cn(
        'w-12', 'h-12',
        'bg-ui-bg-tertiary',
        'border-2',
        isSelected ? 'border-button-primary' : 'border-ui-border-DEFAULT',
        'rounded',
        'cursor-pointer',
        'relative',
        'transition-all',
        'hover:border-button-primary-hover'
      )}
      onClick={onSlotClick}
      draggable={!!item}
      onDragStart={item ? onDragStart : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {item && (
        <>
          <div className={cn('text-2xl', 'flex', 'items-center', 'justify-center', 'h-full')}>
            {item.iconType}
          </div>
          {item.quantity > 1 && (
            <span className={cn(
              'absolute', 'bottom-0', 'right-0',
              'text-xs', 'font-bold', 'text-white',
              'bg-black/70', 'px-1', 'rounded-tl'
            )}>
              {item.quantity}
            </span>
          )}
        </>
      )}
    </div>
  );
};

