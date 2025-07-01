import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GlassPanel, GlassButton } from "@/ui/react/components/shared/Glass";
import { Icon } from "@/ui/react/components/shared/Icon";
import { IconType } from "@/ui/icons/SvgIcons";
import { SoundType } from "@/audio/AudioManager";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: MainMenu,
});

function MainMenu() {
  const navigate = useNavigate();
  const { audioManager } = Route.useRouteContext();

  const handleStartGame = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    navigate({
      to: "/pre-game",
    });
  };

  const handleSettings = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    navigate({
      to: "/settings",
    });
  };

  const handleLeaderboard = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    navigate({
      to: "/leaderboard",
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Particle overlay effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "float 20s linear infinite",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-8">
        <GlassPanel
          variant="dark"
          blur="xl"
          opacity={80}
          border={true}
          glow={true}
          className="rounded-3xl max-w-md w-full animate-in fade-in zoom-in duration-500"
        >
          <GlassPanel.Body className="p-8 text-center">
            {/* Logo section */}
            <div className="mb-8">
              {/* Logo with glow effect */}
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-xl animate-pulse" />
                <div
                  className="relative p-4 rounded-full bg-white/10 backdrop-blur-sm animate-bounce"
                  style={{ animationDuration: "3s" }}
                >
                  <Icon
                    type={IconType.TOWER}
                    size={64}
                    className="text-white"
                  />
                </div>
              </div>

              {/* Game title */}
              <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Tower Defense
              </h1>
              <p className="text-lg text-white/80 mb-8 animate-in slide-in-from-bottom duration-700 delay-300">
                Defend your base!
              </p>
            </div>

            {/* Menu buttons */}
            <div className="space-y-4">
              <GlassButton
                size="lg"
                variant="primary"
                onClick={handleStartGame}
                className="w-full h-14 text-lg font-semibold gap-3 text-white shadow-lg shadow-blue-500/25 border-2 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300"
              >
                <Icon type={IconType.PLAY} size={20} className="text-white" />
                Start Game
              </GlassButton>

              <GlassButton
                size="lg"
                variant="secondary"
                onClick={handleSettings}
                className="w-full h-12 font-medium gap-3"
              >
                <Icon type={IconType.SETTINGS} size={18} />
                Settings
              </GlassButton>

              <GlassButton
                size="lg"
                variant="secondary"
                onClick={handleLeaderboard}
                className="w-full h-12 font-medium gap-3"
              >
                <Icon type={IconType.CROWN} size={18} />
                Leaderboard
              </GlassButton>
            </div>
          </GlassPanel.Body>
        </GlassPanel>
      </div>

      {/* Version info */}
      <div className="absolute bottom-4 left-4 text-xs text-white/40">
        v1.0.0
      </div>
    </div>
  );
}
