import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FloatingPortal as BaseFloatingPortal } from '@floating-ui/react';

interface FloatingPortalProps {
  children: React.ReactNode;
  /** ID of the portal root element */
  id?: string;
  /** Root element to render the portal into */
  root?: HTMLElement | null;
  /** Whether to use Floating UI's portal (with z-index management) */
  preserveTabOrder?: boolean;
}

/**
 * Portal component for rendering floating elements
 * Ensures proper z-index stacking and DOM structure
 */
export const FloatingPortal: React.FC<FloatingPortalProps> = ({
  children,
  id = 'floating-ui-root',
  root,
  preserveTabOrder = true,
}) => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (root) {
      setPortalRoot(root);
      return;
    }

    // Find or create portal root
    let element = document.getElementById(id);
    
    if (!element) {
      element = document.createElement('div');
      element.id = id;
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '0';
      element.style.height = '0';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '9999';
      
      document.body.appendChild(element);
    }

    setPortalRoot(element);

    // Cleanup on unmount if we created the element
    return () => {
      if (element && element.childNodes.length === 0 && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [id, root]);

  if (!portalRoot) return null;

  // Use Floating UI's portal for better z-index management
  if (preserveTabOrder) {
    return <BaseFloatingPortal root={portalRoot}>{children}</BaseFloatingPortal>;
  }

  // Use React's createPortal for simpler cases
  return createPortal(children, portalRoot);
};

/**
 * Simple wrapper for game UI portals
 */
export const GamePortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <FloatingPortal id="game-ui-portal">{children}</FloatingPortal>;
};