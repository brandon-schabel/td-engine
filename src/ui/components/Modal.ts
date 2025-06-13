/**
 * Modal component for dialogs and overlays
 * Supports different sizes, animations, and mobile-friendly behavior
 */

import { Component, styleSystem } from '../core';
import type { ComponentProps, ComponentState, ModalOptions } from '../core/types';
import { Button } from './Button';

export interface ModalProps extends ComponentProps, ModalOptions {
  isOpen: boolean;
  onClose?: () => void;
}

interface ModalState extends ComponentState {
  isAnimating: boolean;
  isVisible: boolean;
}

export class Modal extends Component<ModalProps, ModalState> {
  private backdrop: HTMLElement | null = null;
  private modalElement: HTMLElement | null = null;
  private previousActiveElement: HTMLElement | null = null;
  private focusTrap: FocusTrap | null = null;

  protected getInitialState(): ModalState {
    return {
      isAnimating: false,
      isVisible: false,
    };
  }

  protected render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'ui-modal-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    
    if (this.props.title) {
      container.setAttribute('aria-labelledby', 'modal-title');
    }

    // Backdrop
    if (this.props.backdrop !== false) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'ui-modal-backdrop';
      container.appendChild(this.backdrop);
    }

    // Modal
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'ui-modal';
    
    // Header
    if (this.props.title || this.props.showCloseButton !== false) {
      const header = this.createHeader();
      this.modalElement.appendChild(header);
    }

    // Content
    const content = this.createContent();
    this.modalElement.appendChild(content);

    // Footer
    if (this.props.footer) {
      const footer = this.createFooter();
      this.modalElement.appendChild(footer);
    }

    container.appendChild(this.modalElement);
    
    return container;
  }

  protected onMount(): void {
    if (!this.element) return;

    // Store currently focused element
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Setup event listeners
    if (this.backdrop && this.props.closeOnBackdropClick !== false) {
      this.backdrop.addEventListener('click', this.handleBackdropClick);
    }

    if (this.props.closeOnEscape !== false) {
      document.addEventListener('keydown', this.handleKeyDown);
    }

    // Setup focus trap
    if (this.modalElement && this.props.focus !== false) {
      this.focusTrap = new FocusTrap(this.modalElement);
      this.focusTrap.activate();
    }

    // Handle open state
    if (this.props.isOpen) {
      this.open();
    }
  }

  protected onUnmount(): void {
    if (this.backdrop) {
      this.backdrop.removeEventListener('click', this.handleBackdropClick);
    }

    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }

    // Restore focus
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }

  protected onPropsUpdate(prevProps: ModalProps): void {
    if (prevProps.isOpen !== this.props.isOpen) {
      if (this.props.isOpen) {
        this.open();
      } else {
        this.close();
      }
    }
  }

  protected getStyles() {
    const theme = styleSystem.getTheme();
    const { size = 'md', centered = true } = this.props;
    const { isVisible, isAnimating } = this.state;

    // Container styles
    const containerStyles = styleSystem.css({
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: String(theme.zIndex.modal),
      display: isVisible || isAnimating ? 'flex' : 'none',
      alignItems: centered ? 'center' : 'flex-start',
      justifyContent: 'center',
      padding: theme.spacing.md,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    });

    return { className: containerStyles };
  }

  protected applyStyles(): void {
    super.applyStyles();
    
    const theme = styleSystem.getTheme();
    const { size = 'md', animation = true } = this.props;
    const { isVisible } = this.state;

    // Backdrop styles
    if (this.backdrop) {
      const backdropStyles = {
        position: 'absolute' as const,
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '-1',
        opacity: isVisible ? '1' : '0',
        transition: animation ? `opacity ${theme.transitions.normal} ${theme.transitions.easing.easeInOut}` : 'none',
      };
      Object.assign(this.backdrop.style, backdropStyles);
    }

    // Modal styles
    if (this.modalElement) {
      const sizeMap = {
        sm: '400px',
        md: '600px',
        lg: '800px',
        xl: '1000px',
        full: '100%',
      };

      const modalStyles = {
        position: 'relative' as const,
        backgroundColor: theme.colors.surface,
        borderRadius: size === 'full' ? '0' : theme.borderRadius.xl,
        boxShadow: theme.shadows.xl,
        maxWidth: sizeMap[size],
        width: '100%',
        maxHeight: size === 'full' ? '100%' : '90vh',
        display: 'flex',
        flexDirection: 'column' as const,
        opacity: isVisible ? '1' : '0',
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: animation ? `all ${theme.transitions.normal} ${theme.transitions.easing.easeInOut}` : 'none',
      };
      Object.assign(this.modalElement.style, modalStyles);
    }
  }

  private createHeader(): HTMLElement {
    const theme = styleSystem.getTheme();
    const header = document.createElement('div');
    header.className = 'ui-modal-header';
    
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      borderBottom: `1px solid ${theme.colors.border}`,
    });

    // Title
    if (this.props.title) {
      const title = document.createElement('h2');
      title.id = 'modal-title';
      title.className = 'ui-modal-title';
      title.textContent = this.props.title;
      
      Object.assign(title.style, {
        margin: '0',
        fontSize: theme.typography.fontSize.xl,
        fontWeight: String(theme.typography.fontWeight.semibold),
        color: theme.colors.text,
      });
      
      header.appendChild(title);
    }

    // Close button
    if (this.props.showCloseButton !== false) {
      const closeButton = new Button({
        variant: 'ghost',
        size: 'sm',
        icon: '✕',
        onClick: () => this.handleClose(),
        className: 'ui-modal-close',
        'aria-label': 'Close modal',
      });
      
      closeButton.mount(header);
    }

    return header;
  }

  private createContent(): HTMLElement {
    const theme = styleSystem.getTheme();
    const content = document.createElement('div');
    content.className = 'ui-modal-content';
    
    const contentStyles = {
      flex: '1',
      padding: theme.spacing.lg,
      overflowY: this.props.scrollable !== false ? 'auto' : 'visible',
      WebkitOverflowScrolling: 'touch' as const,
    };
    
    Object.assign(content.style, contentStyles);

    if (typeof this.props.content === 'string') {
      content.innerHTML = this.props.content;
    } else if (this.props.content) {
      content.appendChild(this.props.content);
    }

    return content;
  }

  private createFooter(): HTMLElement {
    const theme = styleSystem.getTheme();
    const footer = document.createElement('div');
    footer.className = 'ui-modal-footer';
    
    Object.assign(footer.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderTop: `1px solid ${theme.colors.border}`,
    });

    if (typeof this.props.footer === 'string') {
      footer.innerHTML = this.props.footer;
    } else if (this.props.footer) {
      footer.appendChild(this.props.footer);
    }

    return footer;
  }

  private open(): void {
    if (this.state.isVisible) return;

    this.setState({ isAnimating: true, isVisible: false });
    
    // Force reflow for animation
    if (this.element) {
      this.element.offsetHeight;
    }

    requestAnimationFrame(() => {
      this.setState({ isVisible: true });
      
      if (this.props.animation !== false) {
        setTimeout(() => {
          this.setState({ isAnimating: false });
        }, 250);
      } else {
        this.setState({ isAnimating: false });
      }
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    this.emit('open');
  }

  private close(): void {
    if (!this.state.isVisible) return;

    this.setState({ isAnimating: true, isVisible: false });
    
    const cleanup = () => {
      this.setState({ isAnimating: false });
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      this.emit('close');
    };

    if (this.props.animation !== false) {
      setTimeout(cleanup, 250);
    } else {
      cleanup();
    }
  }

  private handleClose = (): void => {
    if (this.props.onClose) {
      this.props.onClose();
    } else {
      this.close();
    }
  };

  private handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === this.backdrop && this.props.backdrop !== 'static') {
      this.handleClose();
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.props.keyboard !== false) {
      this.handleClose();
    }
  };
}

/**
 * Focus trap utility for modal accessibility
 */
class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
  }

  activate(): void {
    this.container.addEventListener('keydown', this.handleKeyDown);
    
    // Focus first element
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }
  }

  deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }

  private updateFocusableElements(): void {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.container.querySelectorAll(selector));
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Backward tab
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Forward tab
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}