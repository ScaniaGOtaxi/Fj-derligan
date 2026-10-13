const CACHE = 'badminton-app-v2-20261012';
const FILES = ['./', './index.html', './sync-v2.js', './player-motion.js', './shuttle-motion.js', './results-v1.js', './statistics-ui.js', './qr-local.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './bana.jpg', './nat.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('badminton-app-') || key.startsWith('badminton-v2.')) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith(new URL('./test/', self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Versioned worker caches retain images; app scripts remain network-first.
    if (/\.(png|jpe?g|webp)$/i.test(url.pathname)) {
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
