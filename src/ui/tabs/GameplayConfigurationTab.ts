/**
 * Gameplay Configuration Tab Renderer
 * Extracted from ConfigurationMenu.ts to handle gameplay mechanics settings
 */

import { BaseTabRenderer } from '../components/TabRenderer';
import { FormComponents } from '../components/FormComponents';
import type { GameConfiguration } from '../../config/GameConfiguration';
import { GameDifficulty, VictoryCondition, DefeatCondition, WaveScaling } from '../../config/GameConfiguration';

export class GameplayConfigurationTab extends BaseTabRenderer {
  public readonly tabId = 'gameplay';
  public readonly tabTitle = 'Gameplay Settings';
  public readonly tabDescription = 'Configure core gameplay mechanics and difficulty';

  public render(container: HTMLDivElement): void {
    this.clearContainer(container);

    const title = this.createTitle('Gameplay Configuration');
    const description = this.createDescription(
      'Adjust the core gameplay mechanics, difficulty settings, and victory conditions to customize your gaming experience.'
    );

    container.appendChild(title);
    container.appendChild(description);

    this.renderDifficultySection(container);
    this.renderGameMechanicsSection(container);
    this.renderVictoryConditionsSection(container);
    this.renderWaveConfigurationSection(container);
  }

  private renderDifficultySection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Difficulty & Challenge',
      'Set the overall game difficulty and challenge parameters.'
    );

    const difficultyOptions = [
      { value: GameDifficulty.EASY, label: 'Easy', description: 'Relaxed gameplay, more resources' },
      { value: GameDifficulty.NORMAL, label: 'Normal', description: 'Balanced challenge' },
      { value: GameDifficulty.HARD, label: 'Hard', description: 'Challenging gameplay, limited resources' },
      { value: GameDifficulty.EXTREME, label: 'Extreme', description: 'Maximum challenge for experts' }
    ];

    const difficultySelect = FormComponents.createSelectDropdown(
      this.currentConfig.gameplaySettings.difficulty,
      difficultyOptions,
      (value) => this.configState.updateGameplaySettings({ difficulty: value })
    );

    const difficultyRow = FormComponents.createFormRow(
      'Game Difficulty',
      difficultySelect,
      'Affects enemy strength, resource availability, and overall challenge'
    );
    section.appendChild(difficultyRow);

    // Starting Resources
    const startingCurrencySlider = FormComponents.createSlider(
      this.currentConfig.gameplaySettings.startingCurrency,
      50, 500, 25,
      (value) => this.configState.updateGameplaySettings({ startingCurrency: value }),
      (value) => `$${value}`
    );

    const currencyRow = FormComponents.createFormRow(
      'Starting Currency',
      startingCurrencySlider,
      'Amount of currency available at game start'
    );
    section.appendChild(currencyRow);

    const startingLivesSlider = FormComponents.createSlider(
      this.currentConfig.gameplaySettings.startingLives,
      1, 20, 1,
      (value) => this.configState.updateGameplaySettings({ startingLives: value }),
      (value) => `${value} lives`
    );

    const livesRow = FormComponents.createFormRow(
      'Starting Lives',
      startingLivesSlider,
      'Number of lives you start with'
    );
    section.appendChild(livesRow);

    container.appendChild(section);
  }

  private renderGameMechanicsSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Game Mechanics',
      'Configure core gameplay mechanics and features.'
    );

    // Enable Player Movement
    const playerMovementCheckbox = FormComponents.createCheckbox(
      this.currentConfig.gameplaySettings.enablePlayerMovement,
      (value) => this.configState.updateGameplaySettings({ enablePlayerMovement: value })
    );

    const playerMovementRow = FormComponents.createFormRow(
      'Player Movement',
      playerMovementCheckbox,
      'Allow the player character to move around the map'
    );
    section.appendChild(playerMovementRow);

    // Enable Tower Building
    const towerBuildingCheckbox = FormComponents.createCheckbox(
      this.currentConfig.gameplaySettings.enableTowerBuilding,
      (value) => this.configState.updateGameplaySettings({ enableTowerBuilding: value })
    );

    const towerBuildingRow = FormComponents.createFormRow(
      'Tower Building',
      towerBuildingCheckbox,
      'Allow building and upgrading towers'
    );
    section.appendChild(towerBuildingRow);

    // Enable Upgrades
    const upgradesCheckbox = FormComponents.createCheckbox(
      this.currentConfig.gameplaySettings.enableUpgrades,
      (value) => this.configState.updateGameplaySettings({ enableUpgrades: value })
    );

    const upgradesRow = FormComponents.createFormRow(
      'Player & Tower Upgrades',
      upgradesCheckbox,
      'Enable upgrade systems for player and towers'
    );
    section.appendChild(upgradesRow);

    // Resource Generation Multiplier
    const resourceMultiplierSlider = FormComponents.createSlider(
      this.currentConfig.gameplaySettings.resourceGenerationMultiplier,
      0.5, 3.0, 0.1,
      (value) => this.configState.updateGameplaySettings({ resourceGenerationMultiplier: value }),
      (value) => `${(value * 100).toFixed(0)}%`
    );

    const resourceRow = FormComponents.createFormRow(
      'Resource Generation Rate',
      resourceMultiplierSlider,
      'Multiplier for currency generation from enemy kills'
    );
    section.appendChild(resourceRow);

    container.appendChild(section);
  }

  private renderVictoryConditionsSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Victory & Defeat Conditions',
      'Set the conditions for winning and losing the game.'
    );

    // Victory Condition
    const victoryOptions = [
      { value: VictoryCondition.SURVIVE_ALL_WAVES, label: 'Survive All Waves', description: 'Complete all enemy waves' },
      { value: VictoryCondition.REACH_SCORE, label: 'Reach Target Score', description: 'Achieve a specific score' },
      { value: VictoryCondition.SURVIVE_TIME, label: 'Survive Duration', description: 'Survive for a set time period' },
      { value: VictoryCondition.KILL_COUNT, label: 'Kill Target', description: 'Eliminate a specific number of enemies' }
    ];

    const victorySelect = FormComponents.createSelectDropdown(
      this.currentConfig.gameplaySettings.victoryCondition,
      victoryOptions,
      (value) => this.configState.updateGameplaySettings({ victoryCondition: value })
    );

    const victoryRow = FormComponents.createFormRow(
      'Victory Condition',
      victorySelect,
      'How to win the game'
    );
    section.appendChild(victoryRow);

    // Victory Target (shown based on victory condition)
    if (this.currentConfig.gameplaySettings.victoryCondition !== VictoryCondition.SURVIVE_ALL_WAVES) {
      this.renderVictoryTargetInput(section);
    }

    // Defeat Condition
    const defeatOptions = [
      { value: DefeatCondition.LOSE_ALL_LIVES, label: 'Lose All Lives', description: 'Game ends when lives reach zero' },
      { value: DefeatCondition.PLAYER_DEATH, label: 'Player Death', description: 'Game ends if player dies' },
      { value: DefeatCondition.TIME_LIMIT, label: 'Time Limit', description: 'Game ends after time expires' }
    ];

    const defeatSelect = FormComponents.createSelectDropdown(
      this.currentConfig.gameplaySettings.defeatCondition,
      defeatOptions,
      (value) => this.configState.updateGameplaySettings({ defeatCondition: value })
    );

    const defeatRow = FormComponents.createFormRow(
      'Defeat Condition',
      defeatSelect,
      'How the game can end in defeat'
    );
    section.appendChild(defeatRow);

    container.appendChild(section);
  }

  private renderVictoryTargetInput(section: HTMLDivElement): void {
    const currentCondition = this.currentConfig.gameplaySettings.victoryCondition;
    let label = 'Target Value';
    let helpText = 'Target value for victory condition';
    let min = 1;
    let max = 10000;

    switch (currentCondition) {
      case VictoryCondition.REACH_SCORE:
        label = 'Target Score';
        helpText = 'Score required to win the game';
        min = 1000;
        max = 100000;
        break;
      case VictoryCondition.SURVIVE_TIME:
        label = 'Survival Time (minutes)';
        helpText = 'Minutes to survive to win';
        min = 1;
        max = 60;
        break;
      case VictoryCondition.KILL_COUNT:
        label = 'Kill Target';
        helpText = 'Number of enemies to eliminate';
        min = 10;
        max = 1000;
        break;
    }

    const targetInput = FormComponents.createNumberInput(
      this.currentConfig.gameplaySettings.victoryTarget,
      min, max, 1,
      (value) => this.configState.updateGameplaySettings({ victoryTarget: value })
    );

    const targetRow = FormComponents.createFormRow(label, targetInput, helpText);
    section.appendChild(targetRow);
  }

  private renderWaveConfigurationSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Wave Configuration',
      'Configure enemy wave behavior and scaling.'
    );

    // Total Waves
    const totalWavesSlider = FormComponents.createSlider(
      this.currentConfig.gameplaySettings.totalWaves,
      5, 50, 1,
      (value) => this.configState.updateGameplaySettings({ totalWaves: value }),
      (value) => `${value} waves`
    );

    const wavesRow = FormComponents.createFormRow(
      'Total Waves',
      totalWavesSlider,
      'Number of enemy waves in the game'
    );
    section.appendChild(wavesRow);

    // Wave Scaling
    const scalingOptions = [
      { value: WaveScaling.LINEAR, label: 'Linear', description: 'Steady, predictable increase' },
      { value: WaveScaling.EXPONENTIAL, label: 'Exponential', description: 'Rapid difficulty ramp-up' },
      { value: WaveScaling.CURVED, label: 'Curved', description: 'Smooth acceleration curve' },
      { value: WaveScaling.STEPPED, label: 'Stepped', description: 'Difficulty plateaus with sudden jumps' }
    ];

    const scalingSelect = FormComponents.createSelectDropdown(
      this.currentConfig.gameplaySettings.waveScaling,
      scalingOptions,
      (value) => this.configState.updateGameplaySettings({ waveScaling: value })
    );

    const scalingRow = FormComponents.createFormRow(
      'Wave Scaling',
      scalingSelect,
      'How enemy difficulty increases over time'
    );
    section.appendChild(scalingRow);

    // Wave Interval
    const intervalSlider = FormComponents.createSlider(
      this.currentConfig.gameplaySettings.waveInterval,
      5, 60, 5,
      (value) => this.configState.updateGameplaySettings({ waveInterval: value }),
      (value) => `${value}s`
    );

    const intervalRow = FormComponents.createFormRow(
      'Wave Interval',
      intervalSlider,
      'Time between waves in seconds'
    );
    section.appendChild(intervalRow);

    container.appendChild(section);
  }

  public validate(): boolean {
    const config = this.currentConfig.gameplaySettings;
    
    // Validate starting resources
    if (config.startingCurrency < 50 || config.startingCurrency > 500) {
      return false;
    }
    
    if (config.startingLives < 1 || config.startingLives > 20) {
      return false;
    }

    // Validate victory target
    if (config.victoryCondition !== VictoryCondition.SURVIVE_ALL_WAVES) {
      if (config.victoryTarget <= 0) {
        return false;
      }
    }

    return true;
  }

  public getErrors(): string[] {
    const errors: string[] = [];
    const config = this.currentConfig.gameplaySettings;

    if (config.startingCurrency < 50 || config.startingCurrency > 500) {
      errors.push('Starting currency must be between 50 and 500');
    }
    
    if (config.startingLives < 1 || config.startingLives > 20) {
      errors.push('Starting lives must be between 1 and 20');
    }

    if (config.victoryCondition !== VictoryCondition.SURVIVE_ALL_WAVES && config.victoryTarget <= 0) {
      errors.push('Victory target must be greater than 0');
    }

    return errors;
  }
}