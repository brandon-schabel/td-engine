import { GameEngine } from './GameEngine';
import { GameState } from './GameState';
import { Grid, CellType } from '../systems/Grid';
import { Pathfinder } from '../systems/Pathfinder';
import { WaveManager } from '../systems/WaveManager';
import type { WaveConfig } from '../systems/WaveManager';
import { ResourceManager, ResourceType } from '../systems/ResourceManager';
import { Renderer } from '../systems/Renderer';
import { Tower, TowerType } from '../entities/Tower';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player, PlayerUpgradeType } from '../entities/Player';
import type { Vector2 } from '../utils/Vector2';
import { TowerUpgradeManager, UpgradeType } from '../systems/TowerUpgradeManager';
import { PlayerUpgradeManager } from '../systems/PlayerUpgradeManager';

const TOWER_COSTS = {
  [TowerType.BASIC]: 20,
  [TowerType.SNIPER]: 50,
  [TowerType.RAPID]: 30
};

export class Game {
  private engine: GameEngine;
  private grid: Grid;
  private pathfinder: Pathfinder;
  private waveManager: WaveManager;
  private resourceManager: ResourceManager;
  private renderer: Renderer;
  private upgradeManager: TowerUpgradeManager;
  private playerUpgradeManager: PlayerUpgradeManager;
  
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private player: Player;
  
  private selectedTowerType: TowerType | null = null;
  private hoverTower: Tower | null = null;
  private selectedTower: Tower | null = null;
  private mousePosition: Vector2 = { x: 0, y: 0 };
  
  private readonly defaultPath: Vector2[] = [
    { x: 0, y: 9 },
    { x: 5, y: 9 },
    { x: 5, y: 5 },
    { x: 15, y: 5 },
    { x: 15, y: 15 },
    { x: 24, y: 15 }
  ];

  constructor(canvas: HTMLCanvasElement) {
    // Initialize grid (25x19 cells for 800x608 canvas)
    this.grid = new Grid(25, 19, 32);
    
    // Set up default path
    this.grid.setPath(this.defaultPath);
    
    // Initialize systems
    this.pathfinder = new Pathfinder(this.grid);
    this.waveManager = new WaveManager(this.grid.gridToWorld(0, 9));
    this.resourceManager = new ResourceManager();
    this.renderer = new Renderer(canvas, this.grid);
    this.upgradeManager = new TowerUpgradeManager();
    this.playerUpgradeManager = new PlayerUpgradeManager();
    this.engine = new GameEngine();
    
    // Create player at center of map
    this.player = new Player({ x: canvas.width / 2, y: canvas.height / 2 });
    
    // Load wave configurations
    this.loadWaveConfigurations();
    
    // Set up game loop callbacks
    this.engine.onUpdate(this.update.bind(this));
    this.engine.onRender(this.render.bind(this));
    
    // Start the game engine
    this.engine.start();
  }

  private loadWaveConfigurations(): void {
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
    if (this.resourceManager.isGameOver()) {
      this.engine.gameOver();
      return;
    }

    // Update wave manager and spawn enemies
    const newEnemies = this.waveManager.update(deltaTime);
    newEnemies.forEach(enemy => {
      // Set path for enemy
      const worldPath = this.pathfinder.gridPathToWorld(this.defaultPath);
      enemy.setPath(worldPath);
      this.enemies.push(enemy);
    });

    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);
      
      // Check if enemy reached end
      if (enemy.hasReachedEnd() && enemy.isAlive) {
        this.resourceManager.enemyReachedEnd();
        enemy.isAlive = false; // Mark for removal
      }
    });

    // Update player
    this.player.update(deltaTime);
    this.player.constrainToBounds(800, 608); // Keep player within canvas bounds
    
    // Player auto-shooting
    const playerProjectile = this.player.autoShoot(this.enemies);
    if (playerProjectile) {
      this.projectiles.push(playerProjectile);
    }

    // Update towers and generate projectiles
    this.towers.forEach(tower => {
      const newProjectiles = tower.updateAndShoot(this.enemies, deltaTime);
      this.projectiles.push(...newProjectiles);
    });

    // Update projectiles
    this.projectiles.forEach(projectile => {
      projectile.update(deltaTime);
      
      // Check if projectile hit target
      if (!projectile.isAlive && projectile.target && !projectile.target.isAlive) {
        // Enemy was killed, give rewards
        this.resourceManager.enemyKilled(projectile.target.reward, projectile.target.reward * 5);
      }
    });

    // Clean up dead entities
    this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    this.projectiles = this.projectiles.filter(projectile => projectile.isAlive);

    // Check for wave completion and victory
    if (this.waveManager.isWaveComplete()) {
      if (!this.waveManager.hasNextWave()) {
        this.engine.victory();
      }
    }
  };

  render = (deltaTime: number): void => {
    // Render main scene including player
    this.renderer.renderScene(this.towers, this.enemies, this.projectiles, this.player);
    
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
        150,
        this.upgradeManager
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
      this.resourceManager.getCurrency(),
      this.resourceManager.getLives(),
      this.resourceManager.getScore(),
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
    const cost = TOWER_COSTS[towerType];
    
    if (!this.resourceManager.canAfford(ResourceType.CURRENCY, cost)) {
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
    this.resourceManager.spendResource(ResourceType.CURRENCY, cost);
    
    return true;
  }

  // Wave management
  startNextWave(): boolean {
    if (this.waveManager.isWaveActive()) {
      return false;
    }
    
    const nextWave = this.waveManager.getNextWaveNumber();
    return this.waveManager.startWave(nextWave);
  }

  // Tower upgrades
  upgradeTower(tower: Tower, upgradeType: UpgradeType): boolean {
    const cost = this.upgradeManager.getUpgradeCost(tower, upgradeType);
    
    if (!this.resourceManager.canAfford(ResourceType.CURRENCY, cost)) {
      return false;
    }
    
    if (!tower.canUpgrade(upgradeType)) {
      return false;
    }
    
    const actualCost = this.upgradeManager.applyUpgrade(tower, upgradeType);
    if (actualCost > 0) {
      this.resourceManager.spendResource(ResourceType.CURRENCY, actualCost);
      return true;
    }
    
    return false;
  }

  // Mouse interaction
  handleMouseClick(event: MouseEvent): void {
    const worldPos = { x: event.offsetX, y: event.offsetY };
    
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
      // Click on empty space - deselect tower
      this.selectedTower = null;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    const worldPos = { x: event.offsetX, y: event.offsetY };
    
    // Update mouse position for ghost tower rendering
    this.mousePosition = worldPos;
    
    // Find tower under mouse for range display
    this.hoverTower = this.towers.find(tower => 
      tower.distanceTo(worldPos) <= tower.radius
    ) || null;
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

  // Getters for game state
  getCurrency(): number {
    return this.resourceManager.getCurrency();
  }

  getLives(): number {
    return this.resourceManager.getLives();
  }

  getScore(): number {
    return this.resourceManager.getScore();
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

  isWaveComplete(): boolean {
    return this.waveManager.isWaveComplete();
  }

  isGameOver(): boolean {
    return this.resourceManager.isGameOver();
  }

  enemyReachedEnd(): void {
    this.resourceManager.enemyReachedEnd();
  }

  enemyKilled(currencyReward: number, scoreReward: number): void {
    this.resourceManager.enemyKilled(currencyReward, scoreReward);
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
    return TOWER_COSTS[towerType];
  }

  canAffordTower(towerType: TowerType): boolean {
    return this.resourceManager.canAfford(ResourceType.CURRENCY, TOWER_COSTS[towerType]);
  }

  // Game engine control
  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
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

  getUpgradeManager(): TowerUpgradeManager {
    return this.upgradeManager;
  }

  getUpgradeCost(tower: Tower, upgradeType: UpgradeType): number {
    return this.upgradeManager.getUpgradeCost(tower, upgradeType);
  }

  canAffordUpgrade(tower: Tower, upgradeType: UpgradeType): boolean {
    const cost = this.upgradeManager.getUpgradeCost(tower, upgradeType);
    return this.resourceManager.canAfford(ResourceType.CURRENCY, cost);
  }

  // Player upgrade methods
  upgradePlayer(upgradeType: PlayerUpgradeType): boolean {
    const cost = this.playerUpgradeManager.getUpgradeCost(this.player, upgradeType);
    
    if (!this.resourceManager.canAfford(ResourceType.CURRENCY, cost)) {
      return false;
    }
    
    if (!this.player.canUpgrade(upgradeType)) {
      return false;
    }
    
    const actualCost = this.playerUpgradeManager.applyUpgrade(this.player, upgradeType);
    if (actualCost > 0) {
      this.resourceManager.spendResource(ResourceType.CURRENCY, actualCost);
      return true;
    }
    
    return false;
  }

  getPlayerUpgradeCost(upgradeType: PlayerUpgradeType): number {
    return this.playerUpgradeManager.getUpgradeCost(this.player, upgradeType);
  }

  canAffordPlayerUpgrade(upgradeType: PlayerUpgradeType): boolean {
    const cost = this.playerUpgradeManager.getUpgradeCost(this.player, upgradeType);
    return this.resourceManager.canAfford(ResourceType.CURRENCY, cost);
  }

  getPlayer(): Player {
    return this.player;
  }

  getPlayerUpgradeManager(): PlayerUpgradeManager {
    return this.playerUpgradeManager;
  }
}