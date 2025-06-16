import { GameEngine } from "./GameEngine";
import { GameState } from "./GameState";
import { Grid, CellType } from "@/systems/Grid";
import { Pathfinder } from "@/systems/Pathfinder";
import { WaveManager, SpawnPattern } from "@/systems/WaveManager";
import type { WaveConfig } from "@/systems/WaveManager";
import { SpawnZoneManager } from "@/systems/SpawnZoneManager";
import type { GameStateSnapshot } from "@/systems/SpawnZoneManager";
import { Renderer } from "@/systems/Renderer";
import { Camera, type CameraOptions } from "@/systems/Camera";
import { Tower, TowerType, UpgradeType } from "@/entities/Tower";
import { Enemy, EnemyType } from "@/entities/Enemy";
import { Projectile } from "@/entities/Projectile";
import { Player, PlayerUpgradeType } from "@/entities/Player";
import { Collectible } from "@/entities/Collectible";
import { CollectibleType } from "@/entities/items/ItemTypes";
import type { Vector2 } from "@/utils/Vector2";
import { AudioManager, SoundType } from "../audio/AudioManager";
import { MapGenerator } from "@/systems/MapGenerator";
import { TextureManager } from "@/systems/TextureManager";
import {
  BiomeType,
  MapDifficulty,
  DecorationLevel,
  MapSize,
  MAP_SIZE_PRESETS,
} from "@/types/MapData";
import type {
  MapData,
  MapGenerationConfig,
} from "@/types/MapData";
import {
  TOWER_COSTS,
  SPAWN_CHANCES,
  CURRENCY_CONFIG,
  INVENTORY_UPGRADES,
} from "../config/GameConfig";
import { GameAudioHandler } from "@/systems/GameAudioHandler";
import { ScoreManager, type GameStats } from "@/systems/ScoreManager";
import { Inventory, type InventoryItem } from "@/systems/Inventory";
import { EquipmentManager } from "@/entities/items/Equipment";

export class Game {
  private engine: GameEngine;
  private grid: Grid;
  private pathfinder: Pathfinder;
  private waveManager: WaveManager;
  private spawnZoneManager: SpawnZoneManager;

  // Inlined resource management for better performance
  private currency: number = 100;
  private lives: number = 10;
  private score: number = 0;

  // Game statistics tracking
  private gameStartTime: number = Date.now();
  private enemiesKilled: number = 0;
  private towersBuilt: number = 0;
  private inventoryUpgradesPurchased: number = 0;
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
  private inventory: Inventory;
  private equipment: EquipmentManager;

  private selectedTowerType: TowerType | null = null;
  private hoverTower: Tower | null = null;
  private selectedTower: Tower | null = null;
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private isMouseDown: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    mapConfig?: MapGenerationConfig,
    autoStart: boolean = true
  ) {
    // Initialize map generation systems
    this.mapGenerator = new MapGenerator();
    this.textureManager = new TextureManager();

    // Generate or use provided map configuration
    const config: MapGenerationConfig =
      mapConfig || this.generateEnhancedDefaultConfig();

    // Generate the map
    this.currentMapData = this.mapGenerator.generate(config);

    // Initialize grid with generated map size
    this.grid = new Grid(config.width, config.height, config.cellSize);

    // Apply generated map to grid
    this.applyMapToGrid();

    // Calculate world size
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;

    // Initialize camera with zoom options
    const cameraOptions: CameraOptions = {
      minZoom: 0.3,
      maxZoom: 3.0,
      zoomSpeed: 0.15,
      zoomSmoothing: 0.12,
    };
    this.camera = new Camera(
      canvas.width,
      canvas.height,
      worldWidth,
      worldHeight,
      cameraOptions
    );

    // Initialize systems
    this.pathfinder = new Pathfinder(this.grid);

    // Convert all spawn zones to world positions for wave manager
    const spawnWorldPositions = this.currentMapData.spawnZones.map((zone) =>
      this.grid.gridToWorld(zone.x, zone.y)
    );

    // Fallback to default position if no spawn zones
    if (spawnWorldPositions.length === 0) {
      const defaultZone = { x: 1, y: Math.floor(config.height / 2) };
      spawnWorldPositions.push(
        this.grid.gridToWorld(defaultZone.x, defaultZone.y)
      );
    }

    this.waveManager = new WaveManager(spawnWorldPositions);

    // Initialize SpawnZoneManager
    const spawnZoneConfig = {
      maxActiveZones:
        config.difficulty === MapDifficulty.EXTREME
          ? 5
          : config.difficulty === MapDifficulty.HARD
          ? 4
          : 3,
      chaosMode: config.difficulty === MapDifficulty.EXTREME,
      adaptiveWeighting: true,
      dynamicZoneGeneration: config.difficulty !== MapDifficulty.EASY,
    };

    this.spawnZoneManager = new SpawnZoneManager(this.grid, spawnZoneConfig);

    // Connect SpawnZoneManager to WaveManager
    this.waveManager.setSpawnZoneManager(this.spawnZoneManager);
    this.waveManager.enableDynamicSpawning(true);

    this.renderer = new Renderer(
      canvas,
      this.grid,
      this.camera,
      this.textureManager
    );
    this.renderer.setEnvironmentalEffects(this.currentMapData.effects);
    this.audioManager = new AudioManager();
    this.audioHandler = new GameAudioHandler(this.audioManager, this.camera);
    this.engine = new GameEngine();

    // Create player at generated start position
    const playerWorldPos = this.grid.gridToWorld(
      this.currentMapData.playerStart.x,
      this.currentMapData.playerStart.y
    );
    this.player = new Player(playerWorldPos);

    // Initialize inventory and equipment systems
    this.inventory = new Inventory({
      maxSlots: 20,
      autoSort: false,
      allowStacking: true,
    });
    this.equipment = new EquipmentManager();

    // Connect equipment to player for stat bonuses
    this.equipment.on("statsChanged", () => {
      this.applyEquipmentBonuses();
    });

    // Center camera on player initially (instant, no smoothing)
    this.camera.centerOnTarget(this.player.position);

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
    this.currentMapData.paths.forEach((path) => {
      path.waypoints.forEach((waypoint) => {
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
        enemies: [{ type: EnemyType.BASIC, count: 5, spawnDelay: 1000 }],
        startDelay: 2000,
        spawnPattern: SpawnPattern.SINGLE_POINT, // All from one spawn point
      },
      {
        waveNumber: 2,
        enemies: [{ type: EnemyType.BASIC, count: 8, spawnDelay: 800 }],
        startDelay: 3000,
        spawnPattern: SpawnPattern.RANDOM, // Random spawn points
      },
      {
        waveNumber: 3,
        enemies: [
          {
            type: EnemyType.BASIC,
            count: 5,
            spawnDelay: 1000,
            spawnPattern: SpawnPattern.DISTRIBUTED,
          },
          {
            type: EnemyType.FAST,
            count: 3,
            spawnDelay: 600,
            spawnPattern: SpawnPattern.EDGE_FOCUSED,
          },
        ],
        startDelay: 2000,
      },
      {
        waveNumber: 4,
        enemies: [
          { type: EnemyType.BASIC, count: 10, spawnDelay: 600 },
          { type: EnemyType.FAST, count: 5, spawnDelay: 800 },
        ],
        startDelay: 2000,
        spawnPattern: SpawnPattern.ROUND_ROBIN, // Cycle through spawn points
      },
      {
        waveNumber: 5,
        enemies: [
          {
            type: EnemyType.TANK,
            count: 3,
            spawnDelay: 2000,
            spawnPattern: SpawnPattern.CORNER_FOCUSED,
          },
          {
            type: EnemyType.FAST,
            count: 8,
            spawnDelay: 400,
            spawnPattern: SpawnPattern.RANDOM,
          },
        ],
        startDelay: 3000,
      },
      {
        waveNumber: 6,
        enemies: [
          { type: EnemyType.BASIC, count: 15, spawnDelay: 500 },
          { type: EnemyType.TANK, count: 2, spawnDelay: 2500 },
        ],
        startDelay: 2000,
        spawnPattern: SpawnPattern.DISTRIBUTED,
      },
      {
        waveNumber: 7,
        enemies: [
          {
            type: EnemyType.FAST,
            count: 12,
            spawnDelay: 400,
            spawnPattern: SpawnPattern.RANDOM,
          },
          {
            type: EnemyType.BASIC,
            count: 8,
            spawnDelay: 700,
            spawnPattern: SpawnPattern.EDGE_FOCUSED,
          },
          {
            type: EnemyType.TANK,
            count: 4,
            spawnDelay: 1800,
            spawnPattern: SpawnPattern.CORNER_FOCUSED,
          },
        ],
        startDelay: 3000,
      },
      {
        waveNumber: 8,
        enemies: [
          { type: EnemyType.BASIC, count: 20, spawnDelay: 400 },
          { type: EnemyType.FAST, count: 10, spawnDelay: 500 },
          { type: EnemyType.TANK, count: 5, spawnDelay: 1500 },
        ],
        startDelay: 2000,
        spawnPattern: SpawnPattern.BURST_SPAWN, // New pattern - enemies spawn from multiple edges simultaneously
      },
      {
        waveNumber: 9,
        enemies: [
          { type: EnemyType.FAST, count: 15, spawnDelay: 300 },
          { type: EnemyType.TANK, count: 6, spawnDelay: 1200 },
        ],
        startDelay: 2500,
        spawnPattern: SpawnPattern.PINCER_MOVEMENT, // New pattern - enemies spawn from opposite edges
      },
      {
        waveNumber: 10,
        enemies: [
          { type: EnemyType.BASIC, count: 25, spawnDelay: 300 },
          { type: EnemyType.FAST, count: 15, spawnDelay: 400 },
          { type: EnemyType.TANK, count: 8, spawnDelay: 1000 },
        ],
        startDelay: 3000,
        spawnPattern: SpawnPattern.CHAOS_MODE, // New pattern - completely random spawning
      },
    ];

    this.waveManager.loadWaves(waves);
  }

  update = (deltaTime: number): void => {
    if (this.engine.getState() !== GameState.PLAYING) {
      return;
    }

    // Check for game over
    if (this.isGameOver()) {
      this.handleGameOver();
      return;
    }

    // Update SpawnZoneManager
    const gameStateSnapshot: GameStateSnapshot = {
      lives: this.lives,
      score: this.score,
      waveNumber: this.waveManager.currentWave,
      enemyCount: this.enemies.length,
      towerCount: this.towers.length,
      playerPosition: { ...this.player.position },
    };
    this.spawnZoneManager.update(
      deltaTime,
      gameStateSnapshot,
      this.towers,
      this.player
    );

    // Update wave manager and spawn enemies
    const newEnemies = this.waveManager.update(deltaTime);
    newEnemies.forEach((enemy) => {
      // Set enemy to target player instead of following path
      enemy.setTarget(this.player);
      this.enemies.push(enemy);
    });

    // Update enemies
    this.enemies.forEach((enemy) => {
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
      this.handleGameOver();
      return;
    }

    // Update towers and generate projectiles
    this.towers.forEach((tower) => {
      const newProjectiles = tower.updateAndShoot(this.enemies, deltaTime);
      if (newProjectiles.length > 0) {
        this.audioHandler.playTowerShoot(tower.position);
      }
      this.projectiles.push(...newProjectiles);
    });

    // Update projectiles
    this.projectiles.forEach((projectile) => {
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
      if (
        !projectile.isAlive &&
        projectile.target &&
        !projectile.hitSoundPlayed
      ) {
        projectile.hitSoundPlayed = true;
        const wasKilled = !projectile.target.isAlive;
        this.audioHandler.handleEnemyDamage(projectile.target, wasKilled);
        if (wasKilled) {
          this.enemyKilled(projectile.target);
        }
      }
    });

    // Update collectibles
    this.collectibles.forEach((collectible) => {
      collectible.update(deltaTime);
      if (collectible.tryCollectByPlayer(this.player)) {
        // Generate item for inventory
        const item = Collectible.generateItemFromCollectible(
          collectible.collectibleType
        );

        // Try to add to inventory first
        if (this.inventory.addItem(item)) {
          // Item added to inventory successfully
          this.audioHandler.playPowerUpPickup();
          this.showItemPickupNotification(item);
        } else {
          // Inventory full, apply immediate effect instead
          this.showInventoryFullNotification(item);
          if (collectible.isHealthPickup()) {
            this.audioHandler.playHealthPickup();
          } else if (
            collectible.collectibleType === CollectibleType.EXTRA_CURRENCY
          ) {
            this.audioHandler.playPowerUpPickup();
            this.addCurrency(CURRENCY_CONFIG.powerUpBonus);
          } else {
            this.audioHandler.playPowerUpPickup();
          }
        }
      }
    });

    // Clean up dead entities (inlined from EntityCleaner)
    this.enemies = this.enemies.filter((enemy) => enemy.isAlive);
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.isAlive
    );
    this.collectibles = this.collectibles.filter(
      (collectible) => collectible.isActive
    );
    this.towers = this.towers.filter((tower) => tower.isAlive);

    // Check for wave completion and victory
    if (this.waveManager.isWaveComplete()) {
      if (!this.waveManager.hasNextWave()) {
        this.audioHandler.playVictory();
        this.handleVictory();
      } else {
        this.audioHandler.playWaveComplete();
      }
    }
  };

  private handleGameOver(): void {
    this.saveGameStats(false);
    this.engine.gameOver();
  }

  private handleVictory(): void {
    this.saveGameStats(true);
    this.engine.victory();
  }

  private saveGameStats(victory: boolean): void {
    const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const playerLevel = this.calculatePlayerLevel();

    const stats: GameStats = {
      score: this.score,
      wave: this.waveManager.currentWave,
      currency: this.currency,
      enemiesKilled: this.enemiesKilled,
      towersBuilt: this.towersBuilt,
      playerLevel,
      gameTime,
      date: Date.now(),
      mapBiome: this.currentMapData.biomeConfig.type,
      mapDifficulty: this.currentMapData.metadata.difficulty || "MEDIUM",
    };

    ScoreManager.saveScore(stats);

    // Dispatch event for UI to handle
    const gameEndEvent = new CustomEvent("gameEnd", {
      detail: {
        stats,
        victory,
        scoreEntry: ScoreManager.saveScore(stats),
      },
    });
    document.dispatchEvent(gameEndEvent);
  }

  private calculatePlayerLevel(): number {
    const player = this.player;
    const totalUpgrades = [
      player.getUpgradeLevel(PlayerUpgradeType.DAMAGE),
      player.getUpgradeLevel(PlayerUpgradeType.SPEED),
      player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE),
      player.getUpgradeLevel(PlayerUpgradeType.HEALTH),
    ].reduce((sum, level) => sum + level, 0);

    return Math.max(1, totalUpgrades);
  }

  render = (deltaTime: number): void => {
    // Render main scene including player
    this.renderer.renderScene(
      this.towers,
      this.enemies,
      this.projectiles,
      this.collectibles,
      [], // effects (empty for now)
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
      this.renderer.renderTowerUpgradePanel(this.selectedTower, 10, 150);
    }

    // Render tower ghost preview when placing towers
    if (
      this.selectedTowerType &&
      this.engine.getState() === GameState.PLAYING
    ) {
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

    // Track towers built
    this.towersBuilt++;

    // Update grid - walls are obstacles, other towers are towers
    if (towerType === TowerType.WALL) {
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.OBSTACLE);
    } else {
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.TOWER);
    }

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
      const playerClickEvent = new CustomEvent("playerClicked");
      document.dispatchEvent(playerClickEvent);
      return;
    }

    // Check if clicking on existing tower
    const clickedTower = this.towers.find(
      (tower) => tower.distanceTo(worldPos) <= tower.radius
    );

    if (clickedTower) {
      // Select/deselect tower
      this.selectedTower =
        this.selectedTower === clickedTower ? null : clickedTower;
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
    this.hoverTower =
      this.towers.find((tower) => tower.distanceTo(worldPos) <= tower.radius) ||
      null;
  }

  // Alias for backward compatibility with tests
  handleMouseClick(event: MouseEvent): void {
    this.handleMouseDown(event);
  }

  handleKeyDown(key: string): void {
    // Forward movement keys to player
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(key)
    ) {
      this.player.handleKeyDown(key);
    }

    // Handle zoom controls
    switch (key) {
      case "=":
      case "+":
        this.zoomIn();
        break;
      case "-":
      case "_":
        this.zoomOut();
        break;
      case "0":
        this.setZoom(1.0); // Reset to default zoom
        break;
      case "f":
      case "F":
        this.zoomToFit();
        break;
      case "c":
      case "C":
        this.toggleCameraFollow();
        break;
    }
  }

  handleKeyUp(key: string): void {
    // Forward movement keys to player
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(key)
    ) {
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

  public addCurrency(amount: number): void {
    this.currency += amount;
  }

  // Public method for testing
  public setCurrency(amount: number): void {
    this.currency = amount;
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
    return this.collectibles.filter((c) => c.isHealthPickup());
  }

  getPowerUps(): Collectible[] {
    return this.collectibles.filter((c) => c.isPowerUp());
  }

  // Inventory and Equipment system accessors
  getInventory(): Inventory {
    return this.inventory;
  }

  getEquipment(): EquipmentManager {
    return this.equipment;
  }

  // Item usage methods
  useInventoryItem(slotIndex: number, quantity: number = 1): boolean {
    const item = this.inventory.useItem(slotIndex, quantity);
    if (!item) return false;

    // Apply item effects based on type
    switch (item.type) {
      case "CONSUMABLE":
        return this.applyConsumableEffect(item);
      case "EQUIPMENT":
        return this.equipItem(item);
      default:
        return false;
    }
  }

  // Inventory upgrade system
  getInventoryUpgradeCost(): number {
    if (this.inventoryUpgradesPurchased >= INVENTORY_UPGRADES.maxUpgrades) {
      return -1; // No more upgrades available
    }

    return Math.floor(
      INVENTORY_UPGRADES.baseCost *
        Math.pow(
          INVENTORY_UPGRADES.costMultiplier,
          this.inventoryUpgradesPurchased
        )
    );
  }

  canUpgradeInventory(): boolean {
    const cost = this.getInventoryUpgradeCost();
    return cost > 0 && this.currency >= cost;
  }

  purchaseInventoryUpgrade(): boolean {
    if (!this.canUpgradeInventory()) {
      return false;
    }

    const cost = this.getInventoryUpgradeCost();
    this.currency -= cost;
    this.inventoryUpgradesPurchased++;

    // Expand inventory
    const newMaxSlots =
      20 + this.inventoryUpgradesPurchased * INVENTORY_UPGRADES.slotsPerUpgrade;
    this.expandInventory(newMaxSlots);

    this.audioManager.playSound(SoundType.TOWER_PLACE);
    return true;
  }

  private expandInventory(newMaxSlots: number): void {
    // Get current inventory state
    const currentState = this.inventory.getState();

    // Create expanded slots array
    const expandedSlots = Array.from({ length: newMaxSlots }, (_, index) => {
      if (index < currentState.slots.length) {
        return currentState.slots[index];
      }
      return { item: null, slotIndex: index };
    }).filter((slot): slot is { item: InventoryItem | null; slotIndex: number } => slot !== undefined);

    // Update inventory configuration and restore state with new capacity
    this.inventory.setState({
      ...currentState,
      slots: expandedSlots,
      config: {
        maxSlots: newMaxSlots,
        autoSort: false,
        allowStacking: true,
      },
    });
  }

  getInventoryUpgradeInfo(): {
    purchased: number;
    maxUpgrades: number;
    nextCost: number;
    currentSlots: number;
    maxPossibleSlots: number;
  } {
    return {
      purchased: this.inventoryUpgradesPurchased,
      maxUpgrades: INVENTORY_UPGRADES.maxUpgrades,
      nextCost: this.getInventoryUpgradeCost(),
      currentSlots: this.inventory.getStatistics().totalSlots,
      maxPossibleSlots:
        20 +
        INVENTORY_UPGRADES.maxUpgrades * INVENTORY_UPGRADES.slotsPerUpgrade,
    };
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

    // Track enemies killed
    this.enemiesKilled++;
    
    // Award experience to player if they have the addExperience method
    if (this.player && 'addExperience' in this.player && typeof this.player.addExperience === 'function') {
      // Award experience based on enemy reward (could be adjusted)
      const experienceGain = enemy.reward * 10; // 10 XP per currency reward
      (this.player as any).addExperience(experienceGain);
    }

    // Enhanced item drop system
    const dropRate = this.getEnemyDropRate(enemy);
    const numDrops = this.getNumDropsForEnemy(enemy);

    for (let i = 0; i < numDrops; i++) {
      if (Collectible.shouldSpawnItem(dropRate)) {
        // 70% chance for new inventory items, 30% chance for traditional collectibles
        if (Math.random() < 0.7) {
          // Spawn new item types as collectibles
          const randomItem = Collectible.generateRandomItem();
          // Create a special collectible that represents the item
          const position = {
            x: enemy.position.x + (Math.random() - 0.5) * 40, // Spread out multiple drops
            y: enemy.position.y + (Math.random() - 0.5) * 40,
          };
          const collectible = new Collectible(
            position,
            this.getCollectibleTypeForItem(randomItem)
          );
          this.collectibles.push(collectible);
        } else {
          // Traditional collectible system
          const collectibleType = Collectible.getRandomType();
          const position = {
            x: enemy.position.x + (Math.random() - 0.5) * 40,
            y: enemy.position.y + (Math.random() - 0.5) * 40,
          };
          const collectible = new Collectible(position, collectibleType);
          this.collectibles.push(collectible);
        }
      }
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

  getGameState(): GameState {
    return this.engine.getState();
  }

  getTowerCost(towerType: TowerType): number {
    return TOWER_COSTS[towerType as keyof typeof TOWER_COSTS];
  }

  canAffordTower(towerType: TowerType): boolean {
    return this.canAffordCurrency(
      TOWER_COSTS[towerType as keyof typeof TOWER_COSTS]
    );
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
    const newConfig: MapGenerationConfig =
      config || this.generateEnhancedDefaultConfig();

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

    // Update spawn positions (recreate WaveManager with all spawn positions)
    const spawnWorldPositions = this.currentMapData.spawnZones.map((zone) =>
      this.grid.gridToWorld(zone.x, zone.y)
    );

    // Fallback to default position if no spawn zones
    if (spawnWorldPositions.length === 0) {
      const defaultZone = { x: 1, y: Math.floor(newConfig.height / 2) };
      spawnWorldPositions.push(
        this.grid.gridToWorld(defaultZone.x, defaultZone.y)
      );
    }

    this.waveManager = new WaveManager(spawnWorldPositions);
    this.loadWaveConfigurations();

    // Reset player position
    const playerWorldPos = this.grid.gridToWorld(
      this.currentMapData.playerStart.x,
      this.currentMapData.playerStart.y
    );
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
      BiomeType.FOREST, // 25%
      BiomeType.DESERT, // 25%
      BiomeType.ARCTIC, // 20%
      BiomeType.VOLCANIC, // 20%
      BiomeType.GRASSLAND, // 10%
    ];
    const biomeWeights = [0.25, 0.5, 0.7, 0.9, 1.0];
    const randomValue = Math.random();
    let selectedBiome: BiomeType = BiomeType.FOREST;

    for (let i = 0; i < biomeWeights.length; i++) {
      if (randomValue < biomeWeights[i]!) {
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
      obstacleCount: Math.floor(
        preset.baseObstacles * difficultyMultiplier * 1.2
      ), // 20% more obstacles
      decorationLevel: DecorationLevel.DENSE, // Rich visual environment
      enableWater: true,
      enableAnimations: true,
      chokePointCount: Math.floor(
        preset.baseChokePoints * difficultyMultiplier * 1.3
      ), // 30% more choke points
      openAreaCount: Math.floor(preset.baseOpenAreas * 1.2), // 20% more open areas
      playerAdvantageSpots: Math.floor(preset.baseAdvantageSpots * 1.5), // 50% more advantage spots
    };
  }

  private getDifficultyMultiplier(difficulty: MapDifficulty): number {
    switch (difficulty) {
      case MapDifficulty.EASY:
        return 0.7;
      case MapDifficulty.MEDIUM:
        return 1.0;
      case MapDifficulty.HARD:
        return 1.3;
      case MapDifficulty.EXTREME:
        return 1.6;
      default:
        return 1.0;
    }
  }

  // Create map with specific size preset
  createMapWithSize(
    mapSize: MapSize,
    biome?: BiomeType,
    difficulty?: MapDifficulty
  ): void {
    const preset = MAP_SIZE_PRESETS[mapSize];
    if (!preset) {
      throw new Error(`Map size preset not found: ${mapSize}`);
    }

    const selectedBiome: BiomeType = biome || this.getRandomBiome();
    const selectedDifficulty = difficulty || MapDifficulty.MEDIUM;
    const difficultyMultiplier =
      this.getDifficultyMultiplier(selectedDifficulty);

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
      chokePointCount: Math.floor(
        preset.baseChokePoints * difficultyMultiplier
      ),
      openAreaCount: preset.baseOpenAreas,
      playerAdvantageSpots: preset.baseAdvantageSpots,
    };

    this.regenerateMap(config);
  }

  private getRandomBiome(): BiomeType {
    const biomes = [
      BiomeType.FOREST,
      BiomeType.DESERT,
      BiomeType.ARCTIC,
      BiomeType.VOLCANIC,
      BiomeType.GRASSLAND,
    ];
    return (
      biomes[Math.floor(Math.random() * biomes.length)] ?? BiomeType.FOREST
    );
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

  // Camera and zoom control methods
  getCamera(): Camera {
    return this.camera;
  }

  // Zoom controls
  zoomIn(): void {
    this.camera.zoomIn();
  }

  zoomOut(): void {
    this.camera.zoomOut();
  }

  setZoom(zoom: number): void {
    this.camera.setZoom(zoom);
  }

  getZoom(): number {
    return this.camera.getZoom();
  }

  zoomToFit(): void {
    this.camera.zoomToFit();
  }

  resetCameraToPlayer(): void {
    this.camera.setFollowTarget(true);
  }

  toggleCameraFollow(): boolean {
    const newFollowState = !this.camera.isFollowingTarget();
    this.camera.setFollowTarget(newFollowState);
    return newFollowState;
  }

  // Game statistics getters
  getGameStats(): GameStats {
    const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const playerLevel = this.calculatePlayerLevel();

    return {
      score: this.score,
      wave: this.waveManager.currentWave,
      currency: this.currency,
      enemiesKilled: this.enemiesKilled,
      towersBuilt: this.towersBuilt,
      playerLevel,
      gameTime,
      date: Date.now(),
      mapBiome: this.currentMapData.biomeConfig.type,
      mapDifficulty: this.currentMapData.metadata.difficulty || "MEDIUM",
    };
  }

  // Inventory and Equipment helper methods
  private applyConsumableEffect(item: InventoryItem): boolean {
    const metadata = item.metadata;

    switch (item.id) {
      case "health_potion_small":
      case "health_potion_large":
        if (metadata.healAmount) {
          this.player.heal(metadata.healAmount);
          this.audioManager.playSound(SoundType.HEALTH_PICKUP);
          return true;
        }
        break;

      case "damage_elixir":
        if (metadata.damageBonus && metadata.duration) {
          this.player.addTemporaryDamageBoost(
            1 + metadata.damageBonus,
            metadata.duration
          );
          this.audioManager.playSound(SoundType.POWERUP_PICKUP);
          return true;
        }
        break;

      case "speed_potion":
        if (metadata.speedBonus && metadata.duration) {
          this.player.addTemporarySpeedBoost(
            1 + metadata.speedBonus,
            metadata.duration
          );
          this.audioManager.playSound(SoundType.POWERUP_PICKUP);
          return true;
        }
        break;

      case "shield_scroll":
        if (metadata.duration) {
          this.player.addShield(metadata.duration);
          this.audioManager.playSound(SoundType.POWERUP_PICKUP);
          return true;
        }
        break;
    }

    return false;
  }

  private equipItem(item: InventoryItem): boolean {
    if (item.metadata.equipmentSlot) {
      const success = this.equipment.equipItem(item);
      if (success) {
        this.audioManager.playSound(SoundType.TOWER_PLACE);
      }
      return success;
    }
    return false;
  }

  private applyEquipmentBonuses(): void {
    const bonuses = this.equipment.getTotalStats();

    // Apply bonuses to player
    this.player.applyEquipmentBonuses({
      damageMultiplier: 1 + (bonuses.damageBonus || 0),
      healthMultiplier: 1 + (bonuses.healthBonus || 0),
      speedMultiplier: 1 + (bonuses.speedBonus || 0),
      fireRateMultiplier: 1 + (bonuses.fireRateBonus || 0),
    });
  }

  // Enhanced item drop system helpers
  private getEnemyDropRate(enemy: Enemy): number {
    // Base drop rate varies by enemy type and wave
    const baseRate = 0.25; // 25% base chance
    const waveBonus = Math.min(this.waveManager.currentWave * 0.02, 0.15); // Up to +15% at wave 8+

    // Different enemy types have different drop rates
    let enemyMultiplier = 1.0;
    if (enemy.enemyType === EnemyType.FAST) {
      enemyMultiplier = 0.8; // Fast enemies drop less
    } else if (enemy.enemyType === EnemyType.TANK) {
      enemyMultiplier = 1.5; // Tank enemies drop more
    } else if (enemy.enemyType === EnemyType.BASIC) {
      enemyMultiplier = 1.0; // Basic enemies have normal drop rate
    }

    return Math.min(baseRate + waveBonus, 0.6) * enemyMultiplier;
  }

  private getNumDropsForEnemy(enemy: Enemy): number {
    // Most enemies drop 1 item, but stronger enemies can drop more
    if (enemy.enemyType === EnemyType.TANK) {
      return Math.random() < 0.3 ? 2 : 1; // 30% chance for 2 items
    } else if (enemy.enemyType === EnemyType.FAST) {
      return 1; // Fast enemies always drop 1 item
    } else {
      return Math.random() < 0.1 ? 2 : 1; // Basic enemies have 10% chance for 2 items
    }
  }

  private getCollectibleTypeForItem(item: InventoryItem): CollectibleType {
    // Map item types to appropriate collectible types for visual representation
    switch (item.type) {
      case "CONSUMABLE":
        if (item.id.includes("health")) return CollectibleType.HEALTH;
        if (item.id.includes("damage")) return CollectibleType.EXTRA_DAMAGE;
        if (item.id.includes("speed")) return CollectibleType.SPEED_BOOST;
        if (item.id.includes("shield")) return CollectibleType.SHIELD;
        return CollectibleType.FASTER_SHOOTING;
      case "EQUIPMENT":
        return CollectibleType.EXTRA_DAMAGE; // Equipment represented as damage boost visually
      case "SPECIAL":
        return CollectibleType.EXTRA_CURRENCY;
      default:
        return CollectibleType.HEALTH;
    }
  }

  // Handle mouse wheel for zooming
  handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    // Determine zoom direction and factor
    const zoomIn = event.deltaY < 0;
    const zoomFactor = 0.15;

    // Simple zoom without center point for now (can be enhanced later)
    if (zoomIn) {
      this.camera.zoomIn(zoomFactor);
    } else {
      this.camera.zoomOut(zoomFactor);
    }
  }

  // Handle camera panning (when not following player)
  panCamera(deltaX: number, deltaY: number): void {
    this.camera.pan(deltaX, deltaY);
  }

  // Show item pickup notification
  private showItemPickupNotification(item: InventoryItem): void {
    // Create a simple notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
      animation: slideDown 0.3s ease-out;
      border: 1px solid #4CAF50;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    // Create icon based on item type
    const getItemIcon = (item: InventoryItem): string => {
      if (item.type === "CONSUMABLE") {
        if (item.id.includes("health")) return "❤️";
        if (item.id.includes("damage")) return "⚔️";
        if (item.id.includes("speed")) return "💨";
        if (item.id.includes("shield")) return "🛡️";
        return "✨";
      }
      if (item.type === "EQUIPMENT") return "🗡️";
      if (item.type === "MATERIAL") return "🔧";
      return "⭐";
    };

    const icon = getItemIcon(item);
    notification.innerHTML = `${icon} ${item.name} added to inventory`;

    // Add animation styles
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
      }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      notification.style.animation = "slideUp 0.3s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 2000);
  }

  // Show inventory full notification
  private showInventoryFullNotification(item: InventoryItem): void {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 193, 7, 0.9);
      color: #000;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
      animation: slideDown 0.3s ease-out;
      border: 1px solid #FFC107;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    notification.innerHTML = `⚠️ Inventory full! ${item.name} used immediately`;

    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      notification.style.animation = "slideUp 0.3s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}
