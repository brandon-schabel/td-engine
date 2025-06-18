import { AudioManager, SoundType } from '@/audio/AudioManager';
import { createSvgIcon, IconType } from '@/ui/icons/SvgIcons';

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
      background: rgba(0, 0, 0, 0.8);
      /* Removed backdrop-filter to prevent blur issues */
      opacity: 0;
      transition: opacity 200ms ease;
      pointer-events: ${this.options.modal ? 'auto' : 'none'};
    `;
    return overlay;
  }
  
  private createDialog(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-panel';
    dialog.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0) scale(0.9);
      will-change: transform, opacity;
      width: ${this.options.width};
      max-height: clamp(400px, 85vh, 800px);
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid #4CAF50;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      opacity: 0;
      transition: all 200ms ease;
      pointer-events: auto;
      overflow: hidden;
    `;
    
    // Mobile fullscreen mode
    if (window.innerWidth <= 768) {
      dialog.style.width = '100vw';
      dialog.style.height = '100vh';
      dialog.style.maxHeight = '100vh';
      dialog.style.borderRadius = '0';
      dialog.style.border = 'none';
    }
    
    return dialog;
  }
  
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(76, 175, 80, 0.3);
      background: rgba(76, 175, 80, 0.1);
      flex-shrink: 0;
    `;
    
    const title = document.createElement('h2');
    title.className = 'dialog-title';
    title.style.cssText = `
      margin: 0;
      font-size: clamp(18px, 4vw, 22px);
      font-weight: bold;
      color: #4CAF50;
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
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid #F44336;
      border-radius: 6px;
      color: #F44336;
      cursor: pointer;
      transition: all 150ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const icon = createSvgIcon(IconType.CLOSE, { size: 20 });
    button.innerHTML = icon;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(244, 67, 54, 0.3)';
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(244, 67, 54, 0.2)';
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
      padding: 20px;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    `;
    return content;
  }
  
  protected createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    footer.style.cssText = `
      padding: 16px 20px;
      border-top: 1px solid rgba(76, 175, 80, 0.3);
      background: rgba(40, 40, 40, 0.8);
      display: flex;
      gap: 12px;
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
      transition: all 150ms ease;
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
    
    this.dialog.addEventListener('touchstart', (e) => {
      if (e.target === this.dialog || (e.target as HTMLElement).closest('.dialog-header')) {
        startY = e.touches[0].clientY;
        isDragging = true;
      }
    });
    
    this.dialog.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0) {
        this.dialog.style.transform = `translate(-50%, calc(-50% + ${deltaY}px)) scale(1)`;
        this.dialog.style.opacity = `${1 - deltaY / 300}`;
      }
    });
    
    this.dialog.addEventListener('touchend', () => {
      if (!isDragging) return;
      
      const deltaY = currentY - startY;
      
      if (deltaY > 100 && this.options.closeable) {
        this.hide();
      } else {
        this.dialog.style.transform = 'translate(-50%, -50%) scale(1)';
        this.dialog.style.opacity = '1';
      }
      
      isDragging = false;
    });
  }
  
  private handleResize(): void {
    if (window.innerWidth <= 768) {
      this.dialog.style.width = '100vw';
      this.dialog.style.height = '100vh';
      this.dialog.style.maxHeight = '100vh';
      this.dialog.style.borderRadius = '0';
      this.dialog.style.border = 'none';
    } else {
      this.dialog.style.width = this.options.width;
      this.dialog.style.height = this.options.height;
      this.dialog.style.maxHeight = 'clamp(400px, 85vh, 800px)';
      this.dialog.style.borderRadius = '12px';
      this.dialog.style.border = '2px solid #4CAF50';
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
    console.log(`[BaseDialog] Container in DOM:`, this.container.parentNode !== null);
    console.log(`[BaseDialog] Container display:`, this.container.style.display);
    
    this.visible = true;
    this.beforeShow();
    
    // Ensure container is added to DOM
    if (!this.container.parentNode) {
      console.log(`[BaseDialog] Adding container to document.body`);
      document.body.appendChild(this.container);
    }
    
    // Make container visible
    this.container.style.display = 'block';
    this.container.style.pointerEvents = 'auto';
    
    console.log(`[BaseDialog] Container after show - display:`, this.container.style.display, 'z-index:', this.container.style.zIndex);
    
    // Trigger animations
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
      this.dialog.style.opacity = '1';
      // Use translate3d for better performance and no blur
      this.dialog.style.transform = 'translate3d(-50%, -50%, 0) scale(1)';
      console.log(`[BaseDialog] Animation triggered for: ${this.options.title}`);
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
    }, 200);
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
      transition: background-color 200ms ease;
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
      transition: left 200ms ease;
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
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      background: #333;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      border-radius: 3px;
    `;
    
    // Custom slider styles
    const styleId = `slider-styles-${Date.now()}`;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${styleId} + input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
        background: #4CAF50;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      #${styleId} + input[type="range"]::-moz-range-thumb {
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
        background: #4CAF50;
        cursor: pointer;
        border-radius: 50%;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
    
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