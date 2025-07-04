import React, { useEffect, useRef, useState } from "react";
import { MapLoader, MapRegistry } from "@/maps";
import { TerrainType } from "@/maps/types";
import { cn } from "@/lib/utils";

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
        MapRegistry.initializeSync();
        MapLoader.initializePresetMaps();

        const map = MapLoader.loadMapSync(mapId);
        if (!map) {
          throw new Error(`Map not found: ${mapId}`);
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get 2D context");
        }

        const { width, height } = map.data.metadata;
        const cellSize = 4;
        const canvasWidth = width * cellSize;
        const canvasHeight = height * cellSize;

        canvas.width = Math.max(canvasWidth, 120);
        canvas.height = Math.max(canvasHeight, 80);

        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (map.data.customProperties?.tiles) {
          const tiles = map.data.customProperties.tiles;

          tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
              if (tile.isPath) {
                ctx.fillStyle = "#8B4513";
              } else if (tile.type === TerrainType.WATER) {
                ctx.fillStyle = "#4682B4";
              } else if (tile.type === TerrainType.ROUGH) {
                ctx.fillStyle = "#696969";
              } else {
                ctx.fillStyle = "#228B22";
              }

              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            });
          });
        } else {
          ctx.strokeStyle = "#8B4513";
          ctx.lineWidth = Math.max(cellSize, 2);

          map.data.paths.forEach((path) => {
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

        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        map.data.spawnZones.forEach((zone) => {
          ctx.fillRect(
            (zone.x + 1) * cellSize,
            (zone.y + 1) * cellSize,
            cellSize * 2,
            cellSize * 2
          );
        });

        setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load map";
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadAndRenderMap();
  }, [mapId]);

  return (
    <div className={cn("relative inline-block", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded z-10">
          <div className="text-white/70 text-sm">Loading...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 rounded z-10">
          <div className="text-white text-sm">Error: {error}</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="rounded border border-white/10 min-w-[120px] min-h-[80px]"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
};
