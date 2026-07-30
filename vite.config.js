import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2018', 'chrome79', 'edge79', 'firefox78', 'safari13.1'],
    cssTarget: 'safari13.1',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('leaflet')) return 'maps'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
})
