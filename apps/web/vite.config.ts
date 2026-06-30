import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const workerOrigin = process.env.LUDORIA_WORKER_ORIGIN ?? 'http://127.0.0.1:8787';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/worker-api': {
        target: workerOrigin,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/worker-api/, '')
      }
    }
  }
});
