import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

const useHttps = process.env.HTTPS === '1'

function siteMetaPlugin(): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      const siteUrl = (process.env.VITE_SITE_URL || '').trim().replace(/\/$/, '')
      const ogImage = siteUrl ? `${siteUrl}/og-image.png` : '/og-image.png'
      const canonical = siteUrl ? `${siteUrl}/` : ''
      let next = html.replaceAll('__OG_IMAGE__', ogImage)
      if (canonical) {
        next = next.replaceAll('__CANONICAL_URL__', canonical)
      } else {
        next = next
          .replace(/<link rel="canonical" href="__CANONICAL_URL__" \/>\n?/, '')
          .replace(/<meta property="og:url" content="__CANONICAL_URL__" \/>\n?/, '')
      }
      return next
    },
  }
}

export default defineConfig({
  plugins: [
    siteMetaPlugin(),
    ...(useHttps ? [basicSsl()] : []),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: [
        'favicon.png',
        'og-image.png',
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
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
      },
      // Needed so install / SW work during `npm run dev` as well as production.
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    host: true,
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
