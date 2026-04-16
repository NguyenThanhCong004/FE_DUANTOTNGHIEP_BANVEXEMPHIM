import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['bootstrap', 'react-bootstrap', 'swiper'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'date-vendor': ['react-datepicker', 'date-fns']
        }
      }
    }
  }
})
