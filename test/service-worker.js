const CACHE = 'badminton-test-password-logout-20261018';
const FILES = ['./', './index.html', './statistics-delete.js', './round-tips.js', './group-rename.js', './sync-v2.js', './group-players.js', './flag-visibility.js', './player-visibility.js', './player-motion.js', './shuttle-motion.js', './results-v1.js', './statistics-ui.js', './daily-pdf.js', './daily-diploma.js', './diploma-template.png', './qr-local.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './bana.jpg', './nat.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('badminton-test-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Versioned worker caches retain images; app scripts remain network-first.
    if (!url.pathname.endsWith('/diploma-template.png') && /\.(png|jpe?g|webp)$/i.test(url.pathname)) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
    }
    try {
      const response = await fetch(event.request, {cache: 'no-store'});
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(cache.put(event.request, copy));
      }
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});





