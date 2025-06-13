import { GameEngine } from './GameEngine';
import { GameState } from './GameState';
import { Grid, CellType } from '../systems/Grid';
import { Pathfinder } from '../systems/Pathfinder';
import { WaveManager } from '../systems/WaveManager';
import type { WaveConfig } from '../systems/WaveManager';
import { Renderer } from '../systems/Renderer';
import { Camera } from '../systems/Camera';
import { Tower, TowerType, UpgradeType } from '../entities/Tower';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player, PlayerUpgradeType } from '../entities/Player';
import { Collectible, CollectibleType } from '../entities/Collectible';
import type { Vector2 } from '../utils/Vector2';
import { AudioManager, SoundType } from '../audio/AudioManager';
import { MapGenerator } from '../systems/MapGenerator';
import { TextureManager } from '../systems/TextureManager';
import { BiomeType, MapDifficulty, DecorationLevel, MapSize, MAP_SIZE_PRESETS } from '../types/MapData';
import type { MapData, MapGenerationConfig, MapSizePreset } from '../types/MapData';
import { TOWER_COSTS, SPAWN_CHANCES, CURRENCY_CONFIG, AUDIO_CONFIG } from '../config/GameConfig';
import { GameInitializer } from './GameInitializer';
import { GameAudioHandler } from '../systems/GameAudioHandler';

export class Game {
  private engine: GameEngine;
  private grid: Grid;
  private pathfinder: Pathfinder;
  private waveManager: WaveManager;
  
  // Inlined resource management for better performance
  private currency: number = 100;
  private lives: number = 10;
  private score: number = 0;
  private renderer: Renderer;
  private camera: Camera;
  private audioManager: AudioManager;
  private audioHandler: GameAudioHandler;
  private mapGenerator: MapGenerator;
  private textureManager: TextureManager;
  private currentMapData: MapData;
  
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private player: Player;
  private collectibles: Collectible[] = [];
  
  private selectedTowerType: TowerType | null = null;
  private hoverTower: Tower | null = null;
  private selectedTower: Tower | null = null;
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private isMouseDown: boolean = false;
  
  constructor(canvas: HTMLCanvasElement, mapConfig?: MapGenerationConfig, autoStart: boolean = true) {
    // Initialize map generation systems
    this.mapGenerator = new MapGenerator();
    this.textureManager = new TextureManager();
    
    // Generate or use provided map configuration
    const config: MapGenerationConfig = mapConfig || this.generateEnhancedDefaultConfig();
    
    // Generate the map
    this.currentMapData = this.mapGenerator.generate(config);
    
    // Initialize grid with generated map size
    this.grid = new Grid(config.width, config.height, config.cellSize);
    
    // Apply generated map to grid
    this.applyMapToGrid();
    
    // Calculate world size
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;
    
    // Initialize camera
    this.camera = new Camera(canvas.width, canvas.height, worldWidth, worldHeight);
    
    // Initialize systems
    this.pathfinder = new Pathfinder(this.grid);
    
    // Use generated spawn zone for wave manager (or fallback to first spawn zone)
    const spawnZone = this.currentMapData.spawnZones[0] || { x: 1, y: Math.floor(config.height / 2) };
    const spawnWorldPos = this.grid.gridToWorld(spawnZone.x, spawnZone.y);
    this.waveManager = new WaveManager(spawnWorldPos);
    
    this.renderer = new Renderer(canvas, this.grid, this.camera, this.textureManager);
    this.renderer.setEnvironmentalEffects(this.currentMapData.effects);
    this.audioManager = new AudioManager();
    this.audioHandler = new GameAudioHandler(this.audioManager, this.camera);
    this.engine = new GameEngine();
    
    // Create player at generated start position
    const playerWorldPos = this.grid.gridToWorld(this.currentMapData.playerStart.x, this.currentMapData.playerStart.y);
    this.player = new Player(playerWorldPos);
    
    // Load wave configurations
    this.loadWaveConfigurations();
    
    // Set up game loop callbacks
    this.engine.onUpdate(this.update.bind(this));
    this.engine.onRender(this.render.bind(this));
    
    // Start the game engine (unless disabled for testing)
    if (autoStart) {
      this.engine.start();
    }
  }

  private applyMapToGrid(): void {
    // Set biome
    this.grid.setBiome(this.currentMapData.biomeConfig.type);
    
    // Set borders
    this.grid.setBorders();
    
    // Apply paths to grid
    this.currentMapData.paths.forEach(path => {
      path.waypoints.forEach(waypoint => {
        this.grid.setCellType(waypoint.x, waypoint.y, CellType.PATH);
      });
    });
    
    // Set spawn zones
    this.grid.setSpawnZones(this.currentMapData.spawnZones);
    
    // Apply decorations
    this.grid.addDecorations(this.currentMapData.decorations);
    
    // Apply height map
    if (this.currentMapData.heightMap) {
      for (let y = 0; y < this.currentMapData.heightMap.length; y++) {
        const row = this.currentMapData.heightMap[y];
        if (row) {
          for (let x = 0; x < row.length; x++) {
            const height = row[x];
            if (height !== undefined) {
              this.grid.setHeight(x, y, height);
            }
          }
        }
      }
    }
  }

  private loadWaveConfigurations(): void {
    // Use inline wave configuration to avoid circular imports
    const waves: WaveConfig[] = [
      {
        waveNumber: 1,
        enemies: [
          { type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }
        ],
        startDelay: 2000
      },
      {
        waveNumber: 2,
        enemies: [
          { type: EnemyType.BASIC, count: 8, spawnDelay: 800 }
        ],
        startDelay: 3000
      },
      {
        waveNumber: 3,
        enemies: [
          { type: EnemyType.BASIC, count: 5, spawnDelay: 1000 },
          { type: EnemyType.FAST, count: 3, spawnDelay: 600 }
        ],
        startDelay: 2000
      },
      {
        waveNumber: 4,
        enemies: [
          { type: EnemyType.BASIC, count: 10, spawnDelay: 600 },
          { type: EnemyType.FAST, count: 5, spawnDelay: 800 }
        ],
        startDelay: 2000
      },
      {
        waveNumber: 5,
        enemies: [
          { type: EnemyType.TANK, count: 3, spawnDelay: 2000 },
          { type: EnemyType.FAST, count: 8, spawnDelay: 400 }
        ],
        startDelay: 3000
      }
    ];
    
    this.waveManager.loadWaves(waves);
  }

  update = (deltaTime: number): void => {
    if (this.engine.getState() !== GameState.PLAYING) {
      return;
    }

    // Check for game over
    if (this.isGameOver()) {
      this.engine.gameOver();
      return;
    }

    // Update wave manager and spawn enemies
    const newEnemies = this.waveManager.update(deltaTime);
    newEnemies.forEach(enemy => {
      // Set enemy to target player instead of following path
      enemy.setTarget(this.player);
      this.enemies.push(enemy);
    });

    // Update enemies
    this.enemies.forEach(enemy => {
      // Provide tower information to enemies for targeting decisions
      enemy.setTowers(this.towers);
      enemy.update(deltaTime);
    });

    // Update player
    this.player.update(deltaTime);
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;
    this.player.constrainToBounds(worldWidth, worldHeight); // Keep player within world bounds
    
    // Update camera to follow player
    this.camera.update(this.player.position);
    
    // Player manual shooting (click and hold)
    const playerProjectile = this.player.updateShooting();
    if (playerProjectile) {
      this.projectiles.push(playerProjectile);
      this.audioHandler.playPlayerShoot(this.player.position);
    }
    
    // Check if player died
    if (!this.player.isAlive) {
      this.audioHandler.playGameOver();
      this.engine.gameOver();
      return;
    }

    // Update towers and generate projectiles
    this.towers.forEach(tower => {
      const newProjectiles = tower.updateAndShoot(this.enemies, deltaTime);
      if (newProjectiles.length > 0) {
        this.audioHandler.playTowerShoot(tower.position);
      }
      this.projectiles.push(...newProjectiles);
    });

    // Update projectiles
    this.projectiles.forEach(projectile => {
      projectile.update(deltaTime);
      
      // Check for collisions with enemies (for non-homing projectiles)
      if (!projectile.target) {
        const hitEnemy = projectile.checkCollisionWithEnemies(this.enemies);
        if (hitEnemy && !projectile.hitSoundPlayed) {
          projectile.hitSoundPlayed = true;
          const wasKilled = !hitEnemy.isAlive;
          this.audioHandler.handleEnemyDamage(hitEnemy, wasKilled);
          if (wasKilled) {
            this.enemyKilled(hitEnemy);
          }
        }
      }
      
      // Check if homing projectile hit target
      if (!projectile.isAlive && projectile.target && !projectile.hitSoundPlayed) {
        projectile.hitSoundPlayed = true;
        const wasKilled = !projectile.target.isAlive;
        this.audioHandler.handleEnemyDamage(projectile.target, wasKilled);
        if (wasKilled) {
          this.enemyKilled(projectile.target);
        }
      }
    });
    
    // Update collectibles
    this.collectibles.forEach(collectible => {
      collectible.update(deltaTime);
      if (collectible.tryCollectByPlayer(this.player)) {
        // Handle different collectible types
        if (collectible.isHealthPickup()) {
          this.audioHandler.playHealthPickup();
        } else if (collectible.collectibleType === CollectibleType.EXTRA_CURRENCY) {
          this.audioHandler.playPowerUpPickup();
          this.addCurrency(CURRENCY_CONFIG.powerUpBonus);
        } else {
          this.audioHandler.playPowerUpPickup();
        }
      }
    });

    // Clean up dead entities (inlined from EntityCleaner)
    this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    this.projectiles = this.projectiles.filter(projectile => projectile.isAlive);
    this.collectibles = this.collectibles.filter(collectible => collectible.isActive);
    this.towers = this.towers.filter(tower => tower.isAlive);

    // Check for wave completion and victory
    if (this.waveManager.isWaveComplete()) {
      if (!this.waveManager.hasNextWave()) {
        this.audioHandler.playVictory();
        this.engine.victory();
      } else {
        this.audioHandler.playWaveComplete();
      }
    }
  };

  render = (deltaTime: number): void => {
    // Render main scene including player
    this.renderer.renderScene(
      this.towers, 
      this.enemies, 
      this.projectiles, 
      this.collectibles,
      this.getPlayerAimerLine(),
      this.player
    );
    
    // Render tower range if hovering
    if (this.hoverTower) {
      this.renderer.renderTowerRange(this.hoverTower);
    }
    
    // Render selected tower upgrade panel
    if (this.selectedTower) {
      this.renderer.renderTowerRange(this.selectedTower);
      this.renderer.renderTowerUpgradePanel(
        this.selectedTower,
        10,
        150
      );
    }
    
    // Render tower ghost preview when placing towers
    if (this.selectedTowerType && this.engine.getState() === GameState.PLAYING) {
      const gridPos = this.grid.worldToGrid(this.mousePosition);
      const canPlace = this.grid.canPlaceTower(gridPos.x, gridPos.y);
      const canAfford = this.canAffordTower(this.selectedTowerType);
      
      this.renderer.renderTowerGhost(
        this.selectedTowerType,
        this.mousePosition,
        canPlace && canAfford
      );
    }
    
    // Render UI
    this.renderer.renderUI(
      this.currency,
      this.lives,
      this.score,
      this.waveManager.currentWave
    );
    
    // Render game state overlays
    if (this.engine.getState() === GameState.GAME_OVER) {
      this.renderer.renderGameOver();
    } else if (this.engine.getState() === GameState.VICTORY) {
      this.renderer.renderVictory();
    } else if (this.engine.getState() === GameState.PAUSED) {
      this.renderer.renderPaused();
    }
  };

  // Tower placement
  placeTower(towerType: TowerType, worldPosition: Vector2): boolean {
    const cost = TOWER_COSTS[towerType as keyof typeof TOWER_COSTS];
    
    if (!this.canAffordCurrency(cost)) {
      return false;
    }
    
    const gridPos = this.grid.worldToGrid(worldPosition);
    
    if (!this.grid.canPlaceTower(gridPos.x, gridPos.y)) {
      return false;
    }
    
    // Place tower
    const tower = new Tower(towerType, worldPosition);
    this.towers.push(tower);
    
    // Update grid
    this.grid.setCellType(gridPos.x, gridPos.y, CellType.TOWER);
    
    // Spend currency
    this.spendCurrency(cost);
    
    // Play tower placement sound
    this.audioHandler.playTowerPlace();
    
    return true;
  }

  // Wave management
  startNextWave(): boolean {
    if (this.waveManager.isWaveActive()) {
      return false;
    }
    
    const nextWave = this.waveManager.getNextWaveNumber();
    const started = this.waveManager.startWave(nextWave);
    if (started) {
      this.audioHandler.playWaveStart();
      this.audioHandler.resetWaveAudioFlags();
    }
    return started;
  }

  // Tower upgrades
  upgradeTower(tower: Tower, upgradeType: UpgradeType): boolean {
    const cost = tower.getUpgradeCost(upgradeType);
    
    if (!this.canAffordCurrency(cost)) {
      return false;
    }
    
    if (!tower.canUpgrade(upgradeType)) {
      return false;
    }
    
    if (tower.upgrade(upgradeType)) {
      this.spendCurrency(cost);
      this.audioHandler.playTowerUpgrade();
      return true;
    }
    
    return false;
  }

  // Mouse interaction
  handleMouseDown(event: MouseEvent): void {
    const screenPos = { x: event.offsetX, y: event.offsetY };
    const worldPos = this.camera.screenToWorld(screenPos);
    this.isMouseDown = true;
    
    if (this.engine.getState() !== GameState.PLAYING) {
      return;
    }
    
    // Check if clicking on player
    if (this.player.distanceTo(worldPos) <= this.player.radius) {
      // Trigger player upgrade panel (handled by UI)
      const playerClickEvent = new CustomEvent('playerClicked');
      document.dispatchEvent(playerClickEvent);
      return;
    }
    
    // Check if clicking on existing tower
    const clickedTower = this.towers.find(tower => 
      tower.distanceTo(worldPos) <= tower.radius
    );
    
    if (clickedTower) {
      // Select/deselect tower
      this.selectedTower = this.selectedTower === clickedTower ? null : clickedTower;
      this.selectedTowerType = null; // Clear tower placement mode
    } else if (this.selectedTowerType) {
      // Place new tower
      if (this.placeTower(this.selectedTowerType, worldPos)) {
        // Tower placed successfully
      }
    } else {
      // Manual shooting - start click and hold
      const projectile = this.player.handleMouseDown(worldPos);
      if (projectile) {
        this.projectiles.push(projectile);
      }
      this.selectedTower = null; // Deselect tower
    }
  }

  handleMouseUp(event: MouseEvent): void {
    this.isMouseDown = false;
    this.player.handleMouseUp();
  }

  handleMouseMove(event: MouseEvent): void {
    const screenPos = { x: event.offsetX, y: event.offsetY };
    const worldPos = this.camera.screenToWorld(screenPos);
    
    // Update mouse position for ghost tower rendering
    this.mousePosition = worldPos;
    
    // Update player aim position
    this.player.handleMouseMove(worldPos);
    
    // Find tower under mouse for range display
    this.hoverTower = this.towers.find(tower => 
      tower.distanceTo(worldPos) <= tower.radius
    ) || null;
  }

  // Alias for backward compatibility with tests
  handleMouseClick(event: MouseEvent): void {
    this.handleMouseDown(event);
  }

  handleKeyDown(key: string): void {
    // Forward movement keys to player
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      this.player.handleKeyDown(key);
    }
  }

  handleKeyUp(key: string): void {
    // Forward movement keys to player
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      this.player.handleKeyUp(key);
    }
  }

  // Getters for game state (inlined for performance)
  getCurrency(): number {
    return this.currency;
  }

  getLives(): number {
    return this.lives;
  }

  getScore(): number {
    return this.score;
  }

  // Inlined resource management methods
  private canAffordCurrency(cost: number): boolean {
    return this.currency >= cost;
  }

  private spendCurrency(amount: number): void {
    this.currency = Math.max(0, this.currency - amount);
  }

  private addCurrency(amount: number): void {
    this.currency += amount;
  }

  private loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
  }

  private addScore(points: number): void {
    this.score += points;
  }

  private isGameOver(): boolean {
    return this.lives <= 0;
  }

  getCurrentWave(): number {
    return this.waveManager.currentWave;
  }

  getTowers(): Tower[] {
    return [...this.towers];
  }

  getEnemies(): Enemy[] {
    return [...this.enemies];
  }

  getProjectiles(): Projectile[] {
    return [...this.projectiles];
  }

  getCollectibles(): Collectible[] {
    return [...this.collectibles];
  }

  // Backward compatibility methods
  getHealthPickups(): Collectible[] {
    return this.collectibles.filter(c => c.isHealthPickup());
  }

  getPowerUps(): Collectible[] {
    return this.collectibles.filter(c => c.isPowerUp());
  }

  getPlayerAimerLine(): { start: Vector2; end: Vector2 } | null {
    if (this.player.shouldShowAimer()) {
      return this.player.getAimerLine();
    }
    return null;
  }

  isWaveComplete(): boolean {
    return this.waveManager.isWaveComplete();
  }

  isGameOverPublic(): boolean {
    return this.isGameOver();
  }

  enemyReachedEnd(): void {
    this.loseLife();
  }

  enemyKilled(enemy: Enemy): void {
    this.addCurrency(enemy.reward);
    this.addScore(enemy.reward * CURRENCY_CONFIG.baseRewardMultiplier);
    
    // Chance to spawn collectible
    if (Collectible.shouldSpawnFromEnemy()) {
      const collectibleType = Collectible.getRandomType();
      const collectible = new Collectible(
        { ...enemy.position },
        collectibleType
      );
      this.collectibles.push(collectible);
    }
    
    // Extra currency drop chance
    if (Math.random() < SPAWN_CHANCES.extraCurrencyDrop) {
      this.addCurrency(enemy.reward * CURRENCY_CONFIG.extraDropMultiplier);
    }
  }

  setSelectedTowerType(towerType: TowerType | null): void {
    this.selectedTowerType = towerType;
  }

  getSelectedTowerType(): TowerType | null {
    return this.selectedTowerType;
  }

  getHoverTower(): Tower | null {
    return this.hoverTower;
  }

  getTowerCost(towerType: TowerType): number {
    return TOWER_COSTS[towerType as keyof typeof TOWER_COSTS];
  }

  canAffordTower(towerType: TowerType): boolean {
    return this.canAffordCurrency(TOWER_COSTS[towerType as keyof typeof TOWER_COSTS]);
  }

  // Game engine control
  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  start(): void {
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
  }

  isPaused(): boolean {
    return this.engine.isPaused();
  }

  // Additional getters
  getSelectedTower(): Tower | null {
    return this.selectedTower;
  }

  getUpgradeCost(tower: Tower, upgradeType: UpgradeType): number {
    return tower.getUpgradeCost(upgradeType);
  }

  canAffordUpgrade(tower: Tower, upgradeType: UpgradeType): boolean {
    const cost = tower.getUpgradeCost(upgradeType);
    return this.canAffordCurrency(cost);
  }

  // Player upgrade methods
  upgradePlayer(upgradeType: PlayerUpgradeType): boolean {
    const cost = this.player.getUpgradeCost(upgradeType);
    
    if (!this.canAffordCurrency(cost)) {
      return false;
    }
    
    if (!this.player.canUpgrade(upgradeType)) {
      return false;
    }
    
    if (this.player.upgrade(upgradeType)) {
      this.spendCurrency(cost);
      this.audioHandler.playPlayerLevelUp();
      return true;
    }
    
    return false;
  }

  getPlayerUpgradeCost(upgradeType: PlayerUpgradeType): number {
    return this.player.getUpgradeCost(upgradeType);
  }

  canAffordPlayerUpgrade(upgradeType: PlayerUpgradeType): boolean {
    const cost = this.player.getUpgradeCost(upgradeType);
    return this.canAffordCurrency(cost);
  }

  getPlayer(): Player {
    return this.player;
  }


  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  getAudioHandler(): GameAudioHandler {
    return this.audioHandler;
  }

  // Map generation methods
  getCurrentMapData(): MapData {
    return this.currentMapData;
  }

  getMapGenerator(): MapGenerator {
    return this.mapGenerator;
  }

  getTextureManager(): TextureManager {
    return this.textureManager;
  }

  regenerateMap(config?: MapGenerationConfig): void {
    // Generate new map with enhanced configuration if none provided
    const newConfig: MapGenerationConfig = config || this.generateEnhancedDefaultConfig();

    this.currentMapData = this.mapGenerator.generate(newConfig);
    
    // Clear existing entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    
    // Reset grid
    this.grid = new Grid(newConfig.width, newConfig.height, newConfig.cellSize);
    this.applyMapToGrid();
    
    // Update systems
    this.pathfinder = new Pathfinder(this.grid);
    
    // Update spawn position (recreate WaveManager with new spawn position)
    const spawnZone = this.currentMapData.spawnZones[0] || { x: 1, y: Math.floor(newConfig.height / 2) };
    const spawnWorldPos = this.grid.gridToWorld(spawnZone.x, spawnZone.y);
    this.waveManager = new WaveManager(spawnWorldPos);
    this.loadWaveConfigurations();
    
    // Reset player position
    const playerWorldPos = this.grid.gridToWorld(this.currentMapData.playerStart.x, this.currentMapData.playerStart.y);
    this.player.position = playerWorldPos;
    
    // Update camera bounds - note: this might need a method to update bounds
    // For now, we'll recreate the renderer with new grid and camera
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;
    // Camera bounds should be updated through existing update method
    this.camera.update(this.player.position);
    
    // Update renderer with new environmental effects
    this.renderer.setEnvironmentalEffects(this.currentMapData.effects);
    
    // Reset game state
    this.selectedTowerType = null;
    this.selectedTower = null;
    this.hoverTower = null;
    
    // Reset audio flags
    this.audioHandler.resetAllAudioFlags();
  }

  generateMapVariants(count: number): MapData[] {
    const baseConfig = this.generateEnhancedDefaultConfig();
    return this.mapGenerator.generateVariants(baseConfig, count);
  }

  // Enhanced default configuration with more interesting parameters
  private generateEnhancedDefaultConfig(): MapGenerationConfig {
    const mapSize = MapSize.LARGE; // Default to large size for rich gameplay
    const preset = MAP_SIZE_PRESETS[mapSize];
    
    if (!preset) {
      throw new Error(`Map size preset not found: ${mapSize}`);
    }
    
    // Random biome selection with weighted distribution
    const biomes = [
      BiomeType.FOREST,   // 25%
      BiomeType.DESERT,   // 25%
      BiomeType.ARCTIC,   // 20%
      BiomeType.VOLCANIC, // 20%
      BiomeType.GRASSLAND // 10%
    ];
    const biomeWeights = [0.25, 0.50, 0.70, 0.90, 1.0];
    const randomValue = Math.random();
    let selectedBiome: BiomeType = BiomeType.FOREST;
    
    for (let i = 0; i < biomeWeights.length; i++) {
      if (randomValue < biomeWeights[i]) {
        selectedBiome = biomes[i] ?? BiomeType.FOREST;
        break;
      }
    }

    const difficulty = MapDifficulty.MEDIUM;
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    return {
      width: preset.width,
      height: preset.height,
      cellSize: 32,
      biome: selectedBiome,
      difficulty,
      seed: Date.now(),
      pathComplexity: 0.85, // More winding paths for strategy (increased from 0.75)
      obstacleCount: Math.floor(preset.baseObstacles * difficultyMultiplier * 1.2), // 20% more obstacles
      decorationLevel: DecorationLevel.DENSE, // Rich visual environment
      enableWater: true,
      enableAnimations: true,
      chokePointCount: Math.floor(preset.baseChokePoints * difficultyMultiplier * 1.3), // 30% more choke points
      openAreaCount: Math.floor(preset.baseOpenAreas * 1.2), // 20% more open areas
      playerAdvantageSpots: Math.floor(preset.baseAdvantageSpots * 1.5) // 50% more advantage spots
    };
  }

  private getDifficultyMultiplier(difficulty: MapDifficulty): number {
    switch (difficulty) {
      case MapDifficulty.EASY: return 0.7;
      case MapDifficulty.MEDIUM: return 1.0;
      case MapDifficulty.HARD: return 1.3;
      case MapDifficulty.EXTREME: return 1.6;
      default: return 1.0;
    }
  }

  // Create map with specific size preset
  createMapWithSize(mapSize: MapSize, biome?: BiomeType, difficulty?: MapDifficulty): void {
    const preset = MAP_SIZE_PRESETS[mapSize];
    if (!preset) {
      throw new Error(`Map size preset not found: ${mapSize}`);
    }
    
    const selectedBiome: BiomeType = biome || this.getRandomBiome();
    const selectedDifficulty = difficulty || MapDifficulty.MEDIUM;
    const difficultyMultiplier = this.getDifficultyMultiplier(selectedDifficulty);

    const config: MapGenerationConfig = {
      width: preset.width,
      height: preset.height,
      cellSize: 32,
      biome: selectedBiome,
      difficulty: selectedDifficulty,
      seed: Date.now(),
      pathComplexity: 0.7 + (difficultyMultiplier - 1) * 0.2, // Scale complexity with difficulty
      obstacleCount: Math.floor(preset.baseObstacles * difficultyMultiplier),
      decorationLevel: DecorationLevel.DENSE,
      enableWater: true,
      enableAnimations: true,
      chokePointCount: Math.floor(preset.baseChokePoints * difficultyMultiplier),
      openAreaCount: preset.baseOpenAreas,
      playerAdvantageSpots: preset.baseAdvantageSpots
    };

    this.regenerateMap(config);
  }

  private getRandomBiome(): BiomeType {
    const biomes = [BiomeType.FOREST, BiomeType.DESERT, BiomeType.ARCTIC, BiomeType.VOLCANIC, BiomeType.GRASSLAND];
    return biomes[Math.floor(Math.random() * biomes.length)] ?? BiomeType.FOREST;
  }

  // Get current map size
  getCurrentMapSize(): MapSize {
    const width = this.currentMapData.metadata.width;
    const height = this.currentMapData.metadata.height;
    
    for (const [size, preset] of Object.entries(MAP_SIZE_PRESETS)) {
      if (preset.width === width && preset.height === height) {
        return size as MapSize;
      }
    }
    return MapSize.MEDIUM; // fallback
  }
}