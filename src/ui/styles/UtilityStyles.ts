/**
 * Utility Styles - Tailwind-inspired utility classes
 * Single-purpose CSS classes that use design tokens from StyleManager
 */

import { styleManager } from './StyleManager';

const utilityStyles = `
  /* --- LAYOUT --- */
  .block { display: block; }
  .inline-block { display: inline-block; }
  .inline { display: inline; }
  .flex { display: flex; }
  .inline-flex { display: inline-flex; }
  .grid { display: grid; }
  .hidden { display: none; }
  
  /* --- POSITIONING --- */
  .static { position: static; }
  .fixed { position: fixed; }
  .absolute { position: absolute; }
  .relative { position: relative; }
  .sticky { position: sticky; }
  
  .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
  .inset-x-0 { left: 0; right: 0; }
  .inset-y-0 { top: 0; bottom: 0; }
  
  /* --- FLEXBOX --- */
  .flex-row { flex-direction: row; }
  .flex-row-reverse { flex-direction: row-reverse; }
  .flex-col { flex-direction: column; }
  .flex-col-reverse { flex-direction: column-reverse; }
  
  .flex-wrap { flex-wrap: wrap; }
  .flex-wrap-reverse { flex-wrap: wrap-reverse; }
  .flex-nowrap { flex-wrap: nowrap; }
  
  .items-start { align-items: flex-start; }
  .items-end { align-items: flex-end; }
  .items-center { align-items: center; }
  .items-baseline { align-items: baseline; }
  .items-stretch { align-items: stretch; }
  
  .justify-start { justify-content: flex-start; }
  .justify-end { justify-content: flex-end; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .justify-around { justify-content: space-around; }
  .justify-evenly { justify-content: space-evenly; }
  
  .flex-1 { flex: 1 1 0%; }
  .flex-auto { flex: 1 1 auto; }
  .flex-initial { flex: 0 1 auto; }
  .flex-none { flex: none; }
  
  /* --- GRID --- */
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  
  /* --- GAP --- */
  .gap-0 { gap: var(--spacing-0); }
  .gap-1 { gap: var(--spacing-1); }
  .gap-2 { gap: var(--spacing-2); }
  .gap-3 { gap: var(--spacing-3); }
  .gap-4 { gap: var(--spacing-4); }
  .gap-5 { gap: var(--spacing-5); }
  .gap-6 { gap: var(--spacing-6); }
  .gap-8 { gap: var(--spacing-8); }
  
  .gap-x-0 { column-gap: var(--spacing-0); }
  .gap-x-1 { column-gap: var(--spacing-1); }
  .gap-x-2 { column-gap: var(--spacing-2); }
  .gap-x-3 { column-gap: var(--spacing-3); }
  .gap-x-4 { column-gap: var(--spacing-4); }
  
  .gap-y-0 { row-gap: var(--spacing-0); }
  .gap-y-1 { row-gap: var(--spacing-1); }
  .gap-y-2 { row-gap: var(--spacing-2); }
  .gap-y-3 { row-gap: var(--spacing-3); }
  .gap-y-4 { row-gap: var(--spacing-4); }
  
  /* --- SPACING (PADDING) --- */
  .p-0 { padding: var(--spacing-0); }
  .p-1 { padding: var(--spacing-1); }
  .p-2 { padding: var(--spacing-2); }
  .p-3 { padding: var(--spacing-3); }
  .p-4 { padding: var(--spacing-4); }
  .p-5 { padding: var(--spacing-5); }
  .p-6 { padding: var(--spacing-6); }
  .p-8 { padding: var(--spacing-8); }
  
  .px-0 { padding-left: var(--spacing-0); padding-right: var(--spacing-0); }
  .px-1 { padding-left: var(--spacing-1); padding-right: var(--spacing-1); }
  .px-2 { padding-left: var(--spacing-2); padding-right: var(--spacing-2); }
  .px-3 { padding-left: var(--spacing-3); padding-right: var(--spacing-3); }
  .px-4 { padding-left: var(--spacing-4); padding-right: var(--spacing-4); }
  .px-5 { padding-left: var(--spacing-5); padding-right: var(--spacing-5); }
  .px-6 { padding-left: var(--spacing-6); padding-right: var(--spacing-6); }
  
  .py-0 { padding-top: var(--spacing-0); padding-bottom: var(--spacing-0); }
  .py-1 { padding-top: var(--spacing-1); padding-bottom: var(--spacing-1); }
  .py-2 { padding-top: var(--spacing-2); padding-bottom: var(--spacing-2); }
  .py-3 { padding-top: var(--spacing-3); padding-bottom: var(--spacing-3); }
  .py-4 { padding-top: var(--spacing-4); padding-bottom: var(--spacing-4); }
  .py-5 { padding-top: var(--spacing-5); padding-bottom: var(--spacing-5); }
  
  .pt-0 { padding-top: var(--spacing-0); }
  .pt-1 { padding-top: var(--spacing-1); }
  .pt-2 { padding-top: var(--spacing-2); }
  .pt-3 { padding-top: var(--spacing-3); }
  .pt-4 { padding-top: var(--spacing-4); }
  
  .pr-0 { padding-right: var(--spacing-0); }
  .pr-1 { padding-right: var(--spacing-1); }
  .pr-2 { padding-right: var(--spacing-2); }
  .pr-3 { padding-right: var(--spacing-3); }
  .pr-4 { padding-right: var(--spacing-4); }
  
  .pb-0 { padding-bottom: var(--spacing-0); }
  .pb-1 { padding-bottom: var(--spacing-1); }
  .pb-2 { padding-bottom: var(--spacing-2); }
  .pb-3 { padding-bottom: var(--spacing-3); }
  .pb-4 { padding-bottom: var(--spacing-4); }
  
  .pl-0 { padding-left: var(--spacing-0); }
  .pl-1 { padding-left: var(--spacing-1); }
  .pl-2 { padding-left: var(--spacing-2); }
  .pl-3 { padding-left: var(--spacing-3); }
  .pl-4 { padding-left: var(--spacing-4); }
  
  /* Named spacing utilities */
  .p-xs { padding: var(--spacing-xs); }
  .p-sm { padding: var(--spacing-sm); }
  .p-md { padding: var(--spacing-md); }
  .p-lg { padding: var(--spacing-lg); }
  .p-xl { padding: var(--spacing-xl); }
  
  /* --- SPACING (MARGIN) --- */
  .m-0 { margin: var(--spacing-0); }
  .m-1 { margin: var(--spacing-1); }
  .m-2 { margin: var(--spacing-2); }
  .m-3 { margin: var(--spacing-3); }
  .m-4 { margin: var(--spacing-4); }
  .m-5 { margin: var(--spacing-5); }
  .m-6 { margin: var(--spacing-6); }
  .m-8 { margin: var(--spacing-8); }
  .m-auto { margin: auto; }
  
  .mx-0 { margin-left: var(--spacing-0); margin-right: var(--spacing-0); }
  .mx-1 { margin-left: var(--spacing-1); margin-right: var(--spacing-1); }
  .mx-2 { margin-left: var(--spacing-2); margin-right: var(--spacing-2); }
  .mx-3 { margin-left: var(--spacing-3); margin-right: var(--spacing-3); }
  .mx-4 { margin-left: var(--spacing-4); margin-right: var(--spacing-4); }
  .mx-auto { margin-left: auto; margin-right: auto; }
  
  .my-0 { margin-top: var(--spacing-0); margin-bottom: var(--spacing-0); }
  .my-1 { margin-top: var(--spacing-1); margin-bottom: var(--spacing-1); }
  .my-2 { margin-top: var(--spacing-2); margin-bottom: var(--spacing-2); }
  .my-3 { margin-top: var(--spacing-3); margin-bottom: var(--spacing-3); }
  .my-4 { margin-top: var(--spacing-4); margin-bottom: var(--spacing-4); }
  
  .mt-0 { margin-top: var(--spacing-0); }
  .mt-1 { margin-top: var(--spacing-1); }
  .mt-2 { margin-top: var(--spacing-2); }
  .mt-3 { margin-top: var(--spacing-3); }
  .mt-4 { margin-top: var(--spacing-4); }
  
  .mr-0 { margin-right: var(--spacing-0); }
  .mr-1 { margin-right: var(--spacing-1); }
  .mr-2 { margin-right: var(--spacing-2); }
  .mr-3 { margin-right: var(--spacing-3); }
  .mr-4 { margin-right: var(--spacing-4); }
  
  .mb-0 { margin-bottom: var(--spacing-0); }
  .mb-1 { margin-bottom: var(--spacing-1); }
  .mb-2 { margin-bottom: var(--spacing-2); }
  .mb-3 { margin-bottom: var(--spacing-3); }
  .mb-4 { margin-bottom: var(--spacing-4); }
  
  .ml-0 { margin-left: var(--spacing-0); }
  .ml-1 { margin-left: var(--spacing-1); }
  .ml-2 { margin-left: var(--spacing-2); }
  .ml-3 { margin-left: var(--spacing-3); }
  .ml-4 { margin-left: var(--spacing-4); }
  
  /* --- SIZING --- */
  .w-full { width: 100%; }
  .w-auto { width: auto; }
  .w-screen { width: 100vw; }
  .w-min { width: min-content; }
  .w-max { width: max-content; }
  
  .h-full { height: 100%; }
  .h-auto { height: auto; }
  .h-screen { height: 100vh; }
  .h-min { height: min-content; }
  .h-max { height: max-content; }
  
  .min-w-0 { min-width: 0; }
  .min-w-full { min-width: 100%; }
  
  .max-w-none { max-width: none; }
  .max-w-full { max-width: 100%; }
  
  /* --- TYPOGRAPHY --- */
  .text-xs { font-size: var(--font-xs); }
  .text-sm { font-size: var(--font-sm); }
  .text-base { font-size: var(--font-base); }
  .text-lg { font-size: var(--font-lg); }
  .text-xl { font-size: var(--font-xl); }
  .text-xxl { font-size: var(--font-xxl); }
  
  .font-light { font-weight: var(--font-weight-light); }
  .font-normal { font-weight: var(--font-weight-normal); }
  .font-medium { font-weight: var(--font-weight-medium); }
  .font-semibold { font-weight: var(--font-weight-semibold); }
  .font-bold { font-weight: var(--font-weight-bold); }
  
  .italic { font-style: italic; }
  .not-italic { font-style: normal; }
  
  .uppercase { text-transform: uppercase; }
  .lowercase { text-transform: lowercase; }
  .capitalize { text-transform: capitalize; }
  .normal-case { text-transform: none; }
  
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-justify { text-align: justify; }
  
  .leading-tight { line-height: var(--line-height-tight); }
  .leading-normal { line-height: var(--line-height-normal); }
  .leading-relaxed { line-height: var(--line-height-relaxed); }
  
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  
  /* --- COLORS --- */
  /* Backgrounds */
  .bg-transparent { background-color: transparent; }
  .bg-primary { background-color: var(--color-primary); }
  .bg-primary-dark { background-color: var(--color-primary-dark); }
  .bg-primary-light { background-color: var(--color-primary-light); }
  .bg-secondary { background-color: var(--color-secondary); }
  .bg-secondary-dark { background-color: var(--color-secondary-dark); }
  .bg-secondary-light { background-color: var(--color-secondary-light); }
  .bg-danger { background-color: var(--color-danger); }
  .bg-danger-dark { background-color: var(--color-danger-dark); }
  .bg-success { background-color: var(--color-success); }
  .bg-success-dark { background-color: var(--color-success-dark); }
  .bg-warning { background-color: var(--color-warning); }
  .bg-warning-dark { background-color: var(--color-warning-dark); }
  .bg-surface-primary { background-color: var(--color-surface-primary); }
  .bg-surface-secondary { background-color: var(--color-surface-secondary); }
  
  /* Text colors */
  .text-primary { color: var(--color-text-primary); }
  .text-secondary { color: var(--color-text-secondary); }
  .text-success { color: var(--color-text-success); }
  .text-warning { color: var(--color-text-warning); }
  .text-danger { color: var(--color-status-error); }
  .text-on-primary { color: var(--color-text-on-primary); }
  .text-on-secondary { color: var(--color-text-on-secondary); }
  .text-on-danger { color: var(--color-text-on-danger); }
  .text-on-success { color: var(--color-text-on-success); }
  .text-on-warning { color: var(--color-text-on-warning); }
  
  /* Border colors */
  .border-transparent { border-color: transparent; }
  .border-primary { border-color: var(--color-primary); }
  .border-primary-dark { border-color: var(--color-primary-dark); }
  .border-secondary { border-color: var(--color-secondary); }
  .border-secondary-dark { border-color: var(--color-secondary-dark); }
  .border-danger { border-color: var(--color-danger); }
  .border-danger-dark { border-color: var(--color-danger-dark); }
  .border-default { border-color: var(--color-border-primary); }
  .border-subtle { border-color: var(--color-border-subtle); }
  
  /* --- BORDERS --- */
  .border-0 { border-width: 0; }
  .border { border-width: var(--border-width-default); border-style: solid; }
  .border-2 { border-width: var(--border-width-thick); border-style: solid; }
  .border-4 { border-width: var(--border-width-heavy); border-style: solid; }
  
  .border-t-0 { border-top-width: 0; }
  .border-t { border-top-width: var(--border-width-default); border-top-style: solid; }
  .border-t-2 { border-top-width: var(--border-width-thick); border-top-style: solid; }
  
  .border-r-0 { border-right-width: 0; }
  .border-r { border-right-width: var(--border-width-default); border-right-style: solid; }
  .border-r-2 { border-right-width: var(--border-width-thick); border-right-style: solid; }
  
  .border-b-0 { border-bottom-width: 0; }
  .border-b { border-bottom-width: var(--border-width-default); border-bottom-style: solid; }
  .border-b-2 { border-bottom-width: var(--border-width-thick); border-bottom-style: solid; }
  
  .border-l-0 { border-left-width: 0; }
  .border-l { border-left-width: var(--border-width-default); border-left-style: solid; }
  .border-l-2 { border-left-width: var(--border-width-thick); border-left-style: solid; }
  
  /* Border radius */
  .rounded-none { border-radius: 0; }
  .rounded-sm { border-radius: var(--radius-sm); }
  .rounded { border-radius: var(--radius-md); }
  .rounded-md { border-radius: var(--radius-md); }
  .rounded-lg { border-radius: var(--radius-lg); }
  .rounded-full { border-radius: var(--radius-full); }
  
  /* --- EFFECTS --- */
  /* Opacity */
  .opacity-0 { opacity: var(--opacity-0); }
  .opacity-5 { opacity: var(--opacity-5); }
  .opacity-10 { opacity: var(--opacity-10); }
  .opacity-20 { opacity: var(--opacity-20); }
  .opacity-25 { opacity: var(--opacity-25); }
  .opacity-30 { opacity: var(--opacity-30); }
  .opacity-40 { opacity: var(--opacity-40); }
  .opacity-50 { opacity: var(--opacity-50); }
  .opacity-60 { opacity: var(--opacity-60); }
  .opacity-70 { opacity: var(--opacity-70); }
  .opacity-75 { opacity: var(--opacity-75); }
  .opacity-80 { opacity: var(--opacity-80); }
  .opacity-90 { opacity: var(--opacity-90); }
  .opacity-95 { opacity: var(--opacity-95); }
  .opacity-100 { opacity: var(--opacity-100); }
  
  /* Shadows */
  .shadow-none { box-shadow: var(--shadow-none); }
  .shadow-sm { box-shadow: var(--shadow-sm); }
  .shadow { box-shadow: var(--shadow-md); }
  .shadow-md { box-shadow: var(--shadow-md); }
  .shadow-lg { box-shadow: var(--shadow-lg); }
  .shadow-xl { box-shadow: var(--shadow-xl); }
  .shadow-inner { box-shadow: var(--shadow-inner); }
  
  /* --- INTERACTIVITY --- */
  .cursor-auto { cursor: auto; }
  .cursor-default { cursor: default; }
  .cursor-pointer { cursor: pointer; }
  .cursor-wait { cursor: wait; }
  .cursor-text { cursor: text; }
  .cursor-move { cursor: move; }
  .cursor-not-allowed { cursor: not-allowed; }
  
  .select-none { user-select: none; }
  .select-text { user-select: text; }
  .select-all { user-select: all; }
  .select-auto { user-select: auto; }
  
  .pointer-events-none { pointer-events: none; }
  .pointer-events-auto { pointer-events: auto; }
  
  /* --- OVERFLOW --- */
  .overflow-auto { overflow: auto; }
  .overflow-hidden { overflow: hidden; }
  .overflow-visible { overflow: visible; }
  .overflow-scroll { overflow: scroll; }
  
  .overflow-x-auto { overflow-x: auto; }
  .overflow-x-hidden { overflow-x: hidden; }
  .overflow-x-visible { overflow-x: visible; }
  .overflow-x-scroll { overflow-x: scroll; }
  
  .overflow-y-auto { overflow-y: auto; }
  .overflow-y-hidden { overflow-y: hidden; }
  .overflow-y-visible { overflow-y: visible; }
  .overflow-y-scroll { overflow-y: scroll; }
  
  /* --- TRANSITIONS --- */
  .transition-none { transition-property: none; }
  .transition-all { 
    transition-property: all; 
    transition-timing-function: var(--easing-smooth); 
    transition-duration: var(--duration-uiTransition); 
  }
  .transition { 
    transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; 
    transition-timing-function: var(--easing-smooth); 
    transition-duration: var(--duration-uiTransition); 
  }
  .transition-colors { 
    transition-property: background-color, border-color, color, fill, stroke; 
    transition-timing-function: var(--easing-smooth); 
    transition-duration: var(--duration-uiTransition); 
  }
  .transition-opacity { 
    transition-property: opacity; 
    transition-timing-function: var(--easing-smooth); 
    transition-duration: var(--duration-uiTransition); 
  }
  .transition-shadow { 
    transition-property: box-shadow; 
    transition-timing-function: var(--easing-smooth); 
    transition-duration: var(--duration-uiTransition); 
  }
  .transition-transform { 
    transition-property: transform; 
    transition-timing-function: var(--easing-smooth); 
    transition-duration: var(--duration-uiTransition); 
  }
  
  /* --- Z-INDEX --- */
  .z-0 { z-index: 0; }
  .z-10 { z-index: 10; }
  .z-20 { z-index: 20; }
  .z-30 { z-index: 30; }
  .z-40 { z-index: 40; }
  .z-50 { z-index: 50; }
  .z-auto { z-index: auto; }
  
  /* Named z-index */
  .z-hud { z-index: var(--z-hud); }
  .z-dialog { z-index: var(--z-dialog); }
  .z-modal { z-index: var(--z-modal); }
  .z-tooltip { z-index: var(--z-tooltip); }
  
  /* --- PSEUDO-CLASS VARIANTS --- */
  /* These work by chaining with the utility class */
  /* Example: hover:bg-primary-dark */
  .hover\\:opacity-75:hover { opacity: var(--opacity-75); }
  .hover\\:opacity-100:hover { opacity: var(--opacity-100); }
  .hover\\:shadow-lg:hover { box-shadow: var(--shadow-lg); }
  .hover\\:bg-primary-dark:hover { background-color: var(--color-primary-dark); }
  .hover\\:bg-secondary-dark:hover { background-color: var(--color-secondary-dark); }
  .hover\\:bg-danger-dark:hover { background-color: var(--color-danger-dark); }
  .hover\\:bg-success-dark:hover { background-color: var(--color-success-dark); }
  .hover\\:bg-warning-dark:hover { background-color: var(--color-warning-dark); }
  
  .focus\\:outline-none:focus { outline: none; }
  .focus\\:ring-2:focus { box-shadow: 0 0 0 2px var(--color-primary); }
  .focus\\:ring-offset-2:focus { box-shadow: 0 0 0 2px var(--color-surface-primary), 0 0 0 4px var(--color-primary); }
  
  .active\\:opacity-80:active { opacity: var(--opacity-80); }
  .active\\:scale-95:active { transform: scale(0.95); }
  
  .disabled\\:opacity-50:disabled { opacity: var(--opacity-50); }
  .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
  
  /* --- UTILITIES FOR COMMON PATTERNS --- */
  .btn-base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
    border-radius: var(--radius-md);
    transition-property: all;
    transition-duration: var(--duration-buttonHover);
    transition-timing-function: var(--easing-smooth);
    cursor: pointer;
    user-select: none;
    text-decoration: none;
    border: var(--border-width-thick) solid transparent;
  }
  
  .card-base {
    background-color: var(--color-surface-secondary);
    border: var(--border-width-default) solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4);
  }
  
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background-color: var(--color-background-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
  }
  
  .input-base {
    width: 100%;
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-base);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
    background-color: var(--color-surface-primary);
    border: var(--border-width-default) solid var(--color-border-primary);
    border-radius: var(--radius-md);
    transition-property: border-color, box-shadow;
    transition-duration: var(--duration-uiTransition);
    transition-timing-function: var(--easing-smooth);
  }
  
  .input-base:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(65, 105, 225, 0.1);
  }
`;

export function initializeUtilityStyles(): void {
  styleManager.addStyles('utility-classes', utilityStyles);
}

/**
 * Helper to combine class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}