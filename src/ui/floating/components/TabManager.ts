import { cn } from '@/ui/styles/UtilityStyles';

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface TabManagerOptions {
  tabs: TabConfig[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

/**
 * Reusable tab manager component for floating UIs.
 * Handles tab creation, switching, and touch gestures.
 */
export class TabManager {
  private tabs: Map<string, TabConfig> = new Map();
  private tabElements: Map<string, HTMLElement> = new Map();
  private contentElements: Map<string, HTMLElement> = new Map();
  private activeTab: string;
  private onTabChange?: (tabId: string) => void;
  private container: HTMLElement | null = null;
  
  constructor(options: TabManagerOptions) {
    options.tabs.forEach(tab => this.tabs.set(tab.id, tab));
    this.activeTab = options.defaultTab || options.tabs[0]?.id || '';
    this.onTabChange = options.onTabChange;
  }
  
  /**
   * Create the tab bar UI element.
   */
  createTabBar(): HTMLElement {
    const tabBar = document.createElement('div');
    tabBar.className = cn(
      'flex',
      'gap-1',
      'p-1',
      'bg-black/20',
      'rounded-lg',
      'mb-4'
    );
    
    this.tabs.forEach((tab, id) => {
      const button = this.createTabButton(tab);
      this.tabElements.set(id, button);
      tabBar.appendChild(button);
    });
    
    this.updateActiveTab();
    
    return tabBar;
  }
  
  /**
   * Create a container for tab content with swipe gesture support.
   */
  createContentContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('relative', 'overflow-hidden');
    
    // Add touch gesture support
    this.setupSwipeGestures(container);
    
    this.container = container;
    return container;
  }
  
  /**
   * Register content element for a tab.
   */
  setTabContent(tabId: string, content: HTMLElement): void {
    this.contentElements.set(tabId, content);
    
    // Hide content by default
    content.style.display = tabId === this.activeTab ? 'block' : 'none';
    
    if (this.container && !content.parentElement) {
      this.container.appendChild(content);
    }
  }
  
  /**
   * Switch to a different tab.
   */
  setActiveTab(tabId: string): void {
    if (!this.tabs.has(tabId) || tabId === this.activeTab) {
      return;
    }
    
    this.activeTab = tabId;
    this.updateActiveTab();
    this.updateContentVisibility();
    
    if (this.onTabChange) {
      this.onTabChange(tabId);
    }
  }
  
  /**
   * Get the currently active tab ID.
   */
  getActiveTab(): string {
    return this.activeTab;
  }
  
  /**
   * Get all tab IDs.
   */
  getTabIds(): string[] {
    return Array.from(this.tabs.keys());
  }
  
  /**
   * Update badge count for a tab.
   */
  updateBadge(tabId: string, count: number): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.badge = count;
      
      const button = this.tabElements.get(tabId);
      if (button) {
        const badge = button.querySelector('.tab-badge');
        if (badge) {
          badge.textContent = count > 0 ? count.toString() : '';
          badge.classList.toggle('hidden', count === 0);
        }
      }
    }
  }
  
  /**
   * Handle swipe gesture to change tabs.
   */
  handleSwipeGesture(direction: 'left' | 'right'): void {
    const tabIds = this.getTabIds();
    const currentIndex = tabIds.indexOf(this.activeTab);
    
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === 'left') {
      newIndex = Math.min(currentIndex + 1, tabIds.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    if (newIndex !== currentIndex) {
      this.setActiveTab(tabIds[newIndex]);
    }
  }
  
  /**
   * Create a tab button element.
   */
  private createTabButton(tab: TabConfig): HTMLElement {
    const button = document.createElement('button');
    button.className = cn(
      'flex-1',
      'px-4',
      'py-2',
      'rounded-md',
      'text-sm',
      'font-medium',
      'transition-colors',
      'relative',
      'tab-button'
    );
    
    button.onclick = () => this.setActiveTab(tab.id);
    
    // Tab content
    const content = document.createElement('div');
    content.className = cn('flex', 'items-center', 'justify-center', 'gap-2');
    
    if (tab.icon) {
      const icon = document.createElement('span');
      icon.innerHTML = tab.icon;
      icon.className = cn('w-4', 'h-4');
      content.appendChild(icon);
    }
    
    const label = document.createElement('span');
    label.textContent = tab.label;
    content.appendChild(label);
    
    button.appendChild(content);
    
    // Badge
    if (tab.badge !== undefined) {
      const badge = document.createElement('span');
      badge.className = cn(
        'absolute',
        '-top-1',
        '-right-1',
        'min-w-[18px]',
        'h-[18px]',
        'px-1',
        'bg-red-500',
        'text-white',
        'text-xs',
        'rounded-full',
        'flex',
        'items-center',
        'justify-center',
        'tab-badge',
        tab.badge === 0 ? 'hidden' : ''
      );
      badge.textContent = tab.badge > 0 ? tab.badge.toString() : '';
      button.appendChild(badge);
    }
    
    return button;
  }
  
  /**
   * Update visual state of tabs.
   */
  private updateActiveTab(): void {
    this.tabElements.forEach((button, id) => {
      const isActive = id === this.activeTab;
      
      if (isActive) {
        button.className = cn(
          button.className,
          'bg-primary/20',
          'text-primary',
          'border',
          'border-primary/30'
        );
      } else {
        button.className = cn(
          button.className,
          'bg-transparent',
          'text-white/60',
          'hover:text-white',
          'hover:bg-white/5'
        );
      }
    });
  }
  
  /**
   * Update content visibility based on active tab.
   */
  private updateContentVisibility(): void {
    this.contentElements.forEach((content, id) => {
      content.style.display = id === this.activeTab ? 'block' : 'none';
    });
  }
  
  /**
   * Set up swipe gesture detection.
   */
  private setupSwipeGestures(container: HTMLElement): void {
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      
      const swipeDistance = touchEndX - touchStartX;
      const minSwipeDistance = 50;
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          this.handleSwipeGesture('right');
        } else {
          this.handleSwipeGesture('left');
        }
      }
    }, { passive: true });
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.tabs.clear();
    this.tabElements.clear();
    this.contentElements.clear();
    this.container = null;
    this.onTabChange = undefined;
  }
}