import React, { useState, useEffect } from 'react';
import { Modal, Panel, Button, Slider, Toggle } from './shared';
import { cn } from '@/lib/utils';
import { loadSettings, saveSettings, type GameSettings } from '@/config/GameSettings';
import { uiStore, UIPanelType } from '@/stores/uiStore';
import { IconType } from '@/ui/icons/SvgIcons';

/**
 * Settings React component - Replaces InGameSettingsUI
 * Provides audio and gameplay settings during gameplay
 */
export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  const [isDirty, setIsDirty] = useState(false);
  
  // Get game instance
  const game = (window as any).currentGame;
  
  const handleClose = () => {
    if (isDirty) {
      saveSettings(settings);
    }
    uiStore.getState().closePanel(UIPanelType.SETTINGS);
  };
  
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    
    // Apply audio settings immediately
    if (key === 'masterVolume' || key === 'soundEnabled') {
      applyAudioSettings({ ...settings, [key]: value });
    }
    
    // Apply path debug immediately
    if (key === 'showPathDebug') {
      game?.renderer?.setPathDebugEnabled(value as boolean);
    }
  };
  
  const applyAudioSettings = (currentSettings: GameSettings) => {
    const audioManager = game?.getAudioManager();
    if (audioManager) {
      audioManager.setMasterVolume(currentSettings.masterVolume);
      audioManager.setSoundEnabled(currentSettings.soundEnabled);
    }
  };
  
  // Apply initial audio settings
  useEffect(() => {
    applyAudioSettings(settings);
  }, []);
  
  return (
    <Modal isOpen={true} onClose={handleClose}>
      <Panel 
        title="Settings" 
        icon={IconType.SETTINGS}
        onClose={handleClose}
        className={cn('max-w-md', 'min-w-[400px]')}
      >
        <div className={cn('space-y-6')}>
          {/* Audio Settings Section */}
          <AudioSection 
            settings={settings} 
            onUpdate={updateSetting}
          />
          
          {/* Gameplay Settings Section */}
          <GameplaySection 
            settings={settings} 
            onUpdate={updateSetting}
          />
          
          {/* Resume button */}
          <div className={cn('pt-4', 'border-t', 'border-ui-border-DEFAULT', 'flex', 'justify-center')}>
            <Button
              variant="primary"
              size="md"
              onClick={handleClose}
            >
              Resume Game
            </Button>
          </div>
        </div>
      </Panel>
    </Modal>
  );
};

/**
 * Audio settings section
 */
const AudioSection: React.FC<{
  settings: GameSettings;
  onUpdate: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
  return (
    <div className={cn('space-y-4')}>
      <div className={cn('flex', 'items-center', 'gap-2', 'mb-4')}>
        <svg className={cn('w-5', 'h-5', 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <h3 className={cn('text-lg', 'font-semibold', 'text-white')}>Audio Settings</h3>
      </div>
      
      {/* Master Volume */}
      <div className={cn('space-y-2')}>
        <label className={cn('text-sm', 'font-medium', 'text-white')}>
          Master Volume
        </label>
        <Slider
          min={0}
          max={100}
          value={Math.round(settings.masterVolume * 100)}
          onChange={(value) => onUpdate('masterVolume', value / 100)}
          showValue
        />
      </div>
      
      {/* Sound Effects Toggle */}
      <div className={cn('flex', 'items-center', 'justify-between', 'py-2')}>
        <label className={cn('text-sm', 'font-medium', 'text-white')}>
          Sound Effects
        </label>
        <Toggle
          checked={settings.soundEnabled}
          onCheckedChange={(checked) => onUpdate('soundEnabled', checked)}
        />
      </div>
    </div>
  );
};

/**
 * Gameplay settings section
 */
const GameplaySection: React.FC<{
  settings: GameSettings;
  onUpdate: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
}> = ({ settings, onUpdate }) => {
  return (
    <div className={cn('space-y-4', 'pt-4', 'border-t', 'border-ui-border-DEFAULT')}>
      <div className={cn('flex', 'items-center', 'gap-2', 'mb-4')}>
        <svg className={cn('w-5', 'h-5', 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <h3 className={cn('text-lg', 'font-semibold', 'text-white')}>Gameplay Settings</h3>
      </div>
      
      <ToggleOption
        label="Auto-pause on Focus Loss"
        checked={settings.autoPause ?? true}
        onChange={(checked) => onUpdate('autoPause', checked)}
      />
      
      <ToggleOption
        label="Show FPS Counter"
        checked={settings.showFPS}
        onChange={(checked) => onUpdate('showFPS', checked)}
      />
      
      <ToggleOption
        label="Show Path Debug"
        checked={settings.showPathDebug ?? false}
        onChange={(checked) => onUpdate('showPathDebug', checked)}
      />
    </div>
  );
};

/**
 * Reusable toggle option component
 */
const ToggleOption: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  return (
    <div className={cn('flex', 'items-center', 'justify-between', 'py-2')}>
      <label className={cn('text-sm', 'font-medium', 'text-white')}>
        {label}
      </label>
      <Toggle
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
};