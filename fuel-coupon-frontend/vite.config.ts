// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v1': { // 👈 Corrected proxy path
        target: 'http://localhost:8000',
        changeOrigin: true,
        // No rewrite needed if your backend expects /api/v1
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase', // enables both styles['input-group'] and styles.inputGroup
      generateScopedName: '[name]__[local]___[hash:base64:5]' // optional: custom class naming pattern
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";` // optional: if you use SCSS
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true // optional: for debugging
  }
})