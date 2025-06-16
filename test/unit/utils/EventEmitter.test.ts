import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from '@/utils/EventEmitter';

// Define test event types
interface TestEvents {
  test: { value: number };
  message: string;
  empty: void;
  multi: { x: number; y: number };
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });

  describe('on', () => {
    test('registers event listener', () => {
      const listener = vi.fn();
      emitter.on('test', listener);
      
      emitter.emit('test', { value: 42 });
      expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    test('registers multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.emit('test', { value: 10 });
      expect(listener1).toHaveBeenCalledWith({ value: 10 });
      expect(listener2).toHaveBeenCalledWith({ value: 10 });
    });

    test('listeners are independent across events', () => {
      const testListener = vi.fn();
      const messageListener = vi.fn();
      
      emitter.on('test', testListener);
      emitter.on('message', messageListener);
      
      emitter.emit('test', { value: 1 });
      expect(testListener).toHaveBeenCalled();
      expect(messageListener).not.toHaveBeenCalled();
    });

    test('same listener can be registered multiple times', () => {
      const listener = vi.fn();
      
      emitter.on('test', listener);
      emitter.on('test', listener);
      
      emitter.emit('test', { value: 5 });
      // Should only be called once due to Set behavior
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    test('removes event listener', () => {
      const listener = vi.fn();
      
      emitter.on('test', listener);
      emitter.off('test', listener);
      
      emitter.emit('test', { value: 42 });
      expect(listener).not.toHaveBeenCalled();
    });

    test('removes only specified listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.off('test', listener1);
      
      emitter.emit('test', { value: 10 });
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith({ value: 10 });
    });

    test('handles removing non-existent listener', () => {
      const listener = vi.fn();
      
      // Should not throw
      expect(() => {
        emitter.off('test', listener);
      }).not.toThrow();
    });

    test('handles removing listener from non-existent event', () => {
      const listener = vi.fn();
      
      expect(() => {
        emitter.off('message', listener);
      }).not.toThrow();
    });
  });

  describe('emit', () => {
    test('calls all registered listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.on('test', listener3);
      
      emitter.emit('test', { value: 100 });
      
      expect(listener1).toHaveBeenCalledWith({ value: 100 });
      expect(listener2).toHaveBeenCalledWith({ value: 100 });
      expect(listener3).toHaveBeenCalledWith({ value: 100 });
    });

    test('handles emit with no listeners', () => {
      expect(() => {
        emitter.emit('test', { value: 42 });
      }).not.toThrow();
    });

    test('catches and logs listener errors', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      
      emitter.on('test', errorListener);
      emitter.on('test', normalListener);
      
      // Should not throw
      expect(() => {
        emitter.emit('test', { value: 1 });
      }).not.toThrow();
      
      // Both listeners should be called
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
    });

    test('works with different data types', () => {
      const stringListener = vi.fn();
      const objectListener = vi.fn();
      
      emitter.on('message', stringListener);
      emitter.on('multi', objectListener);
      
      emitter.emit('message', 'Hello World');
      emitter.emit('multi', { x: 10, y: 20 });
      
      expect(stringListener).toHaveBeenCalledWith('Hello World');
      expect(objectListener).toHaveBeenCalledWith({ x: 10, y: 20 });
    });
  });

  describe('removeAllListeners', () => {
    test('removes all listeners for specific event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const otherListener = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.on('message', otherListener);
      
      emitter.removeAllListeners('test');
      
      emitter.emit('test', { value: 1 });
      emitter.emit('message', 'hello');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(otherListener).toHaveBeenCalledWith('hello');
    });

    test('removes all listeners when no event specified', () => {
      const testListener = vi.fn();
      const messageListener = vi.fn();
      const multiListener = vi.fn();
      
      emitter.on('test', testListener);
      emitter.on('message', messageListener);
      emitter.on('multi', multiListener);
      
      emitter.removeAllListeners();
      
      emitter.emit('test', { value: 1 });
      emitter.emit('message', 'hello');
      emitter.emit('multi', { x: 1, y: 2 });
      
      expect(testListener).not.toHaveBeenCalled();
      expect(messageListener).not.toHaveBeenCalled();
      expect(multiListener).not.toHaveBeenCalled();
    });

    test('handles removing from non-existent event', () => {
      expect(() => {
        emitter.removeAllListeners('empty');
      }).not.toThrow();
    });
  });

  describe('integration tests', () => {
    test('complex event flow', () => {
      const results: string[] = [];
      
      const listener1 = () => results.push('listener1');
      const listener2 = () => results.push('listener2');
      const listener3 = () => results.push('listener3');
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.emit('test', { value: 1 });
      
      emitter.on('test', listener3);
      emitter.off('test', listener1);
      emitter.emit('test', { value: 2 });
      
      expect(results).toEqual(['listener1', 'listener2', 'listener2', 'listener3']);
    });

    test('listener registration and removal in callbacks', () => {
      const listener2 = vi.fn();
      const listener1 = vi.fn(() => {
        emitter.off('test', listener1);
        emitter.on('test', listener2);
      });
      
      emitter.on('test', listener1);
      
      emitter.emit('test', { value: 1 });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).not.toHaveBeenCalled();
      
      emitter.emit('test', { value: 2 });
      expect(listener1).toHaveBeenCalledTimes(1); // Still 1
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });
});