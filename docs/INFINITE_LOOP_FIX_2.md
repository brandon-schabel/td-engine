# Maximum Update Depth Exceeded - Fix Summary

## Problem
The application was throwing a "Maximum update depth exceeded" error with an infinite loop in the `GameOverlayUI` component.

## Root Cause
The `useGameUI` hook in `/src/stores/hooks/useGameStore.ts` was creating a new function reference on every render:

```typescript
// Problem: This creates a new function on every render
startNextWave: () => state.startWave(state.currentWave + 1)
```

Even though `useShallow` was being used for shallow equality checks, the function reference changed on every render because it captured `state.currentWave`, causing React to detect a change and re-render infinitely.

## Solution
Modified the `useGameUI` hook to return stable references:
1. Removed the `startNextWave` function that created new references
2. Added `currentWave` to the returned state
3. Returned the stable `startWave` function directly
4. Updated `GameUI.tsx` to call `startWave(currentWave + 1)` instead

## Changes Made

### 1. `/src/stores/hooks/useGameStore.ts`
- Removed: `startNextWave: () => state.startWave(state.currentWave + 1)`
- Added: `currentWave: state.currentWave` and `startWave: state.startWave`

### 2. `/src/ui/react/components/game/GameUI.tsx`
- Updated `handleStartWave` to use `startWave(currentWave + 1)`
- Updated destructuring to get `currentWave` and `startWave` instead of `startNextWave`

## Key Learning
When using Zustand with React, avoid creating new function references inside selectors. Either:
1. Return stable action references from the store
2. Create wrapper functions outside the selector
3. Use separate hooks for actions and state

This ensures that shallow equality checks work correctly and prevents infinite re-render loops.