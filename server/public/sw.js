const CACHE_NAME = 'taiwan-explorer-v1';
const urlsToCache = [
  '/',
  '/app.js',
  '/manifest.json'
];

// 安裝
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// 啟動
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 有快取就用快取，沒有就發網路請求
        return response || fetch(event.request);
      })
      .catch(() => {
        // 離線時顯示離線頁面
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
