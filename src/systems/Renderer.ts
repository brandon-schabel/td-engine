import { Tower, TowerType } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Player, PlayerUpgradeType } from '../entities/Player';
import { Entity } from '../entities/Entity';
import { Grid, CellType } from './Grid';
import { UpgradeType } from './TowerUpgradeManager';
import type { Vector2 } from '../utils/Vector2';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private grid: Grid;

  constructor(canvas: HTMLCanvasElement, grid: Grid) {
    this.canvas = canvas;
    this.grid = grid;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
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
    
    // Render cell backgrounds
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const cellType = this.grid.getCellType(x, y);
        const worldPos = this.grid.gridToWorld(x, y);
        
        if (cellType === CellType.PATH) {
          this.ctx.fillStyle = '#654321';
          this.ctx.fillRect(
            worldPos.x - cellSize / 2,
            worldPos.y - cellSize / 2,
            cellSize,
            cellSize
          );
        } else if (cellType === CellType.BLOCKED) {
          this.ctx.fillStyle = '#444444';
          this.ctx.fillRect(
            worldPos.x - cellSize / 2,
            worldPos.y - cellSize / 2,
            cellSize,
            cellSize
          );
        }
      }
    }

    // Render grid lines
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Vertical lines
    for (let x = 0; x <= this.grid.width; x++) {
      const xPos = x * cellSize;
      this.ctx.moveTo(xPos, 0);
      this.ctx.lineTo(xPos, this.grid.height * cellSize);
    }

    // Horizontal lines
    for (let y = 0; y <= this.grid.height; y++) {
      const yPos = y * cellSize;
      this.ctx.moveTo(0, yPos);
      this.ctx.lineTo(this.grid.width * cellSize, yPos);
    }

    this.ctx.stroke();
  }

  renderTower(tower: Tower): void {
    // Main tower body
    this.ctx.beginPath();
    this.ctx.arc(tower.position.x, tower.position.y, tower.radius, 0, Math.PI * 2);
    
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
    
    // Render upgrade dots
    this.renderTowerUpgradeDots(tower);
  }

  renderTowerUpgradeDots(tower: Tower): void {
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
          const x = tower.position.x + Math.cos(angle) * dotDistance;
          const y = tower.position.y + Math.sin(angle) * dotDistance;
          
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
    this.ctx.beginPath();
    this.ctx.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
    
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
    
    // Enemy outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  renderProjectile(projectile: Projectile): void {
    this.ctx.beginPath();
    this.ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFEB3B';
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#FFC107';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  renderPlayer(player: Player): void {
    // Player body (larger circle)
    this.ctx.beginPath();
    this.ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
    
    // Player color based on level
    const level = player.getLevel();
    const hue = Math.min(180 + level * 20, 280); // Blue to purple progression
    this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
    this.ctx.fill();
    
    // Player outline
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Movement indicator (if moving)
    if (player.isMoving()) {
      const velocity = player.getVelocity();
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      if (speed > 0) {
        // Draw movement trail
        this.ctx.beginPath();
        this.ctx.arc(player.position.x, player.position.y, player.radius + 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
    
    // Level indicator
    if (level > 1) {
      this.renderText(
        level.toString(),
        player.position.x,
        player.position.y + 4,
        '#FFFFFF',
        'bold 10px Arial',
        'center'
      );
    }
  }

  renderHealthBar(entity: Entity, alwaysShow: boolean = false): void {
    // Show health bar if damaged or if alwaysShow is true
    if (!alwaysShow && entity.health >= entity.maxHealth) {
      return;
    }

    const barWidth = 28;
    const barHeight = 5;
    const x = entity.position.x - barWidth / 2;
    const y = entity.position.y - entity.radius - 10;
    
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
    this.ctx.beginPath();
    this.ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash
  }

  renderTowerGhost(towerType: TowerType, position: Vector2, canPlace: boolean): void {
    // Create a temporary tower to get its stats
    const tempTower = new Tower(towerType, position);
    
    // Save current context state
    this.ctx.save();
    
    // Set transparency for ghost effect
    this.ctx.globalAlpha = 0.6;
    
    // Render tower body
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, tempTower.radius, 0, Math.PI * 2);
    
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
    this.ctx.arc(position.x, position.y, tempTower.range, 0, Math.PI * 2);
    this.ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset line dash
    
    // Restore context state
    this.ctx.restore();
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

  renderEntities(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], player?: Player): void {
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

    // Render projectiles
    projectiles.forEach(projectile => {
      this.renderProjectile(projectile);
    });

    // Render player with health bar
    if (player) {
      this.renderPlayer(player);
      this.renderHealthBar(player, true); // Always show player health
    }
  }

  renderScene(towers: Tower[], enemies: Enemy[], projectiles: Projectile[], player?: Player): void {
    // Clear canvas
    this.clear('#2E2E2E');
    
    // Render grid
    this.renderGrid();
    
    // Render all entities
    this.renderEntities(towers, enemies, projectiles, player);
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