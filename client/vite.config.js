import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Practice facts live outside client/ because the server imports the same
    // module — one file to edit, and the server stays authoritative on fees.
    alias: { '@shared': path.join(repoRoot, 'shared') },
  },
  server: {
    port: 5173,
    // Keeps API calls same-origin in development, so no CORS surprises.
    proxy: { '/api': 'http://localhost:4000' },
    fs: { allow: [repoRoot] },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * React and the router go in one long-lived chunk — they change with
         * upgrades, not with content, so they stay cached across deploys.
         *
         * Framer Motion is deliberately NOT listed here. Naming it as a manual
         * chunk pulls the entire package in whole and defeats the point of
         * using LazyMotion with `m`: letting Rollup tree-shake it down to the
         * feature set actually imported.
         */
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
