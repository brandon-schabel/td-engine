# TD Engine Unit Test Suite

## Overview

This test suite provides comprehensive unit testing for the TD Engine, focusing on pure business logic, calculations, and state management without DOM dependencies or complex mocks. The tests are designed to be fast, reliable, and maintainable.

## Test Philosophy

- **Pure Unit Tests Only**: No integration or UI tests
- **No DOM Dependencies**: Tests run without jsdom or browser emulation
- **Minimal Mocking**: Only essential browser APIs are mocked
- **Fast Execution**: All tests run in milliseconds
- **High Coverage**: Focus on critical game logic and calculations

## Test Structure

```
test/
├── setup.ts                 # Global test setup and minimal mocks
├── helpers/
│   ├── factories.ts         # Factory functions for test data
│   └── assertions.ts        # Custom assertion helpers
├── unit/
│   ├── utils/              # Utility function tests
│   │   ├── Vector2Utils.test.ts
│   │   ├── CooldownManager.test.ts
│   │   └── EventEmitter.test.ts
│   ├── systems/            # Game system tests
│   │   ├── Grid.test.ts
│   │   ├── ResourceManager.test.ts
│   │   ├── ScoreManager.test.ts
│   │   ├── Inventory.test.ts
│   │   ├── Pathfinder.test.ts
│   │   └── SpawnZoneManager.test.ts
│   └── entities/
│       └── player/
│           └── PlayerProgression.test.ts
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test Vector2Utils

# Run tests matching pattern
bun test --grep "multiplier"
```

## Test Coverage

### High Priority Components (✅ Complete)
- **Vector2Utils** (29 tests): Vector math operations
- **CooldownManager** (26 tests): Timer management
- **EventEmitter** (20 tests): Event system

### Core Systems (✅ Complete)
- **Grid** (36 tests): Spatial grid management
- **ResourceManager** (32 tests): Game economy
- **ScoreManager** (27 tests): Score persistence
- **Inventory** (42 tests): Item management
- **Pathfinder** (29 tests): A* pathfinding
- **SpawnZoneManager** (26 tests): Enemy spawn points

### Entity Logic (✅ Complete)
- **PlayerProgression** (35 tests): Upgrades and leveling

**Total: 302 unit tests**

## Test Helpers

### Factory Functions (`test/helpers/factories.ts`)

```typescript
// Create mock entities
const enemy = createMockEnemy({ health: 100, speed: 0.5 });
const tower = createMockTower({ damage: 50, range: 150 });
const item = createMockItem({ type: ItemType.WEAPON, rarity: ItemRarity.RARE });

// Create mock grid
const grid = createMockGrid(10, 10, [
  { x: 5, y: 5 }, // obstacles
  { x: 6, y: 5 }
]);
```

### Custom Assertions (`test/helpers/assertions.ts`)

```typescript
// Vector assertions
assertVector2Equal(actual, expected, precision);

// Range assertions
assertInRange(value, min, max);

// Path validation
assertPathIsValid(path, start, end);

// Event assertions
assertEventFired(mockFn, expectedData);
```

## Writing New Tests

### Test Template

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { YourClass } from '@/path/to/class';

describe('YourClass', () => {
  let instance: YourClass;

  beforeEach(() => {
    instance = new YourClass();
  });

  describe('methodName', () => {
    test('should handle normal case', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });

    test('should handle edge case', () => {
      // Test edge cases
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, specific descriptions
   ```typescript
   test('returns null when path is blocked by obstacles', () => {
   ```

2. **Arrange-Act-Assert Pattern**: Structure tests clearly
   ```typescript
   // Arrange
   const grid = new Grid(10, 10);
   grid.setCellType(5, 5, CellType.BLOCKED);
   
   // Act
   const path = pathfinder.findPath(start, end);
   
   // Assert
   expect(path).toBeNull();
   ```

3. **Test One Thing**: Each test should verify a single behavior

4. **Use Factory Functions**: Create consistent test data
   ```typescript
   const item = createMockItem({ stackable: true, quantity: 5 });
   ```

5. **Test Edge Cases**: Empty arrays, null values, boundaries
   ```typescript
   test('handles empty inventory', () => {
     expect(inventory.getUsedSlots()).toBe(0);
   });
   ```

## Common Testing Patterns

### Testing State Changes

```typescript
test('reduces cooldown over time', () => {
  entity.startCooldown();
  expect(entity.canPerformAction()).toBe(false);
  
  entity.updateCooldown(500);
  expect(entity.canPerformAction()).toBe(false);
  
  entity.updateCooldown(500);
  expect(entity.canPerformAction()).toBe(true);
});
```

### Testing Events

```typescript
test('emits event on state change', () => {
  const listener = vi.fn();
  manager.on('stateChanged', listener);
  
  manager.setState(newState);
  
  expect(listener).toHaveBeenCalledWith(newState);
});
```

### Testing Calculations

```typescript
test('calculates damage with multipliers', () => {
  const baseDamage = 100;
  const multiplier = 1.5;
  
  const result = calculateDamage(baseDamage, multiplier);
  
  expect(result).toBe(150);
});
```

## Performance Testing

For performance-critical code:

```typescript
test('finds path efficiently in large grid', () => {
  const largeGrid = new Grid(100, 100);
  
  const startTime = performance.now();
  const path = pathfinder.findPath({ x: 0, y: 0 }, { x: 99, y: 99 });
  const endTime = performance.now();
  
  expect(path).not.toBeNull();
  expect(endTime - startTime).toBeLessThan(50); // 50ms budget
});
```

## Debugging Tests

1. **Use `test.only`** to run a single test:
   ```typescript
   test.only('specific test to debug', () => {
   ```

2. **Add console logs** (they're mocked but can be unmocked):
   ```typescript
   console.log = console.info; // Unmock for debugging
   ```

3. **Use `expect().toMatchInlineSnapshot()`** for complex objects

4. **Check test output** with `--reporter=verbose`

## Continuous Integration

The test suite is designed to run in CI environments:

- No external dependencies
- No network requests
- Deterministic results
- Fast execution (< 5 seconds total)

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Follow existing patterns
5. Update this README if adding new test categories

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure path aliases are configured in `vitest.config.ts`
2. **Mock conflicts**: Check `test/setup.ts` for global mocks
3. **Timing issues**: Use `vi.useFakeTimers()` for time-dependent tests
4. **Memory leaks**: Clean up in `afterEach` hooks

### Getting Help

- Check existing tests for patterns
- Review Vitest documentation
- Ensure TypeScript types are correct
- Run tests in isolation to identify issues