/**
 * Generates CSS custom properties from ResponsiveConfig
 * This allows CSS files to use the centralized responsive configuration
 */

import { RESPONSIVE_CONFIG } from '@/config/ResponsiveConfig';

export function generateResponsiveStyles(): string {
  return `
    :root {
      /* Breakpoints */
      --breakpoint-mobile: ${RESPONSIVE_CONFIG.breakpoints.mobile}px;
      --breakpoint-tablet: ${RESPONSIVE_CONFIG.breakpoints.tablet}px;
      --breakpoint-desktop: ${RESPONSIVE_CONFIG.breakpoints.desktop}px;
      --breakpoint-wide: ${RESPONSIVE_CONFIG.breakpoints.wide}px;
      --breakpoint-ultrawide: ${RESPONSIVE_CONFIG.breakpoints.ultrawide}px;
      --breakpoint-landscape-mobile: ${RESPONSIVE_CONFIG.breakpoints.landscape.mobile}px;
      --breakpoint-landscape-tablet: ${RESPONSIVE_CONFIG.breakpoints.landscape.tablet}px;
      
      /* Safe Areas */
      --safe-area-top: ${RESPONSIVE_CONFIG.safeAreas.top}px;
      --safe-area-bottom: ${RESPONSIVE_CONFIG.safeAreas.bottom}px;
      --safe-area-left: ${RESPONSIVE_CONFIG.safeAreas.left}px;
      --safe-area-right: ${RESPONSIVE_CONFIG.safeAreas.right}px;
      --safe-area-notch-portrait: ${RESPONSIVE_CONFIG.safeAreas.notch.portrait}px;
      --safe-area-notch-landscape: ${RESPONSIVE_CONFIG.safeAreas.notch.landscape}px;
      
      /* UI Scaling */
      --scale-ui-mobile: ${RESPONSIVE_CONFIG.scaling.ui.mobile};
      --scale-ui-tablet: ${RESPONSIVE_CONFIG.scaling.ui.tablet};
      --scale-ui-desktop: ${RESPONSIVE_CONFIG.scaling.ui.desktop};
      --scale-ui-wide: ${RESPONSIVE_CONFIG.scaling.ui.wide};
      
      /* Font Scaling */
      --scale-font-mobile: ${RESPONSIVE_CONFIG.scaling.font.mobile};
      --scale-font-tablet: ${RESPONSIVE_CONFIG.scaling.font.tablet};
      --scale-font-desktop: ${RESPONSIVE_CONFIG.scaling.font.desktop};
      --font-size-min: ${RESPONSIVE_CONFIG.scaling.font.minSize}px;
      --font-size-max: ${RESPONSIVE_CONFIG.scaling.font.maxSize}px;
      
      /* Touch Settings */
      --touch-tap-threshold: ${RESPONSIVE_CONFIG.touch.tapThreshold}px;
      --touch-hold-threshold: ${RESPONSIVE_CONFIG.touch.holdThreshold}ms;
      --touch-swipe-threshold: ${RESPONSIVE_CONFIG.touch.swipeThreshold}px;
      --touch-drag-deadzone: ${RESPONSIVE_CONFIG.touch.dragDeadzone}px;
      
      /* Layout - Mobile */
      --layout-mobile-top-offset: ${RESPONSIVE_CONFIG.layout.hud.mobile.topOffset}px;
      --layout-mobile-side-margin: ${RESPONSIVE_CONFIG.layout.hud.mobile.sideMargin}px;
      --layout-mobile-bottom-offset: ${RESPONSIVE_CONFIG.layout.hud.mobile.bottomOffset}px;
      
      /* Layout - Tablet */
      --layout-tablet-top-offset: ${RESPONSIVE_CONFIG.layout.hud.tablet.topOffset}px;
      --layout-tablet-side-margin: ${RESPONSIVE_CONFIG.layout.hud.tablet.sideMargin}px;
      --layout-tablet-bottom-offset: ${RESPONSIVE_CONFIG.layout.hud.tablet.bottomOffset}px;
      
      /* Layout - Desktop */
      --layout-desktop-top-offset: ${RESPONSIVE_CONFIG.layout.hud.desktop.topOffset}px;
      --layout-desktop-side-margin: ${RESPONSIVE_CONFIG.layout.hud.desktop.sideMargin}px;
      --layout-desktop-bottom-offset: ${RESPONSIVE_CONFIG.layout.hud.desktop.bottomOffset}px;
      
      /* Dialog Sizing - Mobile */
      --dialog-mobile-max-width: ${RESPONSIVE_CONFIG.dialogs.mobile.maxWidth};
      --dialog-mobile-max-height: ${RESPONSIVE_CONFIG.dialogs.mobile.maxHeight};
      --dialog-mobile-padding: ${RESPONSIVE_CONFIG.dialogs.mobile.padding}px;
      
      /* Dialog Sizing - Tablet */
      --dialog-tablet-max-width: ${RESPONSIVE_CONFIG.dialogs.tablet.maxWidth};
      --dialog-tablet-max-height: ${RESPONSIVE_CONFIG.dialogs.tablet.maxHeight};
      --dialog-tablet-padding: ${RESPONSIVE_CONFIG.dialogs.tablet.padding}px;
      
      /* Dialog Sizing - Desktop */
      --dialog-desktop-max-width: ${RESPONSIVE_CONFIG.dialogs.desktop.maxWidth}px;
      --dialog-desktop-max-height: ${RESPONSIVE_CONFIG.dialogs.desktop.maxHeight};
      --dialog-desktop-padding: ${RESPONSIVE_CONFIG.dialogs.desktop.padding}px;
      
      /* Text Minimum Sizes */
      --text-min-size-mobile: ${RESPONSIVE_CONFIG.text.minSizes.mobile}px;
      --text-min-size-tablet: ${RESPONSIVE_CONFIG.text.minSizes.tablet}px;
      --text-min-size-desktop: ${RESPONSIVE_CONFIG.text.minSizes.desktop}px;
    }
  `;
}

export function injectResponsiveStyles(): void {
  const styleElement = document.createElement('style');
  styleElement.id = 'responsive-config-styles';
  styleElement.textContent = generateResponsiveStyles();
  document.head.appendChild(styleElement);
}