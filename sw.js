const CACHE_NAME = 'conversor-v2';

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon-192.png', // Adicione seus ícones se tiver
    './icon-512.png'
];

// 1. INSTALAÇÃO: Salva os arquivos no cache
self.addEventListener('install', (e) => {
    // skipWaiting força o novo Service Worker a assumir o controle imediatamente
    self.skipWaiting(); 
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 2. ATIVAÇÃO: O "Lixeiro". Deleta caches de versões anteriores (v1, etc)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Removendo cache antigo...', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. BUSCA (FETCH): Serve o cache se estiver offline, se não, busca na rede
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});