
const CACHE_NAME = 'golf-track-apex-v6';

// Core assets to pre-cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png', // Kept for manifest/Android fallback
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/safari-pinned-tab.svg',
  '/favicon.ico',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best effort pre-cache
      return cache.addAll(PRECACHE_ASSETS).catch(err => console.warn('Pre-cache warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. External CDNs (esm.sh, fonts, tailwind): Cache First, then Network
  // This ensures libraries are available offline once loaded once.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(err => {
           // Network failed for external resource
           console.log('Offline: Could not fetch external resource', url.href);
           return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // 2. Local App Files: Network First, fallback to Cache
  // This ensures you get the latest code when online, but app works if offline.
  event.respondWith(
    fetch(event.request).then((response) => {
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseToCache);
      });
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cachedRes => {
         if (cachedRes) return cachedRes;
         // Fallback for index.html if deep linking
         if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
         }
         return null;
      });
    })
  );
});
