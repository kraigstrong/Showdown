import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The game lives at kraigstrong.com/showdown/, which passes through to this
// project. Building into dist/showdown keeps the same path on both sides.
export default defineConfig({
  base: '/showdown/',
  build: {
    outDir: 'dist/showdown',
    emptyOutDir: true,
    // The game, and the rulebook at /showdown/rules/.
    rolldownOptions: {
      input: { main: 'index.html', rules: 'rules/index.html' },
    },
  },
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
