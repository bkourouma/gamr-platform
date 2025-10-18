import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@prisma/client']
  },
  server: {
    port: Number(process.env.PORT || process.env.VITE_PORT || 5173),
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || `http://localhost:${process.env.BACKEND_PORT || 3002}`,
        changeOrigin: true,
        secure: false
      }
    }
  }
})