import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import type { TestContext } from './setup';
import { withTestContext } from './setup';

/**
 * BDD-style test helpers
 */
export const given = (description: string) => `Given ${description}`;
export const when = (description: string) => `When ${description}`;
export const then = (description: string) => `Then ${description}`;
export const and = (description: string) => `And ${description}`;

/**
 * Template for testing entities
 */
export function describeEntity(
  entityName: string,
  setupFn: () => any,
  tests: (getEntity: () => any, context: TestContext) => void
): void {
  describe(entityName, () => {
    const context = withTestContext();
    let entity: any;
    
    beforeEach(() => {
      entity = setupFn();
    });
    
    tests(() => entity, context);
  });
}

/**
 * Template for testing systems
 */
export function describeSystem(
  systemName: string,
  setupFn: () => any,
  tests: (getSystem: () => any, context: TestContext) => void
): void {
  describe(systemName, () => {
    const context = withTestContext();
    let system: any;
    
    beforeEach(() => {
      system = setupFn();
    });
    
    afterEach(() => {
      // Clean up system resources if needed
      if (system && typeof system.cleanup === 'function') {
        system.cleanup();
      }
    });
    
    tests(() => system, context);
  });
}

/**
 * Template for testing UI components
 */
export function describeUIComponent(
  componentName: string,
  setupFn: () => { element: HTMLElement; component: any },
  tests: (getComponent: () => any, getElement: () => HTMLElement) => void
): void {
  describe(componentName, () => {
    let element: HTMLElement;
    let component: any;
    
    beforeEach(() => {
      const setup = setupFn();
      element = setup.element;
      component = setup.component;
      document.body.appendChild(element);
    });
    
    afterEach(() => {
      element.remove();
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    tests(() => component, () => element);
  });
}

/**
 * Template for performance testing
 */
export function describePerformance(
  name: string,
  benchmarks: Array<{
    name: string;
    fn: () => void;
    maxDuration: number;
    iterations?: number;
  }>
): void {
  describe(`${name} Performance`, () => {
    benchmarks.forEach(benchmark => {
      it(`${benchmark.name} completes within ${benchmark.maxDuration}ms`, () => {
        const iterations = benchmark.iterations || 100;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          benchmark.fn();
        }
        
        const duration = performance.now() - start;
        const avgDuration = duration / iterations;
        
        expect(avgDuration).toBeLessThan(benchmark.maxDuration);
      });
    });
  });
}

/**
 * Template for testing async operations
 */
export function describeAsync(
  name: string,
  tests: () => void
): void {
  describe(name, () => {
    // Set longer timeout for async tests
    beforeEach(() => {
      vi.setConfig({ testTimeout: 10000 });
    });
    
    afterEach(() => {
      vi.setConfig({ testTimeout: 5000 });
    });
    
    tests();
  });
}

/**
 * Common test suites that can be reused
 */
export const StandardSuites = {
  /**
   * Standard entity lifecycle tests
   */
  entityLifecycle: (createEntity: () => any) => {
    it('creates with valid initial state', () => {
      const entity = createEntity();
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.position).toBeDefined();
    });
    
    it('updates position correctly', () => {
      const entity = createEntity();
      const newPos = { x: 100, y: 200 };
      entity.position = newPos;
      expect(entity.position).toEqual(newPos);
    });
    
    it('handles destruction properly', () => {
      const entity = createEntity();
      entity.destroy();
      expect(entity.isDestroyed).toBe(true);
    });
  },
  
  /**
   * Standard health management tests
   */
  healthManagement: (createEntity: () => any) => {
    it('takes damage correctly', () => {
      const entity = createEntity();
      const initialHealth = entity.health;
      entity.takeDamage(10);
      expect(entity.health).toBe(initialHealth - 10);
    });
    
    it('dies when health reaches zero', () => {
      const entity = createEntity();
      entity.takeDamage(entity.health);
      expect(entity.isDead()).toBe(true);
    });
    
    it('cannot have negative health', () => {
      const entity = createEntity();
      entity.takeDamage(entity.health + 100);
      expect(entity.health).toBe(0);
    });
  },
  
  /**
   * Standard upgrade tests
   */
  upgradeSystem: (createEntity: () => any, upgradeTypes: string[]) => {
    upgradeTypes.forEach(type => {
      it(`upgrades ${type} correctly`, () => {
        const entity = createEntity();
        const canUpgrade = entity.canUpgrade(type);
        
        if (canUpgrade) {
          const initialValue = entity[type.toLowerCase()];
          entity.upgrade(type);
          expect(entity[type.toLowerCase()]).toBeGreaterThan(initialValue);
        }
      });
    });
  }
};

/**
 * Test scenario builders
 */
export const TestScenarios = {
  /**
   * Create a scenario with specific timing
   */
  withTiming: (deltaMs: number, steps: number) => ({
    run: (updateFn: (delta: number) => void) => {
      for (let i = 0; i < steps; i++) {
        updateFn(deltaMs);
      }
    }
  }),
  
  /**
   * Create a scenario with mock user input
   */
  withInput: (inputs: Array<{ key?: string; mouse?: { x: number; y: number } }>) => ({
    apply: (inputManager: any) => {
      inputs.forEach(input => {
        if (input.key) {
          inputManager.handleKeyDown({ key: input.key });
        }
        if (input.mouse) {
          inputManager.handleMouseMove(input.mouse);
        }
      });
    }
  })
};

/**
 * Quick test creators for common patterns
 */
export const QuickTest = {
  /**
   * Test that a method throws an error
   */
  throws: (fn: () => void, errorMessage?: string) => {
    it(`throws error${errorMessage ? `: ${errorMessage}` : ''}`, () => {
      expect(fn).toThrow(errorMessage);
    });
  },
  
  /**
   * Test that a value is within range
   */
  inRange: (getValue: () => number, min: number, max: number, description: string) => {
    it(`${description} is between ${min} and ${max}`, () => {
      const value = getValue();
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    });
  },
  
  /**
   * Test that an array has specific length
   */
  arrayLength: (getArray: () => any[], expectedLength: number, description: string) => {
    it(`${description} has ${expectedLength} items`, () => {
      expect(getArray()).toHaveLength(expectedLength);
    });
  }
};