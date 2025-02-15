import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  // https://romitagl.github.io/web-tools/
  // base: '/web-tools/',
  // https://web-tools.romitagl.com/
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    force: true,
  },
  css: {
    devSourcemap: false, // Disable source maps
  }  
});