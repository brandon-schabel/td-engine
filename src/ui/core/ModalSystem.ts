/**
 * ModalSystem - Modal management that integrates with game pause state
 * Provides standardized modal dialogs with game integration
 */

import { EventEmitter } from './EventEmitter';
import { PanelManager, type PanelConfig } from './PanelManager';
import { styled } from './styled';
import { Component } from './Component';

export interface ModalOptions {
  title?: string;
  content: string | HTMLElement;
  buttons?: ModalButton[];
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  pauseGame?: boolean;
  className?: string;
  persistent?: boolean;
}

export interface ModalButton {
  text: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  className?: string;
}

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface ModalResult<T = any> {
  confirmed: boolean;
  value?: T;
  button?: string;
}

export class ModalSystem extends EventEmitter {
  private panelManager: PanelManager;
  private gameReference: any = null;
  private modalQueue: ModalInstance[] = [];
  private currentModal: ModalInstance | null = null;
  private modalCounter = 0;

  constructor(panelManager: PanelManager, gameReference?: any) {
    super();
    this.panelManager = panelManager;
    this.gameReference = gameReference;
  }

  /**
   * Show a simple alert modal
   */
  async alert(message: string, title?: string): Promise<void> {
    return new Promise((resolve) => {
      this.show({
        title: title || 'Alert',
        content: message,
        buttons: [
          {
            text: 'OK',
            action: () => resolve(),
            style: 'primary'
          }
        ],
        closeOnEscape: true,
        pauseGame: true
      });
    });
  }

  /**
   * Show a confirmation modal
   */
  async confirm(message: string, title?: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.show({
        title: title || 'Confirm',
        content: message,
        buttons: [
          {
            text: 'Cancel',
            action: () => resolve(false),
            style: 'secondary'
          },
          {
            text: 'OK',
            action: () => resolve(true),
            style: 'primary'
          }
        ],
        closeOnEscape: true,
        closeOnBackdrop: false,
        pauseGame: true
      });
    });
  }

  /**
   * Show a custom modal
   */
  show(options: ModalOptions): ModalInstance {
    const modalId = `modal_${++this.modalCounter}`;
    const modal = new ModalInstance(modalId, options, this.panelManager, this.gameReference);
    
    // Register with panel manager
    const panelConfig: PanelConfig = {
      id: modalId,
      component: modal,
      zIndex: 1300, // Will be adjusted by panel manager
      modal: true,
      pauseGame: options.pauseGame ?? true,
      closable: options.closeOnEscape ?? true,
      persistent: options.persistent ?? false,
      position: 'center',
      category: 'dialog'
    };

    this.panelManager.registerPanel(panelConfig);

    // Handle modal lifecycle
    modal.on('close', () => {
      this.panelManager.hidePanel(modalId);
      this.removeFromQueue(modal);
      this.showNextInQueue();
    });

    modal.on('shown', () => {
      this.currentModal = modal;
      this.emit('modalShown', { modalId, options });
    });

    modal.on('hidden', () => {
      if (this.currentModal === modal) {
        this.currentModal = null;
      }
      this.emit('modalHidden', { modalId, options });
    });

    // Add to queue or show immediately
    if (this.currentModal) {
      this.modalQueue.push(modal);
    } else {
      this.panelManager.showPanel(modalId, true);
    }

    return modal;
  }

  /**
   * Close current modal
   */
  closeCurrentModal(): void {
    if (this.currentModal) {
      this.currentModal.close();
    }
  }

  /**
   * Close all modals
   */
  closeAllModals(): void {
    if (this.currentModal) {
      this.currentModal.close();
    }
    
    this.modalQueue.forEach(modal => modal.destroy());
    this.modalQueue = [];
  }

  /**
   * Get current modal
   */
  getCurrentModal(): ModalInstance | null {
    return this.currentModal;
  }

  /**
   * Check if any modal is visible
   */
  hasVisibleModal(): boolean {
    return this.currentModal !== null;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.modalQueue.length;
  }

  private removeFromQueue(modal: ModalInstance): void {
    const index = this.modalQueue.indexOf(modal);
    if (index > -1) {
      this.modalQueue.splice(index, 1);
    }
  }

  private showNextInQueue(): void {
    if (this.modalQueue.length > 0) {
      const nextModal = this.modalQueue.shift()!;
      this.panelManager.showPanel(nextModal.id, true);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.closeAllModals();
    this.removeAllListeners();
  }
}

/**
 * ModalInstance - Individual modal implementation
 */
export class ModalInstance extends Component<ModalOptions> {
  public readonly id: string;
  private panelManager: PanelManager;
  private gameReference: any;
  private isVisible: boolean = false;

  constructor(id: string, options: ModalOptions, panelManager: PanelManager, gameReference: any) {
    super(options);
    this.id = id;
    this.panelManager = panelManager;
    this.gameReference = gameReference;
  }

  protected render(): HTMLElement {
    const modal = this.createModalContainer();
    const backdrop = this.createBackdrop();
    const dialog = this.createDialog();
    
    modal.appendChild(backdrop);
    modal.appendChild(dialog);
    
    return modal;
  }

  private createModalContainer(): HTMLElement {
    const ModalContainer = styled.div`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1300;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      
      &.visible {
        opacity: 1;
        visibility: visible;
      }
    `;

    const container = ModalContainer.create();
    if (this.props.className) {
      container.classList.add(this.props.className);
    }
    
    return container;
  }

  private createBackdrop(): HTMLElement {
    const Backdrop = styled.div`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      cursor: pointer;
    `;

    const backdrop = Backdrop.create();
    
    if (this.props.closeOnBackdrop !== false) {
      backdrop.addEventListener('click', () => {
        this.close();
      });
    }
    
    return backdrop;
  }

  private createDialog(): HTMLElement {
    const Dialog = styled.div`
      position: relative;
      background: white;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      transform: scale(0.9) translateY(-10px);
      transition: transform 0.3s ease;
      
      &.visible {
        transform: scale(1) translateY(0);
      }
      
      &.small { width: 320px; }
      &.medium { width: 480px; }
      &.large { width: 640px; }
      &.fullscreen { 
        width: 95vw; 
        height: 95vh; 
        max-width: none; 
        max-height: none; 
      }
    `;

    const dialog = Dialog.create();
    dialog.classList.add(this.props.size || 'medium');
    
    // Prevent clicks from closing modal
    dialog.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add content
    if (this.props.title) {
      dialog.appendChild(this.createHeader());
    }
    
    dialog.appendChild(this.createBody());
    
    if (this.props.buttons && this.props.buttons.length > 0) {
      dialog.appendChild(this.createFooter());
    }
    
    return dialog;
  }

  private createHeader(): HTMLElement {
    const Header = styled.div`
      padding: 20px 24px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 0;
    `;

    const Title = styled.h3`
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    `;

    const header = Header.create();
    const title = Title.create();
    title.textContent = this.props.title!;
    header.appendChild(title);
    
    return header;
  }

  private createBody(): HTMLElement {
    const Body = styled.div`
      padding: 20px 24px;
      flex: 1;
      overflow-y: auto;
      
      &.with-header {
        padding-top: 20px;
      }
      
      &.with-footer {
        padding-bottom: 20px;
      }
    `;

    const body = Body.create();
    
    if (this.props.title) body.classList.add('with-header');
    if (this.props.buttons && this.props.buttons.length > 0) body.classList.add('with-footer');
    
    if (typeof this.props.content === 'string') {
      body.innerHTML = this.props.content;
    } else {
      body.appendChild(this.props.content);
    }
    
    return body;
  }

  private createFooter(): HTMLElement {
    const Footer = styled.div`
      padding: 16px 24px 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    const Button = styled.button`
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        
        &:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }
      }
      
      &.secondary {
        background: #f3f4f6;
        color: #374151;
        border-color: #d1d5db;
        
        &:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #9ca3af;
        }
      }
      
      &.danger {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        
        &:hover:not(:disabled) {
          background: #dc2626;
          border-color: #dc2626;
        }
      }
      
      &.success {
        background: #10b981;
        color: white;
        border-color: #10b981;
        
        &:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
        }
      }
    `;

    const footer = Footer.create();
    
    this.props.buttons!.forEach(buttonConfig => {
      const button = Button.create();
      button.textContent = buttonConfig.text;
      button.disabled = buttonConfig.disabled || false;
      
      const style = buttonConfig.style || 'secondary';
      button.classList.add(style);
      
      if (buttonConfig.className) {
        button.classList.add(buttonConfig.className);
      }
      
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await buttonConfig.action();
          this.close();
        } catch (error) {
          console.error('Modal button action failed:', error);
          button.disabled = false;
        }
      });
      
      footer.appendChild(button);
    });
    
    return footer;
  }

  show(): void {
    if (this.isVisible) return;
    
    this.isVisible = true;
    
    if (this.element) {
      this.element.classList.add('visible');
      
      // Animate dialog
      const dialog = this.element.querySelector('.dialog') as HTMLElement;
      if (dialog) {
        dialog.classList.add('visible');
      }
    }
    
    this.emit('shown');
  }

  hide(): void {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    
    if (this.element) {
      this.element.classList.remove('visible');
      
      // Animate dialog
      const dialog = this.element.querySelector('.dialog') as HTMLElement;
      if (dialog) {
        dialog.classList.remove('visible');
      }
    }
    
    this.emit('hidden');
  }

  close(): void {
    this.hide();
    this.emit('close');
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isModalVisible(): boolean {
    return this.isVisible;
  }
}