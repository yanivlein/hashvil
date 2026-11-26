import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages: https://yanivlein.github.io/hashvil/
const base = '/hashvil/';

export default defineConfig({
  base,
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      // the icons are already matched by globPatterns; listing them twice (with different revisions) breaks the precache
      includeManifestIcons: false,
      manifest: {
        name: 'השביל',
        short_name: 'השביל',
        lang: 'he',
        dir: 'rtl',
        id: base,
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#EFE8DA',
        theme_color: '#EFE8DA',
        icons: [
          { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // everything is precached: after the first load the site makes no network calls
        globPatterns: ['**/*.{js,css,html,woff2,png,webp,svg,json,mp3}'],
        navigateFallback: base + 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: { target: 'es2020', sourcemap: false },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
