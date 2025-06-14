/**
 * GameStateOverlay Component
 * Displays overlays for different game states (paused, game over, victory, etc.)
 */

import {
  GameComponent,
  type GameComponentProps,
  type GameComponentState,
} from "../GameComponent";
import { Button } from "../Button";
import { styled } from "@/ui/core/styled";
import { GameState } from "@/core/GameState";

interface GameStateOverlayState extends GameComponentState {
  gameState: GameState;
  score: number;
  wave: number;
  showOverlay: boolean;
}

export class GameStateOverlay extends GameComponent<
  GameComponentProps,
  GameStateOverlayState
> {
  private actionButtons: Button[] = [];

  override getInitialState(): GameStateOverlayState {
    const gameState = this.getGameState();
    return {
      visible: true,
      loading: false,
      error: null,
      gameState: gameState,
      score: gameState.score,
      wave: gameState.wave,
      showOverlay: false,
    };
  }

  onMount(): void {
    super.onMount();

    // Set up game event listeners
    this.game.on("gameStateChanged", (data) => {
      this.setState({
        gameState: data.state,
        showOverlay: this.shouldShowOverlay(data.state),
      });
    });

    this.game.on("scoreChanged", (data) => {
      this.setState({ score: data.amount });
    });

    this.game.on("waveStarted", (data) => {
      this.setState({ wave: data.waveNumber });
    });
  }

  protected renderContent(): HTMLElement {
    if (!this.state.showOverlay) {
      return this.createElement(
        styled.div`
          display: none;
        `
      );
    }

    const Container = this.createContainer("game-state-overlay", {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 2000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "auto",
    });

    const container = this.createElement(Container);

    // Background overlay
    const BackgroundOverlay = styled.div`
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: -1;
    `;

    const background = this.createElement(BackgroundOverlay);
    container.appendChild(background);

    // Main content panel
    const contentPanel = this.createContentPanel();
    container.appendChild(contentPanel);

    return container;
  }

  private createContentPanel(): HTMLElement {
    const ContentPanel = styled.div`
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid ${(props: { theme: any }) => this.getStateColor()};
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.lg};
      padding: ${(props: { theme: any }) => props.theme.spacing.xl};
      backdrop-filter: blur(16px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
      text-align: center;
      max-width: 500px;
      min-width: 320px;

      @media (max-width: 768px) {
        max-width: 90vw;
        padding: ${(props: { theme: any }) => props.theme.spacing.lg};
      }
    `;

    const panel = this.createElement(ContentPanel);

    // Title
    const title = this.createTitle();
    panel.appendChild(title);

    // Subtitle/Description
    const subtitle = this.createSubtitle();
    if (subtitle) {
      panel.appendChild(subtitle);
    }

    // Stats (if game over or victory)
    if (this.shouldShowStats()) {
      const stats = this.createStatsSection();
      panel.appendChild(stats);
    }

    // Action buttons
    const actions = this.createActionsSection();
    panel.appendChild(actions);

    return panel;
  }

  private createTitle(): HTMLElement {
    const TitleElement = styled.h1`
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.md} 0;
      color: ${this.getStateColor()};
      font-size: ${(props: { theme: any }) =>
        props.theme.typography.fontSize.xxxl};
      font-weight: ${(props: { theme: any }) =>
        props.theme.typography.fontWeight.bold};
      text-shadow: 0 0 20px ${this.getStateColor()},
        0 0 40px ${this.getStateColor()};
      animation: pulse 2s ease-in-out infinite;

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.9;
        }
        50% {
          transform: scale(1.05);
          opacity: 1;
        }
      }

      @media (max-width: 768px) {
        font-size: ${(props: { theme: any }) =>
          props.theme.typography.fontSize.xxl};
      }
    `;

    const title = this.createElement(TitleElement, {}, this.getStateTitle());
    return title;
  }

  private createSubtitle(): HTMLElement | null {
    const subtitleText = this.getStateSubtitle();
    if (!subtitleText) return null;

    const SubtitleElement = styled.p`
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.lg} 0;
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-size: ${(props: { theme: any }) =>
        props.theme.typography.fontSize.lg};
      opacity: 0.9;
      line-height: 1.4;

      @media (max-width: 768px) {
        font-size: ${(props: { theme: any }) =>
          props.theme.typography.fontSize.md};
      }
    `;

    const subtitle = this.createElement(SubtitleElement, {}, subtitleText);
    return subtitle;
  }

  private createStatsSection(): HTMLElement {
    const StatsContainer = styled.div`
      background: rgba(0, 0, 0, 0.3);
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.md};
      padding: ${(props: { theme: any }) => props.theme.spacing.lg};
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.lg} 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const statsContainer = this.createElement(StatsContainer);

    const StatsTitle = styled.h3`
      margin: 0 0 ${(props: { theme: any }) => props.theme.spacing.md} 0;
      color: ${(props: { theme: any }) => props.theme.colors.primary};
      font-size: ${(props: { theme: any }) =>
        props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) =>
        props.theme.typography.fontWeight.semibold};
    `;

    const statsTitle = this.createElement(StatsTitle, {}, "Final Statistics");
    statsContainer.appendChild(statsTitle);

    const StatsGrid = styled.div`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${(props: { theme: any }) => props.theme.spacing.md};

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      }
    `;

    const statsGrid = this.createElement(StatsGrid);

    // Score stat
    const scoreStat = this.createStatItem(
      "Final Score",
      this.formatNumber(this.state.score),
      "⭐"
    );
    statsGrid.appendChild(scoreStat);

    // Wave stat
    const waveStat = this.createStatItem(
      "Waves Completed",
      this.state.wave.toString(),
      "🌊"
    );
    statsGrid.appendChild(waveStat);

    // Additional stats for game over
    if (
      this.state.gameState === GameState.GAME_OVER ||
      this.state.gameState === GameState.VICTORY
    ) {
      const gameState = this.getGameState();

      const towersStat = this.createStatItem(
        "Towers Built",
        gameState.towers.length.toString(),
        "🗼"
      );
      statsGrid.appendChild(towersStat);

      const enemiesStat = this.createStatItem(
        "Enemies Defeated",
        "Coming Soon",
        "💀"
      );
      statsGrid.appendChild(enemiesStat);
    }

    statsContainer.appendChild(statsGrid);
    return statsContainer;
  }

  private createStatItem(
    label: string,
    value: string,
    icon: string
  ): HTMLElement {
    const StatItem = styled.div`
      display: flex;
      align-items: center;
      gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      padding: ${(props: { theme: any }) => props.theme.spacing.sm};
      background: rgba(255, 255, 255, 0.05);
      border-radius: ${(props: { theme: any }) => props.theme.borderRadius.sm};
    `;

    const statItem = this.createElement(StatItem);

    const StatIcon = styled.div`
      font-size: ${(props: { theme: any }) =>
        props.theme.typography.fontSize.xl};
      filter: drop-shadow(0 0 4px currentColor);
    `;

    const StatContent = styled.div`
      flex: 1;
      text-align: left;
    `;

    const StatLabel = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.textSecondary};
      font-size: ${(props: { theme: any }) =>
        props.theme.typography.fontSize.sm};
      margin-bottom: 2px;
    `;

    const StatValue = styled.div`
      color: ${(props: { theme: any }) => props.theme.colors.text};
      font-size: ${(props: { theme: any }) =>
        props.theme.typography.fontSize.lg};
      font-weight: ${(props: { theme: any }) =>
        props.theme.typography.fontWeight.bold};
    `;

    const iconElement = this.createElement(StatIcon, {}, icon);
    const contentElement = this.createElement(StatContent);
    const labelElement = this.createElement(StatLabel, {}, label);
    const valueElement = this.createElement(StatValue, {}, value);

    contentElement.appendChild(labelElement);
    contentElement.appendChild(valueElement);

    statItem.appendChild(iconElement);
    statItem.appendChild(contentElement);

    return statItem;
  }

  private createActionsSection(): HTMLElement {
    const ActionsContainer = styled.div`
      display: flex;
      gap: ${(props: { theme: any }) => props.theme.spacing.md};
      justify-content: center;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: ${(props: { theme: any }) => props.theme.spacing.sm};
      }
    `;

    const actionsContainer = this.createElement(ActionsContainer);

    // Clear existing buttons
    this.actionButtons = [];

    // Create buttons based on game state
    const buttons = this.getStateActions();
    buttons.forEach((buttonConfig) => {
      const button = new Button({
        text: buttonConfig.text,
        variant: buttonConfig.variant || "primary",
        size: this.isMobile ? "medium" : "large",
        style: buttonConfig.style || {},
        onClick: buttonConfig.onClick,
      });

      this.actionButtons.push(button);
      button.mount(actionsContainer);
    });

    return actionsContainer;
  }

  private shouldShowOverlay(gameState: GameState): boolean {
    return (
      gameState === GameState.PAUSED ||
      gameState === GameState.GAME_OVER ||
      gameState === GameState.VICTORY
    );
  }

  private shouldShowStats(): boolean {
    return (
      this.state.gameState === GameState.GAME_OVER ||
      this.state.gameState === GameState.VICTORY
    );
  }

  private getStateTitle(): string {
    switch (this.state.gameState) {
      case GameState.PAUSED:
        return "PAUSED";
      case GameState.GAME_OVER:
        return "GAME OVER";
      case GameState.VICTORY:
        return "VICTORY!";
      default:
        return "";
    }
  }

  private getStateSubtitle(): string | null {
    switch (this.state.gameState) {
      case GameState.PAUSED:
        return "Press SPACE or tap Resume to continue";
      case GameState.GAME_OVER:
        return "Your defenses have been overwhelmed. Better luck next time!";
      case GameState.VICTORY:
        return "Congratulations! You have successfully defended against all waves!";
      default:
        return null;
    }
  }

  private getStateColor(): string {
    switch (this.state.gameState) {
      case GameState.PAUSED:
        return "#FFA726"; // Orange
      case GameState.GAME_OVER:
        return "#F44336"; // Red
      case GameState.VICTORY:
        return "#4CAF50"; // Green
      default:
        return "#2196F3"; // Blue
    }
  }

  private getStateActions(): Array<{
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "info";
    style?: Record<string, any>;
    onClick: () => void;
  }> {
    switch (this.state.gameState) {
      case GameState.PAUSED:
        return [
          {
            text: "Resume",
            variant: "success",
            onClick: () => this.game.resume(),
          },
          {
            text: "Restart",
            variant: "warning",
            onClick: () => this.handleRestart(),
          },
          {
            text: "Main Menu",
            variant: "secondary",
            onClick: () => this.handleMainMenu(),
          },
        ];

      case GameState.GAME_OVER:
        return [
          {
            text: "Try Again",
            variant: "primary",
            onClick: () => this.handleRestart(),
          },
          {
            text: "Main Menu",
            variant: "secondary",
            onClick: () => this.handleMainMenu(),
          },
        ];

      case GameState.VICTORY:
        return [
          {
            text: "Play Again",
            variant: "success",
            onClick: () => this.handleRestart(),
          },
          {
            text: "Main Menu",
            variant: "secondary",
            onClick: () => this.handleMainMenu(),
          },
        ];

      default:
        return [];
    }
  }

  private handleRestart(): void {
    // For now, just reload the page
    // In a full implementation, this would restart the game properly
    window.location.reload();
  }

  private handleMainMenu(): void {
    // For now, just reload the page
    // In a full implementation, this would return to main menu
    window.location.reload();
  }

  /**
   * Called after state updates to refresh display
   */
  onStateUpdate(): void {
    super.onStateUpdate();

    // Force re-render when overlay visibility changes
    if (
      this.state.showOverlay !== this.shouldShowOverlay(this.state.gameState)
    ) {
      this.setState({
        showOverlay: this.shouldShowOverlay(this.state.gameState),
      });
    }
  }
}
