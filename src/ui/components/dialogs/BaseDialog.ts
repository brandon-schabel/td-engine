import { AudioManager, SoundType } from '@/audio/AudioManager';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';
import { ANIMATION_CONFIG } from '@/config/AnimationConfig';
import { RESPONSIVE_CONFIG, isMobile } from '@/config/ResponsiveConfig';

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
      audioManager: undefined,
      className: '',
      ...options
    };
    
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
    container.className = `dialog-container ${this.options.className}`;
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      z-index: ${this.zIndex};
      pointer-events: none;
    `;
    return container;
  }
  
  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${COLOR_THEME.ui.background.overlay};
      /* Removed backdrop-filter to prevent blur issues */
      opacity: 0;
      transition: opacity ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      pointer-events: ${this.options.modal ? 'auto' : 'none'};
    `;
    return overlay;
  }
  
  private createDialog(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-panel';
    
    // Check if mobile at creation time
    const mobile = isMobile(window.innerWidth);
    
    dialog.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0) scale(0.9);
      will-change: transform, opacity;
      width: ${mobile ? '100vw' : this.options.width};
      height: ${mobile ? 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' : this.options.height};
      max-height: ${mobile ? 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' : 'clamp(400px, 85vh, 800px)'};
      background: ${COLOR_THEME.ui.background.primary}e6;
      border: ${mobile ? 'none' : `${UI_CONSTANTS.floatingUI.borderWidth}px solid ${COLOR_THEME.ui.text.success}`};
      border-radius: ${mobile ? '0' : `${UI_CONSTANTS.dialog.borderRadius}px`};
      box-shadow: ${mobile ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.8)'};
      display: flex;
      flex-direction: column;
      opacity: 0;
      transition: all ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      pointer-events: auto;
      overflow: hidden;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    `;
    
    return dialog;
  }
  
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${UI_CONSTANTS.dialog.padding / 2}px ${UI_CONSTANTS.dialog.padding}px;
      border-bottom: 1px solid ${COLOR_THEME.ui.text.success}4d;
      background: ${COLOR_THEME.ui.text.success}1a;
      flex-shrink: 0;
    `;
    
    const title = document.createElement('h2');
    title.className = 'dialog-title';
    title.style.cssText = `
      margin: 0;
      font-size: clamp(18px, 4vw, 22px);
      font-weight: bold;
      color: ${COLOR_THEME.ui.text.success};
    `;
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
    button.className = 'dialog-close-button';
    button.style.cssText = `
      width: clamp(32px, 8vw, 40px);
      height: clamp(32px, 8vw, 40px);
      padding: 0;
      background: ${COLOR_THEME.ui.button.danger}33;
      border: 1px solid ${COLOR_THEME.ui.button.danger};
      border-radius: ${UI_CONSTANTS.dialog.borderRadius / 2}px;
      color: ${COLOR_THEME.ui.button.danger};
      cursor: pointer;
      transition: all ${ANIMATION_CONFIG.durations.buttonHover}ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const icon = createSvgIcon(IconType.CLOSE, { size: 20 });
    button.innerHTML = icon;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '${COLOR_THEME.ui.button.danger}4d';
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = '${COLOR_THEME.ui.button.danger}33';
      button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', () => {
      this.playSound(SoundType.BUTTON_CLICK);
      this.hide();
    });
    
    return button;
  }
  
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.style.cssText = `
      flex: 1;
      padding: ${UI_CONSTANTS.dialog.padding}px;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      min-height: 0; /* Important for flex children */
      position: relative;
      overscroll-behavior: contain;
    `;
    return content;
  }
  
  protected createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    footer.style.cssText = `
      padding: ${UI_CONSTANTS.dialog.padding / 2}px ${UI_CONSTANTS.dialog.padding}px;
      border-top: 1px solid ${COLOR_THEME.ui.text.success}4d;
      background: ${COLOR_THEME.ui.background.secondary}cc;
      display: flex;
      gap: ${UI_CONSTANTS.dialog.button.spacing}px;
      justify-content: center;
      flex-shrink: 0;
    `;
    
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
    button.className = `dialog-button ${options.primary ? 'primary' : ''}`;
    
    const color = options.color || (options.primary ? '#4CAF50' : '#2196F3');
    
    button.style.cssText = `
      min-height: clamp(40px, 10vw, 48px);
      min-width: clamp(100px, 20vw, 140px);
      padding: 12px 20px;
      background: ${options.primary ? color : `${color}33`};
      border: 1px solid ${color};
      border-radius: 6px;
      color: white;
      font-size: clamp(14px, 3vw, 16px);
      font-weight: bold;
      cursor: pointer;
      transition: all ${ANIMATION_CONFIG.durations.buttonHover}ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      z-index: 10;
      pointer-events: auto;
    `;
    
    if (options.icon) {
      const icon = createSvgIcon(options.icon, { size: 20 });
      button.innerHTML = `${icon}<span>${text}</span>`;
    } else {
      button.textContent = text;
    }
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });
    
    if (options.onClick) {
      const clickHandler = (e: MouseEvent) => {
        console.log(`[BaseDialog] Button clicked: ${text}`);
        console.log(`[BaseDialog] Event target:`, e.target);
        console.log(`[BaseDialog] Event currentTarget:`, e.currentTarget);
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
    let dialogTransform = '';
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable swipe on mobile in fullscreen mode
      if (!isMobile(window.innerWidth) || !this.options.closeable) return;
      
      const target = e.target as HTMLElement;
      // Allow swipe from header or empty dialog areas
      if (target === this.dialog || target.closest('.dialog-header')) {
        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;
        dialogTransform = this.dialog.style.transform;
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
        this.dialog.style.transform = `translate3d(-50%, calc(-50% + ${deltaY}px), 0) scale(${1 - progress * 0.05})`;
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
        this.dialog.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
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
    const mobile = isMobile(window.innerWidth);
    
    if (mobile) {
      this.dialog.style.width = '100vw';
      this.dialog.style.height = 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))';
      this.dialog.style.maxHeight = 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))';
      this.dialog.style.borderRadius = '0';
      this.dialog.style.border = 'none';
      this.dialog.style.boxShadow = 'none';
      this.dialog.style.top = 'env(safe-area-inset-top)';
      this.dialog.style.transform = 'translate3d(-50%, 0, 0)';
    } else {
      this.dialog.style.width = this.options.width;
      this.dialog.style.height = this.options.height;
      this.dialog.style.maxHeight = 'clamp(400px, 85vh, 800px)';
      this.dialog.style.borderRadius = `${UI_CONSTANTS.dialog.borderRadius}px`;
      this.dialog.style.border = `${UI_CONSTANTS.floatingUI.borderWidth}px solid ${COLOR_THEME.ui.text.success}`;
      this.dialog.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.8)';
    }
    
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
    this.container.style.display = 'block';
    this.container.style.pointerEvents = 'auto';
    this.container.style.visibility = 'visible';
    
    // Set initial states for animation
    this.overlay.style.visibility = 'visible';
    this.overlay.style.opacity = '0';
    this.dialog.style.visibility = 'visible';
    this.dialog.style.opacity = '0';
    this.dialog.style.transform = 'translate3d(-50%, -50%, 0) scale(0.9)';
    
    // Force browser to calculate layout before animation
    void this.container.offsetHeight;
    
    // Trigger animations on next frame
    requestAnimationFrame(() => {
      // Add a small delay to ensure the DOM has updated
      setTimeout(() => {
        this.overlay.style.opacity = '1';
        this.dialog.style.opacity = '1';
        this.dialog.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
        
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
    this.dialog.style.transform = 'translate3d(-50%, -50%, 0) scale(0.9)';
    this.container.style.pointerEvents = 'none';
    
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
    toggle.className = 'setting-toggle';
    toggle.style.cssText = `
      position: relative;
      display: inline-block;
      width: clamp(44px, 10vw, 52px);
      height: clamp(24px, 6vw, 28px);
      cursor: pointer;
    `;
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `;
    
    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${checked ? '#4CAF50' : '#666'};
      transition: background-color ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      border-radius: 28px;
    `;
    
    const knob = document.createElement('span');
    knob.style.cssText = `
      position: absolute;
      top: 2px;
      left: ${checked ? 'calc(100% - 22px)' : '2px'};
      width: clamp(20px, 5vw, 24px);
      height: clamp(20px, 5vw, 24px);
      background-color: white;
      transition: left ${ANIMATION_CONFIG.durations.uiTransition}ms ease;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    
    slider.appendChild(knob);
    toggle.appendChild(input);
    toggle.appendChild(slider);
    
    input.addEventListener('change', () => {
      const isChecked = input.checked;
      slider.style.backgroundColor = isChecked ? '#4CAF50' : '#666';
      knob.style.left = isChecked ? 'calc(100% - 22px)' : '2px';
      onChange(isChecked);
      this.playSound(SoundType.BUTTON_CLICK);
    });
    
    return toggle;
  }
  
  protected createSlider(value: number, min: number, max: number, step: number, onChange: (value: number) => void): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 clamp(120px, 30vw, 180px);
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    
    // Generate unique class name instead of using ID-based styles
    const sliderClass = `dialog-slider-${Math.random().toString(36).substr(2, 9)}`;
    slider.className = sliderClass;
    
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      background: #333;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      border-radius: 3px;
    `;
    
    // Add slider styles to existing dialog styles or create new style element
    let dialogStyles = document.getElementById('dialog-slider-styles');
    if (!dialogStyles) {
      dialogStyles = document.createElement('style');
      dialogStyles.id = 'dialog-slider-styles';
      document.head.appendChild(dialogStyles);
    }
    
    // Append new slider styles
    dialogStyles.textContent += `
      .${sliderClass}::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
        background: #4CAF50;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .${sliderClass}::-moz-range-thumb {
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
        background: #4CAF50;
        cursor: pointer;
        border-radius: 50%;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    `;
    
    const valueLabel = document.createElement('span');
    valueLabel.style.cssText = `
      min-width: 40px;
      text-align: right;
      color: #4CAF50;
      font-size: clamp(12px, 3vw, 14px);
      font-weight: bold;
    `;
    valueLabel.textContent = Math.round(value * 100) + '%';
    
    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      valueLabel.textContent = Math.round(newValue * 100) + '%';
      onChange(newValue);
    });
    
    slider.addEventListener('change', () => {
      this.playSound(SoundType.SELECT);
    });
    
    container.appendChild(slider);
    container.appendChild(valueLabel);
    
    return container;
  }
}