import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Gracefully ignore connection refused when backend is offline
            if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
              return;
            }
            console.warn('[vite api proxy error]:', err.message);
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Gracefully ignore connection reset / refused when backend is starting or offline
            if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
              return;
            }
            console.warn('[vite ws proxy error]:', err.message);
          });
        },
      },
    },
  },
});
