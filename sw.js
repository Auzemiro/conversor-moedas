const CACHE_NAME = 'conversor-v1';
const assets = ['./', './index.html', './manifest.json'];

// Instala e faz cache dos arquivos locais
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)));
});

// Responde com o cache se estiver offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});