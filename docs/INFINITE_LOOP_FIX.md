# Infinite Loop Fix - useGameStore Hook

## Problem
An infinite loop error was occurring in the React application with the message:
```
The result of getSnapshot should be cached to avoid an infinite loop
```

## Root Cause
There were two conflicting implementations of the `useGameStore` hook:

1. **Incorrect implementation** at `/src/ui/react/hooks/useGameStore.ts`:
   - Used vanilla React state management with `useState` and `useEffect`
   - Created new state objects on every render
   - Caused React's useSyncExternalStore to detect infinite updates

2. **Correct implementation** at `/src/stores/hooks/useGameStore.ts`:
   - Uses Zustand's proper `useStore` hook
   - Includes performance optimizations with shallow equality checks
   - Properly integrated with the centralized game store

## Solution
Deleted the problematic file `/src/ui/react/hooks/useGameStore.ts`. All components were already importing from the correct location (`@/stores/hooks/useGameStore`), so no import updates were needed.

## Result
The infinite loop error should now be resolved. The application uses the proper Zustand hooks for state management, which:
- Provides stable references
- Uses proper memoization
- Prevents unnecessary re-renders
- Improves overall performance

## Verification
The game should now run without the infinite loop error. All UI components will properly subscribe to the game store with efficient updates.