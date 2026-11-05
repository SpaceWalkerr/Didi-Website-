/*
 * Service worker — makes the site installable and keeps it usable offline.
 *
 *   · Navigations: network first, so patients always get the latest page; the
 *     cached app shell is the fallback when there is no signal.
 *   · /assets/* (fingerprinted by Vite): cache first.
 *   · /images/*: stale-while-revalidate, so a replaced photo updates.
 *     Both share one cache capped at MAX_ASSET_ENTRIES, oldest dropped first:
 *     every deploy adds new fingerprinted files, and without a cap the old
 *     ones would sit on the patient's phone until the next VERSION bump.
 *   · Google Fonts: stale-while-revalidate.
 *   · /api/* is NEVER cached here. Health information does not belong in a
 *     shared HTTP cache. "My bookings" keeps its own small offline copy on the
 *     patient's phone instead (see src/pages/Account.jsx).
 *   · Razorpay and every other third-party request pass straight through.
 */
const VERSION = 'v3';
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const FONTS = `fonts-${VERSION}`;
/** A build is ~25 files plus ~16 images: room for about three deploys. */
const MAX_ASSET_ENTRIES = 100;

/** Drops the oldest entries (Cache keys come back in insertion order). */
const trim = (cache) =>
  cache.keys().then((keys) => Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSET_ENTRIES)).map((k) => cache.delete(k))));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/favicon.svg', '/images/icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS, FONTS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .then((res) => {
            // Keep the latest shell for offline use. Routes differ only in their
            // <head> preview tags, which the app rewrites on load anyway.
            if (res.ok) {
              const copy = res.clone();
              caches.open(SHELL).then((c) => c.put('/', copy));
            }
            return res;
          })
          .catch(() => caches.match('/', { cacheName: SHELL })),
      );
      return;
    }

    // Images keep their names when replaced (a new photo of the doctor is
    // still doctor-photo.jpg), so they are refreshed in the background.
    if (url.pathname.startsWith('/images/')) {
      event.respondWith(
        caches.open(ASSETS).then((cache) =>
          cache.match(request).then((hit) => {
            const network = fetch(request)
              .then((res) => {
                if (res.ok) cache.put(request, res.clone()).then(() => trim(cache));
                return res;
              })
              .catch(() => hit);
            return hit || network;
          }),
        ),
      );
      return;
    }

    // Vite fingerprints /assets/*, so a cached copy is never stale.
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(
        caches.open(ASSETS).then((cache) =>
          cache.match(request).then(
            (hit) =>
              hit ||
              fetch(request).then((res) => {
                if (res.ok) cache.put(request, res.clone()).then(() => trim(cache));
                return res;
              }),
          ),
        ),
      );
    }
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then((cache) =>
        cache.match(request).then((hit) => {
          const network = fetch(request)
            .then((res) => {
              if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || network;
        }),
      ),
    );
  }
});
