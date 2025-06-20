/**
 * formatters.ts - Utility functions for formatting values
 * Changes:
 * 1. Initial implementation with number formatting
 * 2. Add time formatting
 * 3. Add percentage formatting
 * 4. Add health/damage formatting
 * 5. Add currency formatting with abbreviations
 */

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Format a number with abbreviations (1K, 1M, etc.)
 */
export function formatNumberShort(value: number): string {
  if (value < 1000) {
    return value.toString();
  } else if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else if (value < 1000000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format time in seconds to a readable format
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format milliseconds to seconds with decimal
 */
export function formatMilliseconds(ms: number, decimals: number = 1): string {
  return `${(ms / 1000).toFixed(decimals)}s`;
}

/**
 * Format health values with color coding
 */
export function formatHealth(current: number, max: number): string {
  return `${Math.round(current)}/${Math.round(max)}`;
}

/**
 * Format damage values with optional critical indicator
 */
export function formatDamage(value: number, isCritical: boolean = false): string {
  const formatted = Math.round(value).toString();
  return isCritical ? `${formatted}!` : formatted;
}

/**
 * Format currency with appropriate symbol
 */
export function formatCurrency(value: number, symbol: string = ''): string {
  return `${symbol}${formatNumber(value)}`;
}

/**
 * Format a ratio as a multiplier (e.g., 1.5x)
 */
export function formatMultiplier(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}x`;
}

/**
 * Format distance in game units
 */
export function formatDistance(value: number, units: string = 'units'): string {
  return `${value.toFixed(1)} ${units}`;
}