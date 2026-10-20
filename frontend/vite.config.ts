import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && !loadEnv(mode, __dirname).VITE_CLERK_PUBLISHABLE_KEY) {
    throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required to build the frontend')
  }

  return {
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
          target: 'http://localhost:8001',
          changeOrigin: true,
        },
      },
    },
  }
})
