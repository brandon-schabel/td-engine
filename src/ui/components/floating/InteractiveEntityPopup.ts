/**
 * InteractiveEntityPopup.ts - Base class for interactive entity popups
 * Changes:
 * 1. Initial implementation extending EntityPopup
 * 2. Enable pointer events for interaction
 * 3. Click outside to close functionality
 * 4. Focus management and keyboard support
 * 5. Event handling system
 */

import { EntityPopup, type EntityPopupOptions } from './EntityPopup';
import type { Entity } from '@/entities/Entity';
import type { Camera } from '@/systems/Camera';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export interface InteractiveEntityPopupOptions extends EntityPopupOptions {
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  modal?: boolean;
  onClose?: () => void;
  preventClose?: boolean;
}

export abstract class InteractiveEntityPopup extends EntityPopup {
  protected interactiveOptions: Required<InteractiveEntityPopupOptions>;
  protected overlayElement?: HTMLElement;
  private clickOutsideHandler?: (event: MouseEvent) => void;
  private escapeHandler?: (event: KeyboardEvent) => void;
  protected focusableElements: HTMLElement[] = [];
  private lastFocusedElement?: HTMLElement;

  constructor(
    entity: Entity,
    camera: Camera,
    options: InteractiveEntityPopupOptions = {}
  ) {
    super(entity, camera, options);

    this.interactiveOptions = {
      closeOnClickOutside: true,
      closeOnEscape: true,
      modal: false,
      onClose: () => { },
      preventClose: false,
      ...this.options,
      ...options
    } as Required<InteractiveEntityPopupOptions>;
  }

  protected override applyBaseStyles(): void {
    super.applyBaseStyles();

    // Enable pointer events for interactive popups
    this.element.style.pointerEvents = 'auto';

    // Add interactive styles
    this.element.style.cssText += `
      cursor: default;
      user-select: text;
    `;

    // Prevent clicks from propagating to game canvas
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this.element.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }

  public override show(): void {
    console.log(`[InteractiveEntityPopup] Showing popup for entity:`, this.entity);

    // Store currently focused element
    this.lastFocusedElement = document.activeElement as HTMLElement;

    super.show();

    // Create modal overlay if needed
    if (this.interactiveOptions.modal) {
      this.createModalOverlay();
    }

    // Setup event handlers
    this.setupEventHandlers();

    // Focus first focusable element
    requestAnimationFrame(() => {
      this.focusFirstElement();
      console.log(`[InteractiveEntityPopup] Popup shown, element in DOM:`, document.body.contains(this.element));
    });
  }

  private createModalOverlay(): void {
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'modal-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: ${(this.options.zIndex || UI_CONSTANTS.zIndex.floatingUI || 1000) - 1};
      pointer-events: auto;
    `;

    document.body.appendChild(this.overlayElement);
  }

  private setupEventHandlers(): void {
    // Click outside handler
    if (this.interactiveOptions.closeOnClickOutside) {
      this.clickOutsideHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Check if click is outside popup
        if (!this.element.contains(target) && target !== this.element) {
          this.handleClose();
        }
      };

      // Reduced delay to make it more responsive while still preventing immediate closing
      setTimeout(() => {
        if (!this.destroyed && this.visible) {
          document.addEventListener('click', this.clickOutsideHandler!);
        }
      }, 150); // Reduced from 300ms to 150ms
    }

    // Escape key handler
    if (this.interactiveOptions.closeOnEscape) {
      this.escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.handleClose();
        }
      };

      document.addEventListener('keydown', this.escapeHandler);
    }

    // Tab trap for modal popups
    if (this.interactiveOptions.modal) {
      this.element.addEventListener('keydown', this.handleTabTrap.bind(this));
    }
  }

  private handleTabTrap(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  protected getFocusableElements(): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(this.element.querySelectorAll(selector)) as HTMLElement[];
  }

  protected focusFirstElement(): void {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  protected handleClose(): void {
    if (this.interactiveOptions.preventClose) return;

    this.interactiveOptions.onClose();
    this.hide();
  }

  public override hide(): void {
    // Remove event handlers
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    // Remove modal overlay
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }

    // Restore focus
    if (this.lastFocusedElement && this.lastFocusedElement.focus) {
      this.lastFocusedElement.focus();
    }

    super.hide();
  }

  /**
   * Create a button element with consistent styling
   */
  protected createButton(
    text: string,
    onClick: () => void,
    options: {
      primary?: boolean;
      disabled?: boolean;
      icon?: string;
      className?: string;
    } = {}
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `popup-button ${options.className || ''} ${options.primary ? 'primary' : ''}`;
    button.disabled = options.disabled || false;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    // Apply button styles
    button.style.cssText = `
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid ${options.primary ? 'transparent' : COLOR_THEME.ui.border.default};
      background: ${options.primary ? COLOR_THEME.ui.text.success : COLOR_THEME.ui.background.secondary};
      color: ${options.primary ? '#fff' : COLOR_THEME.ui.text.primary};
      font-size: 12px;
      font-weight: bold;
      cursor: ${options.disabled ? 'not-allowed' : 'pointer'};
      opacity: ${options.disabled ? '0.5' : '1'};
      transition: all 0.2s ease;
      outline: none;
    `;

    // Hover effects
    if (!options.disabled) {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    }

    return button;
  }

  protected override onDestroy(): void {
    // Clean up event handlers
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    super.onDestroy();
  }
}