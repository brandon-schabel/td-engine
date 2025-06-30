import React from 'react';
import { IconType } from '@/ui/icons/SvgIcons';
import { getSvgPath } from '@/ui/icons/SvgPaths';
import { cn } from '@/lib/utils';

export interface IconProps {
  type: IconType;
  size?: number;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ type, size = 24, className, color }) => {
  const svgContent = getSvgPath(type);
  
  if (!svgContent) {
    console.warn(`Icon type "${type}" not found`);
    return null;
  }

  // Clean the SVG content: remove comments and trim whitespace
  const cleanedContent = svgContent
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .trim();

  return (
    <svg
      className={cn('inline-block flex-shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
  );
};

// Memoized version for performance
export const MemoizedIcon = React.memo(Icon);