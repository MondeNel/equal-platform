import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell_app',
      remotes: {
        // Points to the orbitbet-app container
        orbitbet_app: 'http://localhost:5173/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'axios']
    }),
  ],
});