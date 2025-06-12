import type { GameConfiguration, ConfigurationPreset } from './GameConfiguration';
import { CONFIGURATION_PRESETS } from './ConfigurationPresets';

const STORAGE_KEY = 'towerDefenseConfigurations';
const CURRENT_CONFIG_KEY = 'currentConfiguration';
const USER_PRESETS_KEY = 'userPresets';

export interface SavedConfiguration {
  id: string;
  configuration: GameConfiguration;
  isUserCreated: boolean;
  lastUsed?: Date;
}

export class ConfigurationPersistence {
  
  // Save configuration to localStorage
  saveConfiguration(config: GameConfiguration, id?: string): string {
    const configId = id || this.generateConfigId(config);
    const savedConfig: SavedConfiguration = {
      id: configId,
      configuration: {
        ...config,
        metadata: {
          ...config.metadata,
          lastModified: new Date()
        }
      },
      isUserCreated: true,
      lastUsed: new Date()
    };
    
    const savedConfigs = this.getAllSavedConfigurations();
    savedConfigs[configId] = savedConfig;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfigs));
    return configId;
  }
  
  // Load configuration from localStorage
  loadConfiguration(id: string): GameConfiguration | null {
    const savedConfigs = this.getAllSavedConfigurations();
    const savedConfig = savedConfigs[id];
    
    if (savedConfig) {
      // Update last used timestamp
      savedConfig.lastUsed = new Date();
      savedConfigs[id] = savedConfig;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfigs));
      
      return this.deserializeConfiguration(savedConfig.configuration);
    }
    
    return null;
  }
  
  // Delete saved configuration
  deleteConfiguration(id: string): boolean {
    const savedConfigs = this.getAllSavedConfigurations();
    
    if (savedConfigs[id] && savedConfigs[id].isUserCreated) {
      delete savedConfigs[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfigs));
      return true;
    }
    
    return false;
  }
  
  // Get all saved configurations
  getAllSavedConfigurations(): Record<string, SavedConfiguration> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load saved configurations:', error);
      return {};
    }
  }
  
  // Get user-created configurations only
  getUserConfigurations(): SavedConfiguration[] {
    const allConfigs = this.getAllSavedConfigurations();
    return Object.values(allConfigs)
      .filter(config => config.isUserCreated)
      .sort((a, b) => {
        const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return bTime - aTime; // Most recently used first
      });
  }
  
  // Save current configuration being used
  saveCurrentConfiguration(config: GameConfiguration): void {
    const serialized = this.serializeConfiguration(config);
    localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(serialized));
  }
  
  // Load the last used configuration
  loadCurrentConfiguration(): GameConfiguration | null {
    try {
      const stored = localStorage.getItem(CURRENT_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.deserializeConfiguration(parsed);
      }
    } catch (error) {
      console.warn('Failed to load current configuration:', error);
    }
    
    return null;
  }
  
  // Export configuration as JSON string
  exportConfiguration(config: GameConfiguration): string {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      configuration: this.serializeConfiguration(config)
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  // Import configuration from JSON string
  importConfiguration(jsonString: string): GameConfiguration | null {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.configuration) {
        throw new Error('Invalid configuration format');
      }
      
      const config = this.deserializeConfiguration(importData.configuration);
      
      // Update metadata for imported config
      config.metadata = {
        ...config.metadata,
        author: config.metadata.author || 'Imported',
        createdAt: new Date(),
        lastModified: new Date(),
        isDefault: false
      };
      
      return config;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return null;
    }
  }
  
  // Get preset configuration
  getPresetConfiguration(preset: ConfigurationPreset): GameConfiguration {
    if (preset === 'CUSTOM') {
      throw new Error('CUSTOM preset cannot be loaded directly');
    }
    const presetFactory = CONFIGURATION_PRESETS[preset as keyof typeof CONFIGURATION_PRESETS];
    return presetFactory();
  }
  
  // Check if a configuration exists
  configurationExists(id: string): boolean {
    const savedConfigs = this.getAllSavedConfigurations();
    return id in savedConfigs;
  }
  
  // Generate a unique ID for a configuration
  private generateConfigId(config: GameConfiguration): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(config.metadata.name + timestamp.toString());
    return `config_${hash}_${timestamp}`;
  }
  
  // Simple hash function for generating IDs
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString(36);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
  
  // Serialize configuration for storage (handles Date objects)
  private serializeConfiguration(config: GameConfiguration): any {
    return {
      ...config,
      metadata: {
        ...config.metadata,
        createdAt: config.metadata.createdAt.toISOString(),
        lastModified: config.metadata.lastModified.toISOString()
      }
    };
  }
  
  // Deserialize configuration from storage (restores Date objects)
  private deserializeConfiguration(config: any): GameConfiguration {
    return {
      ...config,
      metadata: {
        ...config.metadata,
        createdAt: new Date(config.metadata.createdAt),
        lastModified: new Date(config.metadata.lastModified)
      }
    };
  }
  
  // Clear all saved configurations (for development/testing)
  clearAllConfigurations(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CONFIG_KEY);
    localStorage.removeItem(USER_PRESETS_KEY);
  }
  
  // Save user's favorite presets order
  savePresetOrder(presets: ConfigurationPreset[]): void {
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets));
  }
  
  // Load user's favorite presets order
  loadPresetOrder(): ConfigurationPreset[] {
    try {
      const stored = localStorage.getItem(USER_PRESETS_KEY);
      return stored ? JSON.parse(stored) : ['STANDARD', 'BEGINNER', 'VETERAN', 'CHAOS', 'PERFORMANCE'];
    } catch (error) {
      return ['STANDARD', 'BEGINNER', 'VETERAN', 'CHAOS', 'PERFORMANCE'];
    }
  }
  
  // Get storage usage information
  getStorageInfo(): { used: number; available: number; configurations: number } {
    const savedConfigs = this.getAllSavedConfigurations();
    const configCount = Object.keys(savedConfigs).length;
    
    let usedStorage = 0;
    try {
      const allData = localStorage.getItem(STORAGE_KEY) || '';
      usedStorage = new Blob([allData]).size;
    } catch (error) {
      // Fallback calculation
      usedStorage = JSON.stringify(savedConfigs).length;
    }
    
    // Estimate available storage (localStorage limit is usually 5-10MB)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const available = estimatedLimit - usedStorage;
    
    return {
      used: usedStorage,
      available: Math.max(0, available),
      configurations: configCount
    };
  }
  
  // Backup configurations to downloadable file
  backupConfigurations(): string {
    const allConfigs = this.getAllSavedConfigurations();
    const userConfigs = Object.values(allConfigs).filter(config => config.isUserCreated);
    
    const backup = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      configurations: userConfigs.map(saved => ({
        id: saved.id,
        configuration: this.serializeConfiguration(saved.configuration),
        lastUsed: saved.lastUsed?.toISOString()
      }))
    };
    
    return JSON.stringify(backup, null, 2);
  }
  
  // Restore configurations from backup file
  restoreConfigurations(backupJson: string, overwrite: boolean = false): { success: number; errors: string[] } {
    const results = { success: 0, errors: [] as string[] };
    
    try {
      const backup = JSON.parse(backupJson);
      
      if (!backup.configurations || !Array.isArray(backup.configurations)) {
        results.errors.push('Invalid backup format');
        return results;
      }
      
      const savedConfigs = this.getAllSavedConfigurations();
      
      backup.configurations.forEach((backupConfig: any, index: number) => {
        try {
          const configId = backupConfig.id || `restored_${Date.now()}_${index}`;
          
          if (!overwrite && savedConfigs[configId]) {
            results.errors.push(`Configuration ${configId} already exists (skipped)`);
            return;
          }
          
          const config = this.deserializeConfiguration(backupConfig.configuration);
          config.metadata.lastModified = new Date();
          
          savedConfigs[configId] = {
            id: configId,
            configuration: config,
            isUserCreated: true,
            lastUsed: backupConfig.lastUsed ? new Date(backupConfig.lastUsed) : new Date()
          };
          
          results.success++;
        } catch (error) {
          results.errors.push(`Failed to restore configuration ${index + 1}: ${error}`);
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfigs));
      
    } catch (error) {
      results.errors.push(`Failed to parse backup file: ${error}`);
    }
    
    return results;
  }
}

// Singleton instance
export const configurationPersistence = new ConfigurationPersistence();