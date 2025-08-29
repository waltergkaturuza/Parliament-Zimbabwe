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
    port: 5177,
    host: true,
    strictPort: true, // Fail if port is in use instead of trying another
    historyApiFallback: true, // Enable client-side routing support
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('[VITE PROXY] Proxy error:', String(err));
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            try {
              // Forward all headers, but specifically ensure Authorization is preserved
              const auth = req.headers['authorization'] || req.headers['Authorization'];
              if (auth) {
                proxyReq.setHeader('Authorization', auth);
                console.log('[VITE PROXY] Forwarding Authorization header');
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
              
              console.log(`[VITE PROXY] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
            } catch (err) {
              console.log('[VITE PROXY] Error handling headers:', String(err));
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[VITE PROXY] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
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
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          charts: ['chart.js', 'recharts']
        }
      }
    }
  },
  base: './' // Use relative paths for deployment flexibility
})// Rebuild: 2025-08-03-01-04-06
