// =====================================================
// Service Worker - 臺南市山上區公眾通行道路圖資系統
// 版本：1.0
// 功能：讓系統可以被安裝為 PWA（桌面APP）
//       並快取靜態資源加快載入速度
// =====================================================

const CACHE_NAME = 'shanshang-road-v1';

// 需要預先快取的靜態資源
const STATIC_ASSETS = [
  './',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
];

// 安裝 Service Worker：預先快取靜態資源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 啟用：清除舊版快取
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截網路請求：優先用網路，失敗才用快取
// （確保資料永遠是最新的，快取只作備援）
self.addEventListener('fetch', function(event) {
  // Google Apps Script 的請求一律直接走網路，不快取
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 網路請求成功，順便更新快取
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // 網路失敗，改用快取
        return caches.match(event.request);
      })
  );
});
