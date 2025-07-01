import { useState, useEffect } from 'react';

interface MobileLayoutInfo {
  isMobile: boolean;
  isPortrait: boolean;
  safeAreaTop: number;
}

/**
 * Hook to detect mobile layout and orientation
 * Returns safe area top offset for mobile devices in portrait mode
 */
export function useMobileLayout(): MobileLayoutInfo {
  const [layoutInfo, setLayoutInfo] = useState<MobileLayoutInfo>(() => {
    const isMobile = 'ontouchstart' in window || window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    const safeAreaTop = isMobile && isPortrait ? 100 : 0;
    
    return { isMobile, isPortrait, safeAreaTop };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = 'ontouchstart' in window || window.innerWidth <= 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      const safeAreaTop = isMobile && isPortrait ? 100 : 0;
      
      setLayoutInfo({ isMobile, isPortrait, safeAreaTop });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layoutInfo;
}

/**
 * Adjusts a Y position to account for mobile safe area
 */
export function adjustForMobileSafeArea(y: number, layoutInfo: MobileLayoutInfo): number {
  if (layoutInfo.isMobile && layoutInfo.isPortrait && y < layoutInfo.safeAreaTop) {
    return layoutInfo.safeAreaTop;
  }
  return y;
}