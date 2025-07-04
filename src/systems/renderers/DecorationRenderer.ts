import type { Camera } from '@/systems/Camera';
import type { Grid } from '@/systems/Grid';
import type { Vector2 } from '@/utils/Vector2';

/**
 * Decoration type to render function mapping
 */
type DecorationRenderFunction = (
  ctx: CanvasRenderingContext2D,
  variant: number,
  animOffset: number
) => void;

/**
 * Registry of decoration renderers by type
 */
const DECORATION_RENDERERS: Record<string, DecorationRenderFunction> = {
  // Forest decorations
  'tree_oak': renderOakTree,
  'tree_pine': renderPineTree,
  'bush': renderBush,
  'boulder': (ctx, variant, animOffset) => renderRock(ctx, variant, true),
  'rock': (ctx, variant, animOffset) => renderRock(ctx, variant, false),

  // Desert decorations
  'cactus': renderCactus,
  'rock_formation': renderRockFormation,
  'dead_tree': renderDeadTree,
  'sand_dune': renderSandDune,

  // Arctic decorations
  'ice_formation': renderIceFormation,
  'snow_pile': renderSnowPile,
  'frozen_tree': renderFrozenTree,

  // Volcanic decorations
  'lava_rock': renderLavaRock,
  'volcanic_boulder': renderVolcanicBoulder,
  'ash_pile': renderAshPile,

  // Grassland decorations
  'small_tree': renderSmallTree,
  'flower_patch': renderFlowerPatch,
  'tall_grass': renderTallGrass,
};

/**
 * Handles rendering of map decorations like trees, rocks, bushes, etc.
 */
export class DecorationRenderer {
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private camera: Camera;

  constructor(ctx: CanvasRenderingContext2D, grid: Grid, camera: Camera) {
    this.ctx = ctx;
    this.grid = grid;
    this.camera = camera;
  }

  /**
   * Render all visible decorations in the current viewport
   */
  renderDecorations(): void {
    const cellSize = this.grid.cellSize;
    const visibleBounds = this.camera.getVisibleBounds();

    // Calculate visible grid bounds
    const startX = Math.max(0, Math.floor(visibleBounds.min.x / cellSize));
    const endX = Math.min(this.grid.width, Math.ceil(visibleBounds.max.x / cellSize));
    const startY = Math.max(0, Math.floor(visibleBounds.min.y / cellSize));
    const endY = Math.min(this.grid.height, Math.ceil(visibleBounds.max.y / cellSize));

    // Render decorations in visible cells
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const cellData = this.grid.getCellData(x, y);
        if (!cellData || !cellData.decoration) continue;

        const decoration = cellData.decoration;
        const screenPos = this.camera.worldToScreen(decoration.position);

        // Skip if not visible
        if (!this.camera.isVisible(decoration.position, cellSize)) continue;

        if (typeof this.ctx.save === 'function') {
          this.ctx.save();
        }
        if (typeof this.ctx.translate === 'function') {
          this.ctx.translate(screenPos.x, screenPos.y);
        }
        // Safety check for test environments
        if (typeof this.ctx.rotate === 'function') {
          this.ctx.rotate((decoration.rotation * Math.PI) / 180);
        }
        if (typeof this.ctx.scale === 'function') {
          this.ctx.scale(decoration.scale, decoration.scale);
        }

        // Render based on decoration type
        this.renderDecorationType(decoration.type, decoration.variant || 0, decoration.animated || false);

        if (typeof this.ctx.restore === 'function') {
          this.ctx.restore();
        }
      }
    }
  }

  /**
   * Render a specific decoration type
   */
  private renderDecorationType(type: string, variant: number, animated: boolean): void {
    // Animation offset
    const animOffset = animated ? Math.sin(Date.now() * 0.001) * 2 : 0;

    // Safety check for canvas context methods
    if (!this.ctx || typeof this.ctx.beginPath !== 'function') {
      return;
    }

    // Use renderer from registry or fallback to generic
    const renderer = DECORATION_RENDERERS[type] || renderGenericDecoration;
    renderer(this.ctx, variant, animOffset);
  }
}

// ========== Pure decoration rendering functions ==========

/**
 * Render an oak tree
 */
function renderOakTree(ctx: CanvasRenderingContext2D, variant: number, animOffset: number): void {
  // Oak tree - circular canopy
  ctx.fillStyle = variant === 0 ? '#2D5016' : '#3D6B1C';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0 + animOffset, -10, 12, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }

  // Trunk
  ctx.fillStyle = '#4A2C17';
  if (typeof ctx.fillRect === 'function') {
    ctx.fillRect(-3, -2, 6, 12);
  }
}

/**
 * Render a pine tree
 */
function renderPineTree(ctx: CanvasRenderingContext2D, _variant: number, animOffset: number): void {
  // Pine tree - triangular shape
  ctx.fillStyle = '#1B4F1B';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(0 + animOffset * 0.5, -20);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(-10, 5);
    ctx.lineTo(10, 5);
  }
  if (typeof ctx.closePath === 'function') {
    ctx.closePath();
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }

  // Trunk
  ctx.fillStyle = '#4A2C17';
  if (typeof ctx.fillRect === 'function') {
    ctx.fillRect(-2, 5, 4, 8);
  }
}

/**
 * Render a bush
 */
function renderBush(ctx: CanvasRenderingContext2D, variant: number, animOffset: number): void {
  ctx.fillStyle = variant === 0 ? '#3A5F3A' : '#4B7C4B';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(-4 + animOffset * 0.3, 0, 6, 0, Math.PI * 2);
    ctx.arc(4 + animOffset * 0.3, 0, 6, 0, Math.PI * 2);
    ctx.arc(0, -3, 5, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}

/**
 * Render a rock or boulder
 */
function renderRock(ctx: CanvasRenderingContext2D, variant: number, isLarge: boolean): void {
  const size = isLarge ? 12 : 8;
  ctx.fillStyle = variant === 0 ? '#5A5A5A' : '#6B6B6B';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(-size, size * 0.5);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(-size * 0.6, -size * 0.8);
    ctx.lineTo(size * 0.7, -size * 0.6);
    ctx.lineTo(size, size * 0.4);
  }
  if (typeof ctx.closePath === 'function') {
    ctx.closePath();
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }

  // Add shading
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(0, -size * 0.7);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(size * 0.7, -size * 0.6);
    ctx.lineTo(size, size * 0.4);
    ctx.lineTo(0, size * 0.5);
  }
  if (typeof ctx.closePath === 'function') {
    ctx.closePath();
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}

/**
 * Render a cactus
 */
function renderCactus(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#4A7C59';
  // Main body
  if (typeof ctx.fillRect === 'function') {
    ctx.fillRect(-4, -15, 8, 25);
  }

  // Arms
  if (variant === 0 || variant === 2) {
    if (typeof ctx.fillRect === 'function') {
      ctx.fillRect(-12, -5, 8, 4);
      ctx.fillRect(-12, -5, 4, 10);
    }
  }
  if (variant === 1 || variant === 2) {
    if (typeof ctx.fillRect === 'function') {
      ctx.fillRect(4, -8, 8, 4);
      ctx.fillRect(8, -8, 4, 12);
    }
  }
}

/**
 * Render a rock formation
 */
function renderRockFormation(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#8B7355';
  // Multiple rock shapes
  const positions = [
    { x: -8, y: 5, w: 10, h: 15 },
    { x: 2, y: 8, w: 8, h: 12 },
    { x: -2, y: 0, w: 12, h: 20 }
  ];

  positions.forEach((pos, i) => {
    if (i <= variant) {
      if (typeof ctx.fillRect === 'function') {
        ctx.fillRect(pos.x - pos.w / 2, -pos.h / 2, pos.w, pos.h);
      }
    }
  });
}

/**
 * Render a dead tree
 */
function renderDeadTree(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.strokeStyle = '#4A3C28';
  ctx.lineWidth = 3;
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(0, 10);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(0, -10);
  }

  // Branches
  if (variant === 0 || variant === 2) {
    if (typeof ctx.moveTo === 'function') {
      ctx.moveTo(0, -5);
    }
    if (typeof ctx.lineTo === 'function') {
      ctx.lineTo(-8, -12);
    }
  }
  if (variant === 1 || variant === 2) {
    if (typeof ctx.moveTo === 'function') {
      ctx.moveTo(0, -8);
    }
    if (typeof ctx.lineTo === 'function') {
      ctx.lineTo(6, -15);
    }
  }
  if (typeof ctx.stroke === 'function') {
    ctx.stroke();
  }
}

/**
 * Render a sand dune
 */
function renderSandDune(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#E3C88F';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0, 5, 15 + variant * 2, 0, Math.PI, true);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}

/**
 * Render an ice formation
 */
function renderIceFormation(ctx: CanvasRenderingContext2D, _variant: number, _animOffset: number): void {
  ctx.fillStyle = '#B3E5FC';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  // Crystalline shape
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(0, -15);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(-8, 5);
    ctx.lineTo(-4, 8);
    ctx.lineTo(4, 8);
    ctx.lineTo(8, 5);
  }
  if (typeof ctx.closePath === 'function') {
    ctx.closePath();
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }

  // Add shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(0, -15);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(-4, -5);
    ctx.lineTo(0, -8);
  }
  if (typeof ctx.closePath === 'function') {
    ctx.closePath();
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}

/**
 * Render a snow pile
 */
function renderSnowPile(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#F0F8FF';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0, 3, 10 + variant * 2, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}

/**
 * Render a frozen tree
 */
function renderFrozenTree(ctx: CanvasRenderingContext2D, _variant: number, animOffset: number): void {
  // Ice-covered tree
  ctx.fillStyle = '#A8D8EA';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0 + animOffset * 0.5, -10, 10, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }

  // Icy trunk
  ctx.fillStyle = '#7FCDCD';
  if (typeof ctx.fillRect === 'function') {
    ctx.fillRect(-2, -2, 4, 12);
  }
}

/**
 * Render a lava rock
 */
function renderLavaRock(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#2F1B14';
  renderRock(ctx, variant, false);

  // Add glowing cracks
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = 1;
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.moveTo === 'function') {
    ctx.moveTo(-4, 0);
  }
  if (typeof ctx.lineTo === 'function') {
    ctx.lineTo(2, -3);
    ctx.lineTo(4, 2);
  }
  if (typeof ctx.stroke === 'function') {
    ctx.stroke();
  }
}

/**
 * Render a volcanic boulder
 */
function renderVolcanicBoulder(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#1A0E0A';
  renderRock(ctx, variant, true);
}

/**
 * Render an ash pile
 */
function renderAshPile(ctx: CanvasRenderingContext2D, variant: number, _animOffset: number): void {
  ctx.fillStyle = '#4A4A4A';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0, 4, 8 + variant, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}

/**
 * Render a small tree
 */
function renderSmallTree(ctx: CanvasRenderingContext2D, _variant: number, animOffset: number): void {
  ctx.fillStyle = '#7CFC00';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0 + animOffset * 0.7, -6, 8, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }

  // Small trunk
  ctx.fillStyle = '#654321';
  if (typeof ctx.fillRect === 'function') {
    ctx.fillRect(-2, -1, 4, 8);
  }
}

/**
 * Render a flower patch
 */
function renderFlowerPatch(ctx: CanvasRenderingContext2D, variant: number, animOffset: number): void {
  const colors = ['#FFB6C1', '#FFA07A', '#FFD700'];
  const flowerPositions = [
    { x: -4, y: 0 },
    { x: 4, y: -2 },
    { x: 0, y: 3 }
  ];

  flowerPositions.forEach((pos, i) => {
    if (i <= variant) {
      ctx.fillStyle = colors[i % colors.length]!;
      if (typeof ctx.beginPath === 'function') {
        ctx.beginPath();
      }
      if (typeof ctx.arc === 'function') {
        ctx.arc(pos.x + animOffset * 0.3, pos.y, 3, 0, Math.PI * 2);
      }
      if (typeof ctx.fill === 'function') {
        ctx.fill();
      }
    }
  });
}

/**
 * Render tall grass
 */
function renderTallGrass(ctx: CanvasRenderingContext2D, variant: number, animOffset: number): void {
  ctx.strokeStyle = '#7CFC00';
  ctx.lineWidth = 2;

  for (let i = 0; i <= variant; i++) {
    const x = (i - 1) * 4;
    if (typeof ctx.beginPath === 'function') {
      ctx.beginPath();
    }
    if (typeof ctx.moveTo === 'function') {
      ctx.moveTo(x, 5);
    }
    if (typeof ctx.quadraticCurveTo === 'function') {
      ctx.quadraticCurveTo(x + animOffset, -2, x + animOffset * 2, -8);
    }
    if (typeof ctx.stroke === 'function') {
      ctx.stroke();
    }
  }
}

/**
 * Render a generic decoration (fallback)
 */
function renderGenericDecoration(ctx: CanvasRenderingContext2D, _variant: number, _animOffset: number): void {
  // Fallback for unknown decoration types
  ctx.fillStyle = '#888888';
  if (typeof ctx.beginPath === 'function') {
    ctx.beginPath();
  }
  if (typeof ctx.arc === 'function') {
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
  }
  if (typeof ctx.fill === 'function') {
    ctx.fill();
  }
}