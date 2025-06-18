// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseDialog, BaseDialogOptions } from '@/ui/components/dialogs/BaseDialog';
import { AudioManager, SoundType } from '@/audio/AudioManager';

// Create a concrete implementation for testing
class TestDialog extends BaseDialog {
  public contentBuilt = false;
  
  constructor(options: BaseDialogOptions) {
    super(options);
    this.buildContent();
  }
  
  protected buildContent(): void {
    this.contentBuilt = true;
    const testContent = document.createElement('div');
    testContent.textContent = 'Test Content';
    this.content.appendChild(testContent);
  }
  
  // Expose protected members for testing
  public getContainer(): HTMLElement { return this.container; }
  public getOverlay(): HTMLElement { return this.overlay; }
  public getDialog(): HTMLElement { return this.dialog; }
  public getHeader(): HTMLElement { return this.header; }
  public getContent(): HTMLElement { return this.content; }
  public getFooter(): HTMLElement | null { return this.footer; }
}

describe('BaseDialog', () => {
  let dialog: TestDialog;
  let audioManager: AudioManager;
  
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    
    // Mock AudioManager
    audioManager = {
      playUISound: vi.fn()
    } as any;
  });
  
  afterEach(() => {
    if (dialog) {
      dialog.destroy();
    }
    document.body.innerHTML = '';
  });
  
  describe('initialization', () => {
    it('should create dialog with default options', () => {
      dialog = new TestDialog({ title: 'Test Dialog' });
      
      expect(dialog.contentBuilt).toBe(true);
      expect(dialog.getContainer()).toBeDefined();
      expect(dialog.getOverlay()).toBeDefined();
      expect(dialog.getDialog()).toBeDefined();
      expect(dialog.getHeader()).toBeDefined();
      expect(dialog.getContent()).toBeDefined();
    });
    
    it('should apply custom options', () => {
      dialog = new TestDialog({
        title: 'Custom Dialog',
        width: '800px',
        closeable: false,
        modal: false,
        className: 'custom-class'
      });
      
      const container = dialog.getContainer();
      expect(container.className).toContain('custom-class');
      
      const dialogEl = dialog.getDialog();
      expect(dialogEl.style.width).toBe('800px');
      
      const overlay = dialog.getOverlay();
      expect(overlay.style.pointerEvents).toBe('none');
      
      // Should not have close button
      const closeButton = dialog.getHeader().querySelector('.dialog-close-button');
      expect(closeButton).toBeNull();
    });
  });
  
  describe('visibility', () => {
    beforeEach(() => {
      dialog = new TestDialog({ title: 'Test Dialog' });
    });
    
    it('should show dialog', () => {
      expect(dialog.isVisible()).toBe(false);
      
      dialog.show();
      
      expect(dialog.isVisible()).toBe(true);
      expect(document.body.contains(dialog.getContainer())).toBe(true);
      expect(dialog.getContainer().style.display).toBe('block');
    });
    
    it('should hide dialog', (done) => {
      dialog.show();
      expect(dialog.isVisible()).toBe(true);
      
      dialog.hide();
      
      expect(dialog.isVisible()).toBe(false);
      
      // Wait for animation to complete
      setTimeout(() => {
        expect(dialog.getContainer().style.display).toBe('none');
        expect(document.body.contains(dialog.getContainer())).toBe(false);
        done();
      }, 250);
    });
    
    it('should toggle visibility', () => {
      expect(dialog.isVisible()).toBe(false);
      
      dialog.toggle();
      expect(dialog.isVisible()).toBe(true);
      
      dialog.toggle();
      expect(dialog.isVisible()).toBe(false);
    });
  });
  
  describe('interactions', () => {
    beforeEach(() => {
      dialog = new TestDialog({
        title: 'Test Dialog',
        audioManager,
        closeable: true
      });
    });
    
    it('should close on escape key', () => {
      dialog.show();
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      
      expect(dialog.isVisible()).toBe(false);
    });
    
    it('should close on overlay click', () => {
      dialog.show();
      
      const overlay = dialog.getOverlay();
      const clickEvent = new MouseEvent('click', { bubbles: true });
      overlay.dispatchEvent(clickEvent);
      
      expect(dialog.isVisible()).toBe(false);
    });
    
    it('should play sound on close button click', () => {
      dialog.show();
      
      const closeButton = dialog.getHeader().querySelector('.dialog-close-button') as HTMLElement;
      expect(closeButton).toBeDefined();
      
      closeButton.click();
      
      expect(audioManager.playUISound).toHaveBeenCalledWith(SoundType.BUTTON_CLICK);
      expect(dialog.isVisible()).toBe(false);
    });
  });
  
  describe('z-index management', () => {
    it('should update z-index', () => {
      dialog = new TestDialog({ title: 'Test Dialog' });
      
      dialog.setZIndex(2000);
      
      expect(dialog.getContainer().style.zIndex).toBe('2000');
    });
  });
  
  describe('footer', () => {
    it('should create footer when requested', () => {
      dialog = new TestDialog({ title: 'Test Dialog' });
      
      expect(dialog.getFooter()).toBeNull();
      
      // Access protected method through type assertion
      (dialog as any).createFooter();
      
      expect(dialog.getFooter()).toBeDefined();
      expect(dialog.getDialog().contains(dialog.getFooter())).toBe(true);
    });
  });
  
  describe('responsive behavior', () => {
    it('should apply mobile styles on small screens', () => {
      // Mock window width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      dialog = new TestDialog({ title: 'Mobile Dialog' });
      const dialogEl = dialog.getDialog();
      
      expect(dialogEl.style.width).toBe('100vw');
      expect(dialogEl.style.height).toBe('100vh');
      expect(dialogEl.style.borderRadius).toBe('0');
    });
    
    it('should handle resize events', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      dialog = new TestDialog({ title: 'Resizable Dialog' });
      const dialogEl = dialog.getDialog();
      
      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        value: 500
      });
      
      window.dispatchEvent(new Event('resize'));
      
      expect(dialogEl.style.width).toBe('100vw');
    });
  });
  
  describe('lifecycle hooks', () => {
    it('should call lifecycle methods', () => {
      const hooks = {
        beforeShow: vi.fn(),
        afterShow: vi.fn(),
        beforeHide: vi.fn(),
        afterHide: vi.fn()
      };
      
      class LifecycleDialog extends TestDialog {
        protected beforeShow() { hooks.beforeShow(); }
        protected afterShow() { hooks.afterShow(); }
        protected beforeHide() { hooks.beforeHide(); }
        protected afterHide() { hooks.afterHide(); }
      }
      
      dialog = new LifecycleDialog({ title: 'Lifecycle Test' });
      
      dialog.show();
      expect(hooks.beforeShow).toHaveBeenCalled();
      expect(hooks.afterShow).toHaveBeenCalled();
      
      dialog.hide();
      expect(hooks.beforeHide).toHaveBeenCalled();
      
      // After hide is called after animation
      setTimeout(() => {
        expect(hooks.afterHide).toHaveBeenCalled();
      }, 250);
    });
  });
});