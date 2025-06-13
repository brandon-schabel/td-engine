/**
 * Core types and interfaces for the UI component system
 */

// Component props and state
export interface ComponentProps {
  id?: string;
  className?: string;
  style?: ComponentStyle;
  children?: any;
  [key: string]: any;
}

export interface ComponentState {
  [key: string]: any;
}

// Style types
export type ComponentStyle = Partial<CSSStyleDeclaration>;

// Touch and pointer events
export interface UnifiedPointerEvent {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  identifier: number;
  type: 'mouse' | 'touch' | 'pen';
  pressure: number;
  isPrimary: boolean;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
}

// Gesture types
export interface GestureEvent {
  type: 'tap' | 'doubletap' | 'press' | 'pan' | 'swipe' | 'pinch' | 'rotate';
  center: { x: number; y: number };
  deltaX: number;
  deltaY: number;
  distance: number;
  angle: number;
  velocity: number;
  velocityX: number;
  velocityY: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
  scale: number;
  rotation: number;
  target: HTMLElement;
  pointers: UnifiedPointerEvent[];
}

// Theme types
export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  transitions: ThemeTransitions;
  breakpoints: ThemeBreakpoints;
  zIndex: ThemeZIndex;
  touch: ThemeTouch;
  animations: ThemeAnimations;
  responsive: ThemeResponsive;
}

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryText: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryText: string;
  
  // UI colors
  background: string;
  surface: string;
  surfaceAlt: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Game-specific colors
  tower: string;
  enemy: string;
  player: string;
  projectile: string;
  currency: string;
  health: string;
  mana: string;
}

export interface ThemeSpacing {
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMonospace: string;
  fontSize: {
    xxs: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
  };
  fontWeight: {
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
  none: string;
}

export interface ThemeTransitions {
  fast: string;
  normal: string;
  slow: string;
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    sharp: string;
  };
}

export interface ThemeBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeZIndex {
  background: number;
  content: number;
  overlay: number;
  modal: number;
  popover: number;
  tooltip: number;
  notification: number;
  virtualControls: number;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  type: NotificationType;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  dismissible?: boolean;
  icon?: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Modal types
export interface ModalOptions {
  title?: string;
  content: string | HTMLElement;
  footer?: string | HTMLElement;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  focus?: boolean;
  animation?: boolean;
}

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: (event: UnifiedPointerEvent) => void;
}

// Form types
export interface FormFieldProps extends ComponentProps {
  label?: string;
  value?: any;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Layout types
export interface GridProps extends ComponentProps {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string | number;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export interface FlexProps extends ComponentProps {
  direction?: 'row' | 'column';
  wrap?: boolean;
  gap?: string | number;
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

// Touch-specific theme interfaces
export interface ThemeTouch {
  minTargetSize: string;
  recommendedTargetSize: string;
  comfortableTargetSize: string;
  spacing: {
    tap: string;
    thumb: string;
    palm: string;
  };
  states: {
    pressed: {
      scale: number;
      opacity: number;
      background: string;
    };
    hover: {
      scale: number;
      background: string;
    };
    focus: {
      outline: string;
      outlineOffset: string;
    };
    disabled: {
      opacity: number;
      cursor: string;
    };
  };
  haptics: {
    light: number[];
    medium: number[];
    heavy: number[];
    success: number[];
    error: number[];
  };
  gestures: {
    tapTimeout: number;
    pressTimeout: number;
    swipeThreshold: number;
    pinchThreshold: number;
    panThreshold: number;
  };
  virtualControls: {
    joystick: {
      size: string;
      innerSize: string;
      deadzone: number;
      sensitivity: number;
      background: string;
      border: string;
      activeBackground: string;
    };
    button: {
      size: string;
      background: string;
      border: string;
      activeBackground: string;
      shadow: string;
    };
  };
  safeAreas: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

export interface ThemeAnimations {
  tapScale: {
    duration: string;
    easing: string;
    keyframes: Record<string, any>;
  };
  ripple: {
    duration: string;
    easing: string;
    keyframes: Record<string, any>;
  };
  slideInLeft: {
    duration: string;
    easing: string;
    keyframes: Record<string, any>;
  };
  bounce: {
    duration: string;
    easing: string;
    keyframes: Record<string, any>;
  };
  shake: {
    duration: string;
    easing: string;
    keyframes: Record<string, any>;
  };
}

export interface ThemeResponsive {
  mobile: {
    fontSize: ThemeTypography['fontSize'];
    spacing: ThemeSpacing;
    borderRadius: ThemeBorderRadius;
  };
  compact: {
    spacing: ThemeSpacing;
    touch: {
      minTargetSize: string;
      recommendedTargetSize: string;
    };
  };
  comfortable: {
    spacing: ThemeSpacing;
    touch: {
      minTargetSize: string;
      recommendedTargetSize: string;
    };
  };
}