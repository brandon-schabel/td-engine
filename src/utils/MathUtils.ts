/**
 * MathUtils - Centralized mathematical utilities
 * Eliminates duplicate calculations across the codebase
 * 
 * Recent changes:
 * - Initial creation with upgrade cost calculation
 * - Added color manipulation utilities
 * - Added movement normalization
 * - Added interpolation utilities
 * - Added common game math functions
 */

/**
 * Calculate upgrade cost using exponential scaling
 * @param baseCost Base cost of the upgrade
 * @param multiplier Cost increase multiplier per level
 * @param currentLevel Current upgrade level (0-based)
 * @returns Calculated upgrade cost
 */
export function calculateUpgradeCost(baseCost: number, multiplier: number, currentLevel: number): number {
  return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
}

/**
 * Calculate total cost to reach a target level
 * @param baseCost Base cost of the upgrade
 * @param multiplier Cost increase multiplier per level
 * @param targetLevel Target level to calculate total cost for
 * @returns Total cumulative cost
 */
export function calculateTotalCostToLevel(baseCost: number, multiplier: number, targetLevel: number): number {
  let totalCost = 0;
  for (let level = 0; level < targetLevel; level++) {
    totalCost += calculateUpgradeCost(baseCost, multiplier, level);
  }
  return totalCost;
}

/**
 * Adjust color brightness
 * @param hexColor Hex color string (e.g., "#FF0000")
 * @param brightness Brightness multiplier (0-2, where 1 is no change)
 * @returns Adjusted hex color string
 */
export function adjustColorBrightness(hexColor: string, brightness: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB components
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Adjust brightness
  const newR = Math.floor(Math.min(255, Math.max(0, r * brightness)));
  const newG = Math.floor(Math.min(255, Math.max(0, g * brightness)));
  const newB = Math.floor(Math.min(255, Math.max(0, b * brightness)));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Convert hex color to RGBA
 * @param hexColor Hex color string
 * @param alpha Alpha value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Normalize movement vector to unit length
 * @param x X component of movement
 * @param y Y component of movement
 * @returns Normalized movement vector
 */
export function normalizeMovement(x: number, y: number): { x: number; y: number } {
  const magnitude = Math.sqrt(x * x + y * y);
  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: x / magnitude,
    y: y / magnitude
  };
}

/**
 * Clamp a value between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate distance between two points
 * @param x1 First point X
 * @param y1 First point Y
 * @param x2 Second point X
 * @param y2 Second point Y
 * @returns Distance between points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points
 * @param x1 Origin X
 * @param y1 Origin Y
 * @param x2 Target X
 * @param y2 Target Y
 * @returns Angle in radians
 */
export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Generate pseudo-random variation based on coordinates
 * Useful for terrain variation without actual random numbers
 * @param x X coordinate
 * @param y Y coordinate
 * @param scale Scale of variation (0-1)
 * @returns Deterministic variation value
 */
export function coordinateVariation(x: number, y: number, scale: number = 0.1): number {
  return ((x * 7 + y * 13) % 5) / 5 * scale;
}

/**
 * Calculate sell value based on investment with depreciation
 * @param baseCost Original cost
 * @param upgradeInvestment Total spent on upgrades
 * @param depreciationRate Rate of value loss (0-1, default 0.4 means 60% value retained)
 * @returns Sell value
 */
export function calculateSellValue(baseCost: number, upgradeInvestment: number, depreciationRate: number = 0.4): number {
  const totalInvested = baseCost + upgradeInvestment;
  return Math.floor(totalInvested * (1 - depreciationRate));
}