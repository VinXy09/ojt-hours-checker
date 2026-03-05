import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine if we're in production (GitHub Pages) or development
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProduction ? '/ojt-hours-checker/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
