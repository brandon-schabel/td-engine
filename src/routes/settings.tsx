import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SettingsPage } from "@/ui/react/components/SettingsPage";
import { SoundType } from "@/audio/AudioManager";
import { GlassButton } from "@/ui/react/components/shared/Glass";
import { Icon } from "@/ui/react/components/shared/Icon";
import { IconType } from "@/ui/icons/SvgIcons";

export const Route = createFileRoute("/settings")({
  component: SettingsScene,
});

function SettingsScene() {
  const navigate = useNavigate();
  const { audioManager } = Route.useRouteContext();

  const handleBack = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);

    // Navigate back to previous route
    if (window.history.length > 1) {
      navigate({ to: ".." });
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border-b border-white/10">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <GlassButton
            size="md"
            variant="secondary"
            onClick={handleBack}
            className="gap-2"
          >
            <Icon type={IconType.ARROW_LEFT} size={16} />
            Back
          </GlassButton>
        </div>

        {/* Settings content with scrolling */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <SettingsPage />
          </div>
        </div>
      </div>
    </div>
  );
}
