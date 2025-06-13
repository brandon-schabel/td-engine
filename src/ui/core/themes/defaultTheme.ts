/**
 * Default theme for the Tower Defense game UI
 * Dark theme optimized for gaming with high contrast
 */

import type { Theme } from '../types';

export const defaultTheme: Theme = {
  colors: {
    // Primary colors - Green (Tower Defense theme)
    primary: '#4CAF50',
    primaryLight: '#6FCF73',
    primaryDark: '#388E3C',
    primaryText: '#FFFFFF',
    
    // Secondary colors - Blue (Player/Action)
    secondary: '#2196F3',
    secondaryLight: '#42A5F5',
    secondaryDark: '#1976D2',
    secondaryText: '#FFFFFF',
    
    // UI colors
    background: '#0f0f0f',
    surface: '#1a1a1a',
    surfaceAlt: '#2a2a2a',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    success: '#4CAF50',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textDisabled: '#666666',
    
    // Border colors
    border: '#333333',
    borderLight: '#555555',
    borderDark: '#222222',
    
    // Game-specific colors
    tower: '#4CAF50',
    enemy: '#F44336',
    player: '#2196F3',
    projectile: '#FFD700',
    currency: '#FFD700',
    health: '#F44336',
    mana: '#2196F3',
  },
  
  spacing: {
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMonospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    fontSize: {
      xxs: '8px',
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
    none: 'none',
  },
  
  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  zIndex: {
    background: -1,
    content: 1,
    overlay: 1000,
    modal: 1050,
    popover: 1100,
    tooltip: 1150,
    notification: 1200,
    virtualControls: 1500,
  },
  
  // Touch-specific design tokens
  touch: {
    // Minimum touch target sizes (iOS/Android guidelines)
    minTargetSize: '44px',
    recommendedTargetSize: '48px',
    comfortableTargetSize: '56px',
    
    // Touch-friendly spacing
    spacing: {
      tap: '8px',       // Space between tappable elements
      thumb: '72px',    // Thumb zone radius
      palm: '120px',    // Palm rejection area
    },
    
    // Touch states and feedback
    states: {
      pressed: {
        scale: 0.95,
        opacity: 0.8,
        background: 'rgba(255, 255, 255, 0.1)',
      },
      hover: {
        scale: 1.02,
        background: 'rgba(255, 255, 255, 0.05)',
      },
      focus: {
        outline: '2px solid #2196F3',
        outlineOffset: '2px',
      },
      disabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    },
    
    // Haptic feedback patterns
    haptics: {
      light: [10],      // Quick tap
      medium: [20],     // Button press
      heavy: [30],      // Important action
      success: [10, 50, 10], // Success pattern
      error: [100],     // Error feedback
    },
    
    // Touch gesture thresholds
    gestures: {
      tapTimeout: 300,
      pressTimeout: 500,
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      panThreshold: 10,
    },
    
    // Virtual control styles
    virtualControls: {
      joystick: {
        size: '100px',
        innerSize: '40px',
        deadzone: 0.1,
        sensitivity: 1.0,
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        activeBackground: 'rgba(255, 255, 255, 0.2)',
      },
      button: {
        size: '60px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        activeBackground: 'rgba(255, 255, 255, 0.2)',
        shadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    },
    
    // Safe areas for mobile devices
    safeAreas: {
      top: 'env(safe-area-inset-top)',
      right: 'env(safe-area-inset-right)',
      bottom: 'env(safe-area-inset-bottom)',
      left: 'env(safe-area-inset-left)',
    },
  },
  
  // Enhanced animations for touch interactions
  animations: {
    // Tap feedback
    tapScale: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(0.95)' },
        '100%': { transform: 'scale(1)' },
      },
    },
    
    // Ripple effect
    ripple: {
      duration: '600ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: {
        '0%': { 
          transform: 'scale(0)', 
          opacity: '1' 
        },
        '100%': { 
          transform: 'scale(4)', 
          opacity: '0' 
        },
      },
    },
    
    // Slide in from edge (mobile menus)
    slideInLeft: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(0)' },
      },
    },
    
    // Bounce for notifications
    bounce: {
      duration: '800ms',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      keyframes: {
        '0%': { transform: 'scale(0.3)' },
        '50%': { transform: 'scale(1.05)' },
        '70%': { transform: 'scale(0.9)' },
        '100%': { transform: 'scale(1)' },
      },
    },
    
    // Shake for errors
    shake: {
      duration: '600ms',
      easing: 'ease-in-out',
      keyframes: {
        '0%, 100%': { transform: 'translateX(0)' },
        '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
        '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
      },
    },
  },
  
  // Responsive design tokens
  responsive: {
    // Breakpoint-specific overrides
    mobile: {
      fontSize: {
        xxs: '10px',
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '22px',
        xxl: '26px',
        xxxl: '30px',
      },
      spacing: {
        xxs: '4px',
        xs: '6px',
        sm: '12px',
        md: '20px',
        lg: '28px',
        xl: '36px',
        xxl: '52px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        full: '9999px',
      },
    },
    
    // Density modes
    compact: {
      spacing: {
        xxs: '1px',
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
      },
      touch: {
        minTargetSize: '40px',
        recommendedTargetSize: '44px',
      },
    },
    
    comfortable: {
      spacing: {
        xxs: '6px',
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '40px',
        xxl: '56px',
      },
      touch: {
        minTargetSize: '48px',
        recommendedTargetSize: '56px',
      },
    },
  },
};