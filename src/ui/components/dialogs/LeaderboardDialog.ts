import { BaseDialog } from './BaseDialog';
import { ScoreManager } from '@/systems/ScoreManager';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { AudioManager } from '@/audio/AudioManager';
import { DIALOG_CONFIG } from '@/config/UIConfig';

export interface LeaderboardDialogOptions {
  audioManager?: AudioManager;
}

export class LeaderboardDialog extends BaseDialog {
  constructor(options: LeaderboardDialogOptions) {
    super({
      title: 'Leaderboard',
      width: DIALOG_CONFIG.sizes.medium,
      closeable: true,
      modal: true,
      audioManager: options.audioManager,
      className: 'leaderboard-dialog'
    });
    
    this.buildContent();
  }
  
  protected buildContent(): void {
    const scores = ScoreManager.getTopScores(10);
    
    if (scores.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.cssText = `
        text-align: center;
        color: #ccc;
        padding: 40px 20px;
        font-size: clamp(14px, 3.5vw, 16px);
      `;
      emptyMessage.textContent = 'No scores yet. Play some games to see your results here!';
      this.content.appendChild(emptyMessage);
      return;
    }
    
    // Create scrollable container for scores
    const scoresContainer = document.createElement('div');
    scoresContainer.style.cssText = `
      max-height: clamp(300px, 60vh, 500px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;
    
    scores.forEach((score, index) => {
      const scoreRow = this.createScoreRow(score, index);
      scoresContainer.appendChild(scoreRow);
    });
    
    this.content.appendChild(scoresContainer);
    
    // Add stats summary at bottom
    const stats = ScoreManager.getScoreStats();
    if (stats.totalGames > 0) {
      const summarySection = this.createStatsSummary(stats);
      this.content.appendChild(summarySection);
    }
  }
  
  private createScoreRow(score: any, index: number): HTMLElement {
    const row = document.createElement('div');
    const isTopThree = index < 3;
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border-left: 4px solid ${isTopThree ? medalColors[index] : '#4CAF50'};
      transition: all 0.2s ease;
    `;
    
    // Hover effect on desktop
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(255, 255, 255, 0.08)';
      row.style.transform = 'translateX(4px)';
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.background = 'rgba(255, 255, 255, 0.05)';
      row.style.transform = 'translateX(0)';
    });
    
    // Left side - rank and wave info
    const leftSide = document.createElement('div');
    leftSide.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    const rankIcon = createSvgIcon(
      isTopThree ? IconType.TROPHY : IconType.MEDAL,
      { size: 24 }
    );
    
    const rankInfo = document.createElement('div');
    rankInfo.innerHTML = `
      ${rankIcon}
      <span style="font-weight: bold; color: ${isTopThree ? medalColors[index] : '#4CAF50'}; font-size: clamp(16px, 4vw, 18px);">
        #${score.rank}
      </span>
      <span style="color: #ccc; margin-left: 12px; font-size: clamp(12px, 3vw, 14px);">
        Wave ${score.wave}
      </span>
    `;
    rankInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    leftSide.appendChild(rankInfo);
    
    // Right side - score and date
    const rightSide = document.createElement('div');
    rightSide.style.cssText = `
      text-align: right;
    `;
    
    const scoreValue = document.createElement('div');
    scoreValue.style.cssText = `
      font-size: clamp(16px, 4vw, 20px);
      font-weight: bold;
      color: #4CAF50;
    `;
    scoreValue.textContent = score.score.toLocaleString();
    
    const dateValue = document.createElement('div');
    dateValue.style.cssText = `
      font-size: clamp(10px, 2.5vw, 12px);
      color: #999;
      margin-top: 4px;
    `;
    dateValue.textContent = new Date(score.date).toLocaleDateString();
    
    rightSide.appendChild(scoreValue);
    rightSide.appendChild(dateValue);
    
    row.appendChild(leftSide);
    row.appendChild(rightSide);
    
    return row;
  }
  
  private createStatsSummary(stats: any): HTMLElement {
    const summary = document.createElement('div');
    summary.style.cssText = `
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(76, 175, 80, 0.3);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(clamp(120px, 30vw, 180px), 1fr));
      gap: 16px;
    `;
    
    const statItems = [
      {
        label: 'Games Played',
        value: stats.totalGames.toString(),
        icon: IconType.GAME_CONTROLLER
      },
      {
        label: 'Average Score',
        value: Math.round(stats.averageScore).toLocaleString(),
        icon: IconType.SCORE
      },
      {
        label: 'Highest Wave',
        value: stats.highestWave.toString(),
        icon: IconType.WAVE
      }
    ];
    
    statItems.forEach(stat => {
      const statCard = document.createElement('div');
      statCard.style.cssText = `
        text-align: center;
        padding: 12px;
        background: rgba(76, 175, 80, 0.1);
        border-radius: 6px;
        border: 1px solid rgba(76, 175, 80, 0.3);
      `;
      
      const icon = createSvgIcon(stat.icon, { size: 20 });
      statCard.innerHTML = `
        <div style="margin-bottom: 8px; opacity: 0.7;">${icon}</div>
        <div style="font-size: clamp(18px, 4.5vw, 22px); font-weight: bold; color: #4CAF50;">
          ${stat.value}
        </div>
        <div style="font-size: clamp(10px, 2.5vw, 12px); color: #ccc; margin-top: 4px;">
          ${stat.label}
        </div>
      `;
      
      summary.appendChild(statCard);
    });
    
    return summary;
  }
}