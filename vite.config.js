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
    // Improved chunk strategy for better caching and loading
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'pdf-lib': ['pdf-lib'],
          'qrcode-vendor': ['qrcode', 'html5-qrcode'],
          'utils': ['file-saver', 'jszip'],
          'ui': ['lucide-react', 'prismjs']
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      }
    },
    // Enable source maps for production builds for easier debugging
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    force: true,
  },
  css: {
    devSourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    }
  },
});