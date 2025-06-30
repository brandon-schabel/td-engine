import React, { useState, useEffect } from 'react';
import { Scene, SceneContainer, SceneHeader } from './Scene';
import { useScene } from './SceneContext';
import { Button } from '../components/shared/Button';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { BiomeType, MapDifficulty, MapSize } from '@/types/MapData';
import { TransitionType } from './SceneTransition';
import { cn } from '@/lib/utils';
import type { AudioManager } from '@/audio/AudioManager';

export interface PreGameConfigData {
  mapSize: MapSize;
  difficulty: MapDifficulty;
  biome: BiomeType;
}

interface PreGameConfigProps {
  audioManager?: AudioManager;
  onStartGame?: (config: PreGameConfigData) => void;
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
  audioManager?: AudioManager;
}

const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  description,
  options,
  selectedValue,
  onChange,
  audioManager
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-ui-text-primary mb-2">{title}</h3>
        <p className="text-sm text-ui-text-secondary">{description}</p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => {
                audioManager?.playUISound(SoundType.SELECT);
                onChange(option.value);
              }}
              className={cn(
                'p-4 rounded-lg border-2 transition-all duration-200',
                'flex flex-col items-center gap-2',
                'hover:scale-105 relative',
                isSelected
                  ? 'bg-button-primary border-button-primary shadow-lg'
                  : 'bg-ui-bg-secondary border-ui-border-subtle hover:border-ui-border-DEFAULT'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className={cn(
                  'absolute top-2 right-2 w-3 h-3',
                  'bg-button-primary rounded-full',
                  'flex items-center justify-center',
                  'text-[10px] text-white'
                )}>
                  ✓
                </div>
              )}

              <div className={cn(
                'font-semibold text-sm',
                isSelected ? 'text-white' : 'text-ui-text-primary'
              )}>
                {option.label}
              </div>

              <div className={cn(
                'text-xs text-center',
                isSelected ? 'text-white/90' : 'text-ui-text-secondary'
              )}>
                {option.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PreGameConfig: React.FC<PreGameConfigProps> = ({ 
  audioManager,
  onStartGame 
}) => {
  const { switchToScene, goBack } = useScene();
  
  const [config, setConfig] = useState<PreGameConfigData>(() => {
    // Load saved preferences
    const savedConfig = localStorage.getItem('preGameConfig');
    if (savedConfig) {
      try {
        return { 
          mapSize: MapSize.MEDIUM,
          difficulty: MapDifficulty.MEDIUM,
          biome: BiomeType.FOREST,
          ...JSON.parse(savedConfig) 
        };
      } catch (e) {
        console.warn('[PreGameConfig] Failed to parse saved config:', e);
      }
    }
    
    return {
      mapSize: MapSize.MEDIUM,
      difficulty: MapDifficulty.MEDIUM,
      biome: BiomeType.FOREST
    };
  });

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('preGameConfig', JSON.stringify(config));
  }, [config]);

  const handleBack = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    goBack();
  };

  const handleStartGame = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Store config for game scene
    (window as any).__preGameConfig = config;
    
    // Call callback if provided
    if (onStartGame) {
      onStartGame(config);
    }
    
    // Switch to game scene
    switchToScene('game', {
      type: TransitionType.FADE
    });
  };

  const mapSizeOptions: OptionItem[] = [
    { value: MapSize.SMALL, label: 'Small', description: '20x20 - Quick games' },
    { value: MapSize.MEDIUM, label: 'Medium', description: '30x30 - Balanced' },
    { value: MapSize.LARGE, label: 'Large', description: '40x40 - Long games' },
    { value: MapSize.HUGE, label: 'Huge', description: '50x50 - Epic battles' }
  ];

  const difficultyOptions: OptionItem[] = [
    { value: MapDifficulty.EASY, label: 'Easy', description: 'For beginners' },
    { value: MapDifficulty.MEDIUM, label: 'Medium', description: 'Balanced challenge' },
    { value: MapDifficulty.HARD, label: 'Hard', description: 'For veterans' },
    { value: MapDifficulty.EXTREME, label: 'Extreme', description: 'Ultimate test' }
  ];

  const biomeOptions: OptionItem[] = [
    { value: BiomeType.FOREST, label: 'Forest', description: 'Lush greenery' },
    { value: BiomeType.DESERT, label: 'Desert', description: 'Sandy dunes' },
    { value: BiomeType.ARCTIC, label: 'Arctic', description: 'Frozen tundra' },
    { value: BiomeType.VOLCANIC, label: 'Volcanic', description: 'Molten landscape' }
  ];

  return (
    <Scene className="overflow-y-auto">
      <SceneHeader
        title="Game Configuration"
        leftAction={
          <Button
            variant="ghost"
            size="sm"
            icon={IconType.ARROW_LEFT}
            onClick={handleBack}
          >
            Back
          </Button>
        }
      />

      <SceneContainer centered className="max-w-4xl mx-auto">
        {/* Configuration sections */}
        <div className="w-full space-y-8">
          {/* Map Size */}
          <OptionSection
            title="Map Size"
            description="Choose the battlefield size"
            options={mapSizeOptions}
            selectedValue={config.mapSize}
            onChange={(value) => setConfig({ ...config, mapSize: value as MapSize })}
            audioManager={audioManager}
          />

          {/* Difficulty */}
          <OptionSection
            title="Difficulty"
            description="Set the challenge level"
            options={difficultyOptions}
            selectedValue={config.difficulty}
            onChange={(value) => setConfig({ ...config, difficulty: value as MapDifficulty })}
            audioManager={audioManager}
          />

          {/* Biome */}
          <OptionSection
            title="Biome"
            description="Select the environment"
            options={biomeOptions}
            selectedValue={config.biome}
            onChange={(value) => setConfig({ ...config, biome: value as BiomeType })}
            audioManager={audioManager}
          />
        </div>

        {/* Start button */}
        <div className="mt-12">
          <Button
            size="lg"
            variant="primary"
            icon={IconType.PLAY}
            onClick={handleStartGame}
            className="px-8 py-4 text-lg"
          >
            Start Game
          </Button>
        </div>
      </SceneContainer>
    </Scene>
  );
};