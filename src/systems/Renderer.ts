import { Tower, TowerType } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player, PlayerUpgradeType } from '../entities/Player';
import { HealthPickup } from '../entities/HealthPickup';
import { PowerUp } from '../entities/PowerUp';
import { Entity } from '../entities/Entity';
import { Grid, CellType } from './Grid';
import { Camera } from './Camera';
import { UpgradeType } from './TowerUpgradeManager';
import { TextureManager, type Texture, type SpriteFrame } from './TextureManager';
import type { Vector2 } from '../utils/Vector2';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private grid: Grid;
  private camera: Camera;
  private viewportWidth: number;
  private viewportHeight: number;
  private textureManager: TextureManager;

  constructor(canvas: HTMLCanvasElement, grid: Grid, camera: Camera, textureManager?: TextureManager) {
    this.canvas = canvas;
    this.grid = grid;
    this.camera = camera;
    this.viewportWidth = canvas.width;
    this.viewportHeight = canvas.height;
    this.textureManager = textureManager || new TextureManager();
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    
    // Preload common textures
    this.preloadTextures();
  }

  private async preloadTextures(): Promise<void> {
    // Preload basic game textures
    try {
      await Promise.all([
        this.textureManager.loadTexture('player', '/assets/player.png'),
        this.textureManager.loadTexture('tower_basic', '/assets/tower_basic.png'),
        this.textureManager.loadTexture('tower_sniper', '/assets/tower_sniper.png'),
        this.textureManager.loadTexture('tower_rapid', '/assets/tower_rapid.png'),
        this.textureManager.loadTexture('enemy_basic', '/assets/enemy_basic.png'),
        this.textureManager.loadTexture('enemy_fast', '/assets/enemy_fast.png'),
        this.textureManager.loadTexture('enemy_tank', '/assets/enemy_tank.png'),
        this.textureManager.loadTexture('projectile', '/assets/projectile.png'),
        this.textureManager.loadTexture('health_pickup', '/assets/health_pickup.png'),
        this.textureManager.loadTexture('power_up', '/assets/power_up.png')
      ]);
    } catch (error) {
      console.warn('Some textures failed to load, falling back to primitive rendering:', error);
    }
  }

  clear(backgroundColor?: string): void {
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  renderGrid(): void {
    const cellSize = this.grid.cellSize;
    const visibleBounds = this.camera.getVisibleBounds();
    
    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(this.grid.height, Math.ceil(visibleBounds.max.y / cellSize));
    
    // Render only visible cells
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const cellType = this.grid.getCellType(x, y);
        const worldPos = this.grid.gridToWorld(x, y);
        const screenPos = this.camera.worldToScreen(worldPos);
        
        if (cellType === CellType.PATH) {
          this.ctx.fillStyle = '#654321';
          this.ctx.fillRect(
            screenPos.x - cellSize / 2,
            screenPos.y - cellSize / 2,
            cellSize,
            cellSize
          );
        } else if (cellType === CellType.BLOCKED) {
          this.ctx.fillStyle = '#444444';
          this.ctx.fillRect(
            screenPos.x - cellSize / 2,
            screenPos.y - cellSize / 2,
            cellSize,
            cellSize
          );
        } else if (cellType === CellType.OBSTACLE) {
          // Render rocks/obstacles
          this.ctx.fillStyle = '#666666';
          this.ctx.beginPath();
          this.ctx.arc(screenPos.x, screenPos.y, cellSize / 3, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Add some detail
          this.ctx.strokeStyle = '#888888';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }
      }
    }

    // Render grid lines
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      const worldX = x * cellSize;
      const screenX = this.camera.worldToScreen({ x: worldX, y: 0 }).x;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.viewportHeight);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      const worldY = y * cellSize;
      const screenY = this.camera.worldToScreen({ x: 0, y: worldY }).y;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.viewportWidth, screenY);
    }

    this.ctx.stroke();
  }

  // Helper method to convert entity position for rendering
  private getScreenPosition(entity: Entity | Vector2): Vector2 {
    const worldPos = 'position' in entity ? entity.position : entity;
    return this.camera.worldToScreen(worldPos);
  }

  renderTower(tower: Tower): void {
    // Skip if not visible
    if (!this.camera.isVisible(tower.position, tower.radius)) return;
    
    const screenPos = this.getScreenPosition(tower);
    
    // Try to render with texture first
    const textureId = `tower_${tower.towerType.toLowerCase()}`;
    const texture = this.textureManager.getTexture(textureId);
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, tower.radius * 2, tower.radius * 2);
    } else {
      // Fallback to primitive rendering
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, tower.radius, 0, Math.PI * 2);
      
      // Different colors for different tower types with upgrade intensity
      const upgradeLevel = tower.getVisualLevel();
      const intensity = Math.min(1 + (upgradeLevel - 1) * 0.2, 1.8); // Brighter with upgrades
      
      switch (tower.towerType) {
        case 'BASIC':
          this.ctx.fillStyle = `hsl(120, 60%, ${Math.min(50 * intensity, 80)}%)`;
          break;
        case 'SNIPER':
          this.ctx.fillStyle = `hsl(210, 60%, ${Math.min(50 * intensity, 80)}%)`;
          break;
        case 'RAPID':
          this.ctx.fillStyle = `hsl(35, 60%, ${Math.min(50 * intensity, 80)}%)`;
          break;
        default:
          this.ctx.fillStyle = '#4CAF50';
      }
      
      this.ctx.fill();
      
      // Tower outline - thicker for upgraded towers
      this.ctx.strokeStyle = upgradeLevel > 1 ? '#222222' : '#333333';
      this.ctx.lineWidth = upgradeLevel > 1 ? 3 : 2;
      this.ctx.stroke();
    }
    
    // Render upgrade dots
    this.renderTowerUpgradeDots(tower);
  }

  renderTowerUpgradeDots(tower: Tower): void {
    const screenPos = this.getScreenPosition(tower);
    const upgradeTypes = [UpgradeType.DAMAGE, UpgradeType.RANGE, UpgradeType.FIRE_RATE];
    const colors = ['#FF4444', '#44FF44', '#4444FF']; // Red, Green, Blue
    const dotRadius = 3;
    const spacing = 8;
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType);
      
      if (level > 0) {
        // Position dots around the tower
        const angle = (index * 120) * (Math.PI / 180); // 120 degrees apart
        const distance = tower.radius + 8;
        
        for (let i = 0; i < level; i++) {
          const dotDistance = distance + (i * 4);
          const x = screenPos.x + Math.cos(angle) * dotDistance;
          const y = screenPos.y + Math.sin(angle) * dotDistance;
          
          this.ctx.beginPath();
          this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = colors[index];
          this.ctx.fill();
          
          // Dot outline
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    });
  }

  renderEnemy(enemy: Enemy): void {
    if (!this.camera.isVisible(enemy.position, enemy.radius)) return;
    const screenPos = this.getScreenPosition(enemy);
    
    // Try to render with texture first
    const textureId = `enemy_${enemy.enemyType.toLowerCase()}`;
    const texture = this.textureManager.getTexture(textureId);
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, enemy.radius * 2, enemy.radius * 2);
    } else {
      // Fallback to primitive rendering
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, enemy.radius, 0, Math.PI * 2);
      
      // Different colors for different enemy types
      switch (enemy.enemyType) {
        case 'BASIC':
          this.ctx.fillStyle = '#F44336';
          break;
        case 'FAST':
          this.ctx.fillStyle = '#FF5722';
          break;
        case 'TANK':
          this.ctx.fillStyle = '#9C27B0';
          break;
        default:
          this.ctx.fillStyle = '#F44336';
      }
      
      this.ctx.fill();
    }
    
    // Enemy outline - different color based on target
    const targetType = enemy.getTargetType();
    if (targetType === 'tower') {
      this.ctx.strokeStyle = '#FFD700'; // Gold outline for tower attackers
      this.ctx.lineWidth = 2;
    } else if (targetType === 'player') {
      this.ctx.strokeStyle = '#FF4444'; // Red outline for player attackers  
      this.ctx.lineWidth = 2;
    } else {
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
    }
    this.ctx.strokeRect(
      screenPos.x - enemy.radius,
      screenPos.y - enemy.radius,
      enemy.radius * 2,
      enemy.radius * 2
    );
    
    // Draw target indicator line if enemy has a target
    const target = enemy.getTarget();
    if (target && this.camera.isVisible(target.position, 10)) {
      const targetScreenPos = this.getScreenPosition(target);
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenPos.x, screenPos.y);
      this.ctx.lineTo(targetScreenPos.x, targetScreenPos.y);
      this.ctx.setLineDash([3, 3]);
      this.ctx.strokeStyle = targetType === 'tower' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 68, 68, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  renderProjectile(projectile: Projectile): void {
    if (!this.camera.isVisible(projectile.position, projectile.radius)) return;
    const screenPos = this.getScreenPosition(projectile);
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('projectile');
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, projectile.radius * 2, projectile.radius * 2);
    } else {
      // Fallback to primitive rendering
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, projectile.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFEB3B';
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#FFC107';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  renderPlayer(player: Player): void {
    if (!this.camera.isVisible(player.position, player.radius)) return;
    const screenPos = this.getScreenPosition(player);
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('player');
    
    if (texture && texture.loaded) {
      this.renderTextureAt(texture, screenPos, player.radius * 2, player.radius * 2);
    } else {
      // Fallback to primitive rendering
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, player.radius, 0, Math.PI * 2);
      
      // Player color based on level
      const level = player.getLevel();
      const hue = Math.min(180 + level * 20, 280); // Blue to purple progression
      this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      this.ctx.fill();
      
      // Player outline
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Movement indicator (if moving)
    if (player.isMoving()) {
      const velocity = player.getVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      if (speed > 0) {
        // Draw movement trail
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, player.radius + 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
    
    // Level indicator
    const level = player.getLevel();
    if (level > 1) {
      this.renderText(
        level.toString(),
        screenPos.x,
        screenPos.y + 4,
        '#FFFFFF',
        'bold 10px Arial',
        'center'
      );
    }
  }

  renderHealthPickup(pickup: HealthPickup): void {
    if (!pickup.isActive || !this.camera.isVisible(pickup.position, pickup.radius)) return;
    
    const screenPos = this.getScreenPosition(pickup);
    const visualY = pickup.getVisualY() - pickup.position.y + screenPos.y;
    const rotation = pickup.getRotation();
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('health_pickup');
    
    this.ctx.save();
    this.ctx.translate(screenPos.x, visualY);
    this.ctx.rotate(rotation);
    
    if (texture && texture.loaded) {
      this.ctx.drawImage(
        texture.image,
        -pickup.radius,
        -pickup.radius,
        pickup.radius * 2,
        pickup.radius * 2
      );
    } else {
      // Fallback to primitive rendering
      this.ctx.strokeStyle = '#00FF00';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      
      // Vertical line
      this.ctx.beginPath();
      this.ctx.moveTo(0, -6);
      this.ctx.lineTo(0, 6);
      this.ctx.stroke();
      
      // Horizontal line  
      this.ctx.beginPath();
      this.ctx.moveTo(-6, 0);
      this.ctx.lineTo(6, 0);
      this.ctx.stroke();
    }
    
    // Glow effect
    this.ctx.shadowColor = '#00FF00';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  renderPowerUp(powerUp: PowerUp): void {
    if (!powerUp.isActive || !this.camera.isVisible(powerUp.position, powerUp.radius)) return;

    const screenPos = this.getScreenPosition(powerUp);
    const visualY = powerUp.getVisualY() - powerUp.position.y + screenPos.y;
    const rotation = powerUp.getRotation();
    const scale = powerUp.getPulseScale();
    const config = powerUp.getConfig();
    
    // Try to render with texture first
    const texture = this.textureManager.getTexture('power_up');
    
    this.ctx.save();
    this.ctx.translate(screenPos.x, visualY);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);
    
    if (texture && texture.loaded) {
      this.ctx.drawImage(
        texture.image,
        -powerUp.radius,
        -powerUp.radius,
        powerUp.radius * 2,
        powerUp.radius * 2
      );
    } else {
      // Fallback to primitive rendering
      this.ctx.fillStyle = config.color;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      
      switch (powerUp.powerUpType) {
        case 'EXTRA_DAMAGE':
          // Draw sword/damage icon
          this.ctx.beginPath();
          this.ctx.moveTo(-8, 8);
          this.ctx.lineTo(8, -8);
          this.ctx.lineTo(6, -10);
          this.ctx.lineTo(-10, 6);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
          
        case 'FASTER_SHOOTING':
          // Draw rapid fire arrows
          this.ctx.beginPath();
          this.ctx.moveTo(-8, 0);
          this.ctx.lineTo(8, 0);
          this.ctx.moveTo(4, -4);
          this.ctx.lineTo(8, 0);
          this.ctx.lineTo(4, 4);
          this.ctx.stroke();
          break;
          
        case 'EXTRA_CURRENCY':
          // Draw coin
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.font = 'bold 10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('$', 0, 3);
          break;
          
        case 'SHIELD':
          // Draw shield
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 8, 0, Math.PI);
          this.ctx.lineTo(-8, 8);
          this.ctx.lineTo(8, 8);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
          
        case 'SPEED_BOOST':
          // Draw wing/speed lines
          this.ctx.beginPath();
          this.ctx.moveTo(-8, -4);
          this.ctx.lineTo(8, -4);
          this.ctx.moveTo(-6, 0);
          this.ctx.lineTo(8, 0);
          this.ctx.moveTo(-8, 4);
          this.ctx.lineTo(8, 4);
          this.ctx.stroke();
          break;
      }
    }
    
    // Glow effect
    this.ctx.shadowColor = config.color;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(${this.hexToRgb(config.color)}, 0.3)`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '255, 255, 255';
  }

  renderAimerLine(aimerLine: { start: Vector2; end: Vector2 }): void {
    const screenStart = this.camera.worldToScreen(aimerLine.start);
    const screenEnd = this.camera.worldToScreen(aimerLine.end);
    
    this.ctx.beginPath();
    this.ctx.moveTo(screenStart.x, screenStart.y);
    this.ctx.lineTo(screenEnd.x, screenEnd.y);
    
    // Dashed line
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Reset line dash
    this.ctx.setLineDash([]);
    
    // Aim point
    this.ctx.beginPath();
    this.ctx.arc(screenEnd.x, screenEnd.y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fill();
  }

  renderHealthBar(entity: Entity, alwaysShow: boolean = false): void {
    // Show health bar if damaged or if alwaysShow is true
    if (!alwaysShow && entity.health >= entity.maxHealth) {
      return;
    }

    // Skip if entity is not visible
    if (!this.camera.isVisible(entity.position, entity.radius + 10)) return;

    const screenPos = this.getScreenPosition(entity);
    const barWidth = 28;
    const barHeight = 5;
    const x = screenPos.x - barWidth / 2;
    const y = screenPos.y - entity.radius - 10;
    
    // Background
    this.ctx.fillStyle = '#222222';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health bar
    const healthPercentage = entity.health / entity.maxHealth;
    const healthWidth = barWidth * healthPercentage;
    
    if (healthPercentage > 0.6) {
      this.ctx.fillStyle = '#4CAF50';
    } else if (healthPercentage > 0.3) {
      this.ctx.fillStyle = '#FF9800';
    } else {
      this.ctx.fillStyle = '#F44336';
    }
    
    this.ctx.fillRect(x, y, healthWidth, barHeight);
    
    // Health bar outline
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
  }

  renderTowerRange(tower: Tower): void {
    if (!this.camera.isVisible(tower.position, tower.range)) return;
    
    const screenPos = this.getScreenPosition(tower);
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, tower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash
  }

  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    // Create a temporary tower to get its stats
    const tempTower = new Tower(towerType, position);
    
    const screenPos = this.camera.worldToScreen(position);
    
    // Save current context state
    this.ctx.save();
    
    // Set transparency for ghost effect
    this.ctx.globalAlpha = 0.6;
    
    // Render tower body
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, tempTower.radius, 0, Math.PI * 2);
    
    // Color based on placement validity
    if (canPlace) {
      // Green tint for valid placement
      switch (towerType) {
        case TowerType.BASIC:
          this.ctx.fillStyle = '#81C784'; // Light green
          break;
        case TowerType.SNIPER:
          this.ctx.fillStyle = '#64B5F6'; // Light blue
          break;
        case TowerType.RAPID:
          this.ctx.fillStyle = '#FFB74D'; // Light orange
          break;
      }
    } else {
      // Red tint for invalid placement
      this.ctx.fillStyle = '#E57373'; // Light red
    }
    
    this.ctx.fill();
    
    // Tower outline
    this.ctx.strokeStyle = canPlace ? '#4CAF50' : '#F44336';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Show range preview
    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, tempTower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash
    
    // Restore context state
    this.ctx.restore();
  }

  // Helper method to render texture at specific position and size
  private renderTextureAt(texture: Texture, position: Vector2, width: number, height: number): void {
    this.ctx.drawImage(
      texture.image,
      position.x - width / 2,
      position.y - height / 2,
      width,
      height
    );
  }

  renderText(
    text: string, 
    x: number, 
    y: number, 
    color: string = '#ffffff', 
    font: string = '16px Arial',
    align: CanvasTextAlign = 'left'
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  renderEntities(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], healthPickups: HealthPickup[], powerUps: PowerUp[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player): void {
    // Render towers with health bars
    towers.forEach(tower => {
      this.renderTower(tower);
      this.renderHealthBar(tower, true); // Always show tower health
    });

    // Render enemies with health bars
    enemies.forEach(enemy => {
      this.renderEnemy(enemy);
      this.renderHealthBar(enemy, true); // Always show enemy health
    });

    // Render health pickups
    healthPickups.forEach(pickup => {
      this.renderHealthPickup(pickup);
    });

    // Render power-ups
    powerUps.forEach(powerUp => {
      this.renderPowerUp(powerUp);
    });

    // Render projectiles
    projectiles.forEach(projectile => {
      this.renderProjectile(projectile);
    });

    // Render player with health bar
    if (player) {
      this.renderPlayer(player);
      this.renderHealthBar(player, true); // Always show player health
    }

    // Render aimer line
    if (aimerLine) {
      this.renderAimerLine(aimerLine);
    }
  }

  renderScene(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], healthPickups: HealthPickup[], powerUps: PowerUp[], aimerLine: { start: Vector2; end: Vector2 } | null, player?: Player): void {
    // Clear canvas
    this.clear('#2E2E2E');
    
    // Render grid
    this.renderGrid();
    
    // Render all entities
    this.renderEntities(towers, enemies, projectiles, healthPickups, powerUps, aimerLine, player);
  }

  renderUI(currency: number, lives: number, score: number, wave: number): void {
    const padding = 10;
    const fontSize = 18;
    const lineHeight = 25;
    
    this.renderText(`Currency: $${currency}`, padding, padding + fontSize, '#FFD700', `${fontSize}px Arial`);
    this.renderText(`Lives: ${lives}`, padding, padding + fontSize + lineHeight, '#FF4444', `${fontSize}px Arial`);
    this.renderText(`Score: ${score}`, padding, padding + fontSize + lineHeight * 2, '#4CAF50', `${fontSize}px Arial`);
    this.renderText(`Wave: ${wave}`, padding, padding + fontSize + lineHeight * 3, '#2196F3', `${fontSize}px Arial`);
  }

  renderGameOver(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Game Over text
    this.renderText(
      'GAME OVER',
      this.canvas.width / 2,
      this.canvas.height / 2,
      '#FF4444',
      '48px Arial',
      'center'
    );
  }

  renderVictory(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Victory text
    this.renderText(
      'VICTORY!',
      this.canvas.width / 2,
      this.canvas.height / 2,
      '#4CAF50',
      '48px Arial',
      'center'
    );
  }

  renderPaused(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Paused text
    this.renderText(
      'PAUSED',
      this.canvas.width / 2,
      this.canvas.height / 2,
      '#FFD700',
      '48px Arial',
      'center'
    );
    
    // Instructions
    this.renderText(
      'Press SPACE to resume',
      this.canvas.width / 2,
      this.canvas.height / 2 + 60,
      '#FFFFFF',
      '20px Arial',
      'center'
    );
  }

  renderTowerUpgradePanel(tower: Tower, x: number, y: number, upgradeManager: any): void {
    const panelWidth = 250;
    const panelHeight = 180;
    
    // Panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(x, y, panelWidth, panelHeight);
    
    // Panel border
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    // Tower info
    const padding = 10;
    let currentY = y + padding + 20;
    
    this.renderText(
      `${tower.towerType} Tower (Level ${tower.getLevel()})`,
      x + padding,
      currentY,
      '#FFFFFF',
      'bold 16px Arial'
    );
    
    currentY += 25;
    
    // Stats
    this.renderText(
      `Damage: ${tower.damage} | Range: ${tower.range} | Fire Rate: ${tower.fireRate.toFixed(1)}`,
      x + padding,
      currentY,
      '#CCCCCC',
      '12px Arial'
    );
    
    currentY += 25;
    
    // Upgrade options
    const upgradeTypes = ['DAMAGE', 'RANGE', 'FIRE_RATE'];
    const upgradeNames = ['Damage', 'Range', 'Fire Rate'];
    
    upgradeTypes.forEach((upgradeType, index) => {
      const level = tower.getUpgradeLevel(upgradeType as any);
      const cost = upgradeManager?.getUpgradeCost(tower, upgradeType) || 0;
      const canUpgrade = tower.canUpgrade(upgradeType as any);
      
      const color = canUpgrade ? '#4CAF50' : '#666666';
      const text = `${upgradeNames[index]}: Lv.${level}/5 (${cost > 0 ? `$${cost}` : 'MAX'})`;
      
      this.renderText(
        text,
        x + padding,
        currentY,
        color,
        '14px Arial'
      );
      
      currentY += 20;
    });
    
    // Instructions
    this.renderText(
      'Click tower upgrades in UI panel',
      x + padding,
      y + panelHeight - 15,
      '#888888',
      '12px Arial'
    );
  }
}