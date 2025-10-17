import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
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
});
