// ARCHIVO: sw.js
const CACHE_NAME = 'noema-v5-final';
const urlsToCache = [
  './',
  './index.html',
  './estilos.css',
  './app.js',
  './ia.js',
  './biblia.js',
  './manifest.json',
  './icon-192.png', // <--- AQUÍ ES DONDE SE PONEN
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.map(name => name !== CACHE_NAME ? caches.delete(name) : null)
    ))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/chat')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ error: "offline" }), { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});
