import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5175, // Your current frontend port
    proxy: {
      '/api/bet': {
        target: 'http://127.0.0.1:8006', // Points directly to the OrbitBet container port
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keeps the /api/bet prefix
      },
    }
  }
})