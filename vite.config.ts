import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

// Determina automat numele repo-ului din variabila de mediu pe care GitHub
// Actions o seteaza mereu (format "owner/repo"), ca sa nu mai fie nevoie sa
// scrii manual numele repo-ului si sa gresesti litere mari/mici sau cratime.
// Local (npm run dev / npm run build fara CI) cade pe fallback-ul de mai jos.
const repoFullName = process.env.GITHUB_REPOSITORY; // ex: "user/scoala-duminicala"
const REPO_NAME = repoFullName ? repoFullName.split('/')[1] : 'scoala-duminicala';

// Daca publici pe <user>.github.io ca repo RADACINA (nu <user>.github.io/<repo>/),
// seteaza manual BASE_PATH='/' mai jos si ignora REPO_NAME.
const BASE_PATH = `/${REPO_NAME}/`;

// GitHub Pages nu stie despre rutele React Router (e un server static simplu):
// la refresh pe orice ruta diferita de "/", cauta fizic acel path, nu-l gaseste
// si serveste automat fisierul "404.html" din radacina site-ului daca exista.
// Copiind index.html peste 404.html dupa build, browserul primeste tot
// aplicatia React, care apoi citeste URL-ul si afiseaza pagina corecta.
// Fara acest plugin, orice refresh pe o ruta diferita de "/" da eroare 404.
function spaFallback404(): Plugin {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }
    },
  };
}

export default defineConfig({
  base: BASE_PATH,
  // 'spa' e valoarea implicita in Vite, dar o facem explicita: la orice ruta
  // necunoscuta (ex /invatator/grupa/xyz), atat "vite dev" cat si
  // "vite preview" trebuie sa serveasca index.html, nu sa dea 404, ca
  // React Router sa poata prelua ruta din browser dupa refresh.
  appType: 'spa',
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
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
    spaFallback404(),
  ],
});
