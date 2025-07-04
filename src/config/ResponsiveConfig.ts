
const MOBILE_BREAKPOINT = 768;

export function isMobile(width: number): boolean {
  return width < MOBILE_BREAKPOINT;
}
