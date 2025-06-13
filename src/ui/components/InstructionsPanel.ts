/**
 * InstructionsPanel Component
 * Shows game controls and instructions
 */

import { GameComponent, type GameComponentProps } from './GameComponent';
import { Card } from './Card';
import { Button } from './Button';
import { styleSystem } from '../core/StyleSystem';

interface InstructionsState {
  visible: boolean;
  minimized: boolean;
}

interface ControlInfo {
  key: string;
  action: string;
  category: 'movement' | 'towers' | 'game' | 'ui';
}

export class InstructionsPanel extends GameComponent<GameComponentProps, InstructionsState> {
  private toggleButton: Button | null = null;
  
  private readonly controls: ControlInfo[] = [
    // Movement
    { key: 'WASD/Arrows', action: 'Move Player', category: 'movement' },
    
    // Towers
    { key: '1', action: 'Basic Tower ($20)', category: 'towers' },
    { key: '2', action: 'Sniper Tower ($50)', category: 'towers' },
    { key: '3', action: 'Rapid Tower ($30)', category: 'towers' },
    { key: 'Click Tower', action: 'Select for upgrades', category: 'towers' },
    
    // Game
    { key: 'Enter', action: 'Start Next Wave', category: 'game' },
    { key: 'Space', action: 'Pause/Resume', category: 'game' },
    { key: 'ESC', action: 'Cancel Selection', category: 'game' },
    
    // UI
    { key: 'U', action: 'Toggle Player Upgrades', category: 'ui' },
    { key: 'Q', action: 'Stop All Audio', category: 'ui' },
  ];
  
  protected getInitialState(): InstructionsState {
    return {
      visible: true,
      minimized: false
    };
  }
  
  protected render(): HTMLElement {
    const theme = styleSystem.getTheme();
    const container = document.createElement('div');
    container.className = 'instructions-panel';
    
    if (this.state.minimized) {
      // Minimized view - just a button
      this.toggleButton = new Button({
        text: '❓',
        variant: 'info',
        className: 'instructions-toggle',
        style: {
          position: 'absolute',
          top: theme.spacing.md,
          right: theme.spacing.md,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          fontSize: '16px',
          padding: '0',
          zIndex: 999
        },
        onClick: () => this.toggleMinimized()
      });
      
      this.toggleButton.mount(container);
    } else {
      // Full view
      const card = new Card({
        title: 'Controls',
        className: 'instructions-card',
        style: {
          position: 'absolute',
          top: theme.spacing.md,
          right: theme.spacing.md,
          minWidth: '220px',
          maxWidth: '280px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: `1px solid ${theme.colors.border}`,
          zIndex: 999
        }
      });
      
      const cardContent = card.getElement()?.querySelector('.card-content');
      if (cardContent) {
        // Minimize button in header
        const cardHeader = card.getElement()?.querySelector('.card-header');
        if (cardHeader) {
          const minimizeBtn = document.createElement('button');
          minimizeBtn.textContent = '−';
          minimizeBtn.style.cssText = `
            position: absolute;
            top: ${theme.spacing.xs};
            right: ${theme.spacing.xs};
            width: 20px;
            height: 20px;
            border: none;
            background: ${theme.colors.backgroundDark};
            color: ${theme.colors.text};
            border-radius: 3px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          minimizeBtn.onclick = () => this.toggleMinimized();
          cardHeader.appendChild(minimizeBtn);
        }
        
        // Group controls by category
        const categories = ['movement', 'towers', 'game', 'ui'] as const;
        const categoryNames = {
          movement: '🏃 Movement',
          towers: '🏰 Towers',
          game: '🎮 Game',
          ui: '🖥️ Interface'
        };
        
        categories.forEach((category, index) => {
          const categoryControls = this.controls.filter(c => c.category === category);
          if (categoryControls.length === 0) return;
          
          // Category header
          const categoryHeader = document.createElement('div');
          categoryHeader.textContent = categoryNames[category];
          categoryHeader.style.cssText = `
            font-weight: bold;
            color: ${theme.colors.primary};
            margin-bottom: ${theme.spacing.xs};
            font-size: ${theme.typography.fontSize.sm};
            ${index > 0 ? `margin-top: ${theme.spacing.sm};` : ''}
          `;
          cardContent.appendChild(categoryHeader);
          
          // Controls list
          const controlsList = document.createElement('div');
          controlsList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-bottom: ${theme.spacing.xs};
          `;
          
          categoryControls.forEach(control => {
            const controlItem = document.createElement('div');
            controlItem.style.cssText = `
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: ${theme.typography.fontSize.xs};
              padding: 2px 0;
            `;
            
            const key = document.createElement('span');
            key.textContent = control.key;
            key.style.cssText = `
              background: ${theme.colors.backgroundDark};
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 11px;
              color: ${theme.colors.warning};
              border: 1px solid ${theme.colors.border};
              white-space: nowrap;
            `;
            
            const action = document.createElement('span');
            action.textContent = control.action;
            action.style.cssText = `
              color: ${theme.colors.textSecondary};
              margin-left: ${theme.spacing.xs};
              flex: 1;
              text-align: right;
            `;
            
            controlItem.appendChild(key);
            controlItem.appendChild(action);
            controlsList.appendChild(controlItem);
          });
          
          cardContent.appendChild(controlsList);
        });
        
        // Tips section
        const tipsSection = document.createElement('div');
        tipsSection.style.cssText = `
          margin-top: ${theme.spacing.md};
          padding-top: ${theme.spacing.sm};
          border-top: 1px solid ${theme.colors.border};
          font-size: ${theme.typography.fontSize.xs};
          color: ${theme.colors.info};
        `;
        tipsSection.innerHTML = `
          <div style="margin-bottom: 4px;">
            <strong>💡 Tip:</strong> Click audio icon for volume
          </div>
          <div>
            <strong>🎯 Tip:</strong> Player auto-shoots nearby enemies
          </div>
        `;
        
        cardContent.appendChild(tipsSection);
      }
      
      card.mount(container);
    }
    
    return container;
  }
  
  private toggleMinimized(): void {
    this.setState({ minimized: !this.state.minimized });
    this.forceUpdate();
  }
  
  protected onGameStateUpdate(): void {
    // Could hide instructions after first wave or on certain conditions
    if (this.gameState.wave > 1 && this.state.visible && !this.state.minimized) {
      // Auto-minimize after first wave
      this.setState({ minimized: true });
      this.forceUpdate();
    }
  }
  
  protected getStyles() {
    return {};
  }
}