/**
 * InstructionsPanel Component  
 * Displays game instructions and controls
 */

import { GameComponent, type GameComponentProps, type GameComponentState } from '../GameComponent';
import { Button } from '../Button';
import { styled } from '../../core/styled';

interface InstructionsPanelState extends GameComponentState {
  minimized: boolean;
  currentPage: number;
}

interface InstructionPage {
  title: string;
  icon: string;
  content: Array<{
    type: 'text' | 'control' | 'tip';
    content: string;
    key?: string;
  }>;
}

export class InstructionsPanel extends GameComponent<GameComponentProps, InstructionsPanelState> {
  private pages: InstructionPage[] = [
    {
      title: 'Basic Controls',
      icon: '🎮',
      content: [
        { type: 'text', content: 'Move your character around the map and defend against enemy waves.' },
        { type: 'control', content: 'Move Player', key: 'WASD / Arrow Keys' },
        { type: 'control', content: 'Shoot', key: 'Space / Auto' },
        { type: 'control', content: 'Pause Game', key: 'P / Escape' },
        { type: 'tip', content: 'Your character shoots automatically when enemies are nearby!' }
      ]
    },
    {
      title: 'Building Towers',
      icon: '🗼',
      content: [
        { type: 'text', content: 'Build towers to help defend against enemies. Each tower type has unique strengths.' },
        { type: 'control', content: 'Select Basic Tower', key: '1' },
        { type: 'control', content: 'Select Sniper Tower', key: '2' },
        { type: 'control', content: 'Select Rapid Tower', key: '3' },
        { type: 'control', content: 'Cancel Selection', key: 'Escape' },
        { type: 'tip', content: 'Click on empty grid spaces to place selected towers.' }
      ]
    },
    {
      title: 'Tower Types',
      icon: '⚔️',
      content: [
        { type: 'text', content: 'Each tower type has different characteristics:' },
        { type: 'control', content: 'Basic Tower', key: 'Balanced damage and range' },
        { type: 'control', content: 'Sniper Tower', key: 'Long range, high damage' },
        { type: 'control', content: 'Rapid Tower', key: 'Fast fire rate, lower damage' },
        { type: 'tip', content: 'Upgrade towers by clicking on them to improve their stats.' }
      ]
    },
    {
      title: 'Strategy Tips',
      icon: '🧠',
      content: [
        { type: 'text', content: 'Master these strategies to become a tower defense expert:' },
        { type: 'tip', content: 'Place towers at chokepoints to maximize their effectiveness.' },
        { type: 'tip', content: 'Use different tower types to handle different enemy types.' },
        { type: 'tip', content: 'Upgrade towers instead of always building new ones.' },
        { type: 'tip', content: 'Keep your player character near the action for extra firepower.' },
        { type: 'tip', content: 'Manage your currency wisely - save for upgrades and emergencies.' }
      ]
    }
  ];

  override getInitialState(): InstructionsPanelState {
    return {
      visible: true,
      loading: false,
      error: null,
      minimized: false,
      currentPage: 0
    };
  }

  onMount(): void {
    super.onMount();
    
    // Auto-minimize after first wave starts
    this.game.on('waveStarted', (data) => {
      if (data.waveNumber > 1 && !this.state.minimized) {
        this.setState({ minimized: true });
      }
    });
  }

  protected renderContent(): HTMLElement {
    if (!this.state.visible) {
      return this.createElement(styled.div`display: none;`);
    }

    const Container = this.createContainer('instructions-panel', {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: this.state.minimized ? '60px' : '320px',
      zIndex: 1200,
      transition: 'all 0.3s ease'
    });

    const container = this.createElement(Container);
    
    if (this.state.minimized) {
      const minimizedPanel = this.createMinimizedPanel();
      container.appendChild(minimizedPanel);
    } else {
      const fullPanel = this.createFullPanel();
      container.appendChild(fullPanel);
    }
    
    return container;
  }

  private createMinimizedPanel(): HTMLElement {
    const MinimizedPanel = styled.div`
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.info};
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(8px);
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    `;
    
    const panel = this.createElement(MinimizedPanel, {
      onClick: () => this.setState({ minimized: false })
    });
    
    const HelpIcon = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xl};
      color: ${(props: { theme: any }) => props.theme.colors.info};
    `;
    
    const icon = this.createElement(HelpIcon, {}, '❓');
    panel.appendChild(icon);
    
    return panel;
  }

  private createFullPanel(): HTMLElement {
    const FullPanel = styled.div`
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid ${(props: { theme: any }) => props.theme.colors.info};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.md};
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      
      @media (max-width: 768px) {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        right: auto;
        width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
      }
    `;
    
    const panel = this.createElement(FullPanel);
    
    // Header
    const header = this.createHeader();
    panel.appendChild(header);
    
    // Content
    const content = this.createContent();
    panel.appendChild(content);
    
    // Navigation (if multiple pages)
    if (this.pages.length > 1) {
      const navigation = this.createNavigation();
      panel.appendChild(navigation);
    }
    
    return panel;
  }

  private createHeader(): HTMLElement {
    const Header = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.3);
    `;
    
    const header = this.createElement(Header);
    
    const HeaderContent = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
    `;
    
    const headerContent = this.createElement(HeaderContent);
    
    const HeaderIcon = styled.div`
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xl};
    `;
    
    const HeaderTitle = styled.h3`
      margin: 0;
      color: ${(props: { theme: any }) => props.theme.colors.info};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) => props.theme.typography.fontWeight.bold};
    `;
    
    const currentPage = this.pages[this.state.currentPage];
    const icon = this.createElement(HeaderIcon, {}, currentPage.icon);
    const title = this.createElement(HeaderTitle, {}, currentPage.title);
    
    headerContent.appendChild(icon);
    headerContent.appendChild(title);
    
    // Close/Minimize buttons
    const HeaderActions = styled.div`
      display: flex;
      gap: ${(props: { theme: any }) => props.theme.spacing.xs};
    `;
    
    const headerActions = this.createElement(HeaderActions);
    
    const ActionButton = styled.button`
      background: none;
      border: none;
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.lg};
      cursor: pointer;
      padding: ${(props: { theme: any }) => props.theme.spacing.xs};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: ${(props: { theme: any }) => props.theme.colors.text};
      }
    `;
    
    const minimizeButton = this.createElement(ActionButton, {
      onClick: () => this.setState({ minimized: true }),
      title: 'Minimize'
    }, '−');
    
    const closeButton = this.createElement(ActionButton, {
      onClick: () => this.setState({ visible: false }),
      title: 'Close'
    }, '✕');
    
    headerActions.appendChild(minimizeButton);
    headerActions.appendChild(closeButton);
    
    header.appendChild(headerContent);
    header.appendChild(headerActions);
    
    return header;
  }

  private createContent(): HTMLElement {
    const Content = styled.div`
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      max-height: 400px;
      overflow-y: auto;
    `;
    
    const content = this.createElement(Content);
    
    const currentPage = this.pages[this.state.currentPage];
    
    currentPage.content.forEach(item => {
      const element = this.createContentItem(item);
      content.appendChild(element);
    });
    
    return content;
  }

  private createContentItem(item: InstructionPage['content'][0]): HTMLElement {
    switch (item.type) {
      case 'text':
        return this.createTextItem(item.content);
      case 'control':
        return this.createControlItem(item.content, item.key || '');
      case 'tip':
        return this.createTipItem(item.content);
      default:
        return this.createElement(styled.div``);
    }
  }

  private createTextItem(text: string): HTMLElement {
    const TextItem = styled.p`
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.md} 0;
      color: ${(props: { theme: any }) => props.theme.colors.text};
      line-height: 1.5;
    `;
    
    return this.createElement(TextItem, {}, text);
  }

  private createControlItem(label: string, key: string): HTMLElement {
    const ControlItem = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${(props: { theme: any }) => props.theme.spacing.sm};
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.xs} 0;
      background: rgba(255, 255, 255, 0.05);
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
    `;
    
    const controlItem = this.createElement(ControlItem);
    
    const ControlLabel = styled.span`
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
    `;
    
    const ControlKey = styled.kbd`
      background: ${(props: { theme: any }) => props.theme.colors.secondary};
      color: ${(props: { theme: any }) => props.theme.colors.text};
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.xs};
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const labelElement = this.createElement(ControlLabel, {}, label);
    const keyElement = this.createElement(ControlKey, {}, key);
    
    controlItem.appendChild(labelElement);
    controlItem.appendChild(keyElement);
    
    return controlItem;
  }

  private createTipItem(text: string): HTMLElement {
    const TipItem = styled.div`
      display: flex;
      align-items: flex-start;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      padding: ${(props: { theme: any }) => props.theme.spacing.sm};
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.xs} 0;
      background: rgba(255, 193, 7, 0.1);
      border-left: 3px solid ${(props: { theme: any }) => props.theme.colors.warning};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
    `;
    
    const tipItem = this.createElement(TipItem);
    
    const TipIcon = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.warning};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      margin-top: 2px;
    `;
    
    const TipText = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
      line-height: 1.4;
    `;
    
    const icon = this.createElement(TipIcon, {}, '💡');
    const tipText = this.createElement(TipText, {}, text);
    
    tipItem.appendChild(icon);
    tipItem.appendChild(tipText);
    
    return tipItem;
  }

  private createNavigation(): HTMLElement {
    const Navigation = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${(props: { theme: any }) => props.theme.spacing.md};
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.3);
    `;
    
    const navigation = this.createElement(Navigation);
    
    // Previous button
    const prevButton = new Button({
      text: '← Previous',
      variant: 'secondary',
      size: 'small',
      style: { 
        opacity: this.state.currentPage === 0 ? '0.5' : '1',
        cursor: this.state.currentPage === 0 ? 'not-allowed' : 'pointer'
      },
      onClick: () => {
        if (this.state.currentPage > 0) {
          this.setState({ currentPage: this.state.currentPage - 1 });
        }
      }
    });
    
    // Page indicator
    const PageIndicator = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) => props.theme.typography.fontSize.sm};
    `;
    
    const pageIndicator = this.createElement(PageIndicator, {}, 
      `${this.state.currentPage + 1} / ${this.pages.length}`);
    
    // Next button
    const nextButton = new Button({
      text: 'Next →',
      variant: 'primary',
      size: 'small',
      style: { 
        opacity: this.state.currentPage === this.pages.length - 1 ? '0.5' : '1',
        cursor: this.state.currentPage === this.pages.length - 1 ? 'not-allowed' : 'pointer'
      },
      onClick: () => {
        if (this.state.currentPage < this.pages.length - 1) {
          this.setState({ currentPage: this.state.currentPage + 1 });
        }
      }
    });
    
    prevButton.mount(navigation);
    navigation.appendChild(pageIndicator);
    nextButton.mount(navigation);
    
    return navigation;
  }

  /**
   * Public API methods
   */
  public toggle(): void {
    this.setState({ visible: !this.state.visible });
  }

  public minimize(): void {
    this.setState({ minimized: true });
  }

  public expand(): void {
    this.setState({ minimized: false });
  }

  public show(): void {
    this.setState({ visible: true, minimized: false });
  }

  public hide(): void {
    this.setState({ visible: false });
  }
}