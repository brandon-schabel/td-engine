/**
 * SVG Icon Library for Tower Defense Game
 * All icons are designed to work with currentColor for easy theming
 */

export enum IconType {
  // Tower Icons
  BASIC_TOWER = "BASIC_TOWER",
  SNIPER_TOWER = "SNIPER_TOWER",
  RAPID_TOWER = "RAPID_TOWER",
  WALL = "WALL",
  TOWER = "TOWER",
  SELL = "SELL",

  // Action Icons
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  PLAYER = "PLAYER",
  CLOSE = "CLOSE",
  CANCEL = "CANCEL",
  MENU = "MENU",
  COLLAPSE = "COLLAPSE",
  EXPAND = "EXPAND",
  BUILD = "BUILD",
  SETTINGS = "SETTINGS",

  // Upgrade Icons
  DAMAGE = "DAMAGE",
  RANGE = "RANGE",
  FIRE_RATE = "FIRE_RATE",
  RAPID_FIRE = "RAPID_FIRE",
  SPEED = "SPEED",
  HEALTH = "HEALTH",
  HEART = "HEART",

  // Audio Icons
  AUDIO_ON = "AUDIO_ON",
  AUDIO_OFF = "AUDIO_OFF",
  MUSIC = "MUSIC",
  SFX = "SFX",
  SOUND = "SOUND",

  // Control Icons
  KEYBOARD = "KEYBOARD",
  MOUSE = "MOUSE",
  GAMEPAD = "GAMEPAD",
  TOUCH = "TOUCH",

  // Camera/Zoom Icons
  ZOOM_IN = "ZOOM_IN",
  ZOOM_OUT = "ZOOM_OUT",
  ZOOM_FIT = "ZOOM_FIT",
  RESET_ZOOM = "RESET_ZOOM",
  CAMERA = "CAMERA",

  // UI Icons
  INFO = "INFO",
  WARNING = "WARNING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  COINS = "COINS",
  WAVE = "WAVE",
  STAR = "STAR",
  INVENTORY = "INVENTORY",
  GRID = "GRID",
  SHIELD = "SHIELD",
  CROWN = "CROWN",
  UPGRADE = "UPGRADE",
  CHECKMARK = "CHECKMARK",

  // Game state icons
  VICTORY = "VICTORY",
  GAME_OVER = "GAME_OVER",
  SKULL = "SKULL",
  TROPHY = "TROPHY",
  LEADERBOARD = "LEADERBOARD",
  SCORE = "SCORE",
  ENEMY = "ENEMY",
  CURRENCY = "CURRENCY",
  CLOCK = "CLOCK",
  RESTART = "RESTART",
  HOME = "HOME",
  MEDAL = "MEDAL",
  GAME_CONTROLLER = "GAME_CONTROLLER",

  // PowerUp Icons
  POWERUP_DAMAGE = "POWERUP_DAMAGE",
  POWERUP_SPEED = "POWERUP_SPEED",
  POWERUP_FIRE_RATE = "POWERUP_FIRE_RATE",
  POWERUP_SHIELD = "POWERUP_SHIELD",
  POWERUP_HEALTH_REGEN = "POWERUP_HEALTH_REGEN",

  // Mobile Control Icons
  ARROW_UP = "ARROW_UP",
  CROSSHAIR = "CROSSHAIR",

  // Settings Icons
  DIFFICULTY = "DIFFICULTY",
  MAP = "MAP",
  RESET = "RESET",
  TREE = "TREE",
  
  // Form/Input Icons
  SEARCH = "SEARCH",
  LOCK = "LOCK",
  EYE = "EYE",
  EYE_OFF = "EYE_OFF",
  CHEVRON_DOWN = "CHEVRON_DOWN",
  
  // Navigation Icons
  ARROW_LEFT = "ARROW_LEFT",
  
  // Action Icons (additional)
  SAVE = "SAVE",
  FLAG = "FLAG",
  REFRESH = "REFRESH",
  SPEAKER = "SPEAKER",
  XP = "XP"
}

interface SvgIconOptions {
  size?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
}

const DEFAULT_OPTIONS: Required<SvgIconOptions> = {
  size: 16,
  className: "svg-icon",
  strokeWidth: 2,
  title: "",
};

/**
 * SVG icon definitions
 */
export const ICON_PATHS: Record<IconType, string> = {
  // Tower Icons
  [IconType.BASIC_TOWER]: `
    <!-- Tower base -->
    <path d="M7 20 L7 16 L17 16 L17 20 L19 22 L5 22 Z" fill="currentColor" opacity="0.7"/>
    <!-- Tower body -->
    <rect x="8" y="8" width="8" height="8" fill="currentColor" opacity="0.8" rx="1"/>
    <!-- Battlements -->
    <path d="M8 8 L8 6 L10 6 L10 8 M11 8 L11 6 L13 6 L13 8 M14 8 L14 6 L16 6 L16 8" fill="currentColor"/>
    <!-- Cannon barrel -->
    <rect x="10" y="10" width="4" height="6" fill="currentColor" rx="0.5"/>
    <circle cx="12" cy="16" r="2" fill="currentColor" opacity="0.5"/>
    <!-- Details -->
    <rect x="9" y="11" width="1" height="1" fill="currentColor" opacity="0.3"/>
    <rect x="14" y="11" width="1" height="1" fill="currentColor" opacity="0.3"/>
  `,

  [IconType.SNIPER_TOWER]: `
    <!-- Tower base with elevation -->
    <path d="M8 22 L8 18 L16 18 L16 22 L18 23 L6 23 Z" fill="currentColor" opacity="0.6"/>
    <!-- Tall tower structure -->
    <rect x="9" y="10" width="6" height="8" fill="currentColor" opacity="0.8" rx="0.5"/>
    <!-- Observation deck -->
    <path d="M7 10 L17 10 L16 8 L8 8 Z" fill="currentColor" opacity="0.9"/>
    <!-- Sniper scope/crosshair -->
    <circle cx="12" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" stroke-width="1"/>
    <line x1="12" y1="8" x2="12" y2="10" stroke="currentColor" stroke-width="1"/>
    <line x1="8" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="1"/>
    <line x1="14" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="1"/>
    <circle cx="12" cy="6" r="1" fill="currentColor"/>
    <!-- Long rifle barrel -->
    <rect x="11" y="4" width="2" height="8" fill="currentColor" rx="0.5"/>
    <!-- Window detail -->
    <rect x="10" y="12" width="1" height="2" fill="currentColor" opacity="0.3"/>
    <rect x="13" y="12" width="1" height="2" fill="currentColor" opacity="0.3"/>
  `,

  [IconType.RAPID_TOWER]: `
    <!-- Tower base -->
    <path d="M8 20 L8 18 L16 18 L16 20 L17 22 L7 22 Z" fill="currentColor" opacity="0.6"/>
    <!-- Rotating turret base -->
    <circle cx="12" cy="15" r="5" fill="currentColor" opacity="0.7"/>
    <circle cx="12" cy="15" r="3" fill="currentColor" opacity="0.4"/>
    <!-- Multiple gun barrels in star pattern -->
    <g transform="translate(12,15)">
      <!-- Main barrel (top) -->
      <rect x="-1" y="-8" width="2" height="6" fill="currentColor" rx="0.5"/>
      <!-- Right barrel -->
      <rect x="2" y="-1" width="6" height="2" fill="currentColor" rx="0.5" transform="rotate(45)"/>
      <!-- Bottom barrel -->
      <rect x="-1" y="2" width="2" height="6" fill="currentColor" rx="0.5"/>
      <!-- Left barrel -->
      <rect x="-8" y="-1" width="6" height="2" fill="currentColor" rx="0.5" transform="rotate(-45)"/>
    </g>
    <!-- Muzzle flashes to show rapid fire -->
    <circle cx="12" cy="7" r="1" fill="currentColor" opacity="0.3"/>
    <circle cx="18" cy="13" r="1" fill="currentColor" opacity="0.3"/>
    <circle cx="6" cy="13" r="1" fill="currentColor" opacity="0.3"/>
    <!-- Central mechanism -->
    <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
  `,

  [IconType.WALL]: `
    <!-- Stone blocks pattern -->
    <!-- Bottom row -->
    <rect x="3" y="16" width="6" height="5" fill="currentColor" opacity="0.8" stroke="currentColor" stroke-width="0.5"/>
    <rect x="9" y="16" width="6" height="5" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="0.5"/>
    <rect x="15" y="16" width="6" height="5" fill="currentColor" opacity="0.8" stroke="currentColor" stroke-width="0.5"/>
    <!-- Middle row -->
    <rect x="6" y="11" width="6" height="5" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="0.5"/>
    <rect x="12" y="11" width="6" height="5" fill="currentColor" opacity="0.8" stroke="currentColor" stroke-width="0.5"/>
    <rect x="3" y="11" width="3" height="5" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="0.5"/>
    <rect x="18" y="11" width="3" height="5" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="0.5"/>
    <!-- Top row -->
    <rect x="3" y="6" width="6" height="5" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="0.5"/>
    <rect x="9" y="6" width="6" height="5" fill="currentColor" opacity="0.8" stroke="currentColor" stroke-width="0.5"/>
    <rect x="15" y="6" width="6" height="5" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="0.5"/>
    <!-- Battlements -->
    <rect x="4" y="3" width="3" height="3" fill="currentColor" opacity="0.9"/>
    <rect x="10.5" y="3" width="3" height="3" fill="currentColor" opacity="0.9"/>
    <rect x="17" y="3" width="3" height="3" fill="currentColor" opacity="0.9"/>
  `,

  [IconType.TOWER]: `
    <!-- Generic tower structure -->
    <!-- Base foundation -->
    <path d="M6 22 L6 20 L18 20 L18 22 L20 23 L4 23 Z" fill="currentColor" opacity="0.5"/>
    <!-- Main tower body - tapered -->
    <path d="M7 20 L8 8 L16 8 L17 20 Z" fill="currentColor" opacity="0.8"/>
    <!-- Tower top/roof -->
    <path d="M6 8 L12 3 L18 8 Z" fill="currentColor" opacity="0.9"/>
    <!-- Flag on top -->
    <rect x="11.5" y="1" width="1" height="4" fill="currentColor"/>
    <path d="M12.5 1 L16 2 L12.5 3 Z" fill="currentColor" opacity="0.7"/>
    <!-- Windows -->
    <rect x="10" y="10" width="2" height="3" fill="currentColor" opacity="0.3"/>
    <rect x="13" y="10" width="2" height="3" fill="currentColor" opacity="0.3"/>
    <rect x="10" y="15" width="2" height="3" fill="currentColor" opacity="0.3"/>
    <rect x="13" y="15" width="2" height="3" fill="currentColor" opacity="0.3"/>
    <!-- Door -->
    <path d="M10 20 L10 17 A2 2 0 0 1 14 17 L14 20 Z" fill="currentColor" opacity="0.4"/>
  `,

  [IconType.SELL]: `
    <!-- Dollar sign in circle -->
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 6 L12 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 8 C9 7 10 6 12 6 C14 6 15 7 15 8 C15 9 14 10 12 10 C10 10 9 11 9 12 C9 13 10 14 12 14 C14 14 15 13 15 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <!-- Arrow indicating selling/down -->
    <path d="M7 20 L12 23 L17 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
    <!-- Head with helmet -->
    <circle cx="12" cy="6" r="4" fill="currentColor" opacity="0.9"/>
    <path d="M8 4 C8 2 10 1 12 1 C14 1 16 2 16 4" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
    <!-- Face details -->
    <circle cx="10" cy="5" r="0.5" fill="white"/>
    <circle cx="14" cy="5" r="0.5" fill="white"/>
    <!-- Body with armor -->
    <path d="M6 11 C6 10 8 9 12 9 C16 9 18 10 18 11 L18 16 C18 17 17 18 16 18 L8 18 C7 18 6 17 6 16 Z" fill="currentColor" opacity="0.8"/>
    <!-- Armor details -->
    <rect x="10" y="11" width="4" height="5" fill="currentColor" opacity="0.4" rx="0.5"/>
    <!-- Arms -->
    <rect x="4" y="12" width="3" height="6" fill="currentColor" opacity="0.7" rx="1"/>
    <rect x="17" y="12" width="3" height="6" fill="currentColor" opacity="0.7" rx="1"/>
    <!-- Legs -->
    <rect x="8" y="17" width="3" height="5" fill="currentColor" opacity="0.7" rx="1"/>
    <rect x="13" y="17" width="3" height="5" fill="currentColor" opacity="0.7" rx="1"/>
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
    <!-- Simple hammer icon -->
    <!-- Handle -->
    <rect x="10" y="8" width="4" height="12" fill="currentColor" rx="1"/>
    <!-- Head -->
    <rect x="7" y="4" width="10" height="6" fill="currentColor" rx="1"/>
    <!-- Claw detail -->
    <path d="M7 4 L7 3 Q7 2 8 2 L9 2 L9 4 M15 4 L15 2 L16 2 Q17 2 17 3 L17 4" fill="currentColor"/>
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

  [IconType.RAPID_FIRE]: `
    <path d="M5 12L7 8L9 12L7 16Z" fill="currentColor"/>
    <path d="M10 12L12 8L14 12L12 16Z" fill="currentColor" opacity="0.7"/>
    <path d="M15 12L17 8L19 12L17 16Z" fill="currentColor" opacity="0.4"/>
  `,

  [IconType.SPEED]: `
    <path d="M12 2 C6 2 2 8 2 12 C2 16 4 18 6 18 C8 18 9 16 9 16 C9 16 10 18 12 18 C14 18 15 16 15 16 C15 16 16 18 18 18 C20 18 22 16 22 12 C22 8 18 2 12 2" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="13" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,

  [IconType.HEALTH]: `
    <path d="M12 21 C12 21 3 13.5 3 8.5 C3 5.5 5.5 3 8.5 3 C10.5 3 12 4 12 4 C12 4 13.5 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 13.5 12 21 12 21 Z" fill="currentColor"/>
  `,

  [IconType.HEART]: `
    <!-- Heart with gradient effect -->
    <path d="M12 21 C12 21 3 13.5 3 8.5 C3 5.5 5.5 3 8.5 3 C10.5 3 12 4 12 4 C12 4 13.5 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 13.5 12 21 12 21 Z" fill="currentColor" opacity="0.9"/>
    <!-- Highlight -->
    <ellipse cx="9" cy="8" rx="2" ry="2.5" fill="white" opacity="0.3"/>
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

  [IconType.SOUND]: `
    <path d="M11 5 L6 9 L2 9 L2 15 L6 15 L11 19 Z" fill="currentColor"/>
    <path d="M15.5 8.5 A4.5 4.5 0 0 1 15.5 15.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 6 A8 8 0 0 1 19 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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

  [IconType.ZOOM_IN]: `
<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
`,
  [IconType.ZOOM_OUT]: `
<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
`,
  [IconType.ZOOM_FIT]: `
<rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3,3"/>
<rect x="7" y="7" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"/>
<path d="M10 10 L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<path d="M14 10 L10 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
`,
  // New Reset Magnifying Glass Icon

  [IconType.RESET_ZOOM]: `
<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
<path d="M6.5 8.5 A4 4 0 1 1 8.5 13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
<polyline points="6.5,6.5 6.5,8.5 8.5,8.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
    <!-- Stack of coins with 3D effect -->
    <!-- Bottom coin -->
    <ellipse cx="12" cy="16" rx="7" ry="2.5" fill="currentColor" opacity="0.6"/>
    <path d="M5 16 L5 18 C5 19.5 8 20 12 20 C16 20 19 19.5 19 18 L19 16" fill="currentColor" opacity="0.5"/>
    <!-- Middle coin -->
    <ellipse cx="12" cy="12" rx="7" ry="2.5" fill="currentColor" opacity="0.7"/>
    <path d="M5 12 L5 14 C5 15.5 8 16 12 16 C16 16 19 15.5 19 14 L19 12" fill="currentColor" opacity="0.6"/>
    <!-- Top coin -->
    <ellipse cx="12" cy="8" rx="7" ry="2.5" fill="currentColor" opacity="0.9"/>
    <path d="M5 8 L5 10 C5 11.5 8 12 12 12 C16 12 19 11.5 19 10 L19 8" fill="currentColor" opacity="0.8"/>
    <!-- Dollar sign on top coin -->
    <text x="12" y="10" text-anchor="middle" font-size="6" fill="white" font-weight="bold">$</text>
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

  [IconType.SKULL]: `
    <!-- Skull shape -->
    <path d="M12 2 C7 2 3 6 3 11 C3 14 4 16 5 17 L5 19 C5 20 6 21 7 21 L17 21 C18 21 19 20 19 19 L19 17 C20 16 21 14 21 11 C21 6 17 2 12 2 Z" fill="currentColor" opacity="0.9"/>
    <!-- Eye sockets -->
    <circle cx="8" cy="10" r="2.5" fill="black" opacity="0.8"/>
    <circle cx="16" cy="10" r="2.5" fill="black" opacity="0.8"/>
    <!-- Glowing eyes -->
    <circle cx="8" cy="10" r="0.5" fill="red" opacity="0.9"/>
    <circle cx="16" cy="10" r="0.5" fill="red" opacity="0.9"/>
    <!-- Nose -->
    <path d="M12 13 L10 15 L12 16 L14 15 Z" fill="black" opacity="0.7"/>
    <!-- Teeth -->
    <rect x="8" y="17" width="2" height="3" fill="white" opacity="0.9" rx="0.5"/>
    <rect x="11" y="17" width="2" height="3" fill="white" opacity="0.9" rx="0.5"/>
    <rect x="14" y="17" width="2" height="3" fill="white" opacity="0.9" rx="0.5"/>
    <!-- Cracks for damage effect -->
    <path d="M6 6 L7 8 L6 10" fill="none" stroke="black" stroke-width="0.5" opacity="0.3"/>
  `,

  [IconType.TROPHY]: `
    <!-- Trophy cup -->
    <path d="M6 8 L6 14 C6 17 8 19 12 19 C16 19 18 17 18 14 L18 8 Z" fill="currentColor" opacity="0.9"/>
    <!-- Handles -->
    <path d="M6 9 L3 9 C2 9 1 8 1 7 L1 6 C1 5 2 4 3 4 L6 4" fill="currentColor" opacity="0.7"/>
    <path d="M18 9 L21 9 C22 9 23 8 23 7 L23 6 C23 5 22 4 21 4 L18 4" fill="currentColor" opacity="0.7"/>
    <!-- Base -->
    <rect x="10" y="18" width="4" height="3" fill="currentColor" opacity="0.8"/>
    <path d="M8 21 L16 21 L17 22 L7 22 Z" fill="currentColor" opacity="0.7"/>
    <!-- Star on trophy -->
    <path d="M12 10 L13 12 L15 12 L13.5 13.5 L14 15.5 L12 14 L10 15.5 L10.5 13.5 L9 12 L11 12 Z" fill="white" opacity="0.8"/>
    <!-- Shine effect -->
    <ellipse cx="10" cy="10" rx="2" ry="3" fill="white" opacity="0.3"/>
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
    <!-- Menacing head with horns -->
    <circle cx="12" cy="8" r="5" fill="currentColor" opacity="0.9"/>
    <path d="M7 3 L5 1 M17 3 L19 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <!-- Evil eyes -->
    <circle cx="9" cy="7" r="1.5" fill="red" opacity="0.8"/>
    <circle cx="15" cy="7" r="1.5" fill="red" opacity="0.8"/>
    <circle cx="9" cy="7" r="0.5" fill="white"/>
    <circle cx="15" cy="7" r="0.5" fill="white"/>
    <!-- Mouth/teeth -->
    <path d="M8 10 Q12 12 16 10" fill="none" stroke="white" stroke-width="1"/>
    <path d="M9 10 L9 11 M11 10 L11 11 M13 10 L13 11 M15 10 L15 11" stroke="white" stroke-width="0.5"/>
    <!-- Spiky body -->
    <path d="M7 13 L6 14 L7 15 L6 16 L7 17 L6 18 L7 19 L12 20 L17 19 L18 18 L17 17 L18 16 L17 15 L18 14 L17 13 Z" fill="currentColor" opacity="0.8"/>
    <!-- Claws/arms -->
    <path d="M5 15 L3 13 L2 14 L3 16 L5 17" fill="currentColor" opacity="0.7"/>
    <path d="M19 15 L21 13 L22 14 L21 16 L19 17" fill="currentColor" opacity="0.7"/>
    <!-- Legs -->
    <path d="M9 20 L8 23 L10 23 Z" fill="currentColor" opacity="0.7"/>
    <path d="M15 20 L14 23 L16 23 Z" fill="currentColor" opacity="0.7"/>
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
  `,

  // Settings Icons
  [IconType.DIFFICULTY]: `
    <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  `,

  [IconType.MAP]: `
    <path d="M1 6 L1 18 L8 21 L16 18 L23 21 L23 9 L16 6 L8 9 L1 6" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="9" x2="8" y2="21" stroke="currentColor" stroke-width="2"/>
    <line x1="16" y1="6" x2="16" y2="18" stroke="currentColor" stroke-width="2"/>
  `,

  [IconType.TREE]: `
    <path d="M12 2 L7 8 L9 8 L5 14 L8 14 L4 20 L20 20 L16 14 L19 14 L15 8 L17 8 Z" fill="currentColor"/>
    <rect x="10" y="18" width="4" height="4" fill="currentColor"/>
  `,

  [IconType.RESET]: `
    <path d="M20 11 A8 8 0 1 1 12 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 3 L20 11 L12 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  // Form/Input Icons
  [IconType.SEARCH]: `
    <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M21 21 L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.LOCK]: `
    <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M7 11 V7 A5 5 0 0 1 17 7 V11" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  `,
  
  [IconType.EYE]: `
    <path d="M1 12 S5 5 12 5 S23 12 23 12 S19 19 12 19 S1 12 1 12" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  
  [IconType.EYE_OFF]: `
    <path d="M17.94 17.94 A10.07 10.07 0 0 1 12 20 C5 20 1 12 1 12 A13.11 13.11 0 0 1 5.06 6.06" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9.9 4.24 A9.12 9.12 0 0 1 12 4 C19 4 23 12 23 12 A11.82 11.82 0 0 1 20.17 16.62" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  
  [IconType.CHEVRON_DOWN]: `
    <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  
  [IconType.ARROW_LEFT]: `
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,
  
  [IconType.SAVE]: `
    <path d="M19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16L21 8V19C21 20.1 20.1 21 19 21Z" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M17 21V13H7V21M7 3V8H15" stroke="currentColor" stroke-width="2" fill="none"/>
  `,
  
  [IconType.FLAG]: `
    <path d="M4 15V21M4 4V8M4 8V15L9 13L14 15V8L9 10L4 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,
  
  [IconType.REFRESH]: `
    <path d="M21 2V8H15M3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.30367 19 6.34267L21 8M3 22V16H9M21 12C21 16.9706 16.9706 21 12 21C9.17273 21 6.64996 19.6963 5 17.6573L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,
  
  [IconType.SPEAKER]: `
    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,
  [IconType.XP]: `
    <path d="M12 2L12 22M5 9L19 9M5 15L19 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
};

/**
 * Creates an SVG icon element
 */
export function createSvgIcon(
  type: IconType,
  options: SvgIconOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const path = ICON_PATHS[type];

  if (!path) {
    console.warn(`Icon type ${type} not found`);
    return "";
  }

  const titleElement = opts.title ? `<title>${opts.title}</title>` : "";

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
export function createIconElement(
  type: IconType,
  options: SvgIconOptions = {}
): HTMLElement {
  const span = document.createElement("span");
  span.className = "icon-wrapper";
  span.innerHTML = createSvgIcon(type, options);
  return span;
}

/**
 * Utility to add icon to existing button
 */
export function addIconToButton(
  button: HTMLElement,
  iconType: IconType,
  options: SvgIconOptions = {}
): void {
  const icon = createSvgIcon(iconType, {
    ...options,
    className: "button-icon",
  });
  const text = button.textContent || "";
  button.innerHTML = `${icon}<span class="button-text">${text}</span>`;
  button.classList.add("has-icon");
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
