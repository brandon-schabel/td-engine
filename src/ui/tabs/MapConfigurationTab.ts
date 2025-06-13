/**
 * Map Configuration Tab Renderer
 * Extracted from ConfigurationMenu.ts to handle all map-related settings
 */

import { BaseTabRenderer } from '../components/TabRenderer';
import { FormComponents } from '../components/FormComponents';
import type { GameConfiguration } from '../../config/GameConfiguration';
import { MapSize, MAP_SIZE_PRESETS, BiomeType, DecorationLevel, MapDifficulty } from '../../types/MapData';
import type { MapData } from '../../types/MapData';

export class MapConfigurationTab extends BaseTabRenderer {
  public readonly tabId = 'map';
  public readonly tabTitle = 'Map Configuration';
  public readonly tabDescription = 'Customize map generation settings';

  private mapPreviewContainer: HTMLDivElement | null = null;

  public render(container: HTMLDivElement): void {
    this.clearContainer(container);

    const title = this.createTitle('Map Configuration');
    const description = this.createDescription(
      'Customize the map generation settings to create your ideal battlefield. Changes are applied in real-time.'
    );

    container.appendChild(title);
    container.appendChild(description);

    this.renderMapSizeSection(container);
    this.renderBiomeSection(container);
    this.renderDifficultySection(container);
    this.renderEnvironmentSection(container);
    this.renderMapPreviewSection(container);
  }

  private renderMapSizeSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Map Size & Dimensions',
      'Choose the size of your battlefield. Larger maps offer more strategic depth but may impact performance.'
    );

    const mapSizeOptions = [
      { value: MapSize.SMALL, label: 'Small (40×30)', description: 'Quick matches, fast-paced action' },
      { value: MapSize.MEDIUM, label: 'Medium (60×44)', description: 'Balanced gameplay experience' },
      { value: MapSize.LARGE, label: 'Large (80×60)', description: 'Strategic depth, longer matches' },
      { value: MapSize.HUGE, label: 'Huge (100×70)', description: 'Epic battles, maximum strategy' }
    ];

    const sizeSelect = FormComponents.createSelectDropdown(
      this.currentConfig.mapSettings.size,
      mapSizeOptions,
      (value) => this.configState.updateMapSettings({ size: value })
    );

    const sizeRow = FormComponents.createFormRow(
      'Map Size',
      sizeSelect,
      'Larger maps provide more strategic options but require more processing power'
    );
    section.appendChild(sizeRow);

    // Custom size inputs (shown only for custom size)
    if (this.currentConfig.mapSettings.customSize) {
      this.renderCustomSizeInputs(section);
    }

    container.appendChild(section);
  }

  private renderCustomSizeInputs(section: HTMLDivElement): void {
    const customSize = this.currentConfig.mapSettings.customSize;
    if (!customSize) return;

    const customWidthInput = FormComponents.createNumberInput(
      customSize.width,
      10, 100, 1,
      (value) => {
        const currentCustomSize = this.currentConfig.mapSettings.customSize || { width: 30, height: 22 };
        this.configState.updateMapSettings({ customSize: { ...currentCustomSize, width: value } });
      }
    );

    const customHeightInput = FormComponents.createNumberInput(
      customSize.height,
      8, 80, 1,
      (value) => {
        const currentCustomSize = this.currentConfig.mapSettings.customSize || { width: 30, height: 22 };
        this.configState.updateMapSettings({ customSize: { ...currentCustomSize, height: value } });
      }
    );

    const widthRow = FormComponents.createFormRow(
      'Custom Width',
      customWidthInput,
      'Map width in cells (10-100)'
    );

    const heightRow = FormComponents.createFormRow(
      'Custom Height',
      customHeightInput,
      'Map height in cells (8-80)'
    );

    section.appendChild(widthRow);
    section.appendChild(heightRow);
  }

  private renderBiomeSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Environment & Biome',
      'Set the visual theme and environmental characteristics of your battlefield.'
    );

    const biomeOptions = [
      { value: 'RANDOM' as const, label: 'Random', description: 'Let the game choose' },
      { value: BiomeType.FOREST, label: 'Forest', description: 'Lush green environment' },
      { value: BiomeType.DESERT, label: 'Desert', description: 'Arid sandy terrain' },
      { value: BiomeType.ARCTIC, label: 'Arctic', description: 'Frozen tundra' },
      { value: BiomeType.VOLCANIC, label: 'Volcanic', description: 'Lava and ash' },
      { value: BiomeType.GRASSLAND, label: 'Grassland', description: 'Open plains' }
    ];

    const biomeSelect = FormComponents.createSelectDropdown(
      this.currentConfig.mapSettings.biome,
      biomeOptions,
      (value) => this.configState.updateMapSettings({ biome: value })
    );

    const biomeRow = FormComponents.createFormRow(
      'Biome Type',
      biomeSelect,
      'Each biome affects visual appearance and may influence gameplay'
    );
    section.appendChild(biomeRow);

    // Decoration Level
    const decorationOptions = [
      { value: DecorationLevel.NONE, label: 'None', description: 'Clean, minimal appearance' },
      { value: DecorationLevel.SPARSE, label: 'Sparse', description: 'Few decorative elements' },
      { value: DecorationLevel.NORMAL, label: 'Normal', description: 'Balanced decoration' },
      { value: DecorationLevel.DENSE, label: 'Dense', description: 'Rich, detailed environment' }
    ];

    const decorationSelect = FormComponents.createSelectDropdown(
      this.currentConfig.mapSettings.decorationLevel,
      decorationOptions,
      (value) => this.configState.updateMapSettings({ decorationLevel: value })
    );

    const decorationRow = FormComponents.createFormRow(
      'Decoration Level',
      decorationSelect,
      'Higher decoration levels create more immersive environments but may impact performance'
    );
    section.appendChild(decorationRow);

    container.appendChild(section);
  }

  private renderDifficultySection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Map Difficulty & Complexity',
      'Adjust the strategic complexity and challenge level of the generated map.'
    );

    const difficultyOptions = [
      { value: MapDifficulty.EASY, label: 'Easy', description: 'Simple layouts, fewer obstacles' },
      { value: MapDifficulty.MEDIUM, label: 'Medium', description: 'Balanced challenge' },
      { value: MapDifficulty.HARD, label: 'Hard', description: 'Complex layouts, more obstacles' },
      { value: MapDifficulty.EXTREME, label: 'Extreme', description: 'Maximum complexity and challenge' }
    ];

    const difficultySelect = FormComponents.createSelectDropdown(
      this.currentConfig.mapSettings.difficulty,
      difficultyOptions,
      (value) => this.configState.updateMapSettings({ difficulty: value })
    );

    const difficultyRow = FormComponents.createFormRow(
      'Map Difficulty',
      difficultySelect,
      'Affects path complexity, number of chokepoints, and strategic opportunities'
    );
    section.appendChild(difficultyRow);

    // Path Complexity Slider
    const pathComplexitySlider = FormComponents.createSlider(
      this.currentConfig.mapSettings.pathComplexity,
      0.1, 1.0, 0.1,
      (value) => this.configState.updateMapSettings({ pathComplexity: value }),
      (value) => `${Math.round(value * 100)}%`
    );

    const pathComplexityRow = FormComponents.createFormRow(
      'Path Complexity',
      pathComplexitySlider,
      'Higher values create more winding, complex enemy paths'
    );
    section.appendChild(pathComplexityRow);

    // Obstacle Count
    const obstacleSlider = FormComponents.createSlider(
      this.currentConfig.mapSettings.obstacleCount,
      0, 50, 5,
      (value) => this.configState.updateMapSettings({ obstacleCount: value }),
      (value) => `${value} obstacles`
    );

    const obstacleRow = FormComponents.createFormRow(
      'Obstacle Count',
      obstacleSlider,
      'Number of strategic obstacles scattered across the map'
    );
    section.appendChild(obstacleRow);

    container.appendChild(section);
  }

  private renderEnvironmentSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Environmental Features',
      'Enable special environmental features that affect gameplay and visuals.'
    );

    // Water Features
    const waterCheckbox = FormComponents.createCheckbox(
      this.currentConfig.mapSettings.enableWater,
      (value) => this.configState.updateMapSettings({ enableWater: value })
    );

    const waterRow = FormComponents.createFormRow(
      'Water Features',
      waterCheckbox,
      'Add rivers, lakes, and water obstacles that block enemy movement'
    );
    section.appendChild(waterRow);

    // Animations
    const animationCheckbox = FormComponents.createCheckbox(
      this.currentConfig.mapSettings.enableAnimations,
      (value) => this.configState.updateMapSettings({ enableAnimations: value })
    );

    const animationRow = FormComponents.createFormRow(
      'Environmental Animations',
      animationCheckbox,
      'Enable animated environmental elements (may impact performance)'
    );
    section.appendChild(animationRow);

    container.appendChild(section);
  }

  private renderMapPreviewSection(container: HTMLDivElement): void {
    const section = FormComponents.createFormSection(
      'Map Preview',
      'Preview different map variations based on your current settings.'
    );

    // Create preview container
    this.mapPreviewContainer = document.createElement('div');
    this.mapPreviewContainer.className = 'map-preview-container';
    this.mapPreviewContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    `;

    // Generate preview button
    const generateButton = FormComponents.createButton({
      text: 'Generate Map Previews',
      type: 'primary',
      onClick: () => this.generateMapPreviews()
    });

    section.appendChild(generateButton);
    section.appendChild(this.mapPreviewContainer);
    container.appendChild(section);

    // Generate initial previews
    this.generateMapPreviews();
  }

  private generateMapPreviews(): void {
    if (!this.mapPreviewContainer) return;

    // Clear existing previews
    this.mapPreviewContainer.innerHTML = '';

    // Create a loading indicator
    const loading = document.createElement('div');
    loading.textContent = 'Generating map previews...';
    loading.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      color: #ccc;
      padding: 20px;
    `;
    this.mapPreviewContainer.appendChild(loading);

    // Simulate map generation (in a real implementation, this would call the map generator)
    setTimeout(() => {
      this.renderMapPreviews();
    }, 500);
  }

  private renderMapPreviews(): void {
    if (!this.mapPreviewContainer) return;

    this.mapPreviewContainer.innerHTML = '';

    // Generate 4 preview cards
    for (let i = 0; i < 4; i++) {
      const card = this.createMapPreviewCard(i);
      this.mapPreviewContainer.appendChild(card);
    }
  }

  private createMapPreviewCard(index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'map-preview-card';
    card.style.cssText = `
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#4CAF50';
      card.style.background = '#333';
    });

    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#444';
      card.style.background = '#2a2a2a';
    });

    // Preview title
    const title = document.createElement('h4');
    title.textContent = `Map Variant ${index + 1}`;
    title.style.cssText = `
      margin: 0 0 10px 0;
      color: #fff;
      font-size: 14px;
    `;

    // Preview canvas (placeholder)
    const canvas = document.createElement('div');
    canvas.style.cssText = `
      width: 100%;
      height: 120px;
      background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
      border: 1px solid #555;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 12px;
      margin-bottom: 10px;
    `;
    canvas.textContent = 'Map Preview';

    // Map info
    const info = document.createElement('div');
    info.style.cssText = `
      font-size: 12px;
      color: #ccc;
      line-height: 1.3;
    `;
    info.innerHTML = `
      <div>Paths: ${2 + index}</div>
      <div>Obstacles: ${5 + index * 3}</div>
      <div>Difficulty: ${['Easy', 'Medium', 'Hard', 'Extreme'][index] || 'Medium'}</div>
    `;

    card.appendChild(title);
    card.appendChild(canvas);
    card.appendChild(info);

    // Click handler to select this map configuration
    card.addEventListener('click', () => {
      this.selectMapVariant(index);
    });

    return card;
  }

  private selectMapVariant(index: number): void {
    // In a real implementation, this would apply the selected map variant
    console.log(`Selected map variant ${index + 1}`);
    
    // Visual feedback
    const cards = this.mapPreviewContainer?.querySelectorAll('.map-preview-card');
    cards?.forEach((card, i) => {
      if (i === index) {
        (card as HTMLElement).style.borderColor = '#4CAF50';
        (card as HTMLElement).style.background = '#1a3a1a';
      } else {
        (card as HTMLElement).style.borderColor = '#444';
        (card as HTMLElement).style.background = '#2a2a2a';
      }
    });
  }

  public validate(): boolean {
    const config = this.currentConfig.mapSettings;
    
    // Validate custom size if present
    if (config.customSize) {
      if (config.customSize.width < 10 || config.customSize.width > 100) {
        return false;
      }
      if (config.customSize.height < 8 || config.customSize.height > 80) {
        return false;
      }
    }

    // Validate path complexity
    if (config.pathComplexity < 0.1 || config.pathComplexity > 1.0) {
      return false;
    }

    return true;
  }

  public getErrors(): string[] {
    const errors: string[] = [];
    const config = this.currentConfig.mapSettings;

    if (config.customSize) {
      if (config.customSize.width < 10 || config.customSize.width > 100) {
        errors.push('Custom map width must be between 10 and 100 cells');
      }
      if (config.customSize.height < 8 || config.customSize.height > 80) {
        errors.push('Custom map height must be between 8 and 80 cells');
      }
    }

    if (config.pathComplexity < 0.1 || config.pathComplexity > 1.0) {
      errors.push('Path complexity must be between 10% and 100%');
    }

    return errors;
  }
}