import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Tower } from '@/entities/Tower';
import type { Enemy } from '@/entities/Enemy';
import type { Projectile } from '@/entities/Projectile';
import type { Collectible } from '@/entities/Collectible';
import type { DestructionEffect } from '@/effects/DestructionEffect';
import type { Player } from '@/entities/Player';
import type { Vector2 } from '@/utils/Vector2';

// Types for batch updates
export interface EntityUpdates {
  towers?: Array<{ id: string; updates: Partial<Tower> }>;
  enemies?: Array<{ id: string; updates: Partial<Enemy> }>;
  projectiles?: Array<{ id: string; updates: Partial<Projectile> }>;
  collectibles?: Array<{ id: string; updates: Partial<Collectible> }>;
  destructionEffects?: Array<{ id: string; updates: Partial<DestructionEffect> }>;
  player?: Partial<Player>;
}

export interface VisibleEntities {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  collectibles: Collectible[];
  destructionEffects: DestructionEffect[];
  player: Player | null;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EntityStore {
  // Entity storage - using Records for O(1) lookups
  towers: Record<string, Tower>;
  enemies: Record<string, Enemy>;
  projectiles: Record<string, Projectile>;
  collectibles: Record<string, Collectible>;
  destructionEffects: Record<string, DestructionEffect>;
  player: Player | null;
  
  // Selection states
  selectedTower: Tower | null;
  hoveredTower: Tower | null;
  
  // Tower CRUD Actions
  addTower: (tower: Tower) => void;
  removeTower: (towerId: string) => void;
  updateTower: (towerId: string, updates: Partial<Tower>) => void;
  setTowers: (towers: Tower[]) => void;
  
  // Enemy CRUD Actions
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (enemyId: string) => void;
  updateEnemy: (enemyId: string, updates: Partial<Enemy>) => void;
  setEnemies: (enemies: Enemy[]) => void;
  
  // Projectile CRUD Actions
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (projectileId: string) => void;
  updateProjectile: (projectileId: string, updates: Partial<Projectile>) => void;
  setProjectiles: (projectiles: Projectile[]) => void;
  
  // Collectible CRUD Actions
  addCollectible: (collectible: Collectible) => void;
  removeCollectible: (collectibleId: string) => void;
  updateCollectible: (collectibleId: string, updates: Partial<Collectible>) => void;
  setCollectibles: (collectibles: Collectible[]) => void;
  
  // Destruction Effect CRUD Actions
  addDestructionEffect: (effect: DestructionEffect) => void;
  removeDestructionEffect: (effectId: string) => void;
  updateDestructionEffect: (effectId: string, updates: Partial<DestructionEffect>) => void;
  setDestructionEffects: (effects: DestructionEffect[]) => void;
  
  // Player Actions
  setPlayer: (player: Player | null) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  
  // Selection Actions
  selectTower: (tower: Tower | null) => void;
  hoverTower: (tower: Tower | null) => void;
  
  // Batch operations
  batchUpdate: (updates: EntityUpdates) => void;
  cleanupDeadEntities: () => void;
  clearAllEntities: () => void;
  
  // Selectors (memoized getters)
  getEnemiesInRange: (position: Vector2, range: number) => Enemy[];
  getTowerAt: (gridX: number, gridY: number) => Tower | null;
  getVisibleEntities: (viewport: Rectangle) => VisibleEntities;
  getAllTowers: () => Tower[];
  getAllEnemies: () => Enemy[];
  getAllProjectiles: () => Projectile[];
  getAllCollectibles: () => Collectible[];
  getAllDestructionEffects: () => DestructionEffect[];
  getEntityCount: () => number;
}

// Helper function to convert Record to array
const recordToArray = <T>(record: Record<string, T>): T[] => Object.values(record);

// Helper function to check if entity is within viewport
const isInViewport = (entity: { position: Vector2 }, viewport: Rectangle): boolean => {
  return entity.position.x >= viewport.x &&
         entity.position.x <= viewport.x + viewport.width &&
         entity.position.y >= viewport.y &&
         entity.position.y <= viewport.y + viewport.height;
};

// Helper function to calculate distance between positions
const distance = (pos1: Vector2, pos2: Vector2): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const useEntityStore = create<EntityStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      towers: {},
      enemies: {},
      projectiles: {},
      collectibles: {},
      destructionEffects: {},
      player: null,
      selectedTower: null,
      hoveredTower: null,
      
      // Tower CRUD
      addTower: (tower) => set((state) => {
        state.towers[tower.id] = tower;
      }),
      
      removeTower: (towerId) => set((state) => {
        delete state.towers[towerId];
        // Clear selection if removed tower was selected
        if (state.selectedTower?.id === towerId) {
          state.selectedTower = null;
        }
        if (state.hoveredTower?.id === towerId) {
          state.hoveredTower = null;
        }
      }),
      
      updateTower: (towerId, updates) => set((state) => {
        const tower = state.towers[towerId];
        if (tower) {
          Object.assign(tower, updates);
        }
      }),
      
      setTowers: (towers) => set((state) => {
        state.towers = {};
        towers.forEach(tower => {
          state.towers[tower.id] = tower;
        });
      }),
      
      // Enemy CRUD
      addEnemy: (enemy) => set((state) => {
        state.enemies[enemy.id] = enemy;
      }),
      
      removeEnemy: (enemyId) => set((state) => {
        delete state.enemies[enemyId];
      }),
      
      updateEnemy: (enemyId, updates) => set((state) => {
        const enemy = state.enemies[enemyId];
        if (enemy) {
          Object.assign(enemy, updates);
        }
      }),
      
      setEnemies: (enemies) => set((state) => {
        state.enemies = {};
        enemies.forEach(enemy => {
          state.enemies[enemy.id] = enemy;
        });
      }),
      
      // Projectile CRUD
      addProjectile: (projectile) => set((state) => {
        state.projectiles[projectile.id] = projectile;
      }),
      
      removeProjectile: (projectileId) => set((state) => {
        delete state.projectiles[projectileId];
      }),
      
      updateProjectile: (projectileId, updates) => set((state) => {
        const projectile = state.projectiles[projectileId];
        if (projectile) {
          Object.assign(projectile, updates);
        }
      }),
      
      setProjectiles: (projectiles) => set((state) => {
        state.projectiles = {};
        projectiles.forEach(projectile => {
          state.projectiles[projectile.id] = projectile;
        });
      }),
      
      // Collectible CRUD
      addCollectible: (collectible) => set((state) => {
        state.collectibles[collectible.id] = collectible;
      }),
      
      removeCollectible: (collectibleId) => set((state) => {
        delete state.collectibles[collectibleId];
      }),
      
      updateCollectible: (collectibleId, updates) => set((state) => {
        const collectible = state.collectibles[collectibleId];
        if (collectible) {
          Object.assign(collectible, updates);
        }
      }),
      
      setCollectibles: (collectibles) => set((state) => {
        state.collectibles = {};
        collectibles.forEach(collectible => {
          state.collectibles[collectible.id] = collectible;
        });
      }),
      
      // Destruction Effect CRUD
      addDestructionEffect: (effect) => set((state) => {
        state.destructionEffects[effect.id] = effect;
      }),
      
      removeDestructionEffect: (effectId) => set((state) => {
        delete state.destructionEffects[effectId];
      }),
      
      updateDestructionEffect: (effectId, updates) => set((state) => {
        const effect = state.destructionEffects[effectId];
        if (effect) {
          Object.assign(effect, updates);
        }
      }),
      
      setDestructionEffects: (effects) => set((state) => {
        state.destructionEffects = {};
        effects.forEach(effect => {
          state.destructionEffects[effect.id] = effect;
        });
      }),
      
      // Player Actions
      setPlayer: (player) => set((state) => {
        state.player = player;
      }),
      
      updatePlayer: (updates) => set((state) => {
        if (state.player) {
          Object.assign(state.player, updates);
        }
      }),
      
      // Selection Actions
      selectTower: (tower) => set(() => ({
        selectedTower: tower
      })),
      
      hoverTower: (tower) => set(() => ({
        hoveredTower: tower
      })),
      
      // Batch operations
      batchUpdate: (updates) => set((state) => {
        // Update towers
        if (updates.towers) {
          updates.towers.forEach(({ id, updates }) => {
            const tower = state.towers[id];
            if (tower) {
              Object.assign(tower, updates);
            }
          });
        }
        
        // Update enemies
        if (updates.enemies) {
          updates.enemies.forEach(({ id, updates }) => {
            const enemy = state.enemies[id];
            if (enemy) {
              Object.assign(enemy, updates);
            }
          });
        }
        
        // Update projectiles
        if (updates.projectiles) {
          updates.projectiles.forEach(({ id, updates }) => {
            const projectile = state.projectiles[id];
            if (projectile) {
              Object.assign(projectile, updates);
            }
          });
        }
        
        // Update collectibles
        if (updates.collectibles) {
          updates.collectibles.forEach(({ id, updates }) => {
            const collectible = state.collectibles[id];
            if (collectible) {
              Object.assign(collectible, updates);
            }
          });
        }
        
        // Update destruction effects
        if (updates.destructionEffects) {
          updates.destructionEffects.forEach(({ id, updates }) => {
            const effect = state.destructionEffects[id];
            if (effect) {
              Object.assign(effect, updates);
            }
          });
        }
        
        // Update player
        if (updates.player && state.player) {
          Object.assign(state.player, updates.player);
        }
      }),
      
      cleanupDeadEntities: () => set((state) => {
        // Remove dead enemies
        Object.keys(state.enemies).forEach(id => {
          if (!state.enemies[id].isAlive) {
            delete state.enemies[id];
          }
        });
        
        // Remove dead projectiles
        Object.keys(state.projectiles).forEach(id => {
          if (!state.projectiles[id].isAlive) {
            delete state.projectiles[id];
          }
        });
        
        // Remove inactive collectibles
        Object.keys(state.collectibles).forEach(id => {
          if (!state.collectibles[id].isActive || !state.collectibles[id].isAlive) {
            delete state.collectibles[id];
          }
        });
        
        // Remove completed destruction effects
        Object.keys(state.destructionEffects).forEach(id => {
          if (state.destructionEffects[id].isComplete) {
            delete state.destructionEffects[id];
          }
        });
        
        // Remove dead towers
        Object.keys(state.towers).forEach(id => {
          if (!state.towers[id].isAlive) {
            delete state.towers[id];
            // Clear selection if dead tower was selected
            if (state.selectedTower?.id === id) {
              state.selectedTower = null;
            }
            if (state.hoveredTower?.id === id) {
              state.hoveredTower = null;
            }
          }
        });
      }),
      
      clearAllEntities: () => set((state) => {
        state.towers = {};
        state.enemies = {};
        state.projectiles = {};
        state.collectibles = {};
        state.destructionEffects = {};
        state.selectedTower = null;
        state.hoveredTower = null;
      }),
      
      // Selectors
      getEnemiesInRange: (position, range) => {
        const enemies = recordToArray(get().enemies);
        return enemies.filter(enemy => 
          enemy.isAlive && distance(enemy.position, position) <= range
        );
      },
      
      getTowerAt: (gridX, gridY) => {
        const towers = recordToArray(get().towers);
        return towers.find(tower => 
          tower.isAlive &&
          Math.floor(tower.position.x / 32) === gridX && // Assuming 32px grid cell size
          Math.floor(tower.position.y / 32) === gridY
        ) || null;
      },
      
      getVisibleEntities: (viewport) => {
        const state = get();
        return {
          towers: recordToArray(state.towers).filter(t => isInViewport(t, viewport)),
          enemies: recordToArray(state.enemies).filter(e => isInViewport(e, viewport)),
          projectiles: recordToArray(state.projectiles).filter(p => isInViewport(p, viewport)),
          collectibles: recordToArray(state.collectibles).filter(c => isInViewport(c, viewport)),
          destructionEffects: recordToArray(state.destructionEffects).filter(d => isInViewport(d, viewport)),
          player: state.player && isInViewport(state.player, viewport) ? state.player : null
        };
      },
      
      getAllTowers: () => recordToArray(get().towers),
      getAllEnemies: () => recordToArray(get().enemies),
      getAllProjectiles: () => recordToArray(get().projectiles),
      getAllCollectibles: () => recordToArray(get().collectibles),
      getAllDestructionEffects: () => recordToArray(get().destructionEffects),
      
      getEntityCount: () => {
        const state = get();
        return Object.keys(state.towers).length +
               Object.keys(state.enemies).length +
               Object.keys(state.projectiles).length +
               Object.keys(state.collectibles).length +
               Object.keys(state.destructionEffects).length +
               (state.player ? 1 : 0);
      }
    })),
    {
      name: 'entity-store'
    }
  )
);

// Export helper hooks for common selectors with shallow equality checks
export const useTowers = () => useEntityStore(state => state.getAllTowers());
export const useEnemies = () => useEntityStore(state => state.getAllEnemies());
export const useProjectiles = () => useEntityStore(state => state.getAllProjectiles());
export const useCollectibles = () => useEntityStore(state => state.getAllCollectibles());
export const useDestructionEffects = () => useEntityStore(state => state.getAllDestructionEffects());
export const usePlayer = () => useEntityStore(state => state.player);
export const useSelectedTower = () => useEntityStore(state => state.selectedTower);
export const useHoveredTower = () => useEntityStore(state => state.hoveredTower);
export const useEntityCount = () => useEntityStore(state => state.getEntityCount());

// Export actions for easy access
export const {
  addTower,
  removeTower,
  updateTower,
  setTowers,
  addEnemy,
  removeEnemy,
  updateEnemy,
  setEnemies,
  addProjectile,
  removeProjectile,
  updateProjectile,
  setProjectiles,
  addCollectible,
  removeCollectible,
  updateCollectible,
  setCollectibles,
  addDestructionEffect,
  removeDestructionEffect,
  updateDestructionEffect,
  setDestructionEffects,
  setPlayer,
  updatePlayer,
  selectTower,
  hoverTower,
  batchUpdate,
  cleanupDeadEntities,
  clearAllEntities,
  getEnemiesInRange,
  getTowerAt,
  getVisibleEntities
} = useEntityStore.getState();