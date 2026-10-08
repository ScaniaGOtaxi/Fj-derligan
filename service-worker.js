const CACHE='badminton-app-v1.4-fix15-20261009';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(
 caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
 .then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request).then(r=>{
     const copy=r.clone(); caches.open(CACHE).then(c=>c.put('./index.html',copy)); return r;
   }).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(fetch(e.request).then(r=>{
   const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
 }).catch(()=>caches.match(e.request)));
});
