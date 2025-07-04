import React, { useState, useEffect } from "react";
import { GlassPanel, GlassIconButton, GlassDivider } from "../shared/Glass";
import { Icon } from "../shared/Icon";
import { IconType } from "@/ui/icons/SvgIcons";
import { cn } from "@/lib/utils";
import type { Game } from "@/core/Game";
import { getUIState, UIPanelType } from "@/stores/uiStore";
import { SoundType } from "@/audio/AudioManager";
import { useIsGameOver } from "@/stores/hooks/useGameStore";

interface ControlBarProps {
  game: Game;
  onBuildMenu: () => void;
  onPlayerUpgrade: () => void;
  onInventory: () => void;
  onStartWave: () => void;
  onPause: () => void;
  isWaveComplete: boolean;
  isPaused: boolean;
}

export const BottomControlBar: React.FC<ControlBarProps> = ({
  game,
  onBuildMenu,
  onPlayerUpgrade,
  onInventory,
  onStartWave,
  onPause,
  isWaveComplete,
}) => {
  const audioManager = game.getAudioManager();
  const [isMobile, setIsMobile] = useState(false);
  const isGameOver = useIsGameOver();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleBuild = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onBuildMenu();
  };

  const handlePlayerUpgrade = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onPlayerUpgrade();
  };

  const handleInventory = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onInventory();
  };

  const handleStartWave = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (isWaveComplete && !isGameOver) {
      onStartWave();
    }
  };

  const handlePause = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    onPause();
  };

  const handleSettings = () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    getUIState().openPanel(UIPanelType.SETTINGS);
  };

  return (
    <div
      className={cn("fixed left-0 right-0", "z-[1000]", "safe-bottom")}
      style={{
        bottom: 0,
      }}
    >
      <div
        className={cn(
          "w-full",
          "h-[70px] md:h-[60px]",
          "bg-gradient-to-br from-black/85 via-gray-900/85 to-black/85",
          "backdrop-blur-lg backdrop-saturate-150",
          "border-t border-white/20",
          "rounded-t-2xl",
          "shadow-[0_-10px_30px_rgba(0,0,0,0.3)]",
          "flex flex-row items-center justify-center flex-nowrap",
          "gap-1 px-2 md:gap-2 md:px-4",
          "overflow-visible"
        )}
      >
        <GlassIconButton
          icon={<Icon type={IconType.BUILD} size={isMobile ? 18 : 22} />}
          size={isMobile ? "sm" : "md"}
          blur="md"
          onClick={handleBuild}
          title="Build Menu (B)"
          className={cn(
            "hover:scale-105 hover:bg-primary/20 hover:border-primary/40",
            "flex-shrink-0"
          )}
        />

        <GlassIconButton
          icon={<Icon type={IconType.PLAYER} size={isMobile ? 18 : 22} />}
          size={isMobile ? "sm" : "md"}
          blur="md"
          onClick={handlePlayerUpgrade}
          title="Player Upgrades (U)"
          className={cn(
            "hover:scale-105 hover:bg-primary/20 hover:border-primary/40",
            "flex-shrink-0"
          )}
        />

        <GlassIconButton
          icon={<Icon type={IconType.INVENTORY} size={isMobile ? 18 : 22} />}
          size={isMobile ? "sm" : "md"}
          blur="md"
          onClick={handleInventory}
          title="Inventory (E)"
          className={cn(
            "hover:scale-105 hover:bg-primary/20 hover:border-primary/40",
            "flex-shrink-0"
          )}
        />

        {!isMobile && <GlassDivider orientation="vertical" className="h-8 mx-2" />}

        <GlassIconButton
          icon={<Icon type={IconType.PLAY} size={isMobile ? 18 : 22} />}
          size={isMobile ? "sm" : "md"}
          blur="md"
          onClick={handleStartWave}
          disabled={!isWaveComplete}
          title="Start Next Wave (Enter)"
          className={cn(
            "hover:scale-105",
            "flex-shrink-0",
            isWaveComplete &&
              "animate-pulse bg-success/20 border-success/40 hover:bg-success/30"
          )}
        />

        <GlassIconButton
          icon={<Icon type={IconType.PAUSE} size={isMobile ? 18 : 22} />}
          size={isMobile ? "sm" : "md"}
          blur="md"
          onClick={handlePause}
          title="Pause/Resume (Space)"
          className={cn(
            "hover:scale-105 hover:bg-primary/20 hover:border-primary/40",
            "flex-shrink-0"
          )}
        />

        {!isMobile && <GlassDivider orientation="vertical" className="h-8 mx-2" />}

        <GlassIconButton
          icon={<Icon type={IconType.SETTINGS} size={isMobile ? 18 : 22} />}
          size={isMobile ? "sm" : "md"}
          blur="md"
          onClick={handleSettings}
          title="Settings"
          className={cn(
            "hover:scale-105 hover:bg-primary/20 hover:border-primary/40",
            "flex-shrink-0"
          )}
        />
      </div>
    </div>
  );
};
