import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: mode === 'demo' ? 'http://127.0.0.1:' + (process.env.COUNSEL_DEMO_API_PORT || '8001') : 'http://localhost:8001',
        ...(mode === 'demo' ? { headers: { 'x-mock-slug': 'counsel' } } : {}),
        changeOrigin: true,
      },
    },
  },
}))
