/**
 * TabManager - Handles tab navigation and rendering for the configuration menu
 * Extracted from ConfigurationMenu.ts to improve modularity
 */

export interface Tab {
  id: string;
  label: string;
  icon: string;
}

export interface TabManagerEvents {
  onTabChange: (tabId: string) => void;
}

export class TabManager {
  private container: HTMLDivElement;
  private activeTab: string;
  private tabs: Tab[];
  private events: TabManagerEvents;
  private tabButtons: Map<string, HTMLButtonElement> = new Map();

  constructor(container: HTMLDivElement, events: TabManagerEvents, initialTab: string = 'presets') {
    this.container = container;
    this.events = events;
    this.activeTab = initialTab;
    
    this.tabs = [
      { id: 'presets', label: 'Quick Start', icon: '🚀' },
      { id: 'map', label: 'Map Settings', icon: '🗺️' },
      { id: 'gameplay', label: 'Gameplay', icon: '🎮' },
      { id: 'enemies', label: 'Enemies & Waves', icon: '👾' },
      { id: 'player', label: 'Player', icon: '👤' },
      { id: 'audiovisual', label: 'Audio & Visual', icon: '🎨' },
      { id: 'advanced', label: 'Advanced', icon: '⚙️' }
    ];

    this.createTabContainer();
  }

  private createTabContainer(): void {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    tabContainer.style.cssText = `
      display: flex;
      background: #1a1a1a;
      border-bottom: 2px solid #333;
      overflow-x: auto;
      flex-shrink: 0;
    `;

    this.tabs.forEach(tab => {
      const tabButton = this.createTabButton(tab);
      this.tabButtons.set(tab.id, tabButton);
      tabContainer.appendChild(tabButton);
    });

    this.container.appendChild(tabContainer);
  }

  private createTabButton(tab: Tab): HTMLButtonElement {
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.innerHTML = `${tab.icon} ${tab.label}`;
    
    this.updateTabButtonStyle(tabButton, tab.id);
    
    tabButton.addEventListener('click', () => this.switchTab(tab.id));
    
    // Add hover effects
    tabButton.addEventListener('mouseenter', () => {
      if (tab.id !== this.activeTab) {
        tabButton.style.background = '#2a2a2a';
        tabButton.style.color = '#fff';
      }
    });
    
    tabButton.addEventListener('mouseleave', () => {
      if (tab.id !== this.activeTab) {
        tabButton.style.background = 'transparent';
        tabButton.style.color = '#ccc';
      }
    });

    return tabButton;
  }

  private updateTabButtonStyle(button: HTMLButtonElement, tabId: string): void {
    const isActive = tabId === this.activeTab;
    
    button.style.cssText = `
      padding: 12px 20px;
      background: ${isActive ? '#333' : 'transparent'};
      border: none;
      color: ${isActive ? '#4CAF50' : '#ccc'};
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 3px solid ${isActive ? '#4CAF50' : 'transparent'};
      white-space: nowrap;
      font-size: 14px;
      outline: none;
    `;
  }

  /**
   * Switches to a different tab
   */
  switchTab(tabId: string): void {
    if (this.activeTab === tabId) return;

    // Update visual state of old and new tab buttons
    const oldButton = this.tabButtons.get(this.activeTab);
    const newButton = this.tabButtons.get(tabId);

    if (oldButton) {
      this.updateTabButtonStyle(oldButton, this.activeTab);
    }

    this.activeTab = tabId;

    if (newButton) {
      this.updateTabButtonStyle(newButton, tabId);
    }

    // Notify parent about tab change
    this.events.onTabChange(tabId);
  }

  /**
   * Gets the currently active tab ID
   */
  getActiveTab(): string {
    return this.activeTab;
  }

  /**
   * Sets the active tab without triggering events (for external updates)
   */
  setActiveTab(tabId: string): void {
    if (this.tabs.find(tab => tab.id === tabId)) {
      const oldButton = this.tabButtons.get(this.activeTab);
      const newButton = this.tabButtons.get(tabId);

      if (oldButton) {
        this.updateTabButtonStyle(oldButton, this.activeTab);
      }

      this.activeTab = tabId;

      if (newButton) {
        this.updateTabButtonStyle(newButton, tabId);
      }
    }
  }

  /**
   * Gets all available tabs
   */
  getTabs(): Tab[] {
    return [...this.tabs];
  }

  /**
   * Updates tab accessibility and enables/disables tabs
   */
  setTabEnabled(tabId: string, enabled: boolean): void {
    const button = this.tabButtons.get(tabId);
    if (button) {
      button.disabled = !enabled;
      button.style.opacity = enabled ? '1' : '0.5';
      button.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
  }

  /**
   * Adds a badge or indicator to a tab (e.g., for validation errors)
   */
  setTabBadge(tabId: string, badge?: string): void {
    const button = this.tabButtons.get(tabId);
    const tab = this.tabs.find(t => t.id === tabId);
    
    if (button && tab) {
      const badgeText = badge ? ` ${badge}` : '';
      button.innerHTML = `${tab.icon} ${tab.label}${badgeText}`;
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.tabButtons.clear();
    // Event listeners are automatically removed when elements are removed from DOM
  }
}