/**
 * Helper function to add both click and touch event support to an element
 * @param element The HTML element to add events to
 * @param handler The event handler function
 * @param options Additional options for the event listener
 */
export function addClickAndTouchSupport(
  element: HTMLElement,
  handler: () => void,
  options?: AddEventListenerOptions
): void {
  // Add click event
  element.addEventListener('click', handler, options);
  
  // Add touch event with preventDefault to avoid double-firing
  element.addEventListener('touchend', (e) => {
    e.preventDefault();
    handler();
  }, options);
}

/**
 * Helper function to remove both click and touch event listeners
 * @param element The HTML element to remove events from
 * @param handler The event handler function
 * @param options Additional options for the event listener
 */
export function removeClickAndTouchSupport(
  element: HTMLElement,
  handler: () => void,
  options?: AddEventListenerOptions
): void {
  element.removeEventListener('click', handler, options);
  element.removeEventListener('touchend', handler, options);
}