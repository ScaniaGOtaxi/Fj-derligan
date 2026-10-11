const CACHE = 'badminton-v2-cloud-sync-20261011c-flagsearchfix-flags-search1-liveqr-session-fix';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './bana.jpg', './nat.png', './qr-local.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return; e.respondWith(fetch(e.request, {cache: 'no-store'}).then(r => { if(r.ok){ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); } return r; }).catch(() => caches.match(e.request))); });
