// Mock for hammerjs to prevent errors in test environment
import { vi } from 'vitest';

const createMockHammerInstance = () => ({
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
  stop: vi.fn(),
  get: vi.fn(() => ({
    set: vi.fn()
  })),
  add: vi.fn(),
  remove: vi.fn(),
  set: vi.fn(),
  emit: vi.fn(),
  recognizers: [],
});

const Hammer = vi.fn((element: any) => createMockHammerInstance());

// Add static methods and constants
Hammer.Manager = vi.fn((element: any) => createMockHammerInstance());
Hammer.Pan = vi.fn();
Hammer.Pinch = vi.fn();
Hammer.Tap = vi.fn();
Hammer.Press = vi.fn();
Hammer.Swipe = vi.fn();

// Direction constants
Hammer.DIRECTION_NONE = 1;
Hammer.DIRECTION_LEFT = 2;
Hammer.DIRECTION_RIGHT = 4;
Hammer.DIRECTION_UP = 8;
Hammer.DIRECTION_DOWN = 16;
Hammer.DIRECTION_HORIZONTAL = 6;
Hammer.DIRECTION_VERTICAL = 24;
Hammer.DIRECTION_ALL = 30;

// Input constants
Hammer.INPUT_START = 1;
Hammer.INPUT_MOVE = 2;
Hammer.INPUT_END = 4;
Hammer.INPUT_CANCEL = 8;

// Recognizer states
Hammer.STATE_POSSIBLE = 1;
Hammer.STATE_BEGAN = 2;
Hammer.STATE_CHANGED = 4;
Hammer.STATE_ENDED = 8;
Hammer.STATE_RECOGNIZED = 8;
Hammer.STATE_CANCELLED = 16;
Hammer.STATE_FAILED = 32;

export default Hammer;