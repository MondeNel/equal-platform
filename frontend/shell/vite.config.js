import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      filename: 'remoteEntry.js',
      remotes: {
        auth_app: 'http://localhost:5171/assets/remoteEntry.js',
        trading_app: 'http://localhost:5173/assets/remoteEntry.js',
        arb_app: 'http://localhost:5174/assets/remoteEntry.js',
        follow_app: 'http://localhost:5175/assets/remoteEntry.js',
        orbitbet_app: 'http://localhost:5176/assets/remoteEntry.js',
        profile_app: 'http://localhost:5177/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'axios']
    }),
  ],
  server: {
    port: 5170,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});