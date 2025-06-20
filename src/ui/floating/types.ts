export interface FloatingUIOptions {
  offset?: { x: number; y: number };
  anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  smoothing?: number;
  autoHide?: boolean;
  className?: string;
  persistent?: boolean;
  mobileScale?: number;
  zIndex?: number;
}

export type UIType = 'healthbar' | 'tooltip' | 'popup' | 'dialog' | 'custom';

export interface UITypeConfig {
  zIndex: number;
  class: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  x?: number;
  y?: number;
  position?: Position;
  getPosition?: () => Position;
}

export interface FloatingUIElementState {
  id: string;
  type: UIType;
  enabled: boolean;
  target: Entity | null;
  options: Required<FloatingUIOptions>;
}