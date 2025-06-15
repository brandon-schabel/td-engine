import { TextureManager, type Texture, type SpriteFrame, type AnimatedSprite, type TextureAtlas } from '@/systems/TextureManager';
import { vi, expect } from 'vitest';

/**
 * Builder for creating texture test scenarios
 */
export class TextureBuilder {
  private id: string = 'test_texture';
  private width: number = 64;
  private height: number = 64;
  private loaded: boolean = true;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withDimensions(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }

  withSize(size: number): this {
    this.width = size;
    this.height = size;
    return this;
  }

  notLoaded(): this {
    this.loaded = false;
    return this;
  }

  build(): Texture {
    const image = new Image();
    image.width = this.width;
    image.height = this.height;

    return {
      id: this.id,
      image,
      width: this.width,
      height: this.height,
      loaded: this.loaded
    };
  }
}

/**
 * Builder for creating texture atlas test scenarios
 */
export class AtlasBuilder {
  private id: string = 'test_atlas';
  private texture: Texture;
  private sprites: Map<string, SpriteFrame> = new Map();

  constructor() {
    this.texture = new TextureBuilder().withId('atlas_texture').build();
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTexture(texture: Texture): this {
    this.texture = texture;
    return this;
  }

  withSprite(name: string, x: number, y: number, width: number, height: number): this {
    this.sprites.set(name, { x, y, width, height });
    return this;
  }

  withStandardSprites(): this {
    this.withSprite('sprite1', 0, 0, 32, 32);
    this.withSprite('sprite2', 32, 0, 32, 32);
    this.withSprite('sprite3', 0, 32, 32, 32);
    this.withSprite('sprite4', 32, 32, 32, 32);
    return this;
  }

  build(): TextureAtlas {
    return {
      id: this.id,
      texture: this.texture,
      sprites: this.sprites
    };
  }
}

/**
 * Builder for creating animated sprite test scenarios
 */
export class AnimatedSpriteBuilder {
  private id: string = 'test_animation';
  private texture: Texture;
  private frames: SpriteFrame[] = [];
  private frameRate: number = 10;
  private loop: boolean = true;

  constructor() {
    this.texture = new TextureBuilder().withId('anim_texture').build();
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTexture(texture: Texture): this {
    this.texture = texture;
    return this;
  }

  withFrames(frames: SpriteFrame[]): this {
    this.frames = frames;
    return this;
  }

  withStandardFrames(): this {
    this.frames = [
      { x: 0, y: 0, width: 32, height: 32 },
      { x: 32, y: 0, width: 32, height: 32 },
      { x: 64, y: 0, width: 32, height: 32 }
    ];
    return this;
  }

  withFrameRate(rate: number): this {
    this.frameRate = rate;
    return this;
  }

  withLoop(loop: boolean): this {
    this.loop = loop;
    return this;
  }

  build(): AnimatedSprite {
    return {
      id: this.id,
      texture: this.texture,
      frames: this.frames,
      frameRate: this.frameRate,
      loop: this.loop
    };
  }
}

/**
 * Helper for creating configured TextureManager instances for testing
 */
export class TextureManagerBuilder {
  private preloadedTextures: Texture[] = [];
  private preloadedAtlases: TextureAtlas[] = [];
  private preloadedAnimations: AnimatedSprite[] = [];

  withTexture(texture: Texture): this {
    this.preloadedTextures.push(texture);
    return this;
  }

  withAtlas(atlas: TextureAtlas): this {
    this.preloadedAtlases.push(atlas);
    return this;
  }

  withAnimation(animation: AnimatedSprite): this {
    this.preloadedAnimations.push(animation);
    return this;
  }

  withBasicTextures(): this {
    const textures = [
      new TextureBuilder().withId('basic_texture').build(),
      new TextureBuilder().withId('test_texture').build(),
      new TextureBuilder().withId('sample_texture').build()
    ];
    textures.forEach(texture => this.withTexture(texture));
    return this;
  }

  build(): TextureManager {
    const manager = new TextureManager();
    
    // Add preloaded textures
    this.preloadedTextures.forEach(texture => {
      (manager as any).textures.set(texture.id, texture);
    });

    // Add preloaded atlases
    this.preloadedAtlases.forEach(atlas => {
      (manager as any).atlases.set(atlas.id, atlas);
    });

    // Add preloaded animations
    this.preloadedAnimations.forEach(animation => {
      (manager as any).animatedSprites.set(animation.id, animation);
    });

    return manager;
  }
}

/**
 * Utility functions for texture testing
 */
export function createTestTextureManager(options: {
  withBasicTextures?: boolean;
  withAtlases?: boolean;
  withAnimations?: boolean;
} = {}): TextureManager {
  const builder = new TextureManagerBuilder();

  if (options.withBasicTextures) {
    builder.withBasicTextures();
  }

  if (options.withAtlases) {
    const atlas = new AtlasBuilder()
      .withId('test_atlas')
      .withStandardSprites()
      .build();
    builder.withAtlas(atlas);
  }

  if (options.withAnimations) {
    const animation = new AnimatedSpriteBuilder()
      .withId('test_animation')
      .withStandardFrames()
      .build();
    builder.withAnimation(animation);
  }

  return builder.build();
}

/**
 * Create standard atlas data for testing
 */
export function createStandardAtlasData(): { [key: string]: SpriteFrame } {
  return {
    'sprite1': { x: 0, y: 0, width: 32, height: 32 },
    'sprite2': { x: 32, y: 0, width: 32, height: 32 },
    'sprite3': { x: 0, y: 32, width: 32, height: 32 },
    'sprite4': { x: 32, y: 32, width: 32, height: 32 }
  };
}

/**
 * Create standard animation frames for testing
 */
export function createStandardAnimationFrames(): SpriteFrame[] {
  return [
    { x: 0, y: 0, width: 32, height: 32 },
    { x: 32, y: 0, width: 32, height: 32 },
    { x: 64, y: 0, width: 32, height: 32 },
    { x: 96, y: 0, width: 32, height: 32 }
  ];
}

/**
 * Create mock image that simulates loading failure
 */
export function createFailingImage(): void {
  const originalImage = global.Image;
  
  global.Image = class extends originalImage {
    constructor() {
      super();
      // Use Promise.resolve().then to ensure proper async behavior
      Promise.resolve().then(() => {
        if (this.onerror) {
          this.onerror();
        }
      });
    }
  } as any;
}

/**
 * Restore normal image loading behavior
 */
export function restoreImageLoading(): void {
  // Reset to the mock that works properly
  const MockHTMLImageElement = class {
    src = '';
    alt = '';
    width = 64;
    height = 64;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    complete = true;
    
    constructor() {
      let _src = '';
      Object.defineProperty(this, 'src', {
        get: () => _src,
        set: (value: string) => {
          _src = value;
          // Use Promise.resolve().then to ensure proper async behavior
          Promise.resolve().then(() => {
            if (this.onload) {
              this.onload();
            }
          });
        }
      });
    }
    
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
  };

  global.Image = MockHTMLImageElement as any;
}

/**
 * Simulate texture loading with controlled timing
 */
export async function simulateTextureLoading(manager: TextureManager, textures: string[]): Promise<void> {
  const loadPromises = textures.map(id => 
    manager.loadTexture(id, `${id}.png`)
  );
  await Promise.all(loadPromises);
}

/**
 * Get texture loading stats for testing
 */
export function getTextureStats(manager: TextureManager): {
  totalTextures: number;
  totalAtlases: number;
  totalAnimations: number;
  memoryUsage: { textures: number; totalSize: number };
  loadingProgress: { loaded: number; total: number; percentage: number };
} {
  return {
    totalTextures: (manager as any).textures.size,
    totalAtlases: (manager as any).atlases.size,
    totalAnimations: (manager as any).animatedSprites.size,
    memoryUsage: manager.getMemoryUsage(),
    loadingProgress: manager.getLoadingProgress()
  };
}

/**
 * Texture assertion helpers
 */
export function expectTextureLoaded(
  texture: Texture | null,
  expectedId: string,
  expectedWidth?: number,
  expectedHeight?: number
): void {
  expect(texture).toBeDefined();
  expect(texture).not.toBeNull();
  expect(texture!.id).toBe(expectedId);
  expect(texture!.loaded).toBe(true);
  // In test environment, Image might not be defined
  if (typeof Image !== 'undefined') {
    expect(texture!.image).toBeInstanceOf(Image);
  } else {
    expect(texture!.image).toBeDefined();
  }
  
  if (expectedWidth !== undefined) {
    expect(texture!.width).toBe(expectedWidth);
  }
  
  if (expectedHeight !== undefined) {
    expect(texture!.height).toBe(expectedHeight);
  }
}

export function expectTextureNotLoaded(texture: Texture | null): void {
  if (texture) {
    expect(texture.loaded).toBe(false);
  }
}

export function expectAtlasValid(
  atlas: TextureAtlas,
  expectedId: string,
  expectedSpriteCount: number
): void {
  expect(atlas).toBeDefined();
  expect(atlas.id).toBe(expectedId);
  expect(atlas.sprites.size).toBe(expectedSpriteCount);
}

export function expectSpriteFrame(
  sprite: SpriteFrame | null,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  expect(sprite).not.toBeNull();
  expect(sprite!.x).toBe(x);
  expect(sprite!.y).toBe(y);
  expect(sprite!.width).toBe(width);
  expect(sprite!.height).toBe(height);
}

export function expectAnimatedSpriteValid(
  animSprite: AnimatedSprite,
  expectedId: string,
  expectedFrameCount: number,
  expectedFrameRate: number
): void {
  expect(animSprite).toBeDefined();
  expect(animSprite.id).toBe(expectedId);
  expect(animSprite.frames.length).toBe(expectedFrameCount);
  expect(animSprite.frameRate).toBe(expectedFrameRate);
}

export function expectBiomeTextureSetValid(
  textureSet: any,
  expectedBiome: string,
  expectedTextureCount: number
): void {
  expect(textureSet).toBeDefined();
  expect(textureSet.biome).toBe(expectedBiome);
  expect(Object.keys(textureSet.textures).length).toBe(expectedTextureCount);
}

export function expectTextureManagerState(
  manager: TextureManager,
  expected: {
    textureCount?: number;
    atlasCount?: number;
    animationCount?: number;
  }
): void {
  const stats = getTextureStats(manager);
  
  if (expected.textureCount !== undefined) {
    expect(stats.totalTextures).toBe(expected.textureCount);
  }
  
  if (expected.atlasCount !== undefined) {
    expect(stats.totalAtlases).toBe(expected.atlasCount);
  }
  
  if (expected.animationCount !== undefined) {
    expect(stats.totalAnimations).toBe(expected.animationCount);
  }
}

export function expectLoadingProgress(
  progress: { pending: number; completed: number; failed: number },
  expected: { pending: number; completed: number; failed: number }
): void {
  expect(progress.pending).toBe(expected.pending);
  expect(progress.completed).toBe(expected.completed);
  expect(progress.failed).toBe(expected.failed);
}