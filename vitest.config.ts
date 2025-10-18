import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', 'examples/', 'scripts/', '**/index.ts', '**/*.type.ts', '**/*.d.ts', '**/*.config.*', '**/coverage/**'],
    },
    onConsoleLog(_log, type) {
      if (type === 'stderr') {
        return false;
      }
    },
  },
});
