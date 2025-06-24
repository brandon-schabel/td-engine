import { GameEngine } from "./GameEngine";
import { GameState } from "./GameState";
import { Grid, CellType } from "@/systems/Grid";
// import { Pathfinder } from "@/systems/Pathfinder"; // Unused import removed
import { WaveManager, SpawnPattern } from "@/systems/WaveManager";
import type { WaveConfig } from "@/systems/WaveManager";
import { SpawnZoneManager } from "@/systems/SpawnZoneManager";
import type { GameStateSnapshot } from "@/systems/SpawnZoneManager";
import { Renderer } from "@/systems/Renderer";
import { Camera, type CameraOptions } from "@/systems/Camera";
import { CameraDiagnostics } from "@/systems/CameraDiagnostics";
import { Tower, TowerType, UpgradeType } from "@/entities/Tower";
import { Enemy, EnemyType } from "@/entities/Enemy";
import { Entity, EntityType } from "@/entities/Entity";
import { Projectile } from "@/entities/Projectile";
import { Player, PlayerUpgradeType } from "@/entities/Player";
import { Collectible } from "@/entities/Collectible";
import { CollectibleType } from "@/entities/items/ItemTypes";
import { DestructionEffect } from "@/effects/DestructionEffect";
import type { Vector2 } from "@/utils/Vector2";
import { AudioManager, SoundType } from "../audio/AudioManager";
import { MapGenerator } from "@/systems/MapGenerator";
import { GAME_INIT } from "@/config/GameConfig";
import { GAMEPLAY_CONSTANTS } from "@/config/GameplayConstants";
import { INVENTORY_CONFIG, INVENTORY_UPGRADES } from "@/config/InventoryConfig";
import { COLLECTIBLE_DROP_CHANCES } from "@/config/ItemConfig";
import { TextureManager } from "@/systems/TextureManager";
import { ANIMATION_CONFIG } from "@/config/AnimationConfig";
import { CAMERA_CONFIG } from "@/config/UIConfig";
import {
  BiomeType,
  MapDifficulty,
  DecorationLevel,
  MapSize,
  MAP_SIZE_PRESETS,
} from "@/types/MapData";
import type { MapData, MapGenerationConfig } from "@/types/MapData";
import {
  TOWER_COSTS,
  CURRENCY_CONFIG,
  INFINITE_WAVE_CONFIG,
} from "../config/GameConfig";
import { GameAudioHandler } from "@/systems/GameAudioHandler";
import { ScoreManager, type GameStats } from "@/systems/ScoreManager";
import { Inventory, type InventoryItem } from "@/systems/Inventory";
import { EquipmentManager } from "@/entities/items/Equipment";
// Removed unused UIManager and PopupManager imports
import { TowerUpgradeUI } from "@/ui/floating/TowerUpgradeUI";
import { FloatingUIManager } from "@/ui/floating";
import { UIController } from "@/ui/UIController";
import { TouchGestureManager } from "@/input/TouchGestureManager";
// import { TerrainDebug } from "@/debug/TerrainDebug"; // Commented out - unused
import { NavigationGrid } from "@/systems/NavigationGrid";

export class Game {
  private engine: GameEngine;
  private grid: Grid;
  private navigationGrid: NavigationGrid;
  // private pathfinder: Pathfinder; // Unused - commented out to fix TypeScript error
  private waveManager: WaveManager;
  private spawnZoneManager: SpawnZoneManager;
  private canvas: HTMLCanvasElement;
  private touchGestureManager: TouchGestureManager | null = null;

  // Inlined resource management for better performance
  private currency: number = GAME_INIT.startingCurrency;
  private lives: number = GAME_INIT.startingLives;
  private score: number = GAME_INIT.startingScore;

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
  private cameraDiagnostics: CameraDiagnostics;

  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private player: Player;
  private collectibles: Collectible[] = [];
  private inventory: Inventory;
  private equipment: EquipmentManager;
  private destructionEffects: DestructionEffect[] = [];
  // Removed unused uiManager - all UI handled by floatingUIManager
  private floatingUIManager: FloatingUIManager;
  private uiController: UIController;
  private powerUpDisplay: any = null; // Reference to PowerUpDisplay for notifications
  private playerLevelDisplay: any = null; // Reference to PlayerLevelDisplay for notifications

  private selectedTowerType: TowerType | null = null;
  private hoverTower: Tower | null = null;
  private selectedTower: Tower | null = null;
  private currentTowerUpgradeUI: TowerUpgradeUI | null = null;
  private mousePosition: Vector2 = { x: 0, y: 0 };
  // private isMouseDown: boolean = false; // Unused - commented out to fix TypeScript error
  private waveCompleteProcessed: boolean = false;
  private justSelectedTower: boolean = false; // Flag to prevent immediate deselection
  private justSelectedTowerType: boolean = false; // Flag to prevent immediate placement after menu selection
  private firstRenderLogged: boolean = false;
  private lastPlayerPosition: Vector2 | null = null; // Track player position for movement detection


  constructor(
    canvas: HTMLCanvasElement,
    mapConfig?: MapGenerationConfig,
    autoStart: boolean = true
  ) {
    this.canvas = canvas;

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
    
    // Initialize navigation grid
    this.navigationGrid = new NavigationGrid(this.grid);

    // Calculate world size
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;

    // Initialize camera with zoom options from configuration
    const cameraOptions: CameraOptions = {
      minZoom: CAMERA_CONFIG.minZoom,
      maxZoom: CAMERA_CONFIG.maxZoom,
      zoomSpeed: CAMERA_CONFIG.zoomSpeed,
      zoomSmoothing: CAMERA_CONFIG.zoomSmoothing,
      smoothing: CAMERA_CONFIG.smoothing,
    };

    // Get logical dimensions for camera (accounting for pixel ratio scaling)
    // This is critical: when the canvas context is scaled by pixelRatio,
    // all coordinate calculations must use logical dimensions, not pixel dimensions
    const pixelRatio = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / pixelRatio;
    const logicalHeight = canvas.height / pixelRatio;

    console.log("Initializing camera with logical dimensions:", logicalWidth, "x", logicalHeight);
    console.log("Canvas pixel dimensions:", canvas.width, "x", canvas.height);
    console.log("Pixel ratio:", pixelRatio);

    this.camera = new Camera(
      logicalWidth,
      logicalHeight,
      worldWidth,
      worldHeight,
      cameraOptions
    );

    // Initialize camera diagnostics
    this.cameraDiagnostics = new CameraDiagnostics(this.camera);

    // Initialize systems
    // this.pathfinder = new Pathfinder(this.grid); // Unused - commented out to fix TypeScript error

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

    // Add damage callback for player
    this.player.onDamage = (event) => {
      if (event) {
        this.floatingUIManager.createDamageNumber(
          event.entity,
          event.actualDamage,
          'normal'
        );
      }
    };

    // Initialize inventory and equipment systems
    this.inventory = new Inventory({
      maxSlots: INVENTORY_CONFIG.defaultSlots,
      autoSort: INVENTORY_CONFIG.autoSortEnabled,
      allowStacking: INVENTORY_CONFIG.stackingEnabled,
    });
    this.equipment = new EquipmentManager();

    // Connect equipment to player for stat bonuses
    this.equipment.on("statsChanged", () => {
      this.applyEquipmentBonuses();
    });

    // Center camera on player initially (instant, no smoothing)
    this.camera.centerOnTarget(this.player.position);

    // Initialize floating UI manager with camera
    this.floatingUIManager = new FloatingUIManager(canvas, this.camera);
    this.uiController = new UIController(this);
    
    // Initialize touch gesture manager for mobile/touch devices
    if ('ontouchstart' in window) {
      this.touchGestureManager = new TouchGestureManager(this, canvas);
      
      // Listen for gesture events
      this.touchGestureManager.on('swipe', (data) => {
        console.log('Swipe detected:', data.direction);
      });
      
      this.touchGestureManager.on('doubleTap', () => {
        console.log('Double tap - centering on player');
      });
      
      // Initialize last player position
      this.lastPlayerPosition = { ...this.player.position };
    }

    // Create health bar for player that follows them in world space
    this.uiController.createHealthBar(this.player, {
      width: 60,
      height: 8,
      offset: { x: 0, y: -30 },
      showValue: true,
      color: '#4CAF50'
    });

    // Load wave configurations
    this.loadWaveConfigurations();

    // Set up game loop callbacks
    this.engine.onUpdate(this.update.bind(this));
    this.engine.onRender(this.render.bind(this));

    // Start the game engine (unless disabled for testing)
    if (autoStart) {
      this.engine.start();

      // Run initial camera diagnostic after a short delay
      setTimeout(() => {
        console.log("=== INITIAL CAMERA CHECK ===");
        this.checkCamera();
        const cameraInfo = this.camera.getCameraInfo();
        console.log("Camera follow mode:", cameraInfo.followTarget ? "ENABLED" : "DISABLED");
        console.log("Press 'B' to check camera, 'N' to fix camera, 'Shift+V' to toggle visual debug");
        
        // Enable pathfinding debug
        const PathfindingDebug = (window as any).PathfindingDebug;
        if (PathfindingDebug) {
          PathfindingDebug.enable();
          console.log("=== PATHFINDING DEBUG ENABLED ===");
          console.log("Press 'P' to toggle enemy paths visualization");
          console.log("Press 'G' to toggle navigation grid visualization");
        }
      }, ANIMATION_CONFIG.durations.slowest);
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
    
    // Apply terrain cells (water, rough terrain, bridges)
    if (this.currentMapData.terrainCells && this.currentMapData.terrainCells.length > 0) {
      this.currentMapData.terrainCells.forEach(terrainCell => {
        this.grid.setCellType(terrainCell.x, terrainCell.y, terrainCell.type as CellType);
      });
    }
  }

  private loadWaveConfigurations(): void {
    // Use inline wave configuration to avoid circular imports
    // Calculate spawn delays based on centralized constants
    const { spawnInterval } = GAMEPLAY_CONSTANTS.waves;
    const getSpawnDelay = (enemyType: string, waveNumber: number) => {
      // Scale spawn delay based on enemy type and wave progression
      const baseDelay = enemyType === 'TANK' ? spawnInterval.max :
        enemyType === 'FAST' ? spawnInterval.min :
          (spawnInterval.min + spawnInterval.max) / 2;

      // Decrease delays slightly as waves progress (but not below minimum)
      const waveSpeedMultiplier = Math.max(0.5, 1 - (waveNumber - 1) * 0.05);
      return Math.max(spawnInterval.min, Math.floor(baseDelay * waveSpeedMultiplier));
    };

    const waves: WaveConfig[] = [
      {
        waveNumber: 1,
        enemies: [{ type: EnemyType.BASIC, count: 8, spawnDelay: getSpawnDelay('BASIC', 1) }],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay / 2, // Shorter delay for first wave
        spawnPattern: SpawnPattern.SINGLE_POINT, // All from one spawn point
      },
      {
        waveNumber: 2,
        enemies: [{ type: EnemyType.BASIC, count: 12, spawnDelay: getSpawnDelay('BASIC', 2) }],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay * 0.67, // ~2000ms
        spawnPattern: SpawnPattern.RANDOM, // Random spawn points
      },
      {
        waveNumber: 3,
        enemies: [
          {
            type: EnemyType.BASIC,
            count: 8,
            spawnDelay: getSpawnDelay('BASIC', 3),
            spawnPattern: SpawnPattern.DISTRIBUTED,
          },
          {
            type: EnemyType.FAST,
            count: 5,
            spawnDelay: getSpawnDelay('FAST', 3),
            spawnPattern: SpawnPattern.EDGE_FOCUSED,
          },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay / 2,
      },
      {
        waveNumber: 4,
        enemies: [
          { type: EnemyType.BASIC, count: 15, spawnDelay: getSpawnDelay('BASIC', 4) },
          { type: EnemyType.FAST, count: 8, spawnDelay: getSpawnDelay('FAST', 4) },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay / 2,
        spawnPattern: SpawnPattern.ROUND_ROBIN, // Cycle through spawn points
      },
      {
        waveNumber: 5,
        enemies: [
          {
            type: EnemyType.TANK,
            count: 5,
            spawnDelay: getSpawnDelay('TANK', 5),
            spawnPattern: SpawnPattern.CORNER_FOCUSED,
          },
          {
            type: EnemyType.FAST,
            count: 12,
            spawnDelay: getSpawnDelay('FAST', 5),
            spawnPattern: SpawnPattern.RANDOM,
          },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay * 0.67,
      },
      {
        waveNumber: 6,
        enemies: [
          { type: EnemyType.BASIC, count: 23, spawnDelay: getSpawnDelay('BASIC', 6) },
          { type: EnemyType.TANK, count: 3, spawnDelay: getSpawnDelay('TANK', 6) },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay / 2,
        spawnPattern: SpawnPattern.DISTRIBUTED,
      },
      {
        waveNumber: 7,
        enemies: [
          {
            type: EnemyType.FAST,
            count: 18,
            spawnDelay: getSpawnDelay('FAST', 7),
            spawnPattern: SpawnPattern.RANDOM,
          },
          {
            type: EnemyType.BASIC,
            count: 12,
            spawnDelay: getSpawnDelay('BASIC', 7),
            spawnPattern: SpawnPattern.EDGE_FOCUSED,
          },
          {
            type: EnemyType.TANK,
            count: 6,
            spawnDelay: getSpawnDelay('TANK', 7),
            spawnPattern: SpawnPattern.CORNER_FOCUSED,
          },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay * 0.67,
      },
      {
        waveNumber: 8,
        enemies: [
          { type: EnemyType.BASIC, count: 30, spawnDelay: getSpawnDelay('BASIC', 8) },
          { type: EnemyType.FAST, count: 15, spawnDelay: getSpawnDelay('FAST', 8) },
          { type: EnemyType.TANK, count: 8, spawnDelay: getSpawnDelay('TANK', 8) },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay / 2,
        spawnPattern: SpawnPattern.BURST_SPAWN, // New pattern - enemies spawn from multiple edges simultaneously
      },
      {
        waveNumber: 9,
        enemies: [
          { type: EnemyType.FAST, count: 23, spawnDelay: getSpawnDelay('FAST', 9) },
          { type: EnemyType.TANK, count: 9, spawnDelay: getSpawnDelay('TANK', 9) },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay * 0.6,
        spawnPattern: SpawnPattern.PINCER_MOVEMENT, // New pattern - enemies spawn from opposite edges
      },
      {
        waveNumber: 10,
        enemies: [
          { type: EnemyType.BASIC, count: 38, spawnDelay: getSpawnDelay('BASIC', 10) },
          { type: EnemyType.FAST, count: 23, spawnDelay: getSpawnDelay('FAST', 10) },
          { type: EnemyType.TANK, count: 12, spawnDelay: getSpawnDelay('TANK', 10) },
        ],
        startDelay: GAMEPLAY_CONSTANTS.waves.startDelay * 0.67,
        spawnPattern: SpawnPattern.CHAOS_MODE, // New pattern - completely random spawning
      },
    ];

    this.waveManager.loadWaves(waves);

    // Enable infinite waves based on configuration
    if (INFINITE_WAVE_CONFIG.enabled) {
      const infiniteWaveConfig = {
        ...INFINITE_WAVE_CONFIG.scaling,
        ...INFINITE_WAVE_CONFIG.rewards,
        ...INFINITE_WAVE_CONFIG.difficulty,
        ...INFINITE_WAVE_CONFIG.specialWaves,
      };
      this.waveManager.enableInfiniteWaves(true, INFINITE_WAVE_CONFIG.startAt, infiniteWaveConfig);
    }
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
      
      // Provide navigation grid for pathfinding
      enemy.setNavigationGrid(this.navigationGrid);

      // Add damage callback for floating damage numbers
      enemy.onDamage = (event) => {
        if (event) {
          this.floatingUIManager.createDamageNumber(
            event.entity,
            event.actualDamage,
            event.isCritical ? 'critical' : 'normal'
          );
        }
      };

      this.enemies.push(enemy);

      // Create health bar for the enemy
      this.createHealthBarForEntity(enemy);
    });

    // Update enemies
    this.enemies.forEach((enemy) => {
      // Provide tower information to enemies for targeting decisions
      enemy.setTowers(this.towers);
      enemy.update(deltaTime, this.grid);
    });

    // Update player
    this.player.update(deltaTime, this.grid);
    const worldWidth = this.grid.width * this.grid.cellSize;
    const worldHeight = this.grid.height * this.grid.cellSize;
    this.player.constrainToBounds(worldWidth, worldHeight); // Keep player within world bounds

    // Check for player movement and auto-follow
    if (this.touchGestureManager) {
      const playerMoved = this.lastPlayerPosition && 
        (Math.abs(this.player.position.x - this.lastPlayerPosition.x) > 0.1 ||
         Math.abs(this.player.position.y - this.lastPlayerPosition.y) > 0.1);
      
      if (playerMoved && this.player.isMoving() && this.touchGestureManager.shouldAutoFollow()) {
        // Player is moving and enough time has passed since last gesture
        if (!this.camera.isFollowingTarget()) {
          // Smoothly return camera to player
          this.camera.smoothReturnToTarget(
            this.player.position,
            (this.touchGestureManager as any).config.camera.smoothReturnDuration
          );
        }
      }
    }
    
    // Update last player position
    this.lastPlayerPosition = { ...this.player.position };

    // Update camera to follow player
    this.camera.update(this.player.position);

    // Update floating UI positions after camera update
    this.floatingUIManager.updateAllPositions();

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
        // Check if this was a health pickup to show heal number
        if (collectible.isHealthPickup()) {
          // Show healing number (health pickups heal for 25)
          this.floatingUIManager.createDamageNumber(
            this.player,
            25,
            'heal'
          );
          this.audioHandler.playHealthPickup();
        } else if (collectible.collectibleType === CollectibleType.EXTRA_CURRENCY) {
          // Handle currency collectibles
          this.audioHandler.playPowerUpPickup();
          this.addCurrency(CURRENCY_CONFIG.powerUpBonus);
        } else if (collectible.isPowerUp()) {
          // Handle direct power-up collectibles
          this.audioHandler.playPowerUpPickup();

          // Show power-up notification
          if (this.powerUpDisplay && this.powerUpDisplay.showPowerUpNotification) {
            const config = (collectible as any).config; // Access the config
            const duration = config?.duration || 10000; // Default 10 seconds

            // Map collectible type to power-up notification type
            let powerUpType = '';
            switch (collectible.collectibleType) {
              case CollectibleType.EXTRA_DAMAGE:
                powerUpType = 'EXTRA_DAMAGE';
                break;
              case CollectibleType.SPEED_BOOST:
                powerUpType = 'SPEED_BOOST';
                break;
              case CollectibleType.FASTER_SHOOTING:
                powerUpType = 'FASTER_SHOOTING';
                break;
              case CollectibleType.SHIELD:
                powerUpType = 'SHIELD';
                break;
              default:
                powerUpType = 'EXTRA_DAMAGE';
            }

            this.powerUpDisplay.showPowerUpNotification(powerUpType, duration);
          }
        } else {
          // Generate item for inventory for other collectibles
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
            this.audioHandler.playPowerUpPickup();
          }
        }
      }
    });

    // Clean up dead entities (inlined from EntityCleaner)
    this.enemies = this.enemies.filter((enemy) => {
      if (!enemy.isAlive) {
        // Create destruction effect
        this.destructionEffects.push(enemy.createDestructionEffect());
        
        // Remove health bar when enemy dies
        const healthBarId = `healthbar_${enemy.id}`;
        this.floatingUIManager.remove(healthBarId);
        return false;
      }
      return true;
    });
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.isAlive
    );
    this.collectibles = this.collectibles.filter(
      (collectible) => collectible.isActive
    );
    
    // Update and clean up destruction effects
    this.destructionEffects = this.destructionEffects.filter((effect) => {
      effect.update(deltaTime);
      return !effect.isComplete;
    });
    this.towers = this.towers.filter((tower) => {
      if (!tower.isAlive) {
        // Play destruction sound
        this.audioHandler.playTowerDestroy(tower.position);
        
        // Create destruction visual effect
        this.createTowerDestructionEffect(tower);
        
        // Remove health bar when tower dies
        const healthBarId = `healthbar_${tower.id}`;
        this.floatingUIManager.remove(healthBarId);

        // If this was the selected tower with an open UI, close it
        if (this.selectedTower === tower && this.currentTowerUpgradeUI) {
          this.currentTowerUpgradeUI.destroy();
          this.currentTowerUpgradeUI = null;
          this.selectedTower = null;
        }
        
        // Clear grid cell
        const gridPos = this.grid.worldToGrid(tower.position);
        this.grid.setCellType(gridPos.x, gridPos.y, CellType.EMPTY);
        
        // Remove from navigation grid
        this.navigationGrid.removeDynamicObstacle(tower.position);
        
        return false;
      }
      return true;
    });

    // Check for wave completion and victory
    if (this.waveManager.isWaveComplete() && !this.waveCompleteProcessed) {
      this.waveCompleteProcessed = true;
      if (!this.waveManager.hasNextWave()) {
        this.audioHandler.playVictory();
        this.handleVictory();
      } else {
        this.audioHandler.playWaveComplete();
        this.handleWaveComplete();
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

  private handleWaveComplete(): void {
    // Calculate wave reward
    const waveNumber = this.waveManager.currentWave;
    const infiniteGenerator = this.waveManager.getInfiniteWaveGenerator();

    let waveReward = GAMEPLAY_CONSTANTS.economy.currencyPerKill.basic * 10; // Default reward based on basic enemy kill reward
    if (infiniteGenerator && waveNumber >= 11) {
      waveReward = infiniteGenerator.calculateWaveReward(waveNumber);
    } else {
      // Base reward for waves 1-10
      waveReward = GAMEPLAY_CONSTANTS.economy.currencyPerKill.basic * 10 + (waveNumber * GAMEPLAY_CONSTANTS.economy.currencyPerKill.basic * 2);
    }

    this.addCurrency(waveReward);
    this.addScore(GAMEPLAY_CONSTANTS.scoring.enemyKillBase * 10 * waveNumber); // Score bonus for completing wave based on base enemy score

    // Show wave complete notification if UI is available
    console.log(`Wave ${waveNumber} Complete! Reward: ${waveReward} currency`);
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

    const scoreEntry = ScoreManager.saveScore(stats);

    // Dispatch event for UI to handle
    const gameEndEvent = new CustomEvent("gameEnd", {
      detail: {
        stats,
        victory,
        scoreEntry: scoreEntry,
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

  render = (_deltaTime: number): void => {
    // Log first render to debug
    if (!this.firstRenderLogged) {
      console.log('[Game] First render - Player:', this.player, 'Towers:', this.towers.length, 'Enemies:', this.enemies.length);
      this.firstRenderLogged = true;
    }
    
    // Render main scene including player
    this.renderer.renderScene(
      this.towers,
      this.enemies,
      this.projectiles,
      this.collectibles,
      this.destructionEffects, // Pass destruction effects
      this.getPlayerAimerLine(),
      this.player,
      this.selectedTower,
      this.navigationGrid
    );

    // Render tower range if hovering
    if (this.hoverTower) {
      this.renderer.renderTowerRange(this.hoverTower);
    }

    // Render selected tower range only (upgrade panel is handled by dialog system)
    if (this.selectedTower) {
      this.renderer.renderTowerRange(this.selectedTower);
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
    }
    // Note: Pause overlay is now handled by PauseMenuUI, not rendered directly

    // Render camera diagnostics overlay if enabled
    if (this.cameraDiagnostics.isVisualDebugEnabled()) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        // Save context state since it might be scaled
        ctx.save();
        // Reset any transforms to ensure debug overlay renders correctly
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.cameraDiagnostics.renderDebug(ctx, this.player);
        ctx.restore();
      }
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

    // Add damage callback for health bar display
    tower.onDamage = (_event) => {
      // Could show damage numbers or flash effect for towers
      // For now, we'll let health bars handle the visual feedback
    };

    this.towers.push(tower);

    // Create health bar for the tower
    this.createHealthBarForEntity(tower);

    // Track towers built
    this.towersBuilt++;

    // Update grid - walls are obstacles, other towers are towers
    if (towerType === TowerType.WALL) {
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.OBSTACLE);
    } else {
      this.grid.setCellType(gridPos.x, gridPos.y, CellType.TOWER);
    }
    
    // Update navigation grid for pathfinding
    this.navigationGrid.addDynamicObstacle(worldPosition, tower.radius);

    // Spend currency
    this.spendCurrency(cost);

    // Play tower placement sound
    this.audioHandler.playTowerPlace();

    return true;
  }

  // Health bar management methods using new floating UI system
  private createHealthBarForEntity(entity: Entity & { health: number; maxHealth?: number }): void {
    // Don't create health bars for walls
    if ('towerType' in entity && (entity as any).towerType === TowerType.WALL) {
      return;
    }

    const options = {
      width: 50,
      height: 6,
      offset: { x: 0, y: -entity.radius - 15 },
      showValue: false,
      color: entity.entityType === EntityType.PLAYER ? '#4CAF50' : '#2196F3'
    };

    this.uiController.createHealthBar(entity, options);
  }



  // Wave management
  startNextWave(): boolean {
    if (this.waveManager.isWaveActive()) {
      return false;
    }

    const nextWave = this.waveManager.getNextWaveNumber();
    const started = this.waveManager.startWave(nextWave);
    if (started) {
      this.waveCompleteProcessed = false; // Reset the flag for the new wave
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
    // Get mouse position accounting for pixel ratio
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Calculate position relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to actual canvas coordinates (accounting for CSS scaling)
    const screenPos = {
      x: x * (this.canvas.width / pixelRatio) / rect.width,
      y: y * (this.canvas.height / pixelRatio) / rect.height
    };

    const worldPos = this.camera.screenToWorld(screenPos);
    // this.isMouseDown = true; // Unused variable commented out

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

    // Check if clicking on existing tower - use larger click radius for easier selection
    const CLICK_RADIUS_MULTIPLIER = 1.5; // Make towers easier to click
    const clickedTower = this.towers.find(
      (tower) => tower.distanceTo(worldPos) <= tower.radius * CLICK_RADIUS_MULTIPLIER
    );

    if (clickedTower) {
      // Use the selectTower/deselectTower methods for consistency
      if (this.selectedTower === clickedTower) {
        this.deselectTower();
      } else {
        this.selectTower(clickedTower);
        this.justSelectedTower = true;
        // Clear the flag after a short delay
        setTimeout(() => {
          this.justSelectedTower = false;
        }, 500);
      }
      this.setSelectedTowerType(null); // Clear tower placement mode
      return; // Important: return early to prevent deselection logic
    } else if (this.selectedTowerType && !this.justSelectedTowerType) {
      // Place new tower (only if we didn't just select from menu)
      if (this.placeTower(this.selectedTowerType, worldPos)) {
        // Clear selection after successful placement
        this.setSelectedTowerType(null);
        // Dispatch event to update UI
        const towerPlacedEvent = new CustomEvent('towerPlaced');
        document.dispatchEvent(towerPlacedEvent);
      } else {
        // Provide feedback for failed placement
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]); // Error vibration pattern
        }
      }
    } else {
      // Manual shooting - start click and hold
      const projectile = this.player.handleMouseDown(worldPos);
      if (projectile) {
        this.projectiles.push(projectile);
      }

      // Only deselect tower if we didn't just select one
      if (this.selectedTower && !this.justSelectedTower) {
        this.deselectTower();
      }
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    // this.isMouseDown = false; // Unused variable commented out
    this.player.handleMouseUp();
  }

  handleMouseMove(event: MouseEvent): void {
    // Get mouse position accounting for pixel ratio
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Calculate position relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to actual canvas coordinates (accounting for CSS scaling)
    const screenPos = {
      x: x * (this.canvas.width / pixelRatio) / rect.width,
      y: y * (this.canvas.height / pixelRatio) / rect.height
    };

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
      case "b":
      case "B":
        // Check camera
        this.checkCamera();
        break;

      case "n":
      case "N":
        // Fix camera
        this.fixCamera();
        break;
      case "d":
      case "D":
        // Debug camera (only when combined with Shift)
        if (key === "D") {
          this.debugCamera();
        }
        break;
      case "v":
      case "V":
        // Toggle visual debug mode
        this.renderer.setDebugMode(key === "V");
        console.log(`Visual debug mode: ${key === "V" ? "ON" : "OFF"}`);
        break;
        
      // Tower selection hotkeys
      case "1":
        this.setSelectedTowerType(TowerType.BASIC);
        console.log('[Game] Selected tower: BASIC');
        break;
      case "2":
        this.setSelectedTowerType(TowerType.SNIPER);
        console.log('[Game] Selected tower: SNIPER');
        break;
      case "3":
        this.setSelectedTowerType(TowerType.RAPID);
        console.log('[Game] Selected tower: RAPID');
        break;
      case "4":
        this.setSelectedTowerType(TowerType.WALL);
        console.log('[Game] Selected tower: WALL');
        break;
      // Pathfinding debug controls
      case "p":
        const PathfindingDebugP = (window as any).PathfindingDebug;
        if (PathfindingDebugP) {
          PathfindingDebugP.togglePaths();
        }
        break;
      case "g":
        const PathfindingDebugG = (window as any).PathfindingDebug;
        if (PathfindingDebugG) {
          PathfindingDebugG.toggleNavGrid();
        }
        break;
      case "escape":
        // Clear tower selection
        if (this.selectedTowerType) {
          this.setSelectedTowerType(null);
          console.log('[Game] Cleared tower selection');
        }
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
    const oldCurrency = this.currency;
    this.currency = Math.max(0, this.currency - amount);
    // Dispatch currency changed event
    const event = new CustomEvent('currencyChanged', { 
      detail: { currency: this.currency, change: oldCurrency - this.currency } 
    });
    document.dispatchEvent(event);
  }

  public addCurrency(amount: number): void {
    this.currency += amount;
    // Dispatch currency changed event
    const event = new CustomEvent('currencyChanged', { 
      detail: { currency: this.currency, change: amount } 
    });
    document.dispatchEvent(event);
  }

  // Public method for testing
  public setCurrency(amount: number): void {
    const oldCurrency = this.currency;
    this.currency = amount;
    // Dispatch currency changed event
    const event = new CustomEvent('currencyChanged', { 
      detail: { currency: this.currency, change: amount - oldCurrency } 
    });
    document.dispatchEvent(event);
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

  getTotalWaves(): number {
    return this.waveManager.getTotalWaves();
  }

  getEnemyCount(): number {
    return this.enemies.length;
  }

  isInfiniteMode(): boolean {
    return this.waveManager.isInfiniteMode();
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
    }).filter(
      (slot): slot is { item: InventoryItem | null; slotIndex: number } =>
        slot !== undefined
    );

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
    if (
      this.player &&
      "addExperience" in this.player &&
      typeof this.player.addExperience === "function"
    ) {
      // Award experience based on enemy reward
      // Enemies give 2x their reward value as XP
      const experienceGain = enemy.reward * 2;
      const leveledUp = (this.player as any).addExperience(experienceGain);
      
      // Show level up notification if player leveled up
      if (leveledUp && this.playerLevelDisplay && this.playerLevelDisplay.showLevelUpNotification) {
        const levelSystem = this.player.getPlayerLevelSystem();
        const newLevel = levelSystem.getLevel();
        const pointsEarned = newLevel === 10 || newLevel === 20 || newLevel === 30 || newLevel === 40 || newLevel === 50 ? 2 : 1;
        this.playerLevelDisplay.showLevelUpNotification(newLevel, pointsEarned);
      }
    }

    // Enhanced item drop system
    const dropRate = this.getEnemyDropRate(enemy);
    const numDrops = this.getNumDropsForEnemy(enemy);

    for (let i = 0; i < numDrops; i++) {
      if (Collectible.shouldSpawnItem(dropRate)) {
        // 40% chance for new inventory items, 60% chance for traditional collectibles
        if (Math.random() < 0.4) {
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
    if (Math.random() < COLLECTIBLE_DROP_CHANCES.extraCurrencyDrop) {
      this.addCurrency(enemy.reward * CURRENCY_CONFIG.extraDropMultiplier);
    }
  }

  setSelectedTowerType(towerType: TowerType | null): void {
    this.selectedTowerType = towerType;
    
    // Enter or exit build mode based on tower selection
    if (towerType) {
      this.uiController.enterBuildMode(towerType);
      // Prevent immediate placement after selecting from build menu
      this.justSelectedTowerType = true;
      setTimeout(() => {
        this.justSelectedTowerType = false;
      }, 100);
      
      // Disable gestures during tower placement
      if (this.touchGestureManager) {
        this.touchGestureManager.setEnabled(false);
      }
    } else {
      this.uiController.exitBuildMode();
      
      // Re-enable gestures after tower placement
      if (this.touchGestureManager) {
        this.touchGestureManager.setEnabled(true);
      }
    }
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
    this.floatingUIManager.pause();
  }

  resume(): void {
    this.engine.resume();
    this.floatingUIManager.resume();
  }

  start(): void {
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
    this.uiController.destroy();
    
    // Clean up touch gesture manager
    if (this.touchGestureManager) {
      this.touchGestureManager.destroy();
      this.touchGestureManager = null;
    }
  }

  isPaused(): boolean {
    return this.engine.isPaused();
  }

  // Additional getters
  getSelectedTower(): Tower | null {
    return this.selectedTower;
  }

  // Tower selection management
  clearSelectedTower(): void {
    if (this.selectedTower) {
      const previousTower = this.selectedTower;
      this.selectedTower = null;

      // Dispatch deselect event
      const deselectEvent = new CustomEvent('towerDeselected', {
        detail: { tower: previousTower }
      });
      document.dispatchEvent(deselectEvent);
    }
  }

  isTowerSelected(tower: Tower): boolean {
    return this.selectedTower === tower;
  }

  selectTower(tower: Tower): void {
    if (!this.towers.includes(tower)) {
      console.warn('[Game] Attempted to select a tower that is not in the game');
      return;
    }

    console.log(`[Game] Selecting tower: ${tower.towerType}`);

    const previousTower = this.selectedTower;

    // Always close any existing tower upgrade UI
    this.uiController.close('tower-upgrade');

    // Deselect previous tower if different
    if (previousTower && previousTower !== tower) {
      const deselectEvent = new CustomEvent('towerDeselected', {
        detail: { tower: previousTower }
      });
      document.dispatchEvent(deselectEvent);
    }

    this.selectedTower = tower;
    this.setSelectedTowerType(null); // Clear tower placement mode

    // Use UIController to show tower upgrade UI
    this.uiController.showTowerUpgrade(tower);

    // Debug logging
    console.log(`[Game] Tower upgrade UI created for ${tower.towerType} at position:`, tower.position);

    // Dispatch select event
    const selectEvent = new CustomEvent('towerSelected', {
      detail: { tower }
    });
    document.dispatchEvent(selectEvent);
  }

  deselectTower(): void {
    if (this.selectedTower) {
      const tower = this.selectedTower;
      this.selectedTower = null;

      // Close upgrade UI through UIController
      this.uiController.close('tower-upgrade');

      // Dispatch deselect event
      const deselectEvent = new CustomEvent('towerDeselected', {
        detail: { tower }
      });
      document.dispatchEvent(deselectEvent);
    }
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

  // Tower selling
  sellTower(tower: Tower): boolean {
    const towerIndex = this.towers.indexOf(tower);
    if (towerIndex === -1) {
      console.warn('[Game] Attempted to sell a tower that is not in the game');
      return false;
    }

    // Get sell value before removing
    const sellValue = tower.getSellValue();

    // Get tower grid position to clear it
    const gridPos = this.grid.worldToGrid(tower.position);

    // Remove tower from array
    this.towers.splice(towerIndex, 1);

    // Clear grid cell
    this.grid.setCellType(gridPos.x, gridPos.y, CellType.EMPTY);

    // Add currency from selling
    this.addCurrency(sellValue);

    // Clear selection if this was the selected tower
    if (this.selectedTower === tower) {
      this.deselectTower();
    }

    // Play sell sound
    this.audioHandler.playTowerPlace(); // Using place sound for sell

    console.log(`[Game] Sold ${tower.towerType} tower for ${sellValue} gold`);
    return true;
  }

  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  getAudioHandler(): GameAudioHandler {
    return this.audioHandler;
  }

  getCamera(): Camera {
    return this.camera;
  }

  getGrid(): Grid {
    return this.grid;
  }

  // Removed getPopupManager and getUIManager - use floatingUIManager directly

  getFloatingUIManager(): FloatingUIManager {
    return this.floatingUIManager;
  }

  // Set PowerUpDisplay reference for notifications
  setPowerUpDisplay(powerUpDisplay: any): void {
    this.powerUpDisplay = powerUpDisplay;
  }

  setPlayerLevelDisplay(playerLevelDisplay: any): void {
    this.playerLevelDisplay = playerLevelDisplay;
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
    // this.pathfinder = new Pathfinder(this.grid); // Unused - commented out to fix TypeScript error

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

    // Update camera to handle new world size
    this.camera.update(this.player.position);

    // Update renderer with new environmental effects
    this.renderer.setEnvironmentalEffects(this.currentMapData.effects);

    // Reset game state
    this.setSelectedTowerType(null);
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
    const mapSize = MapSize.MEDIUM; // Default to medium size for better gameplay pacing
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

  // Camera diagnostics methods
  runCameraDiagnostics(): void {
    this.cameraDiagnostics.diagnose(this.player, this.canvas);
  }

  testCameraCentering(): void {
    this.cameraDiagnostics.testCentering(this.player);
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
          // Show healing number
          this.floatingUIManager.createDamageNumber(
            this.player,
            metadata.healAmount,
            'heal'
          );
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

          // Show power-up notification
          if (this.powerUpDisplay && this.powerUpDisplay.showPowerUpNotification) {
            this.powerUpDisplay.showPowerUpNotification('EXTRA_DAMAGE', metadata.duration);
          }

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

          // Show power-up notification
          if (this.powerUpDisplay && this.powerUpDisplay.showPowerUpNotification) {
            this.powerUpDisplay.showPowerUpNotification('SPEED_BOOST', metadata.duration);
          }

          return true;
        }
        break;

      case "shield_scroll":
        if (metadata.duration) {
          this.player.addShield(metadata.duration);
          this.audioManager.playSound(SoundType.POWERUP_PICKUP);

          // Show power-up notification
          if (this.powerUpDisplay && this.powerUpDisplay.showPowerUpNotification) {
            this.powerUpDisplay.showPowerUpNotification('SHIELD', metadata.duration);
          }

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
    const baseRate = GAMEPLAY_CONSTANTS.powerUps.dropChance; // 10% base chance
    const waveBonus = Math.min(this.waveManager.currentWave * 0.01, 0.08); // Up to +8% at wave 8+

    // Different enemy types have different drop rates
    let enemyMultiplier = 1.0;
    if (enemy.enemyType === EnemyType.FAST) {
      enemyMultiplier = 0.8; // Fast enemies drop less
    } else if (enemy.enemyType === EnemyType.TANK) {
      enemyMultiplier = 1.5; // Tank enemies drop more
    } else if (enemy.enemyType === EnemyType.BASIC) {
      enemyMultiplier = 1.0; // Basic enemies have normal drop rate
    }

    return Math.min(baseRate + waveBonus, 0.25) * enemyMultiplier; // Cap at 25%
  }

  private getNumDropsForEnemy(enemy: Enemy): number {
    // Most enemies drop 1 item, but stronger enemies can drop more
    if (enemy.enemyType === EnemyType.TANK) {
      return Math.random() < (GAMEPLAY_CONSTANTS.powerUps.dropChance * 3) ? 2 : 1; // 30% chance for 2 items
    } else if (enemy.enemyType === EnemyType.FAST) {
      return 1; // Fast enemies always drop 1 item
    } else {
      return Math.random() < GAMEPLAY_CONSTANTS.powerUps.dropChance ? 2 : 1; // Basic enemies have 10% chance for 2 items
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

    // Determine zoom direction and factor from configuration
    const zoomIn = event.deltaY < 0;
    const zoomFactor = CAMERA_CONFIG.zoomSpeed;

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
    // Use PowerUpDisplay if available, otherwise fallback to old method
    if (this.powerUpDisplay && this.powerUpDisplay.showItemPickupNotification) {
      this.powerUpDisplay.showItemPickupNotification(item.name, item.type);
      return;
    }

    // Fallback to old notification method
    console.warn('[Game] PowerUpDisplay not available, using fallback notification');

    // Create a simple notification element
    const notification = document.createElement("div");
    notification.className = 'item-pickup-notification-fallback animate-slideDown';

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

    // Add to page
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, ANIMATION_CONFIG.durations.slowest * 2);
  }

  // Show inventory full notification
  private showInventoryFullNotification(item: InventoryItem): void {
    // Use PowerUpDisplay if available, otherwise fallback to old method
    if (this.powerUpDisplay && this.powerUpDisplay.showInventoryFullNotification) {
      this.powerUpDisplay.showInventoryFullNotification(item.name);
      return;
    }

    // Fallback to old notification method
    console.warn('[Game] PowerUpDisplay not available, using fallback notification');

    const notification = document.createElement("div");
    notification.className = 'inventory-full-notification-fallback animate-slideDown';

    notification.innerHTML = `⚠️ Inventory full! ${item.name} used immediately`;

    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, ANIMATION_CONFIG.durations.slowest * 3);
  }

  // Add this simple diagnostic method
  public checkCamera(): void {
    const cameraInfo = this.camera.getCameraInfo();
    const cameraPos = cameraInfo.position;
    const playerPos = this.player.position;
    const zoom = cameraInfo.zoom;
    const isFollowing = cameraInfo.followTarget;

    // Get canvas dimensions from renderer's viewport
    const canvasWidth = this.renderer.getViewportWidth();
    const canvasHeight = this.renderer.getViewportHeight();

    // Calculate where player appears on screen
    const playerScreenX = (playerPos.x - cameraPos.x) * zoom;
    const playerScreenY = (playerPos.y - cameraPos.y) * zoom;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Distance from center
    const distance = Math.sqrt(
      Math.pow(playerScreenX - centerX, 2) +
      Math.pow(playerScreenY - centerY, 2)
    );

    console.log("=== CAMERA DIAGNOSTIC ===");
    console.log("Canvas Info:", {
      actualSize: { width: this.canvas.width, height: this.canvas.height },
      cssSize: { width: this.canvas.offsetWidth, height: this.canvas.offsetHeight },
      pixelRatio: window.devicePixelRatio || 1
    });
    console.log("Camera Info:", {
      following: isFollowing,
      position: cameraPos,
      center: cameraInfo.center,
      zoom: zoom.toFixed(2),
      viewport: cameraInfo.viewportSize
    });
    console.log("Player Info:", {
      worldPos: playerPos,
      screenPos: { x: playerScreenX.toFixed(0), y: playerScreenY.toFixed(0) },
      velocity: this.player.getVelocity(),
      isMoving: this.player.isMoving()
    });
    console.log(`Expected center: (${centerX}, ${centerY})`);
    console.log(`Distance from center: ${distance.toFixed(1)}px`);
    console.log(`Status: ${distance < 10 ? "✅ CENTERED" : "❌ OFF-CENTER"}`);

    if (distance > 10) {
      console.log("\nTo fix, camera should be at:");
      console.log({
        x: playerPos.x - centerX / zoom,
        y: playerPos.y - centerY / zoom,
      });
    }
  }

  // Quick fix method
  public fixCamera(): void {
    console.log("Fixing camera...");

    // Log current state before fix
    const beforeInfo = this.camera.getCameraInfo();
    console.log("Before fix:", {
      following: beforeInfo.followTarget,
      cameraPos: beforeInfo.position,
      playerPos: this.player.position
    });

    // Force enable following and center
    this.camera.enableFollowingAndCenter(this.player.position);

    // Log state after fix
    const afterInfo = this.camera.getCameraInfo();
    console.log("After fix:", {
      following: afterInfo.followTarget,
      cameraPos: afterInfo.position,
      playerPos: this.player.position
    });

    console.log("Camera fixed! Following enabled and centered on player.");
    this.checkCamera(); // Run check to verify
  }

  // Debug camera following
  public debugCamera(): void {
    console.log("=== CAMERA DEBUG MODE ===");

    // Log current state
    const cameraInfo = this.camera.getCameraInfo();
    console.log("Current camera state:", cameraInfo);

    // Test player movement
    const startPos = { ...this.player.position };
    console.log("Testing player movement...");

    // Move player a bit
    this.player.position.x += 100;
    this.player.position.y += 100;

    // Update camera
    this.camera.update(this.player.position);

    const newCameraInfo = this.camera.getCameraInfo();
    console.log("After moving player +100,+100:");
    console.log("  Player moved from", startPos, "to", this.player.position);
    console.log("  Camera moved from", cameraInfo.position, "to", newCameraInfo.position);

    // Restore player position
    this.player.position = startPos;

    // Test instant centering
    console.log("\nTesting instant centering...");
    this.camera.centerOnTarget(this.player.position);
    const centeredInfo = this.camera.getCameraInfo();
    console.log("  Camera after centerOnTarget:", centeredInfo.position);

    this.checkCamera();
  }

  // Toggle visual debug mode
  public toggleVisualDebug(): void {
    this.cameraDiagnostics.toggleVisualDebug();
    const enabled = this.cameraDiagnostics.isVisualDebugEnabled();

    // Also toggle renderer debug mode
    this.renderer.setDebugMode(enabled);

    console.log(`Camera visual debug: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    if (enabled) {
      console.log("Green crosshair = screen center, Yellow circle = player position");
      console.log("Red dashed line = distance from center to player");
    }
  }

  getEnemiesRemaining(): number {
    return this.enemies.length;
  }

  isWaveActive(): boolean {
    return this.waveManager.isWaveActive();
  }

  getUIController(): UIController {
    return this.uiController;
  }

  /**
   * Create visual destruction effect for tower
   */
  private createTowerDestructionEffect(tower: Tower): void {
    // Create explosion particles
    const particleCount = 15;
    const colors = ['#ff6b6b', '#ffd166', '#f4a261', '#e76f51'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100;
      const lifetime = 500 + Math.random() * 500;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Create particle element
      const particle = this.floatingUIManager.create(
        `destruction-particle-${tower.id}-${i}`,
        'custom',
        {
          persistent: false,
          autoHide: false,
          smoothing: 0,
          className: 'destruction-particle'
        }
      );
      
      // Create particle visual
      const particleEl = document.createElement('div');
      particleEl.style.cssText = `
        width: 8px;
        height: 8px;
        background-color: ${color};
        border-radius: 50%;
        position: absolute;
        pointer-events: none;
      `;
      
      particle.setContent(particleEl);
      particle.setTarget(tower as any);
      particle.enable();
      
      // Animate particle
      let elapsed = 0;
      const startTime = Date.now();
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      
      const updateParticle = () => {
        elapsed = Date.now() - startTime;
        if (elapsed >= lifetime) {
          this.floatingUIManager.remove(particle.id);
          return;
        }
        
        const progress = elapsed / lifetime;
        const currentPos = {
          x: tower.position.x + (velocity.x * elapsed) / 1000,
          y: tower.position.y + (velocity.y * elapsed) / 1000
        };
        
        // Update position
        particle.setTarget({
          position: currentPos,
          getPosition: () => currentPos
        } as any);
        
        // Fade out and shrink
        particleEl.style.opacity = String(1 - progress);
        particleEl.style.transform = `scale(${1 - progress * 0.5})`;
        
        requestAnimationFrame(updateParticle);
      };
      
      requestAnimationFrame(updateParticle);
    }
    
    // Create shockwave effect
    const shockwave = this.floatingUIManager.create(
      `destruction-shockwave-${tower.id}`,
      'custom',
      {
        persistent: false,
        autoHide: false,
        smoothing: 0,
        className: 'destruction-shockwave'
      }
    );
    
    const shockwaveEl = document.createElement('div');
    shockwaveEl.style.cssText = `
      width: ${tower.radius * 2}px;
      height: ${tower.radius * 2}px;
      border: 3px solid #ff6b6b;
      border-radius: 50%;
      position: absolute;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.8;
    `;
    
    shockwave.setContent(shockwaveEl);
    shockwave.setTarget(tower as any);
    shockwave.enable();
    
    // Animate shockwave
    let shockwaveElapsed = 0;
    const shockwaveStartTime = Date.now();
    const shockwaveDuration = 600;
    
    const updateShockwave = () => {
      shockwaveElapsed = Date.now() - shockwaveStartTime;
      if (shockwaveElapsed >= shockwaveDuration) {
        this.floatingUIManager.remove(shockwave.id);
        return;
      }
      
      const progress = shockwaveElapsed / shockwaveDuration;
      const scale = 1 + progress * 2;
      
      shockwaveEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
      shockwaveEl.style.opacity = String(0.8 * (1 - progress));
      
      requestAnimationFrame(updateShockwave);
    };
    
    requestAnimationFrame(updateShockwave);
    
    // Show damage number indicating tower was destroyed
    this.floatingUIManager.createDamageNumber(
      tower,
      0,
      'critical'
    );
  }
}
