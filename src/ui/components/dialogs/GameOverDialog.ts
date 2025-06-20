import { BaseDialog } from './BaseDialog';
import { isMobile } from '@/config/ResponsiveConfig';
import type { GameStats, ScoreboardEntry } from '@/systems/ScoreManager';
import { ScoreManager } from '@/systems/ScoreManager';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';

export interface GameOverDialogOptions {
  victory: boolean;
  stats: GameStats;
  scoreEntry: ScoreboardEntry;
  audioManager?: AudioManager;
  onRestart: () => void;
  onMainMenu: () => void;
}

export class GameOverDialog extends BaseDialog {
  private victory: boolean;
  private stats: GameStats;
  private scoreEntry: ScoreboardEntry;
  private onRestart: () => void;
  private onMainMenu: () => void;
  
  constructor(options: GameOverDialogOptions) {
    super({
      title: options.victory ? 'Victory!' : 'Game Over',
      width: DIALOG_CONFIG.sizes.large,
      closeable: false,
      modal: true,
      audioManager: options.audioManager,
      className: 'game-over-dialog'
    });
    
    this.victory = options.victory;
    this.stats = options.stats;
    this.scoreEntry = options.scoreEntry;
    this.onRestart = options.onRestart;
    this.onMainMenu = options.onMainMenu;
    
    // Update header color based on victory/defeat
    if (this.header) {
      const titleElement = this.header.querySelector('.dialog-title') as HTMLElement;
      if (titleElement) {
        titleElement.style.color = this.victory ? '#4CAF50' : '#F44336';
      }
      
      // Add icon to title
      const icon = createSvgIcon(
        this.victory ? IconType.TROPHY : IconType.SKULL,
        { size: 32 }
      );
      titleElement.innerHTML = `${icon} ${titleElement.textContent}`;
    }
    
    this.buildContent();
  }
  
  protected buildContent(): void {
    // Score summary section
    const scoreSection = this.createScoreSection();
    this.content.appendChild(scoreSection);
    
    // Stats grid
    const statsGrid = this.createStatsGrid();
    this.content.appendChild(statsGrid);
    
    // Personal records comparison
    const personalStats = ScoreManager.getScoreStats();
    if (personalStats.totalGames > 1) {
      const comparison = this.createPersonalComparison(personalStats);
      this.content.appendChild(comparison);
    }
    
    // Create footer with action buttons
    this.createFooter();
    const footer = this.footer!;
    footer.style.flexWrap = 'wrap';
    
    // Play Again button
    const restartButton = this.createButton('Play Again', {
      icon: IconType.RESTART,
      primary: true,
      onClick: () => {
        this.hide();
        this.onRestart();
      }
    });
    
    // Main Menu button
    const menuButton = this.createButton('Main Menu', {
      icon: IconType.HOME,
      color: '#2196F3',
      onClick: () => {
        this.hide();
        this.onMainMenu();
      }
    });
    
    // View Scores button
    const scoresButton = this.createButton('Leaderboard', {
      icon: IconType.LEADERBOARD,
      color: '#FF9800',
      onClick: () => {
        this.showLeaderboard();
      }
    });
    
    footer.appendChild(restartButton);
    footer.appendChild(menuButton);
    footer.appendChild(scoresButton);
  }
  
  private createScoreSection(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const scoreTitle = document.createElement('h3');
    scoreTitle.style.cssText = `
      margin: 0 0 16px 0;
      color: #FFD700;
      font-size: clamp(20px, 5vw, 24px);
    `;
    scoreTitle.textContent = 'Final Score';
    section.appendChild(scoreTitle);
    
    const scoreValue = document.createElement('div');
    scoreValue.style.cssText = `
      font-size: clamp(36px, 8vw, 48px);
      font-weight: bold;
      color: #4CAF50;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    `;
    scoreValue.textContent = this.stats.score.toLocaleString();
    section.appendChild(scoreValue);
    
    // Rank information
    if (this.scoreEntry.rank) {
      const rankInfo = document.createElement('div');
      rankInfo.style.cssText = `
        margin-top: 16px;
        padding: 12px;
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid #FFD700;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `;
      
      const trophyIcon = createSvgIcon(IconType.TROPHY, { size: 24 });
      rankInfo.innerHTML = `
        ${trophyIcon}
        <span style="color: #FFD700; font-size: clamp(14px, 3.5vw, 16px); font-weight: bold;">
          Rank #${this.scoreEntry.rank} on the leaderboard!
        </span>
      `;
      section.appendChild(rankInfo);
    }
    
    return section;
  }
  
  private createStatsGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(clamp(100px, 25vw, 150px), 1fr));
      gap: 12px;
      margin-bottom: 20px;
    `;
    
    const stats = [
      { label: 'Wave', value: (this.stats.wave || 0).toString(), icon: IconType.WAVE },
      { label: 'Enemies', value: (this.stats.enemiesKilled || 0).toString(), icon: IconType.ENEMY },
      { label: 'Towers', value: (this.stats.towersBuilt || 0).toString(), icon: IconType.TOWER },
      { label: 'Time', value: this.formatTime(this.stats.gameTime || 0), icon: IconType.CLOCK },
      { label: 'Currency', value: `$${this.stats.currency || 0}`, icon: IconType.CURRENCY },
      { label: 'Lives', value: '0', icon: IconType.HEART }
    ];
    
    stats.forEach(stat => {
      const statCard = document.createElement('div');
      statCard.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 12px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: transform 0.2s ease;
      `;
      
      const icon = createSvgIcon(stat.icon, { size: 20 });
      statCard.innerHTML = `
        <div style="margin-bottom: 8px; opacity: 0.7;">${icon}</div>
        <div style="font-size: clamp(16px, 4vw, 20px); font-weight: bold; color: #4CAF50;">
          ${stat.value}
        </div>
        <div style="font-size: clamp(10px, 2.5vw, 12px); color: #ccc; margin-top: 4px;">
          ${stat.label}
        </div>
      `;
      
      // Hover effect on desktop
      statCard.addEventListener('mouseenter', () => {
        statCard.style.transform = 'translateY(-2px)';
      });
      
      statCard.addEventListener('mouseleave', () => {
        statCard.style.transform = 'translateY(0)';
      });
      
      grid.appendChild(statCard);
    });
    
    return grid;
  }
  
  private createPersonalComparison(personalStats: any): HTMLElement {
    const comparison = document.createElement('div');
    comparison.style.cssText = `
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const title = document.createElement('h4');
    title.style.cssText = `
      margin: 0 0 12px 0;
      color: #2196F3;
      font-size: clamp(16px, 4vw, 18px);
    `;
    title.textContent = 'Personal Records';
    comparison.appendChild(title);
    
    const isPersonalBest = this.stats.score === personalStats.personalBest;
    
    const content = document.createElement('div');
    content.style.cssText = `
      font-size: clamp(12px, 3vw, 14px);
      line-height: 1.6;
      color: #ccc;
    `;
    
    const personalBestIcon = createSvgIcon(IconType.TROPHY, { size: 16 });
    const gamesIcon = createSvgIcon(IconType.GAME_CONTROLLER, { size: 16 });
    
    content.innerHTML = `
      <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        ${personalBestIcon}
        <span>Personal Best: <strong style="color: #FFD700;">${personalStats.personalBest.toLocaleString()}</strong></span>
        ${isPersonalBest ? '<span style="color: #4CAF50; margin-left: 8px; font-weight: bold;">(NEW RECORD!)</span>' : ''}
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        ${gamesIcon}
        <span>Games Played: <strong>${personalStats.totalGames}</strong></span>
      </div>
      <div>
        Average Score: <strong>${personalStats.averageScore.toLocaleString()}</strong> | 
        Highest Wave: <strong>${personalStats.highestWave}</strong>
      </div>
    `;
    
    comparison.appendChild(content);
    return comparison;
  }
  
  private showLeaderboard(): void {
    // Import and show the LeaderboardDialog
    import('./LeaderboardDialog').then(({ LeaderboardDialog }) => {
      const leaderboard = new LeaderboardDialog({
        audioManager: this.options.audioManager
      });
      
      // Register with DialogManager
      import('@/ui/systems/DialogManager').then(({ DialogManager }) => {
        const manager = DialogManager.getInstance();
        manager.register('leaderboard', leaderboard);
        manager.show('leaderboard');
      });
    });
  }
  
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
  
  protected onResize(): void {
    // Adjust grid columns on very small screens
    const statsGrid = this.content.querySelector('div:nth-child(2)') as HTMLElement;
    if (statsGrid && isMobile(window.innerWidth)) {
      statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }
  }
}