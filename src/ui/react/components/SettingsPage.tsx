import React, { useState, useEffect } from 'react';
import { GlassPanel } from './shared/Glass';
import { GlassSlider } from './shared/GlassSlider';
import { GlassToggle } from './shared/GlassToggle';
import { cn } from '@/lib/utils';
import { loadSettings, saveSettings, type GameSettings } from '@/config/GameSettings';

/**
 * Settings page component for the settings route
 */
export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  const [isDirty, setIsDirty] = useState(false);
  
  // Get game instance
  const game = (window as any).currentGame;
  
  useEffect(() => {
    // Save settings when they change
    if (isDirty) {
      saveSettings(settings);
      setIsDirty(false);
    }
  }, [settings, isDirty]);
  
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
      audioManager.setEnabled(currentSettings.soundEnabled);
    }
  };
  
  // Apply initial audio settings
  useEffect(() => {
    applyAudioSettings(settings);
  }, []);
  
  return (
    <div className={cn('space-y-8')}>
      {/* Audio Settings Section */}
      <GlassPanel
        variant="dark"
        blur="lg"
        opacity={85}
        glow
        className="rounded-2xl"
      >
        <GlassPanel.Header className="px-6 py-4">
          <div className={cn('flex', 'items-center', 'gap-3')}>
            <svg className={cn('w-5', 'h-5', 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <h3 className={cn('text-xl', 'font-semibold', 'text-white')}>Audio Settings</h3>
          </div>
        </GlassPanel.Header>
        <GlassPanel.Body className="px-6 py-4 space-y-4">
          <GlassSlider
            label="Master Volume"
            min={0}
            max={100}
            value={Math.round(settings.masterVolume * 100)}
            onChange={(value) => updateSetting('masterVolume', value / 100)}
            showValue
            valueFormatter={(v) => `${v}%`}
            glowColor="blue"
            showReflection={true}
            pulseOnChange={true}
          />
          
          <ToggleOption
            label="Sound Effects"
            checked={settings.soundEnabled}
            onChange={(checked) => updateSetting('soundEnabled', checked)}
            glowColor="green"
          />
        </GlassPanel.Body>
      </GlassPanel>
      
      {/* Gameplay Settings Section */}
      <GlassPanel
        variant="dark"
        blur="lg"
        opacity={85}
        glow
        className="rounded-2xl"
      >
        <GlassPanel.Header className="px-6 py-4">
          <div className={cn('flex', 'items-center', 'gap-3')}>
            <svg className={cn('w-5', 'h-5', 'text-white')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h3 className={cn('text-xl', 'font-semibold', 'text-white')}>Gameplay Settings</h3>
          </div>
        </GlassPanel.Header>
        <GlassPanel.Body className="px-6 py-4 space-y-4">
          <ToggleOption
            label="Auto-pause on Focus Loss"
            checked={settings.autoPause ?? true}
            onChange={(checked) => updateSetting('autoPause', checked)}
            glowColor="purple"
          />
          
          <ToggleOption
            label="Show FPS Counter"
            checked={settings.showFPS}
            onChange={(checked) => updateSetting('showFPS', checked)}
            glowColor="yellow"
          />
          
          <ToggleOption
            label="Show Path Debug"
            checked={settings.showPathDebug ?? false}
            onChange={(checked) => updateSetting('showPathDebug', checked)}
            glowColor="pink"
          />
        </GlassPanel.Body>
      </GlassPanel>
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
  glowColor?: 'blue' | 'green' | 'purple' | 'pink' | 'yellow';
}> = ({ label, checked, onChange, glowColor = 'purple' }) => {
  return (
    <div className={cn(
      'flex', 
      'items-center', 
      'justify-between', 
      'py-3',
      'px-4',
      'rounded-lg',
      'bg-white/5',
      'backdrop-blur-sm',
      'border',
      'border-white/10',
      'hover:bg-white/10',
      'transition-all'
    )}>
      <label className={cn('text-sm', 'font-medium', 'text-white')}>
        {label}
      </label>
      <GlassToggle
        checked={checked}
        onCheckedChange={onChange}
        glowColor={glowColor}
        size="md"
      />
    </div>
  );
};