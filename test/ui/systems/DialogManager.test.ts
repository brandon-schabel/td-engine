// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DialogManager } from '@/ui/systems/DialogManager';
import { BaseDialog, BaseDialogOptions } from '@/ui/components/dialogs/BaseDialog';

// Test dialog implementation
class TestDialog extends BaseDialog {
  constructor(options: BaseDialogOptions) {
    super(options);
    this.buildContent();
  }
  
  protected buildContent(): void {
    this.content.innerHTML = '<div>Test Dialog</div>';
  }
}

describe('DialogManager', () => {
  let manager: DialogManager;
  let dialog1: TestDialog;
  let dialog2: TestDialog;

  beforeEach(() => {
    // Clear any existing instance
    (DialogManager as any).instance = null;
    manager = DialogManager.getInstance();
    
    dialog1 = new TestDialog({ title: 'Dialog 1' });
    dialog2 = new TestDialog({ title: 'Dialog 2' });
  });

  afterEach(() => {
    manager.hideAll();
    manager.destroy();
    
    // Clean up dialogs
    if (dialog1) dialog1.destroy();
    if (dialog2) dialog2.destroy();
  });

  describe('singleton behavior', () => {
    it('should return the same instance', () => {
      const instance1 = DialogManager.getInstance();
      const instance2 = DialogManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('dialog management', () => {
    it('should register and show a dialog', () => {
      manager.register('dialog1', dialog1);
      manager.show('dialog1');
      
      expect(manager.isAnyDialogOpen()).toBe(true);
      expect(manager.getOpenDialogs()).toHaveLength(1);
      expect(dialog1.isVisible()).toBe(true);
    });

    it('should handle multiple dialogs with proper z-index', () => {
      manager.register('dialog1', dialog1);
      manager.register('dialog2', dialog2);
      manager.show('dialog1');
      manager.show('dialog2');
      
      expect(manager.getOpenDialogs()).toHaveLength(2);
      
      const container1 = (dialog1 as any).container as HTMLElement;
      const container2 = (dialog2 as any).container as HTMLElement;
      
      expect(parseInt(container1.style.zIndex)).toBeLessThan(parseInt(container2.style.zIndex));
    });

    it('should hide a specific dialog', () => {
      manager.register('dialog1', dialog1);
      manager.register('dialog2', dialog2);
      manager.show('dialog1');
      manager.show('dialog2');
      
      manager.hide('dialog1');
      
      expect(manager.getOpenDialogs()).toHaveLength(1);
      expect(dialog1.isVisible()).toBe(false);
      expect(dialog2.isVisible()).toBe(true);
    });

    it('should hide all dialogs', () => {
      manager.register('dialog1', dialog1);
      manager.register('dialog2', dialog2);
      manager.show('dialog1');
      manager.show('dialog2');
      
      manager.hideAll();
      
      expect(manager.isAnyDialogOpen()).toBe(false);
      expect(dialog1.isVisible()).toBe(false);
      expect(dialog2.isVisible()).toBe(false);
    });

    it('should close topmost dialog', () => {
      manager.register('dialog1', dialog1);
      manager.register('dialog2', dialog2);
      manager.show('dialog1');
      manager.show('dialog2');
      
      manager.closeTopDialog();
      
      expect(manager.getOpenDialogs()).toHaveLength(1);
      expect(dialog2.isVisible()).toBe(false);
      expect(dialog1.isVisible()).toBe(true);
    });

    it('should get a dialog by id', () => {
      manager.register('dialog1', dialog1);
      
      const retrieved = manager.getDialog('dialog1');
      expect(retrieved).toBe(dialog1);
    });

    it('should return undefined for non-existent dialog', () => {
      const retrieved = manager.getDialog('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should toggle dialog visibility', () => {
      manager.register('dialog1', dialog1);
      
      expect(dialog1.isVisible()).toBe(false);
      
      manager.toggle('dialog1');
      expect(dialog1.isVisible()).toBe(true);
      
      manager.toggle('dialog1');
      expect(dialog1.isVisible()).toBe(false);
    });

    it('should move existing dialog to top when shown again', () => {
      manager.register('dialog1', dialog1);
      manager.register('dialog2', dialog2);
      manager.show('dialog1');
      manager.show('dialog2');
      manager.show('dialog1'); // Show again
      
      const openDialogs = manager.getOpenDialogs();
      expect(openDialogs[openDialogs.length - 1]).toBe('dialog1');
    });

    it('should unregister a dialog', () => {
      manager.register('dialog1', dialog1);
      manager.unregister('dialog1');
      
      expect(manager.getDialog('dialog1')).toBeUndefined();
    });
  });

  describe('input blocking', () => {
    it('should report input blocked when dialogs are open', () => {
      expect(manager.isInputBlocked).toBe(false);
      
      manager.register('dialog1', dialog1);
      manager.show('dialog1');
      
      expect(manager.isInputBlocked).toBe(true);
      
      manager.hide('dialog1');
      
      expect(manager.isInputBlocked).toBe(false);
    });
  });
});