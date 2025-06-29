import { describe, test, expect } from 'bun:test';
import { VISUAL_QUALITY_CONFIGS } from '@/config/GameSettings';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { EnemyType } from '@/entities/Enemy';

describe('Destruction Effects - Visual Quality Integration', () => {
  test('VISUAL_QUALITY_CONFIGS should provide correct particle counts', () => {
    // Verify the configs have the expected values
    expect(VISUAL_QUALITY_CONFIGS.LOW.particleCount).toBe(0.3);
    expect(VISUAL_QUALITY_CONFIGS.MEDIUM.particleCount).toBe(1.0);
    expect(VISUAL_QUALITY_CONFIGS.HIGH.particleCount).toBe(1.5);
  });
  
  test('DestructionEffect should use particle multiplier correctly', () => {
    const position = { x: 100, y: 100 };
    
    // Test with each quality level's particle count
    const lowQualityEffect = new DestructionEffect(
      position, 
      EnemyType.BASIC, 
      VISUAL_QUALITY_CONFIGS.LOW.particleCount
    );
    
    const mediumQualityEffect = new DestructionEffect(
      position, 
      EnemyType.BASIC, 
      VISUAL_QUALITY_CONFIGS.MEDIUM.particleCount
    );
    
    const highQualityEffect = new DestructionEffect(
      position, 
      EnemyType.BASIC, 
      VISUAL_QUALITY_CONFIGS.HIGH.particleCount
    );
    
    // Basic enemy has base 15 particles
    expect(lowQualityEffect.particles.length).toBe(4); // 15 * 0.3 = 4.5 -> 4
    expect(mediumQualityEffect.particles.length).toBe(15); // 15 * 1.0 = 15
    expect(highQualityEffect.particles.length).toBe(22); // 15 * 1.5 = 22.5 -> 22
  });
  
  test('Different enemy types should scale correctly with quality', () => {
    const position = { x: 100, y: 100 };
    const lowMultiplier = VISUAL_QUALITY_CONFIGS.LOW.particleCount;
    
    // Test each enemy type with low quality
    const basicLow = new DestructionEffect(position, EnemyType.BASIC, lowMultiplier);
    const fastLow = new DestructionEffect(position, EnemyType.FAST, lowMultiplier);
    const tankLow = new DestructionEffect(position, EnemyType.TANK, lowMultiplier);
    
    // Base counts: BASIC=15, FAST=10, TANK=20+5
    expect(basicLow.particles.length).toBe(4); // 15 * 0.3 = 4.5 -> 4
    expect(fastLow.particles.length).toBe(3); // 10 * 0.3 = 3
    expect(tankLow.particles.length).toBe(7); // (20 * 0.3) + (5 * 0.3) = 6 + 1 = 7
  });
  
  test('Tower destruction should work with quality settings', () => {
    const position = { x: 200, y: 200 };
    
    const towerLow = new DestructionEffect(
      position, 
      'tower', 
      VISUAL_QUALITY_CONFIGS.LOW.particleCount
    );
    
    const towerHigh = new DestructionEffect(
      position, 
      'tower', 
      VISUAL_QUALITY_CONFIGS.HIGH.particleCount
    );
    
    // Tower destruction effects should scale with quality
    expect(towerLow.particles.length).toBeLessThan(towerHigh.particles.length);
    expect(towerLow.particles.length).toBeGreaterThan(0);
    expect(towerHigh.particles.length).toBeGreaterThan(0);
  });
});