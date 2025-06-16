/**
 * Unit tests for EventEmitter
 * Tests event subscription, emission, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from '@/utils/EventEmitter';

type TestEvents = {
  test: { value: number };
  message: string;
  empty: void;
  error: Error;
  multi: { a: number; b: string };
};

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });

  describe('on', () => {
    it('should register event listeners', () => {
      const listener = vi.fn();
      emitter.on('test', listener);
      
      emitter.emit('test', { value: 42 });
      expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    it('should register multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.emit('test', { value: 1 });
      
      expect(listener1).toHaveBeenCalledWith({ value: 1 });
      expect(listener2).toHaveBeenCalledWith({ value: 1 });
    });

    it('should register listeners for different events', () => {
      const testListener = vi.fn();
      const messageListener = vi.fn();
      
      emitter.on('test', testListener);
      emitter.on('message', messageListener);
      
      emitter.emit('test', { value: 1 });
      emitter.emit('message', 'hello');
      
      expect(testListener).toHaveBeenCalledWith({ value: 1 });
      expect(messageListener).toHaveBeenCalledWith('hello');
    });

    it('should not call listeners for wrong event', () => {
      const listener = vi.fn();
      emitter.on('test', listener);
      
      emitter.emit('message', 'hello');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove specific listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.off('test', listener1);
      emitter.emit('test', { value: 1 });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith({ value: 1 });
    });

    it('should handle removing non-existent listener', () => {
      const listener = vi.fn();
      
      // Should not throw
      expect(() => emitter.off('test', listener)).not.toThrow();
    });

    it('should clean up empty event sets', () => {
      const listener = vi.fn();
      
      emitter.on('test', listener);
      emitter.off('test', listener);
      
      // Emit should work without errors even with no listeners
      expect(() => emitter.emit('test', { value: 1 })).not.toThrow();
    });

    it('should only remove the specified listener instance', () => {
      const listener = vi.fn();
      
      emitter.on('test', listener);
      emitter.on('test', listener); // Sets don't allow duplicates, so this has no effect
      
      emitter.off('test', listener); // Removes the single instance
      emitter.emit('test', { value: 1 });
      
      // Should not be called since the listener was removed
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should call all registered listeners', () => {
      const listeners = [vi.fn(), vi.fn(), vi.fn()];
      
      listeners.forEach(listener => emitter.on('test', listener));
      emitter.emit('test', { value: 42 });
      
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledWith({ value: 42 });
      });
    });

    it('should handle events with no listeners', () => {
      expect(() => emitter.emit('test', { value: 1 })).not.toThrow();
    });

    it('should pass correct data types', () => {
      const handlers = {
        test: vi.fn(),
        message: vi.fn(),
        multi: vi.fn(),
      };
      
      emitter.on('test', handlers.test);
      emitter.on('message', handlers.message);
      emitter.on('multi', handlers.multi);
      
      emitter.emit('test', { value: 123 });
      emitter.emit('message', 'hello world');
      emitter.emit('multi', { a: 1, b: 'two' });
      
      expect(handlers.test).toHaveBeenCalledWith({ value: 123 });
      expect(handlers.message).toHaveBeenCalledWith('hello world');
      expect(handlers.multi).toHaveBeenCalledWith({ a: 1, b: 'two' });
    });

    it('should catch and log listener errors', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      emitter.on('test', errorListener);
      emitter.on('test', goodListener);
      
      emitter.emit('test', { value: 1 });
      
      expect(consoleError).toHaveBeenCalledWith(
        'Error in event listener for test:',
        expect.any(Error)
      );
      expect(goodListener).toHaveBeenCalledWith({ value: 1 });
      
      consoleError.mockRestore();
    });

    it('should continue calling listeners after error', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const listeners = [
        vi.fn(),
        vi.fn(() => { throw new Error('Error'); }),
        vi.fn(),
      ];
      
      listeners.forEach(listener => emitter.on('test', listener));
      emitter.emit('test', { value: 1 });
      
      expect(listeners[0]).toHaveBeenCalled();
      expect(listeners[2]).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const testListener = vi.fn();
      const messageListener = vi.fn();
      
      emitter.on('test', testListener);
      emitter.on('message', messageListener);
      
      emitter.removeAllListeners('test');
      
      emitter.emit('test', { value: 1 });
      emitter.emit('message', 'hello');
      
      expect(testListener).not.toHaveBeenCalled();
      expect(messageListener).toHaveBeenCalledWith('hello');
    });

    it('should remove all listeners when no event specified', () => {
      const testListener = vi.fn();
      const messageListener = vi.fn();
      
      emitter.on('test', testListener);
      emitter.on('message', messageListener);
      
      emitter.removeAllListeners();
      
      emitter.emit('test', { value: 1 });
      emitter.emit('message', 'hello');
      
      expect(testListener).not.toHaveBeenCalled();
      expect(messageListener).not.toHaveBeenCalled();
    });

    it('should handle removing from empty emitter', () => {
      expect(() => emitter.removeAllListeners()).not.toThrow();
      expect(() => emitter.removeAllListeners('test')).not.toThrow();
    });
  });

  describe('complex scenarios', () => {
    it('should handle listener that adds another listener', () => {
      const listener2 = vi.fn();
      let addedListener2 = false;
      const listener1 = vi.fn(() => {
        if (!addedListener2) {
          emitter.on('test', listener2);
          addedListener2 = true;
        }
      });
      
      emitter.on('test', listener1);
      emitter.emit('test', { value: 1 });
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1); // Set.forEach might call new listeners added during iteration
      
      emitter.emit('test', { value: 2 });
      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('should handle listener that removes itself', () => {
      const listener2 = vi.fn();
      let selfReference: any;
      const listener1 = vi.fn(() => {
        emitter.off('test', selfReference);
      });
      selfReference = listener1;
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.emit('test', { value: 1 });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      
      emitter.emit('test', { value: 2 });
      expect(listener1).toHaveBeenCalledTimes(1); // Not called again
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('should maintain listener order', () => {
      const calls: number[] = [];
      
      emitter.on('test', () => calls.push(1));
      emitter.on('test', () => calls.push(2));
      emitter.on('test', () => calls.push(3));
      
      emitter.emit('test', { value: 0 });
      
      expect(calls).toEqual([1, 2, 3]);
    });

    it('should handle rapid subscribe/unsubscribe', () => {
      const listener = vi.fn();
      
      for (let i = 0; i < 100; i++) {
        emitter.on('test', listener);
        emitter.off('test', listener);
      }
      
      emitter.emit('test', { value: 1 });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('type safety', () => {
    it('should enforce correct event data types', () => {
      const emitter = new EventEmitter<{
        numberEvent: number;
        stringEvent: string;
        objectEvent: { id: number; name: string };
      }>();

      const numberHandler = vi.fn((data: number) => data);
      const stringHandler = vi.fn((data: string) => data);
      const objectHandler = vi.fn((data: { id: number; name: string }) => data);

      emitter.on('numberEvent', numberHandler);
      emitter.on('stringEvent', stringHandler);
      emitter.on('objectEvent', objectHandler);

      emitter.emit('numberEvent', 42);
      emitter.emit('stringEvent', 'test');
      emitter.emit('objectEvent', { id: 1, name: 'test' });

      expect(numberHandler).toHaveBeenCalledWith(42);
      expect(stringHandler).toHaveBeenCalledWith('test');
      expect(objectHandler).toHaveBeenCalledWith({ id: 1, name: 'test' });
    });
  });
});