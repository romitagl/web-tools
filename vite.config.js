import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteSitemap from 'vite-plugin-sitemap'; // Use default import

export default defineConfig({
  plugins: [
    react(),
    viteSitemap({
      hostname: 'https://romitagl.github.io/web-tools/',
      routes: [
        { url: '/web-tools', changefreq: 'daily', priority: 1 },
        // Add additional routes here
      ],
    }),
  ],
  base: '/web-tools/',
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
});