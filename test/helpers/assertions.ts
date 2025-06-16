/**
 * Custom assertion helpers for unit tests
 */

export function assertVector2Equal(
  actual: { x: number; y: number },
  expected: { x: number; y: number },
  precision: number = 0.0001
) {
  expect(actual.x).toBeCloseTo(expected.x, Math.log10(1 / precision));
  expect(actual.y).toBeCloseTo(expected.y, Math.log10(1 / precision));
}

export function assertInRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

export function assertArrayContainsPosition(
  array: Array<{ x: number; y: number }>,
  position: { x: number; y: number }
) {
  const found = array.some(pos => pos.x === position.x && pos.y === position.y);
  expect(found).toBe(true);
}

export function assertArrayDoesNotContainPosition(
  array: Array<{ x: number; y: number }>,
  position: { x: number; y: number }
) {
  const found = array.some(pos => pos.x === position.x && pos.y === position.y);
  expect(found).toBe(false);
}

export function assertPathIsValid(
  path: Array<{ x: number; y: number }>,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  expect(path.length).toBeGreaterThan(0);
  assertVector2Equal(path[0], start);
  assertVector2Equal(path[path.length - 1], end);
  
  // Check that each step is adjacent to the previous
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const dx = Math.abs(curr.x - prev.x);
    const dy = Math.abs(curr.y - prev.y);
    
    // Should move at most 1 cell in any direction
    expect(dx).toBeLessThanOrEqual(1);
    expect(dy).toBeLessThanOrEqual(1);
    expect(dx + dy).toBeGreaterThan(0); // Should move
  }
}

export function assertEventFired(
  mockFn: ReturnType<typeof vi.fn>,
  expectedData?: any
) {
  expect(mockFn).toHaveBeenCalled();
  if (expectedData !== undefined) {
    expect(mockFn).toHaveBeenCalledWith(expectedData);
  }
}

export function assertEventNotFired(mockFn: ReturnType<typeof vi.fn>) {
  expect(mockFn).not.toHaveBeenCalled();
}