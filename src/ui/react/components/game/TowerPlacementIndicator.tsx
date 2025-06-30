import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { isMobile as checkIsMobile } from '@/config/ResponsiveConfig';

interface TowerPlacementIndicatorProps {
  selectedTowerType: string | null;
}

const towerNames: Record<string, string> = {
  BASIC: 'Basic Tower',
  SNIPER: 'Sniper Tower',
  RAPID: 'Rapid Tower',
  WALL: 'Wall',
};

export const TowerPlacementIndicator: React.FC<TowerPlacementIndicatorProps> = ({
  selectedTowerType
}) => {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = 'ontouchstart' in window || checkIsMobile(window.innerWidth);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    setVisible(!!selectedTowerType && isMobile);
  }, [selectedTowerType, isMobile]);

  useEffect(() => {
    const handleTowerPlaced = () => {
      setVisible(false);
    };

    document.addEventListener('towerPlaced', handleTowerPlaced);
    return () => document.removeEventListener('towerPlaced', handleTowerPlaced);
  }, []);

  if (!selectedTowerType) return null;

  const towerName = towerNames[selectedTowerType] || selectedTowerType;

  return (
    <div
      className={cn(
        'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
        'bg-ui-bg-secondary text-ui-text-primary',
        'px-4 py-2 rounded-lg shadow-lg',
        'pointer-events-none z-20',
        'transition-opacity',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      📍 Tap to place {towerName}
    </div>
  );
};