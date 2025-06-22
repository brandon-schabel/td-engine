/**
 * Wave Info Display Component
 * Shows current wave number and enemy count in a compact floating HUD
 */

import { Game } from "@/core/Game";
import { cn } from "@/ui/elements";
import type { FloatingUIManager } from "@/ui/floating/FloatingUIManager";
import type { FloatingUIElement } from "@/ui/floating/FloatingUIElement";
import { PersistentPositionManager } from "@/ui/utils/PersistentPositionManager";

export class WaveInfoDisplay {
  private static instances: WaveInfoDisplay[] = [];
  
  private game: Game;
  private floatingUI: FloatingUIManager;
  private floatingElement: FloatingUIElement | null = null;
  private updateInterval: number | null = null;
  private displayElement: HTMLDivElement | null = null;
  private waveTextElement: HTMLDivElement | null = null;
  private enemyCountElement: HTMLDivElement | null = null;

  constructor(options: { game: Game; visible?: boolean }) {
    this.game = options.game;
    this.floatingUI = this.game.getFloatingUIManager();
    
    // Track instance
    WaveInfoDisplay.instances.push(this);
  }

  mount(_parent: HTMLElement): void {
    // Clean up any existing instance first
    this.cleanup();
    
    // Create main display container - compact design
    this.displayElement = document.createElement('div');
    this.displayElement.className = cn(
      'bg-surface-secondary',
      'border',
      'border-default',
      'rounded-lg',
      'p-2',
      'shadow-lg',
      'min-w-[140px]',
      'pointer-events-auto'
    );

    // Create content container with flex layout
    const contentContainer = document.createElement('div');
    contentContainer.className = cn('space-y-1');

    // Wave info row
    const waveRow = document.createElement('div');
    waveRow.className = cn('flex', 'items-center', 'justify-between', 'gap-2');
    
    const waveLabel = document.createElement('div');
    waveLabel.className = cn('text-xs', 'text-secondary', 'font-medium');
    waveLabel.textContent = 'Wave:';
    
    this.waveTextElement = document.createElement('div');
    this.waveTextElement.className = cn('text-sm', 'font-bold', 'text-primary');
    
    waveRow.appendChild(waveLabel);
    waveRow.appendChild(this.waveTextElement);

    // Enemy count row
    const enemyRow = document.createElement('div');
    enemyRow.className = cn('flex', 'items-center', 'justify-between', 'gap-2');
    
    const enemyLabel = document.createElement('div');
    enemyLabel.className = cn('text-xs', 'text-secondary', 'font-medium');
    enemyLabel.textContent = 'Enemies:';
    
    this.enemyCountElement = document.createElement('div');
    this.enemyCountElement.className = cn('text-sm', 'font-bold', 'text-danger');
    
    enemyRow.appendChild(enemyLabel);
    enemyRow.appendChild(this.enemyCountElement);

    // Assemble display
    contentContainer.appendChild(waveRow);
    contentContainer.appendChild(enemyRow);
    this.displayElement.appendChild(contentContainer);

    // Create floating UI element with draggable functionality
    this.floatingElement = this.floatingUI.create('wave-info-display', 'custom', {
      className: cn('pointer-events-auto'),
      screenSpace: true,
      draggable: true,
      persistPosition: true,
      positionKey: 'wave-info-display-position',
      zIndex: 500,
      smoothing: 0,
      autoHide: false,
      persistent: true
    });
    
    this.floatingElement.setContent(this.displayElement);
    
    // Load saved position or use default
    const savedPosition = PersistentPositionManager.loadPosition('wave-info-display', 'wave-info-display-position');
    if (savedPosition) {
      // Position will be set by FloatingUIElement's loadStoredPosition
      this.floatingElement.enable();
    } else {
      // Set default position in top-left corner with padding
      const defaultPos = PersistentPositionManager.getDefaultPosition(140, 70, 'top-left', 20);
      this.floatingElement.setTarget({ x: defaultPos.x, y: defaultPos.y });
      this.floatingElement.enable();
    }

    // Start updating
    this.update();
    this.updateInterval = window.setInterval(() => this.update(), 100);
  }

  private update(): void {
    // Update wave number
    if (this.waveTextElement) {
      const currentWave = this.game.getCurrentWave();
      const totalWaves = this.game.getTotalWaves();
      const isInfiniteMode = this.game.isInfiniteMode() || totalWaves === Number.MAX_SAFE_INTEGER;
      
      if (isInfiniteMode) {
        // For infinite mode, just show the wave number
        this.waveTextElement.textContent = `${currentWave}`;
        this.waveTextElement.className = cn('text-sm', 'font-bold', 'text-warning');
      } else {
        // Only show total if it's a reasonable number
        if (totalWaves > 0 && totalWaves < 1000) {
          this.waveTextElement.textContent = `${currentWave} / ${totalWaves}`;
        } else {
          this.waveTextElement.textContent = `${currentWave}`;
        }
        this.waveTextElement.className = cn('text-sm', 'font-bold', 'text-primary');
      }
    }

    // Update enemy count
    if (this.enemyCountElement) {
      const enemyCount = this.game.getEnemyCount();
      this.enemyCountElement.textContent = enemyCount.toString();
      
      // Change color based on enemy count
      if (enemyCount === 0) {
        this.enemyCountElement.className = cn('text-sm', 'font-bold', 'text-success');
      } else if (enemyCount > 10) {
        this.enemyCountElement.className = cn('text-sm', 'font-bold', 'text-danger');
      } else {
        this.enemyCountElement.className = cn('text-sm', 'font-bold', 'text-warning');
      }
    }
  }

  /**
   * Toggle visibility
   */
  setVisible(visible: boolean): void {
    if (this.floatingElement) {
      if (visible) {
        this.floatingElement.enable();
      } else {
        this.floatingElement.disable();
      }
    }
  }

  cleanup(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.floatingElement) {
      this.floatingElement.destroy();
      this.floatingElement = null;
    }

    if (this.displayElement) {
      this.displayElement.remove();
      this.displayElement = null;
    }
    
    // Remove from instances tracking
    const index = WaveInfoDisplay.instances.indexOf(this);
    if (index > -1) {
      WaveInfoDisplay.instances.splice(index, 1);
    }
  }
  
  static cleanupAll(): void {
    // Clean up all existing instances
    const instances = [...WaveInfoDisplay.instances];
    instances.forEach(instance => instance.cleanup());
    WaveInfoDisplay.instances = [];
  }
}