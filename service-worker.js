// service-worker.js
const CACHE_NAME = 'may-cache-v2';
const urlsToCache = [
    '/Mays-App/index.html',
    '/Mays-App/app.js?t=4',
    '/Mays-App/style.css',
    '/Mays-App/navbar.html',
    '/Mays-App/fallback.html' // Add a fallback page
];

// Install Service Worker and cache necessary files
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            self.skipWaiting(),
            caches.open(CACHE_NAME).then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
        ])
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Use cacheName here
                    }
                })
            );
        }).then(() => {
            // Clear local storage when cache is updated
            clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'clearLocalStorage' });
                });
            });
        })
    );
});

// Cache-then-Network strategy for fetching resources
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Allow requests to Google Drive or Googleusercontent to go directly to the network
    if (requestUrl.origin.includes("googleusercontent.com") || 
        requestUrl.origin.includes("drive.google.com")) {
        event.respondWith(fetch(event.request));
        return;
    } else {
          // Handle GET requests (cache-then-network strategy)
        if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                return cachedResponse || fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            }).catch(() => caches.match('/fallback.html')) // Fallback page
        );
    } else {
        // For non-GET requests (like POST), bypass cache
        event.respondWith(fetch(event.request));
    }
}
});
