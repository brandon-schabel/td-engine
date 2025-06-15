#!/bin/bash

# Run tests in smaller batches to avoid hanging issues

echo "Running tests in batches..."

# Batch 1: Systems tests
echo "=== Batch 1: Systems tests ==="
bun test --run test/systems/*.test.ts

# Batch 2: Core tests
echo "=== Batch 2: Core tests ==="
bun test --run test/core/*.test.ts

# Batch 3: Entity tests
echo "=== Batch 3: Entity tests ==="
bun test --run test/entities/*.test.ts

# Batch 4: Integration tests
echo "=== Batch 4: Integration tests ==="
bun test --run test/integration/*.test.ts

# Batch 5: Other tests
echo "=== Batch 5: Other tests ==="
bun test --run test/audio/*.test.ts test/ui/*.test.ts test/utils/*.test.ts test/debug/*.test.ts test/examples/*.test.ts

echo "All batches completed!"