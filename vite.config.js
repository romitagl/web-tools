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
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('/pdf-lib/')) {
            return 'pdf-lib';
          }

          if (id.includes('/pdfjs-dist/')) {
            return 'pdf-renderer';
          }

          if (id.includes('/qrcode/') || id.includes('/html5-qrcode/')) {
            return 'qrcode-vendor';
          }

          if (id.includes('/file-saver/') || id.includes('/jszip/')) {
            return 'utils';
          }

          if (id.includes('/lucide-react/')) {
            return 'ui';
          }

          return 'vendor';
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
