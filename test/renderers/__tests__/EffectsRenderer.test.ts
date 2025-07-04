import { EffectsRenderer } from '../../../src/systems/renderers/EffectsRenderer';
import { Camera } from '../../../src/systems/Camera';
import { DestructionEffect } from '@/effects/DestructionEffect';
import { Tower, TowerType } from '@/entities/Tower';
import type { Vector2 } from '@/utils/Vector2';

describe('EffectsRenderer', () => {
  let effectsRenderer: EffectsRenderer;
  let mockContext: any;
  let mockCamera: Camera;

  beforeEach(() => {
    // Create mock context
    mockContext = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      setLineDash: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1
    };

    // Create mock camera
    mockCamera = new Camera(800, 600, 1600, 1200);
    mockCamera.worldToScreen = jest.fn((pos: Vector2) => ({ x: pos.x, y: pos.y }));
    mockCamera.getZoom = jest.fn(() => 1);
    mockCamera.isVisible = jest.fn(() => true);

    // Create renderer
    effectsRenderer = new EffectsRenderer({
      ctx: mockContext,
      camera: mockCamera,
      renderSettings: {
        enableShadows: true,
        enableAntialiasing: true,
        enableGlowEffects: true,
        enableParticles: true,
        lodEnabled: true,
        lodBias: 1.0
      }
    });
  });

  describe('renderDestructionEffect', () => {
    it('should render destruction effect when particles are enabled', () => {
      const effect = new DestructionEffect({ x: 100, y: 100 });
      effect.render = jest.fn();

      effectsRenderer.renderDestructionEffect(effect);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalledTimes(2);
      expect(mockContext.scale).toHaveBeenCalled();
      expect(effect.render).toHaveBeenCalledWith(mockContext);
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should not render when effect is complete', () => {
      const effect = new DestructionEffect({ x: 100, y: 100 });
      effect.isComplete = true;

      effectsRenderer.renderDestructionEffect(effect);

      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should not render when particles are disabled', () => {
      effectsRenderer = new EffectsRenderer({
        ctx: mockContext,
        camera: mockCamera,
        renderSettings: {
          enableShadows: true,
          enableAntialiasing: true,
          enableGlowEffects: true,
          enableParticles: false,
          lodEnabled: true,
          lodBias: 1.0
        }
      });

      const effect = new DestructionEffect({ x: 100, y: 100 });
      effectsRenderer.renderDestructionEffect(effect);

      expect(mockContext.save).not.toHaveBeenCalled();
    });
  });

  describe('renderAimerLine', () => {
    it('should render aimer line with dashed pattern', () => {
      const aimerLine = {
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 }
      };

      effectsRenderer.renderAimerLine(aimerLine);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalledWith(100, 100);
      expect(mockContext.lineTo).toHaveBeenCalledWith(200, 200);
      expect(mockContext.setLineDash).toHaveBeenCalledWith([5, 5]);
      expect(mockContext.stroke).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(200, 200, 3, 0, Math.PI * 2);
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should handle invalid aimer line gracefully', () => {
      effectsRenderer.renderAimerLine(null as any);
      expect(mockContext.beginPath).not.toHaveBeenCalled();

      effectsRenderer.renderAimerLine({ start: null, end: null } as any);
      expect(mockContext.beginPath).not.toHaveBeenCalled();
    });
  });

  describe('renderTowerRange', () => {
    it('should render tower range indicator', () => {
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });

      effectsRenderer.renderTowerRange(tower);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(100, 100, tower.range, 0, Math.PI * 2);
      expect(mockContext.setLineDash).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should not render when tower is not visible', () => {
      mockCamera.isVisible = jest.fn(() => false);
      const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });

      effectsRenderer.renderTowerRange(tower);

      expect(mockContext.beginPath).not.toHaveBeenCalled();
    });
  });

  describe('renderTowerGhost', () => {
    it('should render valid placement ghost in green', () => {
      // Track style values
      const fillStyles: string[] = [];
      const strokeStyles: string[] = [];
      Object.defineProperty(mockContext, 'fillStyle', {
        get: () => fillStyles[fillStyles.length - 1] || '',
        set: (value: string) => fillStyles.push(value)
      });
      Object.defineProperty(mockContext, 'strokeStyle', {
        get: () => strokeStyles[strokeStyles.length - 1] || '',
        set: (value: string) => strokeStyles.push(value)
      });

      effectsRenderer.renderTowerGhost(TowerType.BASIC, { x: 100, y: 100 }, true);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.globalAlpha).toBeLessThan(1);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(fillStyles).toContain('#81C784'); // Light green for basic tower
      expect(strokeStyles).toContain('#4CAF50'); // Green for valid placement
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render invalid placement ghost in red', () => {
      // Track style values
      const fillStyles: string[] = [];
      const strokeStyles: string[] = [];
      Object.defineProperty(mockContext, 'fillStyle', {
        get: () => fillStyles[fillStyles.length - 1] || '',
        set: (value: string) => fillStyles.push(value)
      });
      Object.defineProperty(mockContext, 'strokeStyle', {
        get: () => strokeStyles[strokeStyles.length - 1] || '',
        set: (value: string) => strokeStyles.push(value)
      });

      effectsRenderer.renderTowerGhost(TowerType.SNIPER, { x: 100, y: 100 }, false);

      expect(fillStyles).toContain('#E57373'); // Light red
      expect(strokeStyles).toContain('#F44336'); // Red for invalid placement
    });
  });

  describe('renderHealthBar', () => {
    it('should render health bar with appropriate color', () => {
      // Full health - should use high color
      effectsRenderer.renderHealthBar({ x: 100, y: 100 }, 100, 100, 20);
      expect(mockContext.fillStyle).toContain('#4CAF50');

      // Medium health - should use medium color
      effectsRenderer.renderHealthBar({ x: 100, y: 100 }, 50, 100, 20);
      expect(mockContext.fillStyle).toContain('#FF9800');

      // Low health - should use low color
      effectsRenderer.renderHealthBar({ x: 100, y: 100 }, 20, 100, 20);
      expect(mockContext.fillStyle).toContain('#F44336');
    });
  });
});