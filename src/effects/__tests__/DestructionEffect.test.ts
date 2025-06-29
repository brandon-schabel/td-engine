import { describe, test, expect } from 'bun:test';
import { DestructionEffect } from '../DestructionEffect';
import { EnemyType } from '@/entities/Enemy';

describe('DestructionEffect', () => {
  test('should create particles based on multiplier', () => {
    const position = { x: 100, y: 100 };
    
    // Test with different multipliers
    const effectLow = new DestructionEffect(position, EnemyType.BASIC, 0.3);
    const effectMedium = new DestructionEffect(position, EnemyType.BASIC, 1.0);
    const effectHigh = new DestructionEffect(position, EnemyType.BASIC, 1.5);
    
    // Basic enemy has base count of 15 particles
    expect(effectLow.particles.length).toBe(Math.max(1, Math.floor(15 * 0.3))); // 4 particles
    expect(effectMedium.particles.length).toBe(15); // 15 particles
    expect(effectHigh.particles.length).toBe(Math.floor(15 * 1.5)); // 22 particles
  });
  
  test('should handle different enemy types with multiplier', () => {
    const position = { x: 100, y: 100 };
    const multiplier = 0.5;
    
    // Test different enemy types
    const basicEffect = new DestructionEffect(position, EnemyType.BASIC, multiplier);
    const fastEffect = new DestructionEffect(position, EnemyType.FAST, multiplier);
    const tankEffect = new DestructionEffect(position, EnemyType.TANK, multiplier);
    
    // Base counts: BASIC=15, FAST=10, TANK=20 + 5 debris
    expect(basicEffect.particles.length).toBe(Math.max(1, Math.floor(15 * 0.5))); // 7
    expect(fastEffect.particles.length).toBe(Math.max(1, Math.floor(10 * 0.5))); // 5
    // Tank has base particles + debris
    const tankBaseParticles = Math.max(1, Math.floor(20 * 0.5)); // 10
    const tankDebrisParticles = Math.max(1, Math.floor(5 * 0.5)); // 2
    expect(tankEffect.particles.length).toBe(tankBaseParticles + tankDebrisParticles); // 12
  });
  
  test('should ensure at least 1 particle even with very low multiplier', () => {
    const position = { x: 100, y: 100 };
    
    // Test with very low multiplier
    const effect = new DestructionEffect(position, EnemyType.FAST, 0.01);
    
    // Should have at least 1 particle
    expect(effect.particles.length).toBeGreaterThanOrEqual(1);
  });
  
  test('should clamp multiplier to at least 0.1', () => {
    const position = { x: 100, y: 100 };
    
    // Test with negative multiplier
    const effect = new DestructionEffect(position, EnemyType.BASIC, -1);
    
    // Should use 0.1 as minimum, so 15 * 0.1 = 1.5 -> 1 particle
    expect(effect.particles.length).toBeGreaterThanOrEqual(1);
  });
});