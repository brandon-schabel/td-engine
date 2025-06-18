import { SettingsManager, DIFFICULTY_PRESETS } from '@/config/GameSettings';
import type { GameSettings } from '@/config/GameSettings';

export class SimpleSettingsMenu {
  private container: HTMLElement;
  private settingsManager: SettingsManager;
  private settings: GameSettings;
  private onClose?: () => void;

  constructor(parentElement: HTMLElement, onClose?: () => void) {
    this.settingsManager = SettingsManager.getInstance();
    this.settings = this.settingsManager.getSettings();
    this.onClose = onClose;
    this.container = this.createMenu();
    parentElement.appendChild(this.container);
  }
  
  private createMobileControlsSection(): string {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      return ''; // Don't show mobile controls on desktop
    }
    
    return `
      <div class="settings-section">
        <h3>Mobile Controls</h3>
        <label class="setting-row">
          <input type="checkbox" id="mobile-joystick" ${this.settings.mobileJoystickEnabled ? 'checked' : ''}>
          <span>Virtual Joystick</span>
        </label>
        <label class="setting-row">
          <input type="checkbox" id="haptic-feedback" ${this.settings.hapticFeedbackEnabled ? 'checked' : ''}>
          <span>Haptic Feedback</span>
        </label>
        <label class="setting-row">
          <span>Layout</span>
          <select id="touch-layout">
            <option value="default" ${this.settings.touchControlsLayout === 'default' ? 'selected' : ''}>Right-handed</option>
            <option value="lefty" ${this.settings.touchControlsLayout === 'lefty' ? 'selected' : ''}>Left-handed</option>
          </select>
        </label>
      </div>
    `;
  }

  private createMenu(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const menu = document.createElement('div');
    menu.style.cssText = `
      background: #2a2a2a;
      border-radius: 12px;
      padding: clamp(15px, 4vw, 30px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: white;
      font-family: 'Arial', sans-serif;
      max-width: min(500px, 90vw);
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    `;

    menu.innerHTML = `
      <h2 style="margin: 0 0 clamp(15px, 3vw, 30px); text-align: center; color: #4CAF50; font-size: clamp(20px, 5vw, 28px);">Game Settings</h2>
      
      <div class="settings-section">
        <h3>Difficulty</h3>
        <div class="preset-buttons">
          <button data-difficulty="CASUAL" class="preset-btn">🟢 Casual</button>
          <button data-difficulty="NORMAL" class="preset-btn">🟡 Normal</button>
          <button data-difficulty="CHALLENGE" class="preset-btn">🔴 Challenge</button>
        </div>
        <p class="difficulty-description"></p>
      </div>

      <div class="settings-section">
        <h3>Audio</h3>
        <label class="setting-row">
          <span>Master Volume</span>
          <input type="range" id="volume" min="0" max="100" value="${Math.round(this.settings.masterVolume * 100)}">
          <span id="volume-display">${Math.round(this.settings.masterVolume * 100)}%</span>
        </label>
        <label class="setting-row">
          <input type="checkbox" id="sound-enabled" ${this.settings.soundEnabled ? 'checked' : ''}>
          <span>Sound Effects</span>
        </label>
      </div>

      <div class="settings-section">
        <h3>Graphics</h3>
        <label class="setting-row">
          <span>Quality</span>
          <select id="quality">
            <option value="LOW" ${this.settings.visualQuality === 'LOW' ? 'selected' : ''}>Low</option>
            <option value="MEDIUM" ${this.settings.visualQuality === 'MEDIUM' ? 'selected' : ''}>Medium</option>
            <option value="HIGH" ${this.settings.visualQuality === 'HIGH' ? 'selected' : ''}>High</option>
          </select>
        </label>
        <label class="setting-row">
          <input type="checkbox" id="show-fps" ${this.settings.showFPS ? 'checked' : ''}>
          <span>Show FPS Counter</span>
        </label>
      </div>

      <div class="settings-section">
        <h3>Map</h3>
        <label class="setting-row">
          <span>Size</span>
          <select id="map-size">
            <option value="SMALL" ${this.settings.mapSize === 'SMALL' ? 'selected' : ''}>Small</option>
            <option value="MEDIUM" ${this.settings.mapSize === 'MEDIUM' ? 'selected' : ''}>Medium</option>
            <option value="LARGE" ${this.settings.mapSize === 'LARGE' ? 'selected' : ''}>Large</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Terrain</span>
          <select id="terrain">
            <option value="FOREST" ${this.settings.terrain === 'FOREST' ? 'selected' : ''}>🌲 Forest</option>
            <option value="DESERT" ${this.settings.terrain === 'DESERT' ? 'selected' : ''}>🏜️ Desert</option>
            <option value="ARCTIC" ${this.settings.terrain === 'ARCTIC' ? 'selected' : ''}>❄️ Arctic</option>
          </select>
        </label>
        <label class="setting-row">
          <span>Path Style</span>
          <select id="path-complexity">
            <option value="SIMPLE" ${this.settings.pathComplexity === 'SIMPLE' ? 'selected' : ''}>Simple</option>
            <option value="COMPLEX" ${this.settings.pathComplexity === 'COMPLEX' ? 'selected' : ''}>Complex</option>
          </select>
        </label>
      </div>

      ${this.createMobileControlsSection()}

      <div class="button-row">
        <button id="reset-btn" class="secondary-btn">Reset to Defaults</button>
        <button id="close-btn" class="primary-btn">Start Game</button>
      </div>
    `;

    this.addStyles();
    overlay.appendChild(menu);
    this.attachEventListeners(menu, overlay);
    this.updateDifficultyDescription(menu);

    return overlay;
  }

  private addStyles(): void {
    if (document.getElementById('simple-settings-styles')) return;

    const style = document.createElement('style');
    style.id = 'simple-settings-styles';
    style.textContent = `
      .settings-section {
        margin: clamp(15px, 3vw, 25px) 0;
        padding: clamp(10px, 2vw, 15px);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      
      .settings-section h3 {
        margin: 0 0 clamp(10px, 2vw, 15px);
        color: #4CAF50;
        font-size: clamp(16px, 3.5vw, 18px);
      }
      
      .preset-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      
      .preset-btn {
        flex: 1;
        padding: clamp(10px, 2vw, 12px);
        border: 2px solid #444;
        background: #333;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: clamp(12px, 2.5vw, 14px);
        transition: all 0.2s;
        min-height: 44px;
      }
      
      .preset-btn:hover {
        background: #444;
        border-color: #666;
      }
      
      .preset-btn.active {
        border-color: #4CAF50;
        background: rgba(76, 175, 80, 0.2);
      }
      
      .difficulty-description {
        font-size: clamp(11px, 2.5vw, 12px);
        color: #aaa;
        margin: 10px 0 0;
      }
      
      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: clamp(10px, 2vw, 12px) 0;
        gap: clamp(10px, 2vw, 15px);
        font-size: clamp(13px, 2.5vw, 14px);
        min-height: 44px;
      }
      
      .setting-row input[type="range"] {
        flex: 1;
        max-width: 150px;
      }
      
      .setting-row select {
        background: #333;
        color: white;
        border: 1px solid #555;
        padding: 6px 10px;
        border-radius: 4px;
        min-width: 100px;
      }
      
      .setting-row input[type="checkbox"] {
        margin-right: 8px;
      }
      
      .button-row {
        display: flex;
        gap: 15px;
        margin-top: 30px;
        justify-content: center;
      }
      
      .primary-btn, .secondary-btn {
        padding: clamp(10px, 2vw, 12px) clamp(20px, 4vw, 24px);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: clamp(14px, 3vw, 16px);
        transition: background 0.2s;
        min-height: 44px;
      }
      
      .primary-btn {
        background: #4CAF50;
        color: white;
      }
      
      .primary-btn:hover {
        background: #45a049;
      }
      
      .secondary-btn {
        background: #666;
        color: white;
      }
      
      .secondary-btn:hover {
        background: #777;
      }
      
      /* Mobile specific styles */
      @media (max-width: 768px) {
        .preset-buttons {
          flex-direction: column;
        }
        
        .setting-row select {
          min-width: 0;
          max-width: 150px;
        }
        
        .button-row {
          flex-direction: column;
          gap: 10px;
        }
        
        .primary-btn, .secondary-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners(menu: HTMLElement, overlay: HTMLElement): void {
    // Difficulty preset buttons
    menu.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const difficulty = (e.target as HTMLElement).dataset.difficulty as GameSettings['difficulty'];
        if (difficulty) {
          this.settings.difficulty = difficulty;
          this.updateDifficultyDescription();
          this.updateActivePreset();
        }
      });
    });

    // Volume slider
    const volumeSlider = menu.querySelector('#volume') as HTMLInputElement;
    const volumeDisplay = menu.querySelector('#volume-display') as HTMLElement;
    volumeSlider.addEventListener('input', () => {
      const volume = parseInt(volumeSlider.value) / 100;
      this.settings.masterVolume = volume;
      volumeDisplay.textContent = `${volumeSlider.value}%`;
    });

    // Sound toggle
    const soundToggle = menu.querySelector('#sound-enabled') as HTMLInputElement;
    soundToggle.addEventListener('change', () => {
      this.settings.soundEnabled = soundToggle.checked;
    });

    // Quality select
    const qualitySelect = menu.querySelector('#quality') as HTMLSelectElement;
    qualitySelect.addEventListener('change', () => {
      this.settings.visualQuality = qualitySelect.value as GameSettings['visualQuality'];
    });

    // FPS toggle
    const fpsToggle = menu.querySelector('#show-fps') as HTMLInputElement;
    fpsToggle.addEventListener('change', () => {
      this.settings.showFPS = fpsToggle.checked;
    });

    // Map size select
    const mapSizeSelect = menu.querySelector('#map-size') as HTMLSelectElement;
    mapSizeSelect.addEventListener('change', () => {
      this.settings.mapSize = mapSizeSelect.value as GameSettings['mapSize'];
    });

    // Terrain select
    const terrainSelect = menu.querySelector('#terrain') as HTMLSelectElement;
    terrainSelect.addEventListener('change', () => {
      this.settings.terrain = terrainSelect.value as GameSettings['terrain'];
    });

    // Path complexity select
    const pathSelect = menu.querySelector('#path-complexity') as HTMLSelectElement;
    pathSelect.addEventListener('change', () => {
      this.settings.pathComplexity = pathSelect.value as GameSettings['pathComplexity'];
    });

    // Mobile controls (if on touch device)
    const mobileJoystickToggle = menu.querySelector('#mobile-joystick') as HTMLInputElement;
    if (mobileJoystickToggle) {
      mobileJoystickToggle.addEventListener('change', () => {
        this.settings.mobileJoystickEnabled = mobileJoystickToggle.checked;
      });
    }

    const hapticToggle = menu.querySelector('#haptic-feedback') as HTMLInputElement;
    if (hapticToggle) {
      hapticToggle.addEventListener('change', () => {
        this.settings.hapticFeedbackEnabled = hapticToggle.checked;
      });
    }

    const touchLayoutSelect = menu.querySelector('#touch-layout') as HTMLSelectElement;
    if (touchLayoutSelect) {
      touchLayoutSelect.addEventListener('change', () => {
        this.settings.touchControlsLayout = touchLayoutSelect.value as GameSettings['touchControlsLayout'];
      });
    }

    // Reset button
    menu.querySelector('#reset-btn')?.addEventListener('click', () => {
      this.settingsManager.resetToDefaults();
      this.settings = this.settingsManager.getSettings();
      this.container.remove();
      this.container = this.createMenu();
      document.body.appendChild(this.container);
    });

    // Close button
    menu.querySelector('#close-btn')?.addEventListener('click', () => {
      this.saveSettings();
      this.close();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.saveSettings();
        this.close();
      }
    });

    this.updateActivePreset(menu);
  }

  private updateDifficultyDescription(menu?: HTMLElement): void {
    const preset = DIFFICULTY_PRESETS[this.settings.difficulty];
    const descriptions = {
      CASUAL: `More currency (${preset.startingCurrency}), extra lives (${preset.startingLives}), weaker enemies`,
      NORMAL: `Balanced gameplay - ${preset.startingCurrency} currency, ${preset.startingLives} lives`,
      CHALLENGE: `Less currency (${preset.startingCurrency}), fewer lives (${preset.startingLives}), stronger enemies`
    };

    const element = menu || this.container;
    const descElement = element.querySelector('.difficulty-description');
    if (descElement) {
      descElement.textContent = descriptions[this.settings.difficulty];
    }
  }

  private updateActivePreset(menu?: HTMLElement): void {
    const element = menu || this.container;
    element.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active');
      if ((btn as HTMLElement).dataset.difficulty === this.settings.difficulty) {
        btn.classList.add('active');
      }
    });
  }

  private saveSettings(): void {
    this.settingsManager.updateSettings(this.settings);
  }

  private close(): void {
    this.container.remove();
    this.onClose?.();
  }

  public getSettings(): GameSettings {
    return this.settings;
  }
}