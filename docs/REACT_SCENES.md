# React Scene System Migration

## Overview

The game's scene system has been migrated from DOM-based classes to React components, providing better state management, cleaner code, and improved developer experience.

## Architecture

### Scene Infrastructure

1. **SceneContext & SceneProvider** - Manages scene state and transitions
2. **SceneRouter** - Handles scene routing and component rendering
3. **SceneTransition** - Animated transitions using Framer Motion
4. **Scene Components** - Base components for consistent layout

### Scene Components

All scenes are now React components:

- **MainMenu** - Entry point with animated background
- **PreGameConfig** - Game setup and configuration
- **SettingsScene** - Wrapper for Settings component
- **Leaderboard** - High scores display
- **GameOverScene** - Game over screen wrapper

## Usage

### Basic Setup

```tsx
import { SceneProvider, SceneRouter } from '@/ui/react/scenes';
import { MainMenu, PreGameConfig, SettingsScene } from '@/ui/react/scenes';

const scenes = {
  mainMenu: { component: MainMenu },
  preGameConfig: { component: PreGameConfig },
  settings: { component: SettingsScene },
  // ... other scenes
};

function App() {
  return (
    <SceneProvider initialScene="mainMenu">
      <SceneRouter scenes={scenes} audioManager={audioManager} />
    </SceneProvider>
  );
}
```

### Scene Navigation

```tsx
import { useScene } from '@/ui/react/scenes';

function MyComponent() {
  const { switchToScene, goBack } = useScene();

  // Navigate to a scene
  const handleSettings = () => {
    switchToScene('settings', {
      type: TransitionType.SLIDE_UP,
      duration: 300
    });
  };

  // Go back to previous scene
  const handleBack = () => {
    goBack();
  };
}
```

### Creating New Scenes

```tsx
import { Scene, SceneContainer, SceneHeader } from '@/ui/react/scenes';

export const MyScene: React.FC<SceneProps> = ({ audioManager }) => {
  const { goBack } = useScene();

  return (
    <Scene>
      <SceneHeader
        title="My Scene"
        leftAction={<Button onClick={goBack}>Back</Button>}
      />
      <SceneContainer centered>
        {/* Scene content */}
      </SceneContainer>
    </Scene>
  );
};
```

## Migration Benefits

1. **Declarative UI** - React components instead of DOM manipulation
2. **Better State Management** - React hooks and context
3. **Type Safety** - Full TypeScript support
4. **Reusable Components** - Shared UI components
5. **Easier Testing** - Component testing with React Testing Library
6. **Better Performance** - React's efficient rendering

## Transition Types

Available transition animations:

- `TransitionType.FADE` - Fade in/out
- `TransitionType.SLIDE_LEFT` - Slide from right to left
- `TransitionType.SLIDE_RIGHT` - Slide from left to right
- `TransitionType.SLIDE_UP` - Slide from bottom to top
- `TransitionType.SLIDE_DOWN` - Slide from top to bottom
- `TransitionType.NONE` - Instant transition

## CSS Animations

Complex animations are preserved using CSS modules:

```css
/* MainMenu.module.css */
.backgroundGradient {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

## Game UI Components

The game UI has also been converted to React:

- **GameUI** - Main game interface controller
- **ControlBar** - Bottom control buttons
- **TowerPlacementIndicator** - Mobile tower placement helper
- **PlayerLevelDisplay** - Player level and XP display

## Next Steps

1. Remove old DOM-based scene files
2. Update game initialization to use React scenes
3. Add more scene-specific features
4. Implement scene preloading for better performance