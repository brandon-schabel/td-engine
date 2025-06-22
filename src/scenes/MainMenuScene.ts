/**
 * Main menu scene - full screen menu for the game
 */

import { Scene } from './Scene';
import { createButton } from '@/ui/elements';
import { cn } from '@/ui/styles/UtilityStyles';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { SoundType } from '@/audio/AudioManager';
import { TransitionType } from './SceneTransition';

export class MainMenuScene extends Scene {
  private menuContainer: HTMLDivElement | null = null;

  protected async onEnter(): Promise<void> {
    this.createMenu();
  }

  protected async onExit(): Promise<void> {
    // Clean up if needed
  }

  protected onUpdate(_deltaTime: number): void {
    // Main menu doesn't need updates
  }

  protected onInput(event: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (event instanceof KeyboardEvent) {
      switch (event.key) {
        case 'Enter':
        case ' ':
          // Start game on Enter or Space
          this.handleStartGame();
          break;
        case 's':
        case 'S':
          // Settings on S
          this.handleSettings();
          break;
        case 'l':
        case 'L':
          // Leaderboard on L
          this.handleLeaderboard();
          break;
      }
    }
  }

  protected onDestroy(): void {
    // Clean up
  }

  private createMenu(): void {
    // Clear container
    this.container.innerHTML = '';

    // Add animated gradient background
    this.container.className = cn(
      'absolute',
      'inset-0',
      'w-full',
      'h-full',
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'overflow-hidden'
    );

    // Create animated background
    const bgGradient = document.createElement('div');
    bgGradient.className = cn('absolute', 'inset-0', 'w-full', 'h-full');
    bgGradient.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    `;
    this.container.appendChild(bgGradient);

    // Add subtle particle effect overlay
    const particleOverlay = document.createElement('div');
    particleOverlay.className = cn('absolute', 'inset-0', 'w-full', 'h-full');
    particleOverlay.style.cssText = `
      background-image: radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: particleFloat 20s linear infinite;
    `;
    this.container.appendChild(particleOverlay);

    // Create menu container
    this.menuContainer = document.createElement('div');
    this.menuContainer.className = cn(
      'flex',
      'flex-col',
      'items-center',
      'gap-8',
      'p-8',
      'max-w-md',
      'w-full'
    );

    // Create logo section
    const logoSection = document.createElement('div');
    logoSection.className = cn('text-center', 'mb-8');

    // Logo icon with enhanced animation and glow
    const logoIcon = document.createElement('div');
    logoIcon.className = cn('mb-4', 'relative');
    logoIcon.style.cssText = `
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.6));
    `;
    logoIcon.innerHTML = createSvgIcon(IconType.TOWER, { size: 96 });
    
    // Add pulsing glow behind icon
    const glowBg = document.createElement('div');
    glowBg.className = cn('absolute', 'inset-0', 'rounded-full');
    glowBg.style.cssText = `
      background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
      animation: pulse 2s ease-in-out infinite;
      transform: scale(1.5);
    `;
    logoIcon.insertBefore(glowBg, logoIcon.firstChild);
    logoSection.appendChild(logoIcon);

    // Game title with enhanced styling
    const title = document.createElement('h1');
    title.className = cn('text-center', 'relative');
    title.innerHTML = `
      <div class="text-5xl sm:text-6xl font-bold mb-2" style="
        background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
        animation: shimmer 3s ease-in-out infinite;
      ">Tower Defense</div>
      <div class="text-xl sm:text-2xl text-text-secondary mt-2" style="
        letter-spacing: 0.1em;
        animation: fadeInUp 1s ease-out;
      ">Defend your base!</div>
    `;
    logoSection.appendChild(title);

    this.menuContainer.appendChild(logoSection);

    // Create button container with animation
    const buttonContainer = document.createElement('div');
    buttonContainer.className = cn(
      'flex',
      'flex-col',
      'gap-4',
      'w-full',
      'max-w-xs'
    );
    buttonContainer.style.cssText = `
      animation: fadeInUp 0.8s ease-out 0.3s both;
    `;

    // Start Game button with enhanced styling
    const startButton = createButton({
      text: 'Start Game',
      icon: IconType.PLAY,
      variant: 'primary',
      size: 'lg',
      fullWidth: true,
      onClick: () => this.handleStartGame()
    });
    startButton.style.cssText += `
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
      transition: all 0.3s ease;
    `;
    startButton.addEventListener('mouseenter', () => {
      startButton.style.transform = 'translateY(-2px)';
      startButton.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
    });
    startButton.addEventListener('mouseleave', () => {
      startButton.style.transform = 'translateY(0)';
      startButton.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
    });
    buttonContainer.appendChild(startButton);

    // Settings button with hover effects
    const settingsButton = createButton({
      text: 'Settings',
      icon: IconType.SETTINGS,
      variant: 'secondary',
      size: 'lg',
      fullWidth: true,
      onClick: () => this.handleSettings()
    });
    settingsButton.style.cssText += `
      border: 2px solid rgba(59, 130, 246, 0.3);
      transition: all 0.3s ease;
    `;
    settingsButton.addEventListener('mouseenter', () => {
      settingsButton.style.borderColor = 'rgba(59, 130, 246, 0.6)';
      settingsButton.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    });
    settingsButton.addEventListener('mouseleave', () => {
      settingsButton.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      settingsButton.style.backgroundColor = '';
    });
    buttonContainer.appendChild(settingsButton);

    // Leaderboard button with hover effects
    const leaderboardButton = createButton({
      text: 'Leaderboard',
      icon: IconType.CROWN,
      variant: 'secondary',
      size: 'lg',
      fullWidth: true,
      onClick: () => this.handleLeaderboard()
    });
    leaderboardButton.style.cssText += `
      border: 2px solid rgba(59, 130, 246, 0.3);
      transition: all 0.3s ease;
    `;
    leaderboardButton.addEventListener('mouseenter', () => {
      leaderboardButton.style.borderColor = 'rgba(59, 130, 246, 0.6)';
      leaderboardButton.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    });
    leaderboardButton.addEventListener('mouseleave', () => {
      leaderboardButton.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      leaderboardButton.style.backgroundColor = '';
    });
    buttonContainer.appendChild(leaderboardButton);

    this.menuContainer.appendChild(buttonContainer);

    // Add version info at bottom
    const versionInfo = document.createElement('div');
    versionInfo.className = cn(
      'absolute',
      'bottom-4',
      'left-4',
      'text-xs',
      'text-text-tertiary',
      'opacity-50'
    );
    versionInfo.textContent = 'v1.0.0';

    this.container.appendChild(this.menuContainer);
    this.container.appendChild(versionInfo);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes particleFloat {
        0% { transform: translate(0, 0); }
        100% { transform: translate(-50px, -50px); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.6; transform: scale(1.5); }
        50% { opacity: 0.3; transform: scale(1.8); }
      }
      @keyframes shimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  private handleStartGame(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Switch to pre-game config scene
    this.manager.switchTo('preGameConfig', { 
      type: TransitionType.SLIDE_LEFT 
    });
  }

  private handleSettings(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Switch to settings scene
    this.manager.switchTo('settings', { 
      type: TransitionType.SLIDE_UP 
    });
  }

  private handleLeaderboard(): void {
    const audioManager = this.manager.getAudioManager();
    audioManager?.playUISound(SoundType.BUTTON_CLICK);
    
    // Switch to leaderboard scene
    this.manager.switchTo('leaderboard', { 
      type: TransitionType.SLIDE_LEFT 
    });
  }
}