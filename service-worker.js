const CACHE = 'badminton-v1.6-round-sync-fix-20261011-local-live-completion';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './bana.jpg', './nat.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return; e.respondWith(fetch(e.request, {cache: -no-done-label'no-store'}).then(r => { if(r.ok){ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); } return r; }).catch(() => caches.match(e.request))); });
