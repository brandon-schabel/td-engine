// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StyleManager } from '@/ui/styles/StyleManager';

describe('StyleManager', () => {
  let styleManager: StyleManager;

  beforeEach(() => {
    styleManager = StyleManager.getInstance();
    styleManager.cleanup(); // Ensure clean state
  });

  afterEach(() => {
    styleManager.cleanup();
  });

  it('should be a singleton', () => {
    const instance1 = StyleManager.getInstance();
    const instance2 = StyleManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize with styles', () => {
    const testStyles = '.test { color: red; }';
    styleManager.initialize(testStyles);
    
    expect(styleManager.isInitialized()).toBe(true);
    
    const styleElement = document.getElementById('td-engine-ui-styles');
    expect(styleElement).toBeTruthy();
    expect(styleElement?.textContent).toBe(testStyles);
  });

  it('should update existing styles', () => {
    const initialStyles = '.test { color: red; }';
    const updatedStyles = '.test { color: blue; }';
    
    styleManager.initialize(initialStyles);
    styleManager.updateStyles(updatedStyles);
    
    const styleElement = document.getElementById('td-engine-ui-styles');
    expect(styleElement?.textContent).toBe(updatedStyles);
  });

  it('should append additional styles', () => {
    const initialStyles = '.test1 { color: red; }';
    const additionalStyles = '.test2 { color: blue; }';
    
    styleManager.initialize(initialStyles);
    styleManager.appendStyles(additionalStyles);
    
    const styleElement = document.getElementById('td-engine-ui-styles');
    expect(styleElement?.textContent).toContain(initialStyles);
    expect(styleElement?.textContent).toContain(additionalStyles);
  });

  it('should cleanup properly', () => {
    const testStyles = '.test { color: red; }';
    styleManager.initialize(testStyles);
    
    expect(document.getElementById('td-engine-ui-styles')).toBeTruthy();
    
    styleManager.cleanup();
    
    expect(document.getElementById('td-engine-ui-styles')).toBeFalsy();
    expect(styleManager.isInitialized()).toBe(false);
  });

  it('should handle multiple initializations gracefully', () => {
    const initialStyles = '.test { color: red; }';
    const newStyles = '.test { color: blue; }';
    
    styleManager.initialize(initialStyles);
    // Console.warn should be called
    styleManager.initialize(newStyles);
    
    const styleElement = document.getElementById('td-engine-ui-styles');
    expect(styleElement?.textContent).toBe(newStyles);
  });
});