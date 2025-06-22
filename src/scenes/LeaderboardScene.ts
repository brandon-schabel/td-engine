/**
 * Leaderboard scene - full screen high scores display
 */

import { Scene } from './Scene';
import { createButton, cn } from '@/ui/elements';
import { IconType, createSvgIcon } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { TransitionType } from './SceneTransition';
import { formatNumber } from '@/utils/formatters';
import { ScoreManager, type ScoreboardEntry } from '@/systems/ScoreManager';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  wave: number;
  date: Date;
  playerLevel?: number;
  enemiesKilled?: number;
  gameTime?: number;
}

export class LeaderboardScene extends Scene {
  private leaderboard: LeaderboardEntry[] = [];
  private currentFilter: 'all' | 'today' | 'week' = 'all';

  protected async onEnter(): Promise<void> {
    this.loadLeaderboard();
    this.createLeaderboardUI();
  }

  protected async onExit(): Promise<void> {
    // Clean up
  }

  protected onUpdate(_deltaTime: number): void {
    // No updates needed
  }

  protected onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (event instanceof KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          this.handleBack();
          break;
      }
    }
  }

  protected onDestroy(): void {
    // Clean up
  }

  private loadLeaderboard(): void {
    // Load from ScoreManager
    const scores = ScoreManager.getScores();
    
    // Convert ScoreboardEntry to LeaderboardEntry format
    this.leaderboard = scores.map((entry: ScoreboardEntry, index) => {
      // Generate a name from the game stats or use initials
      const name = this.generatePlayerName(entry);
      
      return {
        rank: entry.rank || index + 1,
        name: name,
        score: entry.score,
        wave: entry.wave,
        date: new Date(entry.date),
        playerLevel: entry.playerLevel,
        enemiesKilled: entry.enemiesKilled,
        gameTime: entry.gameTime
      };
    });

    // If no scores exist, add a few example entries to show the UI
    if (this.leaderboard.length === 0) {
      this.leaderboard = [
        { rank: 1, name: 'AAA', score: 10000, wave: 10, date: new Date() },
        { rank: 2, name: 'BBB', score: 7500, wave: 8, date: new Date(Date.now() - 86400000) },
        { rank: 3, name: 'CCC', score: 5000, wave: 6, date: new Date(Date.now() - 172800000) }
      ];
    }
  }

  private generatePlayerName(entry: ScoreboardEntry): string {
    // Generate initials based on score, wave, and timestamp
    // This creates consistent "names" for each score entry
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const seed = entry.score + entry.wave + (entry.date % 1000);
    
    const first = chars[seed % 26];
    const second = chars[(seed * 7) % 26];
    const third = chars[(seed * 13) % 26];
    
    return first + second + third;
  }

  private getFilteredLeaderboard(): LeaderboardEntry[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (this.currentFilter) {
      case 'today':
        return this.leaderboard.filter(entry => entry.date >= today);
      case 'week':
        return this.leaderboard.filter(entry => entry.date >= weekAgo);
      default:
        return this.leaderboard;
    }
  }

  private createLeaderboardUI(): void {
    // Clear container
    this.container.innerHTML = '';

    // Set container styles with animated gradient background
    this.container.className = cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full',
      'flex',
      'flex-col'
    );

    // Add animated gradient background
    const background = document.createElement('div');
    background.className = cn('absolute', 'inset-0');
    background.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    `;
    this.container.appendChild(background);

    // Add particle overlay
    const particleOverlay = document.createElement('div');
    particleOverlay.className = cn('absolute', 'inset-0', 'opacity-10');
    particleOverlay.style.cssText = `
      background-image: radial-gradient(circle, white 1px, transparent 1px);
      background-size: 50px 50px;
      animation: particleFloat 20s ease-in-out infinite;
    `;
    this.container.appendChild(particleOverlay);

    // Create main content wrapper
    const mainWrapper = document.createElement('div');
    mainWrapper.className = cn(
      'relative',
      'z-10',
      'w-full',
      'h-full',
      'flex',
      'flex-col'
    );

    // Create header with back button
    const header = document.createElement('div');
    header.className = cn(
      'flex',
      'items-center',
      'justify-between',
      'p-4',
      'sm:p-6',
      'bg-surface-secondary/80',
      'backdrop-blur-sm',
      'border-b',
      'border-white/10'
    );

    const backButton = createButton({
      text: 'Back',
      icon: IconType.ARROW_LEFT,
      variant: 'ghost',
      size: 'sm',
      onClick: () => this.handleBack()
    });
    header.appendChild(backButton);

    const title = document.createElement('h1');
    title.className = cn('text-3xl', 'sm:text-4xl', 'font-bold', 'flex', 'items-center', 'gap-3');
    
    // Add glowing crown icon
    const crownIcon = document.createElement('div');
    crownIcon.style.cssText = `
      filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
      animation: pulse 2s ease-in-out infinite;
    `;
    crownIcon.innerHTML = createSvgIcon(IconType.CROWN, { size: 36 });
    
    // Gradient text for title
    const titleText = document.createElement('span');
    titleText.style.cssText = `
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    `;
    titleText.textContent = 'Leaderboard';
    
    title.appendChild(crownIcon);
    title.appendChild(titleText);
    header.appendChild(title);

    // Empty div for layout balance
    header.appendChild(document.createElement('div'));

    mainWrapper.appendChild(header);

    // Create content container with scrollable area
    const content = document.createElement('div');
    content.className = cn(
      'flex-1',
      'overflow-y-auto',
      'overflow-x-hidden',
      'relative'
    );
    
    // Inner content wrapper for centering
    const contentInner = document.createElement('div');
    contentInner.className = cn(
      'p-4',
      'sm:p-8',
      'max-w-5xl',
      'w-full',
      'mx-auto'
    );

    // Filter buttons with background
    const filterWrapper = document.createElement('div');
    filterWrapper.className = cn(
      'bg-surface-secondary/60',
      'backdrop-blur-sm',
      'rounded-xl',
      'p-1',
      'mb-8',
      'inline-block',
      'mx-auto'
    );
    
    const filterContainer = document.createElement('div');
    filterContainer.className = cn(
      'flex',
      'gap-1'
    );

    const filters: Array<{ value: 'all' | 'today' | 'week'; label: string }> = [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' }
    ];

    filters.forEach(filter => {
      const button = createButton({
        text: filter.label,
        variant: this.currentFilter === filter.value ? 'primary' : 'ghost',
        size: 'sm',
        onClick: () => {
          const audioManager = this.manager.getAudioManager();
          audioManager?.playUISound(SoundType.SELECT);
          this.currentFilter = filter.value;
          this.createLeaderboardUI();
        }
      });
      filterContainer.appendChild(button);
    });

    filterWrapper.appendChild(filterContainer);
    contentInner.appendChild(filterWrapper);

    // Leaderboard table with enhanced styling
    const tableContainer = document.createElement('div');
    tableContainer.className = cn(
      'bg-surface-secondary/80',
      'backdrop-blur-sm',
      'rounded-xl',
      'shadow-2xl',
      'overflow-hidden',
      'border',
      'border-white/10'
    );
    tableContainer.style.cssText = `
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    `;

    const table = document.createElement('div');
    table.className = cn('divide-y', 'divide-border-primary');

    // Table header
    const tableHeader = document.createElement('div');
    tableHeader.className = cn(
      'grid',
      'grid-cols-12',
      'gap-4',
      'p-4',
      'sm:p-6',
      'text-sm',
      'font-bold',
      'text-text-secondary',
      'uppercase',
      'tracking-wider',
      'bg-gradient-to-r',
      'from-surface-primary/80',
      'to-surface-primary/60',
      'border-b',
      'border-white/10'
    );
    tableHeader.innerHTML = `
      <div class="col-span-1 text-center">Rank</div>
      <div class="col-span-3">Player</div>
      <div class="col-span-3 text-right">Score</div>
      <div class="col-span-2 text-center">Wave</div>
      <div class="col-span-3 text-right">Date</div>
    `;
    table.appendChild(tableHeader);

    // Table rows
    const filteredLeaderboard = this.getFilteredLeaderboard();
    
    if (filteredLeaderboard.length === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = cn('p-12', 'text-center');
      emptyRow.innerHTML = `
        <div class="text-6xl mb-4 opacity-20">${createSvgIcon(IconType.CROWN, { size: 64 })}</div>
        <p class="text-xl text-text-secondary">No entries yet</p>
        <p class="text-lg text-accent-primary mt-2">Be the first champion!</p>
      `;
      table.appendChild(emptyRow);
    } else {
      filteredLeaderboard.forEach((entry) => {
        const row = document.createElement('div');
        row.className = cn(
          'grid',
          'grid-cols-12',
          'gap-4',
          'p-4',
          'sm:p-5',
          'hover:bg-white/5',
          'transition-all',
          'duration-200',
          'items-center',
          'relative',
          'group'
        );
        
        // Add hover glow effect for top 3
        if (entry.rank <= 3) {
          row.style.cssText = `
            transition: all 0.3s ease;
          `;
          row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateX(4px)';
            row.style.boxShadow = 'inset 4px 0 0 0 #ffd700';
          });
          row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateX(0)';
            row.style.boxShadow = 'none';
          });
        }

        // Rank with enhanced medal display for top 3
        const rankCell = document.createElement('div');
        rankCell.className = cn('col-span-1', 'text-center', 'font-bold');
        if (entry.rank <= 3) {
          const medals = ['🥇', '🥈', '🥉'];
          const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          rankCell.innerHTML = `
            <span class="text-3xl inline-block" style="
              filter: drop-shadow(0 0 8px ${medalColors[entry.rank - 1]}80);
              animation: ${entry.rank === 1 ? 'pulse' : 'none'} 3s ease-in-out infinite;
            ">${medals[entry.rank - 1]}</span>
          `;
        } else {
          rankCell.className = cn(rankCell.className, 'text-xl', 'text-text-secondary');
          rankCell.textContent = entry.rank.toString();
        }
        row.appendChild(rankCell);

        // Name with special styling for top 3
        const nameCell = document.createElement('div');
        nameCell.className = cn(
          'col-span-3', 
          'font-bold',
          'text-lg',
          entry.rank <= 3 ? 'text-accent-primary' : 'text-text-primary'
        );
        if (entry.rank === 1) {
          nameCell.style.cssText = `
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          `;
        }
        nameCell.textContent = entry.name;
        row.appendChild(nameCell);

        // Score with enhanced styling
        const scoreCell = document.createElement('div');
        scoreCell.className = cn(
          'col-span-3', 
          'text-right', 
          'font-mono',
          'text-lg',
          'font-bold'
        );
        if (entry.rank <= 3) {
          scoreCell.style.cssText = `
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          `;
        } else {
          scoreCell.className = cn(scoreCell.className, 'text-accent-primary');
        }
        scoreCell.textContent = formatNumber(entry.score);
        row.appendChild(scoreCell);

        // Wave with icon
        const waveCell = document.createElement('div');
        waveCell.className = cn('col-span-2', 'text-center', 'font-semibold');
        waveCell.innerHTML = `
          <span class="inline-flex items-center gap-1">
            <span class="text-accent-secondary">Wave</span>
            <span class="text-text-primary">${entry.wave}</span>
          </span>
        `;
        row.appendChild(waveCell);

        // Date
        const dateCell = document.createElement('div');
        dateCell.className = cn('col-span-3', 'text-right', 'text-text-secondary', 'text-sm');
        dateCell.textContent = this.formatDate(entry.date);
        row.appendChild(dateCell);

        table.appendChild(row);
      });
    }

    tableContainer.appendChild(table);
    contentInner.appendChild(tableContainer);
    
    // Add some bottom padding for better scrolling experience
    const bottomSpacer = document.createElement('div');
    bottomSpacer.className = cn('h-8');
    contentInner.appendChild(bottomSpacer);

    content.appendChild(contentInner);
    mainWrapper.appendChild(content);
    this.container.appendChild(mainWrapper);
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  }

  private handleBack(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Go back to main menu
    this.manager.switchTo('mainMenu', {
      type: TransitionType.SLIDE_RIGHT
    });
  }
}