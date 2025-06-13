import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabManager, type TabManagerEvents } from '../../../src/ui/components/TabManager';

describe('TabManager', () => {
  let container: HTMLDivElement;
  let mockEvents: TabManagerEvents;
  let tabManager: TabManager;

  beforeEach(() => {
    container = document.createElement('div');
    mockEvents = {
      onTabChange: vi.fn()
    };
    tabManager = new TabManager(container, mockEvents);
  });

  it('should create tab buttons with correct initial state', () => {
    const tabButtons = container.querySelectorAll('.tab-button');
    expect(tabButtons.length).toBe(7); // 7 tabs total
    
    // First tab (presets) should be active by default
    const firstTab = tabButtons[0] as HTMLButtonElement;
    expect(firstTab.innerHTML).toContain('🚀 Quick Start');
    expect(firstTab.style.color).toBe('rgb(76, 175, 80)'); // #4CAF50
  });

  it('should switch tabs when clicked', () => {
    const tabButtons = container.querySelectorAll('.tab-button');
    const mapTab = tabButtons[1] as HTMLButtonElement; // Map tab
    
    mapTab.click();
    
    expect(mockEvents.onTabChange).toHaveBeenCalledWith('map');
    expect(tabManager.getActiveTab()).toBe('map');
  });

  it('should not trigger events when setting active tab programmatically', () => {
    tabManager.setActiveTab('gameplay');
    
    expect(mockEvents.onTabChange).not.toHaveBeenCalled();
    expect(tabManager.getActiveTab()).toBe('gameplay');
  });

  it('should enable/disable tabs correctly', () => {
    tabManager.setTabEnabled('advanced', false);
    
    const advancedTab = Array.from(container.querySelectorAll('.tab-button'))
      .find(btn => btn.innerHTML.includes('Advanced')) as HTMLButtonElement;
    
    expect(advancedTab.disabled).toBe(true);
    expect(advancedTab.style.opacity).toBe('0.5');
  });

  it('should set tab badges', () => {
    tabManager.setTabBadge('enemies', '!');
    
    const enemiesTab = Array.from(container.querySelectorAll('.tab-button'))
      .find(btn => btn.innerHTML.includes('Enemies')) as HTMLButtonElement;
    
    expect(enemiesTab.innerHTML).toContain('!');
  });

  it('should return all available tabs', () => {
    const tabs = tabManager.getTabs();
    expect(tabs.length).toBe(7);
    expect(tabs[0].id).toBe('presets');
    expect(tabs[0].label).toBe('Quick Start');
  });

  it('should clean up when destroyed', () => {
    tabManager.destroy();
    
    // Should clear the internal tab buttons map
    expect(tabManager.getTabs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'presets' })
      ])
    );
  });

  it('should handle hover effects', () => {
    const tabButtons = container.querySelectorAll('.tab-button');
    const inactiveTab = tabButtons[1] as HTMLButtonElement; // Map tab (inactive)
    
    // Simulate mouse enter
    const mouseEnterEvent = new MouseEvent('mouseenter');
    inactiveTab.dispatchEvent(mouseEnterEvent);
    
    expect(inactiveTab.style.background).toBe('rgb(42, 42, 42)'); // #2a2a2a
    
    // Simulate mouse leave
    const mouseLeaveEvent = new MouseEvent('mouseleave');
    inactiveTab.dispatchEvent(mouseLeaveEvent);
    
    expect(inactiveTab.style.background).toBe('transparent');
  });
});