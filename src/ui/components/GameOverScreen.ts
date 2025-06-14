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
      padding: 32px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      color: white;
      text-align: center;
    `;

    // Title
    const title = document.createElement('h1');
    title.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 36px;
      color: ${options.victory ? '#4CAF50' : '#f44336'};
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    const titleIcon = createSvgIcon(options.victory ? IconType.VICTORY : IconType.GAME_OVER, { size: 40 });
    title.innerHTML = `${titleIcon} ${options.victory ? 'Victory!' : 'Game Over'}`;
    panel.appendChild(title);

    // Score summary
    const scoreSummary = document.createElement('div');
    scoreSummary.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const scoreTitle = document.createElement('h2');
    scoreTitle.textContent = 'Final Score';
    scoreTitle.style.cssText = `
      margin: 0 0 16px 0;
      color: #FFD700;
      font-size: 24px;
    `;
    scoreSummary.appendChild(scoreTitle);

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
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
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;
      
      const icon = createSvgIcon(stat.icon, { size: 20 });
      statElement.innerHTML = `
        <div style="margin-bottom: 8px;">${icon}</div>
        <div style="font-size: 18px; font-weight: bold; color: #4CAF50;">${stat.value}</div>
        <div style="font-size: 12px; color: #ccc;">${stat.label}</div>
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
        padding: 12px;
        margin-top: 16px;
      `;
      
      const trophyIcon = createSvgIcon(IconType.TROPHY, { size: 24 });
      rankInfo.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${trophyIcon}
          <span style="color: #FFD700; font-size: 16px; font-weight: bold;">
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
        padding: 16px;
        margin-bottom: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;

      const comparisonTitle = document.createElement('h3');
      comparisonTitle.textContent = 'Personal Records';
      comparisonTitle.style.cssText = `
        margin: 0 0 12px 0;
        color: #2196F3;
        font-size: 18px;
      `;
      comparison.appendChild(comparisonTitle);

      const isPersonalBest = options.stats.score === personalStats.personalBest;
      const comparisonText = document.createElement('div');
      comparisonText.style.cssText = `
        font-size: 14px;
        color: #ccc;
        line-height: 1.4;
      `;
      
      const personalBestIcon = createSvgIcon(IconType.TROPHY, { size: 16 });
      const gamesIcon = createSvgIcon(IconType.GAME_CONTROLLER, { size: 16 });
      
      comparisonText.innerHTML = `
        <div style="margin-bottom: 8px;">
          ${personalBestIcon} Personal Best: <strong style="color: #FFD700;">${personalStats.personalBest.toLocaleString()}</strong>
          ${isPersonalBest ? '<span style="color: #4CAF50; margin-left: 8px;">(NEW RECORD!)</span>' : ''}
        </div>
        <div style="margin-bottom: 8px;">
          ${gamesIcon} Games Played: <strong>${personalStats.totalGames}</strong>
        </div>
        <div>
          Average Score: <strong>${personalStats.averageScore.toLocaleString()}</strong> | 
          Highest Wave: <strong>${personalStats.highestWave}</strong>
        </div>
      `;
      comparison.appendChild(comparisonText);
      panel.appendChild(comparison);
    }

    // Action buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 16px;
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
      padding: 12px 24px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
      justify-content: center;
    `;

    const icon = createSvgIcon(iconType, { size: 20 });
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
    `;

    const scoreboardPanel = document.createElement('div');
    scoreboardPanel.style.cssText = `
      background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
      border: 2px solid #FFD700;
      border-radius: 16px;
      padding: 32px;
      max-width: 800px;
      width: 90%;
      max-height: 80%;
      overflow-y: auto;
      color: white;
    `;

    const title = document.createElement('h2');
    title.style.cssText = `
      text-align: center;
      margin: 0 0 24px 0;
      color: #FFD700;
      font-size: 28px;
    `;
    const leaderboardIcon = createSvgIcon(IconType.LEADERBOARD, { size: 32 });
    title.innerHTML = `${leaderboardIcon} Leaderboard`;
    scoreboardPanel.appendChild(title);

    const scores = ScoreManager.getTopScores(10);
    if (scores.length === 0) {
      const noScores = document.createElement('div');
      noScores.textContent = 'No scores yet. Play some games to see your results here!';
      noScores.style.cssText = 'text-align: center; color: #ccc; padding: 32px;';
      scoreboardPanel.appendChild(noScores);
    } else {
      scores.forEach((score, index) => {
        const scoreRow = document.createElement('div');
        scoreRow.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 4px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#4CAF50'};
        `;

        const rankIcon = createSvgIcon(
          index === 0 ? IconType.TROPHY : IconType.MEDAL,
          { size: 20 }
        );

        scoreRow.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            ${rankIcon}
            <span style="font-weight: bold; color: ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#4CAF50'};">
              #${score.rank}
            </span>
            <span style="color: white;">Wave ${score.wave}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold; color: #4CAF50;">
              ${score.score.toLocaleString()}
            </div>
            <div style="font-size: 12px; color: #ccc;">
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
      margin-top: 24px;
      background: #f44336;
      border: none;
      border-radius: 8px;
      padding: 12px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    `;
    const closeIcon = createSvgIcon(IconType.CLOSE, { size: 20 });
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