#!/bin/bash

# Run tests sequentially to avoid hanging
echo "Running tests sequentially..."

# Run with vitest directly using sequential mode
bun vitest run --reporter=verbose --no-file-parallelism

echo "Test run completed!"