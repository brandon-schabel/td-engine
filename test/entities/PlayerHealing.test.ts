import { describe, it, expect, beforeEach } from 'vitest';
import { Player, PlayerUpgradeType } from '@/entities/Player';

describe('Player Healing Mechanisms', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player({ x: 100, y: 100 });
  });

  describe('health regeneration', () => {
    it('should have regeneration disabled by default', () => {
      expect(player.hasRegeneration()).toBe(false);
      expect(player.getRegenerationRate()).toBe(0);
    });

    it('should enable regeneration with upgrade', () => {
      player.upgrade(PlayerUpgradeType.REGENERATION);
      
      expect(player.hasRegeneration()).toBe(true);
      expect(player.getRegenerationRate()).toBeGreaterThan(0);
    });

    it('should regenerate health over time when enabled', () => {
      player.takeDamage(50); // Health: 50/100
      player.upgrade(PlayerUpgradeType.REGENERATION);
      
      // Wait for damage cooldown to expire
      player.update(3000); // 3 seconds
      
      const healthBefore = player.health;
      player.update(1000); // 1 second of regeneration
      
      expect(player.health).toBeGreaterThan(healthBefore);
    });

    it('should not regenerate above max health', () => {
      player.takeDamage(5); // Health: 95/100
      player.upgrade(PlayerUpgradeType.REGENERATION);
      
      // Wait for damage cooldown
      player.update(3000); // 3 seconds
      player.update(10000); // 10 seconds (way more than needed)
      
      expect(player.health).toBe(player.maxHealth);
    });

    it('should not regenerate when dead', () => {
      player.upgrade(PlayerUpgradeType.REGENERATION);
      player.takeDamage(player.health); // Kill player
      
      player.update(1000);
      
      expect(player.health).toBe(0);
      expect(player.isAlive).toBe(false);
    });

    it('should increase regeneration rate with upgrade levels', () => {
      player.upgrade(PlayerUpgradeType.REGENERATION);
      const rate1 = player.getRegenerationRate();
      
      player.upgrade(PlayerUpgradeType.REGENERATION);
      const rate2 = player.getRegenerationRate();
      
      expect(rate2).toBeGreaterThan(rate1);
    });

    it('should not regenerate while taking damage', () => {
      player.takeDamage(50);
      player.upgrade(PlayerUpgradeType.REGENERATION);
      
      // Simulate taking damage
      player.takeDamage(10);
      const healthAfterDamage = player.health;
      
      // Update immediately after damage
      player.update(100); // 0.1 seconds
      
      // Should not regenerate due to damage cooldown
      expect(player.health).toBe(healthAfterDamage);
    });

    it('should start regenerating after damage cooldown', () => {
      player.takeDamage(50);
      player.upgrade(PlayerUpgradeType.REGENERATION);
      
      player.takeDamage(10);
      const healthAfterDamage = player.health;
      
      // Wait for damage cooldown
      player.update(3000); // 3 seconds
      
      expect(player.health).toBeGreaterThan(healthAfterDamage);
    });
  });

  describe('active healing ability', () => {
    it('should have heal ability on cooldown initially', () => {
      expect(player.canUseHealAbility()).toBe(false);
    });

    it('should be able to use heal ability after initial cooldown', () => {
      player.update(5000); // 5 seconds
      expect(player.canUseHealAbility()).toBe(true);
    });

    it('should heal when ability is used', () => {
      player.takeDamage(60); // Health: 40/100
      player.update(5000); // Wait for cooldown
      
      const healed = player.useHealAbility();
      
      expect(healed).toBe(true);
      expect(player.health).toBe(70); // 40 + 30 instant heal
    });

    it('should go on cooldown after use', () => {
      player.takeDamage(50); // Need damage to heal
      player.update(5000);
      player.useHealAbility();
      
      expect(player.canUseHealAbility()).toBe(false);
      expect(player.getHealAbilityCooldown()).toBeGreaterThan(0);
    });

    it('should not heal if already at full health', () => {
      player.update(5000);
      
      const healed = player.useHealAbility();
      
      expect(healed).toBe(false); // No healing needed
      expect(player.canUseHealAbility()).toBe(true); // Ability not consumed
    });

    it('should not heal when dead', () => {
      player.update(5000);
      player.takeDamage(player.health);
      
      const healed = player.useHealAbility();
      
      expect(healed).toBe(false);
      expect(player.health).toBe(0);
    });

    it('should show cooldown progress', () => {
      player.takeDamage(50); // Need damage to heal
      player.update(5000);
      player.useHealAbility();
      
      const cooldown1 = player.getHealAbilityCooldownProgress();
      expect(cooldown1).toBe(0); // Just used
      
      player.update(10000); // 10 seconds
      const cooldown2 = player.getHealAbilityCooldownProgress();
      expect(cooldown2).toBeGreaterThan(0.4); // Almost halfway through
      
      player.update(10000); // 10 more seconds
      const cooldown3 = player.getHealAbilityCooldownProgress();
      expect(cooldown3).toBe(1); // Ready
    });
  });

  describe('health pickup interaction', () => {
    it('should be able to collect health pickups', () => {
      player.takeDamage(50);
      
      const healed = player.collectHealthPickup(25);
      
      expect(healed).toBe(true);
      expect(player.health).toBe(75);
    });

    it('should emit pickup event when collecting', () => {
      let eventFired = false;
      player.onHealthPickup(() => {
        eventFired = true;
      });
      
      player.takeDamage(50);
      player.collectHealthPickup(25);
      
      expect(eventFired).toBe(true);
    });

    it('should track health pickups collected', () => {
      player.takeDamage(80);
      
      expect(player.getHealthPickupsCollected()).toBe(0);
      
      player.collectHealthPickup(25);
      player.collectHealthPickup(25);
      
      expect(player.getHealthPickupsCollected()).toBe(2);
    });
  });

  describe('combined healing mechanics', () => {
    it('should stack regeneration with heal ability', () => {
      player.takeDamage(70); // Health: 30/100
      player.upgrade(PlayerUpgradeType.REGENERATION);
      player.update(5000); // Wait for ability cooldown
      
      player.useHealAbility(); // +30 instant
      const healthAfterAbility = player.health;
      
      player.update(2000); // 2 seconds of regeneration
      
      expect(player.health).toBeGreaterThan(healthAfterAbility);
    });

    it('should show total healing received', () => {
      player.takeDamage(80); // Health: 20/100
      
      const initialHealing = player.getTotalHealingReceived();
      
      // Heal from different sources
      player.collectHealthPickup(25); // +25
      player.update(5000);
      player.useHealAbility(); // +30
      player.upgrade(PlayerUpgradeType.REGENERATION);
      player.update(2000); // Some regeneration
      
      expect(player.getTotalHealingReceived()).toBeGreaterThan(initialHealing + 55);
    });
  });
});