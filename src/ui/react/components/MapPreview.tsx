import React, { useEffect, useRef, useState } from 'react';
import { MapLoader } from '@/maps';
import { cn } from '@/lib/utils';

interface MapPreviewProps {
  mapId: string;
  className?: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ mapId, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndRenderMap = async () => {
      if (!canvasRef.current) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const map = MapLoader.loadMapSync(mapId);
        if (!map) {
          throw new Error(`Failed to load map: ${mapId}`);
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = map.data.metadata;
        const cellSize = 4; // Small cell size for preview
        
        canvas.width = width * cellSize;
        canvas.height = height * cellSize;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw tiles if available
        if (map.data.customProperties?.tiles) {
          const tiles = map.data.customProperties.tiles;
          
          tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
              if (tile.isPath) {
                ctx.fillStyle = '#8B4513'; // Brown for paths
              } else if (tile.type === 'WATER') {
                ctx.fillStyle = '#4682B4'; // Blue for water
              } else if (tile.type === 'ROUGH') {
                ctx.fillStyle = '#696969'; // Gray for rough terrain
              } else {
                ctx.fillStyle = '#228B22'; // Green for grass
              }
              
              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            });
          });
        } else {
          // Fallback: Draw paths from waypoints
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = cellSize;
          
          map.data.paths.forEach(path => {
            ctx.beginPath();
            path.waypoints.forEach((point, i) => {
              const x = point.x * cellSize + cellSize / 2;
              const y = point.y * cellSize + cellSize / 2;
              
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
          });
        }

        // Draw spawn zones
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        map.data.spawnZones.forEach(zone => {
          ctx.fillRect(
            (zone.x + 1) * cellSize,
            (zone.y + 1) * cellSize,
            cellSize * 2,
            cellSize * 2
          );
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to load map preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    loadAndRenderMap();
  }, [mapId]);

  return (
    <div className={cn('relative inline-block', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
          <div className="text-white/70 text-sm">Loading...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 rounded">
          <div className="text-white text-sm">Error</div>
        </div>
      )}
      <canvas 
        ref={canvasRef}
        className="rounded border border-white/10"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};