import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '@/entities/Player';
import { Enemy, EnemyType } from '@/entities/Enemy';

describe('Player Manual Shooting', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player({ x: 400, y: 300 });
  });

  describe('shooting modes', () => {
    it('should not auto-shoot by default', () => {
      const enemy = new Enemy({ x: 450, y: 300 }, 50, EnemyType.BASIC);
      const projectile = player.autoShoot([enemy]);
      
      expect(projectile).toBe(null);
      expect(player.isAutoShootEnabled()).toBe(false);
    });

    it('should have manual shooting mode', () => {
      expect(player.getShootingMode()).toBe('manual');
    });

    it('should track mouse position for aiming', () => {
      player.setAimPosition({ x: 500, y: 400 });
      
      const aimPos = player.getAimPosition();
      expect(aimPos.x).toBe(500);
      expect(aimPos.y).toBe(400);
    });

    it('should calculate aim angle correctly', () => {
      player.setAimPosition({ x: 500, y: 300 }); // Directly to the right
      
      const angle = player.getAimAngle();
      expect(angle).toBe(0); // 0 radians = pointing right
    });

    it('should calculate aim angle for different positions', () => {
      // Aim down
      player.setAimPosition({ x: 400, y: 400 });
      expect(player.getAimAngle()).toBeCloseTo(Math.PI / 2, 2);
      
      // Aim up-right (45 degrees)
      player.setAimPosition({ x: 500, y: 200 });
      expect(player.getAimAngle()).toBeCloseTo(-Math.PI / 4, 2);
    });
  });

  describe('manual shooting', () => {
    it('should shoot on click when cooldown is ready', () => {
      player.setAimPosition({ x: 500, y: 300 });
      
      const projectile = player.shootManual();
      
      expect(projectile).toBeTruthy();
      expect(projectile!.damage).toBe(player.damage);
    });

    it('should not shoot on click when on cooldown', () => {
      player.setAimPosition({ x: 500, y: 300 });
      
      player.shootManual();
      const secondShot = player.shootManual();
      
      expect(secondShot).toBe(null);
    });

    it('should shoot in aim direction', () => {
      player.setAimPosition({ x: 500, y: 400 }); // Down-right
      
      const projectile = player.shootManual();
      
      expect(projectile).toBeTruthy();
      // Projectile should be moving in the aim direction
      const angle = Math.atan2(projectile!.velocity.y, projectile!.velocity.x);
      expect(angle).toBeCloseTo(player.getAimAngle(), 2);
    });

    it('should shoot even without enemies nearby', () => {
      player.setAimPosition({ x: 500, y: 300 });
      
      const projectile = player.shootManual();
      
      expect(projectile).toBeTruthy();
    });
  });

  describe('click and hold shooting', () => {
    it('should start auto-shoot on mouse down', () => {
      player.handleMouseDown({ x: 500, y: 300 });
      
      expect(player.isHoldingToShoot()).toBe(true);
    });

    it('should stop auto-shoot on mouse up', () => {
      player.handleMouseDown({ x: 500, y: 300 });
      player.handleMouseUp();
      
      expect(player.isHoldingToShoot()).toBe(false);
    });

    it('should shoot immediately on mouse down if cooldown ready', () => {
      const projectile = player.handleMouseDown({ x: 500, y: 300 });
      
      expect(projectile).toBeTruthy();
    });

    it('should continue shooting while holding', () => {
      player.handleMouseDown({ x: 500, y: 300 });
      
      // Wait for cooldown
      player.update(600);
      
      // Should shoot again automatically
      const projectiles = player.updateShooting();
      expect(projectiles).toBeTruthy();
    });

    it('should update aim position while holding and moving mouse', () => {
      player.handleMouseDown({ x: 500, y: 300 });
      player.handleMouseMove({ x: 600, y: 400 });
      
      const aimPos = player.getAimPosition();
      expect(aimPos.x).toBe(600);
      expect(aimPos.y).toBe(400);
    });

    it('should stop shooting when mouse released', () => {
      player.handleMouseDown({ x: 500, y: 300 });
      player.update(600); // Wait for cooldown
      player.handleMouseUp();
      
      const projectile = player.updateShooting();
      expect(projectile).toBe(null);
    });
  });

  describe('aimer line visibility', () => {
    it('should show aimer when not holding to shoot', () => {
      expect(player.shouldShowAimer()).toBe(true);
    });

    it('should show aimer while holding to shoot', () => {
      player.handleMouseDown({ x: 500, y: 300 });
      expect(player.shouldShowAimer()).toBe(true);
    });

    it('should have aimer line endpoints', () => {
      player.setAimPosition({ x: 500, y: 300 });
      
      const aimerLine = player.getAimerLine();
      expect(aimerLine.start).toEqual(player.position);
      expect(aimerLine.end).toBeDefined();
      
      // Aimer should extend in aim direction
      const dx = aimerLine.end.x - aimerLine.start.x;
      const dy = aimerLine.end.y - aimerLine.start.y;
      const angle = Math.atan2(dy, dx);
      expect(angle).toBeCloseTo(player.getAimAngle(), 2);
    });

    it('should have configurable aimer length', () => {
      player.setAimPosition({ x: 500, y: 300 });
      
      const aimerLine = player.getAimerLine();
      const length = Math.hypot(
        aimerLine.end.x - aimerLine.start.x,
        aimerLine.end.y - aimerLine.start.y
      );
      
      expect(length).toBeGreaterThan(50); // Should be visible
      expect(length).toBeLessThan(200); // But not too long
    });
  });

  describe('integration with movement', () => {
    it('should allow shooting while moving', () => {
      player.handleKeyDown('w'); // Move up
      player.update(16); // Update to process movement
      player.setAimPosition({ x: 500, y: 300 });
      
      const projectile = player.shootManual();
      
      expect(projectile).toBeTruthy();
      expect(player.isMoving()).toBe(true);
    });

    it('should maintain aim direction independent of movement', () => {
      player.handleKeyDown('a'); // Move left
      player.setAimPosition({ x: 500, y: 300 }); // Aim right
      
      player.update(100);
      
      // Player moves left but aims right
      expect(player.velocity.x).toBeLessThan(0);
      expect(player.getAimAngle()).toBe(0); // Still aiming right
    });
  });
});