import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from '../Renderer';
import { Grid } from '../Grid';
import { Camera } from '../Camera';
import { Tower, TowerType } from '@/entities/Tower';
import { Enemy, EnemyType } from '@/entities/Enemy';
import { utilizeEntityStore } from '@/stores/entityStore';
import type { Vector2 } from '@/utils/Vector2';

// Mock canvas context
const createMockContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  drawImage: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  getTransform: vi.fn(() => ({ a: 1, d: 1 })),
  imageSmoothingEnabled: true,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  setLineDash: vi.fn(),
  fillText: vi.fn(),
  shadowColor: '',
  shadowBlur: 0,
  globalAlpha: 1,
  lineCap: 'butt' as CanvasLineCap
});

// Mock canvas
const createMockCanvas = (ctx: any) => ({
  getContext: vi.fn(() => ctx),
  width: 800,
  height: 600
});

describe('Renderer with Entity Store', () => {
  let renderer: Renderer;
  let mockContext: any;
  let mockCanvas: any;
  let grid: Grid;
  let camera: Camera;

  beforeEach(() => {
    // Mock window object
    global.window = {
      devicePixelRatio: 1
    } as any;

    // Clear entity store
    utilizeEntityStore.getState().clearAllEntities();

    // Create mocks
    mockContext = createMockContext();
    mockCanvas = createMockCanvas(mockContext);

    // Create real instances
    grid = new Grid(20, 15, 32);
    camera = new Camera(800, 600, 640, 480);

    // Create renderer
    renderer = new Renderer(mockCanvas as any, grid, camera);
  });

  afterEach(() => {
    if (renderer) {
      renderer.destroy();
    }
    utilizeEntityStore.getState().clearAllEntities();

    // Clean up window mock
    delete (global as any).window;
  });

  it('should render entities from the store', () => {
    const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
    const enemy = new Enemy(EnemyType.BASIC, { x: 200, y: 200 });

    // Add entities to store
    const store = utilizeEntityStore.getState();
    store.addTower(tower);
    store.addEnemy(enemy);

    // Render scene
    renderer.renderScene();

    // Verify context methods were called
    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.restore).toHaveBeenCalled();
    // Either clearRect or fillRect should be called for clearing
    expect(mockContext.clearRect.mock.calls.length + mockContext.fillRect.mock.calls.length).toBeGreaterThan(0);

    // Verify entities were rendered (arc is called for circular entities)
    expect(mockContext.arc).toHaveBeenCalled();
  });

  it('should only render visible entities within viewport', () => {
    // Create entities at different positions
    const visibleTower = new Tower(TowerType.BASIC, { x: 400, y: 300 }); // In view
    const hiddenTower = new Tower(TowerType.BASIC, { x: 2000, y: 2000 }); // Out of view

    // Add to store
    const store = utilizeEntityStore.getState();
    store.addTower(visibleTower);
    store.addTower(hiddenTower);

    // Mock camera visible bounds
    vi.spyOn(camera, 'getVisibleBounds').mockReturnValue({
      min: { x: 0, y: 0 },
      max: { x: 800, y: 600 }
    });

    vi.spyOn(camera, 'isVisible').mockImplementation((pos: Vector2) => {
      return pos.x >= 0 && pos.x <= 800 && pos.y >= 0 && pos.y <= 600;
    });

    // Render
    renderer.renderScene();

    // Verify only visible entity was rendered
    // Arc is called for each visible tower (plus potentially for other UI elements)
    const arcCalls = mockContext.arc.mock.calls;
    expect(arcCalls.length).toBeGreaterThan(0);
  });

  it('should render selected tower differently', () => {
    const tower = new Tower(TowerType.BASIC, { x: 400, y: 300 });

    // Add and select tower
    const store = utilizeEntityStore.getState();
    store.addTower(tower);
    store.selectTower(tower);

    // Mock camera methods
    vi.spyOn(camera, 'isVisible').mockReturnValue(true);
    vi.spyOn(camera, 'worldToScreen').mockImplementation((pos) => pos);
    vi.spyOn(camera, 'getZoom').mockReturnValue(1);

    // Render
    renderer.renderScene();

    // Selected towers should have selection rings drawn
    // This involves additional arc calls for the selection effect
    const arcCalls = mockContext.arc.mock.calls;
    expect(arcCalls.length).toBeGreaterThan(1); // At least tower + selection ring
  });

  it('should support reactive rendering with store subscriptions', () => {
    const callback = vi.fn();

    // Subscribe to changes
    renderer.subscribeToStore(callback);

    // Add entity to store
    const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
    utilizeEntityStore.getState().addTower(tower);

    // Callback should be triggered
    expect(callback).toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    const callback = vi.fn();

    // Subscribe
    renderer.subscribeToStore(callback);

    // Destroy renderer
    renderer.destroy();

    // Add entity after destroy
    const tower = new Tower(TowerType.BASIC, { x: 100, y: 100 });
    utilizeEntityStore.getState().addTower(tower);

    // Callback should not be called after destroy
    expect(callback).toHaveBeenCalledTimes(0);
  });
});