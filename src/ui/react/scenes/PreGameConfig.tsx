import React, { useState, useEffect } from 'react';
import { Scene, SceneContainer, SceneHeader } from './Scene';
import { useScene } from './SceneContext';
import { Button } from '../components/shared/Button';
import { GlassPanel, GlassButton } from '../components/shared/Glass';
import { GlassOptionCard } from '../components/shared/GlassOptionCard';
import { Icon } from '../components/shared/Icon';
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
  icon?: IconType;
}

const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  description,
  options,
  selectedValue,
  onChange,
  audioManager,
  icon
}) => {
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
              <Icon icon={icon} size={24} className="text-white/80" />
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
    <Scene className="overflow-y-auto relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      
      <SceneHeader
        title="Game Configuration"
        leftAction={
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </GlassButton>
        }
      />

      <SceneContainer centered className="max-w-4xl mx-auto relative z-10">
        {/* Configuration sections */}
        <div className="w-full space-y-6 stagger-children">
          {/* Map Size */}
          <OptionSection
            title="Map Size"
            description="Choose the battlefield size"
            options={mapSizeOptions}
            selectedValue={config.mapSize}
            onChange={(value) => setConfig({ ...config, mapSize: value as MapSize })}
            audioManager={audioManager}
            icon={IconType.MAP}
          />

          {/* Difficulty */}
          <OptionSection
            title="Difficulty"
            description="Set the challenge level"
            options={difficultyOptions}
            selectedValue={config.difficulty}
            onChange={(value) => setConfig({ ...config, difficulty: value as MapDifficulty })}
            audioManager={audioManager}
            icon={IconType.DIFFICULTY}
          />

          {/* Biome */}
          <OptionSection
            title="Biome"
            description="Select the environment"
            options={biomeOptions}
            selectedValue={config.biome}
            onChange={(value) => setConfig({ ...config, biome: value as BiomeType })}
            audioManager={audioManager}
            icon={IconType.MAP}
          />
        </div>

        {/* Start button */}
        <div className="mt-12 flex justify-center">
          <GlassButton
            size="lg"
            variant="primary"
            onClick={handleStartGame}
            className="px-12 py-5 text-lg font-bold glass-border-glow"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Game
          </GlassButton>
        </div>
      </SceneContainer>
    </Scene>
  );
};