// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']  // Add this to help resolve imports
  },
  css: {
    postcss: {
      plugins: []  // Disable PostCSS to prevent config loading error
    }
  }
})