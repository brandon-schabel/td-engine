import { GameState } from './GameState';

type UpdateCallback = (deltaTime: number) => void;
type RenderCallback = (deltaTime: number) => void;
type Unsubscribe = () => void;

export class GameEngine {
  private state: GameState = GameState.MENU;
  private running: boolean = false;
  private paused: boolean = false;
  private animationId: number | null = null;
  private lastTime: number = 0;
  
  private updateCallbacks: Set<UpdateCallback> = new Set();
  private renderCallbacks: Set<RenderCallback> = new Set();

  constructor() {}

  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.state = GameState.PLAYING;
    this.lastTime = 0;
    this.gameLoop(0);
  }

  stop(): void {
    this.running = false;
    this.state = GameState.MENU;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  pause(): void {
    if (!this.running || this.paused) return;
    
    this.paused = true;
    this.state = GameState.PAUSED;
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    
    this.paused = false;
    this.state = GameState.PLAYING;
    this.lastTime = 0; // Reset time to avoid large delta
  }

  gameOver(): void {
    this.state = GameState.GAME_OVER;
    this.running = false;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  victory(): void {
    this.state = GameState.VICTORY;
    this.running = false;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  update(deltaTime: number): void {
    if (this.paused) return;
    
    this.updateCallbacks.forEach(callback => callback(deltaTime));
  }

  render(deltaTime: number): void {
    this.renderCallbacks.forEach(callback => callback(deltaTime));
  }

  onUpdate(callback: UpdateCallback): Unsubscribe {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  onRender(callback: RenderCallback): Unsubscribe {
    this.renderCallbacks.add(callback);
    return () => this.renderCallbacks.delete(callback);
  }

  getState(): GameState {
    return this.state;
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.running) return;

    const deltaTime = this.lastTime === 0 ? 0 : currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render(deltaTime);

    this.animationId = requestAnimationFrame(this.gameLoop);
  };
}