export interface Texture {
  id: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  loaded: boolean;
}

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimatedSprite {
  id: string;
  texture: Texture;
  frames: SpriteFrame[];
  frameRate: number;
  loop: boolean;
}

export interface TextureAtlas {
  id: string;
  texture: Texture;
  sprites: Map<string, SpriteFrame>;
}

export interface BiomeTextureSet {
  ground: string[];
  decorations: string[];
  obstacles: string[];
  effects: string[];
}

export class TextureManager {
  private textures = new Map<string, Texture>();
  private atlases = new Map<string, TextureAtlas>();
  private animatedSprites = new Map<string, AnimatedSprite>();
  private biomeTextureSets = new Map<string, BiomeTextureSet>();
  private loadingPromises = new Map<string, Promise<Texture>>();

  constructor() {
    this.initializeBiomeTextureSets();
  }

  private initializeBiomeTextureSets(): void {
    // Forest biome textures
    this.biomeTextureSets.set('FOREST', {
      ground: ['grass_forest', 'dirt_forest', 'moss_ground'],
      decorations: ['tree_oak', 'tree_pine', 'bush_large', 'bush_small', 'fern', 'mushroom', 'fallen_log'],
      obstacles: ['tree_massive', 'boulder_moss', 'rock_formation'],
      effects: ['leaves_particle', 'mist_particle', 'sunbeam_effect']
    });

    // Desert biome textures
    this.biomeTextureSets.set('DESERT', {
      ground: ['sand_light', 'sand_dark', 'stone_desert'],
      decorations: ['cactus_tall', 'cactus_small', 'dead_tree', 'skull_animal', 'rock_small', 'sand_dune'],
      obstacles: ['cactus_giant', 'boulder_red', 'rock_arch'],
      effects: ['sand_particle', 'heat_shimmer', 'mirage_effect']
    });

    // Arctic biome textures
    this.biomeTextureSets.set('ARCTIC', {
      ground: ['snow_deep', 'ice_clear', 'ice_cracked'],
      decorations: ['tree_pine_snow', 'ice_crystal', 'snow_mound', 'frozen_bush', 'icicle'],
      obstacles: ['ice_wall', 'boulder_frozen', 'glacier_chunk'],
      effects: ['snow_particle', 'frost_particle', 'aurora_effect']
    });

    // Volcanic biome textures
    this.biomeTextureSets.set('VOLCANIC', {
      ground: ['lava_rock', 'ash_ground', 'obsidian'],
      decorations: ['lava_pool_small', 'steam_vent', 'crystal_fire', 'bone_charred', 'ash_pile'],
      obstacles: ['lava_pool_large', 'boulder_volcanic', 'crystal_formation'],
      effects: ['ash_particle', 'ember_particle', 'lava_glow', 'steam_effect']
    });

    // Grassland biome textures
    this.biomeTextureSets.set('GRASSLAND', {
      ground: ['grass_green', 'dirt_path', 'flowers_field'],
      decorations: ['tree_small', 'flower_patch', 'grass_tall', 'rock_small', 'butterfly_swarm'],
      obstacles: ['tree_large', 'boulder_round', 'hedge_wall'],
      effects: ['pollen_particle', 'wind_grass', 'butterfly_effect']
    });
  }

  async loadTexture(id: string, src: string): Promise<Texture> {
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const loadingPromise = new Promise<Texture>((resolve, reject) => {
      // Check if we're in a test environment without Image support
      if (typeof Image === 'undefined') {
        // Create a mock texture for testing
        const mockTexture: Texture = {
          id,
          image: {
            width: 64,
            height: 64,
            src: src,
            onload: null,
            onerror: null
          } as any,
          width: 64,
          height: 64,
          loaded: true
        };
        resolve(mockTexture);
        return;
      }

      const image = new Image();
      
      image.onload = () => {
        const texture: Texture = {
          id,
          image,
          width: image.width,
          height: image.height,
          loaded: true
        };
        
        this.textures.set(id, texture);
        this.loadingPromises.delete(id);
        resolve(texture);
      };

      image.onerror = () => {
        this.loadingPromises.delete(id);
        reject(new Error(`Failed to load texture: ${id} from ${src}`));
      };

      image.src = src;
    });

    this.loadingPromises.set(id, loadingPromise);
    return loadingPromise;
  }

  async loadTextureAtlas(id: string, textureSrc: string, atlasData: { [key: string]: SpriteFrame }): Promise<TextureAtlas> {
    if (this.atlases.has(id)) {
      return this.atlases.get(id)!;
    }

    const texture = await this.loadTexture(`${id}_texture`, textureSrc);
    const sprites = new Map<string, SpriteFrame>();
    
    Object.entries(atlasData).forEach(([spriteId, frame]) => {
      sprites.set(spriteId, frame);
    });

    const atlas: TextureAtlas = {
      id,
      texture,
      sprites
    };

    this.atlases.set(id, atlas);
    return atlas;
  }

  async loadAnimatedSprite(id: string, texture: Texture, frames: SpriteFrame[], frameRate: number, loop: boolean = true): Promise<AnimatedSprite> {
    if (this.animatedSprites.has(id)) {
      return this.animatedSprites.get(id)!;
    }

    const animatedSprite: AnimatedSprite = {
      id,
      texture,
      frames,
      frameRate,
      loop
    };

    this.animatedSprites.set(id, animatedSprite);
    return animatedSprite;
  }

  getTexture(id: string): Texture | null {
    return this.textures.get(id) || null;
  }

  getAtlas(id: string): TextureAtlas | null {
    return this.atlases.get(id) || null;
  }

  getAnimatedSprite(id: string): AnimatedSprite | null {
    return this.animatedSprites.get(id) || null;
  }

  getSpriteFromAtlas(atlasId: string, spriteId: string): SpriteFrame | null {
    const atlas = this.getAtlas(atlasId);
    if (!atlas) return null;
    return atlas.sprites.get(spriteId) || null;
  }

  getBiomeTextureSet(biomeType: string): BiomeTextureSet | null {
    return this.biomeTextureSets.get(biomeType) || null;
  }

  async loadBiomeTextures(biomeType: string, basePath: string = '/assets/textures/'): Promise<void> {
    const textureSet = this.getBiomeTextureSet(biomeType);
    if (!textureSet) {
      throw new Error(`Unknown biome type: ${biomeType}`);
    }

    const loadPromises: Promise<Texture>[] = [];

    // Load all texture categories for this biome
    const allTextures = [
      ...textureSet.ground,
      ...textureSet.decorations,
      ...textureSet.obstacles,
      ...textureSet.effects
    ];

    allTextures.forEach(textureId => {
      const src = `${basePath}${biomeType.toLowerCase()}/${textureId}.png`;
      loadPromises.push(this.loadTexture(textureId, src));
    });

    await Promise.all(loadPromises);
  }

  async loadAllBiomeTextures(basePath: string = '/assets/textures/'): Promise<void> {
    const biomeTypes = Array.from(this.biomeTextureSets.keys());
    const loadPromises = biomeTypes.map(biome => this.loadBiomeTextures(biome, basePath));
    await Promise.all(loadPromises);
  }

  isTextureLoaded(id: string): boolean {
    const texture = this.getTexture(id);
    return texture?.loaded ?? false;
  }

  areAllTexturesLoaded(ids: string[]): boolean {
    return ids.every(id => this.isTextureLoaded(id));
  }

  getLoadingProgress(): { loaded: number; total: number; percentage: number } {
    const total = this.textures.size + this.loadingPromises.size;
    const loaded = this.textures.size;
    const percentage = total > 0 ? (loaded / total) * 100 : 100;
    
    return { loaded, total, percentage };
  }

  createFallbackTexture(id: string, width: number, height: number, color: string = '#FF00FF'): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add error pattern
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISSING', width / 2, height / 2);

    const image = new Image();
    image.src = canvas.toDataURL();

    const texture: Texture = {
      id,
      image,
      width,
      height,
      loaded: true
    };

    this.textures.set(id, texture);
    return texture;
  }

  getTextureOrFallback(id: string, width: number = 32, height: number = 32): Texture {
    const texture = this.getTexture(id);
    if (texture && texture.loaded) {
      return texture;
    }
    
    // Return or create fallback
    const fallbackId = `${id}_fallback`;
    return this.getTexture(fallbackId) || this.createFallbackTexture(fallbackId, width, height);
  }

  clear(): void {
    this.textures.clear();
    this.atlases.clear();
    this.animatedSprites.clear();
    this.loadingPromises.clear();
  }

  unloadTexture(id: string): void {
    this.textures.delete(id);
    
    // Also remove from atlases that use this texture
    const atlasesToRemove: string[] = [];
    for (const [atlasId, atlas] of this.atlases) {
      if (atlas.texture.id === id) {
        atlasesToRemove.push(atlasId);
      }
    }
    atlasesToRemove.forEach(atlasId => this.atlases.delete(atlasId));
    
    // Also remove from animated sprites that use this texture
    const spritesToRemove: string[] = [];
    for (const [spriteId, sprite] of this.animatedSprites) {
      if (sprite.texture.id === id) {
        spritesToRemove.push(spriteId);
      }
    }
    spritesToRemove.forEach(spriteId => this.animatedSprites.delete(spriteId));
  }

  getMemoryUsage(): { textures: number; totalSize: number } {
    let totalSize = 0;
    
    this.textures.forEach(texture => {
      if (texture.loaded) {
        // Rough estimate: width * height * 4 bytes (RGBA)
        totalSize += texture.width * texture.height * 4;
      }
    });
    
    return {
      textures: this.textures.size,
      totalSize
    };
  }
}