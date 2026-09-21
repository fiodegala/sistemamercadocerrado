import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O frontend chama /api/... e o Vite faz proxy para o backend Express (porta 3001)
// durante o desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
