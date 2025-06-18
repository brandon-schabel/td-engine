import type { GameStats, ScoreboardEntry } from '@/systems/ScoreManager';
import { ScoreManager } from '@/systems/ScoreManager';
import { createSvgIcon, IconType } from '../icons/SvgIcons';

export interface GameOverScreenOptions {
  victory: boolean;
  stats: GameStats;
  scoreEntry: ScoreboardEntry;
  onRestart: () => void;
  onMainMenu: () => void;
}

export class GameOverScreen {
  private container: HTMLDivElement;
  private visible: boolean = false;

  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
    this.addMobileStyles();
  }

  private addMobileStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .game-over-screen {
          padding: 10px !important;
        }
        
        .game-over-panel {
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
      }
      
      @media (max-height: 600px) {
        .game-over-panel {
          max-height: 85vh !important;
        }
      }
      
      /* Touch device optimizations */
      @media (hover: none) and (pointer: coarse) {
        .game-over-panel button:active {
          transform: scale(0.98) !important;
          box-shadow: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'game-over-screen';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      overflow-y: auto;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    `;
    return container;
  }

  show(options: GameOverScreenOptions): void {
    this.visible = true;
    this.container.innerHTML = '';
    this.container.style.display = 'flex';
    
    const panel = this.createGameOverPanel(options);
    this.container.appendChild(panel);
    
    // Add escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
  }

  private createGameOverPanel(options: GameOverScreenOptions): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'game-over-panel';
    panel.style.cssText = `
      background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
      border: 2px solid ${options.victory ? '#4CAF50' : '#f44336'};
      border-radius: 16px;
      padding: clamp(20px, 4vw, 32px);
      max-width: min(600px, 90vw);
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      color: white;
      text-align: center;
      margin: auto;
    `;

    // Title
    const title = document.createElement('h1');
    title.style.cssText = `
      margin: 0 0 clamp(16px, 3vw, 24px) 0;
      font-size: clamp(24px, 6vw, 36px);
      color: ${options.victory ? '#4CAF50' : '#f44336'};
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    const iconSize = window.innerWidth < 768 ? 28 : 40;
    const titleIcon = createSvgIcon(options.victory ? IconType.VICTORY : IconType.GAME_OVER, { size: iconSize });
    title.innerHTML = `${titleIcon} ${options.victory ? 'Victory!' : 'Game Over'}`;
    panel.appendChild(title);

    // Score summary
    const scoreSummary = document.createElement('div');
    scoreSummary.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: clamp(12px, 3vw, 20px);
      margin-bottom: clamp(16px, 3vw, 24px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const scoreTitle = document.createElement('h2');
    scoreTitle.textContent = 'Final Score';
    scoreTitle.style.cssText = `
      margin: 0 0 clamp(12px, 2vw, 16px) 0;
      color: #FFD700;
      font-size: clamp(18px, 4vw, 24px);
    `;
    scoreSummary.appendChild(scoreTitle);

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: clamp(8px, 2vw, 16px);
      margin-bottom: clamp(12px, 2vw, 16px);
    `;

    const stats = [
      { label: 'Score', value: options.stats.score.toLocaleString(), icon: IconType.SCORE },
      { label: 'Wave', value: options.stats.wave.toString(), icon: IconType.WAVE },
      { label: 'Enemies Killed', value: options.stats.enemiesKilled.toString(), icon: IconType.ENEMY },
      { label: 'Towers Built', value: options.stats.towersBuilt.toString(), icon: IconType.BASIC_TOWER },
      { label: 'Currency', value: `$${options.stats.currency}`, icon: IconType.CURRENCY },
      { label: 'Time Played', value: this.formatTime(options.stats.gameTime), icon: IconType.CLOCK }
    ];

    stats.forEach(stat => {
      const statElement = document.createElement('div');
      statElement.style.cssText = `
        text-align: center;
        padding: clamp(8px, 2vw, 12px);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      `;
      
      const iconSize = window.innerWidth < 768 ? 16 : 20;
      const icon = createSvgIcon(stat.icon, { size: iconSize });
      statElement.innerHTML = `
        <div style="margin-bottom: clamp(4px, 1vw, 8px);">${icon}</div>
        <div style="font-size: clamp(14px, 3vw, 18px); font-weight: bold; color: #4CAF50;">${stat.value}</div>
        <div style="font-size: clamp(10px, 2vw, 12px); color: #ccc;">${stat.label}</div>
      `;
      statsGrid.appendChild(statElement);
    });

    scoreSummary.appendChild(statsGrid);

    // Rank information
    if (options.scoreEntry.rank) {
      const rankInfo = document.createElement('div');
      rankInfo.style.cssText = `
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid #FFD700;
        border-radius: 6px;
        padding: clamp(8px, 2vw, 12px);
        margin-top: clamp(12px, 2vw, 16px);
      `;
      
      const trophyIconSize = window.innerWidth < 768 ? 20 : 24;
      const trophyIcon = createSvgIcon(IconType.TROPHY, { size: trophyIconSize });
      rankInfo.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: clamp(6px, 1vw, 8px); flex-wrap: wrap;">
          ${trophyIcon}
          <span style="color: #FFD700; font-size: clamp(14px, 3vw, 16px); font-weight: bold;">
            Rank #${options.scoreEntry.rank} on the leaderboard!
          </span>
        </div>
      `;
      scoreSummary.appendChild(rankInfo);
    }

    panel.appendChild(scoreSummary);

    // Personal stats comparison
    const personalStats = ScoreManager.getScoreStats();
    if (personalStats.totalGames > 1) {
      const comparison = document.createElement('div');
      comparison.style.cssText = `
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: clamp(12px, 3vw, 16px);
        margin-bottom: clamp(16px, 3vw, 24px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;

      const comparisonTitle = document.createElement('h3');
      comparisonTitle.textContent = 'Personal Records';
      comparisonTitle.style.cssText = `
        margin: 0 0 clamp(8px, 2vw, 12px) 0;
        color: #2196F3;
        font-size: clamp(16px, 3vw, 18px);
      `;
      comparison.appendChild(comparisonTitle);

      const isPersonalBest = options.stats.score === personalStats.personalBest;
      const comparisonText = document.createElement('div');
      comparisonText.style.cssText = `
        font-size: clamp(12px, 2.5vw, 14px);
        color: #ccc;
        line-height: 1.6;
      `;
      
      const iconSize = window.innerWidth < 768 ? 14 : 16;
      const personalBestIcon = createSvgIcon(IconType.TROPHY, { size: iconSize });
      const gamesIcon = createSvgIcon(IconType.GAME_CONTROLLER, { size: iconSize });
      
      comparisonText.innerHTML = `
        <div style="margin-bottom: clamp(6px, 1vw, 8px);">
          ${personalBestIcon} Personal Best: <strong style="color: #FFD700;">${personalStats.personalBest.toLocaleString()}</strong>
          ${isPersonalBest ? '<span style="color: #4CAF50; margin-left: clamp(6px, 1vw, 8px);">(NEW RECORD!)</span>' : ''}
        </div>
        <div style="margin-bottom: clamp(6px, 1vw, 8px);">
          ${gamesIcon} Games Played: <strong>${personalStats.totalGames}</strong>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: clamp(4px, 1vw, 8px);">
          <span>Average Score: <strong>${personalStats.averageScore.toLocaleString()}</strong></span>
          <span>|</span>
          <span>Highest Wave: <strong>${personalStats.highestWave}</strong></span>
        </div>
      `;
      comparison.appendChild(comparisonText);
      panel.appendChild(comparison);
    }

    // Action buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: clamp(8px, 2vw, 16px);
      justify-content: center;
      flex-wrap: wrap;
    `;

    // Restart button
    const restartButton = this.createActionButton(
      'Play Again',
      IconType.RESTART,
      '#4CAF50',
      options.onRestart
    );

    // Main menu button
    const menuButton = this.createActionButton(
      'Main Menu',
      IconType.HOME,
      '#2196F3',
      options.onMainMenu
    );

    // View scores button
    const scoresButton = this.createActionButton(
      'View Scores',
      IconType.LEADERBOARD,
      '#FF9800',
      () => this.showScoreboard()
    );

    buttonContainer.appendChild(restartButton);
    buttonContainer.appendChild(menuButton);
    buttonContainer.appendChild(scoresButton);
    panel.appendChild(buttonContainer);

    return panel;
  }

  private createActionButton(
    text: string,
    iconType: IconType,
    color: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.style.cssText = `
      background: ${color};
      border: none;
      border-radius: 8px;
      padding: clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px);
      color: white;
      font-size: clamp(14px, 3vw, 16px);
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: clamp(6px, 1vw, 8px);
      min-width: clamp(120px, 25vw, 140px);
      min-height: 44px;
      justify-content: center;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    `;

    const iconSize = window.innerWidth < 768 ? 18 : 20;
    const icon = createSvgIcon(iconType, { size: iconSize });
    button.innerHTML = `${icon}${text}`;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.4)`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', () => {
      this.hide();
      onClick();
    });

    return button;
  }

  private showScoreboard(): void {
    // Create a simple scoreboard overlay
    const scoreboardContainer = document.createElement('div');
    scoreboardContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      overflow-y: auto;
    `;

    const scoreboardPanel = document.createElement('div');
    scoreboardPanel.style.cssText = `
      background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
      border: 2px solid #FFD700;
      border-radius: 16px;
      padding: clamp(20px, 4vw, 32px);
      max-width: min(800px, 90vw);
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      color: white;
      margin: auto;
    `;

    const title = document.createElement('h2');
    title.style.cssText = `
      text-align: center;
      margin: 0 0 clamp(16px, 3vw, 24px) 0;
      color: #FFD700;
      font-size: clamp(20px, 5vw, 28px);
    `;
    const leaderboardIconSize = window.innerWidth < 768 ? 24 : 32;
    const leaderboardIcon = createSvgIcon(IconType.LEADERBOARD, { size: leaderboardIconSize });
    title.innerHTML = `${leaderboardIcon} Leaderboard`;
    scoreboardPanel.appendChild(title);

    const scores = ScoreManager.getTopScores(10);
    if (scores.length === 0) {
      const noScores = document.createElement('div');
      noScores.textContent = 'No scores yet. Play some games to see your results here!';
      noScores.style.cssText = `
        text-align: center;
        color: #ccc;
        padding: clamp(24px, 5vw, 32px);
        font-size: clamp(14px, 3vw, 16px);
      `;
      scoreboardPanel.appendChild(noScores);
    } else {
      scores.forEach((score, index) => {
        const scoreRow = document.createElement('div');
        scoreRow.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
          margin-bottom: clamp(6px, 1vw, 8px);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 4px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#4CAF50'};
          flex-wrap: wrap;
          gap: clamp(8px, 2vw, 12px);
        `;

        const iconSize = window.innerWidth < 768 ? 16 : 20;
        const rankIcon = createSvgIcon(
          index === 0 ? IconType.TROPHY : IconType.MEDAL,
          { size: iconSize }
        );

        scoreRow.innerHTML = `
          <div style="display: flex; align-items: center; gap: clamp(8px, 2vw, 12px); flex: 1; min-width: 150px;">
            ${rankIcon}
            <span style="font-weight: bold; color: ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#4CAF50'}; font-size: clamp(14px, 3vw, 16px);">
              #${score.rank}
            </span>
            <span style="color: white; font-size: clamp(12px, 2.5vw, 14px);">Wave ${score.wave}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: clamp(16px, 3vw, 18px); font-weight: bold; color: #4CAF50;">
              ${score.score.toLocaleString()}
            </div>
            <div style="font-size: clamp(10px, 2vw, 12px); color: #ccc;">
              ${new Date(score.date).toLocaleDateString()}
            </div>
          </div>
        `;
        scoreboardPanel.appendChild(scoreRow);
      });
    }

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      width: 100%;
      margin-top: clamp(16px, 3vw, 24px);
      background: #f44336;
      border: none;
      border-radius: 8px;
      padding: clamp(10px, 2vw, 12px);
      color: white;
      font-size: clamp(14px, 3vw, 16px);
      font-weight: bold;
      cursor: pointer;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(6px, 1vw, 8px);
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    `;
    const closeIconSize = window.innerWidth < 768 ? 18 : 20;
    const closeIcon = createSvgIcon(IconType.CLOSE, { size: closeIconSize });
    closeButton.innerHTML = `${closeIcon} Close`;
    closeButton.addEventListener('click', () => {
      document.body.removeChild(scoreboardContainer);
    });
    scoreboardPanel.appendChild(closeButton);

    scoreboardContainer.appendChild(scoreboardPanel);
    document.body.appendChild(scoreboardContainer);

    // Close with escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(scoreboardContainer);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}