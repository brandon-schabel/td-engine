export interface FloatingUIOptions {
  offset?: { x: number; y: number };
  anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  anchorElement?: HTMLElement; // DOM element to anchor to
  smoothing?: number;
  autoHide?: boolean;
  className?: string;
  persistent?: boolean;
  mobileScale?: number;
  zIndex?: number;
  screenSpace?: boolean; // If true, position is in screen coordinates, not world coordinates
  draggable?: boolean; // Enable drag functionality
  dragHandle?: HTMLElement | string; // Element or selector for drag handle
  persistPosition?: boolean; // Save position to localStorage
  positionKey?: string; // Custom localStorage key for position
  onDragStart?: (element: any) => void; // Callback when drag starts
  onDrag?: (element: any, x: number, y: number) => void; // Callback during drag
  onDragEnd?: (element: any, x: number, y: number) => void; // Callback when drag ends
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
  options: FloatingUIOptions & {
    offset: { x: number; y: number };
    anchor: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    smoothing: number;
    autoHide: boolean;
    className: string;
    persistent: boolean;
    mobileScale: number;
    zIndex: number;
    screenSpace: boolean;
    draggable: boolean;
    dragHandle?: HTMLElement | string;
    persistPosition: boolean;
    positionKey?: string;
    onDragStart?: (element: any) => void;
    onDrag?: (element: any, x: number, y: number) => void;
    onDragEnd?: (element: any, x: number, y: number) => void;
  };
}

export interface StoredPosition {
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
  version: string;
}