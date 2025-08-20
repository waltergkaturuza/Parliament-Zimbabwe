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
    port: 5174,
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq: any, req: any, res: any) => {
            try {
              // Forward all headers, but specifically ensure Authorization is preserved
              const auth = req.headers['authorization'] || req.headers['Authorization'];
              if (auth) {
                proxyReq.setHeader('Authorization', auth);
                console.log('[VITE PROXY] Forwarding Authorization header:', auth.substring(0, 20) + '...');
              } else {
                console.log('[VITE PROXY] No Authorization header found in request');
              }
              
              // Also forward other important headers
              const contentType = req.headers['content-type'] || req.headers['Content-Type'];
              if (contentType) {
                proxyReq.setHeader('Content-Type', contentType);
              }
              
              // Forward origin for CORS
              const origin = req.headers['origin'] || req.headers['Origin'];
              if (origin) {
                proxyReq.setHeader('Origin', origin);
              }
            } catch (err) {
              console.log('[VITE PROXY] Error handling headers:', err);
            }
          });
        },
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
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  }
})// Rebuild: 2025-08-03-01-04-06
