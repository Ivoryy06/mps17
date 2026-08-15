const CACHE_NAME = 'mps-v3';
const BASE_URL = self.registration.scope;
const toScopedUrl = (path) => new URL(path, BASE_URL).href;
const OFFLINE_FALLBACK_URL = toScopedUrl('./index.html');

const STATIC_ASSETS = [
  toScopedUrl('./'),
  OFFLINE_FALLBACK_URL,
  toScopedUrl('./css/pagehome.css?v=8'),
  toScopedUrl('./css/member-shared.css'),
  toScopedUrl('./script.js'),
  toScopedUrl('./manifest.json'),
  toScopedUrl('./pictures/background.jpg?v=2')
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(error => console.error('Cache install failed:', error))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(error => console.error('Cache put failed:', error));
            
            return response;
          });
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_FALLBACK_URL);
        }
      })
  );
});
