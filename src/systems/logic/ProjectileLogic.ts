import type { Projectile } from '@/entities/Projectile';
import type { Enemy } from '@/entities/Enemy';
import type { Vector2 } from '@/utils/Vector2';
import type { ProjectileUpdate, GameContext, GameAction } from './types';

// Simple projectile update logic
export function updateProjectile(
  projectile: Projectile,
  context: GameContext,
  state: { age: number; hasHitTarget: boolean }
): ProjectileUpdate {
  const actions: GameAction[] = [];
  const update: ProjectileUpdate = { actions };

  // Skip if already dead
  if (!projectile.isAlive) {
    return update;
  }

  // Update age
  projectile.age += context.deltaTime;
  
  // Check lifetime
  if (projectile.age >= projectile.maxLifetime) {
    console.log(`[ProjectileLogic] Projectile ${projectile.id} expired (age: ${projectile.age})`);
    update.isAlive = false;
    return update;
  }

  // Simple position update based on velocity
  const deltaSeconds = context.deltaTime / 1000;
  const newPosition = {
    x: projectile.position.x + projectile.velocity.x * deltaSeconds,
    y: projectile.position.y + projectile.velocity.y * deltaSeconds
  };
  
  update.position = newPosition;
  
  // Log position update for debugging
  console.log(`[ProjectileLogic] Updating ${projectile.id} from`, projectile.position, 'to', newPosition, 'velocity:', projectile.velocity);

  // Check collision with all enemies
  for (const enemy of context.enemies) {
    if (enemy.isAlive && projectile.collidesWith(enemy)) {
      console.log(`[ProjectileLogic] Projectile ${projectile.id} hit enemy ${enemy.id}`);
      update.isAlive = false;
      
      // Apply damage
      actions.push({
        type: 'DAMAGE_ENTITY',
        targetId: enemy.id,
        damage: projectile.damage,
        sourceId: projectile.id
      });
      
      // Only hit one enemy
      break;
    }
  }

  // Check bounds - use world dimensions in pixels, not grid dimensions in cells
  const bounds = {
    minX: -100,
    minY: -100,
    maxX: (context.grid ? context.grid.width * context.grid.cellSize : 1000) + 100,
    maxY: (context.grid ? context.grid.height * context.grid.cellSize : 1000) + 100
  };
  
  // Debug logging for bounds verification
  if (projectile.age === 0) {
    console.log(`[ProjectileLogic] Bounds check - Grid: ${context.grid?.width}x${context.grid?.height} cells, Cell size: ${context.grid?.cellSize}px, World bounds: ${bounds.maxX}x${bounds.maxY}px`);
  }
  
  if (newPosition.x < bounds.minX || newPosition.x > bounds.maxX ||
      newPosition.y < bounds.minY || newPosition.y > bounds.maxY) {
    console.log(`[ProjectileLogic] Projectile ${projectile.id} out of bounds at position`, newPosition, 'bounds:', bounds);
    update.isAlive = false;
  }

  return update;
}