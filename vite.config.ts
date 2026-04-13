import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    VitePWA({
      // Use autoUpdate untuk otomatis check dan update PWA
      registerType: 'autoUpdate',
      // Inject service worker registration script otomatis
      injectRegister: 'auto',
      // File untuk custom service worker logic
      selfDestroying: true,
      includeAssets: [
        'images/favicon.svg',
        'images/favicon.png',
        'images/favicon_light.svg',
        'images/favicon_light.png',
      ],
      manifest: {
        name: 'RapiBuol',
        short_name: 'RapiBuol',
        description:
          'Aplikasi Rekap Aktivitas Pegawai Internal BPS Kabupaten Buol',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'images/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'images/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'images/pwa-512x512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'images/pwa-512x512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Glob patterns untuk files yang di-precache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Ignore certain patterns
        globIgnores: ['**/node_modules/**/*', '.map'],
        // Runtime caching strategies
        runtimeCaching: [
          // Google Fonts CSS
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts CDN
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // API calls - NetworkFirst untuk fresh data
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Images - CacheFirst untuk performance
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Client side cache control
        clientsClaim: true,
        skipWaiting: true,
        // Maksimal file size untuk precache
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      // DevOptions untuk development
      devOptions: {
        enabled: false,
        suppressWarnings: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
