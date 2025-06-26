// @vitest-environment jsdom

import '../../setup';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  it('should add styles and inject them', () => {
    const testStyles = '.test { color: red; }';
    styleManager.addStyles('test-id', testStyles);
    styleManager.inject();
    
    const styleElement = document.querySelector('style[data-style-manager="true"]');
    expect(styleElement).toBeTruthy();
    expect(styleElement?.textContent).toContain(testStyles);
  });

  it('should update existing styles when added with same ID', () => {
    const initialStyles = '.test { color: red; }';
    const updatedStyles = '.test { color: blue; }';
    
    styleManager.addStyles('test-id', initialStyles);
    styleManager.inject();
    styleManager.addStyles('test-id', updatedStyles); // Overwrite
    
    const styleElement = document.querySelector('style[data-style-manager="true"]');
    expect(styleElement?.textContent).toContain(updatedStyles);
    expect(styleElement?.textContent).not.toContain(initialStyles); // Should be replaced
  });

  it('should append additional styles when added with different IDs', () => {
    const styles1 = '.test1 { color: red; }';
    const styles2 = '.test2 { color: blue; }';
    
    styleManager.addStyles('id1', styles1);
    styleManager.addStyles('id2', styles2);
    styleManager.inject();
    
    const styleElement = document.querySelector('style[data-style-manager="true"]');
    expect(styleElement?.textContent).toContain(styles1);
    expect(styleElement?.textContent).toContain(styles2);
  });

  it('should cleanup properly', () => {
    const testStyles = '.test { color: red; }';
    styleManager.addStyles('test-id', testStyles);
    styleManager.inject();
    
    expect(document.querySelector('style[data-style-manager="true"]')).toBeTruthy();
    
    styleManager.cleanup();
    
    expect(document.querySelector('style[data-style-manager="true"]')).toBeFalsy();
    expect(styleManager.hasStyles('test-id')).toBe(false);
  });

  it('should not re-inject if already injected', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    styleManager.addStyles('test-id', '.test { color: red; }');
    styleManager.inject();
    styleManager.inject(); // Call inject again
    
    expect(consoleSpy).not.toHaveBeenCalled(); // Should not warn or re-inject
    
    consoleSpy.mockRestore();
  });

  it('should remove styles correctly', () => {
    const styles1 = '.test1 { color: red; }';
    const styles2 = '.test2 { color: blue; }';
    
    styleManager.addStyles('id1', styles1);
    styleManager.addStyles('id2', styles2);
    styleManager.inject();
    
    expect(styleManager.getStyles()).toContain(styles1);
    expect(styleManager.getStyles()).toContain(styles2);
    
    styleManager.removeStyles('id1');
    
    expect(styleManager.getStyles()).not.toContain(styles1);
    expect(styleManager.getStyles()).toContain(styles2);
  });

  it('should return true for hasStyles if ID exists', () => {
    styleManager.addStyles('test-id', '.test { color: red; }');
    expect(styleManager.hasStyles('test-id')).toBe(true);
  });

  it('should return false for hasStyles if ID does not exist', () => {
    expect(styleManager.hasStyles('non-existent-id')).toBe(false);
  });

  it('should return all current styles with getStyles', () => {
    const styles1 = '.test1 { color: red; }';
    const styles2 = '.test2 { color: blue; }';
    
    styleManager.addStyles('id1', styles1);
    styleManager.addStyles('id2', styles2);
    styleManager.inject();
    
    const allStyles = styleManager.getStyles();
    expect(allStyles).toContain(styles1);
    expect(allStyles).toContain(styles2);
  });
});