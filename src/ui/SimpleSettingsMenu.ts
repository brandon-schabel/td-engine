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
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: white;
      font-family: 'Arial', sans-serif;
      max-width: 500px;
      width: 90%;
    `;

    menu.innerHTML = `
      <h2 style="margin: 0 0 30px; text-align: center; color: #4CAF50;">Game Settings</h2>
      
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
        margin: 25px 0;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      
      .settings-section h3 {
        margin: 0 0 15px;
        color: #4CAF50;
        font-size: 18px;
      }
      
      .preset-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      
      .preset-btn {
        flex: 1;
        padding: 12px;
        border: 2px solid #444;
        background: #333;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
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
        font-size: 12px;
        color: #aaa;
        margin: 10px 0 0;
      }
      
      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 12px 0;
        gap: 15px;
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
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
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