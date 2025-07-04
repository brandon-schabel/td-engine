import { UIRenderer } from '../../../src/systems/renderers/UIRenderer';

describe('UIRenderer', () => {
  let uiRenderer: UIRenderer;
  let mockContext: any;

  beforeEach(() => {
    // Create mock context
    mockContext = {
      fillRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      fillStyle: '',
      font: '',
      textAlign: 'left'
    };

    // Create renderer
    uiRenderer = new UIRenderer({
      ctx: mockContext,
      viewportWidth: 800,
      viewportHeight: 600
    });
  });

  describe('renderText', () => {
    it('should render text with specified properties', () => {
      uiRenderer.renderText('Test Text', 100, 200, '#FF0000', '20px Arial', 'center');

      expect(mockContext.fillStyle).toBe('#FF0000');
      expect(mockContext.font).toBe('20px Arial');
      expect(mockContext.textAlign).toBe('center');
      expect(mockContext.fillText).toHaveBeenCalledWith('Test Text', 100, 200);
    });

    it('should use default values when not specified', () => {
      uiRenderer.renderText('Test', 50, 50);

      expect(mockContext.fillStyle).toBe('#ffffff');
      expect(mockContext.font).toBe('16px Arial');
      expect(mockContext.textAlign).toBe('left');
    });
  });

  describe('renderGameOver', () => {
    it('should render game over overlay', () => {
      // Track fillStyle values
      const fillStyles: string[] = [];
      Object.defineProperty(mockContext, 'fillStyle', {
        get: () => fillStyles[fillStyles.length - 1] || '',
        set: (value: string) => fillStyles.push(value)
      });

      uiRenderer.renderGameOver();

      // Check overlay was rendered with correct style
      expect(fillStyles).toContain('rgba(0, 0, 0, 0.7)');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);

      // Check text
      expect(mockContext.fillText).toHaveBeenCalledWith('GAME OVER', 400, 300);
    });
  });

  describe('renderVictory', () => {
    it('should render victory overlay', () => {
      uiRenderer.renderVictory();

      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.fillText).toHaveBeenCalledWith('VICTORY!', 400, 300);
    });
  });

  describe('renderPaused', () => {
    it('should render pause overlay with instructions', () => {
      uiRenderer.renderPaused();

      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.fillText).toHaveBeenCalledWith('PAUSED', 400, 300);
      expect(mockContext.fillText).toHaveBeenCalledWith('Press SPACE to resume', 400, 360);
      expect(mockContext.fillText).toHaveBeenCalledWith('Press M for Main Menu', 400, 390);
    });
  });

  describe('updateViewport', () => {
    it('should update viewport dimensions', () => {
      uiRenderer.updateViewport(1024, 768);

      // Render something that uses viewport dimensions
      uiRenderer.renderGameOver();

      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 1024, 768);
      expect(mockContext.fillText).toHaveBeenCalledWith('GAME OVER', 512, 384);
    });
  });

  describe('renderMessage', () => {
    it('should render message with overlay', () => {
      // Track fillStyle values
      const fillStyles: string[] = [];
      Object.defineProperty(mockContext, 'fillStyle', {
        get: () => fillStyles[fillStyles.length - 1] || '',
        set: (value: string) => fillStyles.push(value)
      });

      uiRenderer.renderMessage('Test Message', 'Sub Message', 0.5);

      expect(fillStyles).toContain('rgba(0, 0, 0, 0.5)');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.fillText).toHaveBeenCalledWith('Test Message', 400, 300);
      expect(mockContext.fillText).toHaveBeenCalledWith('Sub Message', 400, 350);
    });
  });

  describe('renderCountdown', () => {
    it('should render countdown timer', () => {
      uiRenderer.renderCountdown(5.7);

      expect(mockContext.fillText).toHaveBeenCalledWith('6', 400, 300);
      expect(mockContext.fillText).toHaveBeenCalledWith('Next wave in...', 400, 240);
    });
  });

  describe('renderNotification', () => {
    it('should render notification with background', () => {
      uiRenderer.renderNotification('Achievement Unlocked!', '#FFD700');

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalledWith('Achievement Unlocked!', 400, expect.any(Number));
    });
  });

  describe('renderDebugInfo', () => {
    it('should render debug information', () => {
      const debugLines = ['FPS: 60', 'Entities: 42', 'Memory: 128MB'];

      uiRenderer.renderDebugInfo(debugLines);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.font).toBe('12px monospace');
      expect(mockContext.fillStyle).toBe('#00FF00');
      debugLines.forEach(line => {
        expect(mockContext.fillText).toHaveBeenCalledWith(line, 10, expect.any(Number));
      });
    });
  });
});