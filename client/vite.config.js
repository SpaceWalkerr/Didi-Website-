import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildPracticeSchema } from '../shared/schema.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..');

/**
 * Writes the schema.org JSON-LD into index.html at build (and dev) time, from
 * the same config the server reads. `<` is escaped so the JSON can never close
 * the script element early.
 */
const practiceSchema = () => ({
  name: 'practice-schema',
  transformIndexHtml(html) {
    const json = JSON.stringify(buildPracticeSchema()).replace(/</g, '\\u003c');
    return html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`);
  },
});

export default defineConfig({
  plugins: [react(), practiceSchema()],
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
         * Framer Motion is deliberately not listed: LazyMotion + `m` lets
         * Rollup tree-shake it to the features actually imported.
         */
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
