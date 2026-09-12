import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// IMPORTANT: schimba 'scoala-duminicala' cu numele exact al repository-ului
// tau de GitHub daca il publici pe https://<user>.github.io/<repo>/
// Daca publici pe un domeniu propriu sau pe <user>.github.io (repo radacina),
// schimba base in '/'.
const REPO_NAME = 'scoala-duminicala';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Școala Duminicală - Maranata Ghiroda',
        short_name: 'Șc. Duminicală',
        description: 'Gestiune grupe, copii, materiale și programări',
        theme_color: '#4A90D9',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: `/${REPO_NAME}/`,
        scope: `/${REPO_NAME}/`,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
