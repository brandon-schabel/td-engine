import React, { useState, useEffect } from 'react';
import { Scene, SceneHeader } from './Scene';
import { useScene } from './SceneContext';
import { Button } from '../components/shared/Button';
import { Icon } from '../components/shared/Icon';
import { IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { formatNumber } from '@/utils/formatters';
import { ScoreManager, type ScoreboardEntry } from '@/systems/ScoreManager';
import { cn } from '@/lib/utils';
import type { AudioManager } from '@/audio/AudioManager';

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

interface LeaderboardProps {
  audioManager?: AudioManager;
}

type FilterType = 'all' | 'today' | 'week';

const medals = ['🥇', '🥈', '🥉'];
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export const Leaderboard: React.FC<LeaderboardProps> = ({ audioManager }) => {
  const { goBack } = useScene();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    const scores = ScoreManager.getScores();
    
    const entries = scores.map((entry: ScoreboardEntry, index) => ({
      rank: entry.rank || index + 1,
      name: generatePlayerName(entry),
      score: entry.score,
      wave: entry.wave,
      date: new Date(entry.date),
      playerLevel: entry.playerLevel,
      enemiesKilled: entry.enemiesKilled,
      gameTime: entry.gameTime
    }));

    // If no scores exist, add example entries
    if (entries.length === 0) {
      entries.push(
        { rank: 1, name: 'AAA', score: 10000, wave: 10, date: new Date(), playerLevel: 5, enemiesKilled: 100, gameTime: 300000 },
        { rank: 2, name: 'BBB', score: 7500, wave: 8, date: new Date(Date.now() - 86400000), playerLevel: 4, enemiesKilled: 80, gameTime: 240000 },
        { rank: 3, name: 'CCC', score: 5000, wave: 6, date: new Date(Date.now() - 172800000), playerLevel: 3, enemiesKilled: 60, gameTime: 180000 }
      );
    }

    setLeaderboard(entries);
  };

  const generatePlayerName = (entry: ScoreboardEntry): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const seed = entry.score + entry.wave + (entry.date % 1000);
    
    const first = chars[seed % 26];
    const second = chars[(seed * 7) % 26];
    const third = chars[(seed * 13) % 26];
    
    return first + second + third;
  };

  const getFilteredLeaderboard = (): LeaderboardEntry[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (currentFilter) {
      case 'today':
        return leaderboard.filter(entry => entry.date >= today);
      case 'week':
        return leaderboard.filter(entry => entry.date >= weekAgo);
      default:
        return leaderboard;
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleBack = () => {
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    goBack();
  };

  const handleFilterChange = (filter: FilterType) => {
    audioManager?.playUISound(SoundType.SELECT);
    setCurrentFilter(filter);
  };

  const filteredLeaderboard = getFilteredLeaderboard();

  return (
    <Scene className="relative">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite'
        }}
      />

      {/* Particle overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'particleFloat 20s ease-in-out infinite'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <SceneHeader
          title=""
          leftAction={
            <Button
              variant="ghost"
              size="sm"
              icon={IconType.ARROW_LEFT}
              onClick={handleBack}
            >
              Back
            </Button>
          }
        />

        {/* Custom title with crown */}
        <div className="flex items-center justify-center gap-3 pt-4 pb-8">
          <div 
            className="drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] animate-pulse"
          >
            <Icon type={IconType.CROWN} size={36} />
          </div>
          <h1 
            className="text-3xl sm:text-4xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
            }}
          >
            Leaderboard
          </h1>
        </div>

        {/* Content container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto">
            {/* Filter buttons */}
            <div className="bg-ui-bg-secondary/60 backdrop-blur-sm rounded-xl p-1 mb-8 inline-block mx-auto">
              <div className="flex gap-1">
                {[
                  { value: 'all' as FilterType, label: 'All Time' },
                  { value: 'today' as FilterType, label: 'Today' },
                  { value: 'week' as FilterType, label: 'This Week' }
                ].map(filter => (
                  <Button
                    key={filter.value}
                    variant={currentFilter === filter.value ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleFilterChange(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Leaderboard table */}
            <div 
              className="bg-ui-bg-secondary/80 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-white/10"
              style={{
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="divide-y divide-ui-border-DEFAULT">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 p-4 sm:p-6 text-sm font-bold text-ui-text-secondary uppercase tracking-wider bg-gradient-to-r from-ui-bg-primary/80 to-ui-bg-primary/60 border-b border-white/10">
                  <div className="col-span-1 text-center">Rank</div>
                  <div className="col-span-3">Player</div>
                  <div className="col-span-3 text-right">Score</div>
                  <div className="col-span-2 text-center">Wave</div>
                  <div className="col-span-3 text-right">Date</div>
                </div>

                {/* Table rows */}
                {filteredLeaderboard.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4 opacity-20">
                      <Icon type={IconType.CROWN} size={64} />
                    </div>
                    <p className="text-xl text-ui-text-secondary">No entries yet</p>
                    <p className="text-lg text-button-primary mt-2">Be the first champion!</p>
                  </div>
                ) : (
                  filteredLeaderboard.map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.name}-${entry.score}`}
                      className={cn(
                        'grid grid-cols-12 gap-4 p-4 sm:p-5',
                        'hover:bg-white/5 transition-all duration-200',
                        'items-center relative group',
                        entry.rank <= 3 && 'hover:translate-x-1 hover:shadow-[inset_4px_0_0_0_#ffd700]'
                      )}
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center font-bold">
                        {entry.rank <= 3 ? (
                          <span 
                            className="text-3xl inline-block"
                            style={{
                              filter: `drop-shadow(0 0 8px ${medalColors[entry.rank - 1]}80)`,
                              animation: entry.rank === 1 ? 'pulse 3s ease-in-out infinite' : 'none'
                            }}
                          >
                            {medals[entry.rank - 1]}
                          </span>
                        ) : (
                          <span className="text-xl text-ui-text-secondary">
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div 
                        className={cn(
                          'col-span-3 font-bold text-lg',
                          entry.rank <= 3 ? 'text-button-primary' : 'text-ui-text-primary'
                        )}
                        style={entry.rank === 1 ? {
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        } : undefined}
                      >
                        {entry.name}
                      </div>

                      {/* Score */}
                      <div 
                        className={cn(
                          'col-span-3 text-right font-mono text-lg font-bold',
                          entry.rank > 3 && 'text-button-primary'
                        )}
                        style={entry.rank <= 3 ? {
                          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                        } : undefined}
                      >
                        {formatNumber(entry.score)}
                      </div>

                      {/* Wave */}
                      <div className="col-span-2 text-center font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-ui-text-secondary">Wave</span>
                          <span className="text-ui-text-primary">{entry.wave}</span>
                        </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-3 text-right text-ui-text-secondary text-sm">
                        {formatDate(entry.date)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes particleFloat {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50px, -50px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
      `}</style>
    </Scene>
  );
};