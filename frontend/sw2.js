// 食术·体质养生 - Service Worker v6
// 导航请求始终走网络优先，确保最新HTML
const CACHE_VERSION = '1781074900000';
const CACHE_NAME = 'wellness-v6';

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

  // API: 网络优先 + 离线降级
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 导航请求（HTML）：网络优先，确保每次加载最新页面
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 静态资源（JS/CSS/图片）：缓存优先，带版本戳的URL自动刷新
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
    return new Response('离线模式', { status: 503 });
  }
}
