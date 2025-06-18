/**
 * SVG Icon Library for Tower Defense Game
 * All icons are designed to work with currentColor for easy theming
 */

export enum IconType {
  // Tower Icons
  BASIC_TOWER = 'BASIC_TOWER',
  SNIPER_TOWER = 'SNIPER_TOWER',
  RAPID_TOWER = 'RAPID_TOWER',
  WALL = 'WALL',
  
  // Action Icons
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  PLAYER = 'PLAYER',
  CLOSE = 'CLOSE',
  CANCEL = 'CANCEL',
  MENU = 'MENU',
  COLLAPSE = 'COLLAPSE',
  EXPAND = 'EXPAND',
  BUILD = 'BUILD',
  SETTINGS = 'SETTINGS',
  
  // Upgrade Icons
  DAMAGE = 'DAMAGE',
  RANGE = 'RANGE',
  FIRE_RATE = 'FIRE_RATE',
  SPEED = 'SPEED',
  HEALTH = 'HEALTH',
  
  // Audio Icons
  AUDIO_ON = 'AUDIO_ON',
  AUDIO_OFF = 'AUDIO_OFF',
  MUSIC = 'MUSIC',
  SFX = 'SFX',
  
  // Control Icons
  KEYBOARD = 'KEYBOARD',
  MOUSE = 'MOUSE',
  GAMEPAD = 'GAMEPAD',
  TOUCH = 'TOUCH',
  
  // Camera/Zoom Icons
  ZOOM_IN = 'ZOOM_IN',
  ZOOM_OUT = 'ZOOM_OUT',
  ZOOM_FIT = 'ZOOM_FIT',
  CAMERA = 'CAMERA',
  
  // UI Icons
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  COINS = 'COINS',
  WAVE = 'WAVE',
  STAR = 'STAR',
  INVENTORY = 'INVENTORY',
  GRID = 'GRID',
  SHIELD = 'SHIELD',
  CROWN = 'CROWN',
  UPGRADE = 'UPGRADE',
  CHECKMARK = 'CHECKMARK',
  
  // Game state icons
  VICTORY = 'VICTORY',
  GAME_OVER = 'GAME_OVER',
  TROPHY = 'TROPHY',
  LEADERBOARD = 'LEADERBOARD',
  SCORE = 'SCORE',
  ENEMY = 'ENEMY',
  CURRENCY = 'CURRENCY',
  CLOCK = 'CLOCK',
  RESTART = 'RESTART',
  HOME = 'HOME',
  MEDAL = 'MEDAL',
  GAME_CONTROLLER = 'GAME_CONTROLLER',
  
  // PowerUp Icons
  POWERUP_DAMAGE = 'POWERUP_DAMAGE',
  POWERUP_SPEED = 'POWERUP_SPEED',
  POWERUP_FIRE_RATE = 'POWERUP_FIRE_RATE',
  POWERUP_SHIELD = 'POWERUP_SHIELD',
  POWERUP_HEALTH_REGEN = 'POWERUP_HEALTH_REGEN',
  
  // Mobile Control Icons
  ARROW_UP = 'ARROW_UP',
  CROSSHAIR = 'CROSSHAIR'
}

interface SvgIconOptions {
  size?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
}

const DEFAULT_OPTIONS: Required<SvgIconOptions> = {
  size: 16,
  className: 'svg-icon',
  strokeWidth: 2,
  title: ''
};

/**
 * SVG icon definitions
 */
const ICON_PATHS: Record<IconType, string> = {
  // Tower Icons
  [IconType.BASIC_TOWER]: `
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  `,
  
  [IconType.SNIPER_TOWER]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="2" x2="12" y2="7" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" stroke-width="2"/>
    <line x1="2" y1="12" x2="7" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="17" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  `,
  
  [IconType.RAPID_TOWER]: `
    <path d="M12 2 L8 10 L16 10 Z" fill="currentColor"/>
    <path d="M12 8 L8 16 L16 16 Z" fill="currentColor" opacity="0.7"/>
    <path d="M12 14 L8 22 L16 22 Z" fill="currentColor" opacity="0.4"/>
  `,
  
  [IconType.WALL]: `
    <rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="12" x2="8" y2="18" stroke="currentColor" stroke-width="2"/>
    <line x1="16" y1="12" x2="16" y2="18" stroke="currentColor" stroke-width="2"/>
  `,
  
  // Action Icons
  [IconType.PLAY]: `
    <path d="M8 5 L8 19 L19 12 Z" fill="currentColor"/>
  `,
  
  [IconType.PAUSE]: `
    <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
    <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
  `,
  
  [IconType.PLAYER]: `
    <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M4 21 C4 16 8 13 12 13 C16 13 20 16 20 21" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.CLOSE]: `
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.CANCEL]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.MENU]: `
    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.COLLAPSE]: `
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.EXPAND]: `
    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.BUILD]: `
    <path d="M14.7 6.3 C15.1 5.9 15.7 5.9 16.1 6.3 L17.7 7.9 C18.1 8.3 18.1 8.9 17.7 9.3 L9 18 L2 22 L6 15 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M11 13 L13 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 3 L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.SETTINGS]: `
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 1 L12 3 M12 21 L12 23 M4.22 4.22 L5.64 5.64 M18.36 18.36 L19.78 19.78 M1 12 L3 12 M21 12 L23 12 M4.22 19.78 L5.64 18.36 M18.36 5.64 L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  // Upgrade Icons
  [IconType.DAMAGE]: `
    <path d="M7 2 L17 2 L22 7 L22 17 L17 22 L7 22 L2 17 L2 7 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 8 L14 10 L12 16 L10 14 Z" fill="currentColor"/>
  `,
  
  [IconType.RANGE]: `
    <circle cx="12" cy="12" r="4" fill="currentColor"/>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
  `,
  
  [IconType.FIRE_RATE]: `
    <path d="M13 2 L11 9 L16 9 L10 22 L12 13 L7 13 Z" fill="currentColor"/>
  `,
  
  [IconType.SPEED]: `
    <path d="M12 2 C6 2 2 8 2 12 C2 16 4 18 6 18 C8 18 9 16 9 16 C9 16 10 18 12 18 C14 18 15 16 15 16 C15 16 16 18 18 18 C20 18 22 16 22 12 C22 8 18 2 12 2" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="13" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.HEALTH]: `
    <path d="M12 21 C12 21 3 13.5 3 8.5 C3 5.5 5.5 3 8.5 3 C10.5 3 12 4 12 4 C12 4 13.5 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 13.5 12 21 12 21 Z" fill="currentColor"/>
  `,
  
  // Audio Icons
  [IconType.AUDIO_ON]: `
    <path d="M11 5 L6 9 L2 9 L2 15 L6 15 L11 19 Z" fill="currentColor"/>
    <path d="M15 9 C17 9 19 10.5 19 12 C19 13.5 17 15 15 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.AUDIO_OFF]: `
    <path d="M11 5 L6 9 L2 9 L2 15 L6 15 L11 19 Z" fill="currentColor"/>
    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.MUSIC]: `
    <path d="M9 18 L9 5 L21 3 L21 16" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="6" cy="18" r="3" fill="currentColor"/>
    <circle cx="18" cy="16" r="3" fill="currentColor"/>
  `,
  
  [IconType.SFX]: `
    <path d="M12 3 L12 10 L16 14 L12 18 L8 14 L12 10" fill="currentColor"/>
    <circle cx="12" cy="20" r="2" fill="currentColor"/>
  `,
  
  // Control Icons
  [IconType.KEYBOARD]: `
    <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="5" y="9" width="2" height="2" fill="currentColor"/>
    <rect x="9" y="9" width="2" height="2" fill="currentColor"/>
    <rect x="13" y="9" width="2" height="2" fill="currentColor"/>
    <rect x="17" y="9" width="2" height="2" fill="currentColor"/>
    <rect x="7" y="13" width="10" height="2" fill="currentColor"/>
  `,
  
  [IconType.MOUSE]: `
    <path d="M12 2 C8 2 5 5 5 9 L5 15 C5 19 8 22 12 22 C16 22 19 19 19 15 L19 9 C19 5 16 2 12 2 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="2" x2="12" y2="9" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.GAMEPAD]: `
    <rect x="3" y="7" width="18" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
  `,
  
  [IconType.TOUCH]: `
    <path d="M12 2 C7 2 3 6 3 11 L3 16 C3 19 5 21 8 21 L16 21 C19 21 21 19 21 16 L21 11 C21 6 17 2 12 2" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  `,
  
  // Camera/Zoom Icons
  [IconType.ZOOM_IN]: `
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.ZOOM_OUT]: `
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.ZOOM_FIT]: `
    <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3,3"/>
    <rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M9 9 L15 15" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
    <path d="M15 9 L9 15" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
  `,
  
  [IconType.CAMERA]: `
    <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M7 6 L8 4 L16 4 L17 6" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  
  // UI Icons
  [IconType.INFO]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  `,
  
  [IconType.WARNING]: `
    <path d="M12 2 L2 20 L22 20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  `,
  
  [IconType.SUCCESS]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12 L11 15 L16 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.ERROR]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.COINS]: `
    <ellipse cx="12" cy="8" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M4 8 L4 12 C4 13.5 7.5 15 12 15 C16.5 15 20 13.5 20 12 L20 8" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M4 12 L4 16 C4 17.5 7.5 19 12 19 C16.5 19 20 17.5 20 16 L20 12" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.WAVE]: `
    <path d="M2 12 C2 8 6 8 6 12 C6 16 10 16 10 12 C10 8 14 8 14 12 C14 16 18 16 18 12 C18 8 22 8 22 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.STAR]: `
    <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" fill="currentColor"/>
  `,
  
  // PowerUp Icons
  [IconType.POWERUP_DAMAGE]: `
    <path d="M12 2 L16 8 L22 8 L18 14 L20 22 L12 18 L4 22 L6 14 L2 8 L8 8 Z" fill="currentColor"/>
    <circle cx="12" cy="12" r="4" fill="none" stroke="white" stroke-width="1"/>
  `,
  
  [IconType.POWERUP_SPEED]: `
    <path d="M3 12 L7 7 L7 10 L21 10 L21 14 L7 14 L7 17 Z" fill="currentColor"/>
    <path d="M8 8 L12 4 L12 6 L20 6 L20 8 Z" fill="currentColor" opacity="0.7"/>
    <path d="M8 16 L12 20 L12 18 L20 18 L20 16 Z" fill="currentColor" opacity="0.7"/>
  `,
  
  [IconType.POWERUP_FIRE_RATE]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12 L12 8 L16 12 L12 16 Z" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
  `,
  
  [IconType.POWERUP_SHIELD]: `
    <path d="M12 2 L4 6 L4 12 C4 18 12 22 12 22 C12 22 20 18 20 12 L20 6 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M9 12 L11 14 L16 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.POWERUP_HEALTH_REGEN]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 7 L12 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 12 L17 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
  `,
  
  // Game state icons
  [IconType.VICTORY]: `
    <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" fill="currentColor"/>
  `,
  
  [IconType.GAME_OVER]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.TROPHY]: `
    <path d="M6 9H4.5A2.5 2.5 0 0 1 2 6.5V4A2 2 0 0 1 4 2H20A2 2 0 0 1 22 4V6.5A2.5 2.5 0 0 1 19.5 9H18" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M6 9H18V15A6 6 0 0 1 6 15V9Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M10 22H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 22H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.LEADERBOARD]: `
    <path d="M3 13L12 4L21 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 11V20A1 1 0 0 0 6 21H18A1 1 0 0 0 19 20V11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="9" y="13" width="6" height="5" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="15" r="1" fill="currentColor"/>
  `,
  
  [IconType.SCORE]: `
    <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  `,
  
  [IconType.ENEMY]: `
    <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 14V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 18L12 14L16 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 20H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.CURRENCY]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 6V18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 9A3 3 0 0 1 15 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 15A3 3 0 0 0 15 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.CLOCK]: `
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.RESTART]: `
    <path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.HOME]: `
    <path d="M3 9L12 2L21 9V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.MEDAL]: `
    <circle cx="12" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="8" r="2" fill="currentColor"/>
  `,
  
  [IconType.GAME_CONTROLLER]: `
    <path d="M6 10H4A4 4 0 0 0 0 14V18A4 4 0 0 0 4 22H6A2 2 0 0 0 8 20V12A2 2 0 0 0 6 10Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M18 10H20A4 4 0 0 1 24 14V18A4 4 0 0 1 20 22H18A2 2 0 0 1 16 20V12A2 2 0 0 1 18 10Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12H16V20H8Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="10" cy="16" r="1" fill="currentColor"/>
    <circle cx="14" cy="16" r="1" fill="currentColor"/>
  `,
  
  [IconType.INVENTORY]: `
    <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.GRID]: `
    <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.SHIELD]: `
    <path d="M12 2 L4 6 L4 12 C4 18 12 22 12 22 C12 22 20 18 20 12 L20 6 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M9 12 L11 14 L16 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.CROWN]: `
    <path d="M2 18 L22 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 2 L15 8 L22 6 L19 12 L5 12 L2 6 L9 8 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="12" cy="6" r="2" fill="currentColor"/>
  `,
  
  [IconType.UPGRADE]: `
    <path d="M7 10 L12 5 L17 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 5 L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 19 L19 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.CHECKMARK]: `
    <path d="M20 6 L9 17 L4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.ARROW_UP]: `
    <path d="M12 4 L12 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M5 11 L12 4 L19 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.CROSSHAIR]: `
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
  `
};

/**
 * Creates an SVG icon element
 */
export function createSvgIcon(type: IconType, options: SvgIconOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const path = ICON_PATHS[type];
  
  if (!path) {
    console.warn(`Icon type ${type} not found`);
    return '';
  }
  
  const titleElement = opts.title ? `<title>${opts.title}</title>` : '';
  
  return `
    <svg 
      class="${opts.className}" 
      width="${opts.size}" 
      height="${opts.size}" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      ${opts.title ? `aria-label="${opts.title}"` : 'aria-hidden="true"'}
    >
      ${titleElement}
      ${path}
    </svg>
  `;
}

/**
 * Creates an SVG icon wrapped in a span for easier styling
 */
export function createIconElement(type: IconType, options: SvgIconOptions = {}): HTMLElement {
  const span = document.createElement('span');
  span.className = 'icon-wrapper';
  span.innerHTML = createSvgIcon(type, options);
  return span;
}

/**
 * Utility to add icon to existing button
 */
export function addIconToButton(button: HTMLElement, iconType: IconType, options: SvgIconOptions = {}): void {
  const icon = createSvgIcon(iconType, { ...options, className: 'button-icon' });
  const text = button.textContent || '';
  button.innerHTML = `${icon}<span class="button-text">${text}</span>`;
  button.classList.add('has-icon');
}

/**
 * Get icon CSS styles to be injected
 */
export function getIconStyles(): string {
  return `
    .svg-icon {
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
    }
    
    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .button-icon {
      margin-right: 6px;
      vertical-align: middle;
      transition: transform 0.2s ease;
    }
    
    .button-text {
      vertical-align: middle;
    }
    
    .ui-button.has-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .ui-button.has-icon:hover .button-icon {
      transform: scale(1.1);
    }
    
    .ui-button.icon-only {
      padding: 8px;
    }
    
    .ui-button.icon-only .button-icon {
      margin: 0;
    }
    
    /* Color variants */
    .tower-button .svg-icon {
      color: white;
    }
    
    .action-button .svg-icon {
      color: white;
    }
    
    .upgrade-button .svg-icon {
      color: white;
    }
    
    .close-button .svg-icon {
      color: white;
    }
    
    /* Disabled state */
    .ui-button:disabled .svg-icon {
      opacity: 0.5;
    }
  `;
}