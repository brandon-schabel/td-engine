import React, { 
  useState, 
  useEffect, 
  useRef, 
  cloneElement, 
  ReactElement, 
  ReactNode,
  CSSProperties
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  offset?: number;
  maxWidth?: number;
  trigger?: 'hover' | 'click' | 'focus';
  showArrow?: boolean;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const arrowStyles = {
  top: 'bottom-[-8px] left-1/2 -translate-x-1/2 border-t-gray-900 border-t-8 border-x-8',
  bottom: 'top-[-8px] left-1/2 -translate-x-1/2 border-b-gray-900 border-b-8 border-x-8',
  left: 'right-[-8px] top-1/2 -translate-y-1/2 border-l-gray-900 border-l-8 border-y-8',
  right: 'left-[-8px] top-1/2 -translate-y-1/2 border-r-gray-900 border-r-8 border-y-8',
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 500,
  offset = 8,
  maxWidth = 200,
  trigger = 'hover',
  showArrow = true,
  className,
  contentClassName,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<CSSProperties>({});
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const targetRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = () => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let currentPosition = position;

    // Calculate initial position
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + offset;
        break;
    }

    // Adjust for viewport boundaries
    if (top < 0 && (position === 'top' || position === 'left' || position === 'right')) {
      // Flip to bottom
      top = targetRect.bottom + offset;
      currentPosition = 'bottom';
    } else if (top + tooltipRect.height > viewportHeight && (position === 'bottom' || position === 'left' || position === 'right')) {
      // Flip to top
      top = targetRect.top - tooltipRect.height - offset;
      currentPosition = 'top';
    }

    // Horizontal adjustments
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    setTooltipPosition({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    });
    setAdjustedPosition(currentPosition);
  };

  const show = () => {
    if (disabled) return;
    
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (trigger === 'click') {
      e.stopPropagation();
      if (isVisible) {
        hide();
      } else {
        show();
      }
    }
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);

      if (trigger === 'click') {
        const handleClickOutside = (e: MouseEvent) => {
          if (targetRef.current && !targetRef.current.contains(e.target as Node) &&
              tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
            hide();
          }
        };
        document.addEventListener('click', handleClickOutside);
        
        return () => {
          document.removeEventListener('click', handleClickOutside);
          window.removeEventListener('scroll', calculatePosition, true);
          window.removeEventListener('resize', calculatePosition);
        };
      }

      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Clone the child element and add event handlers
  const childProps: any = {
    ref: targetRef,
  };

  if (trigger === 'hover') {
    childProps.onMouseEnter = show;
    childProps.onMouseLeave = hide;
    childProps.onFocus = show;
    childProps.onBlur = hide;
  } else if (trigger === 'click') {
    childProps.onClick = handleClick;
  } else if (trigger === 'focus') {
    childProps.onFocus = show;
    childProps.onBlur = hide;
  }

  const clonedChild = cloneElement(children, childProps);

  const tooltipContent = isVisible && createPortal(
    <div
      ref={tooltipRef}
      style={{ ...tooltipPosition, maxWidth: `${maxWidth}px` }}
      className={cn(
        'pointer-events-none transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div
        className={cn(
          'px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-normal break-words',
          contentClassName
        )}
      >
        {content}
      </div>
      {showArrow && (
        <div
          className={cn(
            'absolute w-0 h-0 border-transparent border-solid',
            arrowStyles[adjustedPosition]
          )}
        />
      )}
    </div>,
    document.body
  );

  return (
    <>
      {clonedChild}
      {tooltipContent}
    </>
  );
};

// Utility components for common use cases
export const HelpTooltip: React.FC<Omit<TooltipProps, 'delay' | 'position'>> = (props) => (
  <Tooltip delay={300} position="top" {...props} />
);

export const ClickTooltip: React.FC<Omit<TooltipProps, 'trigger'>> = (props) => (
  <Tooltip trigger="click" {...props} />
);

export const InfoTooltip: React.FC<{ children: ReactElement; info: string }> = ({ children, info }) => (
  <Tooltip content={info} position="top" delay={300}>
    {children}
  </Tooltip>
);