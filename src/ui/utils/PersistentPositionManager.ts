/**
 * Utility class for managing persistent UI element positions
 * Handles saving/loading positions to localStorage with screen size validation
 */

import type { Position, StoredPosition } from '@/ui/floating/types';

export class PersistentPositionManager {
  private static readonly VERSION = '1.0.0';
  private static readonly KEY_PREFIX = 'ui-position-';
  
  /**
   * Save a position to localStorage
   */
  static savePosition(id: string, position: Position, customKey?: string): void {
    const key = customKey || `${this.KEY_PREFIX}${id}`;
    
    const storedPosition: StoredPosition = {
      x: position.x,
      y: position.y,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      version: this.VERSION
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(storedPosition));
    } catch (e) {
      console.warn(`Failed to save position for ${id}:`, e);
    }
  }
  
  /**
   * Load a position from localStorage with screen size validation
   */
  static loadPosition(id: string, customKey?: string): Position | null {
    const key = customKey || `${this.KEY_PREFIX}${id}`;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const storedPosition: StoredPosition = JSON.parse(stored);
      
      // Version check
      if (storedPosition.version !== this.VERSION) {
        console.warn(`Position data version mismatch for ${id}, clearing stored position`);
        this.clearPosition(id, customKey);
        return null;
      }
      
      // Calculate screen size change ratios
      const widthRatio = window.innerWidth / storedPosition.screenWidth;
      const heightRatio = window.innerHeight / storedPosition.screenHeight;
      
      // Adjust position based on screen size change
      let adjustedPosition: Position;
      
      // If screen size changed significantly (>10%), scale the position
      if (Math.abs(widthRatio - 1) > 0.1 || Math.abs(heightRatio - 1) > 0.1) {
        adjustedPosition = {
          x: Math.round(storedPosition.x * widthRatio),
          y: Math.round(storedPosition.y * heightRatio)
        };
      } else {
        adjustedPosition = {
          x: storedPosition.x,
          y: storedPosition.y
        };
      }
      
      return adjustedPosition;
    } catch (e) {
      console.warn(`Failed to load position for ${id}:`, e);
      return null;
    }
  }
  
  /**
   * Clear a stored position
   */
  static clearPosition(id: string, customKey?: string): void {
    const key = customKey || `${this.KEY_PREFIX}${id}`;
    
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to clear position for ${id}:`, e);
    }
  }
  
  /**
   * Clear all stored positions
   */
  static clearAllPositions(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to clear all positions:', e);
    }
  }
  
  /**
   * Validate if a position is within screen bounds
   */
  static isPositionValid(position: Position, elementWidth: number, elementHeight: number, margin = 10): boolean {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Check if element would be fully visible with margin
    return (
      position.x >= margin &&
      position.y >= margin &&
      position.x + elementWidth <= screenWidth - margin &&
      position.y + elementHeight <= screenHeight - margin
    );
  }
  
  /**
   * Adjust position to ensure it's within screen bounds
   */
  static clampToScreen(position: Position, elementWidth: number, elementHeight: number, margin = 10): Position {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    return {
      x: Math.max(margin, Math.min(position.x, screenWidth - elementWidth - margin)),
      y: Math.max(margin, Math.min(position.y, screenHeight - elementHeight - margin))
    };
  }
  
  /**
   * Get default position for an element based on preferred corner
   */
  static getDefaultPosition(
    elementWidth: number, 
    elementHeight: number, 
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right',
    margin = 10
  ): Position {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    switch (corner) {
      case 'top-left':
        return { x: margin, y: margin };
      
      case 'top-right':
        return { x: screenWidth - elementWidth - margin, y: margin };
      
      case 'bottom-left':
        return { x: margin, y: screenHeight - elementHeight - margin };
      
      case 'bottom-right':
        return { x: screenWidth - elementWidth - margin, y: screenHeight - elementHeight - margin };
      
      default:
        return { x: screenWidth - elementWidth - margin, y: margin };
    }
  }
}