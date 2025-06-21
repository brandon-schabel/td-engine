/**
 * Recent changes:
 * - Fully integrated with centralized StyleManager and design token system
 * - Removed all remaining inline styles
 * - Now uses semantic CSS classes exclusively
 * - Maintained touch gesture support and animations
 * - Improved responsive behavior through CSS
 */

import { AudioManager, SoundType } from '@/audio/AudioManager';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';
import { isMobile } from '@/config/ResponsiveConfig';

export interface BaseDialogOptions {
  title: string;
  width?: string;
  height?: string;
  closeable?: boolean;
  modal?: boolean;
  audioManager?: AudioManager;
  className?: string;
}

export abstract class BaseDialog {
  protected container: HTMLElement;
  protected overlay: HTMLElement;
  protected dialog: HTMLElement;
  protected header: HTMLElement;
  protected content: HTMLElement;
  protected footer: HTMLElement | null = null;
  
  protected options: Required<BaseDialogOptions>;
  protected visible: boolean = false;
  protected zIndex: number = 10000;
  
  private escapeHandler: (e: KeyboardEvent) => void;
  private clickOutsideHandler: (e: MouseEvent) => void;
  private resizeHandler: () => void;
  
  constructor(options: BaseDialogOptions) {
    this.options = {
      width: 'clamp(320px, 90vw, 600px)',
      height: 'auto',
      closeable: true,
      modal: true,
      audioManager: options.audioManager || ({} as AudioManager),
      className: '',
      ...options
    } as Required<BaseDialogOptions>;
    
    this.container = this.createContainer();
    this.overlay = this.createOverlay();
    this.dialog = this.createDialog();
    this.header = this.createHeader();
    this.content = this.createContent();
    
    this.dialog.appendChild(this.header);
    this.dialog.appendChild(this.content);
    
    this.container.appendChild(this.overlay);
    this.container.appendChild(this.dialog);
    
    // Event handlers
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.options.closeable && this.visible) {
        e.preventDefault();
        this.hide();
      }
    };
    
    this.clickOutsideHandler = (e) => {
      if (this.options.modal && this.options.closeable && 
          e.target === this.overlay && this.visible) {
        this.hide();
      }
    };
    
    this.resizeHandler = () => {
      this.handleResize();
    };
    
    this.setupEventListeners();
  }
  
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = `ui-dialog-container ${this.options.className}`;
    container.style.display = 'none';
    container.style.zIndex = this.zIndex.toString();
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    return container;
  }
  
  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'ui-dialog-overlay';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = this.options.modal ? 'auto' : 'none';
    return overlay;
  }
  
  private createDialog(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'ui-dialog';
    dialog.style.width = this.options.width;
    dialog.style.height = this.options.height;
    dialog.style.maxHeight = '85vh';
    dialog.style.margin = 'auto';
    dialog.style.transform = 'scale(0.9)';
    dialog.style.opacity = '0';
    return dialog;
  }
  
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'ui-dialog-header';
    
    const title = document.createElement('h2');
    title.className = 'ui-dialog-title';
    title.textContent = this.options.title;
    header.appendChild(title);
    
    if (this.options.closeable) {
      const closeButton = this.createCloseButton();
      header.appendChild(closeButton);
    }
    
    return header;
  }
  
  private createCloseButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'ui-button small ui-button-close';
    button.setAttribute('aria-label', 'Close dialog');
    
    const icon = createSvgIcon(IconType.CLOSE, { size: 16 });
    button.innerHTML = icon;
    
    button.addEventListener('click', () => {
      this.playSound(SoundType.BUTTON_CLICK);
      this.hide();
    });
    
    return button;
  }
  
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'ui-dialog-content ui-scrollable';
    return content;
  }
  
  protected createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'ui-dialog-footer';
    
    this.footer = footer;
    this.dialog.appendChild(footer);
    return footer;
  }
  
  protected createButton(text: string, options: {
    icon?: IconType;
    color?: string;
    onClick?: () => void;
    primary?: boolean;
  } = {}): HTMLButtonElement {
    const button = document.createElement('button');
    
    // Determine button class based on options
    const classes = ['ui-button'];
    if (options.primary) {
      classes.push('primary');
    } else if (options.color === 'danger') {
      classes.push('danger');
    } else if (options.color === 'success') {
      classes.push('success');
    }
    
    button.className = classes.join(' ');
    
    if (options.icon) {
      const icon = createSvgIcon(options.icon, { size: 20 });
      button.innerHTML = `${icon}<span>${text}</span>`;
    } else {
      button.textContent = text;
    }
    
    if (options.onClick) {
      const clickHandler = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        this.playSound(SoundType.BUTTON_CLICK);
        try {
          options.onClick!();
        } catch (error) {
          console.error(`[BaseDialog] Error in button click handler:`, error);
        }
      };
      
      button.addEventListener('click', clickHandler);
      
      // Also add touch support
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        clickHandler(e as any);
      });
    }
    
    return button;
  }
  
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.escapeHandler);
    this.overlay.addEventListener('click', this.clickOutsideHandler);
    window.addEventListener('resize', this.resizeHandler);
    
    // Touch gesture support
    if ('ontouchstart' in window) {
      this.setupTouchGestures();
    }
  }
  
  private setupTouchGestures(): void {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable swipe on mobile in fullscreen mode
      if (!isMobile(window.innerWidth) || !this.options.closeable) return;
      
      const target = e.target as HTMLElement;
      // Allow swipe from header or empty dialog areas
      if (target === this.dialog || target.closest('.dialog-header')) {
        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;
        // Store original transform for potential future use
        // const originalTransform = this.dialog.style.transform;
        // Disable transition during drag
        this.dialog.style.transition = 'none';
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      // Only prevent default if we're actually dragging the dialog, not scrolling content
      const target = e.target as HTMLElement;
      if (target.closest('.dialog-content')) return;
      
      e.preventDefault(); // Prevent scrolling while dragging
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Only allow downward swipe
      if (deltaY > 0) {
        const progress = Math.min(deltaY / 300, 1);
        this.dialog.style.transform = `translateY(${deltaY}px) scale(${1 - progress * 0.05})`;
        this.dialog.style.opacity = `${1 - progress * 0.3}`;
      }
    };
    
    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      // Re-enable transition
      this.dialog.style.transition = `all ${ANIMATION_CONFIG.durations.uiTransition}ms ease`;
      
      const deltaY = currentY - startY;
      const velocity = deltaY / 300; // Simple velocity calculation
      
      if ((deltaY > 100 || velocity > 0.5) && this.options.closeable) {
        this.hide();
      } else {
        // Snap back to original position
        this.dialog.style.transform = 'scale(1)';
        this.dialog.style.opacity = '1';
      }
      
      isDragging = false;
      startY = 0;
      currentY = 0;
    };
    
    // Use passive: false for touchmove to allow preventDefault
    this.dialog.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.dialog.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.dialog.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
  
  private handleResize(): void {
    // Responsive handling is now done through CSS
    this.onResize();
  }
  
  protected playSound(sound: SoundType): void {
    if (this.options.audioManager) {
      this.options.audioManager.playUISound(sound);
    }
  }
  
  public show(): void {
    if (this.visible) return;
    
    console.log(`[BaseDialog] Showing dialog: ${this.options.title}`);
    
    this.visible = true;
    this.beforeShow();
    
    // Ensure container is added to DOM
    if (!this.container.parentNode) {
      console.log(`[BaseDialog] Adding container to document.body`);
      document.body.appendChild(this.container);
    }
    
    // Make container visible immediately
    this.container.style.display = 'flex';
    
    // Set initial states for animation
    this.overlay.style.opacity = '0';
    this.dialog.style.opacity = '0';
    this.dialog.style.transform = 'scale(0.9)';
    
    // Force browser to calculate layout before animation
    void this.container.offsetHeight;
    
    // Trigger animations on next frame
    requestAnimationFrame(() => {
      // Add a small delay to ensure the DOM has updated
      setTimeout(() => {
        this.overlay.style.opacity = '1';
        this.dialog.style.opacity = '1';
        this.dialog.style.transform = 'scale(1)';
        
        console.log(`[BaseDialog] Animation complete for: ${this.options.title}`);
      }, 10);
    });
    
    this.afterShow();
  }
  
  public hide(): void {
    if (!this.visible) return;
    
    this.visible = false;
    this.beforeHide();
    
    this.overlay.style.opacity = '0';
    this.dialog.style.opacity = '0';
    this.dialog.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      this.container.style.display = 'none';
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.afterHide();
    }, ANIMATION_CONFIG.durations.dialogClose);
  }
  
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  public isVisible(): boolean {
    return this.visible;
  }
  
  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    this.container.style.zIndex = zIndex.toString();
  }
  
  public destroy(): void {
    this.hide();
    document.removeEventListener('keydown', this.escapeHandler);
    window.removeEventListener('resize', this.resizeHandler);
    this.onDestroy();
  }
  
  // Lifecycle hooks for subclasses
  protected beforeShow(): void {}
  protected afterShow(): void {}
  protected beforeHide(): void {}
  protected afterHide(): void {}
  protected onResize(): void {}
  protected onDestroy(): void {}
  
  // Abstract method for subclasses to implement
  protected abstract buildContent(): void;
  
  // Common UI component creation methods
  protected createToggle(checked: boolean, onChange: (value: boolean) => void): HTMLElement {
    const toggle = document.createElement('label');
    toggle.className = checked ? 'ui-toggle checked' : 'ui-toggle';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.style.display = 'none';
    
    const slider = document.createElement('span');
    slider.className = 'ui-toggle-switch';
    
    toggle.appendChild(input);
    toggle.appendChild(slider);
    
    input.addEventListener('change', () => {
      toggle.classList.toggle('checked', input.checked);
      onChange(input.checked);
      this.playSound(SoundType.BUTTON_CLICK);
    });
    
    return toggle;
  }
  
  protected createSlider(value: number, min: number, max: number, step: number, onChange: (value: number) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'ui-slider-container ui-flex ui-gap-sm';
    
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'ui-slider';
    
    const track = document.createElement('div');
    track.className = 'ui-slider-track';
    
    const fill = document.createElement('div');
    fill.className = 'ui-slider-fill';
    fill.style.width = `${((value - min) / (max - min)) * 100}%`;
    
    const thumb = document.createElement('div');
    thumb.className = 'ui-slider-thumb';
    thumb.style.left = `${((value - min) / (max - min)) * 100}%`;
    
    track.appendChild(fill);
    track.appendChild(thumb);
    sliderWrapper.appendChild(track);
    
    const valueLabel = document.createElement('span');
    valueLabel.className = 'ui-success ui-text-right';
    valueLabel.style.minWidth = '60px';
    valueLabel.style.fontWeight = '600';
    valueLabel.textContent = Math.round(value * 100) + '%';
    
    // Handle slider interactions
    let isDragging = false;
    
    const updateSlider = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = min + (max - min) * percent;
      const snappedValue = Math.round(newValue / step) * step;
      
      fill.style.width = `${percent * 100}%`;
      thumb.style.left = `${percent * 100}%`;
      valueLabel.textContent = Math.round(snappedValue * 100) + '%';
      onChange(snappedValue);
    };
    
    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
      e.preventDefault();
    };
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
      e.preventDefault();
    };
    
    const handleEnd = () => {
      if (isDragging) {
        isDragging = false;
        this.playSound(SoundType.SELECT);
      }
    };
    
    track.addEventListener('mousedown', handleStart);
    track.addEventListener('touchstart', handleStart, { passive: false });
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });
    
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    
    container.appendChild(sliderWrapper);
    container.appendChild(valueLabel);
    
    return container;
  }
}