import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'pwa-192.png',
        'pwa-512.png',
        'pwa-maskable-192.png',
        'pwa-maskable-512.png',
      ],
      manifest: {
        name: 'قصص الأنبياء',
        short_name: 'قصص الأنبياء',
        description:
          'قصص الأنبياء عليهم السلام — مشاهدة مركزة مع تتبع التقدم.',
        theme_color: '#0f4d3a',
        background_color: '#f4efe4',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
      },
      // Needed so install / SW work during `npm run dev` as well as production.
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    proxy: {
      '/api/youtube-feed': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => {
          const id = new URL(path, 'http://local').searchParams.get(
            'playlist_id',
          )
          return `/feeds/videos.xml?playlist_id=${encodeURIComponent(id ?? '')}`
        },
      },
    },
  },
})
