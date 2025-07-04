import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GlassPanel, GlassButton } from "@/ui/react/components/shared/Glass";
import { GlassOptionCard } from "@/ui/react/components/shared/GlassOptionCard";
import { Icon } from "@/ui/react/components/shared/Icon";
import { IconType } from "@/ui/icons/SvgIcons";
import { SoundType } from "@/audio/AudioManager";
import { BiomeType, MapDifficulty } from "@/types/MapData";
import { MapRegistry } from "@/maps";
import { MapPreview } from "@/ui/react/components/MapPreview";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pre-game")({
  component: PreGameConfig,
});

export interface PreGameConfigData {
  mapId: string;
  difficulty: MapDifficulty;
}

interface OptionItem {
  value: string;
  label: string;
  description: string;
}

interface OptionSectionProps {
  title: string;
  description: string;
  options: OptionItem[];
  selectedValue: string;
  onChange: (value: string) => void;
  icon?: IconType;
}

const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  description,
  options,
  selectedValue,
  onChange,
  icon,
}) => {
  const { audioManager } = Route.useRouteContext();

  return (
    <GlassPanel
      variant="dark"
      blur="lg"
      opacity={85}
      glow
      className="rounded-2xl animate-fade-in-scale"
    >
      <GlassPanel.Header>
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Icon type={icon} size={24} className="text-white/80" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/70">{description}</p>
          </div>
        </div>
      </GlassPanel.Header>

      <GlassPanel.Body>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {options.map((option) => {
            const isSelected = selectedValue === option.value;

            return (
              <GlassOptionCard
                key={option.value}
                title={option.label}
                description={option.description}
                selected={isSelected}
                onSelect={() => {
                  audioManager?.playUISound(SoundType.SELECT);
                  onChange(option.value);
                }}
                variant="compact"
              />
            );
          })}
        </div>
      </GlassPanel.Body>
    </GlassPanel>
  );
};

function PreGameConfig() {
  const navigate = useNavigate();
  const { audioManager } = Route.useRouteContext();

  const [config, setConfig] = useState<PreGameConfigData>(() => {
    // Initialize map registry first
    MapRegistry.initializeSync();

    // Then load saved preferences
    // Load saved preferences
    const savedConfig = localStorage.getItem("preGameConfig");
    if (savedConfig) {
      try {
        return {
          mapId: "classic",
          difficulty: MapDifficulty.MEDIUM,
          ...JSON.parse(savedConfig),
        };
      } catch (e) {
        console.warn("[PreGameConfig] Failed to parse saved config:", e);
      }
    }

    return {
      mapId: "classic",
      difficulty: MapDifficulty.MEDIUM,
    };
  });

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem("preGameConfig", JSON.stringify(config));
  }, [config]);

  const handleBack = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    navigate({ to: "/" });
  };

  const handleStartGame = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);

    // Store config for game scene
    (window as any).__preGameConfig = config;

    // Navigate to game
    navigate({
      to: "/game",
      search: { resume: false },
    });
  };

  const mapOptions: OptionItem[] = [
    {
      value: "classic",
      label: "Classic Path",
      description: "Winding path - Easy",
    },
    {
      value: "crossroads",
      label: "Crossroads",
      description: "Multiple paths - Medium",
    },
    {
      value: "spiral",
      label: "The Spiral",
      description: "Spiral inward - Hard",
    },
    {
      value: "tutorial",
      label: "Training",
      description: "Learn the basics",
    },
  ];

  const difficultyOptions: OptionItem[] = [
    { value: MapDifficulty.EASY, label: "Easy", description: "For beginners" },
    {
      value: MapDifficulty.MEDIUM,
      label: "Medium",
      description: "Balanced challenge",
    },
    { value: MapDifficulty.HARD, label: "Hard", description: "For veterans" },
    {
      value: MapDifficulty.EXTREME,
      label: "Extreme",
      description: "Ultimate test",
    },
  ];

  return (
    <div className="relative w-full h-full overflow-y-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-primary/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Game Configuration</h1>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </GlassButton>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Configuration sections */}
        <div className="w-full space-y-6 stagger-children">
          {/* Map Selection with Preview */}
          <GlassPanel
            variant="dark"
            blur="lg"
            opacity={85}
            glow
            className="rounded-2xl animate-fade-in-scale"
          >
            <GlassPanel.Header>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Icon
                    type={IconType.MAP}
                    size={24}
                    className="text-white/80"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Select Map
                  </h3>
                  <p className="text-sm text-white/70">
                    Choose your battlefield
                  </p>
                </div>
              </div>
            </GlassPanel.Header>

            <GlassPanel.Body>
              <div className="flex gap-6">
                {/* Map options */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {mapOptions.map((option) => {
                    const isSelected = config.mapId === option.value;

                    return (
                      <GlassOptionCard
                        key={option.value}
                        title={option.label}
                        description={option.description}
                        selected={isSelected}
                        onSelect={() => {
                          audioManager?.playUISound(SoundType.SELECT);
                          setConfig({ ...config, mapId: option.value });
                        }}
                        variant="compact"
                      />
                    );
                  })}
                </div>

                {/* Map preview */}
                <div className="w-48">
                  <div className="sticky top-4">
                    <h4 className="text-sm font-medium text-white/70 mb-2">
                      Preview
                    </h4>
                    <MapPreview mapId={config.mapId} className="w-full" />
                  </div>
                </div>
              </div>
            </GlassPanel.Body>
          </GlassPanel>

          {/* Difficulty */}
          <OptionSection
            title="Difficulty"
            description="Set the challenge level"
            options={difficultyOptions}
            selectedValue={config.difficulty}
            onChange={(value) =>
              setConfig({ ...config, difficulty: value as MapDifficulty })
            }
            icon={IconType.DIFFICULTY}
          />
        </div>

        {/* Start button */}
        <div className="mt-12 flex justify-center">
          <GlassButton
            size="lg"
            variant="primary"
            onClick={handleStartGame}
            className="px-12 py-5 text-lg font-bold glass-border-glow text-white"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Game
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
