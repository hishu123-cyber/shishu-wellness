// 食术·体质养生 - Service Worker v5
// 此文件永不使用浏览器磁盘缓存，始终请求最新版本
const CACHE_VERSION = '1781060413572';
const CACHE_NAME = 'wellness-v5-1781060413572';

// 安装时注册，立即激活
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 激活时清理所有旧版缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    return new Response('离线模式', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: '离线' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}