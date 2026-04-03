import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'orbitbet_app',
      filename: 'remoteEntry.js',
      exposes: {
        './OrbitGame': './src/components/OrbitGame.jsx',
        './useBet': './src/hooks/useBet.js',
      },
      shared: ['react', 'react-dom', 'axios']
    }),
  ],
  server: {
    port: 5176,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});