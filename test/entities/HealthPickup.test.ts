import { describe, it, expect, beforeEach } from 'vitest';
import { HealthPickup } from '@/entities/HealthPickup';
import { Player } from '@/entities/Player';
import { EntityType } from '@/entities/Entity';

describe('HealthPickup Entity', () => {
  let healthPickup: HealthPickup;
  let player: Player;

  beforeEach(() => {
    healthPickup = new HealthPickup({ x: 100, y: 100 });
    player = new Player({ x: 200, y: 200 });
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(healthPickup.healAmount).toBe(25);
      expect(healthPickup.radius).toBe(10);
      expect(healthPickup.isActive).toBe(true);
      expect(healthPickup.type).toBe(EntityType.HEALTH_PICKUP);
    });

    it('should allow custom heal amount', () => {
      const customPickup = new HealthPickup({ x: 0, y: 0 }, 50);
      expect(customPickup.healAmount).toBe(50);
    });
  });

  describe('player interaction', () => {
    it('should detect collision with player', () => {
      // Move player close to pickup
      player.position.x = 105;
      player.position.y = 105;
      
      expect(healthPickup.checkCollisionWithPlayer(player)).toBe(true);
    });

    it('should not detect collision when player is far', () => {
      expect(healthPickup.checkCollisionWithPlayer(player)).toBe(false);
    });

    it('should heal player on collision', () => {
      player.takeDamage(50); // Player health: 50/100
      player.position.x = 105;
      player.position.y = 105;
      
      const healed = healthPickup.tryHealPlayer(player);
      
      expect(healed).toBe(true);
      expect(player.health).toBe(75); // 50 + 25 heal
    });

    it('should not overheal player', () => {
      player.takeDamage(10); // Player health: 90/100
      player.position.x = 105;
      player.position.y = 105;
      
      healthPickup.tryHealPlayer(player);
      
      expect(player.health).toBe(100); // Capped at max
    });

    it('should deactivate after being collected', () => {
      player.takeDamage(50);
      player.position.x = 105;
      player.position.y = 105;
      
      healthPickup.tryHealPlayer(player);
      
      expect(healthPickup.isActive).toBe(false);
    });

    it('should not heal if already collected', () => {
      player.takeDamage(50);
      player.position.x = 105;
      player.position.y = 105;
      
      healthPickup.tryHealPlayer(player);
      const healthAfterFirst = player.health;
      
      // Try to collect again
      const secondHeal = healthPickup.tryHealPlayer(player);
      
      expect(secondHeal).toBe(false);
      expect(player.health).toBe(healthAfterFirst);
    });

    it('should not heal dead player', () => {
      player.takeDamage(player.health); // Kill player
      player.position.x = 105;
      player.position.y = 105;
      
      const healed = healthPickup.tryHealPlayer(player);
      
      expect(healed).toBe(false);
      expect(player.health).toBe(0);
    });
  });

  describe('visual effects', () => {
    it('should have bobbing animation', () => {
      const initialY = healthPickup.position.y;
      
      healthPickup.update(250); // 0.25 seconds
      const y1 = healthPickup.getVisualY();
      
      healthPickup.update(500); // 0.5 seconds more
      const y2 = healthPickup.getVisualY();
      
      // Should have different Y positions due to bobbing
      expect(y1).not.toBe(y2);
      expect(y1).not.toBe(initialY);
    });

    it('should rotate over time', () => {
      const initialRotation = healthPickup.getRotation();
      
      healthPickup.update(1000); // 1 second
      
      const newRotation = healthPickup.getRotation();
      expect(newRotation).not.toBe(initialRotation);
    });
  });

  describe('spawn system', () => {
    it('should have proper spawn conditions', () => {
      // Test static method for spawn chance
      expect(HealthPickup.getSpawnChance()).toBeGreaterThan(0);
      expect(HealthPickup.getSpawnChance()).toBeLessThanOrEqual(1);
    });

    it('should spawn from defeated enemies based on chance', () => {
      // This would be tested in the Game class integration tests
      // Just verify the spawn method exists
      expect(HealthPickup.shouldSpawnFromEnemy).toBeDefined();
    });
  });
});