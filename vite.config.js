import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://localhost:8082', // Match existing proxy from package.json
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'build', // CRA default output directory
  }
});
