import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'vite.config.ts']
    },
    // Set a reasonable timeout for all tests
    testTimeout: 5000, // 5 seconds
    hookTimeout: 2000,  // 2 seconds for hooks
    // Ensure proper teardown
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    // Enable isolation to prevent test interference
    isolate: true,
    // Use forks pool which is more stable for hanging tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        // Limit concurrent tests to prevent resource exhaustion
        maxForks: 1,
      }
    },
    // Disable file parallelism
    fileParallelism: false,
    // Bail on first test failure to help identify problematic tests
    bail: 1,
  }
});