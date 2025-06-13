import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresetSelector, type PresetSelectorEvents } from '@/ui/components/PresetSelector';
import { setupMockDOM } from '../dom-test-utils';

describe('PresetSelector', () => {
  let container: HTMLDivElement;
  let mockEvents: PresetSelectorEvents;
  let presetSelector: PresetSelector;

  beforeEach(() => {
    setupMockDOM();
    
    // Mock localStorage for this test
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null)
    } as any;
    
    container = document.createElement('div');
    mockEvents = {
      onPresetSelected: vi.fn(),
      onConfigurationSaved: vi.fn(),
      onConfigurationLoaded: vi.fn()
    };
    
    try {
      presetSelector = new PresetSelector(container, mockEvents);
    } catch (error) {
      console.error('PresetSelector constructor failed:', error);
      throw error;
    }
  });

  it('should render header section with title and description', () => {
    const title = container.querySelector('h2');
    expect(title?.textContent).toBe('Quick Start Presets');
    expect(title?.style.color).toBe('#4CAF50'); // Green color

    const description = container.querySelector('p');
    expect(description?.textContent).toContain('Choose a preset configuration');
  });

  it('should render preset cards for all available presets', () => {
    const presetCards = container.querySelectorAll('.preset-card');
    expect(presetCards.length).toBeGreaterThan(0);

    // Check that preset cards have required elements
    const firstCard = presetCards[0];
    expect(firstCard.querySelector('h3')).toBeTruthy(); // Preset name
    expect(firstCard.querySelector('p')).toBeTruthy(); // Description
    expect(firstCard.querySelector('span')).toBeTruthy(); // Icon
  });

  it('should handle preset selection', () => {
    const presetCards = container.querySelectorAll('.preset-card');
    const firstCard = presetCards[0] as HTMLDivElement;
    
    // Get the preset key from data attribute
    const presetKey = firstCard.dataset.preset;
    
    firstCard.click();
    
    expect(mockEvents.onPresetSelected).toHaveBeenCalledWith(presetKey);
    expect(presetSelector.getSelectedPreset()).toBe(presetKey);
  });

  it('should update visual selection when preset is selected', () => {
    const presetCards = container.querySelectorAll('.preset-card');
    const firstCard = presetCards[0] as HTMLDivElement;
    
    firstCard.click();
    
    // Selected card should have different styling
    expect(firstCard.style.background).toBe('#0a2a0a'); // Dark green background
    expect(firstCard.style.borderColor).toBe('#4CAF50'); // Green border
  });

  it('should render custom configuration section', () => {
    const customSection = container.querySelector('div[style*="margin-top: 20px"]');
    expect(customSection).toBeTruthy();

    const customTitle = customSection?.querySelector('h3');
    expect(customTitle?.textContent).toBe('🛠️ Custom Configuration');

    const saveButton = Array.from(customSection?.querySelectorAll('button') || [])
      .find(btn => btn.textContent === 'Save Current Config');
    expect(saveButton).toBeTruthy();

    const loadButton = Array.from(customSection?.querySelectorAll('button') || [])
      .find(btn => btn.textContent === 'Load Saved Config');
    expect(loadButton).toBeTruthy();
  });

  it('should handle save configuration button click', () => {
    const saveButton = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent === 'Save Current Config') as HTMLButtonElement;
    
    saveButton.click();
    
    expect(mockEvents.onConfigurationSaved).toHaveBeenCalled();
  });

  it('should handle load configuration button click', () => {
    // Mock the getUserConfigurations to return empty array (no saved configs)
    (global as any).alert = vi.fn();
    
    const loadButton = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent === 'Load Saved Config') as HTMLButtonElement;
    
    loadButton.click();
    
    expect(alert).toHaveBeenCalledWith('No saved configurations found.');
  });

  it('should set selected preset programmatically', () => {
    const presetCards = container.querySelectorAll('.preset-card');
    const firstCard = presetCards[0] as HTMLDivElement;
    const presetKey = firstCard.dataset.preset;
    
    presetSelector.setSelectedPreset(presetKey as any);
    
    expect(presetSelector.getSelectedPreset()).toBe(presetKey);
    expect(firstCard.style.background).toBe('#0a2a0a'); // Selected style
  });

  it('should handle hover effects on preset cards', () => {
    const presetCards = container.querySelectorAll('.preset-card');
    const firstCard = presetCards[0] as HTMLDivElement;
    
    // Simulate mouse enter using object literal
    const mouseEnterEvent = {
      type: 'mouseenter',
      target: firstCard,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };
    firstCard.dispatchEvent(mouseEnterEvent);
    
    expect(firstCard.style.background).toBe('#222'); // Dark hover color
    
    // Simulate mouse leave using object literal
    const mouseLeaveEvent = {
      type: 'mouseleave',
      target: firstCard,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };
    firstCard.dispatchEvent(mouseLeaveEvent);
    
    expect(firstCard.style.background).toBe('#1a1a1a'); // Original background
  });

  it('should refresh display when refresh is called', () => {
    const originalContent = container.innerHTML;
    
    presetSelector.refresh();
    
    // Content should be regenerated (but similar structure)
    expect(container.querySelector('h2')?.textContent).toBe('Quick Start Presets');
    expect(container.querySelectorAll('.preset-card').length).toBeGreaterThan(0);
  });

  it('should clean up when destroyed', () => {
    presetSelector.destroy();
    
    expect(container.innerHTML).toBe('');
    expect(presetSelector.getSelectedPreset()).toBeNull();
  });
});