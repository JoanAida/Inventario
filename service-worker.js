const CACHE_NAME = 'inventario-v1';
const ASSETS = [
  '/Inventario/',
  '/Inventario/index.html',
  '/Inventario/styles.css',
  '/Inventario/app.js',
  '/Inventario/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
