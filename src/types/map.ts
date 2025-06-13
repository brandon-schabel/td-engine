import type { Vector2 } from '../utils/Vector2';

// Path interface used in tests
export interface Path {
  id: string;
  points: Vector2[];
  length: number;
}

// Re-export MapData from MapData.ts for compatibility
export { MapData } from './MapData';