/**
 * Unified Upgrade System
 * Exports all upgrade-related managers and utilities
 * 
 * Recent changes:
 * - Initial creation to consolidate upgrade system exports
 * - Re-exports TowerUpgradeManager and PlayerUpgradeManager
 * - Provides centralized access point for upgrade functionality
 */

export { TowerUpgradeManager } from './TowerUpgradeManager';
export { PlayerUpgradeManager } from './PlayerUpgradeManager';
export { BaseUpgradeManager } from './BaseUpgradeManager';
export type { UpgradeConfig, Upgradeable } from './BaseUpgradeManager';

// Re-export upgrade types for convenience
export { UpgradeType as TowerUpgradeType } from '@/entities/Tower';
export { PlayerUpgradeType } from '@/entities/Player';