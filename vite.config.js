import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dixor/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'esnext',
  },
});
