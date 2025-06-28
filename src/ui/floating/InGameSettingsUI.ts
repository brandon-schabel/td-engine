/**
 * In-Game Settings Dialog
 * A lightweight settings dialog that appears during gameplay without resetting the game
 */

import { Game } from "@/core/Game";
import type { FloatingUIElement } from "./FloatingUIElement";
import type { FloatingUIManager } from "./FloatingUIManager";
import { 
  createButton, 
  createSlider,
  createToggle,
  cn 
} from "@/ui/elements";
import { loadSettings, saveSettings, type GameSettings } from "@/config/GameSettings";

export class InGameSettingsUI {
  private game: Game;
  private element: FloatingUIElement | null = null;
  private floatingUI: FloatingUIManager;
  private settings: GameSettings;
  private isDirty: boolean = false;

  constructor(game: Game) {
    this.game = game;
    this.floatingUI = game.getFloatingUIManager();
    this.settings = loadSettings();
  }

  show(): void {
    // Close any existing instance
    this.close();

    // Create the dialog
    this.element = this.floatingUI.createDialog(
      'in-game-settings',
      this.createContent(),
      {
        title: 'Settings',
        closeable: true,
        onClose: () => this.handleClose(),
        className: cn('max-w-md')
      }
    );
  }

  private createContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('space-y-6', 'p-4');

    // Audio Settings Section
    const audioSection = document.createElement('div');
    audioSection.className = cn('space-y-4');

    // Audio header
    const audioHeader = document.createElement('div');
    audioHeader.className = cn('flex', 'items-center', 'gap-2', 'mb-4');
    audioHeader.innerHTML = `
      <svg class="${cn('w-5', 'h-5', 'text-white')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      <h3 class="${cn('text-lg', 'font-semibold', 'text-white')}">Audio Settings</h3>
    `;
    audioSection.appendChild(audioHeader);

    // Master Volume
    const volumeContainer = document.createElement('div');
    volumeContainer.className = cn('space-y-2');
    
    const volumeLabel = document.createElement('label');
    volumeLabel.className = cn('text-sm', 'font-medium', 'text-white');
    volumeLabel.textContent = 'Master Volume';
    volumeContainer.appendChild(volumeLabel);

    const volumeSlider = createSlider({
      min: 0,
      max: 100,
      value: Math.round(this.settings.masterVolume * 100),
      onChange: (value) => {
        this.settings.masterVolume = value / 100;
        this.isDirty = true;
        this.applyAudioSettings();
      }
    });
    volumeContainer.appendChild(volumeSlider);

    audioSection.appendChild(volumeContainer);

    // Sound Effects Toggle
    const soundToggleContainer = document.createElement('div');
    soundToggleContainer.className = cn('flex', 'items-center', 'justify-between', 'py-2');
    
    const soundLabel = document.createElement('label');
    soundLabel.className = cn('text-sm', 'font-medium', 'text-white');
    soundLabel.textContent = 'Sound Effects';
    
    const soundToggle = createToggle({
      checked: this.settings.soundEnabled,
      onChange: (checked) => {
        this.settings.soundEnabled = checked;
        this.isDirty = true;
        this.applyAudioSettings();
      }
    });

    soundToggleContainer.appendChild(soundLabel);
    soundToggleContainer.appendChild(soundToggle);
    audioSection.appendChild(soundToggleContainer);

    // Gameplay Settings Section
    const gameplaySection = document.createElement('div');
    gameplaySection.className = cn('space-y-4', 'pt-4', 'border-t', 'border-border-primary');

    // Gameplay header
    const gameplayHeader = document.createElement('div');
    gameplayHeader.className = cn('flex', 'items-center', 'gap-2', 'mb-4');
    gameplayHeader.innerHTML = `
      <svg class="${cn('w-5', 'h-5', 'text-white')}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
      <h3 class="${cn('text-lg', 'font-semibold', 'text-white')}">Gameplay Settings</h3>
    `;
    gameplaySection.appendChild(gameplayHeader);

    // Auto-pause Toggle
    const pauseToggleContainer = document.createElement('div');
    pauseToggleContainer.className = cn('flex', 'items-center', 'justify-between', 'py-2');
    
    const pauseLabel = document.createElement('label');
    pauseLabel.className = cn('text-sm', 'font-medium', 'text-white');
    pauseLabel.textContent = 'Auto-pause on Focus Loss';
    
    const pauseToggle = createToggle({
      checked: this.settings.autoPause ?? true,
      onChange: (checked) => {
        this.settings.autoPause = checked;
        this.isDirty = true;
      }
    });

    pauseToggleContainer.appendChild(pauseLabel);
    pauseToggleContainer.appendChild(pauseToggle);
    gameplaySection.appendChild(pauseToggleContainer);

    // Show FPS Toggle
    const fpsToggleContainer = document.createElement('div');
    fpsToggleContainer.className = cn('flex', 'items-center', 'justify-between', 'py-2');
    
    const fpsLabel = document.createElement('label');
    fpsLabel.className = cn('text-sm', 'font-medium', 'text-white');
    fpsLabel.textContent = 'Show FPS Counter';
    
    const fpsToggle = createToggle({
      checked: this.settings.showFPS,
      onChange: (checked) => {
        this.settings.showFPS = checked;
        this.isDirty = true;
      }
    });

    fpsToggleContainer.appendChild(fpsLabel);
    fpsToggleContainer.appendChild(fpsToggle);
    gameplaySection.appendChild(fpsToggleContainer);

    // Show Path Debug Toggle
    const pathDebugToggleContainer = document.createElement('div');
    pathDebugToggleContainer.className = cn('flex', 'items-center', 'justify-between', 'py-2');
    
    const pathDebugLabel = document.createElement('label');
    pathDebugLabel.className = cn('text-sm', 'font-medium', 'text-white');
    pathDebugLabel.textContent = 'Show Path Debug';
    
    const pathDebugToggle = createToggle({
      checked: this.settings.showPathDebug ?? false,
      onChange: (checked) => {
        this.settings.showPathDebug = checked;
        this.isDirty = true;
        this.applyPathDebugSetting(checked);
      }
    });

    pathDebugToggleContainer.appendChild(pathDebugLabel);
    pathDebugToggleContainer.appendChild(pathDebugToggle);
    gameplaySection.appendChild(pathDebugToggleContainer);

    // Add sections to container
    container.appendChild(audioSection);
    container.appendChild(gameplaySection);

    // Resume button
    const buttonContainer = document.createElement('div');
    buttonContainer.className = cn('pt-4', 'border-t', 'border-border-primary', 'flex', 'justify-center');
    
    const resumeButton = createButton({
      text: 'Resume Game',
      variant: 'primary',
      size: 'md',
      onClick: () => this.close()
    });
    
    buttonContainer.appendChild(resumeButton);
    container.appendChild(buttonContainer);

    return container;
  }

  private applyAudioSettings(): void {
    const audioManager = this.game.getAudioManager();
    if (audioManager) {
      audioManager.setMasterVolume(this.settings.masterVolume);
      audioManager.setEnabled(this.settings.soundEnabled);
    }
  }

  private applyPathDebugSetting(enabled: boolean): void {
    const PathfindingDebug = (window as any).PathfindingDebug;
    if (PathfindingDebug) {
      if (enabled) {
        PathfindingDebug.enable();
        console.log("=== PATHFINDING DEBUG ENABLED ===");
        console.log("Press 'P' to toggle enemy paths visualization");
        console.log("Press 'G' to toggle navigation grid visualization");
      } else {
        PathfindingDebug.disable();
        console.log("=== PATHFINDING DEBUG DISABLED ===");
      }
    } else {
      console.warn("PathfindingDebug not found on window object");
    }
  }

  private handleClose(): void {
    if (this.isDirty) {
      saveSettings(this.settings);
    }
    this.destroy();
  }

  close(): void {
    if (this.element) {
      this.floatingUI.remove('in-game-settings');
      this.element = null;
    }
  }

  private destroy(): void {
    this.close();
  }
}