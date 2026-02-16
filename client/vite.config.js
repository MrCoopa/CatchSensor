import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ...

export default defineConfig({
  server: {
    host: true,
    https: false, // Switch to HTTP for mobile compatibility
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:5000', // Backend stays HTTPS
        changeOrigin: true,
        secure: false, // Self-signed cert
      },
      '/socket.io': {
        target: 'https://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
        secure: false, // Self-signed cert
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'TrapSensor Professional',
        short_name: 'TrapSensor',
        description: 'Professionelle Fallenüberwachung für Reviere',
        id: '/',
        theme_color: '#1b3a2e',
        background_color: '#1b3a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/fox-logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/fox-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/fox-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true,
        type: 'module', // Necessary for Service Worker in dev
      }
    }),
  ],
})
