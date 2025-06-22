# Tower UI Timing Fix

## Problem
The tower upgrade UI was closing immediately after opening when the mouse button was released, making it impossible to interact with the UI.

## Solution
Added timing protection to prevent the UI from closing too quickly after opening:

1. **Added open time tracking**: Records when the UI opens with `this.openTime = Date.now()`

2. **Minimum open duration**: Set to 300ms - the UI cannot be closed by click-outside during this period

3. **Protection in click handler**: 
   ```typescript
   const timeSinceOpen = Date.now() - this.openTime;
   if (timeSinceOpen < this.minOpenDuration) {
     return;
   }
   ```

4. **Delayed event listener registration**: Event listeners are added after 50ms to avoid catching the same click that opened the UI

5. **Multiple event types**: Now listens to mousedown, mouseup, and click events to catch all cases

## Result
- The UI stays open for at least 300ms after being shown
- This prevents accidental closure when clicking on a tower
- Users can now interact with the UI normally
- Click-outside still works but only after the minimum duration has passed