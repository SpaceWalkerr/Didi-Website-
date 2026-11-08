import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Serves the built React app from this process — used on a long-running server
 * (Render, local). On Vercel the CDN serves client/dist directly and this is
 * never mounted; see vercel.json.
 */
export function mountClient(app) {
  // In production, serve the built client from the same origin.
  const clientDist = path.join(here, '..', '..', 'client', 'dist');
  if (!fs.existsSync(clientDist)) return;

  // Vite fingerprints everything under /assets, so it can be cached forever.
  app.use(
    '/assets',
    express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }),
  );
  // dotfiles: 'ignore' also hides files inside dot-folders such as .heads,
  // which Express's default does not.
  app.use(express.static(clientDist, { dotfiles: 'ignore' }));
  // Real client routes get the app; anything else gets the same app shell but
  // a true 404, so search engines do not index junk URLs as pages.
  const CLIENT_ROUTES = /^\/(about|services|faq|book|contact|privacy|terms|refund|account|admin)?\/?$|^\/confirmation\/[^/]+\/?$/;
  const PRIVATE_ROUTES = /^\/(book|account|admin|confirmation\/.*)$/;
  // Pages with their own title and preview tags (written by the client build,
  // see page-heads in client/vite.config.js). Read once: the build is fixed for
  // the life of the process. The app is identical; only the <head> differs.
  const headsDir = path.join(clientDist, '.heads');
  const PAGE_HEADS = new Set(
    fs.existsSync(headsDir) ? fs.readdirSync(headsDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)) : [],
  );
  const shellFor = (pathname) => {
    const route = pathname.replace(/^\/|\/$/g, '');
    return PAGE_HEADS.has(route) ? path.join(headsDir, `${route}.html`) : path.join(clientDist, 'index.html');
  };
  app.get(/^(?!\/api).*/, (req, res) =>
    res
      .set(PRIVATE_ROUTES.test(req.path) ? { 'X-Robots-Tag': 'noindex, nofollow' } : {})
      .status(CLIENT_ROUTES.test(req.path) ? 200 : 404)
      // dotfiles: '.heads' is a dot-folder so express.static above never serves it.
      .sendFile(shellFor(req.path), { dotfiles: 'allow' }),
  );
}
