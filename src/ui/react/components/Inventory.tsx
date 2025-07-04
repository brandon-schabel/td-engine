import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./shared";
import { GlassModal } from "./shared/GlassWrappers";
import { TabBar } from "./index";
import { cn } from "@/lib/utils";
import { IconType } from "@/ui/icons/SvgIcons";
import { ItemType, type InventoryItem } from "@/systems/Inventory";
import { uiStore, UIPanelType } from "@/stores/uiStore";
import { useGameStore } from "@/stores/hooks/useGameStore";
import { useIsPanelOpen } from "../hooks/useUIStore";
import { SoundType } from "@/audio/AudioManager";

/**
 * Inventory React component - Replaces InventoryUI
 * Manages item display, sorting, usage, and upgrades
 */
export const Inventory: React.FC = () => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null
  );
  const [draggedFromSlot, setDraggedFromSlot] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Subscribe to game state
  const currency = useGameStore((state) => state.currency);
  const isOpen = useIsPanelOpen(UIPanelType.INVENTORY);

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
    if (
      draggedFromSlot !== null &&
      draggedFromSlot !== targetIndex &&
      inventory
    ) {
      inventory.swapItems(draggedFromSlot, targetIndex);
      game?.getAudioManager()?.playUISound(SoundType.UI_TICK);
      setDraggedFromSlot(null);
      refresh();
    }
  };

  if (!inventory) return null;

  const stats = inventory.getStatistics();
  const slots = inventory.getSlots();
  const selectedItem =
    selectedSlotIndex !== null ? slots[selectedSlotIndex]?.item : null;
  const upgradeCost = game?.getInventoryUpgradeCost() || 0;
  const canAffordUpgrade = game?.canUpgradeInventory() || false;

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Inventory"
      showCloseButton={true}
      size="xl"
      className={cn(
        "w-[95vw] max-w-[95vw]",
        "sm:w-[600px] sm:max-w-[800px]",
        "max-h-[90vh]",
        "overflow-hidden"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-4">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Item Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 mt-4">
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
        <div className={cn(
          "px-4 sm:px-6 pb-4 pt-4",
          "border-t border-white/10",
          "bg-black/20"
        )}>
          {/* Stats Display */}
          <div className={cn(
            "flex justify-between items-center mb-4",
            "text-sm"
          )}>
            <div className="text-white text-shadow-sm">
              Slots:{" "}
              <span className="font-bold">
                {stats.usedSlots}/{stats.totalSlots}
              </span>
            </div>
            <div className="text-white text-shadow-sm">
              Currency:{" "}
              <span className="text-status-success font-bold">
                ${currency}
              </span>
            </div>
          </div>

          {/* Action Buttons - Responsive layout */}
          <div className={cn(
            "flex gap-2",
            "flex-col sm:flex-row",
            "sm:justify-center"
          )}>
            <Button
              icon={IconType.CHECKMARK}
              variant="primary"
              size="sm"
              disabled={!selectedItem || !selectedItem.usable}
              onClick={handleUseItem}
              fullWidth
              className="sm:w-auto"
            >
              Use
            </Button>

            <Button
              icon={IconType.SELL}
              variant="danger"
              size="sm"
              disabled={!selectedItem}
              onClick={handleSellItem}
              fullWidth
              className="sm:w-auto"
            >
              Sell
            </Button>

            <Button
              icon={IconType.UPGRADE}
              variant="secondary"
              size="sm"
              disabled={!canAffordUpgrade}
              onClick={handleUpgradeInventory}
              fullWidth
              className="sm:w-auto"
            >
              Upgrade (${upgradeCost})
            </Button>
          </div>
        </div>
      </div>
    </GlassModal>
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
        { id: "ALL", label: "All" },
        { id: ItemType.CONSUMABLE, label: "Items" },
        { id: ItemType.EQUIPMENT, label: "Gear" },
        { id: ItemType.MATERIAL, label: "Mats" },
        { id: ItemType.SPECIAL, label: "Special" },
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
}> = ({
  slots,
  totalSlots,
  activeTab,
  selectedSlotIndex,
  onSlotClick,
  onDragStart,
  onDrop,
}) => {
  return (
    <div
      className={cn(
        "grid",
        "grid-cols-6 sm:grid-cols-8 md:grid-cols-10",
        "gap-1.5 sm:gap-2",
        "p-3 sm:p-4",
        "bg-white/5",
        "rounded-lg",
        "border",
        "border-white/10"
      )}
    >
      {Array.from({ length: totalSlots }).map((_, index) => {
        const item = index < slots.length ? slots[index]?.item : null;
        const visible =
          activeTab === "ALL" || (item && item.type === activeTab) || false;
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
  if (!visible) return <div className={cn("w-10 h-10 sm:w-12 sm:h-12")} />;

  return (
    <div
      className={cn(
        "w-10 h-10 sm:w-12 sm:h-12",
        "backdrop-blur-sm",
        item ? "bg-white/10" : "bg-black/30",
        "border",
        isSelected
          ? "border-button-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          : "border-white/20",
        "rounded-md sm:rounded-lg",
        "cursor-pointer",
        "relative",
        "transition-all duration-200",
        "hover:border-button-primary-hover hover:bg-white/15",
        "active:scale-95"
      )}
      onClick={onSlotClick}
      draggable={!!item}
      onDragStart={item ? onDragStart : undefined}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {item && (
        <>
          <div
            className={cn(
              "text-lg sm:text-2xl",
              "flex",
              "items-center",
              "justify-center",
              "h-full"
            )}
          >
            {item.iconType}
          </div>
          {item.quantity > 1 && (
            <span
              className={cn(
                "absolute",
                "bottom-0",
                "right-0",
                "text-[10px] sm:text-xs",
                "font-bold",
                "text-white",
                "text-shadow-sm",
                "bg-black/80 backdrop-blur-sm",
                "px-0.5 sm:px-1",
                "rounded-tl-md",
                "min-w-[16px] text-center"
              )}
            >
              {item.quantity}
            </span>
          )}
        </>
      )}
    </div>
  );
};
