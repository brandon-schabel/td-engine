/**
 * Utility Styles - Tailwind-inspired utility classes
 * Single-purpose CSS classes that use design tokens from StyleManager
 */

import { styleManager } from './StyleManager';

const utilityStyles = `
  /* --- GLOBAL RESET --- */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
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
  .min-w-\\[3ch\\] { min-width: 3ch; }
  .min-w-\\[4ch\\] { min-width: 4ch; }
  
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
  .bg-surface-tertiary { background-color: var(--color-surface-tertiary, rgba(255, 255, 255, 0.1)); }
  .bg-golden { background-color: #FFD700; }
  .bg-golden\\/10 { background-color: rgba(255, 215, 0, 0.1); }
  .bg-golden\\/20 { background-color: rgba(255, 215, 0, 0.2); }
  .bg-black\\/10 { background-color: rgba(0, 0, 0, 0.1); }
  .bg-black\\/20 { background-color: rgba(0, 0, 0, 0.2); }
  .bg-black\\/30 { background-color: rgba(0, 0, 0, 0.3); }
  .bg-black\\/40 { background-color: rgba(0, 0, 0, 0.4); }
  .bg-black\\/50 { background-color: rgba(0, 0, 0, 0.5); }
  
  /* Text colors */
  .text-primary { color: var(--color-text-primary); }
  .text-secondary { color: var(--color-text-secondary); }
  .text-muted { color: var(--color-text-muted); }
  .text-foreground { color: var(--color-text-foreground); }
  .text-success { color: var(--color-text-success); }
  .text-warning { color: var(--color-text-warning); }
  .text-danger { color: var(--color-status-error); }
  .text-on-primary { color: var(--color-text-on-primary); }
  .text-on-secondary { color: var(--color-text-on-secondary); }
  .text-on-danger { color: var(--color-text-on-danger); }
  .text-on-success { color: var(--color-text-on-success); }
  .text-on-warning { color: var(--color-text-on-warning); }
  
  /* Tower type colors */
  .text-game-tower-basic { color: var(--color-game-tower-basic); }
  .text-game-tower-sniper { color: var(--color-game-tower-frost); }
  .text-game-tower-rapid { color: var(--color-game-tower-artillery); }
  .text-game-tower-wall { color: var(--color-game-tower-wall); }
  
  /* Damage number color utilities */
  .text-damage-tier-1 { color: #FFFFFF; } /* White for 1-10 damage */
  .text-damage-tier-2 { color: #7FFF00; } /* Chartreuse for 10-30 damage */
  .text-damage-tier-3 { color: #FFA500; } /* Orange for 30-50 damage */
  .text-damage-tier-4 { color: #FF0000; } /* Red for 50-90 damage */
  .text-damage-tier-5 { color: #FF69B4; } /* Hot pink for 90-150 damage */
  .text-damage-tier-6 { color: #0080FF; } /* Blue for 150-250 damage */
  .text-damage-tier-7 { color: #9400D3; } /* Purple for 250+ damage */
  .text-damage-heal { color: #00FF00; } /* Bright green for healing */
  .text-damage-critical { color: #FF0000; } /* Red for critical hits */
  
  /* Common UI colors */
  .text-yellow-500 { color: #EAB308; } /* Gold/Currency */
  .text-yellow-400 { color: #FACC15; } /* Bright yellow */
  .text-green-500 { color: #22C55E; } /* Health/Success */
  .text-blue-500 { color: #3B82F6; } /* Shield/Primary */
  .text-red-500 { color: #EF4444; } /* Damage/Danger */
  .text-gray-400 { color: #9CA3AF; } /* Muted/Secondary */
  .text-golden { color: #FFD700; } /* Golden for level up */
  .text-golden-light { color: #FFF59D; } /* Light golden */
  
  /* Tower type border colors */
  .border-game-tower-basic { border-color: var(--color-game-tower-basic); }
  .border-game-tower-sniper { border-color: var(--color-game-tower-frost); }
  .border-game-tower-rapid { border-color: var(--color-game-tower-artillery); }
  .border-game-tower-wall { border-color: var(--color-game-tower-wall); }
  
  /* Border colors */
  .border-transparent { border-color: transparent; }
  .border-primary { border-color: var(--color-primary); }
  .border-primary-dark { border-color: var(--color-primary-dark); }
  .border-secondary { border-color: var(--color-secondary); }
  .border-secondary-dark { border-color: var(--color-secondary-dark); }
  .border-danger { border-color: var(--color-danger); }
  .border-danger-dark { border-color: var(--color-danger-dark); }
  .border-default { border-color: var(--color-border-primary); }
  .border-surface-border { border-color: var(--color-surface-border, rgba(255, 255, 255, 0.2)); }
  .border-subtle { border-color: var(--color-border-subtle); }
  .border-black\\/10 { border-color: rgba(0, 0, 0, 0.1); }
  .border-black\\/20 { border-color: rgba(0, 0, 0, 0.2); }
  .border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }
  .border-white\\/20 { border-color: rgba(255, 255, 255, 0.2); }
  
  /* Rarity border colors */
  .border-gray-400 { border-color: #9CA3AF; }
  .border-green-400 { border-color: #4ADE80; }
  .border-blue-400 { border-color: #60A5FA; }
  .border-purple-400 { border-color: #C084FC; }
  .border-yellow-400 { border-color: #FACC15; }
  .border-danger\\/50 { border-color: rgba(220, 53, 69, 0.5); }
  
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
  
  /* Text shadows for damage numbers */
  .text-shadow-damage { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9); }
  
  /* Filter effects */
  .filter-drop-shadow-tier-6 { filter: drop-shadow(0 0 3px #0080FF); }
  .filter-drop-shadow-tier-7 { filter: drop-shadow(0 0 4px #9400D3); }
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
  
  /* Ring utilities */
  .ring-1 { box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1); }
  .ring-2 { box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2); }
  
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
  .hover\\:shadow-md:hover { box-shadow: var(--shadow-md); }
  .hover\\:bg-primary-dark:hover { background-color: var(--color-primary-dark); }
  .hover\\:bg-secondary-dark:hover { background-color: var(--color-secondary-dark); }
  .hover\\:bg-danger-dark:hover { background-color: var(--color-danger-dark); }
  .hover\\:bg-success-dark:hover { background-color: var(--color-success-dark); }
  .hover\\:bg-warning-dark:hover { background-color: var(--color-warning-dark); }
  
  /* Hover transforms */
  .hover\\:-translate-y-0\\.5:hover { transform: translateY(-0.125rem); }
  .hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }
  .hover\\:scale-105:hover { transform: scale(1.05); }
  .hover\\:scale-110:hover { transform: scale(1.1); }
  .hover\\:scale-125:hover { transform: scale(1.25); }
  .hover\\:rotate-5:hover { transform: rotate(5deg); }
  
  /* Combined transforms for hover */
  .hover\\:scale-110-rotate-5:hover { transform: scale(1.1) rotate(5deg); }
  
  /* Tower card specific hover animation */
  .tower-card:hover .hover\\:scale-110-rotate-5 { transform: scale(1.1) rotate(5deg); }
  
  /* Hover border colors */
  .hover\\:border-primary:hover { border-color: var(--color-primary); }
  .hover\\:border-warning:hover { border-color: var(--color-warning); }
  .hover\\:border-yellow-400:hover { border-color: #FACC15; }
  
  /* Hover background colors */
  .hover\\:bg-surface-hover:hover { background-color: var(--color-surface-hover); }
  .hover\\:bg-yellow-400\\/10:hover { background-color: rgba(250, 204, 21, 0.1); }
  
  /* Group hover utilities */
  .group:hover .group-hover\\:scale-110 { transform: scale(1.1); }
  .group:hover .group-hover\\:rotate-5 { transform: rotate(5deg); }
  .group:hover .group-hover\\:scale-110-rotate-5 { transform: scale(1.1) rotate(5deg); }
  .group:hover .group-hover\\:text-primary { color: var(--color-primary); }
  
  .focus\\:outline-none:focus { outline: none; }
  .focus\\:ring-2:focus { box-shadow: 0 0 0 2px var(--color-primary); }
  .focus\\:ring-offset-2:focus { box-shadow: 0 0 0 2px var(--color-surface-primary), 0 0 0 4px var(--color-primary); }
  
  .active\\:opacity-80:active { opacity: var(--opacity-80); }
  .active\\:scale-95:active { transform: scale(0.95); }
  
  .disabled\\:opacity-50:disabled { opacity: var(--opacity-50); }
  .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
  
  /* Focus variants for form elements */
  .focus\\:border-primary:focus { border-color: var(--color-primary); }
  .focus\\:border-danger:focus { border-color: var(--color-danger); }
  .focus\\:shadow-primary:focus { box-shadow: 0 0 0 3px rgba(65, 105, 225, 0.1); }
  .focus\\:shadow-danger:focus { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
  
  /* Translate utilities */
  .-translate-x-1\\/2 { transform: translateX(-50%); }
  .-translate-y-1\\/2 { transform: translateY(-50%); }
  .translate-x-1\\/2 { transform: translateX(50%); }
  .translate-y-1\\/2 { transform: translateY(50%); }
  
  /* Additional spacing */
  .w-0 { width: 0; }
  .h-0 { height: 0; }
  .w-1 { width: var(--spacing-1); }
  .h-1 { height: var(--spacing-1); }
  .w-1\\.5 { width: 6px; }
  .h-1\\.5 { height: 6px; }
  .w-2 { width: var(--spacing-2); }
  .h-2 { height: var(--spacing-2); }
  .w-3 { width: var(--spacing-3); }
  .h-3 { height: var(--spacing-3); }
  .w-3\\.5 { width: 0.875rem; }
  .h-3\\.5 { height: 0.875rem; }
  .w-4 { width: var(--spacing-4); }
  .h-4 { height: var(--spacing-4); }
  .w-5 { width: var(--spacing-5); }
  .h-5 { height: var(--spacing-5); }
  .w-6 { width: var(--spacing-6); }
  .h-6 { height: var(--spacing-6); }
  .w-7 { width: 1.75rem; }
  .h-7 { height: 1.75rem; }
  .w-8 { width: var(--spacing-8); }
  .h-8 { height: var(--spacing-8); }
  .w-10 { width: 2.5rem; }
  .h-10 { height: 2.5rem; }
  .w-12 { width: 3rem; }
  .h-12 { height: 3rem; }
  .w-16 { width: var(--spacing-16); }
  .h-16 { height: var(--spacing-16); }
  
  /* Position utilities */
  .top-0 { top: 0; }
  .right-0 { right: 0; }
  .bottom-0 { bottom: 0; }
  .left-0 { left: 0; }
  .left-0\\.5 { left: 0.125rem; }
  .left-1 { left: var(--spacing-1); }
  .left-3 { left: var(--spacing-3); }
  .left-5 { left: var(--spacing-5); }
  .left-6 { left: var(--spacing-6); }
  .left-8 { left: var(--spacing-8); }
  .right-3 { right: var(--spacing-3); }
  .top-1\\/2 { top: 50%; }
  .left-1\\/2 { left: 50%; }
  .top-2 { top: var(--spacing-2); }
  .top-2\\.5 { top: 0.625rem; }
  .top-3 { top: var(--spacing-3); }
  .bottom-\\[-8px\\] { bottom: -8px; }
  .top-\\[-8px\\] { top: -8px; }
  .left-\\[-8px\\] { left: -8px; }
  .right-\\[-8px\\] { right: -8px; }
  
  /* Border utilities */
  .border-solid { border-style: solid; }
  .border-x-8 { border-left-width: 8px; border-right-width: 8px; }
  .border-y-8 { border-top-width: 8px; border-bottom-width: 8px; }
  .border-t-8 { border-top-width: 8px; }
  .border-b-8 { border-bottom-width: 8px; }
  .border-l-8 { border-left-width: 8px; }
  .border-r-8 { border-right-width: 8px; }
  .border-t-gray-900 { border-top-color: #111827; }
  .border-b-gray-900 { border-bottom-color: #111827; }
  .border-l-gray-900 { border-left-color: #111827; }
  .border-r-gray-900 { border-right-color: #111827; }
  
  /* Gray colors */
  .bg-gray-900 { background-color: #111827; }
  .text-white { color: white; }
  
  /* Misc utilities */
  .sr-only { 
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  .appearance-none { appearance: none; }
  .font-inherit { font: inherit; }
  .color-inherit { color: inherit; }
  .min-w-\\[3ch\\] { min-width: 3ch; }
  .break-words { word-break: break-word; }
  .whitespace-normal { white-space: normal; }
  .visible { visibility: visible; }
  .invisible { visibility: hidden; }
  .z-50 { z-index: 50; }
  
  /* Additional opacity utilities */
  .opacity-40 { opacity: var(--opacity-40); }
  .opacity-60 { opacity: var(--opacity-60); }
  .opacity-80 { opacity: var(--opacity-80); }
  
  /* Shadow utilities for box-shadow */
  .shadow-glow-primary { box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3); }
  
  /* Width utilities */
  .w-\\[60px\\] { width: 60px; }
  .h-\\[60px\\] { height: 60px; }
  
  /* Additional background colors */
  .bg-yellow-400\\/10 { background-color: rgba(250, 204, 21, 0.1); }
  .bg-black\\/80 { background-color: rgba(0, 0, 0, 0.8); }
  .bg-black\\/30 { background-color: rgba(0, 0, 0, 0.3); }
  .bg-black\\/50 { background-color: rgba(0, 0, 0, 0.5); }
  .bg-danger\\/20 { background-color: rgba(220, 53, 69, 0.2); }
  .bg-danger\\/50 { background-color: rgba(220, 53, 69, 0.5); }
  .bg-primary\\/10 { background-color: rgba(74, 144, 226, 0.1); }
  
  /* Gradient backgrounds */
  .bg-gradient-primary { background: linear-gradient(90deg, var(--color-button-primary) 0%, #5a7fdb 100%); }
  .bg-gradient-surface { background: linear-gradient(135deg, rgba(33, 37, 41, 0.98) 0%, rgba(40, 44, 48, 0.98) 100%); }
  
  /* Gradient text utilities */
  .text-gradient-primary {
    background: linear-gradient(90deg, var(--color-button-primary) 0%, #5a7fdb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Control colors */
  .bg-controls-joystick-base { background-color: var(--color-controls-joystick-base); }
  .bg-controls-joystick-knob { background-color: var(--color-controls-joystick-knob); }
  .border-controls-joystick-baseBorder { border-color: var(--color-controls-joystick-baseBorder); }
  .border-controls-joystick-knobBorder { border-color: var(--color-controls-joystick-knobBorder); }
  
  /* Additional position utilities */
  .bottom-1 { bottom: var(--spacing-1); }
  .right-1 { right: var(--spacing-1); }
  .bottom-2 { bottom: var(--spacing-2); }
  .right-2 { right: var(--spacing-2); }
  
  /* Minimum width utilities */
  .min-w-\\[20px\\] { min-width: 20px; }
  
  /* Transform origin */
  .origin-center { transform-origin: center; }
  .origin-bottom { transform-origin: bottom; }
  
  /* Additional scale transforms */
  .scale-95 { transform: scale(0.95); }
  .scale-110 { transform: scale(1.1); }
  .scale-125 { transform: scale(1.25); }
  
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
    box-sizing: border-box;
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
  
  /* --- POSITIONING VALUES --- */
  .top-0 { top: 0; }
  .top-1\\/2 { top: 50%; }
  .top-\\[80px\\] { top: 80px; }
  .right-0 { right: 0; }
  .right-\\[20px\\] { right: 20px; }
  .bottom-0 { bottom: 0; }
  .bottom-\\[120px\\] { bottom: 120px; }
  .bottom-\\[180px\\] { bottom: 180px; }
  .left-0 { left: 0; }
  .left-1\\/2 { left: 50%; }
  
  /* --- TRANSFORM --- */
  .transform { transform: translateX(0); }
  .-translate-x-1\\/2 { transform: translateX(-50%); }
  .-translate-y-1\\/2 { transform: translateY(-50%); }
  .-translate-x-1\\/2.-translate-y-1\\/2 { transform: translate(-50%, -50%); }
  .scale-95 { transform: scale(0.95); }
  .scale-100 { transform: scale(1); }
  .scale-105 { transform: scale(1.05); }
  
  /* --- ANIMATION --- */
  
  /* Animation Keyframes */
  @keyframes bounce-in {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.3);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.05);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translate(-50%, 0) rotate(0deg); }
    10% { transform: translate(-52%, 0) rotate(-1deg); }
    20% { transform: translate(-48%, 0) rotate(1deg); }
    30% { transform: translate(-52%, 0) rotate(0deg); }
    40% { transform: translate(-48%, 0) rotate(1deg); }
    50% { transform: translate(-50%, 0) rotate(-1deg); }
    60% { transform: translate(-52%, 0) rotate(0deg); }
    70% { transform: translate(-48%, 0) rotate(-1deg); }
    80% { transform: translate(-50%, 0) rotate(1deg); }
    90% { transform: translate(-50%, 0) rotate(0deg); }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes breathe {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    }
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes damage-float {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 1;
    }
    100% {
      transform: translateY(-40px) scale(1);
      opacity: 0;
    }
  }
  
  @keyframes damage-float-critical {
    0% {
      transform: translateY(0) scale(0.8) rotate(-5deg);
      opacity: 1;
    }
    20% {
      transform: translateY(-10px) scale(1.3) rotate(5deg);
    }
    100% {
      transform: translateY(-50px) scale(1.1) rotate(0deg);
      opacity: 0;
    }
  }
  
  @keyframes damage-float-epic {
    0% {
      transform: translateY(0) scale(0.5);
      opacity: 0.8;
    }
    15% {
      transform: translateY(-15px) scale(1.4);
      opacity: 1;
    }
    30% {
      transform: translateY(-25px) scale(1.2);
    }
    100% {
      transform: translateY(-60px) scale(1);
      opacity: 0;
    }
  }
  
  @keyframes touchPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0;
    }
  }
  
  @keyframes rippleEffect {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(3);
      opacity: 0;
    }
  }
  
  @keyframes powerupNotification {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }
    40% {
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -70%) scale(0.8);
    }
  }
  
  @keyframes slideDownAndUp {
    0% {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    15%, 85% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes tooltip-fade-in {
    to {
      opacity: 1;
      margin-bottom: 8px;
    }
  }
  
  /* Level Up Epic Animation */
  @keyframes level-up-epic {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.3) rotate(10deg);
    }
    30% {
      transform: translate(-50%, -50%) scale(0.95) rotate(-5deg);
    }
    45% {
      transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
    }
    60% {
      transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }
  }
  
  @keyframes golden-pulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.4),
                  0 0 40px rgba(255, 215, 0, 0.3),
                  0 0 60px rgba(255, 215, 0, 0.2);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.6),
                  0 0 60px rgba(255, 215, 0, 0.5),
                  0 0 90px rgba(255, 215, 0, 0.3);
    }
  }
  
  @keyframes sparkle {
    0% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1) rotate(180deg);
    }
    100% {
      opacity: 0;
      transform: scale(0) rotate(360deg);
    }
  }
  
  @keyframes radial-burst {
    0% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(0.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(3);
    }
  }
  
  @keyframes float-up {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-60px);
    }
  }
  
  @keyframes screen-flash {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 0.4;
    }
    100% {
      opacity: 0;
    }
  }
  
  /* Animation Utility Classes */
  .animate-bounce-in {
    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-breathe {
    animation: breathe 3s ease-in-out infinite;
  }
  
  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }
  
  .animate-fadeInScale {
    animation: fadeInScale 0.3s ease-out;
  }
  
  .animate-damage-float {
    animation: damage-float 1s ease-out forwards;
  }
  
  .animate-damage-float-critical {
    animation: damage-float-critical 1s ease-out forwards;
  }
  
  .animate-damage-float-epic {
    animation: damage-float-epic 1s ease-out forwards;
  }
  
  .animate-touchPulse {
    animation: touchPulse 0.5s ease-out;
  }
  
  .animate-rippleEffect {
    animation: rippleEffect 0.6s ease-out forwards;
  }
  
  .animate-powerupNotification {
    animation: powerupNotification 2s ease-out forwards;
  }
  
  .animate-slideDownAndUp {
    animation: slideDownAndUp 3s ease-out forwards;
  }
  
  .animate-slideDownAndUp-4s {
    animation: slideDownAndUp 4s ease-out forwards;
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
  
  .animate-tooltip-fade-in {
    animation: tooltip-fade-in 0.2s ease forwards;
    animation-delay: 0.5s;
  }
  
  /* Level Up Animation Classes */
  .animate-level-up-epic {
    animation: level-up-epic 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .animate-golden-pulse {
    animation: golden-pulse 2s ease-in-out infinite;
  }
  
  .animate-sparkle {
    animation: sparkle 1.5s ease-in-out infinite;
  }
  
  .animate-radial-burst {
    animation: radial-burst 1s ease-out forwards;
  }
  
  .animate-float-up {
    animation: float-up 2s ease-out forwards;
  }
  
  .animate-screen-flash {
    animation: screen-flash 0.5s ease-out forwards;
  }
  
  /* --- VISIBILITY --- */
  .visible { visibility: visible; }
  .invisible { visibility: hidden; }
  
  /* --- Z-INDEX --- */
  .z-10 { z-index: 10; }
  .z-20 { z-index: 20; }
  .z-30 { z-index: 30; }
  .z-40 { z-index: 40; }
  .z-50 { z-index: 50; }
  .z-\\[800\\] { z-index: 800; }
  .z-\\[850\\] { z-index: 850; }
  .z-\\[860\\] { z-index: 860; }
  .z-\\[900\\] { z-index: 900; }
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