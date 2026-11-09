import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Ma collection LEGO',
        short_name: 'Collection',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f1ea',
        theme_color: '#d01012',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: { port: 5173, strictPort: true }

})
