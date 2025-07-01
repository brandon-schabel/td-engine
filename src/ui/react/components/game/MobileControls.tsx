import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { VirtualJoystick } from "./VirtualJoystick";
import { useMobileLayout } from "../../hooks/useMobileLayout";
import type { Game } from "@/core/Game";
import { loadSettings } from "@/config/GameSettings";
import { uiStore } from "@/stores/uiStore";

interface MobileControlsProps {
  game: Game;
  className?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  game,
  className,
}) => {
  const { isMobile } = useMobileLayout();
  const [settings, setSettings] = useState(loadSettings());
  const [isVisible, setIsVisible] = useState(true);
  const shootingIntervalRef = useRef<number | null>(null);
  const [isMovementActive, setIsMovementActive] = useState(false);
  const [isAimingActive, setIsAimingActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose joystick state to the game
  useEffect(() => {
    const mobileControls = {
      isJoystickActive: () => isMovementActive || isAimingActive,
    };
    (game as any).mobileControls = mobileControls;

    return () => {
      delete (game as any).mobileControls;
    };
  }, [game, isMovementActive, isAimingActive]);

  // Only show on mobile/touch devices and if enabled
  if (!isMobile || !settings.showMobileControls) {
    return null;
  }

  // Check if mobile controls are enabled in settings
  useEffect(() => {
    const checkSettings = () => {
      const newSettings = loadSettings();
      setSettings(newSettings);
    };

    // Listen for settings changes
    window.addEventListener("settingsChanged", checkSettings);
    return () => window.removeEventListener("settingsChanged", checkSettings);
  }, []);

  // Hide controls when UI panels are open
  useEffect(() => {
    const handleUIStateChange = () => {
      // Check if any panels are open by checking uiStore
      const anyPanelOpen = Object.values(uiStore.getState().panels).some(
        (panel) => panel.isOpen
      );
      setIsVisible(!anyPanelOpen);
    };

    // Check UI state periodically
    const interval = setInterval(handleUIStateChange, 100);
    return () => clearInterval(interval);
  }, []);

  // Cleanup shooting interval on unmount
  useEffect(() => {
    return () => {
      if (shootingIntervalRef.current) {
        clearInterval(shootingIntervalRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  const handleMovementJoystick = (
    direction: { x: number; y: number } | null
  ) => {
    const player = game.getPlayer();
    if (!player) return;

    if (direction) {
      // Use the new mobile input method
      player.setMobileInput(direction.x, direction.y);
      setIsMovementActive(true);
    } else {
      // Clear mobile input
      player.clearMobileInput();
      setIsMovementActive(false);
    }
  };

  const handleAimingJoystick = (direction: { x: number; y: number } | null) => {
    const player = game.getPlayer();
    if (!player) return;

    if (direction) {
      // Calculate angle from direction
      const angle = Math.atan2(direction.y, direction.x);
      player.setAimDirection(angle);
      setIsAimingActive(true);

      // Start shooting if not already
      if (!shootingIntervalRef.current) {
        player.startShooting();

        // Set up continuous shooting
        shootingIntervalRef.current = window.setInterval(() => {
          player.tryShoot();
        }, 100); // Shoot every 100ms
      }
    } else {
      // Stop shooting
      if (shootingIntervalRef.current) {
        clearInterval(shootingIntervalRef.current);
        shootingIntervalRef.current = null;
        player.stopShooting();
      }
      setIsAimingActive(false);
    }
  };

  const isLefty = settings.touchControlsLayout === "lefty";

  return (
    <div ref={containerRef} className={cn("pointer-events-auto", className)}>
      {/* Movement Joystick */}
      <div
        className={cn(
          "absolute bottom-44",
          isLefty ? "right-8" : "left-8",
          "animate-fade-in-scale"
        )}
      >
        <VirtualJoystick
          size={120}
          onMove={handleMovementJoystick}
          position={isLefty ? "right" : "left"}
        />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/50 whitespace-nowrap">
          Move
        </span>
      </div>

      {/* Aiming/Shooting Joystick */}
      <div
        className={cn(
          "absolute bottom-44",
          isLefty ? "left-8" : "right-8",
          "animate-fade-in-scale animation-delay-100"
        )}
      >
        <VirtualJoystick
          size={120}
          onMove={handleAimingJoystick}
          position={isLefty ? "left" : "right"}
        />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/50 whitespace-nowrap">
          Aim & Shoot
        </span>
      </div>
    </div>
  );
};
