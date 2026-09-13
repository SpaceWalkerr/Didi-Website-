import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Keeps API calls same-origin in development, so no CORS surprises.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
