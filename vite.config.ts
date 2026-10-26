import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': نسخه جدید فقط با تأیید کاربر فعال می‌شود تا کاربر روی فایل‌های قدیمی گیر نکند.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FINAL Bundle | اتاق فرمان باندلینگ توسن تکنو',
        short_name: 'FINAL Bundle',
        description:
          'مدل باندلینگ ترکیبی با محوریت کارتخوان به‌عنوان محصول هدف و کش‌لس به‌عنوان محصول محرک',
        lang: 'fa',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0b1f3a',
        background_color: '#0b1f3a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,woff,ttf,webmanifest,ico}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
