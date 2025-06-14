// Example showing how to use the simplified settings system
import { SimpleSettingsMenu } from '@/ui/SimpleSettingsMenu';
import { SettingsManager } from '@/config/GameSettings';
import { applySettingsToGame } from '@/config/SettingsIntegration';

// Example 1: Show the settings menu
export function showSettingsMenuExample(): void {
  const menu = new SimpleSettingsMenu(document.body, () => {
    console.log('Settings menu closed');
    startGameWithSettings();
  });
}

// Example 2: Get current settings and apply them
export function startGameWithSettings(): void {
  const settingsManager = SettingsManager.getInstance();
  const settings = settingsManager.getSettings();
  const gameConfig = applySettingsToGame(settings);
  
  console.log('Starting game with settings:', settings);
  console.log('Applied game config:', gameConfig);
  
  // Use gameConfig to initialize your game
  // For example:
  // const game = new Game(gameConfig);
}

// Example 3: Programmatically change settings
export function changeSettingsExample(): void {
  const settingsManager = SettingsManager.getInstance();
  
  // Change difficulty to challenge mode
  settingsManager.updateSettings({
    difficulty: 'CHALLENGE',
    visualQuality: 'HIGH',
    mapSize: 'LARGE'
  });
  
  // Get the updated configuration
  const newConfig = applySettingsToGame(settingsManager.getSettings());
  console.log('Updated game config:', newConfig);
}

// Example 4: Reset to defaults
export function resetSettingsExample(): void {
  const settingsManager = SettingsManager.getInstance();
  settingsManager.resetToDefaults();
  
  console.log('Settings reset to defaults');
}

// Example showing the difference between old complex system and new simple system
export function comparisonExample(): void {
  console.log('=== SETTINGS SYSTEM COMPARISON ===');
  
  // Old system would have 150+ options across multiple files
  console.log('Old system: 150+ configuration options (REMOVED)');
  console.log('- Complex GameConfiguration interface (REMOVED)');
  console.log('- Multiple validation rules (REMOVED)');
  console.log('- Preset generation system (REMOVED)');
  console.log('- File import/export (REMOVED)');
  
  // New system has only the essentials
  const settings = SettingsManager.getInstance().getSettings();
  console.log('New system: 10 simple options');
  console.log('Settings:', settings);
  
  const gameConfig = applySettingsToGame(settings);
  console.log('Resulting game config keys:');
  console.log(Object.keys(gameConfig));
}