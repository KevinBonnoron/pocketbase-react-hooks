import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      include: ['src/**/*'],
      exclude: ['tests/**/*', 'examples/**/*', '**/*.test.*', '**/*.spec.*'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PocketBaseReactHooks',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'pocketbase'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          pocketbase: 'PocketBase',
        },
      },
    },
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', 'examples/', '**/index.ts', '**/*.d.ts', '**/*.config.*', '**/coverage/**'],
    },
    onConsoleLog(_log, type) {
      if (type === 'stderr') {
        return false;
      }
    },
  },
});
