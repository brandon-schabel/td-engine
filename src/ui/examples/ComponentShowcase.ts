/**
 * ComponentShowcase - Example implementation showing the new UI architecture
 * This demonstrates how to use the consolidated UI system
 */

import { GameUIManager } from '../GameUIManager';
import { BuildPanel } from '../components/game/BuildPanel';
import { ActionPanel } from '../components/game/ActionPanel';
import { TowerUpgradePanel } from '../components/game/TowerUpgradePanel';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { Button } from '../components/Button';
import type { GameWithEvents } from '../../core/GameWithEvents';

export class ComponentShowcase {
  private uiManager: GameUIManager;
  private game: GameWithEvents;

  constructor(game: GameWithEvents) {
    this.game = game;
    this.uiManager = new GameUIManager(game, {
      enableTouchControls: true,
      enableHapticFeedback: true,
      showInstructions: true,
      debugMode: true
    });
  }

  /**
   * Initialize the showcase
   */
  async initialize(): Promise<void> {
    console.log('Initializing Component Showcase...');
    
    try {
      // Initialize the UI manager
      await this.uiManager.initialize();
      
      // Show welcome message
      this.showWelcome();
      
      // Demonstrate reactive state management
      this.demonstrateStateManagement();
      
      console.log('Component Showcase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Component Showcase:', error);
      throw error;
    }
  }

  /**
   * Show welcome modal with modern UI features
   */
  private showWelcome(): void {
    const welcomeModal = new Modal({
      title: 'Modern UI System',
      content: this.createWelcomeContent(),
      size: 'md',
      closeOnEscape: true,
      isOpen: true,
      onClose: () => {
        Toast.show({
          message: 'Welcome to the new UI system!',
          type: 'success',
          duration: 3000
        });
      }
    });

    welcomeModal.mount(document.body);
  }

  /**
   * Create welcome content
   */
  private createWelcomeContent(): HTMLElement {
    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px; text-align: center;';
    
    content.innerHTML = `
      <h2>🎉 Modern UI Architecture</h2>
      <p>This tower defense game now features a consolidated UI system with:</p>
      <ul style="text-align: left; margin: 20px 0;">
        <li>🏗️ <strong>Component-based Architecture</strong> - Reusable, typed components</li>
        <li>⚡ <strong>Reactive State Management</strong> - Automatic UI updates</li>
        <li>📱 <strong>Touch-first Design</strong> - Mobile and desktop optimized</li>
        <li>🎨 <strong>Consistent Theming</strong> - Design system with CSS-in-JS</li>
        <li>♿ <strong>Accessibility</strong> - Screen reader and keyboard support</li>
        <li>🔧 <strong>Type Safety</strong> - Full TypeScript integration</li>
      </ul>
      <p>All UI components now integrate seamlessly with the game engine!</p>
    `;

    // Add demo button
    const demoButton = new Button({
      variant: 'primary',
      size: 'lg',
      children: 'Try the UI Features',
      fullWidth: true,
      onClick: () => this.demonstrateFeatures()
    });

    demoButton.mount(content);
    return content;
  }

  /**
   * Demonstrate UI features
   */
  private demonstrateFeatures(): void {
    const uiState = this.uiManager.getUIState();
    
    // Show different notifications
    setTimeout(() => {
      Toast.show({
        message: 'Build Panel: Modern tower selection with reactive updates',
        type: 'info',
        duration: 4000
      });
    }, 500);

    setTimeout(() => {
      Toast.show({
        message: 'Action Panel: Contextual game controls with state management',
        type: 'success',
        duration: 4000
      });
    }, 2000);

    setTimeout(() => {
      Toast.show({
        message: 'UI State: Centralized reactive state management',
        type: 'warning',
        duration: 4000
      });
    }, 3500);

    // Update UI state to demonstrate reactivity
    setTimeout(() => {
      uiState.set({
        currency: 1000,
        lives: 10,
        score: 5000,
        currentWave: 5
      });
    }, 1000);
  }

  /**
   * Demonstrate reactive state management
   */
  private demonstrateStateManagement(): void {
    const uiState = this.uiManager.getUIState();

    // Subscribe to state changes and log them
    uiState.subscribe('currency', (amount) => {
      console.log(`💰 Currency updated: ${amount}`);
    });

    uiState.subscribe('selectedTowerType', (type) => {
      console.log(`🏗️ Tower type selected: ${type || 'None'}`);
    });

    // Create computed value
    const canAffordBasicTower = uiState.computed(['currency'], (state) => {
      return state.currency >= 100;
    });

    // Log computed value changes
    uiState.on('computedUpdate', (data) => {
      if (data.key.includes('computed')) {
        console.log(`🧮 Computed value updated: ${data.value}`);
      }
    });

    // Demonstrate batch updates
    uiState.batch((state) => ({
      currency: 500,
      lives: 8,
      score: 2500,
      currentWave: 3
    }));
  }

  /**
   * Show component API examples
   */
  showComponentExamples(): void {
    console.log(`
🏗️ Component Examples:

// Create a BuildPanel
const buildPanel = new BuildPanel({
  game: this.game,
  uiManager: this.uiManager,
  isMobile: false,
  initiallyMinimized: false,
  position: 'bottom-left',
  showShortcuts: true
});

// Create an ActionPanel
const actionPanel = new ActionPanel({
  game: this.game,
  uiManager: this.uiManager,
  isMobile: false,
  position: 'bottom-right',
  showLabels: true,
  compact: false
});

// Use reactive state management
const uiState = this.uiManager.getUIState();
uiState.subscribe('currency', (amount) => {
  console.log('Currency changed:', amount);
});

// Create computed values
const canAffordTower = uiState.computed(['currency'], (state) => {
  return state.currency >= 100;
});
    `);
  }

  /**
   * Cleanup showcase
   */
  destroy(): void {
    this.uiManager.destroy();
    console.log('Component Showcase destroyed');
  }
}

/**
 * Utility function to create a simple UI demo
 */
export function createUIDemo(game: GameWithEvents): ComponentShowcase {
  return new ComponentShowcase(game);
}