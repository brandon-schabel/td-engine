import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Game-specific colors
        'game': {
          'tower': {
            'basic': '#4169e1',
            'laser': '#ff1493',
            'frost': '#00bfff',
            'artillery': '#ff8c00',
            'wall': '#666666',
          },
          'enemy': {
            'basic': '#F44336',
            'fast': '#FF5722',
            'tank': '#9C27B0',
          },
          'player': '#00ff00',
          'currency': '#ffd700',
          'damage': {
            'physical': '#ff0000',
            'magical': '#00bfff',
            'critical': '#ff8c00',
          },
          'health': {
            'high': '#4CAF50',
            'medium': '#FF9800',
            'low': '#F44336',
            'critical': '#ff0000',
          },
        },
        // UI colors
        'ui': {
          'bg': {
            'primary': '#1a1a1a',
            'secondary': '#2a2a2a',
            'overlay': 'rgba(0, 0, 0, 0.7)',
          },
          'text': {
            'primary': '#ffffff',
            'secondary': '#cccccc',
            'muted': '#999999',
          },
          'border': {
            'DEFAULT': '#333333',
            'active': '#ffffff',
            'error': '#ff0000',
            'subtle': 'rgba(255, 255, 255, 0.1)',
          },
        },
        // Status colors
        'status': {
          'success': '#00ff00',
          'warning': '#ffff00',
          'error': '#ff0000',
          'info': '#2196F3',
        },
        // Button colors
        'button': {
          'primary': '#4169e1',
          'secondary': '#808080',
          'danger': '#ff0000',
          'success': '#00ff00',
        },
      },
      spacing: {
        // Safe area insets for mobile
        'safe-top': 'env(safe-area-inset-top, 0)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0)',
        'safe-left': 'env(safe-area-inset-left, 0)',
        'safe-right': 'env(safe-area-inset-right, 0)',
        // Game-specific spacing
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        'xxxl': '32px',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom, 0)',
      },
      fontSize: {
        'xxs': '10px',
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '24px',
        'xxl': '32px',
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 8px rgba(76, 175, 80, 0.5)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease infinite',
        'particle-float': 'particleFloat 4s ease-in-out infinite',
        'float': 'float 2s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, rgba(33, 37, 41, 0.95) 0%, rgba(40, 44, 48, 0.95) 100%)',
        'gradient-card-hover': 'linear-gradient(135deg, rgba(40, 44, 48, 0.98) 0%, rgba(48, 52, 56, 0.98) 100%)',
        'gradient-primary': 'linear-gradient(135deg, #4169e1 0%, #5a82e3 100%)',
        'gradient-success': 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
        'gradient-overlay': 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      zIndex: {
        'controls': '9999',
        'tooltip': '10000',
        'floating': '1000',
        'hud': '100',
        'dialog': '10000',
        'dropdown': '1000',
        'backdrop': '9000',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
    },
  },
  plugins: [],
} satisfies Config