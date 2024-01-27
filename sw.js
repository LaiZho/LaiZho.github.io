const CACHE_NAME = 'hazymoon_sw';
const OFFLINE_URL = '/offline.html';
const OFFLINE_IMAGE = '/offline.jpg';

// 注册离线页面资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            cache.add(new Request(OFFLINE_URL, {
                cache: "reload"
            }))
            cache.add(new Request(OFFLINE_IMAGE, {
                cache: "reload"
            }))
        })
    );
});

// 如果支持，启用预加载
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        if ('navigationPreload' in self.registration) {
            await self.registration.navigationPreload.enable();
        }
    })());
    self.clients.claim();
});

self.skipWaiting();

self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith(self.location.origin) || event.request.url.match(/^https:\/\/cdn\.jsdelivr\.net/)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                const networkResponse = await fetch(event.request);
                if (networkResponse.status === 200) {
                    // 必须返回200才存储资源，防止出现错误，视频类的资源会返回206（成功但又没有完全成功）
                    await cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            } catch (error) {
                // 如果网络请求失败，返回离线页面
                let cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                } else {
                    return await cache.match(OFFLINE_URL);
                }
            }
        })());
    }
});
