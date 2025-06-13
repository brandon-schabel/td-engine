import type { GameConfiguration, ConfigurationPreset } from '../config/GameConfiguration';
import { CONFIGURATION_PRESETS, PRESET_METADATA } from '../config/ConfigurationPresets';
import { configurationValidator } from '../config/ConfigurationValidator';
import { configurationPersistence } from '../config/ConfigurationPersistence';
import { ConfigurationState } from './ConfigurationState';
import { TabManager, type TabManagerEvents } from './components/TabManager';
import { PresetSelector, type PresetSelectorEvents } from './components/PresetSelector';
import { MapSize, MAP_SIZE_PRESETS, BiomeType, DecorationLevel, type MapData } from '../types/MapData';
import { GameDifficulty, VictoryCondition, DefeatCondition, WaveScaling, AIDifficulty, AudioQuality, VisualQuality } from '../config/GameConfiguration';
import { EnemyType } from '../entities/Enemy';
import { PlayerUpgradeType } from '../entities/Player';

export class ConfigurationMenu {
  private container: HTMLDivElement;
  private currentConfig: GameConfiguration;
  private onConfigurationComplete: (config: GameConfiguration) => void;
  private activeTab: string = 'presets';
  private tabs: Map<string, HTMLDivElement> = new Map();
  private configState: ConfigurationState;
  private tabManager: TabManager | null = null;
  private presetSelector: PresetSelector | null = null;
  
  constructor(onComplete: (config: GameConfiguration) => void) {
    this.onConfigurationComplete = onComplete;
    this.currentConfig = CONFIGURATION_PRESETS.STANDARD();
    
    // Load previous configuration if available
    const saved = configurationPersistence.loadCurrentConfiguration();
    if (saved) {
      this.currentConfig = saved;
    }
    
    this.configState = new ConfigurationState(this.currentConfig);
    this.configState.addChangeListener((config) => {
      this.currentConfig = config;
      this.updateValidationStatus();
    });
    
    this.container = this.createMenuContainer();
    this.setupTabs();
    this.setupContent();
  }
  
  private createMenuContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'configuration-menu';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      color: white;
      overflow: hidden;
    `;
    
    return container;
  }
  
  private setupTabs(): void {
    const events: TabManagerEvents = {
      onTabChange: (tabId: string) => this.switchTab(tabId)
    };
    
    this.tabManager = new TabManager(this.container, events, this.activeTab);
  }
  
  private setupContent(): void {
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    contentContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    contentArea.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #0f0f0f;
    `;
    
    // Create action bar
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #1a1a1a;
      border-top: 2px solid #333;
      flex-shrink: 0;
    `;
    
    // Validation status
    const statusContainer = document.createElement('div');
    statusContainer.className = 'validation-status';
    statusContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    `;
    
    // Action buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
    `;
    
    const cancelButton = this.createButton('Cancel', 'secondary', () => {
      this.close();
    });
    
    const resetButton = this.createButton('Reset to Default', 'warning', () => {
      this.resetToDefault();
    });
    
    const startButton = this.createButton('Start Game', 'primary', () => {
      this.startGame();
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(resetButton);
    buttonContainer.appendChild(startButton);
    
    actionBar.appendChild(statusContainer);
    actionBar.appendChild(buttonContainer);
    
    contentContainer.appendChild(contentArea);
    contentContainer.appendChild(actionBar);
    this.container.appendChild(contentContainer);
    
    // Initialize with presets tab
    this.renderCurrentTab();
    this.updateValidationStatus();
  }
  
  private createButton(text: string, type: 'primary' | 'secondary' | 'warning', onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    
    const colors = {
      primary: { bg: '#4CAF50', hover: '#45a049' },
      secondary: { bg: '#666', hover: '#555' },
      warning: { bg: '#FF9800', hover: '#e68900' }
    };
    
    const color = colors[type];
    button.style.cssText = `
      padding: 10px 20px;
      background: ${color.bg};
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = color.hover;
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = color.bg;
    });
    
    return button;
  }
  
  private switchTab(tabId: string): void {
    if (this.activeTab === tabId) return;
    
    this.activeTab = tabId;
    this.renderCurrentTab();
  }
  
  private renderCurrentTab(): void {
    const contentArea = this.container.querySelector('.content-area') as HTMLDivElement;
    contentArea.innerHTML = '';
    
    switch (this.activeTab) {
      case 'presets':
        this.renderPresetsTab(contentArea);
        break;
      case 'map':
        this.renderMapTab(contentArea);
        break;
      case 'gameplay':
        this.renderGameplayTab(contentArea);
        break;
      case 'enemies':
        this.renderEnemiesTab(contentArea);
        break;
      case 'player':
        this.renderPlayerTab(contentArea);
        break;
      case 'audiovisual':
        this.renderAudioVisualTab(contentArea);
        break;
      case 'advanced':
        this.renderAdvancedTab(contentArea);
        break;
    }
  }
  
  private renderPresetsTab(container: HTMLDivElement): void {
    const events: PresetSelectorEvents = {
      onPresetSelected: (preset: ConfigurationPreset) => {
        this.currentConfig = CONFIGURATION_PRESETS[preset]();
        this.configState.setConfiguration(this.currentConfig);
        this.updateValidationStatus();
      },
      onConfigurationSaved: () => {
        this.saveCurrentConfiguration();
      },
      onConfigurationLoaded: (config: GameConfiguration) => {
        this.currentConfig = config;
        this.configState.setConfiguration(config);
        this.updateValidationStatus();
        // Update preset selector if this matches a known preset
        this.presetSelector?.setSelectedPreset(null); // Reset selection for custom config
      }
    };
    
    this.presetSelector = new PresetSelector(container, events);
  }
  
  private renderMapTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Map Configuration';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Customize the map generation settings to create your ideal battlefield. Changes are applied in real-time.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    container.appendChild(description);

    // Map Size Section
    const sizeSection = this.configState.createFormSection(
      'Map Size & Dimensions',
      'Choose the size of your battlefield. Larger maps offer more strategic depth but may impact performance.'
    );

    const mapSizeOptions = [
      { value: MapSize.SMALL, label: 'Small (20×15)', description: 'Quick matches, fast-paced action' },
      { value: MapSize.MEDIUM, label: 'Medium (30×22)', description: 'Balanced gameplay experience' },
      { value: MapSize.LARGE, label: 'Large (40×30)', description: 'Strategic depth, longer matches' },
      { value: MapSize.HUGE, label: 'Huge (50×38)', description: 'Epic battles, maximum strategy' }
    ];

    const sizeSelect = this.configState.createSelectDropdown(
      this.currentConfig.mapSettings.size,
      mapSizeOptions,
      (value) => this.configState.updateMapSettings({ size: value })
    );

    const sizeRow = this.configState.createFormRow(
      'Map Size',
      sizeSelect,
      'Larger maps provide more strategic options but require more processing power'
    );
    sizeSection.appendChild(sizeRow);

    // Custom size inputs (shown only for custom size)
    if (this.currentConfig.mapSettings.customSize) {
      const customWidthInput = this.configState.createNumberInput(
        this.currentConfig.mapSettings.customSize.width,
        10, 100, 1,
        (value) => {
          const customSize = this.currentConfig.mapSettings.customSize || { width: 30, height: 22 };
          this.configState.updateMapSettings({ customSize: { ...customSize, width: value } });
        }
      );

      const customHeightInput = this.configState.createNumberInput(
        this.currentConfig.mapSettings.customSize.height,
        8, 80, 1,
        (value) => {
          const customSize = this.currentConfig.mapSettings.customSize || { width: 30, height: 22 };
          this.configState.updateMapSettings({ customSize: { ...customSize, height: value } });
        }
      );

      const customWidthRow = this.configState.createFormRow('Custom Width', customWidthInput);
      const customHeightRow = this.configState.createFormRow('Custom Height', customHeightInput);
      sizeSection.appendChild(customWidthRow);
      sizeSection.appendChild(customHeightRow);
    }

    container.appendChild(sizeSection);

    // Biome Section
    const biomeSection = this.configState.createFormSection(
      'Environment & Biome',
      'Select the visual theme and environmental characteristics of your battlefield.'
    );

    const biomeOptions = [
      { value: 'RANDOM' as BiomeType | 'RANDOM', label: '🎲 Random', description: 'Surprise me!' },
      { value: BiomeType.FOREST, label: '🌲 Forest', description: 'Dense woodlands with natural cover' },
      { value: BiomeType.DESERT, label: '🏜️ Desert', description: 'Arid landscape with sand dunes' },
      { value: BiomeType.ARCTIC, label: '❄️ Arctic', description: 'Frozen tundra with ice formations' },
      { value: BiomeType.VOLCANIC, label: '🌋 Volcanic', description: 'Lava flows and rocky terrain' },
      { value: BiomeType.GRASSLAND, label: '🌾 Grassland', description: 'Open plains with rolling hills' }
    ];

    const biomeSelect = this.configState.createSelectDropdown(
      this.currentConfig.mapSettings.biome,
      biomeOptions,
      (value) => this.configState.updateMapSettings({ biome: value })
    );

    const biomeRow = this.configState.createFormRow(
      'Environment Type',
      biomeSelect,
      'Different biomes affect visual appearance and available decorations'
    );
    biomeSection.appendChild(biomeRow);

    container.appendChild(biomeSection);

    // Path Generation Section
    const pathSection = this.configState.createFormSection(
      'Path Generation',
      'Control how enemy paths are generated through your map.'
    );

    const complexitySlider = this.configState.createRangeSlider(
      this.currentConfig.mapSettings.pathComplexity,
      0, 1, 0.05,
      (value) => this.configState.updateMapSettings({ pathComplexity: value }),
      (value) => `${Math.round(value * 100)}%`
    );

    const complexityRow = this.configState.createFormRow(
      'Path Complexity',
      complexitySlider.container,
      'Higher complexity creates more winding paths with strategic opportunities'
    );
    pathSection.appendChild(complexityRow);

    const chokePointSlider = this.configState.createRangeSlider(
      this.currentConfig.mapSettings.chokePointMultiplier,
      0.5, 2.0, 0.1,
      (value) => this.configState.updateMapSettings({ chokePointMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const chokePointRow = this.configState.createFormRow(
      'Choke Points',
      chokePointSlider.container,
      'More choke points create strategic bottlenecks for tower placement'
    );
    pathSection.appendChild(chokePointRow);

    const openAreaSlider = this.configState.createRangeSlider(
      this.currentConfig.mapSettings.openAreaMultiplier,
      0.5, 2.0, 0.1,
      (value) => this.configState.updateMapSettings({ openAreaMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const openAreaRow = this.configState.createFormRow(
      'Open Areas',
      openAreaSlider.container,
      'Larger open areas provide more space for tower construction'
    );
    pathSection.appendChild(openAreaRow);

    container.appendChild(pathSection);

    // Visual Features Section
    const visualSection = this.configState.createFormSection(
      'Visual Features & Decorations',
      'Customize the visual richness and decorative elements of your map.'
    );

    const decorationOptions = [
      { value: DecorationLevel.MINIMAL, label: 'Minimal', description: 'Clean, performance-focused' },
      { value: DecorationLevel.MODERATE, label: 'Moderate', description: 'Balanced visual appeal' },
      { value: DecorationLevel.DENSE, label: 'Dense', description: 'Rich, detailed environment' }
    ];

    const decorationSelect = this.configState.createSelectDropdown(
      this.currentConfig.mapSettings.decorationLevel,
      decorationOptions,
      (value) => this.configState.updateMapSettings({ decorationLevel: value })
    );

    const decorationRow = this.configState.createFormRow(
      'Decoration Level',
      decorationSelect,
      'Higher decoration levels create more visually appealing maps but may impact performance'
    );
    visualSection.appendChild(decorationRow);

    const obstacleSlider = this.configState.createRangeSlider(
      this.currentConfig.mapSettings.obstacleCountMultiplier,
      0.5, 2.0, 0.1,
      (value) => this.configState.updateMapSettings({ obstacleCountMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const obstacleRow = this.configState.createFormRow(
      'Obstacle Density',
      obstacleSlider.container,
      'More obstacles create tactical barriers and visual interest'
    );
    visualSection.appendChild(obstacleRow);

    const heightSlider = this.configState.createRangeSlider(
      this.currentConfig.mapSettings.heightVariation,
      0, 1, 0.05,
      (value) => this.configState.updateMapSettings({ heightVariation: value }),
      (value) => `${Math.round(value * 100)}%`
    );

    const heightRow = this.configState.createFormRow(
      'Height Variation',
      heightSlider.container,
      'Terrain height differences create visual depth and tactical considerations'
    );
    visualSection.appendChild(heightRow);

    const waterCheckbox = this.configState.createCheckbox(
      this.currentConfig.mapSettings.enableWater,
      'Enable Water Features',
      (checked) => this.configState.updateMapSettings({ enableWater: checked })
    );

    const animationCheckbox = this.configState.createCheckbox(
      this.currentConfig.mapSettings.enableAnimations,
      'Enable Environmental Animations',
      (checked) => this.configState.updateMapSettings({ enableAnimations: checked })
    );

    visualSection.appendChild(waterCheckbox);
    visualSection.appendChild(animationCheckbox);

    container.appendChild(visualSection);

    // Map Generation Section
    const generationSection = this.configState.createFormSection(
      'Generation Settings',
      'Control how maps are generated and previewed.'
    );

    const seedInput = document.createElement('input');
    seedInput.type = 'text';
    seedInput.placeholder = 'Leave empty for random';
    seedInput.value = this.currentConfig.mapSettings.seed?.toString() || '';
    seedInput.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      color: white;
      padding: 8px;
      border-radius: 4px;
      width: 150px;
    `;

    seedInput.addEventListener('input', () => {
      const value = seedInput.value.trim();
      const seed = value ? parseInt(value) || undefined : undefined;
      this.configState.updateMapSettings({ seed });
    });

    const seedRow = this.configState.createFormRow(
      'Random Seed',
      seedInput,
      'Use the same seed to generate identical maps. Leave empty for random generation.'
    );
    generationSection.appendChild(seedRow);

    const previewCheckbox = this.configState.createCheckbox(
      this.currentConfig.mapSettings.generatePreview,
      'Generate Map Previews',
      (checked) => this.configState.updateMapSettings({ generatePreview: checked })
    );

    generationSection.appendChild(previewCheckbox);

    if (this.currentConfig.mapSettings.generatePreview) {
      const previewCountInput = this.configState.createNumberInput(
        this.currentConfig.mapSettings.previewCount,
        1, 10, 1,
        (value) => this.configState.updateMapSettings({ previewCount: value })
      );

      const previewCountRow = this.configState.createFormRow(
        'Preview Count',
        previewCountInput,
        'Number of map variants to generate for selection'
      );
      generationSection.appendChild(previewCountRow);
    }

    container.appendChild(generationSection);

    // Quick Actions Section
    const actionsSection = this.configState.createFormSection(
      'Quick Actions',
      'Convenient preset actions and map generation tools.'
    );

    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const randomizeButton = this.createButton('🎲 Randomize All', 'secondary', () => {
      // Randomize map settings
      const randomBiomes: (BiomeType | 'RANDOM')[] = ['RANDOM', BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC, BiomeType.GRASSLAND];
      const randomSizes = [MapSize.SMALL, MapSize.MEDIUM, MapSize.LARGE, MapSize.HUGE];
      const randomDecorations = [DecorationLevel.MINIMAL, DecorationLevel.MODERATE, DecorationLevel.DENSE];

      this.configState.updateMapSettings({
        size: randomSizes[Math.floor(Math.random() * randomSizes.length)],
        biome: randomBiomes[Math.floor(Math.random() * randomBiomes.length)],
        pathComplexity: 0.3 + Math.random() * 0.6,
        decorationLevel: randomDecorations[Math.floor(Math.random() * randomDecorations.length)],
        obstacleCountMultiplier: 0.7 + Math.random() * 1.0,
        chokePointMultiplier: 0.7 + Math.random() * 1.0,
        openAreaMultiplier: 0.7 + Math.random() * 1.0,
        heightVariation: Math.random() * 0.8,
        enableWater: Math.random() > 0.5,
        enableAnimations: Math.random() > 0.3,
        seed: Math.floor(Math.random() * 1000000)
      });
      this.renderCurrentTab(); // Refresh the display
    });

    const resetButton = this.createButton('↺ Reset to Default', 'warning', () => {
      const defaultConfig = CONFIGURATION_PRESETS.STANDARD();
      this.configState.updateMapSettings(defaultConfig.mapSettings);
      this.renderCurrentTab(); // Refresh the display
    });

    const performanceButton = this.createButton('⚡ Optimize for Performance', 'secondary', () => {
      this.configState.updateMapSettings({
        size: MapSize.SMALL,
        decorationLevel: DecorationLevel.MINIMAL,
        obstacleCountMultiplier: 0.7,
        heightVariation: 0.2,
        enableAnimations: false,
        enableWater: false
      });
      this.renderCurrentTab(); // Refresh the display
    });

    actionsContainer.appendChild(randomizeButton);
    actionsContainer.appendChild(resetButton);
    actionsContainer.appendChild(performanceButton);

    actionsSection.appendChild(actionsContainer);
    container.appendChild(actionsSection);

    // Map Preview Section
    if (this.currentConfig.mapSettings.generatePreview) {
      this.createMapPreviewSection(container);
    }
  }
  
  private renderGameplayTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Gameplay Settings';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Configure core gameplay mechanics, difficulty settings, and victory conditions to create your ideal tower defense experience.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    container.appendChild(description);

    // Difficulty Section
    const difficultySection = this.configState.createFormSection(
      'Overall Difficulty',
      'Set the baseline difficulty that affects multiple game systems.'
    );

    const difficultyOptions = [
      { value: GameDifficulty.BEGINNER, label: '🌱 Beginner', description: 'Perfect for learning' },
      { value: GameDifficulty.EASY, label: '😊 Easy', description: 'Relaxed gameplay' },
      { value: GameDifficulty.MEDIUM, label: '⚖️ Medium', description: 'Balanced challenge' },
      { value: GameDifficulty.HARD, label: '🔥 Hard', description: 'Serious challenge' },
      { value: GameDifficulty.EXTREME, label: '💀 Extreme', description: 'For veterans only' },
      { value: GameDifficulty.NIGHTMARE, label: '👹 Nightmare', description: 'Nearly impossible' },
      { value: GameDifficulty.CUSTOM, label: '🛠️ Custom', description: 'Custom difficulty' }
    ];

    const difficultySelect = this.configState.createSelectDropdown(
      this.currentConfig.gameplaySettings.overallDifficulty,
      difficultyOptions,
      (value) => this.configState.updateGameplaySettings({ overallDifficulty: value })
    );

    const difficultyRow = this.configState.createFormRow(
      'Difficulty Level',
      difficultySelect,
      'Overall difficulty affects enemy strength, resource generation, and other game systems'
    );
    difficultySection.appendChild(difficultyRow);

    container.appendChild(difficultySection);

    // Starting Resources Section
    const resourcesSection = this.configState.createFormSection(
      'Starting Resources',
      'Configure the resources players begin with and how they regenerate.'
    );

    const livesInput = this.configState.createNumberInput(
      this.currentConfig.gameplaySettings.startingLives,
      1, 50, 1,
      (value) => this.configState.updateGameplaySettings({ startingLives: value })
    );

    const livesRow = this.configState.createFormRow(
      'Starting Lives',
      livesInput,
      'Number of enemies that can reach the end before game over'
    );
    resourcesSection.appendChild(livesRow);

    const currencyInput = this.configState.createNumberInput(
      this.currentConfig.gameplaySettings.startingCurrency,
      10, 1000, 10,
      (value) => this.configState.updateGameplaySettings({ startingCurrency: value })
    );

    const currencyRow = this.configState.createFormRow(
      'Starting Currency',
      currencyInput,
      'Initial money available for building towers and upgrades'
    );
    resourcesSection.appendChild(currencyRow);

    const scoreInput = this.configState.createNumberInput(
      this.currentConfig.gameplaySettings.startingScore,
      0, 10000, 100,
      (value) => this.configState.updateGameplaySettings({ startingScore: value })
    );

    const scoreRow = this.configState.createFormRow(
      'Starting Score',
      scoreInput,
      'Initial score points (usually 0 for fresh start)'
    );
    resourcesSection.appendChild(scoreRow);

    container.appendChild(resourcesSection);

    // Economic Settings Section
    const economySection = this.configState.createFormSection(
      'Economic Settings',
      'Adjust resource generation rates and costs to balance gameplay.'
    );

    const resourceGenSlider = this.configState.createRangeSlider(
      this.currentConfig.gameplaySettings.resourceGenerationRate,
      0.1, 5.0, 0.1,
      (value) => this.configState.updateGameplaySettings({ resourceGenerationRate: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const resourceGenRow = this.configState.createFormRow(
      'Resource Generation Rate',
      resourceGenSlider.container,
      'How quickly you earn money from various sources'
    );
    economySection.appendChild(resourceGenRow);

    const towerCostSlider = this.configState.createRangeSlider(
      this.currentConfig.gameplaySettings.towerCostMultiplier,
      0.1, 3.0, 0.1,
      (value) => this.configState.updateGameplaySettings({ towerCostMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const towerCostRow = this.configState.createFormRow(
      'Tower Cost Multiplier',
      towerCostSlider.container,
      'Affects the price of building new towers'
    );
    economySection.appendChild(towerCostRow);

    const upgradeCostSlider = this.configState.createRangeSlider(
      this.currentConfig.gameplaySettings.upgradeCostMultiplier,
      0.1, 3.0, 0.1,
      (value) => this.configState.updateGameplaySettings({ upgradeCostMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const upgradeCostRow = this.configState.createFormRow(
      'Upgrade Cost Multiplier',
      upgradeCostSlider.container,
      'Affects the price of upgrading existing towers'
    );
    economySection.appendChild(upgradeCostRow);

    const enemyRewardSlider = this.configState.createRangeSlider(
      this.currentConfig.gameplaySettings.enemyRewardMultiplier,
      0.1, 5.0, 0.1,
      (value) => this.configState.updateGameplaySettings({ enemyRewardMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const enemyRewardRow = this.configState.createFormRow(
      'Enemy Reward Multiplier',
      enemyRewardSlider.container,
      'How much money you earn from defeating enemies'
    );
    economySection.appendChild(enemyRewardRow);

    container.appendChild(economySection);

    // Game Rules Section
    const rulesSection = this.configState.createFormSection(
      'Game Rules & Mechanics',
      'Configure special gameplay mechanics and quality-of-life features.'
    );

    const friendlyFireCheckbox = this.configState.createCheckbox(
      this.currentConfig.gameplaySettings.enableFriendlyFire,
      'Enable Friendly Fire',
      (checked) => this.configState.updateGameplaySettings({ enableFriendlyFire: checked })
    );

    const autoPauseCheckbox = this.configState.createCheckbox(
      this.currentConfig.gameplaySettings.autoPauseOnLowLives,
      'Auto-Pause on Low Lives',
      (checked) => this.configState.updateGameplaySettings({ autoPauseOnLowLives: checked })
    );

    rulesSection.appendChild(friendlyFireCheckbox);
    rulesSection.appendChild(autoPauseCheckbox);

    if (this.currentConfig.gameplaySettings.autoPauseOnLowLives) {
      const lowLivesInput = this.configState.createNumberInput(
        this.currentConfig.gameplaySettings.lowLivesThreshold,
        1, 10, 1,
        (value) => this.configState.updateGameplaySettings({ lowLivesThreshold: value })
      );

      const lowLivesRow = this.configState.createFormRow(
        'Low Lives Threshold',
        lowLivesInput,
        'Number of remaining lives that triggers auto-pause'
      );
      rulesSection.appendChild(lowLivesRow);
    }

    container.appendChild(rulesSection);

    // Victory Conditions Section
    const victorySection = this.configState.createFormSection(
      'Victory & Defeat Conditions',
      'Define how players can win or lose the game.'
    );

    const victoryOptions = [
      { value: VictoryCondition.SURVIVE_ALL_WAVES, label: '🌊 Survive All Waves', description: 'Complete all enemy waves' },
      { value: VictoryCondition.REACH_SCORE, label: '🎯 Reach Target Score', description: 'Achieve a specific score' },
      { value: VictoryCondition.SURVIVE_TIME, label: '⏱️ Survive Duration', description: 'Survive for a set time' },
      { value: VictoryCondition.KILL_COUNT, label: '💀 Kill Count', description: 'Defeat a certain number of enemies' }
    ];

    const victorySelect = this.configState.createSelectDropdown(
      this.currentConfig.gameplaySettings.victoryCondition,
      victoryOptions,
      (value) => this.configState.updateGameplaySettings({ victoryCondition: value })
    );

    const victoryRow = this.configState.createFormRow(
      'Victory Condition',
      victorySelect,
      'How the player can win the game'
    );
    victorySection.appendChild(victoryRow);

    // Show custom victory value input if needed
    if (this.currentConfig.gameplaySettings.victoryCondition === VictoryCondition.REACH_SCORE ||
        this.currentConfig.gameplaySettings.victoryCondition === VictoryCondition.SURVIVE_TIME ||
        this.currentConfig.gameplaySettings.victoryCondition === VictoryCondition.KILL_COUNT) {
      
      const customVictoryInput = this.configState.createNumberInput(
        this.currentConfig.gameplaySettings.customVictoryValue || 10000,
        1, 1000000, 100,
        (value) => this.configState.updateGameplaySettings({ customVictoryValue: value })
      );

      let label = 'Target Value';
      let tooltip = 'Custom victory condition value';
      
      switch (this.currentConfig.gameplaySettings.victoryCondition) {
        case VictoryCondition.REACH_SCORE:
          label = 'Target Score';
          tooltip = 'Score points needed to win';
          break;
        case VictoryCondition.SURVIVE_TIME:
          label = 'Survival Time (seconds)';
          tooltip = 'Time in seconds that must be survived';
          break;
        case VictoryCondition.KILL_COUNT:
          label = 'Enemies to Kill';
          tooltip = 'Number of enemies that must be defeated';
          break;
      }

      const customVictoryRow = this.configState.createFormRow(label, customVictoryInput, tooltip);
      victorySection.appendChild(customVictoryRow);
    }

    const defeatOptions = [
      { value: DefeatCondition.LOSE_ALL_LIVES, label: '💔 Lose All Lives', description: 'Standard tower defense defeat' },
      { value: DefeatCondition.TIME_LIMIT, label: '⏰ Time Limit', description: 'Game ends after set time' },
      { value: DefeatCondition.PLAYER_DEATH, label: '☠️ Player Death', description: 'Game ends if player dies' }
    ];

    const defeatSelect = this.configState.createSelectDropdown(
      this.currentConfig.gameplaySettings.defeatCondition,
      defeatOptions,
      (value) => this.configState.updateGameplaySettings({ defeatCondition: value })
    );

    const defeatRow = this.configState.createFormRow(
      'Defeat Condition',
      defeatSelect,
      'How the player can lose the game'
    );
    victorySection.appendChild(defeatRow);

    // Show custom defeat value input if needed
    if (this.currentConfig.gameplaySettings.defeatCondition === DefeatCondition.TIME_LIMIT) {
      const customDefeatInput = this.configState.createNumberInput(
        this.currentConfig.gameplaySettings.customDefeatValue || 300,
        30, 3600, 30,
        (value) => this.configState.updateGameplaySettings({ customDefeatValue: value })
      );

      const customDefeatRow = this.configState.createFormRow(
        'Time Limit (seconds)',
        customDefeatInput,
        'Maximum time allowed before automatic defeat'
      );
      victorySection.appendChild(customDefeatRow);
    }

    container.appendChild(victorySection);

    // Quick Actions Section
    const actionsSection = this.configState.createFormSection(
      'Quick Presets',
      'Apply common gameplay configurations with one click.'
    );

    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const casualButton = this.createButton('😌 Casual Mode', 'primary', () => {
      this.configState.updateGameplaySettings({
        overallDifficulty: GameDifficulty.EASY,
        startingLives: 20,
        startingCurrency: 200,
        resourceGenerationRate: 1.5,
        towerCostMultiplier: 0.8,
        enemyRewardMultiplier: 1.3,
        enableFriendlyFire: false,
        autoPauseOnLowLives: true,
        lowLivesThreshold: 5
      });
      this.renderCurrentTab();
    });

    const balancedButton = this.createButton('⚖️ Balanced', 'secondary', () => {
      const defaultConfig = CONFIGURATION_PRESETS.STANDARD();
      this.configState.updateGameplaySettings(defaultConfig.gameplaySettings);
      this.renderCurrentTab();
    });

    const hardcoreButton = this.createButton('🔥 Hardcore', 'warning', () => {
      this.configState.updateGameplaySettings({
        overallDifficulty: GameDifficulty.HARD,
        startingLives: 5,
        startingCurrency: 50,
        resourceGenerationRate: 0.7,
        towerCostMultiplier: 1.5,
        enemyRewardMultiplier: 0.8,
        enableFriendlyFire: true,
        autoPauseOnLowLives: false
      });
      this.renderCurrentTab();
    });

    actionsContainer.appendChild(casualButton);
    actionsContainer.appendChild(balancedButton);
    actionsContainer.appendChild(hardcoreButton);

    actionsSection.appendChild(actionsContainer);
    container.appendChild(actionsSection);
  }
  
  private renderEnemiesTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Enemy & Wave Configuration';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Configure enemy waves, AI behavior, and challenge scaling to create the perfect opposition for your tower defense experience.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    container.appendChild(description);

    // Wave Configuration Section
    const waveSection = this.configState.createFormSection(
      'Wave Configuration',
      'Control the number of waves and how they are delivered to the player.'
    );

    const waveCountInput = this.configState.createNumberInput(
      this.currentConfig.enemySettings.waveCount,
      3, 50, 1,
      (value) => this.configState.updateEnemySettings({ waveCount: value })
    );

    const waveCountRow = this.configState.createFormRow(
      'Total Wave Count',
      waveCountInput,
      'Number of enemy waves that must be completed to win'
    );
    waveSection.appendChild(waveCountRow);

    const waveScalingOptions = [
      { value: WaveScaling.LINEAR, label: '📈 Linear', description: 'Steady, predictable increase' },
      { value: WaveScaling.EXPONENTIAL, label: '🚀 Exponential', description: 'Rapidly increasing challenge' },
      { value: WaveScaling.LOGARITHMIC, label: '📉 Logarithmic', description: 'Fast start, levels off later' },
      { value: WaveScaling.CUSTOM, label: '🛠️ Custom', description: 'Custom scaling pattern' }
    ];

    const scalingSelect = this.configState.createSelectDropdown(
      this.currentConfig.enemySettings.waveIntensityScaling,
      waveScalingOptions,
      (value) => this.configState.updateEnemySettings({ waveIntensityScaling: value })
    );

    const scalingRow = this.configState.createFormRow(
      'Wave Intensity Scaling',
      scalingSelect,
      'How difficulty increases across waves'
    );
    waveSection.appendChild(scalingRow);

    const delayInput = this.configState.createNumberInput(
      this.currentConfig.enemySettings.betweenWaveDelay,
      0.5, 30, 0.5,
      (value) => this.configState.updateEnemySettings({ betweenWaveDelay: value })
    );

    const delayRow = this.configState.createFormRow(
      'Between Wave Delay (seconds)',
      delayInput,
      'Rest time between waves for player preparation'
    );
    waveSection.appendChild(delayRow);

    const autoStartCheckbox = this.configState.createCheckbox(
      this.currentConfig.enemySettings.autoStartWaves,
      'Auto-Start Next Wave',
      (checked) => this.configState.updateEnemySettings({ autoStartWaves: checked })
    );

    waveSection.appendChild(autoStartCheckbox);

    container.appendChild(waveSection);

    // AI Behavior Section
    const aiSection = this.configState.createFormSection(
      'AI Behavior & Difficulty',
      'Configure how intelligent and challenging enemy AI should be.'
    );

    const aiDifficultyOptions = [
      { value: AIDifficulty.PASSIVE, label: '😴 Passive', description: 'Basic pathing, predictable' },
      { value: AIDifficulty.NORMAL, label: '🚶 Normal', description: 'Standard AI behavior' },
      { value: AIDifficulty.AGGRESSIVE, label: '😡 Aggressive', description: 'More intelligent behavior' },
      { value: AIDifficulty.ADAPTIVE, label: '🧠 Adaptive', description: 'Learns from player actions' },
      { value: AIDifficulty.PREDICTIVE, label: '🔮 Predictive', description: 'Anticipates player moves' }
    ];

    const aiSelect = this.configState.createSelectDropdown(
      this.currentConfig.enemySettings.aiDifficulty,
      aiDifficultyOptions,
      (value) => this.configState.updateEnemySettings({ aiDifficulty: value })
    );

    const aiRow = this.configState.createFormRow(
      'AI Difficulty',
      aiSelect,
      'Intelligence level of enemy pathing and behavior'
    );
    aiSection.appendChild(aiRow);

    container.appendChild(aiSection);

    // Enemy Stats Section
    const statsSection = this.configState.createFormSection(
      'Enemy Statistics',
      'Adjust global multipliers for enemy attributes to fine-tune difficulty.'
    );

    const speedSlider = this.configState.createRangeSlider(
      this.currentConfig.enemySettings.enemySpeedMultiplier,
      0.1, 3.0, 0.1,
      (value) => this.configState.updateEnemySettings({ enemySpeedMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const speedRow = this.configState.createFormRow(
      'Enemy Speed Multiplier',
      speedSlider.container,
      'How fast enemies move along their paths'
    );
    statsSection.appendChild(speedRow);

    const healthSlider = this.configState.createRangeSlider(
      this.currentConfig.enemySettings.enemyHealthMultiplier,
      0.1, 5.0, 0.1,
      (value) => this.configState.updateEnemySettings({ enemyHealthMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const healthRow = this.configState.createFormRow(
      'Enemy Health Multiplier',
      healthSlider.container,
      'How much damage enemies can take before dying'
    );
    statsSection.appendChild(healthRow);

    const damageSlider = this.configState.createRangeSlider(
      this.currentConfig.enemySettings.enemyDamageMultiplier,
      0.1, 3.0, 0.1,
      (value) => this.configState.updateEnemySettings({ enemyDamageMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const damageRow = this.configState.createFormRow(
      'Enemy Damage Multiplier',
      damageSlider.container,
      'How much damage enemies deal when reaching the end'
    );
    statsSection.appendChild(damageRow);

    const spawnRateSlider = this.configState.createRangeSlider(
      this.currentConfig.enemySettings.spawnRateMultiplier,
      0.1, 3.0, 0.1,
      (value) => this.configState.updateEnemySettings({ spawnRateMultiplier: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const spawnRateRow = this.configState.createFormRow(
      'Spawn Rate Multiplier',
      spawnRateSlider.container,
      'How quickly enemies spawn within each wave'
    );
    statsSection.appendChild(spawnRateRow);

    container.appendChild(statsSection);

    // Boss Enemies Section
    const bossSection = this.configState.createFormSection(
      'Boss Enemies',
      'Configure powerful boss enemies that appear at key moments.'
    );

    const enableBossCheckbox = this.configState.createCheckbox(
      this.currentConfig.enemySettings.enableBossEnemies,
      'Enable Boss Enemies',
      (checked) => this.configState.updateEnemySettings({ enableBossEnemies: checked })
    );

    bossSection.appendChild(enableBossCheckbox);

    if (this.currentConfig.enemySettings.enableBossEnemies) {
      const bossFrequencyInput = this.configState.createNumberInput(
        this.currentConfig.enemySettings.bossFrequency,
        1, 10, 1,
        (value) => this.configState.updateEnemySettings({ bossFrequency: value })
      );

      const bossFrequencyRow = this.configState.createFormRow(
        'Boss Frequency (every N waves)',
        bossFrequencyInput,
        'Boss enemies appear every N waves'
      );
      bossSection.appendChild(bossFrequencyRow);

      const bossHealthSlider = this.configState.createRangeSlider(
        this.currentConfig.enemySettings.bossHealthMultiplier,
        1.0, 10.0, 0.5,
        (value) => this.configState.updateEnemySettings({ bossHealthMultiplier: value }),
        (value) => `${value.toFixed(1)}x`
      );

      const bossHealthRow = this.configState.createFormRow(
        'Boss Health Multiplier',
        bossHealthSlider.container,
        'How much stronger boss enemies are compared to normal enemies'
      );
      bossSection.appendChild(bossHealthRow);
    }

    container.appendChild(bossSection);

    // Enemy Types Section
    const typesSection = this.configState.createFormSection(
      'Enemy Types',
      'Choose which enemy types can appear in your game.'
    );

    const enemyTypes = [
      { type: EnemyType.BASIC, name: '🔵 Basic Enemy', description: 'Standard balanced enemy' },
      { type: EnemyType.FAST, name: '💨 Fast Enemy', description: 'Quick but fragile' },
      { type: EnemyType.TANK, name: '🛡️ Tank Enemy', description: 'Slow but extremely durable' }
    ];

    enemyTypes.forEach(({ type, name, description }) => {
      const isEnabled = this.currentConfig.enemySettings.enabledEnemyTypes.includes(type);
      
      const checkbox = this.configState.createCheckbox(
        isEnabled,
        `${name} - ${description}`,
        (checked) => {
          const currentTypes = [...this.currentConfig.enemySettings.enabledEnemyTypes];
          if (checked && !currentTypes.includes(type)) {
            currentTypes.push(type);
          } else if (!checked) {
            const index = currentTypes.indexOf(type);
            if (index !== -1) {
              currentTypes.splice(index, 1);
            }
          }
          this.configState.updateEnemySettings({ enabledEnemyTypes: currentTypes });
        }
      );
      
      typesSection.appendChild(checkbox);
    });

    container.appendChild(typesSection);

    // Special Abilities Section
    const abilitiesSection = this.configState.createFormSection(
      'Special Abilities',
      'Configure special abilities that enemies can use.'
    );

    const enableAbilitiesCheckbox = this.configState.createCheckbox(
      this.currentConfig.enemySettings.enableEnemyAbilities,
      'Enable Enemy Special Abilities',
      (checked) => this.configState.updateEnemySettings({ enableEnemyAbilities: checked })
    );

    abilitiesSection.appendChild(enableAbilitiesCheckbox);

    if (this.currentConfig.enemySettings.enableEnemyAbilities) {
      const abilityFrequencySlider = this.configState.createRangeSlider(
        this.currentConfig.enemySettings.abilityFrequency,
        0, 1, 0.05,
        (value) => this.configState.updateEnemySettings({ abilityFrequency: value }),
        (value) => `${Math.round(value * 100)}%`
      );

      const abilityFrequencyRow = this.configState.createFormRow(
        'Ability Usage Frequency',
        abilityFrequencySlider.container,
        'Percentage chance that an enemy will have special abilities'
      );
      abilitiesSection.appendChild(abilityFrequencyRow);
    }

    container.appendChild(abilitiesSection);

    // Quick Presets Section
    const presetsSection = this.configState.createFormSection(
      'Quick Presets',
      'Apply common enemy configurations with one click.'
    );

    const presetsContainer = document.createElement('div');
    presetsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const relaxedButton = this.createButton('😌 Relaxed', 'primary', () => {
      this.configState.updateEnemySettings({
        waveCount: 8,
        waveIntensityScaling: WaveScaling.LINEAR,
        betweenWaveDelay: 5,
        autoStartWaves: false,
        aiDifficulty: AIDifficulty.PASSIVE,
        enemySpeedMultiplier: 0.7,
        enemyHealthMultiplier: 0.8,
        enemyDamageMultiplier: 0.8,
        spawnRateMultiplier: 0.8,
        enableBossEnemies: false,
        enableEnemyAbilities: false
      });
      this.renderCurrentTab();
    });

    const standardButton = this.createButton('⚖️ Standard', 'secondary', () => {
      const defaultConfig = CONFIGURATION_PRESETS.STANDARD();
      this.configState.updateEnemySettings(defaultConfig.enemySettings);
      this.renderCurrentTab();
    });

    const intenseButton = this.createButton('🔥 Intense', 'warning', () => {
      this.configState.updateEnemySettings({
        waveCount: 15,
        waveIntensityScaling: WaveScaling.EXPONENTIAL,
        betweenWaveDelay: 2,
        autoStartWaves: true,
        aiDifficulty: AIDifficulty.AGGRESSIVE,
        enemySpeedMultiplier: 1.3,
        enemyHealthMultiplier: 1.5,
        enemyDamageMultiplier: 1.2,
        spawnRateMultiplier: 1.4,
        enableBossEnemies: true,
        bossFrequency: 3,
        bossHealthMultiplier: 5.0,
        enableEnemyAbilities: true,
        abilityFrequency: 0.4
      });
      this.renderCurrentTab();
    });

    const chaosButton = this.createButton('🎲 Chaos Mode', 'secondary', () => {
      // Randomize enemy settings
      const waveScalings = [WaveScaling.LINEAR, WaveScaling.EXPONENTIAL, WaveScaling.LOGARITHMIC];
      const aiDifficulties = [AIDifficulty.PASSIVE, AIDifficulty.NORMAL, AIDifficulty.AGGRESSIVE];
      
      this.configState.updateEnemySettings({
        waveCount: 8 + Math.floor(Math.random() * 12),
        waveIntensityScaling: waveScalings[Math.floor(Math.random() * waveScalings.length)],
        betweenWaveDelay: 1 + Math.random() * 8,
        autoStartWaves: Math.random() > 0.5,
        aiDifficulty: aiDifficulties[Math.floor(Math.random() * aiDifficulties.length)],
        enemySpeedMultiplier: 0.5 + Math.random() * 2.0,
        enemyHealthMultiplier: 0.5 + Math.random() * 3.0,
        enemyDamageMultiplier: 0.5 + Math.random() * 1.5,
        spawnRateMultiplier: 0.5 + Math.random() * 2.0,
        enableBossEnemies: Math.random() > 0.3,
        bossFrequency: 2 + Math.floor(Math.random() * 6),
        bossHealthMultiplier: 2.0 + Math.random() * 6.0,
        enableEnemyAbilities: Math.random() > 0.4,
        abilityFrequency: Math.random() * 0.8
      });
      this.renderCurrentTab();
    });

    presetsContainer.appendChild(relaxedButton);
    presetsContainer.appendChild(standardButton);
    presetsContainer.appendChild(intenseButton);
    presetsContainer.appendChild(chaosButton);

    presetsSection.appendChild(presetsContainer);
    container.appendChild(presetsSection);
  }
  
  private renderPlayerTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Player Configuration';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Customize player stats, abilities, and progression to create your ideal player character build.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    container.appendChild(description);

    // Starting Stats Section
    const statsSection = this.configState.createFormSection(
      'Starting Statistics',
      'Configure the initial capabilities of your player character.'
    );

    const healthInput = this.configState.createNumberInput(
      this.currentConfig.playerSettings.startingHealth,
      25, 500, 25,
      (value) => this.configState.updatePlayerSettings({ startingHealth: value })
    );

    const healthRow = this.configState.createFormRow(
      'Starting Health Points',
      healthInput,
      'Player health at the beginning of the game'
    );
    statsSection.appendChild(healthRow);

    const speedSlider = this.configState.createRangeSlider(
      this.currentConfig.playerSettings.startingSpeed,
      25, 300, 5,
      (value) => this.configState.updatePlayerSettings({ startingSpeed: value }),
      (value) => `${value}%`
    );

    const speedRow = this.configState.createFormRow(
      'Starting Speed',
      speedSlider.container,
      'Player movement speed as percentage of default speed'
    );
    statsSection.appendChild(speedRow);

    const damageSlider = this.configState.createRangeSlider(
      this.currentConfig.playerSettings.startingDamage,
      25, 300, 5,
      (value) => this.configState.updatePlayerSettings({ startingDamage: value }),
      (value) => `${value}%`
    );

    const damageRow = this.configState.createFormRow(
      'Starting Damage',
      damageSlider.container,
      'Player damage output as percentage of default damage'
    );
    statsSection.appendChild(damageRow);

    const fireRateSlider = this.configState.createRangeSlider(
      this.currentConfig.playerSettings.startingFireRate,
      25, 300, 5,
      (value) => this.configState.updatePlayerSettings({ startingFireRate: value }),
      (value) => `${value}%`
    );

    const fireRateRow = this.configState.createFormRow(
      'Starting Fire Rate',
      fireRateSlider.container,
      'How quickly the player can shoot projectiles'
    );
    statsSection.appendChild(fireRateRow);

    container.appendChild(statsSection);

    // Progression System Section
    const progressionSection = this.configState.createFormSection(
      'Character Progression',
      'Control how the player character gains experience and upgrade points.'
    );

    const upgradePointsInput = this.configState.createNumberInput(
      this.currentConfig.playerSettings.upgradePointsPerLevel,
      1, 10, 1,
      (value) => this.configState.updatePlayerSettings({ upgradePointsPerLevel: value })
    );

    const upgradePointsRow = this.configState.createFormRow(
      'Upgrade Points per Level',
      upgradePointsInput,
      'How many upgrade points are gained with each level up'
    );
    progressionSection.appendChild(upgradePointsRow);

    const experienceSlider = this.configState.createRangeSlider(
      this.currentConfig.playerSettings.experienceGainRate,
      0.1, 5.0, 0.1,
      (value) => this.configState.updatePlayerSettings({ experienceGainRate: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const experienceRow = this.configState.createFormRow(
      'Experience Gain Rate',
      experienceSlider.container,
      'How quickly the player gains experience and levels up'
    );
    progressionSection.appendChild(experienceRow);

    container.appendChild(progressionSection);

    // Upgrade Limits Section
    const limitsSection = this.configState.createFormSection(
      'Upgrade Limits',
      'Set the maximum level for each type of player upgrade.'
    );

    const upgradeTypes = [
      { type: PlayerUpgradeType.DAMAGE, name: '⚔️ Damage', description: 'Maximum damage upgrade level' },
      { type: PlayerUpgradeType.SPEED, name: '💨 Speed', description: 'Maximum speed upgrade level' },
      { type: PlayerUpgradeType.FIRE_RATE, name: '🔫 Fire Rate', description: 'Maximum fire rate upgrade level' },
      { type: PlayerUpgradeType.HEALTH, name: '❤️ Health', description: 'Maximum health upgrade level' },
      { type: PlayerUpgradeType.REGENERATION, name: '🔄 Regeneration', description: 'Maximum regeneration upgrade level' }
    ];

    upgradeTypes.forEach(({ type, name, description }) => {
      const maxLevel = this.currentConfig.playerSettings.maxUpgradeLevels[type] || 5;
      
      const levelInput = this.configState.createNumberInput(
        maxLevel,
        1, 20, 1,
        (value) => {
          const newLevels = { ...this.currentConfig.playerSettings.maxUpgradeLevels };
          newLevels[type] = value;
          this.configState.updatePlayerSettings({ maxUpgradeLevels: newLevels });
        }
      );

      const levelRow = this.configState.createFormRow(
        name,
        levelInput,
        description
      );
      limitsSection.appendChild(levelRow);
    });

    container.appendChild(limitsSection);

    // Special Abilities Section
    const abilitiesSection = this.configState.createFormSection(
      'Special Abilities',
      'Configure special abilities and their properties.'
    );

    const dashCheckbox = this.configState.createCheckbox(
      this.currentConfig.playerSettings.enableDashAbility,
      'Enable Dash Ability',
      (checked) => this.configState.updatePlayerSettings({ enableDashAbility: checked })
    );

    abilitiesSection.appendChild(dashCheckbox);

    if (this.currentConfig.playerSettings.enableDashAbility) {
      const dashCooldownInput = this.configState.createNumberInput(
        this.currentConfig.playerSettings.dashCooldown,
        500, 10000, 500,
        (value) => this.configState.updatePlayerSettings({ dashCooldown: value })
      );

      const dashCooldownRow = this.configState.createFormRow(
        'Dash Cooldown (milliseconds)',
        dashCooldownInput,
        'Time between dash ability uses'
      );
      abilitiesSection.appendChild(dashCooldownRow);
    }

    const shieldCheckbox = this.configState.createCheckbox(
      this.currentConfig.playerSettings.enableShieldAbility,
      'Enable Shield Ability',
      (checked) => this.configState.updatePlayerSettings({ enableShieldAbility: checked })
    );

    abilitiesSection.appendChild(shieldCheckbox);

    if (this.currentConfig.playerSettings.enableShieldAbility) {
      const shieldDurationInput = this.configState.createNumberInput(
        this.currentConfig.playerSettings.shieldDuration,
        1000, 10000, 500,
        (value) => this.configState.updatePlayerSettings({ shieldDuration: value })
      );

      const shieldDurationRow = this.configState.createFormRow(
        'Shield Duration (milliseconds)',
        shieldDurationInput,
        'How long the shield ability lasts'
      );
      abilitiesSection.appendChild(shieldDurationRow);
    }

    container.appendChild(abilitiesSection);

    // Health Regeneration Section
    const regenSection = this.configState.createFormSection(
      'Health Regeneration',
      'Configure automatic health recovery over time.'
    );

    const regenCheckbox = this.configState.createCheckbox(
      this.currentConfig.playerSettings.enableAutoRegeneration,
      'Enable Auto-Regeneration',
      (checked) => this.configState.updatePlayerSettings({ enableAutoRegeneration: checked })
    );

    regenSection.appendChild(regenCheckbox);

    if (this.currentConfig.playerSettings.enableAutoRegeneration) {
      const regenRateInput = this.configState.createNumberInput(
        this.currentConfig.playerSettings.regenRate,
        1, 20, 1,
        (value) => this.configState.updatePlayerSettings({ regenRate: value })
      );

      const regenRateRow = this.configState.createFormRow(
        'Regeneration Rate (HP per second)',
        regenRateInput,
        'How much health is recovered per second'
      );
      regenSection.appendChild(regenRateRow);

      const regenDelayInput = this.configState.createNumberInput(
        this.currentConfig.playerSettings.regenDelay,
        1000, 30000, 1000,
        (value) => this.configState.updatePlayerSettings({ regenDelay: value })
      );

      const regenDelayRow = this.configState.createFormRow(
        'Regeneration Delay (milliseconds)',
        regenDelayInput,
        'Time after taking damage before regeneration starts'
      );
      regenSection.appendChild(regenDelayRow);
    }

    container.appendChild(regenSection);

    // Movement & Controls Section
    const controlsSection = this.configState.createFormSection(
      'Movement & Controls',
      'Fine-tune player movement and control sensitivity.'
    );

    const accelerationSlider = this.configState.createRangeSlider(
      this.currentConfig.playerSettings.movementAcceleration,
      0.1, 3.0, 0.1,
      (value) => this.configState.updatePlayerSettings({ movementAcceleration: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const accelerationRow = this.configState.createFormRow(
      'Movement Acceleration',
      accelerationSlider.container,
      'How quickly the player reaches full movement speed'
    );
    controlsSection.appendChild(accelerationRow);

    const sensitivitySlider = this.configState.createRangeSlider(
      this.currentConfig.playerSettings.mouseControlSensitivity,
      0.1, 3.0, 0.1,
      (value) => this.configState.updatePlayerSettings({ mouseControlSensitivity: value }),
      (value) => `${value.toFixed(1)}x`
    );

    const sensitivityRow = this.configState.createFormRow(
      'Mouse Sensitivity',
      sensitivitySlider.container,
      'Sensitivity of mouse controls (if mouse movement is enabled)'
    );
    controlsSection.appendChild(sensitivityRow);

    container.appendChild(controlsSection);

    // Quick Presets Section
    const presetsSection = this.configState.createFormSection(
      'Character Presets',
      'Apply common player build configurations with one click.'
    );

    const presetsContainer = document.createElement('div');
    presetsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const speedsterButton = this.createButton('💨 Speedster', 'primary', () => {
      this.configState.updatePlayerSettings({
        startingHealth: 75,
        startingSpeed: 200,
        startingDamage: 90,
        startingFireRate: 150,
        upgradePointsPerLevel: 2,
        experienceGainRate: 1.3,
        enableDashAbility: true,
        dashCooldown: 2000,
        enableShieldAbility: false,
        enableAutoRegeneration: true,
        regenRate: 3,
        regenDelay: 3000,
        movementAcceleration: 2.0,
        mouseControlSensitivity: 1.5
      });
      this.renderCurrentTab();
    });

    const tankButton = this.createButton('🛡️ Tank', 'secondary', () => {
      this.configState.updatePlayerSettings({
        startingHealth: 200,
        startingSpeed: 75,
        startingDamage: 120,
        startingFireRate: 80,
        upgradePointsPerLevel: 3,
        experienceGainRate: 0.8,
        enableDashAbility: false,
        enableShieldAbility: true,
        shieldDuration: 5000,
        enableAutoRegeneration: true,
        regenRate: 5,
        regenDelay: 8000,
        movementAcceleration: 0.5,
        mouseControlSensitivity: 0.8
      });
      this.renderCurrentTab();
    });

    const glasCannonButton = this.createButton('⚔️ Glass Cannon', 'warning', () => {
      this.configState.updatePlayerSettings({
        startingHealth: 50,
        startingSpeed: 120,
        startingDamage: 200,
        startingFireRate: 200,
        upgradePointsPerLevel: 2,
        experienceGainRate: 1.5,
        enableDashAbility: true,
        dashCooldown: 1500,
        enableShieldAbility: false,
        enableAutoRegeneration: false,
        movementAcceleration: 1.5,
        mouseControlSensitivity: 1.2
      });
      this.renderCurrentTab();
    });

    const balancedButton = this.createButton('⚖️ Balanced', 'secondary', () => {
      const defaultConfig = CONFIGURATION_PRESETS.STANDARD();
      this.configState.updatePlayerSettings(defaultConfig.playerSettings);
      this.renderCurrentTab();
    });

    presetsContainer.appendChild(speedsterButton);
    presetsContainer.appendChild(tankButton);
    presetsContainer.appendChild(glasCannonButton);
    presetsContainer.appendChild(balancedButton);

    presetsSection.appendChild(presetsContainer);
    container.appendChild(presetsSection);
  }
  
  private renderAudioVisualTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Audio & Visual Settings';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Configure audio levels, visual quality, and effects to optimize your gaming experience for your device and preferences.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    container.appendChild(description);

    // Audio Settings Section
    const audioSection = this.configState.createFormSection(
      'Audio Settings',
      'Control volume levels and audio quality for different sound categories.'
    );

    const masterVolumeSlider = this.configState.createRangeSlider(
      this.currentConfig.audioVisualSettings.masterVolume,
      0, 100, 5,
      (value) => this.configState.updateAudioVisualSettings({ masterVolume: value }),
      (value) => `${value}%`
    );

    const masterVolumeRow = this.configState.createFormRow(
      'Master Volume',
      masterVolumeSlider.container,
      'Overall volume control for all game audio'
    );
    audioSection.appendChild(masterVolumeRow);

    const musicVolumeSlider = this.configState.createRangeSlider(
      this.currentConfig.audioVisualSettings.musicVolume,
      0, 100, 5,
      (value) => this.configState.updateAudioVisualSettings({ musicVolume: value }),
      (value) => `${value}%`
    );

    const musicVolumeRow = this.configState.createFormRow(
      'Music Volume',
      musicVolumeSlider.container,
      'Background music and ambient audio volume'
    );
    audioSection.appendChild(musicVolumeRow);

    const sfxVolumeSlider = this.configState.createRangeSlider(
      this.currentConfig.audioVisualSettings.sfxVolume,
      0, 100, 5,
      (value) => this.configState.updateAudioVisualSettings({ sfxVolume: value }),
      (value) => `${value}%`
    );

    const sfxVolumeRow = this.configState.createFormRow(
      'Sound Effects Volume',
      sfxVolumeSlider.container,
      'Game sounds like shooting, explosions, and UI interactions'
    );
    audioSection.appendChild(sfxVolumeRow);

    const voiceVolumeSlider = this.configState.createRangeSlider(
      this.currentConfig.audioVisualSettings.voiceVolume,
      0, 100, 5,
      (value) => this.configState.updateAudioVisualSettings({ voiceVolume: value }),
      (value) => `${value}%`
    );

    const voiceVolumeRow = this.configState.createFormRow(
      'Voice Volume',
      voiceVolumeSlider.container,
      'Narrator, announcements, and character voice lines'
    );
    audioSection.appendChild(voiceVolumeRow);

    const audioQualityOptions = [
      { value: AudioQuality.LOW, label: 'Low', description: 'Reduced quality for performance' },
      { value: AudioQuality.MEDIUM, label: 'Medium', description: 'Balanced quality and performance' },
      { value: AudioQuality.HIGH, label: 'High', description: 'High quality audio' },
      { value: AudioQuality.ULTRA, label: 'Ultra', description: 'Maximum audio fidelity' }
    ];

    const audioQualitySelect = this.configState.createSelectDropdown(
      this.currentConfig.audioVisualSettings.audioQuality,
      audioQualityOptions,
      (value) => this.configState.updateAudioVisualSettings({ audioQuality: value })
    );

    const audioQualityRow = this.configState.createFormRow(
      'Audio Quality',
      audioQualitySelect,
      'Overall audio processing quality and effects'
    );
    audioSection.appendChild(audioQualityRow);

    container.appendChild(audioSection);

    // Visual Quality Section
    const visualSection = this.configState.createFormSection(
      'Visual Quality & Performance',
      'Adjust visual settings to balance appearance and performance.'
    );

    const qualityPresetOptions = [
      { value: VisualQuality.LOW, label: 'Low', description: 'Maximum performance, minimal effects' },
      { value: VisualQuality.MEDIUM, label: 'Medium', description: 'Balanced visuals and performance' },
      { value: VisualQuality.HIGH, label: 'High', description: 'Enhanced visuals, good performance' },
      { value: VisualQuality.ULTRA, label: 'Ultra', description: 'Maximum visual quality' }
    ];

    const qualityPresetSelect = this.configState.createSelectDropdown(
      this.currentConfig.audioVisualSettings.qualityPreset,
      qualityPresetOptions,
      (value) => this.configState.updateAudioVisualSettings({ qualityPreset: value })
    );

    const qualityPresetRow = this.configState.createFormRow(
      'Overall Quality Preset',
      qualityPresetSelect,
      'Quick setting that affects multiple visual options'
    );
    visualSection.appendChild(qualityPresetRow);

    const textureQualitySelect = this.configState.createSelectDropdown(
      this.currentConfig.audioVisualSettings.textureQuality,
      qualityPresetOptions,
      (value) => this.configState.updateAudioVisualSettings({ textureQuality: value })
    );

    const textureQualityRow = this.configState.createFormRow(
      'Texture Quality',
      textureQualitySelect,
      'Resolution and detail level of game textures'
    );
    visualSection.appendChild(textureQualityRow);

    const particleDensitySelect = this.configState.createSelectDropdown(
      this.currentConfig.audioVisualSettings.particleDensity,
      qualityPresetOptions,
      (value) => this.configState.updateAudioVisualSettings({ particleDensity: value })
    );

    const particleDensityRow = this.configState.createFormRow(
      'Particle Effects Density',
      particleDensitySelect,
      'Number and complexity of particle effects like explosions and magic'
    );
    visualSection.appendChild(particleDensityRow);

    const fpsOptions = [
      { value: 30, label: '30 FPS', description: 'Lower performance requirement' },
      { value: 60, label: '60 FPS', description: 'Smooth standard gameplay' },
      { value: 120, label: '120 FPS', description: 'High refresh rate displays' },
      { value: 0, label: 'Unlimited', description: 'No FPS limit (uses more power)' }
    ];

    const fpsSelect = this.configState.createSelectDropdown(
      this.currentConfig.audioVisualSettings.targetFPS,
      fpsOptions,
      (value) => this.configState.updateAudioVisualSettings({ targetFPS: value })
    );

    const fpsRow = this.configState.createFormRow(
      'Target Frame Rate',
      fpsSelect,
      'Maximum frames per second the game will try to achieve'
    );
    visualSection.appendChild(fpsRow);

    const vsyncCheckbox = this.configState.createCheckbox(
      this.currentConfig.audioVisualSettings.enableVSync,
      'Enable VSync',
      (checked) => this.configState.updateAudioVisualSettings({ enableVSync: checked })
    );

    visualSection.appendChild(vsyncCheckbox);

    container.appendChild(visualSection);

    // Visual Effects Section
    const effectsSection = this.configState.createFormSection(
      'Visual Effects',
      'Enable or disable specific visual effects and enhancements.'
    );

    const screenShakeCheckbox = this.configState.createCheckbox(
      this.currentConfig.audioVisualSettings.enableScreenShake,
      'Enable Screen Shake',
      (checked) => this.configState.updateAudioVisualSettings({ enableScreenShake: checked })
    );

    effectsSection.appendChild(screenShakeCheckbox);

    if (this.currentConfig.audioVisualSettings.enableScreenShake) {
      const shakeIntensitySlider = this.configState.createRangeSlider(
        this.currentConfig.audioVisualSettings.screenShakeIntensity,
        0, 100, 5,
        (value) => this.configState.updateAudioVisualSettings({ screenShakeIntensity: value }),
        (value) => `${value}%`
      );

      const shakeIntensityRow = this.configState.createFormRow(
        'Screen Shake Intensity',
        shakeIntensitySlider.container,
        'How much the screen shakes during explosions and impacts'
      );
      effectsSection.appendChild(shakeIntensityRow);
    }

    const damageNumbersCheckbox = this.configState.createCheckbox(
      this.currentConfig.audioVisualSettings.enableDamageNumbers,
      'Show Damage Numbers',
      (checked) => this.configState.updateAudioVisualSettings({ enableDamageNumbers: checked })
    );

    const projectileTrailsCheckbox = this.configState.createCheckbox(
      this.currentConfig.audioVisualSettings.enableProjectileTrails,
      'Enable Projectile Trails',
      (checked) => this.configState.updateAudioVisualSettings({ enableProjectileTrails: checked })
    );

    const uiAnimationsCheckbox = this.configState.createCheckbox(
      this.currentConfig.audioVisualSettings.enableUIAnimations,
      'Enable UI Animations',
      (checked) => this.configState.updateAudioVisualSettings({ enableUIAnimations: checked })
    );

    effectsSection.appendChild(damageNumbersCheckbox);
    effectsSection.appendChild(projectileTrailsCheckbox);
    effectsSection.appendChild(uiAnimationsCheckbox);

    container.appendChild(effectsSection);

    // Performance Optimization Section
    const performanceSection = this.configState.createFormSection(
      'Performance Optimization',
      'Fine-tune settings for optimal performance on your device.'
    );

    const performanceInfo = document.createElement('div');
    performanceInfo.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 20px;
      font-size: 13px;
      line-height: 1.4;
    `;

    const validation = this.configState.validateConfiguration();
    const perfImpact = validation.performanceImpact;
    let perfColor = '#4CAF50';
    let perfText = 'Low';
    let perfAdvice = 'Your current settings should run smoothly on most devices.';

    switch (perfImpact) {
      case 'MEDIUM':
        perfColor = '#FF9800';
        perfText = 'Medium';
        perfAdvice = 'Settings may impact performance on older devices. Consider reducing quality if you experience lag.';
        break;
      case 'HIGH':
        perfColor = '#FF5722';
        perfText = 'High';
        perfAdvice = 'Settings require a powerful device. Reduce quality settings if experiencing poor performance.';
        break;
      case 'EXTREME':
        perfColor = '#F44336';
        perfText = 'Extreme';
        perfAdvice = 'Settings are very demanding. Expect performance issues unless you have a high-end device.';
        break;
    }

    performanceInfo.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <span style="color: ${perfColor}; font-weight: bold; font-size: 14px;">Performance Impact: ${perfText}</span>
        <span style="color: #ccc;">Difficulty: ${validation.difficultyRating.toFixed(1)}/10</span>
      </div>
      <div style="color: #ccc;">${perfAdvice}</div>
    `;

    performanceSection.appendChild(performanceInfo);

    container.appendChild(performanceSection);

    // Quick Presets Section
    const presetsSection = this.configState.createFormSection(
      'Quality Presets',
      'Apply common audio/visual configurations optimized for different scenarios.'
    );

    const presetsContainer = document.createElement('div');
    presetsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const performanceButton = this.createButton('⚡ Performance', 'primary', () => {
      this.configState.updateAudioVisualSettings({
        masterVolume: 70,
        musicVolume: 50,
        sfxVolume: 70,
        voiceVolume: 60,
        audioQuality: AudioQuality.LOW,
        particleDensity: VisualQuality.LOW,
        enableScreenShake: false,
        enableProjectileTrails: false,
        enableUIAnimations: false,
        targetFPS: 30,
        qualityPreset: VisualQuality.LOW,
        textureQuality: VisualQuality.LOW,
        enableVSync: false
      });
      this.renderCurrentTab();
    });

    const balancedButton = this.createButton('⚖️ Balanced', 'secondary', () => {
      const defaultConfig = CONFIGURATION_PRESETS.STANDARD();
      this.configState.updateAudioVisualSettings(defaultConfig.audioVisualSettings);
      this.renderCurrentTab();
    });

    const cinematicButton = this.createButton('🎬 Cinematic', 'warning', () => {
      this.configState.updateAudioVisualSettings({
        masterVolume: 80,
        musicVolume: 75,
        sfxVolume: 85,
        voiceVolume: 90,
        audioQuality: AudioQuality.ULTRA,
        particleDensity: VisualQuality.ULTRA,
        enableScreenShake: true,
        screenShakeIntensity: 75,
        enableDamageNumbers: true,
        enableProjectileTrails: true,
        enableUIAnimations: true,
        targetFPS: 60,
        qualityPreset: VisualQuality.ULTRA,
        textureQuality: VisualQuality.ULTRA,
        enableVSync: true
      });
      this.renderCurrentTab();
    });

    const competitiveButton = this.createButton('🏆 Competitive', 'secondary', () => {
      this.configState.updateAudioVisualSettings({
        masterVolume: 60,
        musicVolume: 30,
        sfxVolume: 80,
        voiceVolume: 70,
        audioQuality: AudioQuality.MEDIUM,
        particleDensity: VisualQuality.LOW,
        enableScreenShake: false,
        enableDamageNumbers: true,
        enableProjectileTrails: false,
        enableUIAnimations: false,
        targetFPS: 120,
        qualityPreset: VisualQuality.MEDIUM,
        textureQuality: VisualQuality.MEDIUM,
        enableVSync: false
      });
      this.renderCurrentTab();
    });

    presetsContainer.appendChild(performanceButton);
    presetsContainer.appendChild(balancedButton);
    presetsContainer.appendChild(cinematicButton);
    presetsContainer.appendChild(competitiveButton);

    presetsSection.appendChild(presetsContainer);
    container.appendChild(presetsSection);
  }
  
  private renderAdvancedTab(container: HTMLDivElement): void {
    const title = document.createElement('h2');
    title.textContent = 'Advanced Options';
    title.style.cssText = 'margin: 0 0 20px 0; color: #4CAF50;';
    container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = 'Advanced settings for power users, developers, and players who want to fine-tune every aspect of their gaming experience.';
    description.style.cssText = 'margin: 0 0 25px 0; color: #ccc; font-size: 14px; line-height: 1.4;';
    container.appendChild(description);

    // Warning Section
    const warningSection = document.createElement('div');
    warningSection.style.cssText = `
      background: #2d1b1b;
      border: 1px solid #d32f2f;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 25px;
      font-size: 13px;
      line-height: 1.4;
    `;
    warningSection.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="font-size: 18px;">⚠️</span>
        <span style="color: #d32f2f; font-weight: bold;">Warning</span>
      </div>
      <div style="color: #ccc;">
        These settings are for advanced users. Changing them incorrectly may affect game stability or performance.
        Only modify these if you understand what they do.
      </div>
    `;
    container.appendChild(warningSection);

    // Debug Options Section
    const debugSection = this.configState.createFormSection(
      'Debug & Development Tools',
      'Enable debugging features and performance monitoring tools.'
    );

    const fpsCounterCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.showFPSCounter,
      'Show FPS Counter',
      (checked) => this.configState.updateAdvancedSettings({ showFPSCounter: checked })
    );

    const debugGridCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.showDebugGrid,
      'Show Debug Grid',
      (checked) => this.configState.updateAdvancedSettings({ showDebugGrid: checked })
    );

    const performanceMetricsCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.showPerformanceMetrics,
      'Show Performance Metrics',
      (checked) => this.configState.updateAdvancedSettings({ showPerformanceMetrics: checked })
    );

    const developerConsoleCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.enableDeveloperConsole,
      'Enable Developer Console',
      (checked) => this.configState.updateAdvancedSettings({ enableDeveloperConsole: checked })
    );

    const collisionBoxesCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.showCollisionBoxes,
      'Show Collision Boxes',
      (checked) => this.configState.updateAdvancedSettings({ showCollisionBoxes: checked })
    );

    const pathfindingCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.showPathfinding,
      'Show Pathfinding Debug',
      (checked) => this.configState.updateAdvancedSettings({ showPathfinding: checked })
    );

    debugSection.appendChild(fpsCounterCheckbox);
    debugSection.appendChild(debugGridCheckbox);
    debugSection.appendChild(performanceMetricsCheckbox);
    debugSection.appendChild(developerConsoleCheckbox);
    debugSection.appendChild(collisionBoxesCheckbox);
    debugSection.appendChild(pathfindingCheckbox);

    container.appendChild(debugSection);

    // Experimental Features Section
    const experimentalSection = this.configState.createFormSection(
      'Experimental Features',
      'Test upcoming features that are still in development. May be unstable.'
    );

    const experimentalFeaturesCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.enableExperimentalFeatures,
      'Enable Experimental Features',
      (checked) => this.configState.updateAdvancedSettings({ enableExperimentalFeatures: checked })
    );

    const advancedAICheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.enableAdvancedAI,
      'Advanced AI Systems',
      (checked) => this.configState.updateAdvancedSettings({ enableAdvancedAI: checked })
    );

    const physicsEnhancementsCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.enablePhysicsEnhancements,
      'Enhanced Physics',
      (checked) => this.configState.updateAdvancedSettings({ enablePhysicsEnhancements: checked })
    );

    const newGameModesCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.enableNewGameModes,
      'New Game Modes (Beta)',
      (checked) => this.configState.updateAdvancedSettings({ enableNewGameModes: checked })
    );

    experimentalSection.appendChild(experimentalFeaturesCheckbox);
    experimentalSection.appendChild(advancedAICheckbox);
    experimentalSection.appendChild(physicsEnhancementsCheckbox);
    experimentalSection.appendChild(newGameModesCheckbox);

    container.appendChild(experimentalSection);

    // Technical Settings Section
    const technicalSection = this.configState.createFormSection(
      'Technical Settings',
      'Low-level technical configurations that affect game behavior.'
    );

    const multithreadingCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.enableMultithreading,
      'Enable Multithreading',
      (checked) => this.configState.updateAdvancedSettings({ enableMultithreading: checked })
    );

    const memoryOptimizationCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.memoryOptimization,
      'Memory Optimization',
      (checked) => this.configState.updateAdvancedSettings({ memoryOptimization: checked })
    );

    const precisionModeCheckbox = this.configState.createCheckbox(
      this.currentConfig.advancedSettings.precisionMode,
      'High Precision Mode',
      (checked) => this.configState.updateAdvancedSettings({ precisionMode: checked })
    );

    technicalSection.appendChild(multithreadingCheckbox);
    technicalSection.appendChild(memoryOptimizationCheckbox);
    technicalSection.appendChild(precisionModeCheckbox);

    const customSeedInput = document.createElement('input');
    customSeedInput.type = 'text';
    customSeedInput.placeholder = 'Enter custom seed or leave empty';
    customSeedInput.value = this.currentConfig.advancedSettings.customSeed || '';
    customSeedInput.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      color: white;
      padding: 8px;
      border-radius: 4px;
      width: 200px;
    `;

    customSeedInput.addEventListener('input', () => {
      this.configState.updateAdvancedSettings({ customSeed: customSeedInput.value.trim() });
    });

    const customSeedRow = this.configState.createFormRow(
      'Global Random Seed',
      customSeedInput,
      'Override all random number generation with a custom seed for reproducible gameplay'
    );
    technicalSection.appendChild(customSeedRow);

    container.appendChild(technicalSection);

    // Data Management Section
    const dataSection = this.configState.createFormSection(
      'Data Management',
      'Import, export, and manage your configuration data.'
    );

    const dataActionsContainer = document.createElement('div');
    dataActionsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;';

    const exportButton = this.createButton('📤 Export Config', 'secondary', () => {
      const exportData = configurationPersistence.exportConfiguration(this.currentConfig);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tower-defense-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    const importButton = this.createButton('📥 Import Config', 'secondary', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const config = configurationPersistence.importConfiguration(e.target?.result as string);
              if (config) {
                this.configState.setConfiguration(config);
                this.renderCurrentTab();
                alert('Configuration imported successfully!');
              } else {
                alert('Failed to import configuration. Invalid file format.');
              }
            } catch (error) {
              alert('Failed to import configuration: ' + error);
            }
          };
          reader.readAsText(file);
        }
      });
      input.click();
    });

    const backupButton = this.createButton('💾 Backup All', 'secondary', () => {
      const backupData = configurationPersistence.backupConfigurations();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tower-defense-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    const clearDataButton = this.createButton('🗑️ Clear All Data', 'warning', () => {
      if (confirm('Are you sure you want to clear all saved configurations? This cannot be undone.')) {
        configurationPersistence.clearAllConfigurations();
        alert('All configuration data has been cleared.');
      }
    });

    dataActionsContainer.appendChild(exportButton);
    dataActionsContainer.appendChild(importButton);
    dataActionsContainer.appendChild(backupButton);
    dataActionsContainer.appendChild(clearDataButton);

    dataSection.appendChild(dataActionsContainer);

    // Storage info
    const storageInfo = configurationPersistence.getStorageInfo();
    const storageInfoDiv = document.createElement('div');
    storageInfoDiv.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      font-size: 13px;
      line-height: 1.4;
    `;

    const usedMB = (storageInfo.used / (1024 * 1024)).toFixed(2);
    const availableMB = (storageInfo.available / (1024 * 1024)).toFixed(2);
    
    storageInfoDiv.innerHTML = `
      <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">Storage Information</div>
      <div style="color: #ccc;">
        <div>Configurations stored: ${storageInfo.configurations}</div>
        <div>Storage used: ${usedMB} MB</div>
        <div>Storage available: ${availableMB} MB</div>
      </div>
    `;

    dataSection.appendChild(storageInfoDiv);

    container.appendChild(dataSection);

    // System Information Section
    const systemSection = this.configState.createFormSection(
      'System Information',
      'Information about your system and the game environment.'
    );

    const systemInfoDiv = document.createElement('div');
    systemInfoDiv.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      font-size: 13px;
      line-height: 1.4;
    `;

    const userAgent = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';
    const memory = (navigator as any).deviceMemory || 'Unknown';
    const cores = navigator.hardwareConcurrency || 'Unknown';
    const online = navigator.onLine ? 'Online' : 'Offline';

    systemInfoDiv.innerHTML = `
      <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">System Details</div>
      <div style="color: #ccc;">
        <div><strong>Platform:</strong> ${platform}</div>
        <div><strong>CPU Cores:</strong> ${cores}</div>
        <div><strong>Device Memory:</strong> ${memory} GB</div>
        <div><strong>Network Status:</strong> ${online}</div>
        <div><strong>User Agent:</strong></div>
        <div style="font-size: 11px; margin-top: 5px; word-break: break-all;">${userAgent}</div>
      </div>
    `;

    systemSection.appendChild(systemInfoDiv);

    container.appendChild(systemSection);

    // Configuration Validation Section
    const validationSection = this.configState.createFormSection(
      'Configuration Validation',
      'Detailed validation results and recommendations for your current configuration.'
    );

    const validation = this.configState.validateConfiguration();
    const validationDiv = document.createElement('div');
    validationDiv.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      font-size: 13px;
      line-height: 1.4;
    `;

    const statusColor = validation.isValid ? '#4CAF50' : '#FF9800';
    const statusText = validation.isValid ? 'Valid' : 'Has Issues';

    let validationHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <span style="color: ${statusColor}; font-weight: bold; font-size: 14px;">Status: ${statusText}</span>
        <span style="color: #ccc;">Balance Score: ${validation.balanceScore.toFixed(2)}/1.0</span>
      </div>
    `;

    if (validation.errors.length > 0) {
      validationHTML += `
        <div style="margin-bottom: 10px;">
          <div style="color: #f44336; font-weight: bold; margin-bottom: 5px;">Errors (${validation.errors.length}):</div>
          ${validation.errors.map(error => `<div style="color: #ccc; margin-left: 10px;">• ${error}</div>`).join('')}
        </div>
      `;
    }

    if (validation.warnings.length > 0) {
      validationHTML += `
        <div style="margin-bottom: 10px;">
          <div style="color: #FF9800; font-weight: bold; margin-bottom: 5px;">Warnings (${validation.warnings.length}):</div>
          ${validation.warnings.map(warning => `<div style="color: #ccc; margin-left: 10px;">• ${warning}</div>`).join('')}
        </div>
      `;
    }

    if (validation.recommendations.length > 0) {
      validationHTML += `
        <div>
          <div style="color: #2196F3; font-weight: bold; margin-bottom: 5px;">Recommendations (${validation.recommendations.length}):</div>
          ${validation.recommendations.map(rec => `<div style="color: #ccc; margin-left: 10px;">• ${rec}</div>`).join('')}
        </div>
      `;
    }

    if (validation.errors.length === 0 && validation.warnings.length === 0 && validation.recommendations.length === 0) {
      validationHTML += `<div style="color: #4CAF50;">Your configuration is perfectly valid with no issues detected.</div>`;
    }

    validationDiv.innerHTML = validationHTML;
    validationSection.appendChild(validationDiv);

    container.appendChild(validationSection);

    // Quick Actions Section
    const actionsSection = this.configState.createFormSection(
      'Quick Actions',
      'Useful actions for managing advanced settings.'
    );

    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';

    const resetAdvancedButton = this.createButton('↺ Reset Advanced', 'warning', () => {
      const defaultConfig = CONFIGURATION_PRESETS.STANDARD();
      this.configState.updateAdvancedSettings(defaultConfig.advancedSettings);
      this.renderCurrentTab();
    });

    const enableAllDebugButton = this.createButton('🔍 Enable All Debug', 'secondary', () => {
      this.configState.updateAdvancedSettings({
        showFPSCounter: true,
        showDebugGrid: true,
        showPerformanceMetrics: true,
        enableDeveloperConsole: true,
        showCollisionBoxes: true,
        showPathfinding: true
      });
      this.renderCurrentTab();
    });

    const disableAllDebugButton = this.createButton('🔇 Disable All Debug', 'secondary', () => {
      this.configState.updateAdvancedSettings({
        showFPSCounter: false,
        showDebugGrid: false,
        showPerformanceMetrics: false,
        enableDeveloperConsole: false,
        showCollisionBoxes: false,
        showPathfinding: false
      });
      this.renderCurrentTab();
    });

    actionsContainer.appendChild(resetAdvancedButton);
    actionsContainer.appendChild(enableAllDebugButton);
    actionsContainer.appendChild(disableAllDebugButton);

    actionsSection.appendChild(actionsContainer);
    container.appendChild(actionsSection);
  }
  
  
  private updateValidationStatus(): void {
    const validation = configurationValidator.validate(this.currentConfig);
    const statusContainer = this.container.querySelector('.validation-status') as HTMLDivElement;
    
    statusContainer.innerHTML = '';
    
    const statusIcon = document.createElement('span');
    statusIcon.textContent = validation.isValid ? '✅' : '⚠️';
    statusIcon.style.fontSize = '16px';
    
    const statusText = document.createElement('span');
    statusText.textContent = validation.isValid ? 'Configuration Valid' : `${validation.errors.length} errors, ${validation.warnings.length} warnings`;
    statusText.style.color = validation.isValid ? '#4CAF50' : '#FF9800';
    
    const difficultyText = document.createElement('span');
    difficultyText.textContent = `Difficulty: ${validation.difficultyRating.toFixed(1)}/10`;
    difficultyText.style.color = '#ccc';
    
    const performanceText = document.createElement('span');
    performanceText.textContent = `Performance: ${validation.performanceImpact}`;
    performanceText.style.color = validation.performanceImpact === 'HIGH' || validation.performanceImpact === 'EXTREME' ? '#FF5722' : '#4CAF50';
    
    statusContainer.appendChild(statusIcon);
    statusContainer.appendChild(statusText);
    statusContainer.appendChild(difficultyText);
    statusContainer.appendChild(performanceText);
  }
  
  private saveCurrentConfiguration(): void {
    const id = configurationPersistence.saveConfiguration(this.currentConfig);
    alert(`Configuration saved with ID: ${id}`);
  }
  
  private showLoadDialog(): void {
    const userConfigs = configurationPersistence.getUserConfigurations();
    if (userConfigs.length === 0) {
      alert('No saved configurations found.');
      return;
    }
    
    // Simple implementation - in a real app you'd create a proper dialog
    const configNames = userConfigs.map((c, i) => `${i + 1}. ${c.configuration.metadata.name}`).join('\n');
    const choice = prompt(`Select configuration:\n${configNames}\n\nEnter the number:`);
    
    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < userConfigs.length) {
        this.currentConfig = userConfigs[index].configuration;
        this.updateValidationStatus();
        alert('Configuration loaded successfully!');
      }
    }
  }

  private createMapPreviewSection(container: HTMLDivElement): void {
    const previewSection = this.configState.createFormSection(
      'Map Preview & Selection',
      'Preview generated maps and select your preferred layout before starting the game.'
    );

    // Generate previews button
    const generateButton = this.createButton('🎯 Generate Map Previews', 'primary', async () => {
      await this.generateMapPreviews(previewSection);
    });

    generateButton.style.marginBottom = '15px';
    previewSection.appendChild(generateButton);

    // Preview container for generated maps
    const previewContainer = document.createElement('div');
    previewContainer.id = 'map-preview-container';
    previewContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    `;
    previewSection.appendChild(previewContainer);

    container.appendChild(previewSection);
  }

  private async generateMapPreviews(previewSection: HTMLElement): Promise<void> {
    const previewContainer = previewSection.querySelector('#map-preview-container') as HTMLDivElement;
    if (!previewContainer) return;

    // Show loading state
    previewContainer.innerHTML = '<div style="color: #4CAF50; text-align: center; padding: 20px;">⏳ Generating map previews...</div>';

    try {
      // Import MapGenerator dynamically to avoid circular dependencies
      const { MapGenerator } = await import('../systems/MapGenerator');
      const mapGenerator = new MapGenerator();

      const previews: HTMLElement[] = [];
      const previewCount = this.currentConfig.mapSettings.previewCount || 3;

      for (let i = 0; i < previewCount; i++) {
        // Generate a map with a different seed for each preview
        const previewConfig = {
          ...this.currentConfig.mapSettings,
          seed: this.currentConfig.mapSettings.seed ? 
            this.currentConfig.mapSettings.seed + i : 
            Date.now() + i
        };

        const mapData = mapGenerator.generate(previewConfig);
        const previewElement = this.createMapPreviewCard(mapData, previewConfig, i);
        previews.push(previewElement);
      }

      // Clear loading and add previews
      previewContainer.innerHTML = '';
      previews.forEach(preview => previewContainer.appendChild(preview));

    } catch (error) {
      console.error('Failed to generate map previews:', error);
      previewContainer.innerHTML = '<div style="color: #f44336; text-align: center; padding: 20px;">❌ Failed to generate previews. Please try again.</div>';
    }
  }

  private createMapPreviewCard(mapData: MapData, config: any, index: number): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #2a2a2a;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    `;

    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#4CAF50';
      card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#333';
      card.style.transform = 'translateY(0)';
    });

    // Preview canvas
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 100;
    canvas.style.cssText = `
      width: 100%;
      height: auto;
      border-radius: 4px;
      background: #1a1a1a;
    `;

    // Draw a simple map representation
    this.drawMapPreview(canvas, mapData);

    // Map info
    const info = document.createElement('div');
    info.style.cssText = 'margin-top: 10px; font-size: 12px;';
    
    const title = document.createElement('div');
    title.textContent = `Map ${index + 1}`;
    title.style.cssText = 'font-weight: bold; color: #4CAF50; margin-bottom: 5px;';

    const details = document.createElement('div');
    details.style.cssText = 'color: #ccc; line-height: 1.3;';
    details.innerHTML = `
      <div>🗺️ ${config.width}×${config.height}</div>
      <div>🌱 ${mapData.decorations?.length || 0} decorations</div>
      <div>🚧 ${mapData.obstacles?.length || 0} obstacles</div>
      <div>🛤️ ${mapData.paths?.length || 1} path${mapData.paths?.length !== 1 ? 's' : ''}</div>
    `;

    info.appendChild(title);
    info.appendChild(details);

    // Select button
    const selectButton = this.createButton('Select This Map', 'secondary', () => {
      this.selectMapPreview(config, index);
    });
    selectButton.style.cssText += 'width: 100%; margin-top: 10px; font-size: 11px; padding: 8px;';

    card.appendChild(canvas);
    card.appendChild(info);
    card.appendChild(selectButton);

    return card;
  }

  private drawMapPreview(canvas: HTMLCanvasElement, mapData: MapData): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = mapData.width || 30;
    const height = mapData.height || 22;
    const cellW = canvas.width / width;
    const cellH = canvas.height / height;

    // Draw grid cells based on type
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const cellType = mapData.grid?.[x]?.[y]?.type || 'EMPTY';
        let color = '#2a2a2a'; // Default empty

        switch (cellType) {
          case 'PATH':
            color = '#8B4513';
            break;
          case 'BLOCKED':
          case 'OBSTACLE':
            color = '#666666';
            break;
          case 'DECORATIVE':
            color = '#4CAF50';
            break;
          case 'WATER':
            color = '#2196F3';
            break;
          case 'SPAWN_ZONE':
            color = '#FF5722';
            break;
          case 'BORDER':
            color = '#333333';
            break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      }
    }

    // Draw paths if available
    if (mapData.paths && mapData.paths.length > 0) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();

      mapData.paths.forEach((path: any[]) => {
        if (path.length > 0) {
          ctx.moveTo(path[0].x * cellW + cellW/2, path[0].y * cellH + cellH/2);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellW + cellW/2, path[i].y * cellH + cellH/2);
          }
        }
      });

      ctx.stroke();
    }
  }

  private selectMapPreview(config: any, index: number): void {
    // Update the current configuration with the selected preview's seed
    this.configState.updateMapSettings({ seed: config.seed });
    
    // Show confirmation
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
    `;
    notification.textContent = `Map ${index + 1} selected! Seed: ${config.seed}`;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  private resetToDefault(): void {
    this.currentConfig = CONFIGURATION_PRESETS.STANDARD();
    this.updateValidationStatus();
    this.renderCurrentTab();
  }
  
  private startGame(): void {
    const validation = configurationValidator.validate(this.currentConfig);
    
    if (!validation.isValid) {
      const proceed = confirm(`Configuration has ${validation.errors.length} errors. Do you want to proceed anyway?`);
      if (!proceed) return;
    }
    
    // Save current configuration
    configurationPersistence.saveCurrentConfiguration(this.currentConfig);
    
    this.close();
    this.onConfigurationComplete(this.currentConfig);
  }
  
  public show(): void {
    document.body.appendChild(this.container);
  }
  
  private close(): void {
    // Cleanup components
    this.tabManager?.destroy();
    this.presetSelector?.destroy();
    
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}